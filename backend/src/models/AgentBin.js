import mongoose from 'mongoose';

const agentBinSchema = new mongoose.Schema(
    {
        // Required references
        agentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PickUpAgent',
            required: true,
            index: true
        },
        binId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Bin',
            required: true,
            index: true
        },
        partnerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PickUpPartner',
            required: true,
            index: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: false // Made optional in case user data is not available
        },
        
        // Collection details
        wasteType: {
            type: String,
            required: true,
            trim: true
        },
        wasteWeight: {
            type: Number,
            required: true,
            min: 0.1,
            validate: {
                validator: function(value) {
                    // Check if the number has more than 2 decimal places
                    return Number.isInteger(value * 100);
                },
                message: 'Waste weight can have maximum 2 decimal places'
            },
            set: function(value) {
                // Round to 2 decimal places when setting the value
                return Math.round(value * 100) / 100;
            }
        },
        pricePerKg: {
            type: Number,
            required: true,
            min: 0,
            validate: {
                validator: function(value) {
                    // Check if the number has more than 2 decimal places
                    return Number.isInteger(value * 100);
                },
                message: 'Price per kg can have maximum 2 decimal places'
            },
            set: function(value) {
                // Round to 2 decimal places when setting the value
                return Math.round(value * 100) / 100;
            }
        },
        totalPrice: {
            type: Number,
            required: true,
            min: 0,
            validate: {
                validator: function(value) {
                    // Check if the number has more than 2 decimal places
                    return Number.isInteger(value * 100);
                },
                message: 'Total price can have maximum 2 decimal places'
            },
            set: function(value) {
                // Round to 2 decimal places when setting the value
                return Math.round(value * 100) / 100;
            }
        },
        
        // Bin status
        fillLevelBefore: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },
        fillLevelAfter: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        
        // Location and timing
        collectionDate: {
            type: Date,
            default: Date.now,
            required: true,
            index: true
        },
        binLocation: {
            latitude: {
                type: Number,
                required: true
            },
            longitude: {
                type: Number,
                required: true
            },
            address: {
                type: String,
                required: true,
                trim: true
            }
        },
        
        // Status and notes
        status: {
            type: String,
            enum: ['collected', 'processed', 'completed'],
            default: 'collected'
        },
        notes: {
            type: String,
            default: '',
            trim: true
        }
    },
    { 
        timestamps: true,
        collection: 'agentbins' // Ensure consistent collection name
    }
);

// Compound indexes for efficient querying
agentBinSchema.index({ agentId: 1, collectionDate: -1 });
agentBinSchema.index({ binId: 1, collectionDate: -1 });
agentBinSchema.index({ partnerId: 1, collectionDate: -1 });
agentBinSchema.index({ status: 1, collectionDate: -1 });

// Virtual for calculating collection summary
agentBinSchema.virtual('collectionSummary').get(function() {
    return {
        id: this._id,
        wasteType: this.wasteType,
        weight: this.wasteWeight,
        price: this.totalPrice,
        date: this.collectionDate,
        status: this.status
    };
});

// Ensure virtuals are included when converting to JSON
agentBinSchema.set('toJSON', { virtuals: true });

export default mongoose.model('AgentBin', agentBinSchema);