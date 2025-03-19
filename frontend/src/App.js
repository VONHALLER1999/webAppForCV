import React, { useState } from 'react';

function App() {
  const [ticker, setTicker] = useState('');
  const [stockData, setStockData] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setStockData(null);
    try {
      const response = await fetch('http://127.0.0.1:5000/api/fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ticker })
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setStockData(data);
    } catch (err) {
      console.error('Error fetching stock data:', err);
      setError('Failed to fetch data. Please try again.');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Stock Data Fetcher</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Enter Stock Ticker Symbol:&nbsp;
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            placeholder="e.g., AAPL"
            required
          />
        </label>
        <button type="submit" style={{ marginLeft: '10px' }}>Fetch Data</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {stockData && (
        <div>
          <h2>Stock Data for {ticker.toUpperCase()}</h2>
          <pre style={{ background: '#f4f4f4', padding: '10px' }}>
            {JSON.stringify(stockData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default App;
