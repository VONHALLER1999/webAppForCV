import React, { useState, useEffect } from 'react';
import CombinedHistogram from './CombinedHistogram.tsx';
import './components/HedgingSimulator.css';

function HedgingSimulator() {
  const [months, setMonths] = useState(6);
  const [exposure, setExposure] = useState(1000000);
  const [numSimulations, setNumSimulations] = useState(10000);
  const [jsonData, setJsonData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingDots, setLoadingDots] = useState('');

  // Add loading dots animation
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingDots(dots => dots.length >= 3 ? '' : dots + '.');
      }, 500);
      return () => clearInterval(interval);
    } else {
      setLoadingDots('');
    }
  }, [loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setJsonData(null);
    setLoading(true);
    try {
      const response = await fetch('/api/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ months, exposure, num_simulations: numSimulations }),
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

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const renderSummaryStats = () => {
    if (!jsonData?.summary_stats) return null;
    const stats = jsonData.summary_stats;

    return (
      <div className="summary-stats">
        <div className="stats-technical">
          <h3>Summary Statistics</h3>
          <div className="stats-grid">
            <div className="stat-column">
              <h4>Unhedged Position</h4>
              <p><span>Mean:</span> <span>{formatCurrency(stats.unhedged.mean)}</span></p>
              <p><span>Std Dev:</span> <span>{formatCurrency(stats.unhedged.std)}</span></p>
              <p><span>95% VaR:</span> <span>{formatCurrency(stats.unhedged.var_95)}</span></p>
              <p><span>Min:</span> <span>{formatCurrency(stats.unhedged.min)}</span></p>
              <p><span>Max:</span> <span>{formatCurrency(stats.unhedged.max)}</span></p>
            </div>
            <div className="stat-column">
              <h4>Option Strategy</h4>
              <p><span>Mean:</span> <span>{formatCurrency(stats.option.mean)}</span></p>
              <p><span>Std Dev:</span> <span>{formatCurrency(stats.option.std)}</span></p>
              <p><span>95% VaR:</span> <span>{formatCurrency(stats.option.var_95)}</span></p>
              <p><span>Min:</span> <span>{formatCurrency(stats.option.min)}</span></p>
              <p><span>Max:</span> <span>{formatCurrency(stats.option.max)}</span></p>
            </div>
            <div className="stat-column">
              <h4>Forward Contract</h4>
              <p><span>Fixed Revenue:</span> <span>{formatCurrency(stats.forward.revenue)}</span></p>
            </div>
          </div>
        </div>
        <div className="stats-narrative">
          <h3>Key Insights</h3>
          <ul>
            <li>The unhedged position could result in revenue between {formatCurrency(stats.unhedged.min)} and {formatCurrency(stats.unhedged.max)}</li>
            <li>With 95% confidence, the unhedged revenue won't fall below {formatCurrency(stats.unhedged.var_95)}</li>
            <li>The option strategy provides downside protection while maintaining upside potential, with revenues ranging from {formatCurrency(stats.option.min)} to {formatCurrency(stats.option.max)}</li>
            <li>A forward contract would lock in revenue at {formatCurrency(stats.forward.revenue)}</li>
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="simulator-content">
      <div className="simulator-layout">
        <div className="configuration-panel">
          <h2 className="simulator-title">Configure Simulation</h2>
          <form onSubmit={handleSubmit} className="simulator-form">
            <div className="form-group">
              <label>
                Time Horizon
                <select
                  value={months}
                  onChange={(e) => setMonths(parseInt(e.target.value, 10))}
                  className="form-control"
                >
                  <option value={3}>3 Months</option>
                  <option value={6}>6 Months</option>
                  <option value={12}>12 Months</option>
                </select>
              </label>
              <small className="input-help">
                Duration of the hedging period. Longer periods have more uncertainty.
              </small>
            </div>
            
            <div className="form-group">
              <label>
                Exposure Amount
                <input
                  type="number"
                  value={exposure}
                  onChange={(e) => setExposure(parseFloat(e.target.value))}
                  required
                  className="form-control"
                  placeholder="Enter USD amount"
                />
              </label>
              <small className="input-help">
                Amount in USD that needs to be converted to DKK in the future.
              </small>
            </div>
            
            <div className="form-group">
              <label>
                Number of Simulations
                <input
                  type="number"
                  value={numSimulations}
                  onChange={(e) => setNumSimulations(parseInt(e.target.value, 10))}
                  required
                  className="form-control"
                  placeholder="Enter simulation count"
                />
              </label>
              <small className="input-help">
                More simulations provide better statistical accuracy (recommended: 10,000).
              </small>
            </div>
            
            <button 
              type="submit" 
              className={`submit-button ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? `Running Simulation${loadingDots}` : 'Run Simulation'}
            </button>
          </form>
        </div>
        
        <div className="results-section">
          {error && <p className="error-message">{error}</p>}
          {jsonData && (
            <>
              <CombinedHistogram
                width={700}
                height={400}
                unhedged={jsonData.unhedged_revenue}
                option={jsonData.option_revenue}
              />
            </>
          )}
        </div>
      </div>
      
      {jsonData && renderSummaryStats()}
    </div>
  );
}

export default HedgingSimulator;