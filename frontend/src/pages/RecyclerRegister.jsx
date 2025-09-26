import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { registerRecycler } from '../lib/recyclerApi';

export default function RecyclerRegister() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        address: '',
        phoneNumber: '',
        birthDate: '',
        facilityName: '',
        facilityLicense: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            toast.error('Password must be at least 6 characters long');
            return;
        }

        setLoading(true);

        try {
            const registrationData = { ...formData };
            
            // Remove confirmPassword before sending
            delete registrationData.confirmPassword;

            await registerRecycler(registrationData);

            toast.success('Registration successful! Please log in.');
            navigate('/recycler/login');
        } catch (error) {
            console.error('Registration error:', error);
            toast.error(error.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-6">
                        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-full p-3">
                            <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">Join as a Recycler</h2>
                    <p className="mt-2 text-gray-600">Register your recycling facility to start processing waste</p>
                </div>

                {/* Registration Form */}
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Personal Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                        Full Name *
                                    </label>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                        Email Address *
                                    </label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                                        Phone Number *
                                    </label>
                                    <input
                                        id="phoneNumber"
                                        name="phoneNumber"
                                        type="tel"
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                        value={formData.phoneNumber}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-1">
                                        Birth Date *
                                    </label>
                                    <input
                                        id="birthDate"
                                        name="birthDate"
                                        type="date"
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                        value={formData.birthDate}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Facility Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Facility Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="facilityName" className="block text-sm font-medium text-gray-700 mb-1">
                                        Facility Name *
                                    </label>
                                    <input
                                        id="facilityName"
                                        name="facilityName"
                                        type="text"
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                        value={formData.facilityName}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="facilityLicense" className="block text-sm font-medium text-gray-700 mb-1">
                                        Facility License
                                    </label>
                                    <input
                                        id="facilityLicense"
                                        name="facilityLicense"
                                        type="text"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                        value={formData.facilityLicense}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Address Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h3>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                                        Facility Address *
                                    </label>
                                    <textarea
                                        id="address"
                                        name="address"
                                        rows="3"
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Security</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                        Password *
                                    </label>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        minLength="6"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                        Confirm Password *
                                    </label>
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        required
                                        minLength="6"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-6 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                                    Registering...
                                </>
                            ) : (
                                'Register Facility'
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <span className="text-sm text-gray-600">Already have an account? </span>
                        <Link
                            to="/recycler/login"
                            className="text-sm font-medium text-green-600 hover:text-green-500 transition-colors duration-200"
                        >
                            Sign in here
                        </Link>
                    </div>

                    <div className="mt-4 text-center">
                        <Link
                            to="/"
                            className="text-sm font-medium text-gray-600 hover:text-gray-500 transition-colors duration-200"
                        >
                            ← Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}