import mongoose from 'mongoose';

const wasteWarehouseSchema = new mongoose.Schema(
    {
        // Reference to PickupPartner
        pickupPartnerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PickUpPartner',
            required: true,
            index: true
        },
        
        // Waste type
        wasteType: {
            type: String,
            required: true,
            trim: true,
            enum: ['plastic', 'paper', 'glass', 'metal', 'organic', 'electronic', 'mixed']
        },
        
        // Total weight in kilograms
        totalWeight: {
            type: Number,
            required: true,
            min: 0
        }
    },
    { 
        timestamps: true,
        collection: 'wastewarehouses'
    }
);

// Compound index for efficient querying
wasteWarehouseSchema.index({ pickupPartnerId: 1, wasteType: 1 });

export default mongoose.model('WasteWarehouse', wasteWarehouseSchema);