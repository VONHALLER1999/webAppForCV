import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const StatusUpdates = () => {
  const [messages, setMessages] = useState([]);
  const [connectionError, setConnectionError] = useState(false);
  const [socket, setSocket] = useState(null);
  
  useEffect(() => {
    const newSocket = io('http://localhost:5001', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });
    
    newSocket.on('connect', () => {
      console.log('Socket connected successfully');
      setConnectionError(false);
      setMessages(prev => [...prev, { id: Date.now(), text: 'Connected to server' }]);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnectionError(true);
      setMessages(prev => [...prev, { 
        id: Date.now(), 
        text: `Connection error: ${error.message}`,
        isError: true 
      }]);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      setMessages(prev => [...prev, { 
        id: Date.now(), 
        text: `Socket error: ${error}`,
        isError: true 
      }]);
    });

    newSocket.on('status_update', (data) => {
      console.log('Received status update:', data);
      setMessages(prev => [...prev, { id: Date.now(), text: data.message }]);
    });

    setSocket(newSocket);

    return () => {
      console.log('Cleaning up socket connection');
      newSocket.close();
    };
  }, []);

  return (
    <div className="status-updates">
      <h3>Status Updates</h3>
      {connectionError && (
        <div className="error-message">
          Connection error. Server might be offline. Check console for details.
        </div>
      )}
      <div className="updates-container">
        {messages.map(msg => (
          <div key={msg.id} className={`update-message ${msg.isError ? 'error' : ''}`}>
            {msg.text}
          </div>
        ))}
      </div>
      <style jsx>{`
        .status-updates {
          margin: 20px;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 5px;
        }
        .updates-container {
          max-height: 200px;
          overflow-y: auto;
          padding: 10px;
        }
        .update-message {
          padding: 8px;
          margin: 5px 0;
          background: #f5f5f5;
          border-radius: 3px;
        }
        .update-message.error {
          background: #fff1f1;
          color: #d32f2f;
          border-left: 4px solid #d32f2f;
        }
        .error-message {
          color: #d32f2f;
          padding: 10px;
          margin-bottom: 10px;
          background: #fff1f1;
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
};

export default StatusUpdates;