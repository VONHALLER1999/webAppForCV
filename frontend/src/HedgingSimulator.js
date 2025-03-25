import React, { useState, useEffect, useRef } from 'react';
import CombinedHistogram from './CombinedHistogram.tsx';
import { io } from 'socket.io-client';
import './components/HedgingSimulator.css';

function HedgingSimulator() {
  const [months, setMonths] = useState(6);
  const [exposure, setExposure] = useState(1000000);
  const [numSimulations, setNumSimulations] = useState(10000);
  const [jsonData, setJsonData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusMessages, setStatusMessages] = useState([]);
  const [loadingDots, setLoadingDots] = useState('');
  const [apiAvailable, setApiAvailable] = useState(true);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);  // Single socketRef declaration
  const [messageCounter, setMessageCounter] = useState(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [statusMessages]);

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

  const addStatusMessage = (text, type) => {
    setMessageCounter(prev => prev + 1);
    setStatusMessages(prev => [...prev, {
      id: `${Date.now()}-${messageCounter}`,
      text,
      type
    }]);
  };

  // Update the health check useEffect
  useEffect(() => {
    let healthCheckInterval;
    const TIMEOUT_MS = 10000;
    const HEALTH_CHECK_INTERVAL = 30000; // Check every 30 seconds
    let isChecking = false;
    
    const checkApiHealth = async () => {
      if (isChecking) return; // Prevent multiple simultaneous checks
      isChecking = true;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

        const response = await fetch('http://localhost:5001/health', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Origin': 'http://localhost:3000',
            'Cache-Control': 'no-cache'
          },
          signal: controller.signal,
          credentials: 'omit',
          mode: 'cors',
          cache: 'no-store'
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setApiAvailable(data.status === 'ok');

      } catch (error) {
        console.error('Health check failed:', error);
        setApiAvailable(false);
      } finally {
        isChecking = false;
      }
    };

    // Initial health check
    checkApiHealth();
    
    // Set up interval for subsequent checks
    healthCheckInterval = setInterval(checkApiHealth, HEALTH_CHECK_INTERVAL);

    return () => {
      if (healthCheckInterval) {
        clearInterval(healthCheckInterval);
      }
    };
  }, []);

  // Update WebSocket connection with better error handling
  useEffect(() => {
    let reconnectTimer;
    let connectionAttempts = 0;
    const MAX_ATTEMPTS = 3;
    const RECONNECT_DELAY = 5000;
    let isConnecting = false;
    
    const connectSocket = () => {
      if (isConnecting) return; // Prevent multiple simultaneous connection attempts
      isConnecting = true;
      
      console.log(`Attempting WebSocket connection (${connectionAttempts + 1}/${MAX_ATTEMPTS})...`);
        
      const newSocket = io('http://localhost:5001', {
        transports: ['websocket'],
        reconnection: false, // We'll handle reconnection manually
        timeout: 5000,
        forceNew: true
      });

      socketRef.current = newSocket;

      newSocket.on('connect', () => {
        console.log('WebSocket connected successfully');
        isConnecting = false;
        connectionAttempts = 0;
        setError(null);
        addStatusMessage('Connected to simulation server', 'success');
      });

      newSocket.on('connect_error', (error) => {
        isConnecting = false;
        connectionAttempts++;
        console.error(`Connection attempt ${connectionAttempts}/${MAX_ATTEMPTS} failed:`, error.message);
          
        if (connectionAttempts < MAX_ATTEMPTS) {
          if (reconnectTimer) clearTimeout(reconnectTimer);
          reconnectTimer = setTimeout(() => {
            connectSocket();
          }, RECONNECT_DELAY);
        } else {
          setError('Unable to connect to simulation server');
          addStatusMessage('Connection failed after all retries', 'error');
        }
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        isConnecting = false;
      });

      newSocket.on('status_update', (data) => {
        addStatusMessage(data.message, 'info');
      });
    };

    // Initial connection attempt
    connectSocket();

    // Cleanup function
    return () => {
      console.log('Cleaning up WebSocket connection...');
      isConnecting = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [addStatusMessage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setJsonData(null);
    setLoading(true);
    setStatusMessages([]); 

    if (!apiAvailable) {
      setError('Simulation server is not available. Please try again later.');
      setLoading(false);
      return;
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch('http://localhost:5001/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          months,
          exposure,
          num_simulations: numSimulations,
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Simulation failed');
      }
      
      const data = await response.json();
      setJsonData(data);
    } catch (err) {
      console.error('Simulation error:', err);
      setError(err.name === 'AbortError' 
        ? 'Simulation timed out. Please try again with fewer simulations.' 
        : 'Simulation failed. Please try again.');
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

          {/* Add status messages display */}
          {statusMessages.length > 0 && (
            <div className="status-messages">
              <h3>Simulation Progress</h3>
              <div className="messages-container">
                {statusMessages.map(msg => (
                  <div key={msg.id} className="status-message">
                    {msg.text}
                  </div>
                ))}
                <div ref={messagesEndRef} /> {/* Add this for auto-scrolling */}
              </div>
            </div>
          )}
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