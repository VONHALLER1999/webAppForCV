import numpy as np
import pandas as pd
from arch import arch_model

def run_garch_simulation(
    data: pd.DataFrame,
    n_days: int = 126,
    n_sims: int = 5000,
    burn: int = 100,
    rescale_factor: float = 100.0
) -> np.ndarray:
    """
    Fits a GARCH(1,1) model to the given FX time series (DKK/USD),
    then simulates daily returns for `n_days` across `n_sims` paths.
    Finally, it returns the array of final simulated exchange rates.
    
    Parameters
    ----------
    data : pd.DataFrame
        The historical FX data from yfinance (must contain a 'Close' column).
        Assumed to be USD per DKK. We'll invert to get DKK per USD.
    n_days : int, optional
        Number of trading days to simulate (e.g. ~126 for 6 months).
    n_sims : int, optional
        Number of Monte Carlo simulation paths.
    burn : int, optional
        Number of additional "burn-in" periods for the GARCH simulation.
    rescale_factor : float, optional
        Factor by which to scale returns before fitting GARCH. 
        Typically 100 for percentage returns.

    Returns
    -------
    np.ndarray
        A 1D NumPy array of length `n_sims`, containing the final
        simulated exchange rates (DKK per USD) after `n_days`.
    """
    # 1) Extract the "Close" column and drop NaNs.
    fx_rate_usd_per_dkk = data['Close'].dropna()
    
    # 2) Convert from USD/DKK to DKK/USD.
    fx_rate_dkk_per_usd = 1.0 / fx_rate_usd_per_dkk
    
    # 3) Compute daily log returns (DKK/USD).
    log_returns = np.log(fx_rate_dkk_per_usd / fx_rate_dkk_per_usd.shift(1)).dropna()

    # 4) Rescale returns to help GARCH fitting (e.g., multiply by 100).
    scaled_returns = log_returns * rescale_factor

    # 5) Fit a GARCH(1,1) model to the scaled returns.
    model = arch_model(scaled_returns, p=1, q=1, mean='constant', vol='Garch', dist='normal')
    res = model.fit(disp='off')  # supress console output

    # 6) Simulate daily returns for `n_days` across `n_sims` paths.
    #    The 'simulate' method can do multiple draws, but we'll loop 
    #    for clarity/control. 
    simulated_daily_returns = np.empty((n_days, n_sims))
    for i in range(n_sims):
        sim = model.simulate(params=res.params, nobs=n_days, burn=burn)
        simulated_daily_returns[:, i] = sim.data.values
    
    # 7) Convert the scaled returns back to the original scale.
    simulated_daily_returns /= rescale_factor

    # 8) Accumulate daily log returns and compute final rates.
    S0 = float(fx_rate_dkk_per_usd.iloc[-1])  # last known DKK/USD rate
    cum_log_returns = simulated_daily_returns.cumsum(axis=0)
    final_rates = S0 * np.exp(cum_log_returns[-1, :])

    return final_rates
