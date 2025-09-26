import mongoose from 'mongoose';

export async function connectDB(uri) {
    if (!uri) {
        console.error('❌ MongoDB URI is not provided');
        process.exit(1);
    }

    try {
        // Set mongoose options
        mongoose.set('strictQuery', true);
        
        // Enhanced connection options for better timeout handling
        const options = {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 30000,  // Increased timeout to 30 seconds
            socketTimeoutMS: 45000,
            connectTimeoutMS: 30000,          // Added connect timeout
            bufferCommands: false,
            useNewUrlParser: true,            // Use new URL parser
            useUnifiedTopology: true,         // Use new server discovery and monitoring engine
            retryWrites: true,                // Enable retryable writes
            maxIdleTimeMS: 30000,             // Close connections after 30 seconds of inactivity
            family: 4                         // Use IPv4, skip trying IPv6
        };

        console.log('🔄 Attempting to connect to MongoDB...');
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
        
        mongoose.connection.on('connecting', () => {
            console.log('🔄 MongoDB connecting...');
        });
        
    } catch (err) {
        console.error('❌ MongoDB connection failed:', err.message);
        console.error('💡 Troubleshooting tips:');
        console.error('   - Check your internet connection');
        console.error('   - Verify MongoDB Atlas cluster is running');
        console.error('   - Check if your IP is whitelisted in MongoDB Atlas');
        console.error('   - Verify username and password are correct');
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