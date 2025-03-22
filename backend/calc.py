import numpy as np
import pandas as pd
import yfinance as yf
import matplotlib.pyplot as plt
from garch import run_garch_simulation
from forwardRate import get_dkk_forward_rate
from sparnordOptions import option_products, scale_option_product

# --- Step 1: Data Collection ---
start_date = '2018-01-01'
end_date   = '2023-01-01'
ticker = 'DKKUSD=X'
data = yf.download(ticker, start=start_date, end=end_date)

# Use the "Close" price and convert from USD per DKK to DKK per USD.
fx_rate = data['Close'].dropna()
fx_rate_dkk_per_usd = 1 / fx_rate

print("Data Sample (DKK per USD):")
print(fx_rate_dkk_per_usd.head())

# --- Step 2: Setup Model Parameters ---
months = 6  # Time horizon in months
exposure = 1_000_000  # USD exposure.
num_simulations = 10000  # Number of simulation paths.
T = months / 12  # Time horizon in years
days = int(round(months * (365 / 12), 0))  # Convert months to days
S0 = fx_rate_dkk_per_usd.iloc[-1].item()  # Current exchange rate in DKK per USD

# Hedging parameters (in DKK per USD)
forward_rate = get_dkk_forward_rate(maturity_months=T)

# Scale the option product to the desired notional.
desired_notional = exposure  
option_scaled = scale_option_product(option_products[6], desired_notional)
option_strike = option_scaled['strike']
premium_per_usd_in_DKK = (option_scaled['premium'] / option_scaled['notional']) * S0

# --- Step 3: Run GARCH Simulation ---
simulated_garch_st = run_garch_simulation(data, n_sims=num_simulations, n_days=days)
print(simulated_garch_st)

# --- Step 4: Calculate Hedging Strategy Outcomes ---
# 1) Unhedged scenario (no hedge)
unhedged_revenue = exposure * simulated_garch_st

# 2) Forward hedge scenario
forward_revenue = exposure * forward_rate["forward_rate"]

# 3) Option hedge scenario (full hedge)
option_revenue = (
    exposure * simulated_garch_st +
    np.maximum(option_strike - simulated_garch_st, 0) * exposure -
    premium_per_usd_in_DKK
)

# --- Step 5: Analyze and Plot the Results ---
print("\nSummary Statistics (in DKK):")
print("Unhedged Revenue: Mean = {:.2f}, Std = {:.2f}".format(
    np.mean(unhedged_revenue), np.std(unhedged_revenue)))
print("Forward Hedge Revenue: Mean = {:.2f}".format(forward_revenue))
print("Option Hedge Revenue: Mean = {:.2f}, Std = {:.2f}".format(
    np.mean(option_revenue), np.std(option_revenue)))

plt.figure(figsize=(10, 6))
plt.hist(unhedged_revenue, bins=50, alpha=0.5, label='Unhedged Revenue')
plt.hist(option_revenue, bins=50, alpha=0.5, label='Option Hedge Revenue')
plt.axvline(forward_revenue, color='red', linestyle='dashed',
            linewidth=2, label='Forward Hedge Revenue')
plt.xlabel('Revenue in DKK')
plt.ylabel('Frequency')
plt.title('Monte Carlo Simulation of Hedging Strategies')
plt.legend()
plt.grid(True)
plt.show()
