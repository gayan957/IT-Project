import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const WasteWarehouseSchema = new mongoose.Schema({
    pickupPartnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PickUpPartner',
        required: true,
        index: true
    },
    wasteType: {
        type: String,
        required: true,
        enum: ['plastic', 'paper', 'glass', 'metal', 'organic', 'electronic', 'textile', 'hazardous'],
        index: true
    },
    totalWeight: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    }
}, {
    timestamps: true
});

const WasteWarehouse = mongoose.model('WasteWarehouse', WasteWarehouseSchema);

async function createTestWarehouseData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Find test partner
        const PickUpPartner = mongoose.model('PickUpPartner', new mongoose.Schema({
            email: String,
            role: String
        }));
        
        const partner = await PickUpPartner.findOne({ email: 'test@pickup.com' });
        if (!partner) {
            console.log('❌ Test partner not found');
            process.exit(1);
        }

        console.log('✅ Found test partner:', partner._id);

        // Clear existing warehouse data for test partner
        await WasteWarehouse.deleteMany({ pickupPartnerId: partner._id });

        // Create test warehouse data
        const wasteTypes = [
            { type: 'plastic', weight: 125.5 },
            { type: 'paper', weight: 89.2 },
            { type: 'glass', weight: 156.8 },
            { type: 'metal', weight: 67.3 },
            { type: 'organic', weight: 203.1 }
        ];

        const createdItems = [];
        for (const waste of wasteTypes) {
            const item = new WasteWarehouse({
                pickupPartnerId: partner._id,
                wasteType: waste.type,
                totalWeight: waste.weight
            });
            
            const saved = await item.save();
            createdItems.push(saved);
            console.log(`✅ Created ${waste.type}: ${waste.weight}kg`);
        }

        console.log(`\n✅ Created ${createdItems.length} warehouse items for test partner`);
        console.log('📦 Total weight:', wasteTypes.reduce((sum, w) => sum + w.weight, 0).toFixed(1), 'kg');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createTestWarehouseData();