import mongoose from "mongoose";
import User from "./User.js";

const { Schema, model, Types } = mongoose;

const binSchema = new Schema(
  {
    owner: {
      type: Types.ObjectId,
      ref: "User",
      required: [true, 'Owner is required'],
      index: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: [true, 'Location coordinates are required'],
        validate: {
          validator: function(v) {
            return v.length === 2 && 
                   v[0] >= -180 && v[0] <= 180 && // longitude
                   v[1] >= -90 && v[1] <= 90;     // latitude
          },
          message: 'Invalid coordinates'
        }
      },
    },
    fillLevel: { 
      type: Number, 
      required: [true, 'Fill level is required'], 
      min: [0, 'Fill level cannot be negative'], 
      max: [100, 'Fill level cannot exceed 100'], 
      default: 0 
    },
    wasteType: {
      type: String,
      required: [true, 'Waste type is required'],
      enum: {
        values: ["plastic", "paper", "glass", "metal", "organic", "coconut-shell", "e-waste", "mixed"],
        message: 'Invalid waste type'
      },
      default: "mixed",
    },
    lastMeasuredAt: { 
      type: Date, 
      default: Date.now 
    },
    status: { 
      type: String, 
      enum: {
        values: ["idle", "scheduled", "picked", "maintenance"],
        message: 'Invalid status'
      }, 
      default: "idle" 
    },
    label: { 
      type: String,
      trim: true,
      maxlength: [100, 'Label cannot exceed 100 characters']
    },
    address: {
      type: String,
      trim: true,
      maxlength: [200, 'Address cannot exceed 200 characters']
    },
    capacity: {
      type: Number,
      default: 100, // liters
      min: [1, 'Capacity must be at least 1 liter']
    },
    isActive: {
      type: Boolean,
      default: true
    },
    pickupHistory: [{
      date: { type: Date, default: Date.now },
      fillLevel: { type: Number, min: 0, max: 100 },
      pickedBy: { type: Types.ObjectId, ref: "User" },
      notes: String
    }]
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
binSchema.index({ location: "2dsphere" });
binSchema.index({ owner: 1, status: 1 });
binSchema.index({ wasteType: 1, status: 1 });

// Virtual for current volume
binSchema.virtual('currentVolume').get(function() {
  return (this.fillLevel / 100) * this.capacity;
});

// Virtual for remaining capacity
binSchema.virtual('remainingCapacity').get(function() {
  return this.capacity - this.currentVolume;
});

// Virtual for fill status
binSchema.virtual('fillStatus').get(function() {
  if (this.fillLevel >= 90) return 'critical';
  if (this.fillLevel >= 70) return 'high';
  if (this.fillLevel >= 40) return 'medium';
  return 'low';
});

// Pre-save middleware to update lastMeasuredAt when fillLevel changes
binSchema.pre('save', function(next) {
  if (this.isModified('fillLevel')) {
    this.lastMeasuredAt = new Date();
  }
  next();
});

/**
 * Populate location from owner BEFORE validation, if not provided.
 */
binSchema.pre("validate", async function (next) {
  try {
    // if already set, nothing to do
    if (this.location?.coordinates?.length === 2) return next();

    // fetch owner's location
    const owner = await User.findById(this.owner).select("location");
    const coords = owner?.location?.coordinates;
    if (Array.isArray(coords) && coords.length === 2) {
      this.location = owner.location; // copy GeoJSON (type + coordinates)
      return next();
    }

    // owner has no location → fail validation with a clear message
    this.invalidate(
      "location.coordinates",
      "Owner has no location set; pick a location in your profile or during registration."
    );
    return next();
  } catch (err) {
    return next(err);
  }
});

// Method to add pickup record
binSchema.methods.addPickupRecord = function(pickedBy, notes = '') {
  this.pickupHistory.push({
    fillLevel: this.fillLevel,
    pickedBy,
    notes
  });
  this.fillLevel = 0;
  this.status = 'picked';
  return this.save();
};

// Static method to find bins needing pickup
binSchema.statics.findBinsNeedingPickup = function(threshold = 80) {
  return this.find({
    fillLevel: { $gte: threshold },
    status: 'idle',
    isActive: true
  }).populate('owner', 'firstName lastName phone address');
};

export default model("Bin", binSchema);
