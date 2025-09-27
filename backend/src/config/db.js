import mongoose from 'mongoose';

export async function connectDB(uri) {
    if (!uri) {
        console.error('❌ MongoDB URI is not provided');
        process.exit(1);
    }

    try {
        // Set mongoose options
        mongoose.set('strictQuery', true);
        
        // Connection options
        const options = {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            bufferCommands: false
        };

        await mongoose.connect(uri, options);
        console.log('✅ MongoDB connected successfully');
        
        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB disconnected');
        });
        
        mongoose.connection.on('reconnected', () => {
            console.log('🔄 MongoDB reconnected');
        });
        
    } catch (err) {
        console.error('❌ MongoDB connection failed:', err.message);
        process.exit(1);
    }
}

export async function disconnectDB() {
    try {
        await mongoose.disconnect();
        console.log('📴 MongoDB disconnected');
    } catch (err) {
        console.error('❌ Error disconnecting from MongoDB:', err.message);
    }
}