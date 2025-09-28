import React, { useState, useEffect } from 'react';
import { 
  getAllWastePrices, 
  updateWastePrice, 
  formatWasteTypeName,
  formatPrice,
  WASTE_TYPES 
} from '../lib/wastePriceApi.js';
import UserWastePriceReport from './UserWastePriceReport.jsx';
import { generateWastePriceReportPdf } from '../lib/wastePricePdfGenerator.js';

const AdminWastePrices = () => {
  const [wastePrices, setWastePrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [editingPrice, setEditingPrice] = useState({});
  const [showReport, setShowReport] = useState(false);
  const [generating, setGenerating] = useState(false);

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

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      
      if (!wastePrices || wastePrices.length === 0) {
        setError('No waste price data available to generate report');
        return;
      }

      await generateWastePriceReportPdf(wastePrices);
      setError(null);
    } catch (error) {
      console.error('Error generating report:', error);
      setError(`Failed to generate report: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleShowReportModal = () => {
    setShowReport(true);
  };

  const handleCloseReportModal = () => {
    setShowReport(false);
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
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Waste Price Management</h2>
            <p className="text-sm text-gray-600 mt-1">
              {wastePrices.length} of {WASTE_TYPES.length} waste types configured
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleShowReportModal}
              disabled={!wastePrices.length}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Report</span>
            </button>
          </div>
        </div>        {error && (
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
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {formatWasteTypeName(wasteType)}
                    </h3>
                    {priceData && priceData.isActive === false && (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
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
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>
                          Updated: {new Date(priceData.updatedAt).toLocaleDateString()}
                        </div>
                        {priceData.updatedBy && (
                          <div>
                            By: {priceData.updatedBy.name || priceData.updatedBy.email}
                          </div>
                        )}
                        {priceData.isActive === false && (
                          <div className="text-red-500 font-medium">
                            ⚠ Inactive
                          </div>
                        )}
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
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Waste Types & Instructions:</h3>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <h4 className="text-xs font-semibold text-gray-600 mb-1">Available Waste Types:</h4>
              <div className="text-xs text-gray-600 space-y-1">
                {WASTE_TYPES.map(type => (
                  <div key={type} className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>{formatWasteTypeName(type)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-600 mb-1">Quick Actions:</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Click "Edit Price" or "Set Price" to modify prices</li>
                <li>• All prices are visible to users and agents</li>
                <li>• Only administrators can modify these prices</li>
                <li>• Use "Report" to generate pricing summaries</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-7xl w-full max-h-screen overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">Waste Price Report</h3>
                <p className="text-sm text-gray-600 mt-1">Complete waste pricing details</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleGenerateReport}
                  disabled={generating}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>{generating ? 'Generating...' : 'Download PDF'}</span>
                </button>
                <button
                  onClick={handleCloseReportModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              <UserWastePriceReport wastePrices={wastePrices} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWastePrices;