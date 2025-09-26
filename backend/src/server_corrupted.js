import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import m  try {
    const PORT = process.env.PORT || 5000;
    await connectDB(process.env.MONGO_URI);

    // Initialize Blynk polling service
    const blynkService = new BlynkPollingService(io);
    setBlynkPollingService(blynkService);

    // Socket.IO connection handling
    io.on('connection', (socket) => {
      console.log(`📱 Client connected: ${socket.id}`);
      
      // Send current fill level to new client
      const currentData = blynkService.getCurrentFillLevel();
      socket.emit('bin:fill', {
        binId: currentData.binId,
        fill: currentData.fill,
        timestamp: currentData.timestamp
      });

      socket.on('disconnect', () => {
        console.log(`📱 Client disconnected: ${socket.id}`);
      });
    });

    // Start the server
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Trash2Cash Server running on http://0.0.0.0:${PORT}`);
      console.log(`📡 Socket.IO enabled with CORS for real-time updates`);
      console.log(`🔄 Blynk polling: https://blynk.cloud/external/api/get?token=***&v0`);
      console.log(`🌐 Frontend: http://localhost:5173`);
      console.log(`🗃️ ESP32 Bin ID: 68b86847d6e7f54b912c1638`);
      
      // Start Blynk polling after server is running
      blynkService.startPolling();
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
import http from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import binRoutes from './routes/bin.routes.js';
import adminRoutes from './routes/admin.routes.js';
import scheduleRoutes from './routes/schedule.routes.js';
import BlynkPollingService from './services/blynkPolling.js';
import { setBlynkPollingService } from './controllers/bin.controller.js';

const app = express();
const server = http.createServer(app);

// Socket.IO setup with CORS
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
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
      'http://172.26.62.125:5173',
      process.env.CORS_ORIGIN
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // For other origins, still allow but warn
    console.log('CORS: Allowing origin:', origin);
    return callback(null, true);
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

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'Trash2Cash API Server',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Error handler
app.use(errorHandler);

// Graceful startup
const startServer = async () => {
  try {
    const PORT = process.env.PORT || 5000;
    await connectDB(process.env.MONGO_URI);

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Trash2Cash Server running on http://0.0.0.0:${PORT}`);
      console.log(`� Blynk webhooks: http://172.26.48.1:${PORT}/api/blynk/webhook`);
      console.log(`🌐 Frontend: http://localhost:5173`);
      console.log(`�️ ESP32 Bin ID: 68b86847d6e7f54b912c1638`);
    });


    // app.listen(PORT, () => {
    //   console.log(`🚀 Trash2Cash Server running on http://localhost:${PORT}`);
    //   console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    // });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();