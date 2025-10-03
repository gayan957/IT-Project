import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'trash2cashlk@gmail.com',
      pass: process.env.EMAIL_PASSWORD || 'pyhnwqojpgfamvzi'
    }
  });
};

// Send salary slip email with PDF attachment
export const sendSalarySlipEmail = async ({ 
  recipientEmail, 
  recipientName, 
  agentId, 
  month, 
  pdfBuffer, 
  senderName = 'Trash2Cash Finance Management' 
}) => {
  try {
    console.log('📧 Preparing to send salary slip email...');
    console.log('📧 Recipient:', recipientEmail);
    console.log('📧 Agent ID:', agentId);
    console.log('📧 Month:', month);

    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: senderName,
        address: process.env.EMAIL_USER || 'trash2cashlk@gmail.com'
      },
      to: recipientEmail,
      subject: `Salary Slip - ${month} | ${agentId}`,
      html: `
        <h1>📄 Salary Slip</h1>
        <p>Hello ${recipientName}!</p>
        <p>Your salary slip for <strong>${month}</strong> has been processed and is attached to this email.</p>
        <p><strong>Agent ID:</strong> ${agentId}</p>
        <p><strong>Pay Period:</strong> ${month}</p>
        <p><strong>Generated On:</strong> ${new Date().toLocaleDateString()}</p>
        <hr>
        <p>Please download and save the attached PDF for your records.</p>
        <p>Best regards,<br>Trash2Cash Finance Team</p>
      `,
      attachments: [
        {
          filename: `SalarySlip_${agentId}_${month.replace(/\s+/g, '_')}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    console.log('📤 Sending email via transporter...');
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', result.messageId);
    
    return {
      success: true,
      messageId: result.messageId,
      message: 'Salary slip sent successfully'
    };

  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

// Send bin full notification email
export const sendBinFullNotification = async ({ 
  recipientEmail, 
  recipientName, 
  binId, 
  binLocation,
  senderName = 'Trash2Cash Management' 
}) => {
  try {
    console.log('📧 Sending bin full notification...');
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: senderName,
        address: process.env.EMAIL_USER || 'trash2cashlk@gmail.com'
      },
      to: recipientEmail,
      subject: `🚨 Bin Full Alert - ${binId} | ${binLocation}`,
      html: `
        <h1>🚨 BIN FULL ALERT</h1>
        <p>Hello ${recipientName}!</p>
        <p><strong>Bin ${binId}</strong> at <strong>${binLocation}</strong> has reached full capacity and requires immediate collection.</p>
        <h3>📍 Bin Details</h3>
        <ul>
          <li><strong>Bin ID:</strong> ${binId}</li>
          <li><strong>Location:</strong> ${binLocation}</li>
          <li><strong>Alert Time:</strong> ${new Date().toLocaleString()}</li>
          <li><strong>Status:</strong> FULL - COLLECTION REQUIRED</li>
        </ul>
        <h3>📋 Action Required:</h3>
        <ul>
          <li>Schedule immediate collection for this bin</li>
          <li>Ensure collection team is notified</li>
          <li>Update bin status after collection</li>
        </ul>
        <p>Best regards,<br>Trash2Cash Management</p>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Bin notification sent successfully:', result.messageId);
    
    return {
      success: true,
      messageId: result.messageId,
      message: 'Bin full notification sent successfully'
    };

  } catch (error) {
    console.error('❌ Error sending bin full notification:', error);
    throw new Error(`Failed to send bin full notification: ${error.message}`);
  }
};

// Test email configuration
export const testEmailConfig = async () => {
  try {
    console.log('🧪 Testing email configuration...');
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email configuration is valid');
    return { success: true, message: 'Email configuration is valid' };
  } catch (error) {
    console.error('❌ Email configuration test failed:', error.message);
    return { success: false, message: error.message };
  }
};

export default { sendSalarySlipEmail, sendBinFullNotification, testEmailConfig };