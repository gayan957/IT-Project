import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from './src/config/db.js';
import Payment from './src/models/Payment.js';

console.log('💳 Creating Additional Real Payment Records...');

async function createMorePayments() {
  try {
    const dbConnected = await connectDB(process.env.MONGO_URI);
    
    if (!dbConnected) {
      console.error('❌ Could not connect to database');
      process.exit(1);
    }

    // Additional realistic payment data
    const newPayments = [
      {
        orderId: 'REAL_PAY_001',
        paymentId: 'payhere_live_abc123',
        merchantId: process.env.PAYHERE_MERCHANT_ID || '1222884',
        amount: 425.00,
        currency: 'LKR',
        status: 'SUCCESS',
        statusCode: '2',
        customerFirstName: 'Emma',
        customerLastName: 'Wilson',
        customerEmail: 'emma.wilson@gmail.com',
        customerPhone: '+94771234567',
        customerAddress: '15 Lake Road, Kandy',
        paymentMethod: 'VISA',
        collectionData: {
          wasteType: 'electronic',
          actualWeight: 8.5,
          pricePerKg: 50.00,
          notes: 'Old laptops and mobile phones for e-waste recycling'
        },
        verified: true,
        description: 'Waste Collection Payment - Electronic Waste Disposal'
      },
      {
        orderId: 'REAL_PAY_002',
        paymentId: 'payhere_live_def456',
        merchantId: process.env.PAYHERE_MERCHANT_ID || '1222884',
        amount: 195.50,
        currency: 'LKR',
        status: 'SUCCESS',
        statusCode: '2',
        customerFirstName: 'Rajesh',
        customerLastName: 'Kumar',
        customerEmail: 'rajesh.kumar@email.lk',
        customerPhone: '+94712345678',
        customerAddress: '78 Galle Road, Colombo 03',
        paymentMethod: 'MASTERCARD',
        collectionData: {
          wasteType: 'organic',
          actualWeight: 6.5,
          pricePerKg: 30.00,
          notes: 'Kitchen waste and garden clippings for composting'
        },
        verified: true,
        description: 'Waste Collection Payment - Organic Waste Composting'
      },
      {
        orderId: 'REAL_PAY_003',
        paymentId: 'payhere_live_ghi789',
        merchantId: process.env.PAYHERE_MERCHANT_ID || '1222884',
        amount: 310.25,
        currency: 'LKR',
        status: 'SUCCESS',
        statusCode: '2',
        customerFirstName: 'Priya',
        customerLastName: 'Fernando',
        customerEmail: 'priya.fernando@office.com',
        customerPhone: '+94723456789',
        customerAddress: '42 Peradeniya Road, Kandy',
        paymentMethod: 'VISA',
        collectionData: {
          wasteType: 'paper',
          actualWeight: 12.5,
          pricePerKg: 24.82,
          notes: 'Office paper waste and cardboard boxes'
        },
        verified: true,
        description: 'Waste Collection Payment - Paper Waste Recycling'
      },
      {
        orderId: 'REAL_PAY_004',
        paymentId: 'payhere_live_jkl012',
        merchantId: process.env.PAYHERE_MERCHANT_ID || '1222884',
        amount: 85.00,
        currency: 'LKR',
        status: 'PENDING',
        statusCode: '0',
        customerFirstName: 'Amal',
        customerLastName: 'Silva',
        customerEmail: 'amal.silva@home.lk',
        customerPhone: '+94734567890',
        customerAddress: '99 Temple Road, Mount Lavinia',
        paymentMethod: 'BANK_TRANSFER',
        verified: false,
        description: 'Waste Collection Payment - Pending Bank Transfer'
      },
      {
        orderId: 'REAL_PAY_005',
        paymentId: 'payhere_live_mno345',
        merchantId: process.env.PAYHERE_MERCHANT_ID || '1222884',
        amount: 540.75,
        currency: 'LKR',
        status: 'SUCCESS',
        statusCode: '2',
        customerFirstName: 'Nisha',
        customerLastName: 'Perera',
        customerEmail: 'nisha.perera@business.com',
        customerPhone: '+94756789012',
        customerAddress: '123 Business Park, Colombo 07',
        paymentMethod: 'AMEX',
        collectionData: {
          wasteType: 'mixed',
          actualWeight: 18.0,
          pricePerKg: 30.04,
          notes: 'Large mixed waste collection from office building'
        },
        verified: true,
        description: 'Waste Collection Payment - Commercial Mixed Waste'
      },
      {
        orderId: 'REAL_PAY_006',
        paymentId: 'payhere_live_pqr678',
        merchantId: process.env.PAYHERE_MERCHANT_ID || '1222884',
        amount: 67.50,
        currency: 'LKR',
        status: 'FAILED',
        statusCode: '-2',
        customerFirstName: 'Chaminda',
        customerLastName: 'Jayasinghe',
        customerEmail: 'chaminda.j@email.com',
        customerPhone: '+94767890123',
        customerAddress: '56 Hill Street, Nuwara Eliya',
        paymentMethod: 'VISA',
        verified: false,
        description: 'Waste Collection Payment - Transaction Failed'
      }
    ];

    console.log(`💾 Creating ${newPayments.length} additional payment records...`);

    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < newPayments.length; i++) {
      const paymentData = newPayments[i];
      
      // Set realistic creation dates (last 2 weeks)
      const daysAgo = Math.floor(Math.random() * 14); // Random date within last 14 days
      const hoursAgo = Math.floor(Math.random() * 24);
      const minutesAgo = Math.floor(Math.random() * 60);
      
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);
      createdAt.setHours(createdAt.getHours() - hoursAgo);
      createdAt.setMinutes(createdAt.getMinutes() - minutesAgo);

      try {
        const payment = new Payment({
          ...paymentData,
          createdAt,
          updatedAt: createdAt
        });

        const savedPayment = await payment.save();
        console.log(`✅ Created: ${savedPayment.orderId} - ${savedPayment.customerFullName} - ${savedPayment.formatAmount()} - ${savedPayment.status}`);
        successCount++;
      } catch (error) {
        console.log(`❌ Failed to create ${paymentData.orderId}: ${error.message}`);
        failedCount++;
      }
    }

    // Display updated summary
    console.log('\n📊 Updated Payment Database Summary:');
    console.log('=====================================');
    
    const totalPayments = await Payment.countDocuments();
    const successfulPayments = await Payment.countDocuments({ status: 'SUCCESS' });
    const pendingPayments = await Payment.countDocuments({ status: 'PENDING' });
    const failedPayments = await Payment.countDocuments({ status: { $in: ['FAILED', 'CANCELLED'] } });
    
    const totalAmountResult = await Payment.aggregate([
      { $match: { status: 'SUCCESS' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const totalAmount = totalAmountResult[0]?.total || 0;
    const avgAmount = successfulPayments > 0 ? totalAmount / successfulPayments : 0;

    console.log(`📈 Total Payments: ${totalPayments}`);
    console.log(`✅ Successful: ${successfulPayments}`);
    console.log(`⏳ Pending: ${pendingPayments}`);
    console.log(`❌ Failed: ${failedPayments}`);
    console.log(`💰 Total Amount: LKR ${totalAmount.toFixed(2)}`);
    console.log(`📊 Average Amount: LKR ${avgAmount.toFixed(2)}`);
    
    console.log(`\n🎯 Session Results:`);
    console.log(`   ✅ Successfully created: ${successCount} payments`);
    console.log(`   ❌ Failed to create: ${failedCount} payments`);

    console.log('\n🔄 Next Steps:');
    console.log('1. 🌐 Refresh Customer Payments page: http://localhost:5173/admin/finance/customer-payments');
    console.log('2. 📊 Check updated statistics in Finance Dashboard');
    console.log('3. 🔍 Test search and filtering with new data');
    console.log('4. 📱 Process real PayHere payments through waste collection form');

  } catch (error) {
    console.error('❌ Error creating additional payments:', error);
  } finally {
    process.exit(0);
  }
}

createMorePayments();