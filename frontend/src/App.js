import React, { useState } from 'react';
import CombinedHistogram from './CombinedHistogram.tsx';

function App() {
  const [months, setMonths] = useState(6);
  const [exposure, setExposure] = useState(1000000);
  const [numSimulations, setNumSimulations] = useState(10000);
  const [jsonData, setJsonData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setJsonData(null);
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:5000/api/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          months: months,
          exposure: exposure,
          num_simulations: numSimulations,
        }),
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setJsonData(data);
    } catch (err) {
      console.error('Error fetching simulation data:', err);
      setError('Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Hedging Simulation</h1>
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '10px' }}>
          <label>
            Months:&nbsp;
            <select
              value={months}
              onChange={(e) => setMonths(parseInt(e.target.value, 10))}
            >
              <option value={3}>3</option>
              <option value={6}>6</option>
              <option value={12}>12</option>
            </select>
          </label>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>
            Exposure (USD):&nbsp;
            <input
              type="number"
              value={exposure}
              onChange={(e) => setExposure(parseFloat(e.target.value))}
              required
            />
          </label>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>
            Number of Simulations:&nbsp;
            <input
              type="number"
              value={numSimulations}
              onChange={(e) =>
                setNumSimulations(parseInt(e.target.value, 10))
              }
              required
            />
          </label>
        </div>
        <button type="submit">Run Simulation</button>
      </form>
      <div>
        <h1>Hedging Simulation Results</h1>
        {loading && <p>Loading...</p>}
        {error && <p>{error}</p>}
        {jsonData && (
          <CombinedHistogram
            width={700}
            height={400}
            unhedged={jsonData.unhedged_revenue}
            option={jsonData.option_revenue}
          />
        )}
      </div>
    </div>
  );
}

export default App;
