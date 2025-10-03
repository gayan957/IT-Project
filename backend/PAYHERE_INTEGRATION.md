# PayHere Payment Integration Documentation

## Overview
This documentation covers the complete PayHere payment gateway integration for the Trash2Cash waste collection system. The integration includes real-time payment processing, webhook handling, and comprehensive payment management.

## 🏗️ Architecture

### Backend Components
1. **Payment Routes** (`/backend/src/routes/payment.js`)
   - Payment history API
   - Hash generation for PayHere
   - Webhook handler for real-time updates
   - Payment status checking
   - Refund processing

2. **Payment Model** (`/backend/src/models/Payment.js`)
   - MongoDB schema for storing payment data
   - Payment statistics methods
   - Fee calculation utilities

3. **PayHere Service** (`/backend/src/services/payhere.service.js`)
   - PayHere API utilities
   - Signature verification
   - Transaction fee calculations

### Frontend Components
1. **Customer Payments Page** (`/frontend/src/pages/CustomerPayments.jsx`)
   - Admin dashboard for viewing payments
   - Real-time payment statistics
   - Search and filter capabilities

2. **PayHere Form** (`/frontend/src/components/PayhereForm.jsx`)
   - Payment form integration
   - Hash generation and submission

## 🔧 Setup Instructions

### 1. Environment Configuration

Add these variables to your `.env` file:

```bash
# PayHere Sandbox Configuration
PAYHERE_MERCHANT_ID=your_merchant_id_here
PAYHERE_MERCHANT_SECRET=your_merchant_secret_here

# API Configuration (Optional - for advanced features)
PAYHERE_API_USERNAME=your_api_username
PAYHERE_API_PASSWORD=your_api_password

# URLs
FRONTEND_SUCCESS_URL=http://localhost:5173/payment-success
FRONTEND_CANCEL_URL=http://localhost:5173/collect-schedule-waste
API_BASE_URL=http://localhost:3000
```

### 2. PayHere Account Setup

1. **Register at PayHere Sandbox**
   - Visit: https://sandbox.payhere.lk
   - Create merchant account
   - Get Merchant ID and Secret

2. **Configure Webhook URL**
   - In PayHere merchant panel, set webhook URL to:
   - `https://yourdomain.com/api/payment/notify`
   - For local testing: `http://localhost:3000/api/payment/notify`

### 3. Database Migration

The Payment model will automatically create the necessary collections. No manual migration required.

## 📡 API Endpoints

### Payment Management

#### GET `/api/payment/history`
Fetch payment history with filtering options.

**Query Parameters:**
- `page` (number): Page number for pagination
- `limit` (number): Records per page
- `status` (string): Filter by payment status
- `startDate` (string): Start date filter
- `endDate` (string): End date filter
- `search` (string): Search in customer details

**Response:**
```json
{
  "success": true,
  "data": {
    "payments": [...],
    "pagination": {
      "current": 1,
      "pages": 5,
      "total": 125,
      "limit": 25
    },
    "summary": {
      "totalPayments": 125,
      "totalAmount": 45500.00,
      "successfulPayments": 110,
      "failedPayments": 15,
      "avgAmount": 364.00
    }
  }
}
```

#### POST `/api/payment/hash`
Generate secure hash for PayHere payment.

**Body:**
```json
{
  "order_id": "ORDER_12345",
  "amount": 1500.00,
  "currency": "LKR"
}
```

**Response:**
```json
{
  "success": true,
  "hash": "A1B2C3D4E5F6...",
  "merchant_id": "your_merchant_id"
}
```

#### POST `/api/payment/notify`
PayHere webhook endpoint (called by PayHere automatically).

#### GET `/api/payment/status/:orderId`
Check payment status for a specific order.

## 🔄 Payment Flow

### 1. Frontend Payment Initiation
```javascript
// PayhereForm.jsx
const generateHash = async () => {
  const response = await fetch('/api/payment/hash', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      order_id: orderDetails.order_id,
      amount: orderDetails.amount,
      currency: orderDetails.currency
    })
  });
  
  const data = await response.json();
  return data.hash;
};
```

### 2. PayHere Processing
- User completes payment on PayHere gateway
- PayHere processes the payment
- PayHere sends webhook notification to `/api/payment/notify`

### 3. Webhook Processing
```javascript
// Webhook automatically:
// 1. Verifies signature
// 2. Creates/updates payment record
// 3. Processes successful collection
// 4. Responds to PayHere
```

### 4. Frontend Redirect
- Success: Redirects to `/payment-success`
- Cancel: Redirects to collection page
- Auto-processes collection data

## 🎯 PayHere Webhook Data

### Incoming Webhook Fields
```javascript
{
  merchant_id: "merchant_id",
  order_id: "ORDER_12345",
  payhere_id: "payhere_unique_id",
  payhere_amount: "1500.00",
  payhere_currency: "LKR",
  status_code: "2", // 2=Success, -2=Failed, 0=Pending
  md5sig: "signature_hash",
  method: "VISA",
  status_message: "Success",
  card_holder_name: "John Doe",
  card_no: "************1234",
  card_expiry: "12/25",
  custom_1: "...", // Schedule data
  custom_2: "..."  // Collection data
}
```

### Status Codes
- `2`: SUCCESS
- `0`: PENDING  
- `-1`: CANCELLED
- `-2`: FAILED
- `-3`: CHARGED_BACK

## 💾 Database Schema

### Payment Document Structure
```javascript
{
  order_id: "ORDER_12345",
  payment_id: "payhere_abc123",
  amount: 1500.00,
  currency: "LKR",
  status: "SUCCESS",
  transaction_fee: 52.50,
  net_amount: 1447.50,
  customer: {
    name: "John Doe",
    email: "john@example.com",
    phone: "+94712345678"
  },
  schedule_data: { /* Original schedule */ },
  collection_data: { /* Collection details */ },
  created_at: "2024-01-01T10:00:00Z",
  updated_at: "2024-01-01T10:05:00Z"
}
```

## 🧪 Testing

### 1. Run PayHere Test Server
```bash
cd backend
node test-payhere.js
```

### 2. Test Endpoints
```bash
# Check server status
GET http://localhost:3001/test/payment/setup

# Simulate successful payment
POST http://localhost:3001/test/payment/simulate
{
  "order_id": "TEST_001",
  "amount": 1500.00,
  "status_code": "2"
}

# View test payments
GET http://localhost:3001/test/payment/data
```

### 3. PayHere Sandbox Testing

**Test Card Numbers:**
- Visa: `4916217501611292`
- MasterCard: `5307732125825900`
- AMEX: `371449635398431`

**Test Details:**
- CVV: Any 3-4 digits
- Expiry: Any future date
- Name: Any name

## 🔒 Security Features

### 1. Signature Verification
All webhooks are verified using MD5 signatures to ensure authenticity.

### 2. Data Sanitization
Customer card details are masked (only last 4 digits stored).

### 3. Secure Hash Generation
Payment hashes use PayHere's required format with merchant secret.

### 4. Admin-Only Access
Payment history requires admin authentication.

## 📊 Analytics & Reporting

### Available Metrics
- Total payments and amounts
- Success/failure rates
- Daily payment summaries
- Transaction fee calculations
- Customer payment patterns

### Real-time Updates
- Webhook processing provides real-time payment status
- Frontend automatically updates after successful payments
- Collection records are created automatically

## 🚀 Production Deployment

### 1. Environment Updates
```bash
# Change to production URLs
PAYHERE_MERCHANT_ID=live_merchant_id
PAYHERE_MERCHANT_SECRET=live_merchant_secret
PAYHERE_SANDBOX_URL=https://www.payhere.lk/pay/checkout
```

### 2. Webhook Configuration
- Update PayHere merchant settings with production webhook URL
- Ensure HTTPS is enabled for webhook endpoint

### 3. SSL Certificate
PayHere requires HTTPS for production webhooks.

## 🐛 Troubleshooting

### Common Issues

#### 1. Webhook Not Receiving
- Check webhook URL in PayHere merchant panel
- Verify server is accessible from internet
- Check firewall settings

#### 2. Signature Verification Failed
- Verify merchant secret in environment
- Check hash generation algorithm
- Ensure exact string formatting

#### 3. Payment Not Found
- Check order ID format
- Verify database connection
- Check payment model schema

### Debug Mode
Enable detailed logging by setting:
```bash
NODE_ENV=development
```

## 📞 Support

### PayHere Support
- Email: support@payhere.lk
- Phone: +94 11 2 345 345
- Documentation: https://support.payhere.lk

### Integration Support
Check logs in `/api/payment/notify` endpoint for webhook processing details.

---

**Last Updated:** October 3, 2025
**Version:** 1.0.0