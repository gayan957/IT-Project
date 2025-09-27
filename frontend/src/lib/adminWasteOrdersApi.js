import { api } from './api';

// Get all waste orders for admin
export const getAllWasteOrders = async (page = 1, limit = 20, status = 'all') => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    if (status !== 'all') {
      params.append('status', status);
    }

    const response = await api.get(`/api/admin/waste-orders?${params}`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error fetching waste orders:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch waste orders'
    };
  }
};

// Approve a waste order
export const approveWasteOrder = async (orderId) => {
  try {
    const response = await api.put(`/api/admin/waste-orders/${orderId}/approve`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error approving waste order:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to approve waste order'
    };
  }
};

// Reject a waste order
export const rejectWasteOrder = async (orderId, reason = '') => {
  try {
    const response = await api.put(`/api/admin/waste-orders/${orderId}/reject`, { reason });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error rejecting waste order:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to reject waste order'
    };
  }
};

// Get waste order statistics
export const getWasteOrderStats = async () => {
  try {
    const response = await api.get('/api/admin/waste-orders/stats');
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error fetching waste order stats:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch order statistics'
    };
  }
};