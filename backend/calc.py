import numpy as np
import pandas as pd
import yfinance as yf
import matplotlib.pyplot as plt
from garch import run_garch_simulation
from forwardRate import get_dkk_forward_rate
from sparnordOptions import option_products, scale_option_product
from flask_socketio import SocketIO
import os
from datetime import datetime
import json
import sys
import time
sys.setrecursionlimit(10000)  # Increase recursion limit for YFinance

def emit_status(socketio, message):
    """Helper function to emit status updates within application context"""
    try:
        socketio.emit('status_update', {'message': message})
    except Exception as e:
        print(f"Error sending status update: {str(e)}")

def get_fx_data(socketio, required_start_date='2018-01-01'):
    """Get FX data from local cache or download from YFinance in chunks"""
    cache_dir = 'data_cache'
    cache_file = os.path.join(cache_dir, 'fx_data.csv')
    metadata_file = os.path.join(cache_dir, 'metadata.json')
    
    # Create cache directory if it doesn't exist
    if not os.path.exists(cache_dir):
        os.makedirs(cache_dir)
    
    # Convert string dates to datetime objects
    current_date = datetime.now()
    required_start = datetime.strptime(required_start_date, '%Y-%m-%d')
    need_download = True
    start_date = required_start_date
    
    # Check existing cache
    if os.path.exists(cache_file) and os.path.exists(metadata_file):
        try:
            with open(metadata_file, 'r') as f:
                metadata = json.load(f)
                
            # Load existing data with explicit format
            existing_data = pd.read_csv(cache_file)
            # Convert index to datetime after loading
            existing_data.index = pd.to_datetime(existing_data.index)
            
            if not existing_data.empty:
                data_start = existing_data.index.min()
                data_end = existing_data.index.max()
                
                # Check if we have all the data we need
                if data_start <= required_start and (current_date - data_end).days <= 1:
                    emit_status(socketio, 'Using cached FX data...')
                    need_download = False
                else:
                    # Only download missing data
                    if data_start <= required_start:
                        start_date = (data_end + pd.Timedelta(days=1)).strftime('%Y-%m-%d')
                        emit_status(socketio, 
                            f'Downloading missing data from {start_date} to {current_date.strftime("%Y-%m-%d")}...')
        except Exception as e:
            emit_status(socketio, f'Error reading cache: {str(e)}')
            need_download = True
    
    if need_download:
        ticker = 'DKKUSD=X'
        
        try:
            emit_status(socketio, 
                f'Downloading FX data from {start_date} to {current_date.strftime("%Y-%m-%d")}...')
            
            # Download data in 3-month chunks to avoid recursion
            chunk_size = pd.DateOffset(months=3)
            chunk_start = pd.to_datetime(start_date)
            chunk_end = current_date
            all_chunks = []
            
            while chunk_start < chunk_end:
                next_chunk = min(chunk_start + chunk_size, chunk_end)
                emit_status(socketio, 
                    f'Downloading chunk {chunk_start.strftime("%Y-%m-%d")} to {next_chunk.strftime("%Y-%m-%d")}...')
                
                for attempt in range(3):  # Try each chunk up to 3 times
                    try:
                        chunk_data = yf.download(
                            ticker,
                            start=chunk_start.strftime('%Y-%m-%d'),
                            end=next_chunk.strftime('%Y-%m-%d'),
                            progress=False,
                            auto_adjust=True
                        )
                        if not chunk_data.empty:
                            all_chunks.append(chunk_data)
                            break
                    except Exception as e:
                        if attempt < 2:  # If not last attempt
                            time.sleep(10)  # Wait 10 seconds before retry
                            continue
                        else:
                            emit_status(socketio, 
                                f'Failed to download chunk {chunk_start.strftime("%Y-%m-%d")}')
                
                chunk_start = next_chunk
            
            if all_chunks:
                new_data = pd.concat(all_chunks)
                new_data = new_data[~new_data.index.duplicated(keep='last')]
                new_data.sort_index(inplace=True)
                
                if os.path.exists(cache_file):
                    # Merge with existing data
                    existing_data = pd.read_csv(cache_file, index_col=0, parse_dates=True)
                    combined_data = pd.concat([existing_data, new_data])
                    combined_data = combined_data[~combined_data.index.duplicated(keep='last')]
                    combined_data.sort_index(inplace=True)
                    data = combined_data
                else:
                    data = new_data
                
                # Save updated data
                data.to_csv(cache_file)
                metadata = {
                    'last_update': current_date.strftime('%Y-%m-%d'),
                    'ticker': ticker,
                    'start_date': data.index.min().strftime('%Y-%m-%d'),
                    'end_date': data.index.max().strftime('%Y-%m-%d')
                }
                with open(metadata_file, 'w') as f:
                    json.dump(metadata, f)
                
                emit_status(socketio, 'FX data updated successfully')
            else:
                raise Exception('Failed to download any data')
                
        except Exception as e:
            emit_status(socketio, f'Error downloading data: {str(e)}')
            if os.path.exists(cache_file):
                emit_status(socketio, 'Using existing cached data...')
                data = pd.read_csv(cache_file, index_col=0, parse_dates=True)
            else:
                raise Exception('No cached data available and download failed')
    else:
        data = pd.read_csv(cache_file, index_col=0, parse_dates=True)

    return data

def simulate_hedging_strategy(months, exposure, num_simulations, socketio):
    """
    Simulate hedging strategies for a USD/DKK exposure using a GARCH simulation model.

    Parameters:
        months (int or float): The time horizon for the simulation in months.
        exposure (float): The USD exposure amount.
        num_simulations (int): The number of simulation paths to run.

    Returns:
        dict: A dictionary containing:
            - simulated_garch_st: Array of simulated exchange rates from the GARCH model.
            - unhedged_revenue: Revenue outcomes for the unhedged scenario.
            - forward_revenue: Revenue from the forward hedge.
            - option_revenue: Revenue outcomes for the option hedge scenario.
            - summary_stats: Summary statistics (means and standard deviations) for the scenarios.
    """
    # Send initial status
    emit_status(socketio, 'Starting simulation process...')
    
    # Calculate required start date based on historical data needed for GARCH
    required_years_of_data = 5  # Adjust based on your GARCH model requirements
    required_start_date = (datetime.now() - pd.DateOffset(years=required_years_of_data)).strftime('%Y-%m-%d')
    
    # Get FX data with specific start date
    data = get_fx_data(socketio, required_start_date)
    
    # Use the "Close" price and convert from USD per DKK to DKK per USD.
    fx_rate = data['Close'].dropna()
    fx_rate_dkk_per_usd = 1 / fx_rate
    S0 = fx_rate_dkk_per_usd.iloc[-1].item()  # Current exchange rate in DKK per USD

    # --- Setup Model Parameters ---
    T = months / 12   # Time horizon in years
    days = int(round(months * (365 / 12), 0))  # Convert months to days
    
    # Forward hedge parameters (in DKK per USD).
    forward_rate = get_dkk_forward_rate(maturity_months=T)
    
    # Scale the option product to the desired notional.
    desired_notional = exposure  
    option_scaled = scale_option_product(option_products[6], desired_notional)
    option_strike = option_scaled['strike']
    premium_per_usd_in_DKK = (option_scaled['premium'] / option_scaled['notional']) * S0

    # --- Run GARCH Simulation ---
    emit_status(socketio, 'Starting GARCH simulations...')
    
    # Initialize array for storing simulation results
    simulated_garch_st = np.zeros(num_simulations)
    
    # Run simulations in batches of 100
    batch_size = 100
    for i in range(0, num_simulations, batch_size):
        batch_results = run_garch_simulation(data, n_sims=batch_size, n_days=days)
        simulated_garch_st[i:i+batch_size] = batch_results
        
        # Calculate and send progress update
        progress = min((i + batch_size) / num_simulations * 100, 100)
        emit_status(socketio, f'Completed {i + batch_size}/{num_simulations} simulations ({progress:.1f}%)')

    emit_status(socketio, 'Calculating hedging strategies...')
    
    # --- Calculate Hedging Strategy Outcomes ---
    # Unhedged scenario: No hedge applied.
    unhedged_revenue = exposure * simulated_garch_st

    # Forward hedge scenario: Revenue based on the forward rate.
    forward_revenue = exposure * forward_rate["forward_rate"]

    # Option hedge scenario: Revenue from selling USD at the simulated spot plus put payoff minus premium.
    option_revenue = (
        exposure * simulated_garch_st +
        np.maximum(option_strike - simulated_garch_st, 0) * exposure -
        premium_per_usd_in_DKK
    )

    # --- Summary Statistics ---
    summary_stats = {
        'unhedged': {
            'mean': np.mean(unhedged_revenue), 
            'std': np.std(unhedged_revenue),
            'median': np.median(unhedged_revenue),
            'var_95': np.percentile(unhedged_revenue, 5),  # 95% VaR
            'min': np.min(unhedged_revenue),
            'max': np.max(unhedged_revenue)
        },
        'forward': {
            'revenue': forward_revenue
        },
        'option': {
            'mean': np.mean(option_revenue), 
            'std': np.std(option_revenue),
            'median': np.median(option_revenue),
            'var_95': np.percentile(option_revenue, 5),  # 95% VaR
            'min': np.min(option_revenue),
            'max': np.max(option_revenue)
        }
    }

    emit_status(socketio, 'Simulation complete! Processing results...')
    
    return {
        "simulated_garch_st": simulated_garch_st,
        "unhedged_revenue": unhedged_revenue,
        "forward_revenue": forward_revenue,
        "option_revenue": option_revenue,
        "summary_stats": summary_stats
    }
