import yfinance as yf
import pandas as pd
import os
from datetime import datetime, timedelta
from io import StringIO

def get_stock_data(ticker, start_date=None, end_date=None, cache_dir='data_cache'):
    """Get stock data with caching functionality."""
    os.makedirs(cache_dir, exist_ok=True)
    cache_file = os.path.join(cache_dir, f'{ticker}.csv')
    
    def read_cached():
        with open(cache_file, "r") as f:
            # Filter out lines starting with "//"
            lines = [line for line in f if not line.startswith("//")]
        # Read CSV data from the remaining lines
        df = pd.read_csv(StringIO("".join(lines)), parse_dates=['Date'])
        # Convert Close column to numeric and drop rows with invalid values
        df['Close'] = pd.to_numeric(df['Close'], errors='coerce')
        df = df.dropna(subset=['Date', 'Close'])
        return df
    
    if os.path.exists(cache_file):
        file_mod_date = datetime.fromtimestamp(os.path.getmtime(cache_file)).date()
        # Set your expiration period (here: 1 day)
        if file_mod_date >= (datetime.now().date() - timedelta(days=1)):
            cached_data = read_cached()
            if not cached_data.empty:
                print(f"Using cached data for {ticker}")
                return cached_data
    
    print(f"Downloading fresh data for {ticker}")
    stock = yf.download(ticker, start=start_date, end=end_date)
    stock = stock.reset_index()
    stock.to_csv(cache_file, index=False)
    return stock