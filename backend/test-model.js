#!/usr/bin/env node

import mongoose from 'mongoose';

// Test the SupportTicket model directly
const testTicketCreation = async () => {
  try {
    console.log('Testing SupportTicket model...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'your-mongo-uri');
    console.log('Connected to MongoDB');
    
    // Import the model
    const { default: SupportTicket } = await import('./src/models/SupportTicket.js');
    
    // Create a test ticket
    const testTicket = new SupportTicket({
      ticketId: 'TEST-123456',
      userId: new mongoose.Types.ObjectId('68b49da0129f7eaade3a772f'),
      subject: 'Test ticket',
      category: 'technical',
      message: 'This is a test message',
      isUrgent: false,
      priority: 'medium'
    });
    
    console.log('Test ticket before save:', testTicket);
    
    const savedTicket = await testTicket.save();
    console.log('✅ Test ticket saved successfully:', savedTicket.ticketId);
    
    // Clean up
    await SupportTicket.findByIdAndDelete(savedTicket._id);
    console.log('✅ Test ticket cleaned up');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

testTicketCreation();