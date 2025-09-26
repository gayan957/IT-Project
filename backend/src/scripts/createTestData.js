import mongoose from 'mongoose';
import AgentBin from '../models/AgentBin.js';
import dotenv from 'dotenv';

dotenv.config();

async function createTestData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const testData = {
            agentId: new mongoose.Types.ObjectId(),
            binId: new mongoose.Types.ObjectId(),
            partnerId: new mongoose.Types.ObjectId('68d2b26d9efdbe22802a3404'), // Our test partner
            wasteType: 'plastic',
            wasteWeight: 5.2,
            pricePerKg: 30,
            totalPrice: 156,
            fillLevelBefore: 85,
            fillLevelAfter: 10,
            collectionDate: new Date(),
            binLocation: {
                latitude: 6.9271,
                longitude: 79.8612,
                address: 'Test Location, Colombo'
            },
            status: 'collected',
            notes: 'Test collection for partner dashboard'
        };

        const agentBin = new AgentBin(testData);
        await agentBin.save();
        
        console.log('Test AgentBin record created successfully:', agentBin._id);
        
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error creating test data:', error);
        process.exit(1);
    }
}

createTestData();