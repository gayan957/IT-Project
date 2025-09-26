import mongoose from 'mongoose';
import AgentBin from './src/models/AgentBin.js';

async function testAgentBinModel() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect('mongodb://localhost:27017/smart-waste-management');
        console.log('✅ Connected to MongoDB');

        // Test data
        const testData = {
            agentId: new mongoose.Types.ObjectId(),
            binId: new mongoose.Types.ObjectId(),
            partnerId: new mongoose.Types.ObjectId(),
            wasteType: 'plastic',
            wasteWeight: 2.5,
            pricePerKg: 25.00,
            totalPrice: 62.50,
            fillLevelBefore: 85,
            fillLevelAfter: 0,
            binLocation: {
                latitude: 6.9271,
                longitude: 79.8612,
                address: 'Test Location, Colombo'
            },
            status: 'collected',
            notes: 'Test collection'
        };

        console.log('🧪 Creating test AgentBin record...');
        const testRecord = new AgentBin(testData);
        
        console.log('💾 Saving test record...');
        const savedRecord = await testRecord.save();
        
        console.log('✅ Test record saved successfully!');
        console.log('🆔 Record ID:', savedRecord._id);
        console.log('📊 Record data:', JSON.stringify(savedRecord.toObject(), null, 2));

        // Count total records
        const totalCount = await AgentBin.countDocuments();
        console.log('📈 Total AgentBin records:', totalCount);

        // Clean up test record
        await AgentBin.findByIdAndDelete(savedRecord._id);
        console.log('🧹 Test record cleaned up');

        console.log('🎉 AgentBin model test completed successfully!');

    } catch (error) {
        console.error('💥 Test failed:', error);
        console.error('🔍 Error details:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

testAgentBinModel();