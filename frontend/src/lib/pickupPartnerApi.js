import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Get authentication token
const getAuthToken = () => {
  return localStorage.getItem('token');
};

const pickupPartnerApi = {
  register: (data) => axios.post('/api/pickup-partners/register', data),
  login: (data) => axios.post('/api/pickup-partners/login', data),
  // Add more API methods as needed
};

// Get pickup partner bin collections
export const getPartnerBinCollections = async (page = 1, limit = 20, status = 'all') => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      status: status
    });

    const response = await fetch(`${API_BASE_URL}/api/pickup-partners/collections?${queryParams}`, {
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

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching partner bin collections:', error);
    throw error;
  }
};

// Update collection status
export const updateCollectionStatus = async (collectionId, status, notes = '') => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/api/pickup-partners/collections/${collectionId}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status,
        notes
      })
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed - please login again');
      }
      if (response.status === 404) {
        throw new Error('Collection not found or unauthorized');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating collection status:', error);
    throw error;
  }
};

// Get collection statistics
export const getCollectionStats = async () => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/api/pickup-partners/collections?limit=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data?.summary || {};
  } catch (error) {
    throw error;
  }
};

// Get pickup partner schedule collections
export const getPartnerScheduleCollections = async (page = 1, limit = 20, status = 'all') => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      status: status
    });

    const response = await fetch(`${API_BASE_URL}/api/pickup-partners/schedule-collections?${queryParams}`, {
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

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching partner schedule collections:', error);
    throw error;
  }
};

// Update schedule collection status
export const updateScheduleCollectionStatus = async (collectionId, status, notes = '') => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/api/pickup-partners/schedule-collections/${collectionId}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status,
        notes
      })
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed - please login again');
      }
      if (response.status === 404) {
        throw new Error('Schedule collection not found or unauthorized');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating schedule collection status:', error);
    throw error;
  }
};

export default pickupPartnerApi;