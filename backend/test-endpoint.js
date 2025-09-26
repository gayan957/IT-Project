import fetch from 'node-fetch';

async function testCollectionEndpoint() {
    try {
        console.log('🧪 Testing collection endpoint...');
        
        // Test without authentication first
        const response = await fetch('http://localhost:5000/api/collections', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });
        
        console.log('📊 Response status:', response.status);
        console.log('📋 Response headers:', Object.fromEntries(response.headers));
        
        const responseText = await response.text();
        console.log('📄 Response body:', responseText);
        
        if (response.status === 401) {
            console.log('✅ Endpoint is accessible but requires authentication (expected)');
        } else if (response.status === 400) {
            console.log('✅ Endpoint is accessible but validation failed (expected)');
        } else {
            console.log('❓ Unexpected response status');
        }
        
    } catch (error) {
        console.error('❌ Error testing endpoint:', error.message);
        console.error('🔍 Error details:', error);
    }
}

testCollectionEndpoint();