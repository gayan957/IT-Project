import fetch from 'node-fetch';

// Test the warehouse endpoint with proper authentication
async function testWarehouseEndpoint() {
    try {
        // First, login to get auth token
        const loginResponse = await fetch('http://localhost:5000/api/pickup-partners/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'test@pickup.com',
                password: 'password123' // Using test partner credentials
            }),
        });

        const loginData = await loginResponse.json();
        
        if (!loginData.success) {
            console.log('Login failed:', loginData);
            return;
        }

        console.log('✅ Login successful for:', loginData.user?.email || 'test user');
        const token = loginData.token;
        
        // Test the warehouse endpoint with auth token
        const warehouseResponse = await fetch('http://localhost:5000/api/pickup-partners/warehouse', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        const warehouseData = await warehouseResponse.json();
        
        if (warehouseData.success) {
            console.log('✅ Warehouse endpoint working!');
            console.log('📦 Warehouse data:', {
                totalItems: warehouseData.data.wasteTypeCount,
                totalWeight: warehouseData.data.totalWeight,
                wasteTypes: warehouseData.data.warehouseData.map(item => ({
                    type: item.wasteType,
                    weight: item.totalWeight
                }))
            });
        } else {
            console.log('❌ Warehouse endpoint failed:', warehouseData);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testWarehouseEndpoint();