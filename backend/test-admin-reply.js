import fetch from 'node-fetch';

const baseURL = 'http://localhost:5000';

// Test admin reply functionality
async function testAdminReply() {
  try {
    // First, create a test ticket as a user
    console.log('Creating test ticket...');
    const userToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YjQ5ZGEwMTI5ZjdlYWFkZTNhNzcyZiIsInJvbGUiOiJ1c2VyIiwibW9kZWwiOiJVc2VyIiwiaWF0IjoxNzU5MDMyOTU5LCJleHAiOjE3NTk2Mzc3NTl9.dummy';
    
    const createResponse = await fetch(`${baseURL}/api/support-tickets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subject: 'Test Admin Reply',
        category: 'technical',
        message: 'This is a test ticket to verify admin reply functionality'
      })
    });

    if (!createResponse.ok) {
      throw new Error(`Failed to create ticket: ${createResponse.status}`);
    }

    const ticketData = await createResponse.json();
    console.log('✅ Test ticket created:', ticketData.ticket.ticketId);
    const ticketId = ticketData.ticket._id;

    // Now test admin reply
    console.log('Testing admin reply...');
    const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YjQ5ZGEwMTI5ZjdlYWFkZTNhNzcyZiIsInJvbGUiOiJhZG1pbiIsIm1vZGVsIjoiQWRtaW4iLCJpYXQiOjE3NTkwMzI5NTksImV4cCI6MTc1OTYzNzc1OX0.dummy';
    
    const replyResponse = await fetch(`${baseURL}/api/support-tickets/admin/${ticketId}/reply`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reply: 'Thank you for your inquiry. We have reviewed your issue and will provide a solution shortly.',
        status: 'in_progress'
      })
    });

    if (!replyResponse.ok) {
      const errorData = await replyResponse.json();
      throw new Error(`Failed to send reply: ${replyResponse.status} - ${JSON.stringify(errorData)}`);
    }

    const replyData = await replyResponse.json();
    console.log('✅ Admin reply successful:', replyData.message);
    console.log('📋 Updated ticket status:', replyData.ticket.status);
    console.log('💬 Admin reply:', replyData.ticket.adminReply);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAdminReply();