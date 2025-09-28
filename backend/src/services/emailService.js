import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create email transporter
const createTransporter = () => {
  // For Gmail (you can configure for other providers)
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASSWORD || 'your-app-password'
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
  senderName = 'Trash2Cash' 
}) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: senderName,
        address: process.env.EMAIL_USER || 'noreply@ecowaste.com'
      },
      to: recipientEmail,
      subject: `Salary Slip - ${month} | ${agentId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px; 
            }
            .header { 
              background: linear-gradient(135deg, #1e3a8a, #3b82f6); 
              color: white; 
              padding: 30px 20px; 
              border-radius: 10px 10px 0 0; 
              text-align: center; 
            }
            .header h1 { 
              margin: 0; 
              font-size: 24px; 
            }
            .header p { 
              margin: 5px 0 0 0; 
              opacity: 0.9; 
            }
            .content { 
              background: #f8fafc; 
              padding: 30px 20px; 
              border-radius: 0 0 10px 10px; 
            }
            .greeting { 
              font-size: 18px; 
              font-weight: 600; 
              color: #1e3a8a; 
              margin-bottom: 20px; 
            }
            .info-box { 
              background: white; 
              border: 1px solid #e2e8f0; 
              border-radius: 8px; 
              padding: 20px; 
              margin: 20px 0; 
            }
            .info-row { 
              display: flex; 
              justify-content: space-between; 
              margin: 10px 0; 
              padding: 8px 0; 
              border-bottom: 1px solid #f1f5f9; 
            }
            .info-row:last-child { 
              border-bottom: none; 
            }
            .info-label { 
              font-weight: 600; 
              color: #475569; 
            }
            .info-value { 
              color: #1e293b; 
            }
            .attachment-notice { 
              background: #ecfdf5; 
              border: 1px solid #10b981; 
              border-radius: 8px; 
              padding: 15px; 
              margin: 20px 0; 
              display: flex; 
              align-items: center; 
            }
            .attachment-icon { 
              background: #10b981; 
              color: white; 
              width: 40px; 
              height: 40px; 
              border-radius: 50%; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              margin-right: 15px; 
              font-size: 18px; 
            }
            .footer { 
              text-align: center; 
              margin-top: 30px; 
              padding: 20px; 
              background: #1e293b; 
              color: white; 
              border-radius: 8px; 
            }
            .footer p { 
              margin: 5px 0; 
              font-size: 14px; 
            }
            .footer .small { 
              font-size: 12px; 
              opacity: 0.8; 
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🌱 ${senderName}</h1>
            <p>Monthly Salary Slip</p>
          </div>
          
          <div class="content">
            <div class="greeting">
              Dear ${recipientName},
            </div>
            
            <p>
              We hope this email finds you well. Please find attached your salary slip for <strong>${month}</strong>.
            </p>
            
            <div class="info-box">
              <div class="info-row">
                <span class="info-label">Employee Name:</span>
                <span class="info-value">${recipientName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Agent ID:</span>
                <span class="info-value">${agentId}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Pay Period:</span>
                <span class="info-value">${month}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Generated On:</span>
                <span class="info-value">${new Date().toLocaleDateString('en-GB', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}</span>
              </div>
            </div>
            
            <div class="attachment-notice">
              <div class="attachment-icon">📎</div>
              <div>
                <strong>Salary Slip Attached</strong><br>
                <small>Please find your detailed salary breakdown in the attached PDF document.</small>
              </div>
            </div>
            
            <p>
              If you have any questions or concerns regarding your salary slip, please don't hesitate to 
              contact the HR department or your direct supervisor.
            </p>
            
            <p>
              Thank you for your continued dedication and hard work.
            </p>
            
            <p style="margin-top: 30px;">
              Best regards,<br>
              <strong>HR Department</strong><br>
              ${senderName}
            </p>
          </div>
          
          <div class="footer">
            <p><strong>${senderName}</strong></p>
            <p>Building a Sustainable Future Together</p>
            <p class="small">This is an automated email. Please do not reply to this message.</p>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `SalarySlip_${agentId}_${month.replace(' ', '_')}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    
    return {
      success: true,
      messageId: result.messageId,
      message: 'Salary slip sent successfully'
    };

  } catch (error) {
    console.error('Error sending email:', error);
    
    // Provide more specific error messages based on error type
    let errorMessage = 'Failed to send email';
    
    if (error.code === 'EAUTH') {
      errorMessage = 'Email authentication failed. Please check EMAIL_USER and EMAIL_PASSWORD in .env file';
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'Email service not found. Check internet connection';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Email service timeout. Please try again';
    } else if (error.message) {
      errorMessage = `Email error: ${error.message}`;
    }
    
    throw new Error(errorMessage);
  }
};

// Test email configuration
export const testEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return { success: true, message: 'Email configuration is valid' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Send bin full notification email to user
export const sendBinFullNotification = async ({ 
  recipientEmail, 
  recipientName, 
  binLabel,
  binId,
  fillLevel,
  address,
  wasteType,
  senderName = 'Trash2Cash' 
}) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: senderName,
        address: process.env.EMAIL_USER || 'noreply@trash2cash.com'
      },
      to: recipientEmail,
      subject: `🚨 Bin Full Alert - ${binLabel} | ${senderName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px; 
              background-color: #f7fafc;
            }
            .container {
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header { 
              background: linear-gradient(135deg, #dc2626, #ef4444); 
              color: white; 
              padding: 30px 20px; 
              text-align: center; 
            }
            .header h1 { 
              margin: 0; 
              font-size: 24px; 
              font-weight: bold;
            }
            .header p { 
              margin: 10px 0 0 0; 
              opacity: 0.9; 
              font-size: 16px;
            }
            .alert-icon {
              font-size: 48px;
              margin-bottom: 10px;
            }
            .content { 
              padding: 30px 20px; 
            }
            .greeting { 
              font-size: 18px; 
              font-weight: 600; 
              color: #1f2937; 
              margin-bottom: 20px; 
            }
            .alert-box { 
              background: #fef2f2; 
              border: 2px solid #fecaca; 
              border-radius: 8px; 
              padding: 20px; 
              margin: 20px 0; 
              text-align: center;
            }
            .alert-box h2 {
              color: #dc2626;
              margin: 0 0 10px 0;
              font-size: 20px;
            }
            .fill-level {
              font-size: 36px;
              font-weight: bold;
              color: #dc2626;
              margin: 10px 0;
            }
            .bin-details { 
              background: #f8fafc; 
              border: 1px solid #e2e8f0; 
              border-radius: 8px; 
              padding: 20px; 
              margin: 20px 0; 
            }
            .detail-row { 
              display: flex; 
              justify-content: space-between; 
              align-items: center;
              margin: 12px 0; 
              padding: 8px 0; 
              border-bottom: 1px solid #e2e8f0; 
            }
            .detail-row:last-child { 
              border-bottom: none; 
            }
            .detail-label { 
              font-weight: 600; 
              color: #475569; 
              display: flex;
              align-items: center;
            }
            .detail-value { 
              color: #1e293b; 
              font-weight: 500;
            }
            .action-needed { 
              background: #fffbeb; 
              border: 2px solid #fbbf24; 
              border-radius: 8px; 
              padding: 20px; 
              margin: 20px 0; 
              text-align: center;
            }
            .action-needed h3 {
              color: #d97706;
              margin: 0 0 10px 0;
            }
            .urgent-text {
              color: #dc2626;
              font-weight: bold;
              font-size: 16px;
            }
            .footer { 
              text-align: center; 
              margin-top: 30px; 
              padding: 20px; 
              background: #1f2937; 
              color: white; 
            }
            .footer p { 
              margin: 5px 0; 
              font-size: 14px; 
            }
            .footer .small { 
              font-size: 12px; 
              opacity: 0.8; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="alert-icon">🚨</div>
              <h1>${senderName}</h1>
              <p>Bin Full Notification Alert</p>
            </div>
            
            <div class="content">
              <div class="greeting">
                Dear ${recipientName},
              </div>
              
              <div class="alert-box">
                <h2>⚠️ Your Waste Bin is Nearly Full!</h2>
                <div class="fill-level">${fillLevel}%</div>
                <p class="urgent-text">Immediate attention required</p>
              </div>
              
              <p>
                We're writing to inform you that your waste bin <strong>"${binLabel}"</strong> has reached 
                <strong>${fillLevel}% capacity</strong> and requires immediate collection.
              </p>
              
              <div class="bin-details">
                <div class="detail-row">
                  <span class="detail-label">🗑️ Bin Label:</span>
                  <span class="detail-value">${binLabel}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">📊 Fill Level:</span>
                  <span class="detail-value" style="color: #dc2626; font-weight: bold;">${fillLevel}%</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">🏷️ Waste Type:</span>
                  <span class="detail-value">${wasteType.charAt(0).toUpperCase() + wasteType.slice(1).replace('-', ' ')}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">📍 Location:</span>
                  <span class="detail-value">${address || 'Location not specified'}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">🆔 Bin ID:</span>
                  <span class="detail-value">${binId}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">📅 Notification Date:</span>
                  <span class="detail-value">${new Date().toLocaleDateString('en-GB', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
              </div>
              
              <div class="action-needed">
                <h3>🚛 Action Required</h3>
                <p>
                  Please schedule a pickup for this bin as soon as possible to prevent overflow and 
                  maintain proper waste management in your area.
                </p>
              </div>
              
              <p>
                <strong>What happens next:</strong>
              </p>
              <ul style="color: #4b5563; line-height: 1.8;">
                <li>🔔 Our collection team has been notified</li>
                <li>📋 A pickup will be scheduled based on your area's collection route</li>
                <li>📞 You may receive a call to confirm the pickup time</li>
                <li>♻️ Continue to monitor your bin levels through our dashboard</li>
              </ul>
              
              <p>
                If you have any urgent concerns or need to report any issues with this bin, 
                please contact our support team immediately.
              </p>
              
              <p style="margin-top: 30px;">
                Thank you for your cooperation in maintaining a clean and sustainable environment.
              </p>
              
              <p>
                Best regards,<br>
                <strong>Waste Management Team</strong><br>
                ${senderName}
              </p>
            </div>
            
            <div class="footer">
              <p><strong>${senderName}</strong></p>
              <p>🌱 Building a Sustainable Future Together</p>
              <p class="small">This is an automated notification. For urgent issues, contact support immediately.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Bin Full Alert - ${senderName}
        
        Dear ${recipientName},
        
        Your waste bin "${binLabel}" has reached ${fillLevel}% capacity and requires immediate collection.
        
        Bin Details:
        - Label: ${binLabel}
        - Fill Level: ${fillLevel}%
        - Waste Type: ${wasteType}
        - Location: ${address || 'Location not specified'}
        - Bin ID: ${binId}
        - Notification Date: ${new Date().toLocaleDateString()}
        
        Action Required:
        Please schedule a pickup for this bin as soon as possible to prevent overflow.
        
        Our collection team has been notified and will schedule a pickup based on your area's collection route.
        
        Thank you for your cooperation.
        
        Best regards,
        Waste Management Team
        ${senderName}
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Bin full notification sent successfully:', result.messageId);
    
    return {
      success: true,
      messageId: result.messageId,
      message: 'Bin full notification sent successfully'
    };

  } catch (error) {
    console.error('Error sending bin full notification:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to send bin full notification';
    
    if (error.code === 'EAUTH') {
      errorMessage = 'Email authentication failed. Please check EMAIL_USER and EMAIL_PASSWORD in .env file';
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'Email service not found. Check internet connection';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Email service timeout. Please try again';
    } else if (error.message) {
      errorMessage = `Email error: ${error.message}`;
    }
    
    throw new Error(errorMessage);
  }
};

export default { sendSalarySlipEmail, testEmailConfig, sendBinFullNotification };