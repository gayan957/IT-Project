import { useEffect, useState, useCallback } from 'react';
import socketService from '../lib/socketService';

/**
 * React hook for Socket.IO real-time communication
 * @param {string} event - Event name to listen for
 * @param {function} onData - Callback function when data is received
 * @returns {object} Socket status and utilities
 */
export const useSocket = (event, onData) => {
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState(null);

  useEffect(() => {
    // Connect to socket when hook is used
    socketService.connect();

    // Update connection status
    const updateStatus = () => {
      const status = socketService.getStatus();
      setIsConnected(status.isConnected);
      setSocketId(status.socketId);
    };

    // Initial status update
    updateStatus();

    // Subscribe to connection status changes
    const statusInterval = setInterval(updateStatus, 1000);

    return () => {
      clearInterval(statusInterval);
    };
  }, []);

  useEffect(() => {
    if (event && onData) {
      // Subscribe to the specified event
      const unsubscribe = socketService.subscribe(event, onData);
      
      return () => {
        unsubscribe();
      };
    }
  }, [event, onData]);

  const emit = useCallback((eventName, data) => {
    socketService.emit(eventName, data);
  }, []);

  return {
    isConnected,
    socketId,
    emit,
    status: socketService.getStatus()
  };
};

/**
 * React hook specifically for bin fill level updates
 * @param {function} onFillUpdate - Callback when fill level changes
 * @returns {object} Socket status and current fill data
 */
export const useBinFillUpdates = (onFillUpdate) => {
  const [currentFillData, setCurrentFillData] = useState({
    binId: null,
    fill: 0,
    status: 'normal',
    timestamp: null
  });

  const handleFillUpdate = useCallback((data) => {
    console.log('🗃️ Bin fill update received:', data);
    setCurrentFillData({
      binId: data.binId,
      fill: data.fill,
      status: data.status || (data.fill >= 90 ? 'full' : data.fill >= 70 ? 'almost-full' : 'normal'),
      timestamp: data.timestamp
    });
    
    if (onFillUpdate) {
      onFillUpdate(data);
    }
  }, [onFillUpdate]);

  const socketStatus = useSocket('bin:fill', handleFillUpdate);

  return {
    ...socketStatus,
    fillData: currentFillData,
    isDataFresh: currentFillData.timestamp && (Date.now() - currentFillData.timestamp) < 10000 // Fresh if less than 10 seconds old
  };
};