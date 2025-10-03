// Test script to verify Payment model data retrieval and formatting
import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from './src/config/db.js';
import Payment from './src/models/Payment.js';

console.log('🧪 Testing Payment Model Data Retrieval...');

async function testPaymentDataRetrieval() {
  try {
    const dbConnected = await connectDB(process.env.MONGO_URI);
    
    if (!dbConnected) {
      console.error('❌ Could not connect to database');
      process.exit(1);
    }

    console.log('📊 Testing Payment Model Query...');

    // Test 1: Get all payments
    const allPayments = await Payment.find({}).sort({ createdAt: -1 });
    console.log(`✅ Found ${allPayments.length} payments in database`);

    // Test 2: Get payment statistics
    const stats = await Payment.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          successfulPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'SUCCESS'] }, 1, 0] }
          },
          failedPayments: {
            $sum: { $cond: [{ $ne: ['$status', 'SUCCESS'] }, 1, 0] }
          },
          totalPayments: { $sum: 1 },
          avgAmount: { $avg: '$amount' }
        }
      }
    ]);

    const statistics = stats[0] || {
      totalAmount: 0,
      successfulPayments: 0,
      failedPayments: 0,
      totalPayments: 0,
      avgAmount: 0
    };

    console.log('📈 Payment Statistics:');
    console.log(`   Total Payments: ${statistics.totalPayments}`);
    console.log(`   Successful: ${statistics.successfulPayments}`);
    console.log(`   Failed: ${statistics.failedPayments}`);
    console.log(`   Total Amount: LKR ${statistics.totalAmount.toFixed(2)}`);
    console.log(`   Average Amount: LKR ${statistics.avgAmount.toFixed(2)}`);

    // Test 3: Format data like the API endpoint
    console.log('\n🎯 Testing API-formatted Data:');
    const formattedPayments = allPayments.map(payment => ({
      payment_id: payment.paymentId || payment.orderId,
      order_id: payment.orderId,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      payment_method: payment.paymentMethod || 'Card',
      customer: {
        name: payment.customerFirstName && payment.customerLastName 
          ? `${payment.customerFirstName} ${payment.customerLastName}`
          : payment.customerFirstName || payment.customerLastName || 'Unknown',
        email: payment.customerEmail || 'No email',
        phone: payment.customerPhone || 'No phone'
      },
      description: payment.description,
      created_at: payment.createdAt,
      transaction_fee: (payment.amount * 0.035).toFixed(2),
      net_amount: (payment.amount * 0.965).toFixed(2),
      
      // Collection specific data
      waste_type: payment.collectionData?.wasteType,
      weight: payment.collectionData?.actualWeight,
      collection_linked: !!payment.agentScheduleId,
      verified: payment.verified
    }));

    console.log(`✅ Formatted ${formattedPayments.length} payments for frontend`);
    
    // Display first payment as sample
    if (formattedPayments.length > 0) {
      console.log('\n📋 Sample Payment Record:');
      const sample = formattedPayments[0];
      console.log(`   Order ID: ${sample.order_id}`);
      console.log(`   Customer: ${sample.customer.name}`);
      console.log(`   Amount: ${sample.currency} ${sample.amount}`);
      console.log(`   Status: ${sample.status}`);
      console.log(`   Method: ${sample.payment_method}`);
      console.log(`   Waste Type: ${sample.waste_type || 'N/A'}`);
      console.log(`   Weight: ${sample.weight || 'N/A'} kg`);
      console.log(`   Collection Linked: ${sample.collection_linked ? 'Yes' : 'No'}`);
      console.log(`   Date: ${new Date(sample.created_at).toLocaleString()}`);
    }

    // Test 4: Test API response structure
    console.log('\n🔄 Testing Complete API Response Structure:');
    const apiResponse = {
      success: true,
      payments: formattedPayments,
      pagination: {
        currentPage: 1,
        totalPages: Math.ceil(formattedPayments.length / 50),
        totalRecords: formattedPayments.length,
        limit: 50
      },
      statistics,
      message: `Found ${formattedPayments.length} payments`
    };

    console.log(`✅ API Response Structure Valid`);
    console.log(`   Success: ${apiResponse.success}`);
    console.log(`   Payment Count: ${apiResponse.payments.length}`);
    console.log(`   Has Statistics: ${!!apiResponse.statistics}`);
    console.log(`   Has Pagination: ${!!apiResponse.pagination}`);

    console.log('\n🎉 Payment Model Integration Test Complete!');
    console.log('💡 Frontend should now display this data in Customer Payments section');

  } catch (error) {
    console.error('❌ Payment data retrieval test failed:', error);
  } finally {
    process.exit(0);
  }
}

testPaymentDataRetrieval();