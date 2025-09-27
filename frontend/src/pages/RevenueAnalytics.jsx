import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../lib/api';

const RevenueAnalytics = () => {
  const [orderWasteData, setOrderWasteData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, this-month, last-month, this-year
  const [revenueStats, setRevenueStats] = useState({
    totalServiceCharge: 0,
    totalOrderValue: 0,
    totalOrders: 0,
    avgServiceCharge: 0,
    wasteTypeBreakdown: {}
  });

  useEffect(() => {
    fetchOrderWasteData();
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchOrderWasteData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/waste-orders', {
        params: { filter }
      });
      
      if (response.data.success) {
        const orders = response.data.data || [];
        setOrderWasteData(orders);
        calculateRevenueStats(orders);
      }
    } catch (error) {
      console.error('Error fetching order waste data:', error);
      toast.error('Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  };

  const calculateRevenueStats = (orders) => {
    const stats = {
      totalServiceCharge: 0,
      totalOrderValue: 0,
      totalOrders: orders.length,
      avgServiceCharge: 0,
      wasteTypeBreakdown: {}
    };

    orders.forEach(order => {
      const serviceCharge = order.adminTaxAmount || 0;
      const orderValue = order.totalOrderValue || 0;
      const wasteType = order.wasteWarehouseId?.wasteType || order.meta?.wasteType || 'Unknown';

      stats.totalServiceCharge += serviceCharge;
      stats.totalOrderValue += orderValue;

      if (!stats.wasteTypeBreakdown[wasteType]) {
        stats.wasteTypeBreakdown[wasteType] = {
          count: 0,
          serviceCharge: 0,
          totalValue: 0
        };
      }

      stats.wasteTypeBreakdown[wasteType].count += 1;
      stats.wasteTypeBreakdown[wasteType].serviceCharge += serviceCharge;
      stats.wasteTypeBreakdown[wasteType].totalValue += orderValue;
    });

    stats.avgServiceCharge = stats.totalOrders > 0 ? stats.totalServiceCharge / stats.totalOrders : 0;
    setRevenueStats(stats);
  };

  const formatCurrency = (amount) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      approved: { color: 'bg-blue-100 text-blue-800', text: 'Approved' },
      completed: { color: 'bg-green-100 text-green-800', text: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800', text: 'Cancelled' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  // Prepare data for pie chart
  const pieChartData = Object.entries(revenueStats.wasteTypeBreakdown).map(([wasteType, data]) => ({
    name: wasteType.charAt(0).toUpperCase() + wasteType.slice(1),
    value: data.serviceCharge,
    percentage: revenueStats.totalServiceCharge > 0 ? (data.serviceCharge / revenueStats.totalServiceCharge * 100) : 0
  }));

  const colors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading revenue analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Revenue Analytics</h1>
        <p className="text-gray-600">Track service charges and revenue from waste orders</p>
      </div>

      {/* Filter Controls */}
      <div className="mb-6 flex items-center space-x-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        >
          <option value="all">All Time</option>
          <option value="this-month">This Month</option>
          <option value="last-month">Last Month</option>
          <option value="this-year">This Year</option>
        </select>
        <button
          onClick={fetchOrderWasteData}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          Refresh Data
        </button>
      </div>

      {/* Revenue Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-emerald-100 mr-4">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Service Charge</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(revenueStats.totalServiceCharge)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 mr-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Order Value</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(revenueStats.totalOrderValue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 mr-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-semibold text-gray-900">{revenueStats.totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 mr-4">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Service Charge</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(revenueStats.avgServiceCharge)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Table Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Pie Chart */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Charge by Waste Type</h3>
            <div className="relative">
              {/* Simple SVG Pie Chart */}
              <div className="w-64 h-64 mx-auto">
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  {pieChartData.length > 0 ? (
                    (() => {
                      let cumulativePercentage = 0;
                      return pieChartData.map((data, index) => {
                        const startAngle = cumulativePercentage * 3.6; // Convert percentage to degrees
                        const endAngle = (cumulativePercentage + data.percentage) * 3.6;
                        cumulativePercentage += data.percentage;

                        const startAngleRad = (startAngle - 90) * Math.PI / 180;
                        const endAngleRad = (endAngle - 90) * Math.PI / 180;

                        const largeArcFlag = data.percentage > 50 ? 1 : 0;

                        const x1 = 100 + 80 * Math.cos(startAngleRad);
                        const y1 = 100 + 80 * Math.sin(startAngleRad);
                        const x2 = 100 + 80 * Math.cos(endAngleRad);
                        const y2 = 100 + 80 * Math.sin(endAngleRad);

                        const pathData = [
                          `M 100 100`,
                          `L ${x1} ${y1}`,
                          `A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                          'Z'
                        ].join(' ');

                        return (
                          <path
                            key={index}
                            d={pathData}
                            fill={colors[index % colors.length]}
                            stroke="#fff"
                            strokeWidth="2"
                          />
                        );
                      });
                    })()
                  ) : (
                    <circle cx="100" cy="100" r="80" fill="#e5e7eb" />
                  )}
                </svg>
              </div>
              
              {/* Legend */}
              <div className="mt-4 space-y-2">
                {pieChartData.map((data, index) => (
                  <div key={index} className="flex items-center text-sm">
                    <div 
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: colors[index % colors.length] }}
                    ></div>
                    <span className="text-gray-600">{data.name}</span>
                    <span className="ml-auto font-medium">
                      {formatCurrency(data.value)} ({data.percentage.toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* OrderWaste Table */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Waste Orders & Service Charges</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Order ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Waste Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Weight (kg)</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Service Charge</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Total Value</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orderWasteData.length > 0 ? (
                    orderWasteData.slice(0, 10).map((order) => (
                      <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="font-mono text-sm text-gray-600">
                            {order._id?.slice(-6)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="capitalize font-medium">
                            {order.wasteWarehouseId?.wasteType || order.meta?.wasteType || 'Unknown'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-gray-900">
                            {order.weight || 0}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-emerald-600">
                            {formatCurrency(order.adminTaxAmount || 0)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-blue-600">
                            {formatCurrency(order.totalOrderValue || 0)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(order.orderStatus)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatDate(order.createdAt)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-gray-500">
                        No waste orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {orderWasteData.length > 10 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500">
                  Showing 10 of {orderWasteData.length} orders
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueAnalytics;