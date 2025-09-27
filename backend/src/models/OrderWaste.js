import mongoose from 'mongoose';

const orderWasteSchema = new mongoose.Schema(
    {
        // Reference to WasteWarehouse
        wasteWarehouseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'WasteWarehouse',
            required: true,
            index: true
        },
        
        // Reference to Recycler who placed the order
        recyclerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Recycler',
            required: true,
            index: true
        },
        
        // Admin tax amount for this order
        adminTaxAmount: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        },
        
        // Amount of waste being ordered (in kg)
        wasteAmount: {
            type: Number,
            required: true,
            min: 0.1
        },
        
        // Total order value (calculated field)
        totalOrderValue: {
            type: Number,
            required: true,
            min: 0
        },
          
        // Order completion details
        completedAt: {
            type: Date
        },

        // Ordered weight in kilograms
        weight: {
            type: Number,
            required: true,
            min: 0
        },

        // Order status
        orderStatus: {
            type: String,
            enum: ['pending', 'approved', 'completed', 'cancelled'],
            default: 'pending'
        },

        // Approval details
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin'
        },
        
        approvedAt: {
            type: Date
        },
        
        // Metadata for tracking
        meta: {
            // Reference to the pickup partner through waste warehouse
            pickupPartnerId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'PickUpPartner'
            },
            
            // Waste type (copied from warehouse for easier queries)
            wasteType: {
                type: String,
                enum: ['plastic', 'paper', 'glass', 'metal', 'organic', 'electronic', 'mixed']
            },
            
        }
    },
    { 
        timestamps: true,
        collection: 'orderswaste'
    }
);

// Indexes for better query performance
orderWasteSchema.index({ recyclerId: 1, createdAt: -1 });
orderWasteSchema.index({ wasteWarehouseId: 1, orderStatus: 1 });
orderWasteSchema.index({ orderStatus: 1, createdAt: -1 });
orderWasteSchema.index({ 'meta.pickupPartnerId': 1, createdAt: -1 });
orderWasteSchema.index({ approvedBy: 1, approvedAt: -1 });

// Pre-save middleware to populate metadata from waste warehouse
orderWasteSchema.pre('save', async function(next) {
    if (this.isNew || this.isModified('wasteWarehouseId')) {
        try {
            const WasteWarehouse = mongoose.model('WasteWarehouse');
            const wasteWarehouse = await WasteWarehouse.findById(this.wasteWarehouseId);
            
            if (wasteWarehouse) {
                this.meta.pickupPartnerId = wasteWarehouse.pickupPartnerId;
                this.meta.wasteType = wasteWarehouse.wasteType;
            }
        } catch (error) {
            console.error('Error populating order metadata:', error);
        }
    }
    next();
});

// Virtual for calculating tax percentage
orderWasteSchema.virtual('taxPercentage').get(function() {
    if (this.totalOrderValue > 0) {
        return (this.adminTaxAmount / this.totalOrderValue) * 100;
    }
    return 0;
});

// Virtual for net amount (total - tax)
orderWasteSchema.virtual('netAmount').get(function() {
    return this.totalOrderValue - this.adminTaxAmount;
});

// Instance method to approve order
orderWasteSchema.methods.approveOrder = function(adminId) {
    this.orderStatus = 'approved';
    this.approvedBy = adminId;
    this.approvedAt = new Date();
    return this.save();
};

// Instance method to complete order
orderWasteSchema.methods.completeOrder = function() {
    this.orderStatus = 'completed';
    this.completedAt = new Date();
    return this.save();
};

// Static method to get orders by recycler
orderWasteSchema.statics.getOrdersByRecycler = function(recyclerId, options = {}) {
    const query = { recyclerId };
    
    if (options.status) {
        query.orderStatus = options.status;
    }
    
    return this.find(query)
        .populate('wasteWarehouseId', 'wasteType totalWeight pickupPartnerId')
        .populate('recyclerId', 'name email companyName')
        .populate('approvedBy', 'name email')
        .populate('meta.pickupPartnerId', 'companyName email')
        .sort({ createdAt: -1 });
};

// Static method to get orders accessible to pickup partners
orderWasteSchema.statics.getOrdersByPickupPartner = function(pickupPartnerId, options = {}) {
    const query = { 'meta.pickupPartnerId': pickupPartnerId };
    
    if (options.status) {
        query.orderStatus = options.status;
    }
    
    return this.find(query)
        .populate('wasteWarehouseId', 'wasteType totalWeight')
        .populate('recyclerId', 'name email companyName')
        .populate('approvedBy', 'name email')
        .sort({ createdAt: -1 });
};

// Static method to get all orders for admin
orderWasteSchema.statics.getAllOrdersForAdmin = function(options = {}) {
    const query = {};
    
    if (options.status) {
        query.orderStatus = options.status;
    }
    
    if (options.startDate && options.endDate) {
        query.createdAt = {
            $gte: new Date(options.startDate),
            $lte: new Date(options.endDate)
        };
    }
    
    return this.find(query)
        .populate('wasteWarehouseId', 'wasteType totalWeight pickupPartnerId')
        .populate('recyclerId', 'name email companyName')
        .populate('approvedBy', 'name email')
        .populate('meta.pickupPartnerId', 'companyName email')
        .sort({ createdAt: -1 });
};

// Enable virtuals in JSON output
orderWasteSchema.set('toJSON', { virtuals: true });
orderWasteSchema.set('toObject', { virtuals: true });

export default mongoose.model('OrderWaste', orderWasteSchema);
