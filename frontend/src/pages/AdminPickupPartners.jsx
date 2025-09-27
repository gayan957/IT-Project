import React, { useState, useEffect } from 'react';
import api from '../lib/api';

const AdminPickupPartners = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    address: '',
    phoneNumber: '',
    birthDate: '',
    companyName: '',
    businessLicense: '',
    contactPerson: '',
    serviceAreas: [],
    vehicleFleet: []
  });

  useEffect(() => {
    fetchPartners();
  }, []);

  // Filter partners based on search term
  const filteredPartners = partners.filter(partner => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      partner.name?.toLowerCase().includes(searchLower) ||
      partner.email?.toLowerCase().includes(searchLower) ||
      partner.companyName?.toLowerCase().includes(searchLower) ||
      partner.partnerId?.toLowerCase().includes(searchLower) ||
      partner.phoneNumber?.includes(searchTerm) ||
      partner.contactPerson?.toLowerCase().includes(searchLower)
    );
  });

  const fetchPartners = async () => {
    try {
      console.log('Fetching partners...');
      
      const response = await api.get('/api/admin/pickup-partners');
      
      console.log('Partners API response:', response.data);
      
      // Ensure we always set an array
      setPartners(Array.isArray(response.data) ? response.data : []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching partners:', error);
      console.error('Error response:', error.response?.data);
      // Set empty array on error to prevent map error
      setPartners([]);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Submitting form data:', formData);
      console.log('Edit mode:', !!editingPartner);

      let response;
      if (editingPartner) {
        // Update existing partner
        console.log('Updating partner with ID:', editingPartner._id);
        response = await api.put(`/api/admin/pickup-partners/${editingPartner._id}`, formData);
        console.log('Update response:', response.data);
      } else {
        // Create new partner
        console.log('Creating new partner');
        response = await api.post('/api/admin/pickup-partners', formData);
        console.log('Create response:', response.data);
      }

      // Check if response is successful
      if (response.status === 201 || response.status === 200) {
        console.log('Partner saved successfully');
        
        // Show success message
        alert(editingPartner ? 'Partner updated successfully!' : 'Partner created successfully!');
        
        setShowForm(false);
        setEditingPartner(null);
        resetForm();
        fetchPartners();
      } else {
        throw new Error('Unexpected response status: ' + response.status);
      }
    } catch (error) {
      console.error('Error saving partner:', error);
      console.error('Error response:', error.response?.data);
      
      // More specific error message
      const errorMessage = error.response?.data?.message || error.message || 'Error saving partner. Please try again.';
      alert(errorMessage);
    }
  };

  const handleEdit = (partner) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      email: partner.email,
      password: '', // Don't populate password for security
      address: partner.address,
      phoneNumber: partner.phoneNumber,
      birthDate: partner.birthDate ? partner.birthDate.split('T')[0] : '',
      companyName: partner.companyName,
      businessLicense: partner.businessLicense || '',
      contactPerson: partner.contactPerson || '',
      serviceAreas: partner.serviceAreas || [],
      vehicleFleet: partner.vehicleFleet || []
    });
    setShowForm(true);
  };

  const handleDelete = async (partnerId) => {
    if (window.confirm('Are you sure you want to delete this pickup partner?')) {
      try {
        await api.delete(`/api/admin/pickup-partners/${partnerId}`);
        fetchPartners();
      } catch (error) {
        console.error('Error deleting partner:', error);
        alert('Error deleting partner. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      address: '',
      phoneNumber: '',
      birthDate: '',
      companyName: '',
      businessLicense: '',
      contactPerson: '',
      serviceAreas: [],
      vehicleFleet: []
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingPartner(null);
    resetForm();
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Pickup Partners Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add New Partner
        </button>
      </div>

      {/* Search Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Partners
            </label>
            <div className="relative">
              <input
                id="search"
                type="text"
                placeholder="Search by name, email, company, partner ID, phone, or contact person..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
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
              Showing {filteredPartners.length} of {partners.length} partners
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
          ) : (
            <p>Showing all {partners.length} partners</p>
          )}
        </div>
      </div>

      {showForm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCancel();
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-0 relative"
               onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  {editingPartner ? 'Edit Pickup Partner' : 'Add New Pickup Partner'}
                </h3>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password {!editingPartner && '*'}
                </label>
                <input
                  type="password"
                  required={!editingPartner}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={editingPartner ? 'Leave blank to keep current password' : ''}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Address *</label>
                <textarea
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Birth Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Business License</label>
                  <input
                    type="text"
                    value={formData.businessLicense}
                    onChange={(e) => setFormData({ ...formData, businessLicense: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingPartner ? 'Update Partner' : 'Create Partner'}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Partner Info
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.isArray(filteredPartners) && filteredPartners.map((partner) => (
              <tr key={partner._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{partner.name}</div>
                    <div className="text-sm text-gray-500">{partner.email}</div>
                    <div className="text-xs text-gray-400">ID: {partner.partnerId}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{partner.companyName}</div>
                  <div className="text-sm text-gray-500">{partner.businessLicense}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{partner.phoneNumber}</div>
                  <div className="text-sm text-gray-500">{partner.contactPerson}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    partner.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {partner.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(partner)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(partner._id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!Array.isArray(partners) || partners.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            No pickup partners found. Create your first partner to get started.
          </div>
        )}
        {Array.isArray(partners) && partners.length > 0 && filteredPartners.length === 0 && searchTerm && (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-lg font-medium text-gray-600 mb-2">No matching partners found</p>
            <p className="text-gray-500">
              No results found for "{searchTerm}". Try adjusting your search terms.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPickupPartners;