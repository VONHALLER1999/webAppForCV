import numpy as np
import pandas as pd
import yfinance as yf
import matplotlib.pyplot as plt
from math import log, sqrt, exp
from scipy.stats import norm
from garch import run_garch_simulation
from forwardRate import get_dkk_forward_rate
from sparnordOptions import option_products, scale_option_product

# --- Step 1: Data Collection ---
# Download historical exchange rate data for USD/DKK.
# The ticker "DKKUSD=X" returns data in USD per DKK.
start_date = '2018-01-01'
end_date   = '2023-01-01'
ticker = 'DKKUSD=X'
data = yf.download(ticker, start=start_date, end=end_date)

# Use the "Close" price.
fx_rate = data['Close'].dropna()

# Convert from USD per DKK to DKK per USD.
# (Since 1 USD = 1 / (USD per DKK) DKK.)
fx_rate_dkk_per_usd = 1 / fx_rate

print("Data Sample (DKK per USD):")
print(fx_rate_dkk_per_usd.head())

# --- Step 2: Parameter Estimation ---
# Calculate daily log returns from the converted series.
log_returns = np.log(fx_rate_dkk_per_usd / fx_rate_dkk_per_usd.shift(1)).dropna()

# Estimate daily mean and standard deviation.
daily_mean = log_returns.mean()
daily_std  = log_returns.std()

# Annualize the parameters (assuming ~252 trading days per year).
annual_drift = daily_mean * 252
annual_vol   = daily_std * np.sqrt(252)

# Convert the resulting Series to scalars.
annual_drift = annual_drift.item() if hasattr(annual_drift, "item") else annual_drift
annual_vol   = annual_vol.item() if hasattr(annual_vol, "item") else annual_vol

print("\nEstimated Annual Drift: {:.4f}".format(annual_drift))
print("Estimated Annual Volatility: {:.4f}".format(annual_vol))


###inputs and tweaks for model
months = 6 # HARCODED for now
exposure = 1_000_000  # USD exposure.

num_simulations = 10000  # Number of simulation paths.
T = months / 12   # Time horizon in years (e.g., 6 months).
days = int(round(months * (365 / 12),0)) # months to days conversion

# Current exchange rate in DKK per USD (ensure it's a scalar).
S0 = fx_rate_dkk_per_usd.iloc[-1].item()

# Hedging parameters (in DKK per USD).
forward_rate   = get_dkk_forward_rate(maturity_months=T)        # Agreed forward rate.


# scaling option to cover whatever amount we want 
desired_notional = 1 * exposure  # e.g. 500,000 USD out of 1,000,000
option_scaled = scale_option_product(option_products[6], desired_notional)

hedged_notional = 1.0 * exposure 

option_strike  = option_scaled['strike']        # Strike price for the put option.
premium_per_usd_in_DKK = (option_scaled['premium'] / option_scaled['notional']) * S0  



##The star of the show
simulated_garch_st = run_garch_simulation(data, n_sims=num_simulations, n_days=days)
print(simulated_garch_st)

# --- Step 4: Calculate Hedging Strategy Outcomes ---
# 1) Unhedged scenario (no hedge at all)
unhedged_revenue = exposure * simulated_garch_st

# 2) Forward scenario
forward_revenue = exposure * forward_rate["forward_rate"]

# 3) Option scenario (full hedge)
option_revenue = (
    # Sell all USD at spot
    exposure * simulated_garch_st
    # plus the put payoff if S(t) < strike
    + np.maximum(option_strike - simulated_garch_st, 0) * exposure
    # minus the premium cost (converted to DKK)
    - premium_per_usd_in_DKK
)

# Plot all three on the same chart
plt.hist(unhedged_revenue, bins=50, alpha=0.5, label='Unhedged')
plt.hist(option_revenue, bins=50, alpha=0.5, label='Option Hedge')
plt.axvline(forward_revenue, color='red', linestyle='dashed', label='Forward Hedge')
...


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
# Plot a vertical line for the forward hedge (which is constant).
plt.axvline(forward_revenue, color='red', linestyle='dashed',
            linewidth=2, label='Forward Hedge Revenue')
plt.xlabel('Revenue in DKK')
plt.ylabel('Frequency')
plt.title('Monte Carlo Simulation of Hedging Strategies')
plt.legend()
plt.grid(True)
plt.show()
