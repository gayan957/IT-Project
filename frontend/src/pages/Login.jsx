import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { login } from '../lib/authUtils';

export default function Login() {
    const navigate = useNavigate();
    const { setUser } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const user = await login(email, password);
            setUser(user);
            navigate('/dashboard');
        } catch (err) {
            setError(err?.response?.data?.message || err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Header */}
                <div className="text-center">
                    <div className="flex justify-center mb-6">
                        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full p-3">
                            <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">Welcome back!</h2>
                    <p className="mt-2 text-gray-600">Sign in to your Trash2Cash account</p>
                </div>

                {/* Login Form */}
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                                    Remember me
                                </label>
                            </div>
                            <div className="text-sm">
                                <a href="#" className="text-emerald-600 hover:text-emerald-500 font-medium">
                                    Forgot password?
                                </a>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Signing in...
                                </div>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    {/* Sign up link */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-600">
                            Don't have an account?{' '}
                            <Link
                                to="/register"
                                className="text-emerald-600 hover:text-emerald-500 font-semibold transition-colors"
                            >
                                Create one now
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Back to home */}
                <div className="text-center">
                    <Link
                        to="/"
                        className="text-gray-500 hover:text-gray-700 font-medium transition-colors inline-flex items-center"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Home
                    </Link>
                    
                    <Link 
                        to="/admin/login" 
                        className="text-sm text-red-600 hover:text-red-700 transition-colors duration-200 font-medium"
                    >
                        Admin Login →
                    </Link>
                </div>
            </div>
        </div>
    );
}
