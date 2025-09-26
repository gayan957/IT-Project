import { io } from 'socket.io-client';

/**
 * Socket.IO service for real-time communication with backend
 * Handles bin fill level updates and other real-time events
 */

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  }

  /**
   * Connect to the Socket.IO server
   */
  connect() {
    if (this.socket && this.isConnected) {
      return;
    }
    
    this.socket = io(this.serverUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupEventHandlers();
  }

  /**
   * Setup Socket.IO event handlers
   */
  setupEventHandlers() {
    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log(`✅ Socket.IO connected: ${this.socket.id}`);
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log(`❌ Socket.IO disconnected: ${reason}`);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Socket.IO reconnected after ${attemptNumber} attempts`);
    });

    // Bin fill level updates
    this.socket.on('bin:fill', (data) => {
      this.emitToListeners('bin:fill', data);
    });
  }

  /**
   * Disconnect from the Socket.IO server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('🔌 Socket.IO disconnected');
    }
  }

  /**
   * Subscribe to a specific event
   * @param {string} event - Event name
   * @param {function} callback - Callback function
   * @returns {function} Unsubscribe function
   */
  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event).add(callback);
    
    // Return unsubscribe function
    return () => {
      this.unsubscribe(event, callback);
    };
  }

  /**
   * Unsubscribe from a specific event
   * @param {string} event - Event name
   * @param {function} callback - Callback function
   */
  unsubscribe(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  /**
   * Emit event to all listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emitToListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Error in ${event} listener:`, error);
        }
      });
    }
  }

  /**
   * Send custom event to server
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('⚠️ Socket not connected, cannot emit event:', event);
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id || null,
      serverUrl: this.serverUrl,
      listenerCount: Array.from(this.listeners.values()).reduce((total, set) => total + set.size, 0)
    };
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;