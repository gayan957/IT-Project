import axios from 'axios';
import Bin from '../models/Bin.js';

/**
 * Blynk Polling Service
 * Polls Blynk.io API to get ESP32 bin fill level data
 * Based on: GET https://blynk.cloud/external/api/get?token=YOUR_DEVICE_TOKEN&v0
 */

class BlynkPollingService {
  constructor(io) {
    this.io = io; // Socket.IO instance for real-time updates
    this.blynkToken = process.env.BLYNK_TOKEN || 'DFljIYafMik75Emu3d7d-QlXQhvAXl7d';
    this.devicePin = 'v0'; // Fill level pin
    this.binId = '68b86847d6e7f54b912c1638'; // Target bin ID
    this.pollInterval = 1500; // Poll every 1.5 seconds
    this.latestFillLevel = 0;
    this.isPolling = false;
    this.pollTimer = null;
  }

  /**
   * Start polling Blynk API for bin fill level data
   */
  startPolling() {
    if (this.isPolling) {
      console.log('⚠️ Blynk polling already running');
      return;
    }

    console.log(`🔄 Starting Blynk polling every ${this.pollInterval}ms`);
    console.log(`📡 Blynk URL: https://blynk.cloud/external/api/get?token=${this.blynkToken}&${this.devicePin}`);
    console.log(`🗃️ Target Bin ID: ${this.binId}`);
    
    this.isPolling = true;
    this.pollTimer = setInterval(() => {
      this.pollBlynkData();
    }, this.pollInterval);

    // Initial poll
    this.pollBlynkData();
  }

  /**
   * Stop polling Blynk API
   */
  stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    this.isPolling = false;
    console.log('🛑 Blynk polling stopped');
  }

  /**
   * Poll Blynk API for fill level data
   */
  async pollBlynkData() {
    try {
      const url = `https://blynk.cloud/external/api/get?token=${this.blynkToken}&${this.devicePin}`;
      
      const response = await axios.get(url, { 
        timeout: 5000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Trash2Cash-Backend/1.0'
        }
      });

      const fillValue = parseInt(response.data, 10);

      // Validate the received value
      if (Number.isNaN(fillValue)) {
        console.log(`⚠️ Invalid fill value received: ${response.data}`);
        return;
      }

      // Ensure value is within valid range
      const fillLevel = Math.max(0, Math.min(100, fillValue));

      // Only process if value changed
      if (fillLevel !== this.latestFillLevel) {
        console.log(`📊 Fill level changed: ${this.latestFillLevel}% → ${fillLevel}%`);
        
        this.latestFillLevel = fillLevel;

        // Update database
        await this.updateBinInDatabase(fillLevel);

        // Emit real-time update via Socket.IO
        this.emitFillLevelUpdate(fillLevel);
      }

    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        console.log('⏱️ Blynk API timeout (5s)');
      } else if (error.response?.status === 404) {
        console.log('❌ Blynk device/token not found (404)');
      } else if (error.response?.status === 401) {
        console.log('🔐 Blynk authentication failed (401)');
      } else {
        console.log(`❌ Blynk poll error: ${error.message}`);
      }
    }
  }

  /**
   * Update bin fill level in MongoDB
   */
  async updateBinInDatabase(fillLevel) {
    try {
      const status = fillLevel >= 90 ? 'full' : fillLevel >= 70 ? 'almost-full' : 'normal';
      
      const updatedBin = await Bin.findByIdAndUpdate(
        this.binId,
        {
          $set: {
            fillLevel: fillLevel,
            lastUpdated: new Date(),
            status: status
          }
        },
        { new: true }
      );

      if (updatedBin) {
        console.log(`✅ Database updated: Bin ${this.binId} → ${fillLevel}% (${status})`);
      } else {
        console.log(`❌ Bin not found in database: ${this.binId}`);
      }

    } catch (error) {
      console.error('❌ Database update error:', error.message);
    }
  }

  /**
   * Emit real-time fill level update via Socket.IO
   */
  emitFillLevelUpdate(fillLevel) {
    const updateData = {
      binId: this.binId,
      fill: fillLevel,
      timestamp: Date.now(),
      status: fillLevel >= 90 ? 'full' : fillLevel >= 70 ? 'almost-full' : 'normal'
    };

    // Emit to all connected clients
    this.io.emit('bin:fill', updateData);
    console.log(`📡 Socket.IO emitted: bin:fill → ${fillLevel}%`);
  }

  /**
   * Get current fill level for API endpoint
   */
  getCurrentFillLevel() {
    return {
      binId: this.binId,
      fill: this.latestFillLevel,
      timestamp: Date.now(),
      isPolling: this.isPolling
    };
  }

  /**
   * Get polling status and statistics
   */
  getStatus() {
    return {
      isPolling: this.isPolling,
      pollInterval: this.pollInterval,
      latestFillLevel: this.latestFillLevel,
      blynkToken: this.blynkToken ? `${this.blynkToken.slice(0, 8)}...` : 'Not set',
      devicePin: this.devicePin,
      binId: this.binId
    };
  }
}

export default BlynkPollingService;