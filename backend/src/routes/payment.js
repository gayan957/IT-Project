import express from 'express';
import crypto from 'crypto';

const router = express.Router();

// PayHere configuration
const PAYHERE_MERCHANT_ID = process.env.PAYHERE_MERCHANT_ID || 'your_merchant_id';
const PAYHERE_MERCHANT_SECRET = process.env.PAYHERE_MERCHANT_SECRET || 'your_merchant_secret';

// Generate PayHere hash for payment
router.post('/hash', async (req, res) => {
  try {
    const { order_id, amount, currency = 'LKR' } = req.body;

    if (!order_id || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Order ID and amount are required'
      });
    }

    // PayHere hash generation
    // Hash format: merchant_id + order_id + amount + currency + merchant_secret (uppercase)
    const hashString = `${PAYHERE_MERCHANT_ID}${order_id}${parseFloat(amount).toFixed(2)}${currency}${PAYHERE_MERCHANT_SECRET}`;
    const hash = crypto.createHash('md5').update(hashString).digest('hex').toUpperCase();

    res.json({
      success: true,
      hash: hash,
      order_id,
      amount: parseFloat(amount).toFixed(2),
      currency
    });

  } catch (error) {
    console.error('Error generating PayHere hash:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate payment hash'
    });
  }
});

// PayHere payment notification webhook
router.post('/notify', async (req, res) => {
  try {
    const {
      merchant_id,
      order_id,
      payment_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
      custom_1,
      custom_2
    } = req.body;

    console.log('PayHere Notification Received:', req.body);

    // Verify the hash signature
    const localMd5sig = crypto
      .createHash('md5')
      .update(
        `${merchant_id}${order_id}${payhere_amount}${payhere_currency}${status_code}${PAYHERE_MERCHANT_SECRET}`
      )
      .digest('hex')
      .toUpperCase();

    if (localMd5sig !== md5sig) {
      console.error('PayHere hash verification failed');
      return res.status(400).json({
        success: false,
        message: 'Hash verification failed'
      });
    }

    // Process the payment based on status
    const paymentStatus = status_code === '2' ? 'SUCCESS' : 
                         status_code === '0' ? 'PENDING' : 
                         status_code === '-1' ? 'CANCELLED' : 
                         status_code === '-2' ? 'FAILED' : 'UNKNOWN';

    // Here you would typically save the payment to your database
    const paymentRecord = {
      order_id,
      payment_id,
      amount: parseFloat(payhere_amount),
      currency: payhere_currency,
      status: paymentStatus,
      merchant_id,
      custom_1: custom_1 ? JSON.parse(custom_1) : null,
      custom_2: custom_2 ? JSON.parse(custom_2) : null,
      created_at: new Date().toISOString(),
      payhere_response: req.body
    };

    console.log('Payment Record:', paymentRecord);

    // TODO: Save to database
    // await Payment.create(paymentRecord);

    // If payment is successful and custom_1 contains schedule data, save collection
    if (paymentStatus === 'SUCCESS' && custom_1) {
      try {
        const scheduleData = JSON.parse(custom_1);
        const collectionData = custom_2 ? JSON.parse(custom_2) : {};
        
        // TODO: Save collection data to AgentSchedule collection
        console.log('Schedule Data:', scheduleData);
        console.log('Collection Data:', collectionData);
        
        // Example collection record structure:
        // const collectionRecord = {
        //   scheduleId: scheduleData._id,
        //   wasteType: scheduleData.wasteType,
        //   actualWeight: collectionData.actualWeight,
        //   pricePerKg: collectionData.wastePrice?.pricePerKg,
        //   totalPrice: parseFloat(payhere_amount),
        //   paymentOrderId: order_id,
        //   paymentId: payment_id,
        //   paymentStatus: 'completed',
        //   notes: `Payment successful - PayHere ID: ${payment_id}`,
        //   createdAt: new Date()
        // };
        
      } catch (parseError) {
        console.error('Error parsing custom data:', parseError);
      }
    }

    res.status(200).send('OK');

  } catch (error) {
    console.error('Error processing PayHere notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment notification'
    });
  }
});

// Get payment history (for CustomerPayments page)
router.get('/history', async (req, res) => {
  try {
    // TODO: Fetch real payment data from database
    // const payments = await Payment.find().sort({ created_at: -1 });
    
    // For now, return empty array - the frontend will use mock data
    res.json({
      success: true,
      payments: [],
      message: 'Payment history endpoint ready - connect to database'
    });

  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history'
    });
  }
});

// Get specific payment details
router.get('/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    // TODO: Fetch specific payment from database
    // const payment = await Payment.findOne({ payment_id: paymentId });
    
    res.json({
      success: true,
      payment: null,
      message: 'Payment details endpoint ready - connect to database'
    });

  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment details'
    });
  }
});

export default router;
