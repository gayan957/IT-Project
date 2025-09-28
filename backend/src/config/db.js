import mongoose from 'mongoose';

export async function connectDB(uri) {
    if (!uri) {
        console.error('❌ MongoDB URI is not provided');
        console.log('⚠️ Server will start without database connection');
        return false;
    }

    try {
        // Set mongoose options
        mongoose.set('strictQuery', true);
        
        // Connection options with shorter timeout for faster error detection
        const options = {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 3000, // Reduced timeout
            socketTimeoutMS: 45000,
            bufferCommands: false,
            connectTimeoutMS: 3000 // Added connect timeout
        };

        await mongoose.connect(uri, options);
        console.log('✅ MongoDB connected successfully');
        
        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err.message);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB disconnected');
        });
        
        mongoose.connection.on('reconnected', () => {
            console.log('🔄 MongoDB reconnected');
        });
        
        return true;
        
    } catch (err) {
        console.error('❌ MongoDB connection failed:', err.message);
        console.log('⚠️ Server will continue without database. Please check your MongoDB connection.');
        console.log('💡 Possible solutions:');
        console.log('   - Check MongoDB Atlas IP whitelist');
        console.log('   - Verify connection string');
        console.log('   - Ensure MongoDB service is running');
        return false;
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