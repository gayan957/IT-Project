import api from './api.js';

// Get all waste prices (public - available to all roles)
export const getAllWastePrices = async () => {
  try {
    const response = await api.get('/api/waste-prices');
    return response.data;
  } catch (error) {
    console.error('Error fetching waste prices:', error);
    throw error;
  }
};

// Get waste price by specific type (public - available to all roles)
export const getWastePriceByType = async (wasteType) => {
  try {
    const response = await api.get(`/api/waste-prices/${wasteType}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching price for waste type ${wasteType}:`, error);
    throw error;
  }
};

// Update waste price (admin only)
export const updateWastePrice = async (wasteType, pricePerKg, token) => {
  try {
    const response = await api.put(`/api/waste-prices/${wasteType}`, 
      { pricePerKg },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating price for waste type ${wasteType}:`, error);
    throw error;
  }
};

// Initialize default prices (admin only)
export const initializeDefaultPrices = async (token) => {
  try {
    const response = await api.post('/api/waste-prices/initialize', 
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error initializing default prices:', error);
    throw error;
  }
};

// Delete waste price (admin only)
export const deleteWastePrice = async (wasteType, token) => {
  try {
    const response = await api.delete(`/api/waste-prices/${wasteType}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error deleting price for waste type ${wasteType}:`, error);
    throw error;
  }
};

// Waste type constants for frontend use - consistent with backend WastePrice model
export const WASTE_TYPES = [
  'plastic',
  'paper', 
  'glass',
  'metal',
  'organic',
  'coconut-shell',
  'e-waste',
  'mixed'
];

// Helper function to format waste type display names
export const formatWasteTypeName = (wasteType) => {
  const displayNames = {
    'plastic': 'Plastic',
    'paper': 'Paper',
    'glass': 'Glass',
    'metal': 'Metal',
    'organic': 'Organic',
    'coconut-shell': 'Coconut Shell',
    'e-waste': 'E-Waste',
    'mixed': 'Mixed'
  };
  return displayNames[wasteType] || wasteType.charAt(0).toUpperCase() + wasteType.slice(1);
};

// Helper function to format price display
export const formatPrice = (price) => {
  return `Rs. ${parseFloat(price).toFixed(2)}`;
};