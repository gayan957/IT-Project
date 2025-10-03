"use client";
import React, { useState } from "react";
import { toast } from "react-hot-toast";

const PayHereForm = ({ orderDetails, actualWeight, wastePrice }) => {
  const [hash, setHash] = useState("");
  const [loading, setLoading] = useState(false);
  const formRef = React.useRef(null);

  const merchant_id = import.meta.env.VITE_PAYHERE_MERCHANT_ID;

  const generateHash = async () => {
    try {
      setLoading(true);
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/payment/hash`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          order_id: orderDetails.order_id,
          amount: orderDetails.amount,
          currency: orderDetails.currency,
        }),
      });

      const data = await response.json();

      if (response.ok && data.hash) {
        setHash(data.hash);

        return data.hash;
      } else {
        throw new Error(data.message || "Failed to generate hash");
      }
    } catch (error) {
      toast.error("Failed to initialize payment. Please try again.");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!actualWeight || parseFloat(actualWeight) <= 0) {
      toast.error("Please enter a valid weight");
      return;
    }

    if (!wastePrice) {
      toast.error("Please wait for price calculation");
      return;
    }

    if (orderDetails.amount <= 0) {
      toast.error("Total amount cannot be zero");
      return;
    }

    try {
      const generatedHash = await generateHash();
      if (generatedHash && formRef.current) {
        const hashInput = formRef.current.querySelector('input[name="hash"]');
        if (hashInput) {
          hashInput.value = generatedHash;
        }

        const formData = new FormData(formRef.current);
        for (let [key, value] of formData.entries()) {
          console.log(`${key}: ${value}`);
        }

        formRef.current.submit();
      }
    } catch (error) {
      console.error("Payment initialization failed:", error);
    }
  };

  return (
    <form
      ref={formRef}
      id="payhere-form"
      method="post"
      action="https://sandbox.payhere.lk/pay/checkout"
      onSubmit={handleSubmit}
    >
      <input type="hidden" name="merchant_id" value={merchant_id} />
      <input
        type="hidden"
        name="return_url"
        value={`http://localhost:5173/payment-success?order_id=${orderDetails.order_id}&amount=${orderDetails.amount}&actualWeight=${actualWeight}&wasteType=${orderDetails.custom_1.wasteType}&scheduleId=${orderDetails.custom_1._id}`}
      />
      <input
        type="hidden"
        name="cancel_url"
        value="http://localhost:5173/collect-schedule-waste"
      />
      <input
        type="hidden"
        name="notify_url"
        value={`${import.meta.env.VITE_API_BASE_URL}/api/payment/notify`}
      />
      <input type="hidden" name="order_id" value={orderDetails.order_id} />
      <input type="hidden" name="items" value="Waste Collection Payment" />
      <input type="hidden" name="currency" value={orderDetails.currency} />
      <input type="hidden" name="amount" value={orderDetails.amount} />
      <input type="hidden" name="hash" value={hash} />

      {/* Customer Information */}
      <input type="hidden" name="first_name" value={orderDetails.first_name} />
      <input type="hidden" name="last_name" value={orderDetails.last_name} />
      <input type="hidden" name="email" value={orderDetails.email} />
      <input type="hidden" name="phone" value={orderDetails.phone} />
      <input type="hidden" name="address" value={orderDetails.address} />
      <input type="hidden" name="city" value={orderDetails.city} />
      <input type="hidden" name="country" value={orderDetails.country} />

      {/* Additional Information */}
      <input
        type="hidden"
        name="custom_1"
        value={JSON.stringify(orderDetails.custom_1)}
      />
      <input
        type="hidden"
        name="custom_2"
        value={JSON.stringify({actualWeight, wastePrice})}
      />

      <button
        type="submit"
        disabled={!actualWeight || !wastePrice || loading}
        className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
      >
        {loading ? "Initializing Payment..." : "Pay Now"}
      </button>
    </form>
  );
};

export default PayHereForm;
