import crypto from "crypto";

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
    let userData = {};
    let customData = {};

    try {
      if (custom_1) {
        userData = JSON.parse(custom_1);
      }
      if (custom_2) {
        customData = JSON.parse(custom_2);
      }
    } catch (parseError) {
      console.warn("Error parsing custom data:", parseError);
    }

    // Handle different payment statuses
    switch (Number(status_code)) {
      case 2: // Success
        console.log("Payment successful:", {
          order_id,
          payment_id,
          amount: payhere_amount,
          currency: payhere_currency,
        });
        // TODO: Update your database here
        break;

      case 0: // Pending
        console.log("Payment pending:", order_id);
        break;

      case -1: // Canceled
        console.log("Payment canceled:", order_id);
        break;

      case -2: // Failed
        console.log("Payment failed:", order_id);
        break;

      case -3: // Chargedback
        console.log("Payment chargedback:", order_id);
        break;

      default:
        console.warn("Unknown payment status:", status_code);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error processing payment notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process payment notification",
    });
  }
};
