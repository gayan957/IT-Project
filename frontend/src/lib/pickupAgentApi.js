import api from './api.js';

const pickupAgentApi = {
  // Authentication
  register: (data) => api.post('/api/pickup-agents/register', data),
  login: (data) => api.post('/api/pickup-agents/login', data),
  
  // Agent Management (for partners and admins)
  getAllAgents: () => api.get('/api/pickup-agents/manage'),
  createAgent: (data) => api.post('/api/pickup-agents/manage', data),
  getAgentById: (id) => api.get(`/api/pickup-agents/manage/${id}`),
  updateAgent: (id, data) => api.put(`/api/pickup-agents/manage/${id}`, data),
  deleteAgent: (id) => api.delete(`/api/pickup-agents/manage/${id}`),
  
  // Legacy methods
  updateLegacy: (id, data) => api.post(`/api/pickup-agents/update/${id}`, data),
  getLocation: (id) => api.get(`/api/pickup-agents/location/${id}`),
  logout: (id) => api.post(`/api/pickup-agents/logout/${id}`),
  getProfile: (id) => api.get(`/api/pickup-agents/profile/${id}`)
};

export default pickupAgentApi;
