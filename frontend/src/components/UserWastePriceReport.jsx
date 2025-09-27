import React, { forwardRef } from 'react';
import { formatWasteTypeName, formatPrice } from '../lib/wastePriceApi.js';

// Waste Price Report Display Component
const UserWastePriceReport = forwardRef(({ wastePrices }, ref) => {
  console.log('UserWastePriceReport rendered with data:', wastePrices);
  
  if (!wastePrices || wastePrices.length === 0) {
    return (
      <div ref={ref} className="bg-white p-8 max-w-6xl mx-auto">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Waste Price Data</h2>
          <p className="text-gray-600">No waste price information available to display.</p>
        </div>
      </div>
    );
  }

  // Sort waste prices for consistent display
  const sortedPrices = [...wastePrices].sort((a, b) => a.wasteType.localeCompare(b.wasteType));
  
  // Calculate statistics
  const activePrices = wastePrices.filter(p => p.isActive !== false);
  const totalValue = wastePrices.reduce((sum, p) => sum + (p.pricePerKg || 0), 0);
  const avgPrice = totalValue / wastePrices.length;
  
  // Categorize prices
  const highValue = sortedPrices.filter(p => p.pricePerKg > 20);
  const mediumValue = sortedPrices.filter(p => p.pricePerKg >= 10 && p.pricePerKg <= 20);
  const lowValue = sortedPrices.filter(p => p.pricePerKg < 10);

  return (
    <div ref={ref} className="bg-white p-8 max-w-6xl mx-auto" style={{ minHeight: '1000px' }}>
      {/* Header */}
      <div className="border-b-2 border-gray-200 pb-6 mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">TRASH2CASH</h1>
            <p className="text-gray-600">Waste Management Solutions</p>
            <p className="text-sm text-gray-500 mt-1">Smart • Sustainable • Profitable</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-semibold text-gray-800 mb-1">WASTE PRICE REPORT</h2>
            <p className="text-sm text-gray-600">Generated: {new Date().toLocaleDateString('en-GB')}</p>
            <p className="text-sm text-gray-600">Total Types: {wastePrices.length}</p>
          </div>
        </div>
      </div>

      {/* Report Summary */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">Report Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{activePrices.length}</div>
            <p className="text-sm text-gray-600">Active Price Types</p>
            <p className="text-xs text-gray-500">of {wastePrices.length} total</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{formatPrice(avgPrice)}</div>
            <p className="text-sm text-gray-600">Average Price</p>
            <p className="text-xs text-gray-500">across all types</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">Complete</div>
            <p className="text-sm text-gray-600">Report Status</p>
            <p className="text-xs text-gray-500">all data included</p>
          </div>
        </div>
      </div>

      {/* Detailed Waste Prices Table */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Detailed Waste Prices</h3>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Waste Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price/kg
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated By
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedPrices.map((price, index) => (
                  <tr key={price.wasteType} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatWasteTypeName(price.wasteType)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-semibold ${
                        price.pricePerKg > 20 ? 'text-green-600' : 
                        price.pricePerKg > 10 ? 'text-blue-600' : 'text-gray-600'
                      }`}>
                        {formatPrice(price.pricePerKg)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        price.isActive === false ? 
                        'bg-red-100 text-red-800' : 
                        'bg-green-100 text-green-800'
                      }`}>
                        {price.isActive === false ? 'Inactive' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(price.updatedAt || new Date()).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {price.updatedBy?.name || price.updatedBy?.email || 'System'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Price Categories */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Price Categories</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* High Value */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-green-700 mb-3">High Value</h4>
            <p className="text-sm text-green-600 mb-4">&gt; Rs. 20/kg</p>
            <div className="space-y-2">
              {highValue.map(item => (
                <div key={item.wasteType} className="flex justify-between text-sm">
                  <span className="text-gray-700">{formatWasteTypeName(item.wasteType)}</span>
                  <span className="font-semibold text-green-600">{formatPrice(item.pricePerKg)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Medium Value */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-blue-700 mb-3">Medium Value</h4>
            <p className="text-sm text-blue-600 mb-4">Rs. 10-20/kg</p>
            <div className="space-y-2">
              {mediumValue.map(item => (
                <div key={item.wasteType} className="flex justify-between text-sm">
                  <span className="text-gray-700">{formatWasteTypeName(item.wasteType)}</span>
                  <span className="font-semibold text-blue-600">{formatPrice(item.pricePerKg)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Low Value */}
          <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-red-700 mb-3">Low Value</h4>
            <p className="text-sm text-red-600 mb-4">&lt; Rs. 10/kg</p>
            <div className="space-y-2">
              {lowValue.map(item => (
                <div key={item.wasteType} className="flex justify-between text-sm">
                  <span className="text-gray-700">{formatWasteTypeName(item.wasteType)}</span>
                  <span className="font-semibold text-red-600">{formatPrice(item.pricePerKg)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t-2 border-gray-200 pt-6 text-center text-sm text-gray-500">
        <div className="mb-2">
          <strong>TRASH2CASH</strong> | Waste Management Solutions | admin@trash2cash.com | +94 11 234 5678
        </div>
        <p>This report is computer-generated and contains current waste pricing information.</p>
        <p className="mt-2">For pricing inquiries, please contact the administration department.</p>
      </div>
    </div>
  );
});

UserWastePriceReport.displayName = 'UserWastePriceReport';

export default UserWastePriceReport;