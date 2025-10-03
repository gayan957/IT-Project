import crypto from "crypto";
import Payment from "../models/Payment.js";
import AgentSchedule from "../models/AgentSchedule.js";

export const GenerateHash = async (req, res) => {
  try {
    const { order_id, amount, currency } = req.body;

    // Validate required fields
    if (!order_id || !amount || !currency) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: order_id, amount, and currency are required",
      });
    }

    const MERCHANT_ID = process.env.PAYHERE_MERCHANT_ID;
    const MERCHANT_SECRET = process.env.PAYHERE_MERCHANT_SECRET;

    if (!MERCHANT_ID || !MERCHANT_SECRET) {
      console.error("PayHere credentials not configured");
      return res.status(500).json({
        success: false,
        message: "Payment gateway configuration error",
      });
    }

    const formattedAmount = Number(amount).toFixed(2);

    // Generate the hash
    const hash = crypto
      .createHash("md5")
      .update(
        `${MERCHANT_ID}${order_id}${formattedAmount}${currency}${crypto
          .createHash("md5")
          .update(MERCHANT_SECRET)
          .digest("hex")
          .toUpperCase()}`
      )
      .digest("hex")
      .toUpperCase();

    res.json({
      success: true,
      hash,
    });
  } catch (error) {
    console.error("Error generating hash:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate payment hash",
    });
  }
};

// After payment is successful, this function is called
export const PayhereNotification = async (req, res) => {
  try {
    const {
      merchant_id,
      order_id,
      payment_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
      method,
      status_message,
      custom_1,
      custom_2,
    } = req.body;

    const MERCHANT_SECRET = process.env.PAYHERE_MERCHANT_SECRET;

    if (!MERCHANT_SECRET) {
      console.error("PayHere merchant secret not configured");
      return res.status(500).json({
        success: false,
        message: "Payment gateway configuration error",
      });
    }

    const local_md5sig = crypto
      .createHash("md5")
      .update(
        `${merchant_id}${order_id}${payhere_amount}${payhere_currency}${status_code}${crypto
          .createHash("md5")
          .update(MERCHANT_SECRET)
          .digest("hex")
          .toUpperCase()}`
      )
      .digest("hex")
      .toUpperCase();

    // Verify the signature
    if (local_md5sig !== md5sig) {
      console.error("Invalid PayHere signature");
      return res.status(400).json({
        success: false,
        message: "Invalid payment notification",
      });
    }

    // Parse custom data
    let scheduleData = {};
    let wasteData = {};

    try {
      if (custom_1) {
        scheduleData = JSON.parse(custom_1);
      }
      if (custom_2) {
        wasteData = JSON.parse(custom_2);
      }
    } catch (parseError) {
      console.warn("Error parsing custom data:", parseError);
    }

    // Determine payment status
    let paymentStatus = 'pending';
    switch (Number(status_code)) {
      case 2:
        paymentStatus = 'success';
        break;
      case 0:
        paymentStatus = 'pending';
        break;
      case -1:
        paymentStatus = 'canceled';
        break;
      case -2:
        paymentStatus = 'failed';
        break;
      case -3:
        paymentStatus = 'chargedback';
        break;
    }

    // Create or update payment record
    let payment = await Payment.findOne({ orderId: order_id });
    
    if (!payment) {
      // Create new payment record
      payment = new Payment({
        orderId: order_id,
        paymentId: payment_id || order_id,
        merchantId: merchant_id,
        amount: parseFloat(payhere_amount),
        currency: payhere_currency,
        status: paymentStatus,
        statusCode: Number(status_code),
        statusMessage: status_message,
        md5Signature: md5sig,
        verified: true,
        
        // Waste collection details
        wasteDetails: {
          wasteType: wasteData.wastePrice?.wasteType || scheduleData.wasteType || 'mixed',
          actualWeight: parseFloat(wasteData.actualWeight) || 0,
          pricePerKg: wasteData.wastePrice?.pricePerKg || 0,
          location: {
            address: scheduleData.address || '',
            latitude: scheduleData.location?.lat || null,
            longitude: scheduleData.location?.lng || null
          }
        },
        
        // Customer details (from schedule data)
        customerDetails: {
          firstName: scheduleData.userName?.split(' ')[0] || '',
          lastName: scheduleData.userName?.split(' ').slice(1).join(' ') || '',
          email: scheduleData.userEmail || '',
          phone: scheduleData.userPhone || '',
          address: scheduleData.address || '',
          city: 'Colombo',
          country: 'Sri Lanka'
        },
        
        // Schedule reference
        scheduleId: scheduleData._id || null,
        
        // Payment method from PayHere
        paymentMethod: method || 'other',
        
        // Raw notification data for debugging
        rawNotificationData: req.body,
        
        // Set completion time for successful payments
        completedAt: paymentStatus === 'success' ? new Date() : null
      });
    } else {
      // Update existing payment record
      payment.paymentId = payment_id || payment.paymentId;
      payment.status = paymentStatus;
      payment.statusCode = Number(status_code);
      payment.statusMessage = status_message;
      payment.md5Signature = md5sig;
      payment.verified = true;
      payment.rawNotificationData = req.body;
      
      if (paymentStatus === 'success' && !payment.completedAt) {
        payment.completedAt = new Date();
      }
    }

    await payment.save();

    // Handle different payment statuses
    switch (Number(status_code)) {
      case 2: // Success
        console.log("Payment successful - saved to database:", {
          orderId: order_id,
          paymentId: payment_id,
          amount: payhere_amount,
          currency: payhere_currency,
          paymentDbId: payment._id
        });
        
        // If there's schedule data, also save the agent schedule collection
        if (scheduleData._id && wasteData.actualWeight) {
          try {
            await saveAgentScheduleCollection(payment, scheduleData, wasteData);
          } catch (scheduleError) {
            console.error("Error saving agent schedule collection:", scheduleError);
          }
        }
        break;

      case 0: // Pending
        console.log("Payment pending - saved to database:", order_id);
        break;

      case -1: // Canceled
        console.log("Payment canceled - saved to database:", order_id);
        break;

      case -2: // Failed
        console.log("Payment failed - saved to database:", order_id);
        break;

      case -3: // Chargedback
        console.log("Payment chargedback - saved to database:", order_id);
        break;

      default:
        console.warn("Unknown payment status - saved to database:", status_code);
    }

    res.json({ 
      success: true,
      message: "Payment notification processed successfully",
      paymentId: payment._id
    });
  } catch (error) {
    console.error("Error processing payment notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process payment notification",
    });
  }
};

// Helper function to save agent schedule collection
async function saveAgentScheduleCollection(payment, scheduleData, wasteData) {
  try {
    const collectionData = {
      scheduleId: scheduleData._id,
      wasteType: scheduleData.wasteType,
      actualWeight: parseFloat(wasteData.actualWeight),
      pricePerKg: wasteData.wastePrice?.pricePerKg || payment.amount / parseFloat(wasteData.actualWeight),
      totalPrice: payment.amount,
      scheduleLocation: {
        latitude: scheduleData.location?.lat || 6.9271,
        longitude: scheduleData.location?.lng || 79.8612,
        address: scheduleData.address || "Payment processed location",
      },
      notes: `Payment successful - Order ID: ${payment.orderId}. Collection completed via payment gateway on ${new Date().toLocaleDateString()}`,
      paymentOrderId: payment.orderId,
      paymentStatus: 'completed',
      paymentId: payment._id
    };

    const agentSchedule = new AgentSchedule(collectionData);
    await agentSchedule.save();

    // Link the agent schedule to the payment
    payment.agentScheduleId = agentSchedule._id;
    await payment.save();

    console.log("Agent schedule collection saved successfully:", agentSchedule._id);
    return agentSchedule;
  } catch (error) {
    console.error("Error in saveAgentScheduleCollection:", error);
    throw error;
  }
}

// Get payment history (admin or filtered by user)
export const getPaymentHistory = async (req, res) => {
  try {
    console.log('📊 getPaymentHistory called with query:', req.query);
    
    const { 
      page = 1, 
      limit = 20, 
      status, 
      startDate, 
      endDate,
      agentId 
    } = req.query;

    let query = {};
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }
    
    // Filter by date range if provided
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    // Filter by agent if provided
    if (agentId) {
      query.agentId = agentId;
    }

    console.log('📊 Query object:', query);

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    console.log('📊 Attempting to find payments...');
    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean(); // Use lean() to get plain objects and avoid populate issues

    console.log('📊 Found payments count:', payments.length);

    const total = await Payment.countDocuments(query);
    console.log('📊 Total payments count:', total);

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error("❌ Error fetching payment history:", error);
    console.error("❌ Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment history",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get payments for a specific agent
export const getAgentPayments = async (req, res) => {
  try {
    const { agentId } = req.params;
    const { 
      page = 1, 
      limit = 20, 
      status,
      startDate,
      endDate 
    } = req.query;

    const options = {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      status,
      startDate,
      endDate
    };

    const payments = await Payment.getAgentPaymentHistory(agentId, options);
    const total = await Payment.countDocuments({ agentId });

    // Calculate statistics
    const stats = await Payment.aggregate([
      { $match: { agentId: agentId } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          successfulPayments: {
            $sum: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] }
          },
          totalPayments: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        payments,
        statistics: stats[0] || {
          totalAmount: 0,
          successfulPayments: 0,
          totalPayments: 0
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error("Error fetching agent payments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch agent payments"
    });
  }
};

// Get payment by ID
export const getPaymentById = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId)
      .populate(['agentId', 'scheduleId', 'collectionId', 'agentScheduleId']);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error("Error fetching payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment details"
    });
  }
};

// Create payment record manually (for testing/admin purposes)
export const createPaymentRecord = async (req, res) => {
  try {
    const {
      orderId,
      amount,
      currency = 'LKR',
      wasteDetails,
      customerDetails,
      agentId,
      scheduleId,
      notes
    } = req.body;

    // Check if payment already exists
    const existingPayment = await Payment.findOne({ orderId });
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: "Payment with this order ID already exists"
      });
    }

    const payment = new Payment({
      orderId,
      paymentId: `manual_${orderId}`,
      merchantId: process.env.PAYHERE_MERCHANT_ID || 'manual',
      amount,
      currency,
      status: 'success',
      statusCode: 2,
      statusMessage: 'Manually created payment record',
      md5Signature: 'manual_creation',
      verified: true,
      wasteDetails,
      customerDetails,
      agentId,
      scheduleId,
      notes,
      completedAt: new Date(),
      rawNotificationData: { source: 'manual_creation', createdBy: req.user.id }
    });

    await payment.save();

    res.status(201).json({
      success: true,
      message: "Payment record created successfully",
      data: payment
    });
  } catch (error) {
    console.error("Error creating payment record:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create payment record"
    });
  }
};
