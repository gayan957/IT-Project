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

const wastePriceSchema = new mongoose.Schema({
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
  collection: 'wasteprices'
});

// Compound index for efficient querying
wastePriceSchema.index({ wasteType: 1, isActive: 1 });

// Virtual for formatted price display
wastePriceSchema.virtual('formattedPrice').get(function() {
  return `Rs. ${this.pricePerKg.toFixed(2)}/kg`;
});

// Static method to get active prices
wastePriceSchema.statics.getActivePrices = function() {
  return this.find({ isActive: true }).sort({ wasteType: 1 });
};

// Static method to get price by waste type
wastePriceSchema.statics.getPriceByType = function(wasteType) {
  return this.findOne({ wasteType, isActive: true });
};

// Instance method to deactivate price
wastePriceSchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save();
};

export default mongoose.model('WastePrice', wastePriceSchema);