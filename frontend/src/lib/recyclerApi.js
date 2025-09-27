const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Helper function to handle API responses with auth error checking
const handleApiResponse = async (response, errorMessage = 'Request failed') => {
  if (!response.ok) {
    const errorData = await response.json();
    
    // If it's an auth error, might need to re-login
    if (response.status === 401) {
      return { 
        success: false, 
        error: errorData.message || 'Authentication failed. Please log in again.',
        requiresLogin: true 
      };
    }
    
    return { 
      success: false, 
      error: errorData.error || errorData.message || errorMessage 
    };
  }

  const data = await response.json();
  // If the backend response has success: true and data property, return the data
  // Otherwise return the entire response
  if (data.success === true && data.data) {
    return { success: true, data: data.data };
  }
  return { success: true, data: data };
};

// Get authentication token
const getAuthToken = () => {
  const token = localStorage.getItem('token');
  
  // Validate token format and existence
  if (!token || token === 'null' || token === 'undefined' || token.trim() === '') {
    console.warn('No valid token found in localStorage');
    return null;
  }
  
  // Basic JWT format validation (should have 3 parts separated by dots)
  const tokenParts = token.split('.');
  if (tokenParts.length !== 3) {
    console.warn('Invalid JWT format detected:', token.substring(0, 20) + '...');
    return null;
  }
  
  return token.trim();
};

// Recycler Authentication
export const registerRecycler = async (data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/recyclers/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Registration failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Error registering recycler:', error);
    throw error;
  }
};

export const loginRecycler = async (credentials) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/recyclers/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Login failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Error logging in recycler:', error);
    throw error;
  }
};

export const logoutRecycler = async (recyclerId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/recyclers/logout/${recyclerId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Logout failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Error logging out recycler:', error);
    throw error;
  }
};

// Get recycler profile
export const getRecyclerProfile = async (recyclerId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/recyclers/profile/${recyclerId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching recycler profile:', error);
    throw error;
  }
};

// Update recycler profile
export const updateRecycler = async (recyclerId, data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/recyclers/update/${recyclerId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Update failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating recycler:', error);
    throw error;
  }
};

// Update recycler password
export const updateRecyclerPassword = async (recyclerId, passwords) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/recyclers/password/${recyclerId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(passwords)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Password update failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating recycler password:', error);
    throw error;
  }
};

// Get recycler warehouse data
export const getRecyclerWarehouse = async () => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { 
        success: false, 
        error: 'No valid authentication token. Please log in again.',
        requiresLogin: true 
      };
    }

    const response = await fetch(`${API_BASE_URL}/api/recyclers/warehouse`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return await handleApiResponse(response, 'Failed to fetch warehouse data');
  } catch (error) {
    console.error('Error getting recycler warehouse:', error);
    return { success: false, error: error.message || 'Failed to fetch warehouse data' };
  }
};

// Get available waste for recycling
export const getAvailableWaste = async (page = 1, limit = 20, wasteType = 'all') => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { 
        success: false, 
        error: 'No valid authentication token. Please log in again.',
        requiresLogin: true 
      };
    }

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      wasteType
    });

    const response = await fetch(`${API_BASE_URL}/api/recyclers/available-waste?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return await handleApiResponse(response, 'Failed to fetch available waste');
  } catch (error) {
    console.error('Error fetching available waste:', error);
    return { success: false, error: error.message || 'Failed to fetch available waste' };
  }
};

// Get recycler statistics  
export const getRecyclerStatistics = async () => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { 
        success: false, 
        error: 'No valid authentication token. Please log in again.',
        requiresLogin: true 
      };
    }

    const response = await fetch(`${API_BASE_URL}/api/recyclers/statistics`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return await handleApiResponse(response, 'Failed to fetch statistics');
  } catch (error) {
    console.error('Error fetching recycler statistics:', error);
    return { success: false, error: error.message || 'Failed to fetch statistics' };
  }
};

// Admin API functions for recycler management
export const adminRecyclerApi = {
  // List all recyclers (admin only)
  listRecyclers: async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/admin/recyclers`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch recyclers');
      return await response.json();
    } catch (error) {
      console.error('Error fetching recyclers:', error);
      throw error;
    }
  },

  // Create new recycler (admin only)
  createRecycler: async (recyclerData) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/admin/recyclers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(recyclerData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create recycler');
      }
      return await response.json();
    } catch (error) {
      console.error('Error creating recycler:', error);
      throw error;
    }
  },

  // Update recycler (admin only)
  updateRecycler: async (recyclerId, recyclerData) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/admin/recyclers/${recyclerId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(recyclerData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update recycler');
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating recycler:', error);
      throw error;
    }
  },

  // Delete recycler (admin only)
  deleteRecycler: async (recyclerId) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/admin/recyclers/${recyclerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete recycler');
      }
      return await response.json();
    } catch (error) {
      console.error('Error deleting recycler:', error);
      throw error;
    }
  },

  // Get recycler by ID (admin only)
  getRecyclerById: async (recyclerId) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/admin/recyclers/${recyclerId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch recycler');
      return await response.json();
    } catch (error) {
      console.error('Error fetching recycler:', error);
      throw error;
    }
  }
};

// Order-related API functions
export const getOrderQuote = async (wasteWarehouseId, weight) => {
  try {
    const token = getAuthToken();
    
    if (!token) {
      return { 
        success: false, 
        error: 'No valid authentication token. Please log in again.',
        requiresLogin: true 
      };
    }
    
    const response = await fetch(
      `${API_BASE_URL}/api/recyclers/order-quote?wasteWarehouseId=${wasteWarehouseId}&weight=${weight}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      
      // If it's an auth error, might need to re-login
      if (response.status === 401) {
        return { 
          success: false, 
          error: errorData.message || 'Authentication failed. Please log in again.',
          requiresLogin: true 
        };
      }
      
      return { success: false, error: errorData.error || errorData.message || 'Failed to get quote' };
    }

    const data = await response.json();
    return { success: true, data: data.data };
  } catch (error) {
    console.error('Error getting order quote:', error);
    return { success: false, error: error.message || 'Failed to get quote' };
  }
};

export const placeOrder = async (wasteWarehouseId, weight) => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/recyclers/place-order`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        wasteWarehouseId,
        weight
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || 'Failed to place order' };
    }

    const data = await response.json();
    return { success: true, data: data.data };
  } catch (error) {
    console.error('Error placing order:', error);
    return { success: false, error: error.message || 'Failed to place order' };
  }
};

// Get Recycler's Orders
export const getRecyclerOrders = async (status = null) => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { 
        success: false, 
        error: 'No valid authentication token. Please log in again.',
        requiresLogin: true 
      };
    }

    let url = `${API_BASE_URL}/api/recyclers/orders`;
    if (status) {
      url += `?status=${encodeURIComponent(status)}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return await handleApiResponse(response, 'Failed to fetch orders');
  } catch (error) {
    console.error('Error fetching recycler orders:', error);
    return { success: false, error: error.message || 'Failed to fetch orders' };
  }
};

// Process (complete) a recycler order
export const processRecyclerOrder = async (orderId) => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { 
        success: false, 
        error: 'No valid authentication token. Please log in again.',
        requiresLogin: true 
      };
    }
    
    const response = await fetch(`${API_BASE_URL}/api/recyclers/orders/${orderId}/process`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return await handleApiResponse(response, 'Failed to process order');
  } catch (error) {
    console.error('Error processing order:', error);
    return { success: false, error: error.message || 'Failed to process order' };
  }
};

// RecyclerAPI object for easy importing
export const RecyclerAPI = {
  getOrderQuote,
  placeOrder,
  getRecyclerOrders,
  processRecyclerOrder
};