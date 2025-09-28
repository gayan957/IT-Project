import mongoose from 'mongoose';

// Middleware to check database connection
export const checkDatabaseConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database connection unavailable. Please try again later.',
      error: 'SERVICE_UNAVAILABLE'
    });
  }
  next();
};

// Helper function to check if database is connected
export const isDatabaseConnected = () => {
  return mongoose.connection.readyState === 1;
};