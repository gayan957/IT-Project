import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import http from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import binRoutes from './routes/bin.routes.js';
import adminRoutes from './routes/admin.routes.js';
import scheduleRoutes from './routes/schedule.routes.js';
import testRoutes, { setBlynkPollingService as setTestBlynkService } from './routes/test.routes.js';
import pickupAgentRoutes from './routes/pickupAgent.routes.js';
import pickupPartnerRoutes from './routes/pickupPartner.routes.js';
import recyclerRoutes from './routes/recycler.routes.js';
import collectionRoutes from './routes/collection.routes.js';
import wastePriceRoutes from './routes/wastePrice.routes.js';
import warehouseWastePriceRoutes from './routes/warehouseWastePrice.routes.js';
import agentScheduleRoutes from './routes/agentSchedule.routes.js';
import salaryRoutes from './routes/salary.routes.js';
// import BlynkPollingService from './services/blynkPolling.js';
// import { setBlynkPollingService } from './controllers/bin.controller.js';

const app = express();
const server = http.createServer(app);

// Socket.IO setup with CORS
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://172.26.62.125:5173',
      process.env.CORS_ORIGIN
    ].filter(Boolean),
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, IoT devices, Postman)
    if (!origin) return callback(null, true);
    
    // Allow localhost and your development server
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://172.26.62.125:5173',
      process.env.CORS_ORIGIN
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Log the blocked origin
    console.log('CORS: Blocking origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Routes

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bins', binRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/test', testRoutes);
app.use('/api/pickup-agents', pickupAgentRoutes);
app.use('/api/pickup-partners', pickupPartnerRoutes);
app.use('/api/recyclers', recyclerRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/waste-prices', wastePriceRoutes);
app.use('/api/admin/warehouse-waste-prices', warehouseWastePriceRoutes);
app.use('/api/agent-schedules', agentScheduleRoutes);
app.use('/api/salary', salaryRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'Trash2Cash API is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Test route for IoT
app.get('/api/test', (req, res) => {
  res.json({
    message: 'IoT endpoint is accessible',
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful startup with Socket.IO and Blynk polling
const startServer = async () => {
  try {
    const PORT = process.env.PORT || 5000;
    await connectDB(process.env.MONGO_URI);

    // Initialize Blynk polling service (temporarily disabled for testing)
    // const blynkService = new BlynkPollingService(io);
    // setBlynkPollingService(blynkService);
    // setTestBlynkService(blynkService);

    // Socket.IO connection handling
    io.on('connection', (socket) => {
      console.log(`📱 Client connected: ${socket.id}`);
      
      // Send current fill level to new client (temporarily disabled)
      // const currentData = blynkService.getCurrentFillLevel();
      // socket.emit('bin:fill', {
      //   binId: currentData.binId,
      //   fill: currentData.fill,
      //   timestamp: currentData.timestamp
      // });

      socket.on('disconnect', () => {
        console.log(`📱 Client disconnected: ${socket.id}`);
      });
    });

    // Start the server
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Trash2Cash Server running on http://0.0.0.0:${PORT}`);
      console.log(`📡 Socket.IO enabled with CORS for real-time updates`);
      // console.log(`🔄 Blynk polling: https://blynk.cloud/external/api/get?token=***&v0`);
      console.log(`🌐 Frontend: http://localhost:5173`);
      // console.log(`🗃️ ESP32 Bin ID: 68b86847d6e7f54b912c1638`);
      
      // Start Blynk polling after server is running (temporarily disabled)
      //blynkService.startPolling();
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();