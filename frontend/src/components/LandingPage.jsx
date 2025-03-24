import React from 'react';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-container">
      <h1 className="main-title">Understanding Currency Risk Management</h1>
      
      <div className="intro-section">
        <p>
          Our application helps businesses protect against currency fluctuations in the USD/DKK exchange rate 
          through three key strategies.
        </p>
      </div>

      <div className="strategy-section">
        <h2>🎯 What We Simulate</h2>
        <div className="strategy-cards">
          <div className="strategy-card">
            <h3>Unhedged Position</h3>
            <ul>
              <li>Pure exposure to market movements</li>
              <li>Shows baseline risk scenario</li>
            </ul>
          </div>
          
          <div className="strategy-card">
            <h3>Forward Contract Hedge</h3>
            <ul>
              <li>Locks in future exchange rates</li>
              <li>Eliminates uncertainty but also potential gains</li>
            </ul>
          </div>
          
          <div className="strategy-card">
            <h3>Options-Based Strategy</h3>
            <ul>
              <li>Provides downside protection</li>
              <li>Maintains upside potential</li>
              <li>Requires premium payment</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="process-section">
        <h2>📊 How It Works</h2>
        <ol>
          <li>
            <strong>We gather real-time market data:</strong>
            <ul>
              <li>Current USD/DKK exchange rates</li>
              <li>Interest rates from both countries</li>
              <li>Historical volatility patterns</li>
            </ul>
          </li>
          <li>
            <strong>Using advanced GARCH models, we simulate thousands of potential exchange rate scenarios</strong>
          </li>
          <li>
            <strong>For each strategy, we calculate:</strong>
            <ul>
              <li>Expected returns</li>
              <li>Risk metrics (VaR, standard deviation)</li>
              <li>Best and worst-case scenarios</li>
            </ul>
          </li>
        </ol>
      </div>

      <div className="benefits-section">
        <h2>💡 Why It Matters</h2>
        <p>This tool helps financial decision-makers:</p>
        <ul>
          <li>Visualize different hedging outcomes</li>
          <li>Compare risk-return tradeoffs</li>
          <li>Make informed decisions about currency risk management</li>
        </ul>
        <p className="conclusion">
          Our simulator provides practical insights for treasury managers and financial officers 
          looking to protect their international business operations.
        </p>
      </div>
    </div>
  );
};

export default LandingPage;