import { useState, useEffect } from 'react';
import pickupAgentApi from '../lib/pickupAgentApi';

export default function AdminPickupAgents() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [partners, setPartners] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    address: '',
    phoneNumber: '',
    birthDate: '',
    vehicleNumber: '',
    assignedArea: '',
    partnerId: ''
  });

  useEffect(() => {
    fetchAgents();
    fetchPartners();
  }, []);

  // Filter agents based on search term
  const filteredAgents = agents.filter(agent => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      agent.name?.toLowerCase().includes(searchLower) ||
      agent.email?.toLowerCase().includes(searchLower) ||
      agent.agentId?.toLowerCase().includes(searchLower) ||
      agent.phoneNumber?.includes(searchTerm) ||
      agent.vehicleNumber?.toLowerCase().includes(searchLower) ||
      agent.assignedArea?.toLowerCase().includes(searchLower) ||
      agent.partnerId?.companyName?.toLowerCase().includes(searchLower) ||
      agent.partnerId?.name?.toLowerCase().includes(searchLower)
    );
  });

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const response = await pickupAgentApi.getAllAgents();
      setAgents(response.data.agents);
    } catch (error) {
      console.error('Error fetching agents:', error);
      alert('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const fetchPartners = async () => {
    try {
      // Use admin endpoint to get all pickup partners
      const response = await fetch('/api/admin/pickup-partners', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPartners(data.partners || data || []);
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
    }
  };

  const handleCreateAgent = async (e) => {
    e.preventDefault();
    try {
      await pickupAgentApi.createAgent(formData);
      alert('Agent created successfully');
      setShowCreateForm(false);
      resetForm();
      fetchAgents();
    } catch (error) {
      console.error('Error creating agent:', error);
      alert('Failed to create agent: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleUpdateAgent = async (e) => {
    e.preventDefault();
    try {
      const updateData = { ...formData };
      if (!updateData.password) {
        delete updateData.password;
      }
      await pickupAgentApi.updateAgent(editingAgent._id, updateData);
      alert('Agent updated successfully');
      setEditingAgent(null);
      resetForm();
      fetchAgents();
    } catch (error) {
      console.error('Error updating agent:', error);
      alert('Failed to update agent: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteAgent = async (agentId) => {
    if (!confirm('Are you sure you want to delete this agent?')) return;
    
    try {
      await pickupAgentApi.deleteAgent(agentId);
      alert('Agent deleted successfully');
      fetchAgents();
    } catch (error) {
      console.error('Error deleting agent:', error);
      alert('Failed to delete agent: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleEditClick = (agent) => {
    setEditingAgent(agent);
    setFormData({
      name: agent.name,
      email: agent.email,
      password: '',
      address: agent.address,
      phoneNumber: agent.phoneNumber,
      birthDate: agent.birthDate ? agent.birthDate.split('T')[0] : '',
      vehicleNumber: agent.vehicleNumber || '',
      assignedArea: agent.assignedArea || '',
      partnerId: agent.partnerId?._id || ''
    });
  };

  const resetForm = () => {
    setEditingAgent(null);
    setShowCreateForm(false);
    setFormData({
      name: '',
      email: '',
      password: '',
      address: '',
      phoneNumber: '',
      birthDate: '',
      vehicleNumber: '',
      assignedArea: '',
      partnerId: ''
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pickup Agent Management</h1>
          <p className="text-gray-600 mt-1">Manage all pickup agents across all partners</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Add New Agent
        </button>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Agents
            </label>
            <div className="relative">
              <input
                id="search"
                type="text"
                placeholder="Search by name, email, agent ID, partner, phone, vehicle, or area..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          {/* Clear Search Button */}
          {searchTerm && (
            <div className="flex items-end">
              <button
                onClick={() => setSearchTerm('')}
                className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Search Results Summary */}
        <div className="mt-4 text-sm text-gray-600">
          {searchTerm ? (
            <p>
              Showing {filteredAgents.length} of {agents.length} agents
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
          ) : (
            <p>Showing all {agents.length} agents</p>
          )}
        </div>
      </div>

      {/* Create/Edit Form */}
      {(showCreateForm || editingAgent) && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingAgent ? 'Edit Agent' : 'Create New Agent'}
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <form onSubmit={editingAgent ? handleUpdateAgent : handleCreateAgent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password {editingAgent && '(leave blank to keep current)'}
              </label>
              <input
                type="password"
                required={!editingAgent}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                required
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date</label>
              <input
                type="date"
                required
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Partner</label>
              <select
                required
                value={formData.partnerId}
                onChange={(e) => setFormData({ ...formData, partnerId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select a partner</option>
                {partners.map((partner) => (
                  <option key={partner._id} value={partner._id}>
                    {partner.companyName || partner.name} ({partner.email})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
              <input
                type="text"
                value={formData.vehicleNumber}
                onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Area</label>
              <input
                type="text"
                value={formData.assignedArea}
                onChange={(e) => setFormData({ ...formData, assignedArea: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            
            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {editingAgent ? 'Update Agent' : 'Create Agent'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Agents List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">All Pickup Agents</h2>
          
          {agents.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-5xl mb-4">🚚</div>
              <p className="text-gray-500">No agents found.</p>
            </div>
          ) : filteredAgents.length === 0 && searchTerm ? (
            <div className="text-center py-8">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-lg font-medium text-gray-600 mb-2">No matching agents found</p>
              <p className="text-gray-500">
                No results found for "{searchTerm}". Try adjusting your search terms.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Agent ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Partner</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Phone</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Vehicle</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Area</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAgents.map((agent) => (
                    <tr key={agent._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">{agent.agentId}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{agent.name}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{agent.email}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {agent.partnerId ? 
                          (agent.partnerId.companyName || agent.partnerId.name) 
                          : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{agent.phoneNumber}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{agent.vehicleNumber || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{agent.assignedArea || 'N/A'}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          agent.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {agent.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditClick(agent)}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteAgent(agent._id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}