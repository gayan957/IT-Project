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
  senderName = 'Trash2Cash Finance Management' 
}) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: senderName,
        address: process.env.EMAIL_USER || 'trash2cashlk@gmail.com'
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
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: senderName,
        address: process.env.EMAIL_USER || 'noreply@trash2cash.com'
      },
      to: recipientEmail,
      subject: `Bin Full Alert - ${binId} | Immediate Collection Required`,
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
              background: linear-gradient(135deg, #10b981, #059669);
              color: white; 
              padding: 20px; 
              text-align: center; 
              border-radius: 10px 10px 0 0; 
            }
            .content { 
              background: #f8f9fa; 
              padding: 30px; 
              border-radius: 0 0 10px 10px; 
              border: 1px solid #e9ecef; 
            }
            .alert-box {
              background: #fff3cd;
              border: 1px solid #ffc107;
              color: #856404;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .bin-details {
              background: white;
              padding: 20px;
              border-radius: 5px;
              margin: 20px 0;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .footer { 
              text-align: center; 
              margin-top: 30px; 
              padding-top: 20px; 
              border-top: 1px solid #dee2e6; 
              color: #6c757d; 
            }
            .small { font-size: 12px; }
            .btn {
              background: #10b981;
              color: white;
              padding: 10px 20px;
              text-decoration: none;
              border-radius: 5px;
              display: inline-block;
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🚨 BIN FULL ALERT</h1>
            <p>Immediate Collection Required</p>
          </div>
          
          <div class="content">
            <p><strong>Dear ${recipientName},</strong></p>
            
            <div class="alert-box">
              <strong>⚠️ URGENT:</strong> One of your bins has reached full capacity and requires immediate collection.
            </div>
            
            <div class="bin-details">
              <h3>📍 Bin Details</h3>
              <p><strong>Bin ID:</strong> ${binId}</p>
              <p><strong>Location:</strong> ${binLocation}</p>
              <p><strong>Status:</strong> <span style="color: #dc3545; font-weight: bold;">FULL</span></p>
              <p><strong>Alert Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <p>Please arrange for collection as soon as possible to:</p>
            <ul>
              <li>Prevent overflow and environmental impact</li>
              <li>Maintain hygiene standards</li>
              <li>Continue efficient waste management</li>
            </ul>
            
            <p>If you have any questions or need assistance, please contact our support team immediately.</p>
            
            <p>Best regards,<br><strong>Trash2Cash Team</strong></p>
          </div>
          
          <div class="footer">
            <p><strong>${senderName}</strong></p>
            <p>Smart Waste Management Solutions</p>
            <p class="small">This is an automated alert. Please respond promptly to ensure proper waste management.</p>
          </div>
        </body>
        </html>
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
    throw new Error(`Failed to send bin full notification: ${error.message}`);
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

export default { sendSalarySlipEmail, sendBinFullNotification, testEmailConfig };