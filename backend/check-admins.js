// Check existing admins in database
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const AdminSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, default: 'admin', immutable: true }
}, { timestamps: true });

const Admin = mongoose.model('Admin', AdminSchema);

async function checkAdmins() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const admins = await Admin.find({}).select('name email createdAt');
        
        console.log(`📋 Found ${admins.length} admin(s) in database:`);
        admins.forEach((admin, index) => {
            console.log(`  ${index + 1}. Name: ${admin.name}, Email: ${admin.email}, Created: ${admin.createdAt}`);
        });

        if (admins.length === 0) {
            console.log('\n💡 No admins found. You can create one using the admin registration endpoint.');
        } else {
            console.log('\n💡 Try logging in with one of these emails and check the password.');
            console.log('💡 You might need to reset the password or create a new admin with known credentials.');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    }
}

checkAdmins().catch(console.error);