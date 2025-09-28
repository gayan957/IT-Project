import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const PickUpPartnerSchema = new mongoose.Schema({
    firstName: { type: String, required: true, trim: true, maxlength: 50 },
    lastName: { type: String, required: true, trim: true, maxlength: 50 },
    email: { type: String, required: true, unique: true, trim: true, maxlength: 100 },
    password: { type: String, required: true, minlength: 6 },
    contactNumber: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    businessRegistrationNumber: { type: String, required: true, unique: true, trim: true },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true
});

const PickUpPartner = mongoose.model('PickUpPartner', PickUpPartnerSchema);

async function createTestPartner() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Check if test partner already exists
        const existingPartner = await PickUpPartner.findOne({ email: 'test@pickup.com' });
        
        if (existingPartner) {
            console.log('✅ Test partner already exists:', {
                id: existingPartner._id,
                email: existingPartner.email,
                name: existingPartner.firstName + ' ' + existingPartner.lastName
            });
            process.exit(0);
        }

        // Create test partner
        const hashedPassword = await bcrypt.hash('password123', 12);
        
        const testPartner = new PickUpPartner({
            firstName: 'Test',
            lastName: 'Partner',
            email: 'test@pickup.com',
            password: hashedPassword,
            contactNumber: '1234567890',
            address: '123 Test Street, Test City',
            businessRegistrationNumber: 'TEST123456',
            isVerified: true,
            isActive: true
        });

        const savedPartner = await testPartner.save();
        console.log('✅ Test partner created successfully:', {
            id: savedPartner._id,
            email: savedPartner.email,
            name: savedPartner.firstName + ' ' + savedPartner.lastName
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createTestPartner();