import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { RecyclerAPI } from '../lib/recyclerApi';

const OrderWasteModal = ({ isOpen, onClose, wasteItem, onOrderSuccess }) => {
  const [weight, setWeight] = useState('');
  const [quote, setQuote] = useState(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [errors, setErrors] = useState({});

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setWeight('');
      setQuote(null);
      setErrors({});
    }
  }, [isOpen]);

  // Validate weight input
  const validateWeight = (weightValue) => {
    const errors = {};
    const numWeight = parseFloat(weightValue);

    if (!weightValue) {
      errors.weight = 'Weight is required';
    } else if (isNaN(numWeight) || numWeight <= 0) {
      errors.weight = 'Please enter a valid positive weight';
    } else if (numWeight > wasteItem?.totalWeight) {
      errors.weight = `Maximum available weight is ${wasteItem.totalWeight}kg`;
    }

    return errors;
  };

  // Get price quote when weight changes
  const handleWeightChange = async (e) => {
    const newWeight = e.target.value;
    setWeight(newWeight);
    setQuote(null);
    setErrors({});

    if (!newWeight || parseFloat(newWeight) <= 0) return;

    const validationErrors = validateWeight(newWeight);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Get quote from API
    setIsLoadingQuote(true);
    try {
      const response = await RecyclerAPI.getOrderQuote(wasteItem._id, newWeight);
      if (response.success) {
        setQuote(response.data);
      } else {
        toast.error(response.error || 'Failed to get price quote');
        setErrors({ weight: response.error });
      }
    } catch (error) {
      console.error('Error getting quote:', error);
      toast.error('Failed to get price quote');
      setErrors({ weight: 'Failed to get price quote' });
    } finally {
      setIsLoadingQuote(false);
    }
  };

  // Handle order placement
  const handlePlaceOrder = async () => {
    const validationErrors = validateWeight(weight);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsPlacingOrder(true);
    try {
      const response = await RecyclerAPI.placeOrder(wasteItem._id, parseFloat(weight));
      if (response.success) {
        toast.success('Order placed successfully!');
        onOrderSuccess?.(response.data);
        onClose();
      } else {
        toast.error(response.error || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Get waste type info for styling
  const getWasteTypeInfo = (wasteType) => {
    const type = wasteType?.toLowerCase();
    switch (type) {
      case 'plastic':
        return {
          color: 'from-sky-400 to-sky-500',
          bgColor: 'from-sky-50/80 to-sky-100/80',
          icon: (
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-1.12.23-2.19.65-3.17L9 10.5V12c0 .55.45 1 1 1h1v1.5c0 .28.22.5.5.5s.5-.22.5-.5V13h1c.55 0 1-.45 1-1v-1.5l4.35-1.67c.42.98.65 2.05.65 3.17 0 4.41-3.59 8-8 8z"/>
            </svg>
          )
        };
      case 'metal':
        return {
          color: 'from-slate-400 to-slate-500',
          bgColor: 'from-slate-50/80 to-slate-100/80',
          icon: (
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7H14A7,7 0 0,1 21,14H22A1,1 0 0,1 23,15V18A1,1 0 0,1 22,19H21A7,7 0 0,1 14,26H10A7,7 0 0,1 3,19H2A1,1 0 0,1 1,18V15A1,1 0 0,1 2,14H3A7,7 0 0,1 10,7H11V5.73C10.4,5.39 10,4.74 10,4A2,2 0 0,1 12,2M12,4.5A0.5,0.5 0 0,0 11.5,5A0.5,0.5 0 0,0 12,5.5A0.5,0.5 0 0,0 12.5,5A0.5,0.5 0 0,0 12,4.5Z"/>
            </svg>
          )
        };
      case 'glass':
        return {
          color: 'from-emerald-400 to-emerald-500',
          bgColor: 'from-emerald-50/80 to-emerald-100/80',
          icon: (
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5,4V6H6V10A4,4 0 0,0 10,14V20A2,2 0 0,0 12,22A2,2 0 0,0 14,20V14A4,4 0 0,0 18,10V6H19V4H5M8,6H16V10A2,2 0 0,1 14,12H10A2,2 0 0,1 8,10V6Z"/>
            </svg>
          )
        };
      default:
        return {
          color: 'from-teal-400 to-teal-500',
          bgColor: 'from-teal-50/80 to-teal-100/80',
          icon: (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          )
        };
    }
  };

  if (!isOpen) return null;

  const wasteInfo = getWasteTypeInfo(wasteItem?.wasteType);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`bg-gradient-to-r ${wasteInfo.color} p-6 rounded-t-2xl relative`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              {wasteInfo.icon}
            </div>
            <div className="text-white">
              <h2 className="text-xl font-bold">Place Order</h2>
              <p className="text-white/90 text-sm capitalize">
                {wasteItem?.wasteType} Waste
              </p>
            </div>
          </div>
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Warehouse Info */}
          <div className={`bg-gradient-to-r ${wasteInfo.bgColor} p-4 rounded-xl border ${wasteInfo.borderColor || 'border-gray-200'}`}>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 block">Location</span>
                <span className="font-semibold">{wasteItem?.location || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-600 block">Available</span>
                <span className="font-semibold text-green-600">{wasteItem?.totalWeight} kg</span>
              </div>
            </div>
          </div>

          {/* Weight Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Desired Weight (kg) *
            </label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              max={wasteItem?.totalWeight}
              value={weight}
              onChange={handleWeightChange}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.weight ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter weight in kg"
            />
            {errors.weight && (
              <p className="text-red-500 text-sm mt-1">{errors.weight}</p>
            )}
          </div>

          {/* Price Quote */}
          {isLoadingQuote && (
            <div className="bg-gray-50 p-4 rounded-xl">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-600">Calculating price...</span>
              </div>
            </div>
          )}

          {quote && !isLoadingQuote && (
            <div className="bg-gradient-to-r from-green-50/80 to-green-100/80 border border-green-200/50 p-4 rounded-xl space-y-3">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Order Summary
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Weight:</span>
                  <span className="font-medium">{quote.weight} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rate:</span>
                  <span className="font-medium">Rs. {quote.pricePerKg.toFixed(2)}/kg</span>
                </div>
                <hr className="border-green-200" />
                <div className="flex justify-between text-lg font-bold text-green-700">
                  <span>Total Amount:</span>
                  <span>Rs. {quote.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handlePlaceOrder}
              disabled={!quote || isPlacingOrder || Object.keys(errors).length > 0}
              className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                !quote || isPlacingOrder || Object.keys(errors).length > 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : `bg-gradient-to-r ${wasteInfo.color} text-white hover:opacity-90`
              }`}
            >
              {isPlacingOrder ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  Pay & Order
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderWasteModal;