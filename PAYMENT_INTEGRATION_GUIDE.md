# 🚀 Customer Payments Page & PayHere Integration Guide

## Step 1: Visit Customer Payments Page ✅

### Direct Access:
- **URL:** http://localhost:5173/admin/finance/customer-payments
- **Alternative Path:** 
  1. Go to http://localhost:5173/admin/finance
  2. Click "Customer Payments" card (teal colored)

### What You Should See:
- **Statistics Cards:** Total: 5, Amount: LKR 1,321.50, Successful: 4, Failed: 1
- **Payment Table:** 5 real payment records from Payment model
- **Collection Details:** Waste types, weights, customer information

---

## Step 2: Process Real Payments Through PayHere Integration 💳

### Method 1: Complete Payment Flow (Recommended)

#### A) Access Waste Collection Payment Form:
```
http://localhost:5173/collect-schedule-waste
```

#### B) Fill Collection Details:
1. **Actual Weight:** Enter weight (e.g., 2.5 kg)
2. **Collection Notes:** Add any notes
3. **Waste Type:** Will show based on schedule (mixed, plastic, etc.)
4. **Calculate Total:** Price will auto-calculate

#### C) Process PayHere Payment:
1. Click **"Pay Now"** button
2. PayHere sandbox will open
3. Use test card details:
   - **Card Number:** 4916217501611292
   - **Expiry:** 12/25
   - **CVV:** 123
   - **Name:** Test Customer

#### D) Payment Processing:
1. PayHere processes payment
2. Webhook sends data to `/api/payment/notify`
3. Payment stored in Payment model
4. Collection record created in AgentSchedule
5. Auto-redirect to success page

### Method 2: Direct Payment API Testing

#### A) Test Payment Hash Generation:
```bash
curl -X POST http://localhost:5000/api/payment/hash \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "TEST_REAL_001",
    "amount": 150.75,
    "currency": "LKR"
  }'
```

#### B) Simulate PayHere Webhook:
```bash
curl -X POST http://localhost:5000/api/payment/notify \
  -H "Content-Type: application/json" \
  -d '{
    "merchant_id": "1222884",
    "order_id": "TEST_REAL_001",
    "payment_id": "payhere_real_001",
    "payhere_amount": "150.75",
    "payhere_currency": "LKR",
    "status_code": "2",
    "md5sig": "GENERATED_HASH",
    "custom_1": "{\"wasteType\":\"mixed\",\"userName\":\"Real Customer\"}",
    "custom_2": "{\"actualWeight\":3.0,\"pricePerKg\":50.25}"
  }'
```

### Method 3: Create More Test Payments

#### A) Run Sample Payment Generator:
```bash
cd backend
node create-more-payments.js
```

---

## Step 3: Verify New Payments 🔍

### A) Refresh Customer Payments Page:
1. Go back to Customer Payments page
2. Click "Refresh" button
3. Check updated statistics
4. Verify new payments in table

### B) Check Database Directly:
```bash
cd backend
node verify-payments.js
```

### C) Test API Endpoint:
```bash
curl http://localhost:5000/api/payment/history
```

---

## Step 4: Real PayHere Integration Setup 🔧

### A) PayHere Sandbox Credentials (Current):
- **Merchant ID:** 1222884
- **Merchant Secret:** MjI0NTIzMTM4OTM3ODY1NzQ3MTIyMTk1OTQ0NzkwMTAwNzc2MDMzMQ==
- **Environment:** Sandbox

### B) Test Card Details:
```
Visa: 4916217501611292
Mastercard: 5307732125531100
Expiry: 12/25
CVV: 123
```

### C) Webhook Configuration:
- **Notify URL:** http://localhost:5000/api/payment/notify
- **Return URL:** http://localhost:5173/payment-success
- **Cancel URL:** http://localhost:5173/collect-schedule-waste

---

## Step 5: Monitor Payment Processing 📊

### A) Real-time Monitoring:
1. Open browser dev tools (F12)
2. Go to Console tab
3. Watch for payment processing logs

### B) Backend Logs:
1. Check terminal running backend server
2. Look for payment webhook notifications
3. Verify database saves

### C) Database Verification:
```javascript
// Check payments in MongoDB
db.payments.find().sort({createdAt: -1}).limit(5)

// Check statistics
db.payments.aggregate([
  {$group: {
    _id: null,
    total: {$sum: 1},
    successful: {$sum: {$cond: [{$eq: ["$status", "SUCCESS"]}, 1, 0]}},
    totalAmount: {$sum: "$amount"}
  }}
])
```

---

## Step 6: Troubleshooting 🔧

### Common Issues:

#### A) Payment Not Appearing:
1. Check backend logs for webhook errors
2. Verify PayHere notification received
3. Check Payment model validation errors

#### B) Frontend Not Updating:
1. Click "Refresh" button
2. Check browser console for API errors
3. Verify API endpoint returning data

#### C) PayHere Sandbox Issues:
1. Use correct test card numbers
2. Ensure sandbox environment
3. Check merchant credentials

### Debug Commands:
```bash
# Check payment count
node -e "require('./src/models/Payment.js'); Payment.countDocuments().then(console.log)"

# Verify API endpoint
curl -s http://localhost:5000/api/payment/history | jq '.payments | length'

# Check latest payment
curl -s http://localhost:5000/api/payment/history | jq '.payments[0]'
```

---

## 🎯 Expected Results

After processing real payments:
1. **Customer Payments Page** shows updated statistics
2. **Payment Table** contains new payment records
3. **Collection Details** linked to payments
4. **Database** contains verified payment records
5. **Finance Dashboard** reflects updated totals

---

## 🚀 Next Steps

1. **Visit Customer Payments Page** ✅
2. **Process Real Payments** (Use Method 1 for full flow)
3. **Monitor & Verify** payments appear
4. **Test Different Scenarios** (success, failure, different amounts)
5. **Scale to Production** (update to live PayHere credentials)

---

**🔗 Quick Links:**
- Customer Payments: http://localhost:5173/admin/finance/customer-payments
- Waste Collection: http://localhost:5173/collect-schedule-waste
- Finance Dashboard: http://localhost:5173/admin/finance
- API Endpoint: http://localhost:5000/api/payment/history