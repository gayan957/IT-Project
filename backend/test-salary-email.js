import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

async function testSalaryEmailEndpoint() {
  console.log('🧪 Testing salary slip email endpoint...');
  
  try {
    // First, let's get some salary data to test with
    console.log('📋 Fetching salary records...');
    
    // You'll need to use actual authentication tokens for this test
    // For now, let's just test the endpoint structure
    
    const testSalaryId = '60f1b2e4c8d4f21234567890'; // Dummy ID
    const testPdfData = 'dGVzdCBwZGYgZGF0YQ=='; // Base64 encoded "test pdf data"
    
    console.log('📤 Testing email sending endpoint...');
    
    const response = await axios.post(`${API_BASE_URL}/salary/${testSalaryId}/send-email`, {
      pdfData: testPdfData
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Success:', response.data);
    
  } catch (error) {
    console.error('❌ Error details:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Response data:', error.response?.data);
    console.error('Error message:', error.message);
    
    if (error.response?.status === 401) {
      console.log('🔐 Authentication required - this is expected for this test');
    } else if (error.response?.status === 500) {
      console.log('💥 Server error - this is what we need to investigate');
    }
  }
}

testSalaryEmailEndpoint();