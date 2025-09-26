import React, { useState, useEffect } from 'react';
import { 
  getAllWastePrices, 
  formatWasteTypeName,
  formatPrice,
  WASTE_TYPES 
} from '../lib/wastePriceApi.js';

const WastePriceDisplay = ({ showTitle = true, compact = false }) => {
  const [wastePrices, setWastePrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWastePrices();
  }, []);

  const fetchWastePrices = async () => {
    try {
      setLoading(true);
      const prices = await getAllWastePrices();
      setWastePrices(prices.data || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching waste prices:', error);
      setError('Failed to load waste prices');
      // Set default/mock data if API fails for demo purposes
      setWastePrices([
        { wasteType: 'organic', pricePerKg: 5.00, updatedAt: new Date() },
        { wasteType: 'plastic', pricePerKg: 15.00, updatedAt: new Date() },
        { wasteType: 'paper', pricePerKg: 8.00, updatedAt: new Date() },
        { wasteType: 'glass', pricePerKg: 3.00, updatedAt: new Date() },
        { wasteType: 'metal', pricePerKg: 25.00, updatedAt: new Date() },
        { wasteType: 'electronic', pricePerKg: 40.00, updatedAt: new Date() },
        { wasteType: 'mixed', pricePerKg: 6.00, updatedAt: new Date() },
        { wasteType: 'other', pricePerKg: 4.00, updatedAt: new Date() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getWastePriceByType = (wasteType) => {
    const priceData = wastePrices.find(price => price.wasteType === wasteType);
    return priceData || null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (compact) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4">
        {showTitle && (
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Current Waste Prices</h3>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {WASTE_TYPES.map((wasteType) => {
            const priceData = getWastePriceByType(wasteType);
            return (
              <div key={wasteType} className="text-center">
                <div className="text-sm font-medium text-gray-600 capitalize">
                  {formatWasteTypeName(wasteType)}
                </div>
                <div className="text-lg font-bold text-green-600">
                  {priceData ? formatPrice(priceData.pricePerKg) : 'N/A'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {showTitle && (
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Current Waste Prices</h2>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {WASTE_TYPES.map((wasteType) => {
          const priceData = getWastePriceByType(wasteType);
          
          return (
            <div
              key={wasteType}
              className="border border-gray-200 rounded-lg p-4 text-center hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-center mb-2">
                <h3 className="text-lg font-semibold text-gray-800 capitalize">
                  {formatWasteTypeName(wasteType)}
                </h3>
              </div>

              <div className="text-2xl font-bold text-green-600 mb-1">
                {priceData ? formatPrice(priceData.pricePerKg) : 'Not Set'}
              </div>
              
              <div className="text-sm text-gray-500">per kilogram</div>
              
              {priceData && (
                <div className="text-xs text-gray-400 mt-2">
                  Updated: {new Date(priceData.updatedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              These prices are used to calculate the value of collected waste. 
              Prices are updated by administrators and may vary based on market conditions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WastePriceDisplay;