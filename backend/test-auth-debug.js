// Test authentication debugging
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

// Import models
import User from './src/models/User.js';
import Admin from './src/models/Admin.js';

// Connect to database
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1);
    }
};

const testAuth = async () => {
    await connectDB();
    
    console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');
    
    // Find all users and their roles
    const users = await User.find({}, 'firstName lastName email role isActive').limit(5);
    console.log('Sample Users:', users);
    
    const admins = await Admin.find({}, 'name email role').limit(5);
    console.log('Sample Admins:', admins);
    
    // Test token generation for a sample user
    if (users.length > 0) {
        const sampleUser = users[0];
        const token = jwt.sign(
            { id: sampleUser._id, role: sampleUser.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );
        
        console.log('Sample token for user:', token.substring(0, 50) + '...');
        
        // Test token verification
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Token decoded successfully:', decoded);
        } catch (err) {
            console.log('Token verification failed:', err.message);
        }
    }
    
    process.exit(0);
};

testAuth().catch(console.error);