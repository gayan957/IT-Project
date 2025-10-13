import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5000';

// Test the recycler login with the created account
const testCredentials = {
  email: 'recycler@example.com',
  password: 'password123'
};

async function testRecyclerLogin() {
  try {
    console.log('🧪 Testing Recycler Login...\n');

    // Test login
    console.log('📧 Email:', testCredentials.email);
    console.log('🔑 Password:', testCredentials.password);
    console.log('\n🚀 Attempting login...');

    const loginResponse = await fetch(`${API_BASE_URL}/api/recyclers/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testCredentials)
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login successful!');
      console.log('🎫 Token received:', loginData.token ? '✓' : '✗');
      console.log('👤 Recycler data:', {
        name: loginData.recycler.name,
        email: loginData.recycler.email,
        recyclerId: loginData.recycler.recyclerId
      });

      // Test available waste endpoint
      console.log('\n🗂️ Testing available waste endpoint...');
      const wasteResponse = await fetch(`${API_BASE_URL}/api/recyclers/available-waste`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (wasteResponse.ok) {
        const wasteData = await wasteResponse.json();
        console.log('✅ Available waste endpoint working!');
        console.log('📊 Response structure:', {
          success: wasteData.success,
          hasData: !!wasteData.data,
          hasAvailableWaste: !!wasteData.data?.availableWaste,
          isArray: Array.isArray(wasteData.data?.availableWaste),
          count: wasteData.data?.availableWaste?.length || 0
        });
      } else {
        const errorData = await wasteResponse.json();
        console.log('❌ Available waste endpoint failed:', errorData);
      }

    } else {
      const errorData = await loginResponse.json();
      console.log('❌ Login failed:', errorData);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testRecyclerLogin();