import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/salary';

async function testEmailEndpointWithAuth() {
  console.log('🧪 Testing salary email endpoint with proper setup...');
  
  try {
    // Use the actual salary ID from database
    const salaryId = '68d7eab1eec2a8fb4cec07f0'; // Ishara's salary record
    
    // Create a simple base64 encoded test PDF content
    const testPdfContent = Buffer.from('Test PDF content for salary slip').toString('base64');
    
    console.log('📤 Sending email request...');
    console.log('Request details:');
    console.log('- Salary ID:', salaryId);
    console.log('- PDF data length:', testPdfContent.length);
    console.log('- URL:', `${API_BASE_URL}/${salaryId}/send-email`);
    
    // First, try without authentication to see the exact error
    const response = await axios.post(`${API_BASE_URL}/${salaryId}/send-email`, {
      pdfData: testPdfContent
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });
    
    console.log('✅ Success:', response.data);
    
  } catch (error) {
    console.error('❌ Error occurred:');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    
    if (error.response) {
      console.error('\n📊 HTTP Response Details:');
      console.error('Status:', error.response.status);
      console.error('Status text:', error.response.statusText);
      console.error('Headers:', error.response.headers);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 500) {
        console.log('\n💥 500 Server Error Analysis:');
        console.log('This indicates an internal server error.');
        console.log('Common causes:');
        console.log('1. Database connection issues');
        console.log('2. Email service configuration problems');
        console.log('3. Missing environment variables');
        console.log('4. Code errors in the controller');
        console.log('\nCheck the backend server console for detailed error logs.');
      } else if (error.response.status === 401) {
        console.log('\n🔐 401 Authentication Error:');
        console.log('This is expected without proper authentication token.');
        console.log('The endpoint requires pickup partner authentication.');
      } else if (error.response.status === 404) {
        console.log('\n🔍 404 Not Found:');
        console.log('Either the salary record or the endpoint was not found.');
      }
    } else if (error.request) {
      console.error('\n📡 Network Error:');
      console.error('No response received from server');
      console.error('Possible causes:');
      console.error('- Server is not running on port 5000');
      console.error('- Network connectivity issues');
      console.error('- Firewall blocking the request');
    } else {
      console.error('\n⚙️ Setup Error:');
      console.error('Error setting up the request');
    }
  }
}

testEmailEndpointWithAuth();