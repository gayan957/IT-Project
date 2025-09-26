import mongoose from 'mongoose';
import AgentBin from './src/models/AgentBin.js';
import Bin from './src/models/Bin.js';
import PickUpAgent from './src/models/PickUpAgent.js';

async function testCollection() {
    try {
        await mongoose.connect('mongodb://localhost:27017/smart-waste-management');
        console.log('Connected to MongoDB');

        // Check AgentBin records
        const agentBinCount = await AgentBin.countDocuments();
        console.log('AgentBin records count:', agentBinCount);

        // Get recent AgentBin records
        const recentCollections = await AgentBin.find()
            .sort({ createdAt: -1 })
            .limit(3)
            .populate('agentId', 'name agentId')
            .populate('binId', 'binId wasteType')
            .populate('userId', 'name email');

        console.log('Recent collections:', recentCollections.length);
        if (recentCollections.length > 0) {
            console.log('Latest collection:', {
                id: recentCollections[0]._id,
                agent: recentCollections[0].agentId?.name,
                bin: recentCollections[0].binId?.binId,
                wasteWeight: recentCollections[0].wasteWeight,
                paymentAmount: recentCollections[0].paymentAmount,
                createdAt: recentCollections[0].createdAt
            });
        }

        // Check bins with fillLevel 0 (recently emptied)
        const emptyBins = await Bin.find({ fillLevel: 0 }).limit(5);
        console.log('Empty bins count:', emptyBins.length);

        // Check pickup agents
        const agents = await PickUpAgent.find().limit(3);
        console.log('Pickup agents count:', agents.length);
        if (agents.length > 0) {
            console.log('First agent:', {
                id: agents[0]._id,
                name: agents[0].name,
                agentId: agents[0].agentId,
                partnerId: agents[0].partnerId
            });
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

testCollection();