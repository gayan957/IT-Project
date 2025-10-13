import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Recycler from './src/models/Recycler.js';
import dotenv from 'dotenv';

dotenv.config();

async function createTestRecycler() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check if test recycler already exists
    const existingRecycler = await Recycler.findOne({ email: 'recycler@example.com' });
    if (existingRecycler) {
      console.log('📝 Test recycler already exists');
      console.log('Email: recycler@example.com');
      console.log('Password: password123');
      process.exit(0);
    }

    // Create test recycler
    const hashedPassword = await bcrypt.hash('password123', 10);
    const recyclerId = 'RCY' + Date.now().toString().slice(-6);

    const testRecycler = new Recycler({
      name: 'Test Recycler',
      email: 'recycler@example.com',
      password: hashedPassword,
      address: '123 Test Street, Test City',
      phoneNumber: '+1234567890',
      birthDate: new Date('1990-01-01'),
      facilityName: 'Test Recycling Facility',
      recyclerId: recyclerId,
      facilityLicense: 'TEST-LIC-123'
    });

    await testRecycler.save();
    
    console.log('✅ Test recycler created successfully!');
    console.log('📧 Email: recycler@example.com');
    console.log('🔑 Password: password123');
    console.log('🆔 Recycler ID:', recyclerId);
    
  } catch (error) {
    console.error('❌ Error creating test recycler:', error);
  } finally {
    mongoose.disconnect();
  }
}

createTestRecycler();