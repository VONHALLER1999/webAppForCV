import React, { useState } from 'react';
import HedgingSimulator from '../HedgingSimulator';
import logo from '../assets/logo.png';
import './Dashboard.css';

const API_URL = 'http://localhost:5001';

const Dashboard = () => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [simulationResults, setSimulationResults] = useState(null);
  const [months, setMonths] = useState(6);
  const [exposure, setExposure] = useState(1000000);
  const [numSimulations, setNumSimulations] = useState(10000);

  const handleSimulate = async () => {
    try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`${API_URL}/api/simulate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                months: parseFloat(months),
                exposure: parseFloat(exposure),
                num_simulations: parseInt(numSimulations)
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch data');
        }

        const data = await response.json();
        setSimulationResults(data);
    } catch (error) {
        console.error('Simulation error:', error);
        setError(error.message);
    } finally {
        setLoading(false);
    }
  };

  // Pass these states to HedgingSimulator
  const simulatorProps = {
    loading,
    error,
    simulationResults,
    months,
    setMonths,
    exposure,
    setExposure,
    numSimulations,
    setNumSimulations,
    onSimulate: handleSimulate
  };

  return (
    <div className="app-container">
      <header className="global-header">
        <div className="header-content">
          <div className="header-left">
            <img src={logo} alt="Currency Risk Management" className="header-logo" />
            <h1>Currency Risk Management</h1>
          </div>
          <div className="author-info">
            <p>Built by Vilhelm Grønbæk</p>
            <div className="social-links">
              <a href="https://www.linkedin.com/in/vilhelm-gr%C3%B8nb%C3%A6k/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
            </div>
          </div>
        </div>
      </header>

      <div className="dashboard-container">
        <div className={`simulator-panel ${isPanelOpen ? 'sidebar-open' : ''}`}>
          <HedgingSimulator {...simulatorProps} />
        </div>
        <div className={`info-panel ${isPanelOpen ? 'open' : 'closed'}`}>
          <button 
            className="toggle-panel-button"
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            aria-label={isPanelOpen ? 'Close info panel' : 'Open info panel'}
          >
            {isPanelOpen ? '→' : '←'}
          </button>
          <div className="info-panel-content">
            <section className="model-section">
              <h2>Understanding Currency Risk</h2>
              <div className="technical-card">
                <p>This application simulates currency risk management strategies for USD/DKK exposure using real market data from:</p>
                <ul>
                  <li>USD/DKK Exchange Rates: Yahoo Finance (DKKUSD=X)</li>
                  <li>USD Interest Rates: Federal Reserve Economic Data (FRED)</li>
                  <li>DKK Interest Rates: Danmarks Nationalbank</li>
                </ul>
              </div>
            </section>

            <section className="model-section">
              <h2>🎯 Hedging Strategies Explained</h2>
              
              <div className="technical-card">
                <h3>1. Unhedged Position</h3>
                <p>Pure exposure to market movements, establishing our baseline risk:</p>
                <ul>
                  <li>Exchange Rate Risk: σ = √(Σ(x - μ)² / (n-1))</li>
                  <li>Value at Risk: VaR₉₅% = μ - 1.645σ</li>
                </ul>
              </div>

              <div className="technical-card">
                <h3>2. Forward Contract Strategy</h3>
                <p>Locks in future exchange rates using interest rate parity:</p>
                <code>F = S × (1 + r_DKK)ᵗ / (1 + r_USD)ᵗ</code>
                <p>Benefits:</p>
                <ul>
                  <li>Eliminates uncertainty</li>
                  <li>No upfront premium</li>
                  <li>Perfect hedge against adverse movements</li>
                </ul>
              </div>

              <div className="technical-card">
                <h3>3. Options-Based Protection</h3>
                <p>Flexible downside protection using Black-Scholes pricing:</p>
                <code>Premium = N(d₁)S - N(d₂)Ke^(-rt)</code>
                <p>Where:</p>
                <ul>
                  <li>d₁ = (ln(S/K) + (r + σ²/2)T) / (σ√T)</li>
                  <li>d₂ = d₁ - σ√T</li>
                </ul>
                <p>Benefits:</p>
                <ul>
                  <li>Limited downside risk</li>
                  <li>Maintains upside potential</li>
                  <li>Flexible strike prices</li>
                </ul>
              </div>
            </section>

            <section className="model-section">
              <h2>🔄 Market Simulation Model</h2>
              <div className="technical-card">
                <h3>GARCH(1,1) Process</h3>
                <p>We simulate exchange rate movements using:</p>
                <code>σ²ₜ = ω + α₁ε²ₜ₋₁ + β₁σ²ₜ₋₁</code>
                <p>This captures:</p>
                <ul>
                  <li>Volatility clustering</li>
                  <li>Mean reversion</li>
                  <li>Fat-tailed distributions</li>
                </ul>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;