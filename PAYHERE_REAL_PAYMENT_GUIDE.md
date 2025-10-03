# 💳 PayHere Real Payment Processing Guide

## 🎯 Complete Live Payment Integration Steps

### 📋 Prerequisites
- ✅ Backend server running on port 5000
- ✅ Frontend server running on port 5173
- ✅ PayHere webhook configured
- ✅ Database connected and Payment model ready
- ✅ Customer Payments page accessible

### 🌐 Access Customer Payments Dashboard
```
Direct URL: http://localhost:5173/admin/finance/customer-payments
Navigation: Admin Dashboard → Finance → Customer Payments
```

### 💰 Current Database Status
- **Total Payments**: 11 records
- **Successful**: 8 payments (LKR 2,698.00)
- **Pending**: 1 payment
- **Failed**: 2 payments
- **Average Amount**: LKR 337.25

## 🔄 Process Real Payments Through PayHere

### Method 1: Test PayHere Integration with Live Cards

#### Step 1: Navigate to Waste Collection Form
```
URL: http://localhost:5173/schedule-collection
Path: Main Website → Schedule Collection
```

#### Step 2: Fill Collection Details
```
Waste Type: [Select: organic, electronic, paper, plastic, mixed]
Weight Estimate: [Enter estimated weight in kg]
Collection Address: [Enter pickup address]
Preferred Date: [Select collection date]
Contact Details: [Phone number and email]
```

#### Step 3: Proceed to Payment
- Click "Schedule Collection"
- Review collection summary
- Click "Proceed to Payment"
- **PayHere sandbox will open**

#### Step 4: Use PayHere Test Cards
```javascript
// Successful Payment Test Cards
VISA: 4916217501611292
Expiry: 12/25
CVV: 123

MASTERCARD: 5307732125531838
Expiry: 12/25
CVV: 123

// Failed Payment Test Card
VISA: 4000000000000002 (Always fails)
```

#### Step 5: Complete Payment Flow
1. **PayHere Payment Page**: Enter test card details
2. **Payment Processing**: PayHere processes payment
3. **Webhook Notification**: Backend receives webhook
4. **Database Storage**: Payment saved to Payment model
5. **Collection Creation**: AgentSchedule record created
6. **Redirect**: User redirected to success/failure page

### Method 2: Direct API Testing

#### Create Payment via API
```bash
# Test payment creation endpoint
curl -X POST http://localhost:5000/api/payments/create \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 150.00,
    "customerName": "Test Customer",
    "customerEmail": "test@example.com",
    "customerPhone": "+94771234567",
    "wasteType": "organic",
    "weight": 5.0
  }'
```

#### Test PayHere Webhook
```bash
# Simulate PayHere webhook notification
curl -X POST http://localhost:5000/api/payments/payhere-notification \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d 'merchant_id=1222884&order_id=TEST_001&payhere_amount=150.00&payhere_currency=LKR&status_code=2&md5sig=generated_hash&method=TEST&status_message=Successfully+completed&card_holder_name=Test+Customer&card_no=************1234'
```

## 📊 Verify Payment Data

### Check Database Records
```bash
# Run verification script
cd backend
node demo-payment-system.js
```

### View in Customer Payments Dashboard
1. **Open Dashboard**: http://localhost:5173/admin/finance/customer-payments
2. **Check Statistics**: 
   - Total payments count
   - Successful payment amount
   - Success rate percentage
   - Monthly trends
3. **Review Payment List**:
   - Customer details
   - Payment amounts
   - Payment status
   - Collection information
   - Payment methods

### Search and Filter Features
```
🔍 Search: By customer name, email, or order ID
📅 Date Filter: By payment date range
💰 Amount Filter: By payment amount range
🎯 Status Filter: SUCCESS, PENDING, FAILED
💳 Method Filter: VISA, MASTERCARD, AMEX, BANK_TRANSFER
```

## 🔧 PayHere Configuration

### Sandbox Environment
```javascript
// Current Configuration
Merchant ID: 1222884
Merchant Secret: [Your PayHere Secret]
Environment: Sandbox
Webhook URL: http://localhost:5000/api/payments/payhere-notification
Return URL: http://localhost:5173/payment-success
Cancel URL: http://localhost:5173/payment-cancel
```

### Production Setup (When Ready)
```javascript
// Production Configuration Steps
1. Register PayHere Business Account
2. Get Live Merchant ID and Secret
3. Update environment variables:
   PAYHERE_MERCHANT_ID=your_live_id
   PAYHERE_MERCHANT_SECRET=your_live_secret
4. Update PayHere URLs to production endpoints
5. Configure live webhook URL (must be HTTPS)
```

## 🎮 Demo Payment Flow

### Quick Test Scenario
```
1. Amount: LKR 200.00
2. Customer: Demo User (demo@test.com)
3. Waste Type: Electronic
4. Weight: 4 kg
5. Payment Method: VISA (4916217501611292)
6. Expected Result: SUCCESS → Database storage → Dashboard update
```

### Verification Checklist
- [ ] Payment appears in Customer Payments list
- [ ] Statistics updated correctly
- [ ] Collection record created in AgentSchedule
- [ ] Customer receives confirmation
- [ ] Payment status is SUCCESS
- [ ] Amount calculation is correct

## 🚨 Troubleshooting

### Payment Not Appearing in Dashboard
```bash
# Check database connection
node -e "require('./src/config/db.js').connectDB(process.env.MONGO_URI).then(console.log)"

# Verify Payment model
node -e "const Payment = require('./src/models/Payment.js'); Payment.find().then(console.log)"

# Check API endpoint
curl http://localhost:5000/api/payments/history
```

### PayHere Webhook Issues
```bash
# Check webhook endpoint
curl -X POST http://localhost:5000/api/payments/payhere-notification

# Verify server logs
tail -f backend/logs/payment.log

# Test webhook signature verification
node test-payhere-webhook.js
```

### Frontend Data Not Loading
```bash
# Check API response
curl http://localhost:5000/api/payments/history

# Verify frontend console logs
# Open browser console on Customer Payments page

# Test API endpoint manually
curl http://localhost:5000/api/payments/statistics
```

## 📈 Success Metrics

### Expected Performance
- **Payment Success Rate**: >95%
- **Webhook Processing**: <2 seconds
- **Database Storage**: <1 second
- **Dashboard Update**: Real-time
- **API Response**: <500ms

### KPI Monitoring
```javascript
// Track these metrics
Total Payments Processed
Average Payment Amount
Success/Failure Rates
Peak Transaction Times
Payment Method Distribution
Customer Satisfaction
```

## 🎯 Next Steps

1. **Process Test Payments**: Use PayHere test cards to create more records
2. **Monitor Dashboard**: Watch real-time updates in Customer Payments
3. **Test Edge Cases**: Failed payments, pending transactions, webhook failures
4. **Performance Testing**: Multiple concurrent payments
5. **Production Preparation**: Live PayHere account setup when ready

---

### 🔗 Quick Access Links
- **Customer Payments**: http://localhost:5173/admin/finance/customer-payments
- **Schedule Collection**: http://localhost:5173/schedule-collection
- **Finance Dashboard**: http://localhost:5173/admin/finance
- **API Documentation**: http://localhost:5000/api/docs (if available)

### 📞 Support Contacts
- **PayHere Support**: support@payhere.lk
- **Technical Documentation**: https://support.payhere.lk/
- **Integration Guide**: https://support.payhere.lk/api-&-docs/

---
*Last Updated: ${new Date().toLocaleString()}*
*Status: ✅ Payment System Fully Operational*