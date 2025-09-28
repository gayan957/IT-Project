#!/usr/bin/env node

// Simple test script to verify support ticket API

const test = async () => {
  try {
    console.log('Testing Support Ticket API...');
    
    // Test ticket creation
    const response = await fetch('http://localhost:5000/api/support-tickets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YjQ5ZGEwMTI5ZjdlYWFkZTNhNzcyZiIsInJvbGUiOiJ1c2VyIiwibW9kZWwiOiJVc2VyIiwiaWF0IjoxNzU5MDMyOTU5LCJleHAiOjE3NTk2Mzc3NTl9'
      },
      body: JSON.stringify({
        subject: 'API Test Ticket',
        category: 'technical',
        message: 'This is a test ticket created via API to verify functionality',
        isUrgent: false
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ SUCCESS: Ticket created successfully');
      console.log('Ticket ID:', data.ticket.ticketId);
      console.log('Status:', data.ticket.status);
    } else {
      console.log('❌ ERROR: Failed to create ticket');
      console.log('Response:', data);
    }
    
  } catch (error) {
    console.error('❌ ERROR: Request failed:', error.message);
  }
};

test();