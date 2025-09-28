// Test bin full notification functionality
import fetch from 'node-fetch';

const baseURL = 'http://localhost:5000';

async function testBinNotification() {
  try {
    console.log('🧪 Testing Bin Full Notification Functionality...');
    
    // Use admin token for testing
    const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YjQ5ZGEwMTI5ZjdlYWFkZTNhNzcyZiIsInJvbGUiOiJhZG1pbiIsIm1vZGVsIjoiQWRtaW4iLCJpYXQiOjE3NTkwMzI5NTksImV4cCI6MTc1OTYzNzc1OX0.dummy';
    
    // First, get all bins to find one with high fill level
    console.log('📋 Fetching admin bins...');
    const binsResponse = await fetch(`${baseURL}/api/admin/bins`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!binsResponse.ok) {
      throw new Error(`Failed to fetch bins: ${binsResponse.status}`);
    }
    
    const bins = await binsResponse.json();
    console.log(`✅ Found ${bins.length} bins`);
    
    // Find a bin with fill level >= 90% or create a test scenario
    let targetBin = bins.find(bin => bin.fillLevel >= 90);
    
    if (!targetBin && bins.length > 0) {
      // Update first bin to have 90% fill level for testing
      targetBin = bins[0];
      console.log(`🔧 Updating bin ${targetBin._id} to 95% fill level for testing...`);
      
      const updateResponse = await fetch(`${baseURL}/api/admin/bins/${targetBin._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fillLevel: 95
        })
      });
      
      if (updateResponse.ok) {
        const updatedData = await updateResponse.json();
        targetBin = updatedData.bin;
        console.log('✅ Bin updated successfully');
      }
    }
    
    if (!targetBin) {
      console.log('❌ No bins available for testing');
      return;
    }
    
    console.log(`📬 Testing notification for bin: ${targetBin.label || targetBin._id}`);
    console.log(`📊 Bin fill level: ${targetBin.fillLevel}%`);
    console.log(`👤 Owner: ${targetBin.owner?.firstName} ${targetBin.owner?.lastName}`);
    
    // Send bin full notification
    const notificationResponse = await fetch(`${baseURL}/api/admin/bins/${targetBin._id}/notify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const notificationData = await notificationResponse.json();
    
    if (notificationResponse.ok) {
      console.log('✅ Bin full notification sent successfully!');
      console.log('📧 Email details:', {
        recipient: notificationData.data.recipientEmail,
        messageId: notificationData.data.messageId,
        sentAt: notificationData.data.sentAt
      });
    } else {
      console.log('❌ Failed to send notification:', notificationData.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testBinNotification();
