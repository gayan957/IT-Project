import api from './api.js';

const collectionApi = {
  // Agent operations
  getHighFillBins: () => api.get('/api/collections/bins/high-fill'),
  getBinDetails: (binId) => api.get(`/api/collections/bins/${binId}/details`),
  collectBin: (binId, data) => api.post(`/api/collections/bins/${binId}/collect`, data),
  getAgentHistory: (page = 1, limit = 20) => 
    api.get(`/api/collections/agent/history?page=${page}&limit=${limit}`),
  
  // User operations
  getUserHistory: (page = 1, limit = 20) => 
    api.get(`/api/collections/user/history?page=${page}&limit=${limit}`),
  
  // Partner operations
  getPartnerHistory: (page = 1, limit = 20) => 
    api.get(`/api/collections/partner/history?page=${page}&limit=${limit}`),
  
  // Statistics
  getStats: () => api.get('/api/collections/stats')
};

export default collectionApi;