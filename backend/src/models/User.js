import mongoose from "mongoose";
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    firstName: { 
      type: String, 
      required: [true, 'First name is required'], 
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters']
    },
    middleName: { 
      type: String, 
      trim: true,
      maxlength: [50, 'Middle name cannot exceed 50 characters']
    },
    lastName: { 
      type: String, 
      required: [true, 'Last name is required'], 
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    email: { 
      type: String, 
      required: [true, 'Email is required'], 
      unique: true, 
      lowercase: true, 
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: { 
      type: String, 
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },
    phone: { 
      type: String, 
      required: [true, 'Phone number is required'], 
      match: [/^[0-9]{10,15}$/, 'Please enter a valid phone number']
    },
    address: { 
      type: String, 
      required: [true, 'Address is required'],
      maxlength: [200, 'Address cannot exceed 200 characters']
    },
    idCardNumber: {
      type: String,
      required: [true, 'ID card number is required'],
      unique: true,
      trim: true,
      validate: {
        validator: function(v) {
          // Sri Lankan ID format: 9 digits + V or X (old) or 12 digits (new)
          return /^(\d{9}[VXvx]|\d{12})$/.test(v);
        },
        message: 'Please enter a valid Sri Lankan ID card number (9 digits + V/X or 12 digits)'
      }
    },
    birthday: { 
      type: Date, 
      required: [true, 'Birthday is required'],
      validate: {
        validator: function(v) {
          return v < new Date();
        },
        message: 'Birthday must be in the past'
      }
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
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
    role: { 
      type: String, 
      enum: ['user', 'admin', 'pickupagent', 'pickuppartner', 'recycler'],
      default: "user" 
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLogin: {
      type: Date
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Index for geospatial queries
userSchema.index({ location: "2dsphere" });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  const names = [this.firstName, this.middleName, this.lastName].filter(Boolean);
  return names.join(' ');
});

// Virtual for age
userSchema.virtual('age').get(function() {
  if (!this.birthday) return null;
  const today = new Date();
  const birthDate = new Date(this.birthday);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

export default mongoose.model("User", userSchema);
