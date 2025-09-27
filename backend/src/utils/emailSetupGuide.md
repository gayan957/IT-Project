# Email Configuration Guide

## Setting up Gmail for Salary Slip Email Sending

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Navigate to Security → 2-Step Verification
3. Enable 2-Step Verification if not already enabled

### Step 2: Generate App Password
1. Go to Security → 2-Step Verification → App passwords
2. Select "Mail" as the app
3. Select "Other (Custom name)" as the device
4. Enter "EcoWaste Backend" as the name
5. Click "Generate"
6. Copy the 16-character app password

### Step 3: Update Environment Variables
Update the `.env` file in the backend directory:

```env
# Email Configuration (Gmail)
EMAIL_USER=your-actual-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
```

### Step 4: Test Configuration
The backend will automatically test the email configuration on startup.
Check the console logs for email configuration status.

### Alternative Email Providers

#### For Outlook/Hotmail:
```javascript
service: 'hotmail'
```

#### For Yahoo:
```javascript
service: 'yahoo'
```

#### For Custom SMTP:
```javascript
host: 'smtp.your-provider.com'
port: 587
secure: false
```

### Security Notes:
- Never commit actual credentials to version control
- Use app-specific passwords, not your regular password
- Consider using environment-specific email accounts
- The `.env` file should be added to `.gitignore`

### Troubleshooting:
- Make sure 2FA is enabled on Gmail
- Use app password, not regular password
- Check firewall settings
- Verify email address format
- Check console logs for detailed error messages