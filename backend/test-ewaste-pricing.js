import fetch from 'node-fetch';

async function testEWastePricing() {
    try {
        console.log('🧪 Testing E-Waste Pricing Data...');
        
        // Login as admin
        console.log('🔐 Logging in as admin...');
        const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@test.com',
                password: 'admin123',
                userType: 'admin'
            })
        });
        
        if (loginResponse.status === 200) {
            const loginData = await loginResponse.json();
            const token = loginData.token;
            
            // Check current pricing data
            console.log('📊 Checking current pricing data...');
            const pricingResponse = await fetch('http://localhost:5000/api/admin/pricing-data', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (pricingResponse.status === 200) {
                const data = await pricingResponse.json();
                console.log('✅ Current pricing data retrieved successfully');
                console.log(`📈 Total waste types: ${data.count}`);
                console.log('🗂️ Available types:', data.data.map(item => item.wasteType).sort().join(', '));
                
                // Check if e-waste exists
                const hasEWaste = data.data.some(item => item.wasteType === 'e-waste');
                
                if (hasEWaste) {
                    console.log('✅ E-waste pricing data found!');
                    const eWasteData = data.data.find(item => item.wasteType === 'e-waste');
                    console.log('💻 E-waste pricing details:', JSON.stringify(eWasteData, null, 2));
                } else {
                    console.log('❌ E-waste pricing data not found');
                    console.log('🔧 Need to add e-waste pricing data to the database');
                    
                    // Try to add e-waste pricing via warehouse-waste-prices endpoint
                    console.log('📝 Attempting to create e-waste pricing...');
                    const createResponse = await fetch('http://localhost:5000/api/admin/warehouse-waste-prices', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            wasteType: 'e-waste',
                            pricePerKg: 200,
                            adminTaxPerKg: 50
                        })
                    });
                    
                    if (createResponse.status === 200 || createResponse.status === 201) {
                        console.log('✅ E-waste pricing created successfully!');
                        
                        // Test again
                        const retestResponse = await fetch('http://localhost:5000/api/admin/pricing-data', {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        
                        if (retestResponse.status === 200) {
                            const retestData = await retestResponse.json();
                            const nowHasEWaste = retestData.data.some(item => item.wasteType === 'e-waste');
                            
                            if (nowHasEWaste) {
                                console.log('🎉 E-waste now appears in pricing data!');
                                const eWasteData = retestData.data.find(item => item.wasteType === 'e-waste');
                                console.log('💻 New e-waste pricing:', JSON.stringify(eWasteData, null, 2));
                            }
                        }
                    } else {
                        const errorData = await createResponse.json();
                        console.log('❌ Failed to create e-waste pricing:', errorData);
                    }
                }
                
            } else {
                console.log('❌ Failed to get pricing data:', pricingResponse.status);
            }
        } else {
            console.log('❌ Login failed');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testEWastePricing();