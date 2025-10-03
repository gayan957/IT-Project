import crypto from 'crypto';
import fetch from 'node-fetch';

/**
 * PayHere Service for handling PayHere API operations
 */
class PayHereService {
  constructor() {
    this.merchantId = process.env.PAYHERE_MERCHANT_ID;
    this.merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
    this.apiUrl = process.env.PAYHERE_API_URL || 'https://sandbox.payhere.lk/merchant/v1';
    this.apiUsername = process.env.PAYHERE_API_USERNAME;
    this.apiPassword = process.env.PAYHERE_API_PASSWORD;
  }

  /**
   * Generate MD5 hash for PayHere payment
   */
  generatePaymentHash(orderId, amount, currency = 'LKR') {
    const hashString = `${this.merchantId}${orderId}${amount}${currency}${crypto.createHash('md5').update(this.merchantSecret).digest('hex').toUpperCase()}`;
    return crypto.createHash('md5').update(hashString).digest('hex').toUpperCase();
  }

  /**
   * Verify PayHere webhook signature
   */
  verifyWebhookSignature(orderId, paymentId, amount, currency, statusCode, receivedHash) {
    const localHash = crypto
      .createHash('md5')
      .update(`${this.merchantId}${orderId}${amount}${currency}${statusCode}${crypto.createHash('md5').update(this.merchantSecret).digest('hex').toUpperCase()}`)
      .digest('hex')
      .toUpperCase();
    
    return localHash === receivedHash;
  }

  /**
   * Get payment status from PayHere API
   */
  async getPaymentStatus(orderId) {
    try {
      const auth = Buffer.from(`${this.apiUsername}:${this.apiPassword}`).toString('base64');
      
      const response = await fetch(`${this.apiUrl}/payments/${orderId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`PayHere API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('Error fetching payment status from PayHere:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process refund via PayHere API
   */
  async processRefund(orderId, amount, reason) {
    try {
      const auth = Buffer.from(`${this.apiUsername}:${this.apiPassword}`).toString('base64');
      
      const refundData = {
        order_id: orderId,
        amount: amount,
        reason: reason || 'Customer request'
      };

      const response = await fetch(`${this.apiUrl}/refunds`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(refundData)
      });

      if (!response.ok) {
        throw new Error(`PayHere refund API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('Error processing refund via PayHere:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get merchant transaction summary
   */
  async getTransactionSummary(startDate, endDate) {
    try {
      const auth = Buffer.from(`${this.apiUsername}:${this.apiPassword}`).toString('base64');
      
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate
      });

      const response = await fetch(`${this.apiUrl}/transactions?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`PayHere API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('Error fetching transaction summary from PayHere:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate PayHere configuration
   */
  validateConfiguration() {
    const required = [
      'PAYHERE_MERCHANT_ID',
      'PAYHERE_MERCHANT_SECRET'
    ];

    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing PayHere configuration: ${missing.join(', ')}`);
    }

    return true;
  }

  /**
   * Format payment data for PayHere checkout
   */
  formatPaymentData(orderDetails) {
    return {
      merchant_id: this.merchantId,
      return_url: process.env.FRONTEND_SUCCESS_URL || 'http://localhost:5173/payment-success',
      cancel_url: process.env.FRONTEND_CANCEL_URL || 'http://localhost:5173/collect-schedule-waste',
      notify_url: `${process.env.API_BASE_URL || 'http://localhost:3000'}/api/payment/notify`,
      order_id: orderDetails.order_id,
      items: orderDetails.items || 'Waste Collection Payment',
      currency: orderDetails.currency || 'LKR',
      amount: orderDetails.amount,
      first_name: orderDetails.first_name,
      last_name: orderDetails.last_name,
      email: orderDetails.email,
      phone: orderDetails.phone,
      address: orderDetails.address,
      city: orderDetails.city || 'Colombo',
      country: orderDetails.country || 'Sri Lanka',
      custom_1: orderDetails.custom_1,
      custom_2: orderDetails.custom_2
    };
  }

  /**
   * Calculate PayHere transaction fees
   */
  calculateTransactionFee(amount, paymentMethod = 'CARD') {
    // PayHere fee structure (as of 2024)
    let percentageFee = 0;
    let fixedFee = 0;

    switch (paymentMethod.toLowerCase()) {
      case 'visa':
      case 'mastercard':
      case 'amex':
      case 'card':
        percentageFee = 0.035; // 3.5%
        fixedFee = 5.00; // LKR 5.00
        break;
      case 'bank_transfer':
        percentageFee = 0.015; // 1.5%
        fixedFee = 2.00; // LKR 2.00
        break;
      case 'mobile':
        percentageFee = 0.025; // 2.5%
        fixedFee = 3.00; // LKR 3.00
        break;
      default:
        percentageFee = 0.035;
        fixedFee = 5.00;
    }

    const fee = (amount * percentageFee) + fixedFee;
    const netAmount = amount - fee;

    return {
      totalAmount: amount,
      transactionFee: fee,
      netAmount: netAmount,
      feePercentage: percentageFee * 100
    };
  }
}

// Create singleton instance
const payHereService = new PayHereService();

export default payHereService;