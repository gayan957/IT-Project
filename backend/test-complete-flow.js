import axios from 'axios';
import jsPDF from 'jspdf';

const API_BASE_URL = 'http://localhost:5000/api/salary';

// Simulate the PDF generation (simplified version)
async function generateTestPdf() {
  try {
    const doc = new jsPDF();
    doc.text('Test Salary Slip', 20, 20);
    doc.text('Employee: Test Employee', 20, 30);
    doc.text('Net Salary: Rs. 25,000.00', 20, 40);
    
    // Return as base64
    const pdfBase64 = doc.output('datauristring').split(',')[1];
    return pdfBase64;
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
}

async function testCompleteEmailFlow() {
  console.log('🧪 Testing complete salary email flow...');
  
  try {
    // Use the actual salary ID from database
    const salaryId = '68d7eab1eec2a8fb4cec07f0'; // Ishara's salary record
    
    console.log('📄 Generating test PDF...');
    const pdfBase64 = await generateTestPdf();
    console.log('✅ PDF generated, size:', pdfBase64.length, 'characters');
    
    console.log('📤 Sending email request...');
    console.log('Request details:');
    console.log('- Salary ID:', salaryId);
    console.log('- PDF data length:', pdfBase64.length);
    console.log('- URL:', `${API_BASE_URL}/${salaryId}/send-email`);
    
    const response = await axios.post(`${API_BASE_URL}/${salaryId}/send-email`, {
      pdfData: pdfBase64
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer your-token-here' // This will fail, but let's see the error
      }
    });
    
    console.log('✅ Success:', response.data);
    
  } catch (error) {
    console.error('❌ Complete error details:');
    console.error('Error message:', error.message);
    console.error('Status:', error.response?.status);
    console.error('Status text:', error.response?.statusText);
    console.error('Response headers:', error.response?.headers);
    console.error('Response data:', error.response?.data);
    
    if (error.response?.data) {
      console.log('\n📋 Server response details:');
      console.log('Success:', error.response.data.success);
      console.log('Message:', error.response.data.message);
      
      if (error.response.status === 500) {
        console.log('\n💥 This is a 500 server error - checking for common causes:');
        console.log('1. Check if email service is properly configured');
        console.log('2. Check if salary record exists and has valid employee email');
        console.log('3. Check server logs for detailed error information');
      }
    }
  }
}

testCompleteEmailFlow();