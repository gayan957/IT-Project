import api from './api.js';

const API_BASE_URL = '/api/salary';

export const salaryApi = {
  // Calculate salary without saving
  calculateSalary: async (salaryData) => {
    try {
      const response = await api.post(`${API_BASE_URL}/calculate`, salaryData);
      return response.data;
    } catch (error) {
      console.error('Error calculating salary:', error);
      throw error.response?.data || error;
    }
  },

  // Save calculated salary
  saveSalary: async (salaryData) => {
    try {
      const response = await api.post(`${API_BASE_URL}/save`, salaryData);
      return response.data;
    } catch (error) {
      console.error('Error saving salary:', error);
      throw error.response?.data || error;
    }
  },

  // Get salary records for a pickup partner
  getPartnerSalaries: async (partnerId) => {
    try {
      const response = await api.get(`${API_BASE_URL}/partner/${partnerId || 'current'}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching partner salaries:', error);
      throw error.response?.data || error;
    }
  },

  // Get pickup agents for the authenticated partner
  getPartnerAgents: async () => {
    try {
      const response = await api.get(`${API_BASE_URL}/agents`);
      return response.data;
    } catch (error) {
      console.error('Error fetching partner agents:', error);
      throw error.response?.data || error;
    }
  },

  // Calculate overtime pay
  calculateOvertime: async (basicSalary, workingDays, overtimeHours) => {
    try {
      const response = await api.post(`${API_BASE_URL}/calculate-overtime`, {
        basicSalary,
        workingDays,
        overtimeHours
      });
      return response.data;
    } catch (error) {
      console.error('Error calculating overtime:', error);
      throw error.response?.data || error;
    }
  },

  // Calculate no pay deduction
  calculateNoPayDeduction: async (basicSalary, workingDays, noPayDays) => {
    try {
      const response = await api.post(`${API_BASE_URL}/calculate-nopay`, {
        basicSalary,
        workingDays,
        noPayDays
      });
      return response.data;
    } catch (error) {
      console.error('Error calculating no pay deduction:', error);
      throw error.response?.data || error;
    }
  },

  // Delete salary record
  deleteSalary: async (salaryId) => {
    try {
      const response = await api.delete(`${API_BASE_URL}/${salaryId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting salary:', error);
      throw error.response?.data || error;
    }
  },

  // Get agent's own salary records (for agent dashboard)
  getAgentSalaries: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.month) params.append('month', filters.month);
      if (filters.year) params.append('year', filters.year);
      
      const queryString = params.toString();
      const url = `${API_BASE_URL}/agent/my-salaries${queryString ? `?${queryString}` : ''}`;
      
      console.log('Fetching agent salaries from:', url);
      const response = await api.get(url);
      console.log('Agent salaries response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching agent salaries:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  }
};

export default salaryApi;
