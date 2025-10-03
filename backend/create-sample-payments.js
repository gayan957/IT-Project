import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from './src/config/db.js';
import Payment from './src/models/Payment.js';
import AgentSchedule from './src/models/AgentSchedule.js';

console.log('💾 Creating sample payment records for testing...');

async function createSamplePayments() {
  try {
    const dbConnected = await connectDB(process.env.MONGO_URI);
    
    if (!dbConnected) {
      console.error('❌ Could not connect to database');
      process.exit(1);
    }

    // Clear existing test payments
    await Payment.deleteMany({ orderId: { $regex: /^TEST_SAMPLE_/ } });
    console.log('🧹 Cleared existing test payments');

    // Sample payment data
    const samplePayments = [
      {
        orderId: 'TEST_SAMPLE_001',
        paymentId: 'payhere_abc123def456',
        merchantId: process.env.PAYHERE_MERCHANT_ID || '1222884',
        amount: 275.50,
        currency: 'LKR',
        status: 'SUCCESS',
        statusCode: '2',
        customerFirstName: 'John',
        customerLastName: 'Doe',
        customerEmail: 'john.doe@email.com',
        customerPhone: '+94712345678',
        customerAddress: '123 Main Street, Colombo',
        paymentMethod: 'VISA',
        collectionData: {
          wasteType: 'mixed',
          actualWeight: 5.5,
          pricePerKg: 50.00,
          notes: 'Regular household waste collection'
        },
        verified: true,
        description: 'Waste Collection Payment - Mixed Waste'
      },
      {
        orderId: 'TEST_SAMPLE_002',
        paymentId: 'payhere_xyz789ghi012',
        merchantId: process.env.PAYHERE_MERCHANT_ID || '1222884',
        amount: 180.00,
        currency: 'LKR',
        status: 'SUCCESS',
        statusCode: '2',
        customerFirstName: 'Jane',
        customerLastName: 'Smith',
        customerEmail: 'jane.smith@email.com',
        customerPhone: '+94723456789',
        customerAddress: '456 Oak Avenue, Kandy',
        paymentMethod: 'MASTERCARD',
        collectionData: {
          wasteType: 'plastic',
          actualWeight: 3.6,
          pricePerKg: 50.00,
          notes: 'Plastic waste recycling collection'
        },
        verified: true,
        description: 'Waste Collection Payment - Plastic Waste'
      },
      {
        orderId: 'TEST_SAMPLE_003',
        paymentId: 'payhere_mno345pqr678',
        merchantId: process.env.PAYHERE_MERCHANT_ID || '1222884',
        amount: 450.75,
        currency: 'LKR',
        status: 'SUCCESS',
        statusCode: '2',
        customerFirstName: 'Mike',
        customerLastName: 'Johnson',
        customerEmail: 'mike.johnson@email.com',
        customerPhone: '+94734567890',
        customerAddress: '789 Pine Road, Galle',
        paymentMethod: 'VISA',
        collectionData: {
          wasteType: 'electronic',
          actualWeight: 10.25,
          pricePerKg: 44.00,
          notes: 'Electronic waste disposal - old computers and phones'
        },
        verified: true,
        description: 'Waste Collection Payment - Electronic Waste'
      },
      {
        orderId: 'TEST_SAMPLE_004',
        paymentId: 'payhere_stu901vwx234',
        merchantId: process.env.PAYHERE_MERCHANT_ID || '1222884',
        amount: 95.00,
        currency: 'LKR',
        status: 'FAILED',
        statusCode: '-2',
        customerFirstName: 'Sarah',
        customerLastName: 'Wilson',
        customerEmail: 'sarah.wilson@email.com',
        customerPhone: '+94745678901',
        customerAddress: '321 Elm Street, Matara',
        paymentMethod: 'AMEX',
        verified: false,
        description: 'Waste Collection Payment - Failed Transaction'
      },
      {
        orderId: 'TEST_SAMPLE_005',
        paymentId: 'payhere_bcd567efg890',
        merchantId: process.env.PAYHERE_MERCHANT_ID || '1222884',
        amount: 320.25,
        currency: 'LKR',
        status: 'SUCCESS',
        statusCode: '2',
        customerFirstName: 'David',
        customerLastName: 'Brown',
        customerEmail: 'david.brown@email.com',
        customerPhone: '+94756789012',
        customerAddress: '654 Maple Lane, Negombo',
        paymentMethod: 'MASTERCARD',
        collectionData: {
          wasteType: 'organic',
          actualWeight: 8.5,
          pricePerKg: 37.68,
          notes: 'Organic waste composting collection'
        },
        verified: true,
        description: 'Waste Collection Payment - Organic Waste'
      }
    ];

    console.log(`💾 Creating ${samplePayments.length} sample payment records...`);

    // Create payment records with different creation dates
    for (let i = 0; i < samplePayments.length; i++) {
      const paymentData = samplePayments[i];
      
      // Set different creation dates for realistic timeline
      const daysAgo = Math.floor(Math.random() * 30); // Random date within last 30 days
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);
      createdAt.setHours(Math.floor(Math.random() * 24));
      createdAt.setMinutes(Math.floor(Math.random() * 60));

      const payment = new Payment({
        ...paymentData,
        createdAt,
        updatedAt: createdAt
      });

      const savedPayment = await payment.save();
      console.log(`✅ Created payment ${i + 1}: ${savedPayment.orderId} - ${savedPayment.status} - ${savedPayment.formatAmount()}`);
    }

    // Display summary
    const totalPayments = await Payment.countDocuments();
    const successfulPayments = await Payment.countDocuments({ status: 'SUCCESS' });
    const totalAmount = await Payment.aggregate([
      { $match: { status: 'SUCCESS' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    console.log('\n📊 Payment Database Summary:');
    console.log(`Total Payments: ${totalPayments}`);
    console.log(`Successful Payments: ${successfulPayments}`);
    console.log(`Total Amount: LKR ${totalAmount[0]?.total || 0}`);
    console.log('\n✅ Sample payment data created successfully!');
    console.log('🔄 Refresh the Customer Payments page to see the data');

  } catch (error) {
    console.error('❌ Error creating sample payments:', error);
  } finally {
    process.exit(0);
  }
}

createSamplePayments();