import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../lib/api';

export default function CustomerPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    status: 'success', // Only show successful payments
    searchTerm: ''
  });

  // Fetch payments data
  const fetchPayments = async (page = 1) => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        status: filters.status
      });

      const response = await api.get(`/api/payments/history?${params}`);
      
      if (response.data.success) {
        // Filter out test/sample data - only show real payments
        const realPayments = (response.data.data.payments || []).filter(payment => {
          const orderId = (payment.orderId || '').toLowerCase();
          const paymentId = (payment.paymentId || '').toLowerCase();
          
          // Exclude payments that contain test-related keywords
          const testKeywords = ['test', 'sample', 'demo', 'fake', 'mock'];
          const isTestData = testKeywords.some(keyword => 
            orderId.includes(keyword) || paymentId.includes(keyword)
          );
          
          return !isTestData; // Only return non-test data
        });
        
        setPayments(realPayments);
        
        // Update pagination to reflect filtered results
        const filteredPagination = {
          ...response.data.data.pagination,
          total: realPayments.length
        };
        setPagination(filteredPagination);
      } else {
        toast.error(response.data.message || 'Failed to load payments');
      }
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please login again.');
      } else if (error.response?.status === 500) {
        toast.error(`Server error: ${error.response?.data?.message || 'Internal server error'}`);
      } else {
        toast.error('Failed to load customer payments');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle filter changes
  const handleFilterChange = (filterKey, value) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
      fetchPayments(newPage);
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'canceled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  // Filter payments based on search term
  const filteredPayments = payments.filter(payment => {
    if (!filters.searchTerm) return true;
    
    const searchTerm = filters.searchTerm.toLowerCase();
    const customerName = `${payment.customerDetails?.firstName || ''} ${payment.customerDetails?.lastName || ''}`.toLowerCase();
    const customerEmail = payment.customerDetails?.email?.toLowerCase() || '';
    const customerPhone = payment.customerDetails?.phone?.toLowerCase() || '';
    const orderId = payment.orderId?.toLowerCase() || '';
    const paymentId = payment.paymentId?.toLowerCase() || '';
    
    return (
      orderId.includes(searchTerm) ||
      paymentId.includes(searchTerm) ||
      customerName.includes(searchTerm) ||
      customerEmail.includes(searchTerm) ||
      customerPhone.includes(searchTerm)
    );
  });

  if (loading && payments.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading customer payments...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              Customer Payments
            </h3>
            <p className="text-gray-600 mt-1">Successful customer payment transactions</p>
          </div>
          <button
            onClick={() => fetchPayments(pagination.page)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Search */}
        <div className="mt-4 flex flex-wrap gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by Order ID, Customer Name, Email, or Phone..."
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              />
              {filters.searchTerm && (
                <button
                  onClick={() => handleFilterChange('searchTerm', '')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="canceled">Canceled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="overflow-x-auto">
        {filteredPayments.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No payments found</h4>
            <p className="text-gray-600">
              {filters.searchTerm 
                ? `No customer payments match your search term "${filters.searchTerm}".`
                : "No customer payments match your current filters."
              }
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Order ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Agent</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Waste Type</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Weight (kg)</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr 
                  key={payment._id} 
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{payment.orderId}</div>
                    <div className="text-sm text-gray-500">ID: {payment.paymentId}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">
                      {payment.customerDetails?.firstName && payment.customerDetails?.lastName 
                        ? `${payment.customerDetails.firstName} ${payment.customerDetails.lastName}`
                        : payment.customerDetails?.email || 'N/A'
                      }
                    </div>
                    
                    {payment.customerDetails?.phone && (
                      <div className="text-sm text-gray-500">
                        {payment.customerDetails.phone}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-emerald-600">
                      {formatCurrency(payment.amount)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {payment.currency}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900 capitalize">
                      {payment.wasteDetails?.wasteType || 'N/A'}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">
                      {payment.wasteDetails?.actualWeight ? 
                        `${payment.wasteDetails.actualWeight.toFixed(2)} kg` : 'N/A'
                      }
                    </div>
                    {payment.wasteDetails?.pricePerKg && (
                      <div className="text-sm text-gray-500">
                        @ {formatCurrency(payment.wasteDetails.pricePerKg)}/kg
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(payment.status)}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-900">
                      {formatDate(payment.completedAt || payment.createdAt)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} payments
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
              const pageNumber = Math.max(1, pagination.page - 2) + i;
              if (pageNumber > pagination.pages) return null;
              
              return (
                <button
                  key={pageNumber}
                  onClick={() => handlePageChange(pageNumber)}
                  className={`px-3 py-1 text-sm border rounded-lg ${
                    pageNumber === pagination.page
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}
            
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}