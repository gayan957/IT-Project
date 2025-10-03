import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(true);
  const [collectionSaved, setCollectionSaved] = useState(false);
  const hasProcessedRef = useRef(false);
  const processingRef = useRef(false);

  // Extract payment details from URL parameters
  const orderId = searchParams.get('order_id');
  const amount = searchParams.get('amount');
  const actualWeight = searchParams.get('actualWeight');
  const wasteType = searchParams.get('wasteType');
  const scheduleId = searchParams.get('scheduleId');

  // Get agent info from localStorage
  const agentInfo = JSON.parse(localStorage.getItem("user") || "{}");

  // Create a unique identifier for this payment session
  const paymentSessionId = `${orderId}_${amount}_${actualWeight}_${scheduleId}`;

  // Check if this payment has already been processed
  const checkIfAlreadyProcessed = useCallback(() => {
    const processedPayments = JSON.parse(localStorage.getItem('processedPayments') || '[]');
    return processedPayments.includes(paymentSessionId);
  }, [paymentSessionId]);

  // Mark payment as processed
  const markAsProcessed = useCallback(() => {
    const processedPayments = JSON.parse(localStorage.getItem('processedPayments') || '[]');
    if (!processedPayments.includes(paymentSessionId)) {
      processedPayments.push(paymentSessionId);
      // Keep only last 50 processed payments to avoid localStorage bloat
      if (processedPayments.length > 50) {
        processedPayments.splice(0, processedPayments.length - 50);
      }
      localStorage.setItem('processedPayments', JSON.stringify(processedPayments));
    }
  }, [paymentSessionId]);

  // Helper function to save payment details to database
  const savePaymentDetails = useCallback(async (collectionData) => {
    try {
      const paymentData = {
        orderId: orderId,
        amount: parseFloat(amount),
        currency: 'LKR',
        wasteDetails: {
          wasteType: wasteType || 'mixed',
          actualWeight: parseFloat(actualWeight),
          pricePerKg: parseFloat(amount) / parseFloat(actualWeight),
          location: {
            address: collectionData.scheduleLocation?.address || "Payment processed location",
            latitude: collectionData.scheduleLocation?.latitude || 6.9271,
            longitude: collectionData.scheduleLocation?.longitude || 79.8612
          }
        },
        customerDetails: {
          firstName: agentInfo.name?.split(' ')[0] || 'Customer',
          lastName: agentInfo.name?.split(' ').slice(1).join(' ') || '',
          email: agentInfo.email || 'customer@example.com',
          phone: agentInfo.phone || '0712345678',
          address: collectionData.scheduleLocation?.address || "Payment location",
          city: 'Colombo',
          country: 'Sri Lanka'
        },
        agentId: agentInfo.id || null,
        scheduleId: scheduleId,
        notes: `Payment processed successfully via frontend. ${collectionData.notes || ''}`
      };

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(paymentData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Payment details saved to database:", result);
      } else {
        const errorData = await response.json();
        console.warn("Failed to save payment details:", errorData);
      }
    } catch (error) {
      console.warn("Error saving payment details:", error);
      // Don't throw error as this is supplementary functionality
    }
  }, [orderId, amount, actualWeight, scheduleId, wasteType, agentInfo.name, agentInfo.email, agentInfo.phone, agentInfo.id]);

  const saveCollectionData = useCallback(async () => {
    try {
      // Prevent multiple simultaneous processing
      if (processingRef.current || hasProcessedRef.current) {
        console.log("⚠️ Payment already being processed or completed, skipping...");
        setProcessing(false);
        setCollectionSaved(true);
        return;
      }

      // Check if this payment was already processed
      if (checkIfAlreadyProcessed()) {
        console.log("⚠️ Payment already processed, skipping duplicate save...");
        setProcessing(false);
        setCollectionSaved(true);
        return;
      }

      if (!orderId || !amount || !actualWeight || !scheduleId) {
        console.warn('Missing required payment data for collection saving');
        setProcessing(false);
        return;
      }

      // Set processing flags
      processingRef.current = true;
      hasProcessedRef.current = true;

      const pricePerKg = parseFloat(amount) / parseFloat(actualWeight);

      const collectionData = {
        scheduleId: scheduleId,
        wasteType: wasteType || 'mixed',
        actualWeight: parseFloat(actualWeight),
        pricePerKg: pricePerKg,
        totalPrice: parseFloat(amount),
        scheduleLocation: {
          latitude: 6.9271, // Default coordinates
          longitude: 79.8612,
          address: "Payment processed location",
        },
        notes: `Payment successful - Order ID: ${orderId}. Collection completed by ${
          agentInfo.name || "Agent"
        } on ${new Date().toLocaleDateString()}. Session: ${paymentSessionId}`,
        paymentOrderId: orderId,
        paymentStatus: 'completed'
      };

      console.log("🎯 Saving collection data after payment:", collectionData);

      // Check if this is mock data (for testing)
      const isMockData = scheduleId.length < 20 || !scheduleId.match(/^[0-9a-fA-F]{24}$/);

      if (isMockData) {
        // For mock data, just show success message
        console.log("✅ Mock schedule collection completed:", collectionData);
        toast.success(
          `Payment successful! Mock collection saved. Weight: ${actualWeight}kg, Total: Rs. ${amount}`
        );
        markAsProcessed();
        setCollectionSaved(true);
      } else {
        // Save real schedule collection data
        try {
          const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/agent-schedules/collect`;
          const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(collectionData),
          });

          if (!response.ok) {
            throw new Error("Failed to save schedule collection data");
          }

          const result = await response.json();
          console.log("✅ Schedule collection saved successfully:", result);

          // Also save payment details to database
          await savePaymentDetails(collectionData);

          // Mark as processed to prevent duplicates
          markAsProcessed();

          if (result.message) {
            toast.success(
              `Payment & Collection completed! Record ID: ${
                result.collection?._id?.slice(-6) || "Unknown"
              }`
            );
          } else {
            toast.success("Payment successful! Collection saved with warnings");
          }
          setCollectionSaved(true);
        } catch (apiError) {
          console.warn("Backend API not available, saving locally:", apiError);

          // Fallback: Save to local storage if API is not available
          const localCollections = JSON.parse(
            localStorage.getItem("localScheduleCollections") || "[]"
          );
          
          // Check for duplicates in local storage too
          const isDuplicate = localCollections.some(
            (collection) => collection.paymentOrderId === orderId
          );

          if (!isDuplicate) {
            const newCollection = {
              ...collectionData,
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
            };
            localCollections.push(newCollection);
            localStorage.setItem(
              "localScheduleCollections",
              JSON.stringify(localCollections)
            );

            // Still try to save payment details
            try {
              await savePaymentDetails(collectionData);
            } catch (paymentError) {
              console.warn("Could not save payment details:", paymentError);
            }

            markAsProcessed();
            toast.success("Payment successful! Collection saved locally");
          } else {
            console.log("⚠️ Duplicate found in local storage, skipping save");
            toast.info("Payment already processed");
          }

          setCollectionSaved(true);
        }
      }

      // Set flag to indicate schedule collection was completed for map refresh
      sessionStorage.setItem("refreshScheduleMap", "true");

    } catch (error) {
      console.error("Error saving collection after payment:", error);
      toast.error("Payment successful but failed to save collection data");
    } finally {
      processingRef.current = false;
      setProcessing(false);
    }
  }, [orderId, amount, actualWeight, scheduleId, wasteType, agentInfo.name, savePaymentDetails, paymentSessionId, checkIfAlreadyProcessed, markAsProcessed]);

  useEffect(() => {
    // Only run if we have payment data and haven't processed yet
    if (orderId && !collectionSaved && processing) {
      saveCollectionData();
    } else if (!orderId) {
      setProcessing(false);
    }
  }, [orderId, collectionSaved, processing, saveCollectionData]);

  // Auto-redirect to AgentPickups after successful processing
  useEffect(() => {
    if (collectionSaved && !processing) {
      const timer = setTimeout(() => {
        navigate('/agent-pickups');
      }, 3000); // 3 second delay to show success message

      return () => clearTimeout(timer);
    }
  }, [collectionSaved, processing, navigate]);

  if (processing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <div className="mx-auto h-24 w-24 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
              <svg className="h-12 w-12 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Processing Collection...
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Your payment was successful. We're now saving your collection data.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <div className="mx-auto h-24 w-24 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Payment & Collection Completed!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Your payment has been processed and waste collection data has been saved successfully.
          </p>
        </div>
        
        {/* Payment Details */}
        {orderId && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Collection Summary</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <div className="flex justify-between">
                <span>Order ID:</span>
                <span className="font-medium text-gray-900">#{orderId}</span>
              </div>
              {actualWeight && (
                <div className="flex justify-between">
                  <span>Weight Collected:</span>
                  <span className="font-medium text-gray-900">{actualWeight} kg</span>
                </div>
              )}
              {wasteType && (
                <div className="flex justify-between">
                  <span>Waste Type:</span>
                  <span className="font-medium text-gray-900 capitalize">{wasteType}</span>
                </div>
              )}
              {amount && (
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium">Total Paid:</span>
                  <span className="font-bold text-green-600">Rs. {amount}</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">What's Next?</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• Your collection has been automatically recorded</li>
            <li>• Payment confirmation email will be sent shortly</li>
            <li>• Collection data is updated in the system</li>
            <li>• You will be redirected to your pickups in 3 seconds</li>
          </ul>
        </div>
        
        <div className="flex flex-col space-y-3">
          <button
            onClick={() => navigate("/agent-pickups")}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            View My Pickups
          </button>
          <button
            onClick={() => navigate("/pickup-agent-map")}
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Back to Map
          </button>
          <button
            onClick={() => navigate("/pickup-agent/dashboard")}
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
