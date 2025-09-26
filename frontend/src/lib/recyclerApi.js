import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Get authentication token
const getAuthToken = () => {
  return localStorage.getItem('token');
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
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/api/recyclers/warehouse`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed - please login again');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching recycler warehouse:', error);
    throw error;
  }
};

// Get available waste for recycling
export const getAvailableWaste = async (page = 1, limit = 20, wasteType = 'all') => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      wasteType: wasteType
    });

    const response = await fetch(`${API_BASE_URL}/api/recyclers/available-waste?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed - please login again');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching available waste:', error);
    throw error;
  }
};

// Get recycler statistics
export const getRecyclerStatistics = async () => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/api/recyclers/statistics`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed - please login again');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching recycler statistics:', error);
    throw error;
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

export default {
  registerRecycler,
  loginRecycler,
  logoutRecycler,
  getRecyclerProfile,
  updateRecycler,
  updateRecyclerPassword,
  getRecyclerWarehouse,
  getAvailableWaste,
  getRecyclerStatistics,
  adminRecyclerApi
};