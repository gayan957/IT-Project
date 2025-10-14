import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
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

  const [formErrors, setFormErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});

  // Validation functions
  const validateName = (name) => {
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!name.trim()) {
      return 'Name is required';
    }
    if (!nameRegex.test(name)) {
      return 'Name should only contain letters and spaces';
    }
    if (name.trim().length < 2) {
      return 'Name must be at least 2 characters long';
    }
    return '';
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      return 'Email is required';
    }
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^0\d{9}$/;
    if (!phone.trim()) {
      return 'Phone number is required';
    }
    if (!phoneRegex.test(phone)) {
      return 'Phone number must be 10 digits starting with 0';
    }
    return '';
  };

  const validateBirthDate = (birthDate) => {
    if (!birthDate) {
      return 'Birth date is required';
    }
    
    const today = new Date();
    const selectedDate = new Date(birthDate);
    let age = today.getFullYear() - selectedDate.getFullYear();
    const monthDiff = today.getMonth() - selectedDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < selectedDate.getDate())) {
      age--;
    }
    
    if (age < 18) {
      return 'Must be at least 18 years old';
    }
    
    return '';
  };

  const validateCompanyName = (companyName) => {
    if (!companyName.trim()) {
      return 'Company name is required';
    }
    if (companyName.trim().length < 2) {
      return 'Company name must be at least 2 characters long';
    }
    return '';
  };

  const validateAddress = (address) => {
    if (!address.trim()) {
      return 'Address is required';
    }
    if (address.trim().length < 10) {
      return 'Please provide a complete address';
    }
    return '';
  };

  const validateField = (fieldName, value) => {
    switch (fieldName) {
      case 'name':
        return validateName(value);
      case 'email':
        return validateEmail(value);
      case 'phoneNumber':
        return validatePhoneNumber(value);
      case 'birthDate':
        return validateBirthDate(value);
      case 'companyName':
        return validateCompanyName(value);
      case 'contactPerson':
        return validateName(value); // Same validation as name
      case 'address':
        return validateAddress(value);
      default:
        return '';
    }
  };

  const handleInputChange = (fieldName) => (e) => {
    let value = e.target.value;

    // Special handling for phone number - only allow digits and limit to 10
    if (fieldName === 'phoneNumber') {
      const numbersOnly = value.replace(/\D/g, '');
      if (numbersOnly.length <= 10) {
        value = numbersOnly;
      } else {
        return; // Don't update if more than 10 digits
      }
    }

    // Special handling for name and contactPerson - only allow letters and spaces
    if (fieldName === 'name' || fieldName === 'contactPerson') {
      const lettersOnly = value.replace(/[^a-zA-Z\s]/g, '');
      value = lettersOnly;
    }

    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));

    // Mark field as touched
    setTouchedFields(prev => ({
      ...prev,
      [fieldName]: true
    }));

    // Validate the field
    const error = validateField(fieldName, value);
    setFormErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
  };

  const handleBlur = (fieldName) => () => {
    setTouchedFields(prev => ({
      ...prev,
      [fieldName]: true
    }));

    const error = validateField(fieldName, formData[fieldName]);
    setFormErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
  };

  const isFormValid = () => {
    const requiredFields = ['name', 'email', 'phoneNumber', 'birthDate', 'companyName', 'address'];
    
    for (const field of requiredFields) {
      const error = validateField(field, formData[field]);
      if (error) {
        return false;
      }
    }

    // Check password only for new partners
    if (!editingPartner && !formData.password.trim()) {
      return false;
    }

    return true;
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  // Validate search input - only allow letters, numbers, and spaces
  const handleSearchChange = (e) => {
    const value = e.target.value;
    const validPattern = /^[a-zA-Z0-9\s]*$/;
    
    if (validPattern.test(value)) {
      setSearchTerm(value);
    }
  };

  // Filter partners based on search term
  const filteredPartners = partners.filter(partner => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      partner.name?.toLowerCase().startsWith(searchLower) ||
      partner.email?.toLowerCase().startsWith(searchLower) ||
      partner.companyName?.toLowerCase().startsWith(searchLower) ||
      partner.partnerId?.toLowerCase().startsWith(searchLower) ||
      partner.phoneNumber?.startsWith(searchTerm) ||
      partner.contactPerson?.toLowerCase().startsWith(searchLower)
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
    
    // Validate all fields before submitting
    if (!isFormValid()) {
      // Mark all fields as touched to show errors
      setTouchedFields({
        name: true,
        email: true,
        address: true,
        phoneNumber: true,
        birthDate: true,
        companyName: true,
        contactPerson: true
      });
      toast.error('Please fix all validation errors before submitting.');
      return;
    }
    
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
    setFormErrors({});
    setTouchedFields({});
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
                onChange={handleSearchChange}
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
                    onChange={handleInputChange('name')}
                    onBlur={handleBlur('name')}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      touchedFields.name && formErrors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {touchedFields.name && formErrors.name && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    onBlur={handleBlur('email')}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      touchedFields.email && formErrors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {touchedFields.email && formErrors.email && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                  )}
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
                  onChange={handleInputChange('address')}
                  onBlur={handleBlur('address')}
                  className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    touchedFields.address && formErrors.address ? 'border-red-500' : 'border-gray-300'
                  }`}
                  rows="2"
                />
                {touchedFields.address && formErrors.address && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phoneNumber}
                    onChange={handleInputChange('phoneNumber')}
                    onBlur={handleBlur('phoneNumber')}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      touchedFields.phoneNumber && formErrors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0123456789"
                  />
                  {touchedFields.phoneNumber && formErrors.phoneNumber && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.phoneNumber}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Birth Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.birthDate}
                    onChange={handleInputChange('birthDate')}
                    onBlur={handleBlur('birthDate')}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      touchedFields.birthDate && formErrors.birthDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {touchedFields.birthDate && formErrors.birthDate && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.birthDate}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={handleInputChange('companyName')}
                    onBlur={handleBlur('companyName')}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      touchedFields.companyName && formErrors.companyName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {touchedFields.companyName && formErrors.companyName && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.companyName}</p>
                  )}
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
                  onChange={handleInputChange('contactPerson')}
                  onBlur={handleBlur('contactPerson')}
                  className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    touchedFields.contactPerson && formErrors.contactPerson ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Letters only"
                />
                {touchedFields.contactPerson && formErrors.contactPerson && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.contactPerson}</p>
                )}
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
                  disabled={!isFormValid()}
                  className={`px-4 py-2 rounded-md transition-all duration-200 ${
                    isFormValid()
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
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