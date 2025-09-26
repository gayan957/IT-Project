import fetch from 'node-fetch';

async function testCollectionWithAuth() {
    try {
        console.log('🧪 Testing collection endpoint with authentication...');
        
        // First, let's test login to get a valid token
        console.log('🔐 Attempting login...');
        const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'agent@test.com',
                password: 'password123',
                userType: 'pickupagent'
            })
        });
        
        console.log('📊 Login response status:', loginResponse.status);
        
        if (loginResponse.status !== 200) {
            console.log('❌ Login failed, trying to create test agent...');
            
            // Try to register a test agent first
            const registerResponse = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: 'Test Agent',
                    email: 'agent@test.com',
                    password: 'password123',
                    address: 'Test Address',
                    phoneNumber: '1234567890',
                    birthDate: '1990-01-01',
                    partnerId: '507f1f77bcf86cd799439011', // dummy ObjectId
                    userType: 'pickupagent'
                })
            });
            
            console.log('📊 Registration response status:', registerResponse.status);
            const registerData = await registerResponse.json();
            console.log('📋 Registration response:', registerData);
        }
        
        // Now let's test the collection endpoint without authentication
        console.log('🧪 Testing collection endpoint without auth...');
        const noAuthResponse = await fetch('http://localhost:5000/api/collections', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                agentId: '507f1f77bcf86cd799439011',
                binId: '507f1f77bcf86cd799439012',
                partnerId: '507f1f77bcf86cd799439013',
                wasteType: 'plastic',
                wasteWeight: 2.5,
                pricePerKg: 25,
                totalPrice: 62.5,
                fillLevelBefore: 85,
                binLocation: {
                    latitude: 6.9271,
                    longitude: 79.8612,
                    address: 'Test Location'
                }
            })
        });
        
        console.log('📊 No-auth response status:', noAuthResponse.status);
        const noAuthData = await noAuthResponse.text();
        console.log('📋 No-auth response:', noAuthData);
        
        if (noAuthResponse.status === 401) {
            console.log('✅ Authentication is working correctly - endpoint requires token');
        }
        
    } catch (error) {
        console.error('❌ Error testing:', error.message);
    }
}

testCollectionWithAuth();