// Simple test script to debug JWT authentication
const API_BASE_URL = 'http://localhost:5000';

// Test with different token scenarios
async function testAuth() {
  console.log('Testing authentication scenarios...\n');
  
  // Test 1: No token
  console.log('1. Testing with no token:');
  await makeRequest(null);
  
  // Test 2: Malformed token (not JWT format)
  console.log('\n2. Testing with malformed token:');
  await makeRequest('invalid-token');
  
  // Test 3: JWT format but invalid signature
  console.log('\n3. Testing with fake JWT:');
  await makeRequest('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
}

async function makeRequest(token) {
  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/api/recyclers/order-quote?wasteWarehouseId=test&weight=10`, {
      method: 'GET',
      headers
    });
    
    const data = await response.json();
    console.log(`Status: ${response.status}, Response:`, data);
  } catch (error) {
    console.log('Error:', error.message);
  }
}

testAuth();