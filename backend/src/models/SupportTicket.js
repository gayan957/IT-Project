import mongoose from 'mongoose';

const SupportTicketSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    unique: true
    // Removed required: true because we generate it in pre-save hook
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  category: {
    type: String,
    required: true,
    enum: ['billing', 'technical', 'pickup', 'account', 'other']
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  adminReply: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  repliedAt: {
    type: Date
  },
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [String],
  isUrgent: {
    type: Boolean,
    default: false
  },
  customerSatisfaction: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String,
    ratedAt: Date
  }
}, {
  timestamps: true
});

// Generate unique ticket ID before saving
SupportTicketSchema.pre('save', async function(next) {
  console.log('Pre-save hook called. isNew:', this.isNew, 'ticketId:', this.ticketId);
  
  if (this.isNew && !this.ticketId) {
    try {
      // Generate a more robust ticket ID
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000);
      this.ticketId = `TKT-${timestamp.toString().slice(-6)}-${random.toString().padStart(4, '0')}`;
      
      console.log('Generated ticket ID:', this.ticketId);
    } catch (error) {
      console.error('Error generating ticket ID:', error);
      // Fallback to simple timestamp
      const timestamp = Date.now();
      this.ticketId = `TKT-${timestamp.toString().slice(-6)}`;
    }
  }
  
  console.log('Pre-save hook completed. ticketId:', this.ticketId);
  next();
});

// Index for better query performance
SupportTicketSchema.index({ userId: 1, status: 1 });
SupportTicketSchema.index({ createdAt: -1 });
SupportTicketSchema.index({ category: 1 });

// Clear any existing model to prevent caching issues
if (mongoose.models.SupportTicket) {
  delete mongoose.models.SupportTicket;
}

export default mongoose.model('SupportTicket', SupportTicketSchema);