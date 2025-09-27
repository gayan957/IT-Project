import 'dotenv/config';
import mongoose from 'mongoose';
import WasteWarehouse from './src/models/WasteWarehouse.js';
import PickUpPartner from './src/models/PickUpPartner.js';

async function createWasteWarehouseData() {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            console.error('❌ MongoDB URI not found in environment');
            process.exit(1);
        }
        
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Check existing WasteWarehouse records
        const existingCount = await WasteWarehouse.countDocuments();
        console.log(`📊 Existing WasteWarehouse records: ${existingCount}`);

        if (existingCount > 0) {
            const samples = await WasteWarehouse.find().limit(3).populate('pickupPartnerId', 'companyName');
            console.log('🗂️ Sample existing records:');
            samples.forEach((record, index) => {
                console.log(`   ${index + 1}. ${record.wasteType}: ${record.totalWeight}kg from ${record.pickupPartnerId?.companyName || 'Unknown'}`);
            });
        } else {
            console.log('📭 No WasteWarehouse records found. Creating test data...');

            // Find a pickup partner to associate with the waste
            const partner = await PickUpPartner.findOne();
            if (!partner) {
                console.error('❌ No pickup partners found. Creating a test partner first...');
                
                const testPartner = new PickUpPartner({
                    name: 'Test Company',
                    companyName: 'Test Waste Collection Ltd',
                    email: 'test@wastecollection.com',
                    password: 'password123',
                    address: 'Test Address, Colombo',
                    phoneNumber: '+94771234567',
                    businessRegistrationNumber: 'BR123456',
                    partnerId: 'PTR' + Date.now(),
                    status: 'active'
                });
                
                await testPartner.save();
                console.log('✅ Created test partner:', testPartner.companyName);
                
                // Use the new partner
                var partnerId = testPartner._id;
            } else {
                console.log('✅ Found existing partner:', partner.companyName);
                var partnerId = partner._id;
            }

            // Create test WasteWarehouse data
            const testWasteData = [
                {
                    pickupPartnerId: partnerId,
                    wasteType: 'plastic',
                    totalWeight: 25.5
                },
                {
                    pickupPartnerId: partnerId,
                    wasteType: 'metal',
                    totalWeight: 15.0
                },
                {
                    pickupPartnerId: partnerId,
                    wasteType: 'glass',
                    totalWeight: 30.2
                },
                {
                    pickupPartnerId: partnerId,
                    wasteType: 'paper',
                    totalWeight: 12.8
                },
                {
                    pickupPartnerId: partnerId,
                    wasteType: 'electronic',
                    totalWeight: 8.5
                }
            ];

            const insertedRecords = await WasteWarehouse.insertMany(testWasteData);
            console.log(`✅ Created ${insertedRecords.length} WasteWarehouse records`);
            
            // Display the created records
            console.log('🗂️ Created records:');
            insertedRecords.forEach((record, index) => {
                console.log(`   ${index + 1}. ${record.wasteType}: ${record.totalWeight}kg`);
            });
        }

        const finalCount = await WasteWarehouse.countDocuments();
        console.log(`📊 Total WasteWarehouse records now: ${finalCount}`);

        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createWasteWarehouseData();