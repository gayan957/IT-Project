import React, { useState, useEffect } from 'react';
import { 
  getAllWastePrices, 
  updateWastePrice, 
  initializeDefaultPrices,
  formatWasteTypeName,
  formatPrice,
  WASTE_TYPES 
} from '../lib/wastePriceApi.js';

const AdminWastePrices = () => {
  const [wastePrices, setWastePrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [editingPrice, setEditingPrice] = useState({});

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
      setError('Failed to load waste prices. Make sure the backend server is running.');
      // Set empty array so admin can still use the interface
      setWastePrices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeDefaults = async () => {
    try {
      setUpdating('initialize');
      const token = localStorage.getItem('token');
      await initializeDefaultPrices(token);
      await fetchWastePrices();
      setError(null);
    } catch (error) {
      console.error('Error initializing defaults:', error);
      setError('Failed to initialize default prices');
    } finally {
      setUpdating(null);
    }
  };

  const handlePriceEdit = (wasteType, currentPrice) => {
    setEditingPrice({
      ...editingPrice,
      [wasteType]: currentPrice
    });
  };

  const handlePriceUpdate = async (wasteType) => {
    try {
      setUpdating(wasteType);
      const token = localStorage.getItem('token');
      const newPrice = parseFloat(editingPrice[wasteType]);
      
      if (isNaN(newPrice) || newPrice < 0) {
        setError('Please enter a valid price');
        return;
      }

      await updateWastePrice(wasteType, newPrice, token);
      await fetchWastePrices();
      
      // Clear editing state
      const updatedEditing = { ...editingPrice };
      delete updatedEditing[wasteType];
      setEditingPrice(updatedEditing);
      setError(null);
    } catch (error) {
      console.error('Error updating price:', error);
      setError(`Failed to update price for ${formatWasteTypeName(wasteType)}`);
    } finally {
      setUpdating(null);
    }
  };

  const handleCancelEdit = (wasteType) => {
    const updatedEditing = { ...editingPrice };
    delete updatedEditing[wasteType];
    setEditingPrice(updatedEditing);
  };

  const isEditing = (wasteType) => {
    return wasteType in editingPrice;
  };

  const getWastePriceByType = (wasteType) => {
    return wastePrices.find(price => price.wasteType === wasteType);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Waste Price Management</h2>
          <button
            onClick={handleInitializeDefaults}
            disabled={updating === 'initialize'}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {updating === 'initialize' ? 'Initializing...' : 'Initialize Defaults'}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {WASTE_TYPES.map((wasteType) => {
            const priceData = getWastePriceByType(wasteType);
            const editing = isEditing(wasteType);
            
            return (
              <div
                key={wasteType}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-800 capitalize">
                    {formatWasteTypeName(wasteType)}
                  </h3>
                  <span className="text-sm text-gray-500">per kg</span>
                </div>

                {editing ? (
                  <div className="space-y-3">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingPrice[wasteType] || ''}
                      onChange={(e) => setEditingPrice({
                        ...editingPrice,
                        [wasteType]: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter price"
                      autoFocus
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handlePriceUpdate(wasteType)}
                        disabled={updating === wasteType}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                      >
                        {updating === wasteType ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => handleCancelEdit(wasteType)}
                        disabled={updating === wasteType}
                        className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-2xl font-bold text-green-600">
                      {priceData ? formatPrice(priceData.pricePerKg) : 'Not Set'}
                    </div>
                    
                    {priceData && (
                      <div className="text-xs text-gray-500">
                        Updated: {new Date(priceData.updatedAt).toLocaleDateString()}
                      </div>
                    )}
                    
                    <button
                      onClick={() => handlePriceEdit(wasteType, priceData?.pricePerKg || '')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                    >
                      {priceData ? 'Edit Price' : 'Set Price'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Instructions:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Click "Edit Price" or "Set Price" to modify the price per kilogram for each waste type</li>
            <li>• Click "Initialize Defaults" to set up default prices for all waste types</li>
            <li>• All prices are visible to pickup agents, partners, and users (read-only)</li>
            <li>• Only administrators can modify these prices</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminWastePrices;