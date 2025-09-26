// Test script for waste price API
const fetch = require('node-fetch');

async function testWastePriceAPI() {
  const BASE_URL = 'http://localhost:5000/api';
  
  try {
    console.log('Testing Waste Price API...');
    
    // Test GET all waste prices
    console.log('\n1. Testing GET /waste-prices');
    const response = await fetch(`${BASE_URL}/waste-prices`);
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.data && data.data.length === 0) {
      console.log('\n2. No prices found, testing initialize endpoint');
      // You would need admin token for this, but let's just test the structure
      console.log('Would need admin token to initialize prices');
    }
    
  } catch (error) {
    console.error('Error testing API:', error.message);
  }
}

testWastePriceAPI();