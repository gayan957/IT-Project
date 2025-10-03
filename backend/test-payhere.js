import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Payment from '../models/Payment.js';
import paymentRoutes from '../routes/payment.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trash2cash');
    console.log('✅ MongoDB connected for PayHere testing');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Routes
app.use('/api/payment', paymentRoutes);

// Test endpoints
app.get('/test/payment/setup', (req, res) => {
  res.json({
    message: 'PayHere Integration Test Server',
    endpoints: [
      'POST /api/payment/hash - Generate payment hash',
      'POST /api/payment/notify - PayHere webhook',
      'GET /api/payment/history - Payment history',
      'GET /api/payment/status/:orderId - Payment status',
      'POST /test/payment/simulate - Simulate payment'
    ],
    environment: {
      merchant_id: process.env.PAYHERE_MERCHANT_ID || 'Not configured',
      webhook_url: `http://localhost:${PORT}/api/payment/notify`,
      database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    }
  });
});

// Simulate a PayHere webhook for testing
app.post('/test/payment/simulate', async (req, res) => {
  try {
    const {
      order_id = `TEST_${Date.now()}`,
      amount = 1500.00,
      status_code = '2', // Success
      customer_name = 'Test Customer',
      customer_email = 'test@example.com',
      customer_phone = '+94712345678'
    } = req.body;

    // Simulate PayHere webhook data
    const webhookData = {
      merchant_id: process.env.PAYHERE_MERCHANT_ID,
      order_id,
      payhere_id: `payhere_${Math.random().toString(36).substr(2, 9)}`,
      payhere_amount: amount,
      payhere_currency: 'LKR',
      status_code,
      method: 'VISA',
      status_message: status_code === '2' ? 'Success' : 'Failed',
      card_holder_name: customer_name,
      card_no: '************1234',
      card_expiry: '12/25',
      custom_1: JSON.stringify({
        _id: 'sample-schedule-1',
        wasteType: 'mixed',
        address: 'Test Address, Colombo',
        userName: customer_name,
        location: { lat: 6.9271, lng: 79.8612 }
      }),
      custom_2: JSON.stringify({
        actualWeight: 5.5,
        wastePrice: { pricePerKg: 25.0 }
      })
    };

    // Generate MD5 signature
    const crypto = await import('crypto');
    const merchant_secret = process.env.PAYHERE_MERCHANT_SECRET;
    const md5sig = crypto.default
      .createHash('md5')
      .update(`${webhookData.merchant_id}${webhookData.order_id}${webhookData.payhere_amount}${webhookData.payhere_currency}${webhookData.status_code}${crypto.default.createHash('md5').update(merchant_secret).digest('hex').toUpperCase()}`)
      .digest('hex')
      .toUpperCase();

    webhookData.md5sig = md5sig;

    // Send to webhook endpoint
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(`http://localhost:${PORT}/api/payment/notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookData)
    });

    const result = await response.text();

    res.json({
      success: true,
      message: 'Simulated PayHere webhook sent',
      data: {
        order_id,
        amount,
        status_code,
        webhook_response: result,
        webhook_data: webhookData
      }
    });

  } catch (error) {
    console.error('Error simulating payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to simulate payment',
      error: error.message
    });
  }
});

// Get test payment data
app.get('/test/payment/data', async (req, res) => {
  try {
    const payments = await Payment.find().sort({ created_at: -1 }).limit(10);
    
    res.json({
      success: true,
      count: payments.length,
      payments: payments.map(p => ({
        order_id: p.order_id,
        payment_id: p.payment_id,
        amount: p.amount,
        status: p.status,
        customer: p.customer,
        created_at: p.created_at
      }))
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start server
const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`🚀 PayHere Test Server running on port ${PORT}`);
    console.log(`📊 Test dashboard: http://localhost:${PORT}/test/payment/setup`);
    console.log(`🔗 Webhook URL: http://localhost:${PORT}/api/payment/notify`);
    console.log(`💳 Simulate payment: POST http://localhost:${PORT}/test/payment/simulate`);
  });
};

startServer().catch(console.error);

export default app;