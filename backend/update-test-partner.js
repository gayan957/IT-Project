import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function updateTestPartner() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const PickUpPartner = mongoose.model('PickUpPartner', new mongoose.Schema({
            role: { type: String, default: 'pickuppartner' }
        }));

        // Update test partner to have the correct role
        const result = await PickUpPartner.updateOne(
            { email: 'test@pickup.com' },
            { $set: { role: 'pickuppartner' } }
        );

        console.log('✅ Update result:', result);

        // Verify the update
        const partner = await PickUpPartner.findOne({ email: 'test@pickup.com' });
        console.log('✅ Partner after update:', {
            id: partner._id,
            email: partner.email,
            role: partner.role
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

updateTestPartner();