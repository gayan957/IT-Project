import mongoose from 'mongoose';

const wasteTypes = [
  'organic',
  'plastic',
  'paper',
  'glass',
  'metal',
  'electronic',
  'mixed',
  'other'
];

const wastePriceSchema = new mongoose.Schema({
  wasteType: {
    type: String,
    enum: wasteTypes,
    required: true,
    unique: true
  },
  pricePerKg: {
    type: Number,
    required: true,
    min: 0
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('WastePrice', wastePriceSchema);