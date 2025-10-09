import mongoose from 'mongoose';

// Waste types enum - consistent with Bin and UserSchedule models
const wasteTypes = [
  'plastic',
  'paper', 
  'glass',
  'metal',
  'organic',
  'coconut-shell',
  'e-waste',
  'mixed'
];

const warehouseWastePriceSchema = new mongoose.Schema({
  wasteType: {
    type: String,
    required: [true, 'Waste type is required'],
    enum: {
      values: wasteTypes,
      message: 'Invalid waste type. Must be one of: {VALUE}'
    },
    unique: true,
    index: true,
    trim: true
  },
  pricePerKg: {
    type: Number,
    required: [true, 'Price per kg is required'],
    min: [0, 'Price cannot be negative'],
    validate: [
      {
        validator: function(v) {
          return Number.isFinite(v) && v >= 0;
        },
        message: 'Price per kg must be a valid positive number'
      },
      {
        validator: function(value) {
          // Check if the number has more than 2 decimal places
          return Number.isInteger(value * 100);
        },
        message: 'Price per kg can have maximum 2 decimal places'
      }
    ],
    set: function(value) {
      // Round to 2 decimal places when setting the value
      return Math.round(value * 100) / 100;
    }
  },
  adminTaxPerKg: {
    type: Number,
    required: [true, 'Admin tax per kg is required'],
    min: [0, 'Admin tax cannot be negative'],
    validate: [
      {
        validator: function(v) {
          return Number.isFinite(v) && v >= 0;
        },
        message: 'Admin tax per kg must be a valid positive number'
      },
      {
        validator: function(value) {
          // Check if the number has more than 2 decimal places
          return Number.isInteger(value * 100);
        },
        message: 'Admin tax per kg can have maximum 2 decimal places'
      }
    ],
    set: function(value) {
      // Round to 2 decimal places when setting the value
      return Math.round(value * 100) / 100;
    }
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: [true, 'Updated by admin is required'],
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true,
  collection: 'warehousewasteprices'
});

// Compound index for efficient querying
warehouseWastePriceSchema.index({ wasteType: 1, isActive: 1 });

// Virtual for formatted price display
warehouseWastePriceSchema.virtual('formattedPrice').get(function() {
  return `Rs. ${this.pricePerKg.toFixed(2)}/kg`;
});

// Virtual for formatted admin tax display
warehouseWastePriceSchema.virtual('formattedAdminTax').get(function() {
  return `Rs. ${this.adminTaxPerKg.toFixed(2)}/kg`;
});

// Virtual for net price after tax
warehouseWastePriceSchema.virtual('netPricePerKg').get(function() {
  return this.pricePerKg - this.adminTaxPerKg;
});

// Virtual for formatted net price display
warehouseWastePriceSchema.virtual('formattedNetPrice').get(function() {
  return `Rs. ${this.netPricePerKg.toFixed(2)}/kg`;
});

// Static method to get active prices
warehouseWastePriceSchema.statics.getActivePrices = function() {
  return this.find({ isActive: true }).sort({ wasteType: 1 });
};

// Static method to get price by waste type
warehouseWastePriceSchema.statics.getPriceByType = function(wasteType) {
  return this.findOne({ wasteType, isActive: true });
};

// Static method to calculate total earnings for a waste transaction
warehouseWastePriceSchema.statics.calculateEarnings = function(wasteType, weight) {
  return this.getPriceByType(wasteType).then(price => {
    if (!price) return null;
    return {
      grossAmount: price.pricePerKg * weight,
      adminTax: price.adminTaxPerKg * weight,
      netAmount: price.netPricePerKg * weight,
      weight: weight,
      wasteType: wasteType
    };
  });
};

// Instance method to deactivate price
warehouseWastePriceSchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save();
};

// Instance method to calculate earnings for given weight
warehouseWastePriceSchema.methods.calculateForWeight = function(weight) {
  return {
    grossAmount: this.pricePerKg * weight,
    adminTax: this.adminTaxPerKg * weight,
    netAmount: this.netPricePerKg * weight,
    weight: weight,
    wasteType: this.wasteType
  };
};

export default mongoose.model('WarehouseWastePrice', warehouseWastePriceSchema);