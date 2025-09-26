// Test schedule collection API
import fetch from 'node-fetch';

const testScheduleCollection = async () => {
    try {
        const testData = {
            scheduleId: "60d0fe4f5311236168a109ca",
            userId: "60d0fe4f5311236168a109cb", 
            agentId: "60d0fe4f5311236168a109cc",
            partnerId: "60d0fe4f5311236168a109cd",
            wasteType: "plastic",
            actualWeight: 2.5,
            pricePerKg: 30.0,
            totalPrice: 75.0,
            scheduleLocation: {
                latitude: 6.9271,
                longitude: 79.8612,
                address: "Test Address, Colombo"
            },
            notes: "Test collection"
        };

        console.log('📤 Sending test data:', JSON.stringify(testData, null, 2));

        const response = await fetch('http://localhost:5000/api/agent-schedules/collect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-token'
            },
            body: JSON.stringify(testData)
        });

        const responseText = await response.text();
        console.log('📥 Response status:', response.status);
        console.log('📥 Response body:', responseText);

        if (!response.ok) {
            console.error('❌ API call failed');
        } else {
            console.log('✅ API call successful');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
};

testScheduleCollection();