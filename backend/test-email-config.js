import { testEmailConfig, sendSalarySlipEmail } from './src/services/emailService.js';

async function testEmail() {
  console.log('🧪 Testing email configuration...');
  
  try {
    // Test email configuration
    const configTest = await testEmailConfig();
    console.log('📧 Email config test:', configTest);
    
    if (configTest.success) {
      console.log('✅ Email configuration is valid');
      
      // Create a dummy PDF buffer for testing
      const dummyPdfBuffer = Buffer.from('dummy pdf content');
      
      // Test sending email with dummy data
      console.log('📤 Testing email sending...');
      
      const emailResult = await sendSalarySlipEmail({
        recipientEmail: 'test@example.com', // Use a test email
        recipientName: 'Test Agent',
        agentId: 'A001',
        month: 'January',
        pdfBuffer: dummyPdfBuffer
      });
      
      console.log('📧 Email send result:', emailResult);
      
    } else {
      console.log('❌ Email configuration failed:', configTest.message);
    }
    
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
  }
}

testEmail();