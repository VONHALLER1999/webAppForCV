import React from 'react';
import './App.css';
import Dashboard from './components/Dashboard.jsx';
import StatusUpdates from './components/StatusUpdates';

function App() {
  return (
    <div className="App">
      <StatusUpdates />
      <Dashboard />
    </div>
  );
}

export default App;