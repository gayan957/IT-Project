import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../lib/api';

export default function AdminRecyclers() {
  const [recyclers, setRecyclers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecycler, setEditingRecycler] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    address: '',
    phoneNumber: '',
    birthDate: '',
    facilityName: '',
    facilityLicense: ''
  });

  // Form validation states
  const [formErrors, setFormErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});

  // Validation functions
  const validateName = (name) => {
    if (!name.trim()) {
      return 'Name is required';
    }
    if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
      return 'Name can only contain letters and spaces';
    }
    if (name.trim().length < 2) {
      return 'Name must be at least 2 characters long';
    }
    return '';
  };

  const validateEmail = (email) => {
    if (!email.trim()) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
      return ''; // Birth date is optional for recyclers
    }
    
    const today = new Date();
    const selectedDate = new Date(birthDate);
    
    // Check if the selected date is in the future
    if (selectedDate > today) {
      return 'Birth date cannot be in the future';
    }
    
    let age = today.getFullYear() - selectedDate.getFullYear();
    const monthDiff = today.getMonth() - selectedDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < selectedDate.getDate())) {
      age--;
    }
    
    if (age < 18) {
      return 'Must be at least 18 years old';
    }
    
    if (age > 100) {
      return 'Please enter a valid birth date';
    }
    
    return '';
  };

  const validateAddress = (address) => {
    if (!address.trim()) {
      return 'Address is required';
    }
    if (address.trim().length < 10) {
      return 'Please enter a complete address (minimum 10 characters)';
    }
    return '';
  };

  const validateFacilityName = (facilityName) => {
    if (!facilityName.trim()) {
      return 'Facility name is required';
    }
    if (facilityName.trim().length < 2) {
      return 'Facility name must be at least 2 characters long';
    }
    return '';
  };

  // Helper function to get maximum birth date (18 years ago from today)
  const getMaxBirthDate = () => {
    const today = new Date();
    const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    return eighteenYearsAgo.toISOString().split('T')[0];
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
      case 'address':
        return validateAddress(value);
      case 'facilityName':
        return validateFacilityName(value);
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

    // Special handling for name and facilityName - only allow letters and spaces
    if (fieldName === 'name' || fieldName === 'facilityName') {
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
    const requiredFields = ['name', 'email', 'address', 'phoneNumber', 'facilityName'];
    
    // Check if all required fields are filled
    for (const field of requiredFields) {
      if (!formData[field] || formData[field].trim() === '') {
        return false;
      }
    }

    // Check if there are any validation errors
    for (const field of requiredFields) {
      if (formErrors[field]) {
        return false;
      }
    }

    // Check birth date error if it's provided
    if (formData.birthDate && formErrors.birthDate) {
      return false;
    }

    return true;
  };

  useEffect(() => {
    fetchRecyclers();
  }, []);

  const fetchRecyclers = async () => {
    try {
      const response = await api.get('/api/admin/recyclers');
      setRecyclers(response.data || []);
    } catch (error) {
      console.error('Error fetching recyclers:', error);
      toast.error('Failed to fetch recyclers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields before submitting
    if (!isFormValid()) {
      // Mark all required fields as touched to show errors
      setTouchedFields({
        name: true,
        email: true,
        address: true,
        phoneNumber: true,
        facilityName: true,
        birthDate: !!formData.birthDate // Only mark as touched if has value
      });
      toast.error('Please fix all validation errors before submitting.');
      return;
    }
    
    try {
      const submitData = { ...formData };

      if (editingRecycler) {
        await api.put(`/api/admin/recyclers/${editingRecycler._id}`, submitData);
        toast.success('Recycler updated successfully!');
      } else {
        await api.post('/api/admin/recyclers', submitData);
        toast.success('Recycler created successfully!');
      }

      setShowForm(false);
      setEditingRecycler(null);
      resetForm();
      fetchRecyclers();
    } catch (error) {
      console.error('Error saving recycler:', error);
      toast.error(error.response?.data?.message || 'Failed to save recycler');
    }
  };

  const handleEdit = (recycler) => {
    setEditingRecycler(recycler);
    setFormData({
      name: recycler.name,
      email: recycler.email,
      password: '',
      address: recycler.address,
      phoneNumber: recycler.phoneNumber,
      birthDate: recycler.birthDate ? recycler.birthDate.split('T')[0] : '',
      facilityName: recycler.facilityName,
      facilityLicense: recycler.facilityLicense || ''
    });
    // Reset validation states when editing
    setFormErrors({});
    setTouchedFields({});
    setShowForm(true);
  };

  const handleDelete = async (recyclerId) => {
    if (window.confirm('Are you sure you want to delete this recycler?')) {
      try {
        await api.delete(`/api/admin/recyclers/${recyclerId}`);
        toast.success('Recycler deleted successfully!');
        fetchRecyclers();
      } catch (error) {
        console.error('Error deleting recycler:', error);
        toast.error('Failed to delete recycler');
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
      facilityName: '',
      facilityLicense: ''
    });
    setFormErrors({});
    setTouchedFields({});
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Recyclers</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage recycling facilities and their information.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600"
          >
            Add Recycler
          </button>
        </div>
      </div>

      {/* Recyclers Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {recyclers.map((recycler) => (
            <li key={recycler._id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div>
                        <p className="text-sm font-medium text-indigo-600 truncate">
                          {recycler.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {recycler.email}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="sm:flex">
                        <div className="sm:flex-1">
                          <p className="text-xs text-gray-500">
                            Facility: {recycler.facilityName}
                          </p>
                          <p className="text-xs text-gray-500">
                            License: {recycler.facilityLicense}
                          </p>
                          <p className="text-xs text-gray-500">
                            Phone: {recycler.phoneNumber}
                          </p>
                        </div>
                        <div className="mt-2 sm:mt-0">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            recycler.isLoggedIn ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {recycler.isLoggedIn ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(recycler)}
                      className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(recycler._id)}
                      className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingRecycler ? 'Edit Recycler' : 'Add New Recycler'}
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingRecycler(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        touchedFields.name && formErrors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      value={formData.name}
                      onChange={handleInputChange('name')}
                      onBlur={handleBlur('name')}
                      placeholder="Letters only"
                    />
                    {touchedFields.name && formErrors.name && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        touchedFields.email && formErrors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      value={formData.email}
                      onChange={handleInputChange('email')}
                      onBlur={handleBlur('email')}
                    />
                    {touchedFields.email && formErrors.email && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password {!editingRecycler && '*'}
                    </label>
                    <input
                      type="password"
                      name="password"
                      required={!editingRecycler}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      required
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        touchedFields.phoneNumber && formErrors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                      }`}
                      value={formData.phoneNumber}
                      onChange={handleInputChange('phoneNumber')}
                      onBlur={handleBlur('phoneNumber')}
                      placeholder="0123456789"
                    />
                    {touchedFields.phoneNumber && formErrors.phoneNumber && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.phoneNumber}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Birth Date
                    </label>
                    <input
                      type="date"
                      name="birthDate"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        touchedFields.birthDate && formErrors.birthDate ? 'border-red-500' : 'border-gray-300'
                      }`}
                      value={formData.birthDate}
                      onChange={handleInputChange('birthDate')}
                      onBlur={handleBlur('birthDate')}
                      max={getMaxBirthDate()}
                      title="Must be 18 years or older"
                    />
                    {touchedFields.birthDate && formErrors.birthDate && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.birthDate}</p>
                    )}
                    <p className="text-gray-500 text-xs mt-1">Optional - Must be at least 18 years old if provided</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Facility Name *
                    </label>
                    <input
                      type="text"
                      name="facilityName"
                      required
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        touchedFields.facilityName && formErrors.facilityName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      value={formData.facilityName}
                      onChange={handleInputChange('facilityName')}
                      onBlur={handleBlur('facilityName')}
                      placeholder="Letters only"
                    />
                    {touchedFields.facilityName && formErrors.facilityName && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.facilityName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Facility License
                    </label>
                    <input
                      type="text"
                      name="facilityLicense"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      value={formData.facilityLicense}
                      onChange={(e) => setFormData(prev => ({ ...prev, facilityLicense: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <textarea
                    name="address"
                    required
                    rows="3"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      touchedFields.address && formErrors.address ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={formData.address}
                    onChange={handleInputChange('address')}
                    onBlur={handleBlur('address')}
                  />
                  {touchedFields.address && formErrors.address && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>
                  )}
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingRecycler(null);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!isFormValid()}
                    className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium transition-colors ${
                      isFormValid()
                        ? 'text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                        : 'text-gray-500 bg-gray-300 cursor-not-allowed'
                    }`}
                  >
                    {editingRecycler ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}