import Payment from '../models/Payment.js';
import mongoose from 'mongoose';

// Simple test function to create a sample payment record
export const createTestPayment = async (req, res) => {
  try {
    console.log('🧪 Creating test payment record...');
    
    const testPayment = new Payment({
      orderId: `TEST_${Date.now()}`,
      paymentId: `PAY_${Date.now()}`,
      merchantId: 'TEST_MERCHANT',
      amount: 1500.00,
      currency: 'LKR',
      status: 'success',
      statusCode: 2,
      statusMessage: 'Test payment successful',
      md5Signature: 'test_signature',
      verified: true,
      
      wasteDetails: {
        wasteType: 'plastic',
        actualWeight: 5.0,
        pricePerKg: 300.00,
        location: {
          address: '123 Test Street, Colombo',
          latitude: 6.9271,
          longitude: 79.8612
        }
      },
      
      customerDetails: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@test.com',
        phone: '+94771234567',
        address: '123 Test Street, Colombo',
        city: 'Colombo',
        country: 'Sri Lanka'
      },
      
      paymentMethod: 'card',
      completedAt: new Date(),
      rawNotificationData: { source: 'test_creation' }
    });

    await testPayment.save();
    
    console.log('✅ Test payment created successfully:', testPayment._id);
    
    res.json({
      success: true,
      message: 'Test payment created successfully',
      data: testPayment
    });
  } catch (error) {
    console.error('❌ Error creating test payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test payment',
      error: error.message
    });
  }
};

// Test function to check if Payment model works
export const testPaymentModel = async (req, res) => {
  try {
    console.log('🧪 Testing Payment model...');
    
    // Check if we can count payments
    const count = await Payment.countDocuments();
    console.log('📊 Total payments in database:', count);
    
    // Try to find any payments
    const payments = await Payment.find().limit(1);
    console.log('📊 Sample payment found:', payments.length > 0 ? 'Yes' : 'No');
    
    res.json({
      success: true,
      message: 'Payment model test completed',
      data: {
        totalPayments: count,
        samplePaymentExists: payments.length > 0,
        databaseConnected: mongoose.connection.readyState === 1
      }
    });
  } catch (error) {
    console.error('❌ Error testing Payment model:', error);
    res.status(500).json({
      success: false,
      message: 'Payment model test failed',
      error: error.message
    });
  }
};