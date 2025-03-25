import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from garch import run_garch_simulation
from forwardRate import get_dkk_forward_rate
from sparnordOptions import option_products, scale_option_product
from data_loader import get_stock_data

def simulate_hedging_strategy(months, exposure, num_simulations):
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
    # --- Data Collection ---
    start_date = '2018-01-01'
    end_date   = '2025-03-01'
    ticker = 'DKKUSD=X'
    # Replace yf.download with get_stock_data
    data = get_stock_data(ticker, start_date=start_date, end_date=end_date)

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
    simulated_garch_st = run_garch_simulation(data, n_sims=num_simulations, n_days=days)

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

    return {
        "simulated_garch_st": simulated_garch_st,
        "unhedged_revenue": unhedged_revenue,
        "forward_revenue": forward_revenue,
        "option_revenue": option_revenue,
        "summary_stats": summary_stats
    }
