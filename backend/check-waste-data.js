// Test script to check WasteWarehouse data
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trashToCash');
        console.log('✅ MongoDB connected successfully');
        
        // Check WasteWarehouse collection
        const WasteWarehouse = mongoose.model('WasteWarehouse', {
            wasteType: String,
            totalWeight: Number,
            pickupPartnerId: mongoose.Schema.Types.ObjectId,
            createdAt: Date
        });
        
        const count = await WasteWarehouse.countDocuments();
        console.log(`Total WasteWarehouse records: ${count}`);
        
        if (count > 0) {
            const samples = await WasteWarehouse.find().limit(3).lean();
            console.log('Sample records:');
            samples.forEach((record, index) => {
                console.log(`${index + 1}. Type: ${record.wasteType}, Weight: ${record.totalWeight}kg, Created: ${record.createdAt}`);
            });
        } else {
            console.log('No WasteWarehouse records found. This explains why available waste is empty.');
            
            // Let's check if we need to create some test data
            console.log('\nLet\'s create some test data...');
            
            const testData = [
                {
                    wasteType: 'plastic',
                    totalWeight: 25.5,
                    location: 'Warehouse A',
                    createdAt: new Date()
                },
                {
                    wasteType: 'metal',
                    totalWeight: 15.0,
                    location: 'Warehouse B',
                    createdAt: new Date()
                },
                {
                    wasteType: 'glass',
                    totalWeight: 30.2,
                    location: 'Warehouse C',
                    createdAt: new Date()
                }
            ];
            
            await WasteWarehouse.insertMany(testData);
            console.log('✅ Test data created successfully!');
            
            const newCount = await WasteWarehouse.countDocuments();
            console.log(`New total records: ${newCount}`);
        }
        
        mongoose.connection.close();
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

connectDB();