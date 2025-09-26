import 'dotenv/config';
import { connectDB } from './src/config/db.js';
import PickUpPartner from './src/models/PickUpPartner.js';
import PickUpAgent from './src/models/PickUpAgent.js';

async function createTestData() {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            console.error('❌ MongoDB URI not found in environment');
            process.exit(1);
        }
        
        await connectDB(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Find existing partner
        const partner = await PickUpPartner.findOne({ partnerId: 'PTR115960' });
        if (!partner) {
            console.log('❌ Partner not found');
            process.exit(1);
        }

        console.log('✅ Found partner:', partner.name, 'ID:', partner._id);

        // Check if agent already exists
        const existingAgent = await PickUpAgent.findOne({ partnerId: partner._id });
        if (existingAgent) {
            console.log('✅ Agent already exists:', existingAgent.name);
        } else {
            // Create a test agent
            const testAgent = new PickUpAgent({
                name: 'Test Agent',
                email: 'testagent@example.com',
                password: 'password123',
                address: '123 Test Street',
                phoneNumber: '+94 77 123 4567',
                birthDate: new Date('1990-01-01'),
                agentId: 'AGT' + Date.now(),
                partnerId: partner._id,
                vehicleNumber: 'TEST-001',
                assignedArea: 'Colombo',
                status: 'active'
            });

            await testAgent.save();
            console.log('✅ Created test agent:', testAgent.name);
        }

        // List all agents for this partner
        const agents = await PickUpAgent.find({ partnerId: partner._id });
        console.log('📋 Agents for partner:', agents.map(a => ({ name: a.name, agentId: a.agentId })));
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createTestData();