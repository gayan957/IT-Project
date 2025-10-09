import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import pickupAgentApi from '../lib/pickupAgentApi';
import toast from 'react-hot-toast';
import { 
  validateName, 
  validatePhone, 
  validateBirthday, 
  getMaxBirthdayDate
} from '../lib/validation';

export default function PickupAgentProfile() {
  const { user: authUser } = useAuth();
  
  // Fallback to localStorage if auth context doesn't have user
  const [user, setUser] = useState(() => {
    if (authUser) return authUser;
    
    const storedUser = localStorage.getItem('user');
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  // Update user when auth context changes
  useEffect(() => {
    if (authUser) {
      setUser(authUser);
    }
  }, [authUser]);

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    address: '',
    birthDate: '',
    vehicleNumber: '',
    assignedArea: '',
    status: 'active'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // --- NEW: helper to sanitize name input to letters + spaces only ---
  const sanitizeNameInput = (value) => {
    // Allow letters and spaces, remove everything else
    return value.replace(/[^A-Za-z\s]/g, '');
  };

  useEffect(() => {
    const fetchProfile = async () => {
      // Check if user is available and has the right role
      if (!user?.id) {
        console.log('User not available:', user);
        setError('Please log in to view your profile');
        setLoading(false);
        return;
      }

      // Verify user is a pickup agent
      if (user.role !== 'pickupagent') {
        console.log('User role mismatch:', user.role);
        setError('Access denied. This page is for pickup agents only.');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        console.log('Fetching profile for user ID:', user.id);
        const response = await pickupAgentApi.getProfile(user.id);
        console.log('Profile response:', response.data);
        
        if (response.data && response.data.agent) {
          const agent = response.data.agent;
          
          // Format birthDate for HTML date input (YYYY-MM-DD)
          let formattedBirthDate = '';
          if (agent.birthDate) {
            const date = new Date(agent.birthDate);
            if (!isNaN(date.getTime())) {
              formattedBirthDate = date.toISOString().split('T')[0];
            }
          }
          
          setProfile({
            name: agent.name || '',
            email: agent.email || '',
            phoneNumber: agent.phoneNumber || '',
            address: agent.address || '',
            birthDate: formattedBirthDate,
            vehicleNumber: agent.vehicleNumber || '',
            assignedArea: agent.assignedArea || '',
            status: agent.status || 'active'
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to load profile data';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const formatPhoneNumber = (value) => {
    const cleaned = value.replace(/\D/g, '');
    const limited = cleaned.slice(0, 10);
    
    if (limited.length >= 6) {
      return `${limited.slice(0, 3)}-${limited.slice(3, 6)}-${limited.slice(6)}`;
    } else if (limited.length >= 3) {
      return `${limited.slice(0, 3)}-${limited.slice(3)}`;
    }
    return limited;
  };

  // UPDATED: formatName now sanitizes to letters+spaces only, then Title-Cases
  const formatNameForSubmission = (value) => {
    const sanitized = sanitizeNameInput(value);
    return sanitized
      .split(' ')
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const formatVehicleNumber = (value) => {
    return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  };

  const handleInputChange = (field, value) => {
    let formattedValue = value;
    
    switch (field) {
      case 'phoneNumber':
        formattedValue = formatPhoneNumber(value);
        break;
      case 'name':
        // Only sanitize, don't format case on every keystroke to preserve natural typing
        formattedValue = sanitizeNameInput(value);
        break;
      case 'vehicleNumber':
        formattedValue = formatVehicleNumber(value);
        break;
      default:
        formattedValue = value;
    }
    
    setProfile(prev => ({
      ...prev,
      [field]: formattedValue
    }));
    
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    const nameError = validateName(profile.name);
    if (nameError) errors.name = nameError;
    
    if (!profile.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    const phoneError = validatePhone(profile.phoneNumber.replace(/\D/g, ''));
    if (phoneError) errors.phoneNumber = phoneError;
    
    if (!profile.address || profile.address.trim().length < 10) {
      errors.address = 'Please enter a complete address (minimum 10 characters)';
    }
    
    const birthDateError = validateBirthday(profile.birthDate);
    if (birthDateError) errors.birthDate = birthDateError;
    
    if (profile.vehicleNumber && !/^[A-Z]{2,3}[0-9]{4}$/.test(profile.vehicleNumber)) {
      errors.vehicleNumber = 'Vehicle number must be in format ABC1234 or AB1234';
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError('Please correct the highlighted errors');
      return;
    }
    
    setValidationErrors({});
    
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      const updateData = {
        name: formatNameForSubmission(profile.name), // Apply proper formatting on submission
        email: profile.email,
        address: profile.address,
        phoneNumber: profile.phoneNumber.replace(/\D/g, ''), // Clean formatting for API
        birthDate: profile.birthDate,
        vehicleNumber: profile.vehicleNumber
        // Note: assignedArea is excluded as it's readonly and managed by administrators
      };
      
      console.log('Updating profile with data:', updateData);
      console.log('User ID:', user?.id);
      
      const response = await pickupAgentApi.updateLegacy(user?.id, updateData);
      console.log('Update response:', response.data);
      
      setSuccess('Profile updated successfully!');
      toast.success('Profile updated successfully!');
      
      // Refresh the profile data after successful update
      if (response.data && response.data.agent) {
        const agent = response.data.agent;
        
        // Format birthDate for HTML date input
        let formattedBirthDate = agent.birthDate;
        if (agent.birthDate) {
          const date = new Date(agent.birthDate);
          if (!isNaN(date.getTime())) {
            formattedBirthDate = date.toISOString().split('T')[0];
          }
        }
        
        setProfile({
          name: agent.name || '',
          email: agent.email || '',
          phoneNumber: agent.phoneNumber || '',
          address: agent.address || '',
          birthDate: formattedBirthDate || '',
          vehicleNumber: agent.vehicleNumber || '',
          assignedArea: agent.assignedArea || '',
          status: agent.status || 'active'
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to update profile';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Agent Profile</h1>
          <p className="text-gray-600 mt-2">
            Manage your personal information and agent details
          </p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <div className="font-medium">Error</div>
                <div className="text-sm">{error}</div>
              </div>
            </div>
          </div>
        )}
        
        {success && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-700">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{success}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
            
            {/* Validation Summary */}
            {Object.keys(validationErrors).length > 0 && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2 text-red-700">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">
                    Please fix {Object.keys(validationErrors).length} error{Object.keys(validationErrors).length > 1 ? 's' : ''} below
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                name="name"
                label="Full Name"
                value={profile.name}
                onChange={(value) => handleInputChange('name', value)}
                error={validationErrors.name}
                placeholder="Enter your full name"
                hint="Letters only. Spaces allowed."
                required
                maxLength={50}
                showCharCount={true}
                onlyLetters={true} // <-- NEW: realtime letters-only guard
              />
              
              <FormField
                name="email"
                label="Email Address"
                type="email"
                value={profile.email}
                onChange={(value) => handleInputChange('email', value)}
                error={validationErrors.email}
                placeholder="Enter your email address"
                hint="We'll use this for account notifications"
                required
              />
              
              <FormField
                name="phoneNumber"
                label="Phone Number"
                value={profile.phoneNumber}
                onChange={(value) => handleInputChange('phoneNumber', value)}
                error={validationErrors.phoneNumber}
                placeholder="123-456-7890"
                hint="10-digit phone number for contact purposes"
                required
              />
              
              <FormField
                name="birthDate"
                label="Birth Date"
                type="date"
                value={profile.birthDate}
                onChange={(value) => handleInputChange('birthDate', value)}
                error={validationErrors.birthDate}
                placeholder="Select your birth date"
                max={getMaxBirthdayDate()}
                hint="Must be 18 years or older"
                required
              />
            </div>

            <FormField
              name="address"
              label="Address"
              value={profile.address}
              onChange={(value) => handleInputChange('address', value)}
              error={validationErrors.address}
              placeholder="Enter your full address"
              maxLength={200}
              showCharCount={true}
              hint="Include street address, city, and postal code"
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                name="vehicleNumber"
                label="Vehicle Number"
                value={profile.vehicleNumber}
                onChange={(value) => handleInputChange('vehicleNumber', value)}
                error={validationErrors.vehicleNumber}
                placeholder="Enter vehicle number (optional)"
                maxLength={8}
                showCharCount={true}
                hint="Format: ABC1234 or AB1234"
              />
              
              <FormField
                name="assignedArea"
                label="Assigned Area"
                value={profile.assignedArea}
                onChange={(value) => handleInputChange('assignedArea', value)}
                error={validationErrors.assignedArea}
                placeholder="Your assigned pickup area"
                hint="This area is assigned by your manager and cannot be changed"
                readonly={true}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {saving && (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <span>{saving ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Enhanced FormField component with better validation support
function FormField({ 
  label, 
  name, 
  value, 
  onChange, 
  type = "text", 
  required = false, 
  error, 
  placeholder, 
  maxLength,
  max,
  hint,
  options,
  showCharCount = false,
  readonly = false,
  // NEW: when true, blocks non-letter characters in realtime (allows spaces)
  onlyLetters = false,
}) {
  const inputClasses = `w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
    error ? 'border-red-500 bg-red-50' : 
    readonly ? 'border-gray-200 bg-gray-100 text-gray-600' : 'border-gray-300'
  }`;

  const currentLength = value ? value.length : 0;
  const isNearLimit = maxLength && currentLength > maxLength * 0.8;

  // NEW: native HTML pattern/title assist (enforced on submit)
  const pattern = onlyLetters ? '^[A-Za-z\\s]*$' : undefined;
  const title = onlyLetters ? 'Only letters and spaces are allowed' : undefined;

  // NEW: realtime guards for typing/paste before React updates value
  const handleBeforeInput = (e) => {
    if (!onlyLetters) return;
    // e.data can be null for non-text input (deletion, nav). Guard those.
    if (!e.data) return;
    // Allow letters and spaces, block everything else
    if (/[^A-Za-z\s]/.test(e.data)) {
      e.preventDefault();
    }
  };

  const handlePaste = (e) => {
    if (!onlyLetters) return;
    const text = e.clipboardData?.getData('text') ?? '';
    // Allow letters and spaces, remove everything else
    if (/[^A-Za-z\s]/.test(text)) {
      e.preventDefault();
      const cleaned = text.replace(/[^A-Za-z\s]/g, '');
      onChange(cleaned);
    }
  };

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {options ? (
        <select
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className={inputClasses}
        >
          <option value="">{placeholder || `Select ${label.toLowerCase()}`}</option>
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className={inputClasses}
          placeholder={placeholder}
          maxLength={maxLength}
          max={max}
          readOnly={readonly}
          pattern={pattern}
          title={title}
          inputMode={onlyLetters ? 'text' : undefined}
          onBeforeInput={handleBeforeInput}
          onPaste={handlePaste}
          autoComplete={name === 'name' ? 'name' : undefined}
        />
      )}
      
      {/* Character counter for text inputs */}
      {showCharCount && maxLength && type === 'text' && (
        <div className="flex justify-between items-center mt-1">
          <span></span>
          <span className={`text-xs ${isNearLimit ? 'text-orange-600 font-medium' : 'text-gray-400'}`}>
            {currentLength}/{maxLength}
          </span>
        </div>
      )}
      
      {/* Show hint if no error */}
      {hint && !error && (
        <p className="text-gray-500 text-xs mt-1 flex items-center space-x-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{hint}</span>
        </p>
      )}
      
      {error && (
        <p className="text-red-500 text-sm mt-1 flex items-center space-x-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
