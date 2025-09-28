import fetch from 'node-fetch';

async function testPricingAPI() {
    try {
        console.log('🧪 Testing AI Forecasting pricing data API...');
        
        // Try to login as admin
        console.log('🔐 Attempting admin login...');
        const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@test.com',
                password: 'admin123',
                userType: 'admin'
            })
        });
        
        console.log('📊 Login response status:', loginResponse.status);
        
        if (loginResponse.status === 200) {
            const loginData = await loginResponse.json();
            console.log('✅ Login successful!');
            
            const token = loginData.token;
            
            // Now test the pricing data endpoint
            console.log('🔍 Testing pricing data endpoint...');
            const pricingResponse = await fetch('http://localhost:5000/api/admin/pricing-data', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            
            console.log('📊 Pricing API response status:', pricingResponse.status);
            const pricingData = await pricingResponse.json();
            console.log('📈 Pricing data:', JSON.stringify(pricingData, null, 2));
            
        } else {
            const error = await loginResponse.json();
            console.log('❌ Login failed:', error.message);
            console.log('🔧 You might need to create an admin user first');
        }
        
    } catch (error) {
        console.error('❌ Error testing pricing API:', error.message);
    }
}

testPricingAPI();