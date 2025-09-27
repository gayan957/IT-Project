import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getAllWasteOrders, approveWasteOrder, rejectWasteOrder, getWasteOrderStats } from '../lib/adminWasteOrdersApi';

const AdminWasteOrders = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const loadWasteOrdersData = async () => {
      try {
        setLoading(true);
        const [ordersResponse, statsResponse] = await Promise.all([
          getAllWasteOrders(currentPage, 12, statusFilter),
          getWasteOrderStats()
        ]);

        if (ordersResponse.success) {
          setOrders(ordersResponse.data.orders || []);
          setTotalPages(ordersResponse.data.pagination?.totalPages || 1);
        } else {
          toast.error(ordersResponse.error || 'Failed to load waste orders');
        }

        if (statsResponse.success) {
          setStats(statsResponse.data || {});
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadWasteOrdersData();
  }, [currentPage, statusFilter]);

  const handleApprove = async (orderId) => {
    if (approving.has(orderId)) return;

    const order = orders.find(o => o._id === orderId);
    if (!order) return;

    const confirmMessage = `Approve this order?\n\n` +
      `Order ID: ${order._id?.slice(-6)}\n` +
      `Recycler: ${order.recyclerId?.companyName || order.recyclerId?.name || 'N/A'}\n` +
      `Waste Type: ${order.wasteWarehouseId?.wasteType || 'Unknown'}\n` +
      `Amount: ${order.wasteAmount || order.weight} kg\n` +
      `Total Value: $${order.totalOrderValue?.toFixed(2) || '0.00'}`;

    if (!window.confirm(confirmMessage)) return;

    setApproving(prev => new Set(prev).add(orderId));

    try {
      const response = await approveWasteOrder(orderId);
      
      if (response.success) {
        toast.success('Order approved successfully!');
        // Refresh the data to get updated information
        window.location.reload(); // Simple way to refresh all data
      } else {
        toast.error(response.error || 'Failed to approve order');
      }
    } catch (error) {
      console.error('Error approving order:', error);
      toast.error('Failed to approve order');
    } finally {
      setApproving(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const handleReject = async (orderId) => {
    const reason = window.prompt('Enter rejection reason (optional):');
    if (reason === null) return; // User cancelled

    try {
      const response = await rejectWasteOrder(orderId, reason);
      
      if (response.success) {
        toast.success('Order rejected successfully');
        window.location.reload(); // Simple way to refresh all data
      } else {
        toast.error(response.error || 'Failed to reject order');
      }
    } catch (error) {
      console.error('Error rejecting order:', error);
      toast.error('Failed to reject order');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return {
          bg: 'from-emerald-50/80 to-emerald-100/80',
          border: 'border-emerald-200/50',
          badge: 'bg-emerald-100 text-emerald-700',
          icon: '✅'
        };
      case 'approved':
        return {
          bg: 'from-blue-50/80 to-blue-100/80',
          border: 'border-blue-200/50',
          badge: 'bg-blue-100 text-blue-700',
          icon: '👍'
        };
      case 'pending':
        return {
          bg: 'from-amber-50/80 to-amber-100/80',
          border: 'border-amber-200/50',
          badge: 'bg-amber-100 text-amber-700',
          icon: '⏳'
        };
      case 'cancelled':
        return {
          bg: 'from-red-50/80 to-red-100/80',
          border: 'border-red-200/50',
          badge: 'bg-red-100 text-red-700',
          icon: '❌'
        };
      default:
        return {
          bg: 'from-gray-50/80 to-gray-100/80',
          border: 'border-gray-200/50',
          badge: 'bg-gray-100 text-gray-700',
          icon: '📋'
        };
    }
  };

  const getWasteTypeInfo = (wasteType) => {
    const type = wasteType?.toLowerCase() || '';
    switch (type) {
      case 'plastic':
        return { icon: '♻️', color: 'text-sky-600' };
      case 'metal':
        return { icon: '🔩', color: 'text-slate-600' };
      case 'glass':
        return { icon: '🍶', color: 'text-emerald-600' };
      case 'paper':
        return { icon: '📄', color: 'text-amber-600' };
      case 'organic':
        return { icon: '🌿', color: 'text-green-600' };
      case 'electronic':
        return { icon: '💻', color: 'text-indigo-600' };
      case 'mixed':
        return { icon: '🗂️', color: 'text-purple-600' };
      default:
        return { icon: '📦', color: 'text-gray-600' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading waste orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Waste Orders Management
            </h1>
            <p className="text-gray-600 mt-1">Review and approve recycler waste orders</p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-6 border border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-700 text-sm font-medium">Pending Orders</p>
                <p className="text-3xl font-bold text-amber-800">{stats.pending || 0}</p>
              </div>
              <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">⏳</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-700 text-sm font-medium">Approved Orders</p>
                <p className="text-3xl font-bold text-blue-800">{stats.approved || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">👍</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 border border-emerald-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-700 text-sm font-medium">Completed Orders</p>
                <p className="text-3xl font-bold text-emerald-800">{stats.completed || 0}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-700 text-sm font-medium">Total Value</p>
                <p className="text-3xl font-bold text-purple-800">${stats.totalValue?.toFixed(0) || 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">💰</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Grid */}
      {orders && orders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => {
            const statusInfo = getStatusColor(order.orderStatus);
            const wasteInfo = getWasteTypeInfo(order.wasteWarehouseId?.wasteType);
            const orderDate = order.createdAt ? formatDate(order.createdAt) : 'N/A';
            const approvedDate = order.approvedAt ? formatDate(order.approvedAt) : null;
            const isApproving = approving.has(order._id);

            return (
              <div 
                key={order._id} 
                className={`group relative bg-gradient-to-br ${statusInfo.bg} backdrop-blur-sm rounded-2xl p-6 border ${statusInfo.border} shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2`}
              >
                <div className="relative">
                  {/* Header with waste type and status */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className={`text-2xl ${wasteInfo.color}`}>{wasteInfo.icon}</span>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 capitalize">
                          {order.wasteWarehouseId?.wasteType || 'Unknown'}
                        </h4>
                        <p className="text-sm text-gray-600">Order #{order._id?.slice(-6)}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.badge} capitalize flex items-center space-x-1`}>
                      <span>{statusInfo.icon}</span>
                      <span>{order.orderStatus}</span>
                    </span>
                  </div>

                  {/* Order details */}
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 font-medium">Waste Amount:</span>
                      <span className="text-lg font-bold text-gray-900">{order.wasteAmount || order.weight} kg</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 font-medium">Total Value:</span>
                      <span className="text-lg font-bold text-green-600">
                        ${order.totalOrderValue?.toFixed(2) || '0.00'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 font-medium">Tax Amount:</span>
                      <span className="text-sm font-medium text-orange-600">
                        ${order.adminTaxAmount?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 font-medium">Recycler:</span>
                      <span className="text-sm text-gray-800 font-medium">
                        {order.recyclerId?.companyName || order.recyclerId?.name || 'N/A'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 font-medium">Order Date:</span>
                      <span className="text-sm text-gray-800">{orderDate}</span>
                    </div>
                    
                    {order.orderStatus === 'approved' && approvedDate && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 font-medium">Approved:</span>
                        <span className="text-sm text-gray-800">{approvedDate}</span>
                      </div>
                    )}
                    
                    {order.approvedBy && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 font-medium">Approved by:</span>
                        <span className="text-sm text-gray-800">
                          {order.approvedBy.username || order.approvedBy.name || 'Admin'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  {order.orderStatus === 'pending' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApprove(order._id)}
                        disabled={isApproving}
                        className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg ${
                          isApproving ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        title="Approve this order"
                      >
                        {isApproving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Approving...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Approve</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleReject(order._id)}
                        className="flex items-center justify-center px-3 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
                        title="Reject this order"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* Status indicator for non-pending orders */}
                  {order.orderStatus !== 'pending' && (
                    <div className="pt-2 border-t border-gray-200/50">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          order.orderStatus === 'completed' ? 'bg-emerald-500' : 
                          order.orderStatus === 'approved' ? 'bg-blue-500' : 
                          order.orderStatus === 'cancelled' ? 'bg-red-500' : 'bg-gray-500'
                        }`}></div>
                        <span className="text-xs text-gray-600">
                          {order.orderStatus === 'completed' ? 'Order completed' :
                           order.orderStatus === 'approved' ? 'Approved - awaiting processing' : 
                           order.orderStatus === 'cancelled' ? 'Order cancelled' : 'Order processed'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-16 border border-gray-100 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium text-lg">No waste orders found</p>
          <p className="text-gray-400 text-sm mt-1">
            {statusFilter === 'all' ? 'Orders will appear here when recyclers place them' : `No ${statusFilter} orders found`}
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 bg-green-500 text-white rounded-lg">
            {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminWasteOrders;