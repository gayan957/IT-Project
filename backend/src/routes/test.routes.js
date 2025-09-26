import express from 'express';

const router = express.Router();

/**
 * Test routes for Socket.IO and Blynk integration
 */

let blynkPollingService = null;

export const setBlynkPollingService = (service) => {
  blynkPollingService = service;
};

/**
 * Simulate fill level update for testing
 * POST /api/test/fill/:level
 */
router.post('/fill/:level', (req, res) => {
  try {
    const fillLevel = parseInt(req.params.level, 10);
    
    if (isNaN(fillLevel) || fillLevel < 0 || fillLevel > 100) {
      return res.status(400).json({
        success: false,
        message: 'Fill level must be between 0 and 100'
      });
    }

    if (!blynkPollingService) {
      return res.status(503).json({
        success: false,
        message: 'Blynk polling service not available'
      });
    }

    // Simulate a fill level update
    blynkPollingService.latestFillLevel = fillLevel;
    
    // Update database and emit Socket.IO event
    blynkPollingService.updateBinInDatabase(fillLevel);
    blynkPollingService.emitFillLevelUpdate(fillLevel);

    res.json({
      success: true,
      message: `Simulated fill level update: ${fillLevel}%`,
      data: {
        fillLevel,
        timestamp: Date.now()
      }
    });

  } catch (error) {
    console.error('❌ Test fill level error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * Get Socket.IO connection status
 * GET /api/test/socket-status
 */
router.get('/socket-status', (req, res) => {
  try {
    if (!blynkPollingService) {
      return res.status(503).json({
        success: false,
        message: 'Blynk polling service not available'
      });
    }

    res.json({
      success: true,
      data: {
        connectedClients: blynkPollingService.io.sockets.sockets.size,
        pollingStatus: blynkPollingService.getStatus(),
        serverTime: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Socket status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * Test Socket.IO broadcast
 * POST /api/test/broadcast
 */
router.post('/broadcast', (req, res) => {
  try {
    const { message } = req.body;

    if (!blynkPollingService) {
      return res.status(503).json({
        success: false,
        message: 'Blynk polling service not available'
      });
    }

    // Broadcast test message
    blynkPollingService.io.emit('test:message', {
      message: message || 'Test broadcast from server',
      timestamp: Date.now()
    });

    res.json({
      success: true,
      message: 'Broadcast sent',
      data: {
        message,
        connectedClients: blynkPollingService.io.sockets.sockets.size
      }
    });

  } catch (error) {
    console.error('❌ Broadcast error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

export default router;