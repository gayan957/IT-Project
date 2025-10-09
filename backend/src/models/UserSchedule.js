// src/models/UserSchedule.js
import mongoose from 'mongoose';
import User from './User.js';

const { Schema, model, Types } = mongoose;

const LOCATION_MSG = 'Location coordinates are required';

const LocationSchema = new Schema(
  {
    lat: {
      type: Number,
      required: [true, LOCATION_MSG],
      min: [-90, 'Latitude must be ≥ -90'],
      max: [90, 'Latitude must be ≤ 90'],
    },
    lng: {
      type: Number,
      required: [true, LOCATION_MSG],
      min: [-180, 'Longitude must be ≥ -180'],
      max: [180, 'Longitude must be ≤ 180'],
    },
  },
  { _id: false }
);

const UserScheduleSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    pickupDate: {
      type: Date,
      required: true,
      // Optional: normalize to midnight for day-based querying
    },
    pickupTime: {
      type: String,
      required: true, // e.g. "09:30" (24h) — keep as string if that's your UI format
      trim: true,
      validate: {
        validator: function(v) {
          // Validate time format HH:MM
          return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Pickup time must be in HH:MM format (24-hour)'
      }
    },
    pickupDueTime: {
      type: String,
      required: true, // e.g. "17:00" (24h) — latest pickup time
      trim: true,
      validate: {
        validator: function(v) {
          // Validate time format HH:MM
          return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Pickup due time must be in HH:MM format (24-hour)'
      }
    },
    location: LocationSchema, // { lat, lng }
    address: {
      type: String,
      trim: true,
      maxlength: [500, 'Address is too long']
    },
    wasteType: {
      type: String,
      required: true,
      enum: {
        values: ['plastic', 'paper', 'glass', 'metal', 'organic', 'coconut-shell', 'e-waste', 'mixed'],
        message: 'Invalid waste type',
      },
      default: 'mixed',
      index: true,
    },
    estimatedWeight: {
      type: Number,
      default: 0,
      min: [0, 'Estimated weight cannot be negative'],
      max: [1000, 'Estimated weight seems too high'],
      validate: {
        validator: function(value) {
          // Check if the number has more than 2 decimal places
          return Number.isInteger(value * 100);
        },
        message: 'Estimated weight can have maximum 2 decimal places'
      },
      set: function(value) {
        // Round to 2 decimal places when setting the value
        return Math.round(value * 100) / 100;
      }
    },
    status: {
      type: String,
      enum: ['Scheduled', 'Completed', 'Cancelled'],
      default: 'Scheduled',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

// Helpful compound index for calendar queries
UserScheduleSchema.index({ userId: 1, pickupDate: 1, status: 1 });

/**
 * BEFORE validation:
 * If location is missing, default to the user's saved GeoJSON location.
 * Your User model stores location as GeoJSON: { type: "Point", coordinates: [lng, lat] }.
 * We convert it into the schedule's { lat, lng } shape.
 */
UserScheduleSchema.pre('validate', async function (next) {
  try {
    console.log('PreValidate: this.location =', this.location);
    console.log('PreValidate: this.userId =', this.userId);
    
    // If location already set and valid-looking, do nothing
    if (
      this.location &&
      typeof this.location.lat === 'number' &&
      typeof this.location.lng === 'number'
    ) {
      console.log('Location already valid, skipping');
      return next();
    }

    console.log('Fetching user location...');
    // Otherwise copy from user's profile location
    const user = await User.findById(this.userId).select('location');
    console.log('User found:', user);
    const coords = user?.location?.coordinates; // [lng, lat]
    console.log('User coordinates:', coords);

    if (Array.isArray(coords) && coords.length === 2) {
      this.location = { lat: coords[1], lng: coords[0] };
      console.log('Set location to:', this.location);
      return next();
    }

    console.log('No valid coordinates found');
    // No coordinates anywhere → invalidate clearly
    this.invalidate(
      'location',
      'User has no default location set; please set your profile location or provide location for this schedule.'
    );
    return next();
  } catch (err) {
    console.error('PreValidate error:', err);
    return next(err);
  }
});

export default model('UserSchedule', UserScheduleSchema);
