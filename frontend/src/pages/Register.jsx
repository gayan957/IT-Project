import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../lib/authUtils';
import ImprovedMapPicker from '../components/ImprovedMapPicker';
import { 
    validateName, 
    validatePhone, 
    validateBirthday, 
    validateIdCard,
    getMaxBirthdayDate,
    handleNameInput,
    handlePhoneInput,
    handleIdCardInput
} from '../lib/validation';

export default function Register() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        firstName: '', middleName: '', lastName: '',
        email: '', password: '', phone: '', address: '', birthday: '', idCardNumber: '',
    });
    const [mapPos, setMapPos] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState(1);

    const [validationErrors, setValidationErrors] = useState({});

    const onChange = (e) => {
        const { name, value } = e.target;
        let formattedValue = value;
        
        // Apply real-time formatting based on field type
        if (name === 'firstName' || name === 'middleName' || name === 'lastName') {
            formattedValue = handleNameInput(e);
        } else if (name === 'phone') {
            formattedValue = handlePhoneInput(e);
        } else if (name === 'idCardNumber') {
            formattedValue = handleIdCardInput(e);
        }
        
        // Update form state
        setForm((f) => ({ ...f, [name]: formattedValue }));
        
        // Clear validation error when user starts typing
        if (validationErrors[name]) {
            setValidationErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const nextStep = () => {
        const errors = {};
        
        if (step === 1) {
            // Validate required fields for step 1
            if (!form.firstName || !form.lastName || !form.email || !form.password) {
                setError('Please fill in all required fields');
                return;
            }
            
            // Validate names
            const firstNameError = validateName(form.firstName);
            if (firstNameError) {
                errors.firstName = firstNameError;
            }
            const middleNameError = form.middleName ? validateName(form.middleName) : '';
            if (middleNameError) {
                errors.middleName = middleNameError;
            }
            const lastNameError = validateName(form.lastName);
            if (lastNameError) {
                errors.lastName = lastNameError;
            }
            
            if (form.password.length < 6) {
                errors.password = 'Password must be at least 6 characters long';
            }
        }
        
        if (step === 2) {
            // Validate required fields for step 2
            if (!form.phone || !form.address || !form.birthday || !form.idCardNumber) {
                setError('Please fill in all required fields');
                return;
            }
            
            // Validate phone
            const phoneError = validatePhone(form.phone);
            if (phoneError) {
                errors.phone = phoneError;
            }
            
            // Validate birthday
            const birthdayError = validateBirthday(form.birthday);
            if (birthdayError) {
                errors.birthday = birthdayError;
            }
            
            // Validate ID card
            const idCardError = validateIdCard(form.idCardNumber);
            if (idCardError) {
                errors.idCardNumber = idCardError;
            }
        }
        
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            setError('Please correct the highlighted errors');
            return;
        }
        
        setValidationErrors({});
        setError('');
        setStep(step + 1);
    };

    const prevStep = () => {
        setError('');
        setStep(step - 1);
    };

    const submit = async (e) => {
        e.preventDefault();
        if (!mapPos) {
            setError('Please select your location on the map');
            return;
        }
        
        setLoading(true);
        setError('');
        try {
            const payload = {
                ...form,
                location: { type: 'Point', coordinates: [mapPos.lng, mapPos.lat] },
            };
            await register(payload);
            navigate('/dashboard');
        } catch (err) {
            setError(err?.response?.data?.message || err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-6">
                        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full p-3">
                            <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">Join Trash2Cash</h2>
                    <p className="mt-2 text-gray-600">Start earning money while helping the environment</p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center mb-8">
                    <div className="flex items-center space-x-4">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                            step >= 1 ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-300 text-gray-300'
                        }`}>
                            {step > 1 ? '✓' : '1'}
                        </div>
                        <div className={`w-16 h-1 ${step >= 2 ? 'bg-emerald-600' : 'bg-gray-300'}`}></div>
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                            step >= 2 ? 'bg-teal-600 border-teal-600 text-white' : 'border-gray-300 text-gray-300'
                        }`}>
                            {step > 2 ? '✓' : '2'}
                        </div>
                        <div className={`w-16 h-1 ${step >= 3 ? 'bg-teal-600' : 'bg-gray-300'}`}></div>
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                            step >= 3 ? 'bg-cyan-600 border-cyan-600 text-white' : 'border-gray-300 text-gray-300'
                        }`}>
                            3
                        </div>
                    </div>
                </div>

                {/* Registration Form */}
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <form onSubmit={submit}>
                        {/* Step 1: Personal Information */}
                        {step === 1 && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            First Name *
                                        </label>
                                        <input
                                            name="firstName"
                                            type="text"
                                            required
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                                                validationErrors.firstName ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            placeholder="John"
                                            value={form.firstName}
                                            onChange={onChange}
                                        />
                                        {validationErrors.firstName && (
                                            <p className="text-red-500 text-sm mt-1">{validationErrors.firstName}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Middle Name
                                        </label>
                                        <input
                                            name="middleName"
                                            type="text"
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                                                validationErrors.middleName ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            placeholder="Michael"
                                            value={form.middleName}
                                            onChange={onChange}
                                        />
                                        {validationErrors.middleName && (
                                            <p className="text-red-500 text-sm mt-1">{validationErrors.middleName}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Last Name *
                                        </label>
                                        <input
                                            name="lastName"
                                            type="text"
                                            required
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                                                validationErrors.lastName ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            placeholder="Doe"
                                            value={form.lastName}
                                            onChange={onChange}
                                        />
                                        {validationErrors.lastName && (
                                            <p className="text-red-500 text-sm mt-1">{validationErrors.lastName}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Address *
                                    </label>
                                    <input
                                        name="email"
                                        type="email"
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        placeholder="john.doe@example.com"
                                        value={form.email}
                                        onChange={onChange}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Password *
                                    </label>
                                    <input
                                        name="password"
                                        type="password"
                                        required
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                                            validationErrors.password ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="Minimum 6 characters"
                                        value={form.password}
                                        onChange={onChange}
                                    />
                                    {validationErrors.password && (
                                        <p className="text-red-500 text-sm mt-1">{validationErrors.password}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step 2: Contact Information */}
                        {step === 2 && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h3>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone Number *
                                    </label>
                                    <input
                                        name="phone"
                                        type="tel"
                                        required
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                                            validationErrors.phone ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="0712345678"
                                        value={form.phone}
                                        onChange={onChange}
                                        maxLength="10"
                                    />
                                    {validationErrors.phone && (
                                        <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>
                                    )}
                                    <p className="text-sm text-gray-500 mt-1">10 digits only</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Address *
                                    </label>
                                    <textarea
                                        name="address"
                                        required
                                        rows={3}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        placeholder="123 Main Street, Colombo 07"
                                        value={form.address}
                                        onChange={onChange}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Date of Birth *
                                    </label>
                                    <input
                                        name="birthday"
                                        type="date"
                                        required
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                                            validationErrors.birthday ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        value={form.birthday}
                                        onChange={onChange}
                                        max={getMaxBirthdayDate()}
                                    />
                                    {validationErrors.birthday && (
                                        <p className="text-red-500 text-sm mt-1">{validationErrors.birthday}</p>
                                    )}
                                    <p className="text-sm text-gray-500 mt-1">Must be 18 years or older</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        ID Card Number *
                                    </label>
                                    <input
                                        name="idCardNumber"
                                        type="text"
                                        required
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                                            validationErrors.idCardNumber ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="123456789V or 199812345678"
                                        value={form.idCardNumber}
                                        onChange={onChange}
                                        maxLength="12"
                                    />
                                    {validationErrors.idCardNumber && (
                                        <p className="text-red-500 text-sm mt-1">{validationErrors.idCardNumber}</p>
                                    )}
                                    <p className="text-sm text-gray-500 mt-1">
                                        Enter your Sri Lankan ID card number (9 digits + V or 12 digits)
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Location */}
                        {step === 3 && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Select Your Location</h3>
                                <p className="text-gray-600 mb-4">
                                    Please select your location on the map. This will be used as the default location for your recycling bins.
                                </p>
                                
                                <ImprovedMapPicker
                                    value={mapPos}
                                    onChange={setMapPos}
                                    height="400px"
                                    markerTitle="Your Location"
                                    className="rounded-lg border border-gray-300"
                                />
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex justify-between items-center mt-8">
                            <div>
                                {step > 1 && (
                                    <button
                                        type="button"
                                        onClick={prevStep}
                                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                    >
                                        Previous
                                    </button>
                                )}
                            </div>

                            <div>
                                {step < 3 ? (
                                    <button
                                        type="button"
                                        onClick={nextStep}
                                        className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all"
                                    >
                                        Next Step
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        {loading ? (
                                            <div className="flex items-center">
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                Creating Account...
                                            </div>
                                        ) : (
                                            'Create Account'
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </form>

                    {/* Sign in link */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-600">
                            Already have an account?{' '}
                            <Link
                                to="/login"
                                className="text-emerald-600 hover:text-emerald-500 font-semibold transition-colors"
                            >
                                Sign in instead
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Back to home */}
                <div className="text-center mt-6">
                    <Link
                        to="/"
                        className="text-gray-500 hover:text-gray-700 font-medium transition-colors inline-flex items-center"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}