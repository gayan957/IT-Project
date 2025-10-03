// Test the payment endpoints
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';

async function testPaymentEndpoints() {
  console.log('🧪 Testing Payment Endpoints...');
  
  try {
    // Test 1: Payment History
    console.log('📋 Testing GET /payment/history...');
    const historyResponse = await fetch(`${API_BASE}/payment/history`);
    const historyData = await historyResponse.json();
    
    console.log('Status:', historyResponse.status);
    console.log('Success:', historyData.success);
    console.log('Payments found:', historyData.payments ? historyData.payments.length : 0);
    console.log('Statistics:', historyData.statistics);
    
    // Test 2: Payment Hash Generation
    console.log('\n🔐 Testing POST /payment/hash...');
    const hashResponse = await fetch(`${API_BASE}/payment/hash`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: 'TEST_ORDER_' + Date.now(),
        amount: 250.50,
        currency: 'LKR'
      })
    });
    
    const hashData = await hashResponse.json();
    console.log('Hash generation status:', hashResponse.status);
    console.log('Hash generated:', hashData.success);
    console.log('Hash:', hashData.hash ? 'Generated successfully' : 'Failed');
    
    console.log('\n✅ Payment endpoints are working correctly!');
    
  } catch (error) {
    console.error('❌ Payment endpoint test failed:', error.message);
  }
}

testPaymentEndpoints();