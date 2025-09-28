import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getAllWasteOrders, getWasteOrderStats } from '../lib/adminWasteOrdersApi';

const RevenueAnalytics = () => {
  const [orderWasteData, setOrderWasteData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, this-month, last-month, this-year
  const [searchTerm, setSearchTerm] = useState('');
  const [revenueStats, setRevenueStats] = useState({
    totalServiceCharge: 0,
    totalOrderValue: 0,
    totalOrders: 0,
    avgServiceCharge: 0,
    wasteTypeBreakdown: {}
  });
  const [overallStats, setOverallStats] = useState({});

  useEffect(() => {
    fetchOrderWasteData();
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyDateFilter = (orders, filterType) => {
    if (filterType === 'all') return orders;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      const orderYear = orderDate.getFullYear();
      const orderMonth = orderDate.getMonth();

      switch (filterType) {
        case 'this-month':
          return orderYear === currentYear && orderMonth === currentMonth;
        case 'last-month': {
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          return orderYear === lastMonthYear && orderMonth === lastMonth;
        }
        case 'this-year':
          return orderYear === currentYear;
        default:
          return true;
      }
    });
  };

  // Filter orders based on search term
  const filteredOrderWasteData = orderWasteData.filter(order => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Search in recycler name, email, company name
    const recyclerMatch = 
      order.recyclerId?.name?.toLowerCase().includes(searchLower) ||
      order.recyclerId?.email?.toLowerCase().includes(searchLower) ||
      order.recyclerId?.companyName?.toLowerCase().includes(searchLower);
    
    // Search in waste type
    const wasteTypeMatch = 
      order.wasteWarehouseId?.wasteType?.toLowerCase().includes(searchLower) ||
      order.meta?.wasteType?.toLowerCase().includes(searchLower);
    
    // Search in order ID (last 6 characters)
    const orderIdMatch = order._id?.slice(-6).toLowerCase().includes(searchLower);
    
    // Search in status
    const statusMatch = order.orderStatus?.toLowerCase().includes(searchLower);
    
    return recyclerMatch || wasteTypeMatch || orderIdMatch || statusMatch;
  });

  const fetchOrderWasteData = async () => {
    try {
      setLoading(true);
      
      // Fetch both orders and statistics
      const [ordersResponse, statsResponse] = await Promise.all([
        getAllWasteOrders(1, 1000, 'all'),
        getWasteOrderStats()
      ]);
      
      if (ordersResponse.success) {
        let orders = ordersResponse.data.orders || [];
        
        // Apply client-side filtering based on the selected filter
        orders = applyDateFilter(orders, filter);
        
        setOrderWasteData(orders);
        calculateRevenueStats(orders);
      } else {
        toast.error(ordersResponse.error || 'Failed to load revenue data');
      }

      if (statsResponse.success) {
        setOverallStats(statsResponse.data || {});
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
      wasteTypeBreakdown: {},
      statusBreakdown: {
        pending: 0,
        approved: 0,
        completed: 0,
        cancelled: 0
      },
      recyclerBreakdown: {}
    };

    orders.forEach(order => {
      const serviceCharge = order.adminTaxAmount || 0;
      const orderValue = order.totalOrderValue || 0;
      const wasteType = order.wasteWarehouseId?.wasteType || order.meta?.wasteType || 'Unknown';
      const status = order.orderStatus || 'pending';
      const recyclerName = order.recyclerId?.companyName || order.recyclerId?.name || 'Unknown';

      stats.totalServiceCharge += serviceCharge;
      stats.totalOrderValue += orderValue;

      // Waste type breakdown
      if (!stats.wasteTypeBreakdown[wasteType]) {
        stats.wasteTypeBreakdown[wasteType] = {
          count: 0,
          serviceCharge: 0,
          totalValue: 0,
          weight: 0
        };
      }

      stats.wasteTypeBreakdown[wasteType].count += 1;
      stats.wasteTypeBreakdown[wasteType].serviceCharge += serviceCharge;
      stats.wasteTypeBreakdown[wasteType].totalValue += orderValue;
      stats.wasteTypeBreakdown[wasteType].weight += (order.weight || 0);

      // Status breakdown
      if (stats.statusBreakdown[status] !== undefined) {
        stats.statusBreakdown[status] += 1;
      }

      // Recycler breakdown
      if (!stats.recyclerBreakdown[recyclerName]) {
        stats.recyclerBreakdown[recyclerName] = {
          count: 0,
          serviceCharge: 0,
          totalValue: 0
        };
      }

      stats.recyclerBreakdown[recyclerName].count += 1;
      stats.recyclerBreakdown[recyclerName].serviceCharge += serviceCharge;
      stats.recyclerBreakdown[recyclerName].totalValue += orderValue;
    });

    stats.avgServiceCharge = stats.totalOrders > 0 ? stats.totalServiceCharge / stats.totalOrders : 0;
    setRevenueStats(stats);
  };

  const formatCurrency = (amount) => {
    return `Rs${amount.toFixed(2)}`;
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
      <div className="mb-6 bg-white rounded-lg shadow-lg p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
            {/* Search Input */}
            <div className="flex-1 min-w-0">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search Orders
              </label>
              <div className="relative">
                <input
                  id="search"
                  type="text"
                  placeholder="Search by recycler name, waste type, order ID, or status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Date Filter */}
            <div className="w-full sm:w-auto">
              <label htmlFor="dateFilter" className="block text-sm font-medium text-gray-700 mb-2">
                Time Period
              </label>
              <select
                id="dateFilter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">All Time</option>
                <option value="this-month">This Month</option>
                <option value="last-month">Last Month</option>
                <option value="this-year">This Year</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Clear Search Button */}
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear Search
              </button>
            )}
            
            {/* Refresh Button */}
            <button
              onClick={fetchOrderWasteData}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Data
            </button>
          </div>
        </div>

        {/* Search Results Summary */}
        <div className="mt-4 text-sm text-gray-600">
          {searchTerm ? (
            <p>
              Showing {filteredOrderWasteData.length} of {orderWasteData.length} orders matching "{searchTerm}"
            </p>
          ) : (
            <p>Showing all {orderWasteData.length} orders</p>
          )}
        </div>
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
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Recycler</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Waste Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Weight (kg)</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Service Charge</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Total Value</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrderWasteData.length > 0 ? (
                    filteredOrderWasteData.slice(0, 15).map((order) => (
                      <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="font-mono text-sm text-gray-600">
                            {order._id?.slice(-6)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <span className="font-medium text-gray-900">
                              {order.recyclerId?.companyName || order.recyclerId?.name || 'Unknown'}
                            </span>
                            {order.recyclerId?.email && (
                              <p className="text-xs text-gray-500">{order.recyclerId.email}</p>
                            )}
                          </div>
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
                      <td colSpan="8" className="text-center py-8 text-gray-500">
                        {searchTerm ? `No waste orders found matching "${searchTerm}"` : 'No waste orders found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {orderWasteData.length > 15 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500">
                  Showing 15 of {orderWasteData.length} orders
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