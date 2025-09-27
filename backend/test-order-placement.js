import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5000';

// Test recycler credentials (you may need to adjust these)
const testRecyclerCredentials = {
  email: 'recycler@example.com', // Replace with an actual recycler email
  password: 'password123'        // Replace with actual password
};

// Test data
const testWasteWarehouseId = '507f1f77bcf86cd799439011'; // Replace with actual ID

async function testOrderPlacement() {
  try {
    console.log('🚀 Testing Order Placement API...\n');

    // Step 1: Login as recycler to get token
    console.log('Step 1: Logging in as recycler...');
    const loginResponse = await fetch(`${API_BASE_URL}/api/recyclers/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testRecyclerCredentials)
    });

    if (!loginResponse.ok) {
      console.log('❌ Login failed. Please create a test recycler account first.');
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful\n');

    // Step 2: Get available waste
    console.log('Step 2: Fetching available waste...');
    const availableWasteResponse = await fetch(`${API_BASE_URL}/api/recyclers/available-waste`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!availableWasteResponse.ok) {
      console.log('❌ Failed to fetch available waste');
      return;
    }

    const wasteData = await availableWasteResponse.json();
    console.log('✅ Available waste fetched');
    
    if (!wasteData.data || wasteData.data.length === 0) {
      console.log('⚠️  No waste available for testing');
      return;
    }

    const testWaste = wasteData.data[0]; // Use first available waste
    console.log(`📦 Using waste: ${testWaste.wasteType} - ${testWaste.totalWeight}kg\n`);

    // Step 3: Get price quote
    console.log('Step 3: Getting price quote...');
    const testWeight = Math.min(5, testWaste.totalWeight); // Test with 5kg or max available
    
    const quoteResponse = await fetch(
      `${API_BASE_URL}/api/recyclers/order-quote?wasteWarehouseId=${testWaste._id}&weight=${testWeight}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    if (!quoteResponse.ok) {
      console.log('❌ Failed to get price quote');
      return;
    }

    const quoteData = await quoteResponse.json();
    console.log('✅ Price quote received:');
    console.log(`   Weight: ${quoteData.data.weight}kg`);
    console.log(`   Waste Amount: Rs. ${quoteData.data.wasteAmount.toFixed(2)}`);
    console.log(`   Admin Tax: Rs. ${quoteData.data.adminTaxAmount.toFixed(2)}`);
    console.log(`   Total: Rs. ${quoteData.data.totalAmount.toFixed(2)}\n`);

    // Step 4: Place order
    console.log('Step 4: Placing order...');
    const orderResponse = await fetch(`${API_BASE_URL}/api/recyclers/place-order`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        wasteWarehouseId: testWaste._id,
        weight: testWeight
      })
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.json();
      console.log('❌ Failed to place order:', errorData.error);
      return;
    }

    const orderData = await orderResponse.json();
    console.log('✅ Order placed successfully!');
    console.log(`   Order ID: ${orderData.data.orderId}`);
    console.log(`   Total Amount: Rs. ${orderData.data.totalAmount.toFixed(2)}`);
    console.log('\n🎉 Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testOrderPlacement();