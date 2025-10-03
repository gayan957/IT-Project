import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  // PayHere payment details
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  paymentId: {
    type: String,
    required: true,
    unique: true
  },
  merchantId: {
    type: String,
    required: true
  },
  
  // Payment amounts
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'LKR'
  },
  
  // Payment status
  status: {
    type: String,
    required: true,
    enum: ['pending', 'success', 'failed', 'canceled', 'chargedback'],
    default: 'pending'
  },
  statusCode: {
    type: Number,
    required: true
  },
  statusMessage: {
    type: String
  },
  
  // Payment method
  paymentMethod: {
    type: String,
    enum: ['card', 'bank', 'wallet', 'other'],
    default: 'other'
  },
  
  // Collection/Schedule details
  scheduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule'
  },
  collectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collection'
  },
  agentScheduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AgentSchedule'
  },
  
  // Waste collection details
  wasteDetails: {
    wasteType: {
      type: String,
      required: true
    },
    actualWeight: {
      type: Number,
      required: true,
      min: 0
    },
    pricePerKg: {
      type: Number,
      required: true,
      min: 0
    },
    location: {
      address: String,
      latitude: Number,
      longitude: Number
    }
  },
  
  // Customer details
  customerDetails: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    address: String,
    city: String,
    country: String
  },
  
  // Agent details
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  agentInfo: {
    name: String,
    agentId: String
  },
  
  // PayHere signature verification
  md5Signature: {
    type: String,
    required: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  
  // Additional notes
  notes: {
    type: String
  },
  
  // Timestamps for different stages
  initiatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  
  // Raw PayHere notification data for debugging
  rawNotificationData: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
PaymentSchema.index({ orderId: 1, paymentId: 1 });
PaymentSchema.index({ status: 1, createdAt: -1 });
PaymentSchema.index({ agentId: 1, createdAt: -1 });
PaymentSchema.index({ scheduleId: 1 });
PaymentSchema.index({ collectionId: 1 });

// Virtual for full customer name
PaymentSchema.virtual('customerFullName').get(function() {
  if (this.customerDetails.firstName || this.customerDetails.lastName) {
    return `${this.customerDetails.firstName || ''} ${this.customerDetails.lastName || ''}`.trim();
  }
  return null;
});

// Virtual for payment summary
PaymentSchema.virtual('paymentSummary').get(function() {
  return {
    orderId: this.orderId,
    amount: this.amount,
    currency: this.currency,
    status: this.status,
    weight: this.wasteDetails?.actualWeight,
    wasteType: this.wasteDetails?.wasteType,
    customerName: this.customerFullName,
    completedAt: this.completedAt || this.createdAt
  };
});

// Instance method to mark payment as completed
PaymentSchema.methods.markAsCompleted = function(paymentId, statusMessage = '') {
  this.paymentId = paymentId;
  this.status = 'success';
  this.statusCode = 2;
  this.statusMessage = statusMessage;
  this.completedAt = new Date();
  this.verified = true;
  return this.save();
};

// Instance method to mark payment as failed
PaymentSchema.methods.markAsFailed = function(statusMessage = '') {
  this.status = 'failed';
  this.statusCode = -2;
  this.statusMessage = statusMessage;
  return this.save();
};

// Static method to find by order ID
PaymentSchema.statics.findByOrderId = function(orderId) {
  return this.findOne({ orderId }).populate(['agentId', 'scheduleId', 'collectionId']);
};

// Static method to get agent payment history
PaymentSchema.statics.getAgentPaymentHistory = function(agentId, options = {}) {
  const { limit = 50, skip = 0, status, startDate, endDate } = options;
  
  let query = { agentId };
  
  if (status) {
    query.status = status;
  }
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate(['agentId', 'scheduleId', 'collectionId']);
};

// Pre-save middleware to set payment method based on PayHere data
PaymentSchema.pre('save', function(next) {
  if (this.isNew && !this.paymentMethod) {
    // You can enhance this logic based on PayHere response data
    this.paymentMethod = 'other';
  }
  next();
});

const Payment = mongoose.model('Payment', PaymentSchema);

export default Payment;
