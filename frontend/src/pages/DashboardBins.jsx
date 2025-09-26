import { useState, useEffect } from 'react';
import { useAuth } from "../lib/auth";
import { Link } from 'react-router-dom';
import BinCard from '../components/BinCard';
import api from '../lib/api';

const wasteTypes = [
    { value: 'plastic', label: 'Plastic', icon: '♻️', color: 'bg-teal-500' },
    { value: 'paper', label: 'Paper', icon: '📄', color: 'bg-orange-500' },
    { value: 'glass', label: 'Glass', icon: '🍾', color: 'bg-emerald-500' },
    { value: 'metal', label: 'Metal', icon: '🔩', color: 'bg-gray-500' },
    { value: 'organic', label: 'Organic', icon: '🌱', color: 'bg-emerald-500' },
    { value: 'coconut-shell', label: 'Coconut Shell', icon: '🥥', color: 'bg-emerald-600' },
    { value: 'e-waste', label: 'E-Waste', icon: '⚡', color: 'bg-purple-500' },
    { value: 'mixed', label: 'Mixed', icon: '🗂️', color: 'bg-teal-600' }
];

export default function DashboardBins() {
    const { user, loading } = useAuth();
    const [bins, setBins] = useState([]);
    const [binsLoading, setBinsLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [formData, setFormData] = useState({
        label: '',
        wasteType: 'mixed',
        fillLevel: 0
    });
    const [stats, setStats] = useState({
        total: 0,
        critical: 0,
        avgFillLevel: 0
    });

    useEffect(() => {
        if (loading || !user) return;
        fetchBins();
    }, [loading, user]);

    useEffect(() => {
        const total = bins.length;
        const critical = bins.filter(bin => bin.fillLevel >= 85).length;
        const avgFillLevel = total > 0 ? Math.round(bins.reduce((sum, bin) => sum + bin.fillLevel, 0) / total) : 0;
        
        setStats({ total, critical, avgFillLevel });
    }, [bins]);

    const fetchBins = async () => {
        setBinsLoading(true);
        try {
            const response = await api.get('/api/bins');
            setBins(response.data);
        } catch (error) {
            console.error('Error fetching bins:', error);
        } finally {
            setBinsLoading(false);
        }
    };

    const handleCreateBin = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/api/bins', formData);
            setBins([...bins, response.data]);
            setFormData({
                label: '',
                wasteType: 'mixed',
                fillLevel: 0
            });
            setShowCreateForm(false);
        } catch (error) {
            console.error('Error creating bin:', error);
            alert('Error creating bin. Please try again.');
        }
    };

    const handleEditBin = async (binId, updatedData) => {
        try {
            // Transform location data if provided
            const dataToSend = { ...updatedData };
            
            // If latitude and longitude are provided, format them for the location field
            if (updatedData.latitude && updatedData.longitude) {
                const lat = parseFloat(updatedData.latitude);
                const lng = parseFloat(updatedData.longitude);
                
                // Validate coordinates
                if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                    dataToSend.location = {
                        type: "Point",
                        coordinates: [lng, lat] // [longitude, latitude] as required by GeoJSON
                    };
                }
                
                // Remove the separate lat/lng fields since they're now in the location object
                delete dataToSend.latitude;
                delete dataToSend.longitude;
            }
            
            console.log('Sending bin update data:', dataToSend);
            
            const response = await api.put(`/api/bins/${binId}`, dataToSend);
            setBins(bins.map(bin => bin._id === binId ? response.data : bin));
        } catch (error) {
            console.error('Error updating bin:', error);
            alert('Error updating bin. Please try again.');
        }
    };

    const handleDeleteBin = async (bin) => {
        if (window.confirm(`Are you sure you want to delete "${bin.label || 'Unnamed Bin'}"?`)) {
            try {
                await api.delete(`/api/bins/${bin._id}`);
                setBins(bins.filter(b => b._id !== bin._id));
            } catch (error) {
                console.error('Error deleting bin:', error);
                alert('Error deleting bin. Please try again.');
            }
        }
    };

    const handleUpdateFillLevel = async (binId, newFillLevel) => {
        try {
            const response = await api.put(`/api/bins/${binId}`, { fillLevel: newFillLevel });
            setBins(bins.map(bin => bin._id === binId ? response.data : bin));
        } catch (error) {
            console.error('Error updating fill level:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading bins...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Bin Management</h1>
                            <p className="text-gray-600 mt-1">Monitor and manage waste collection bins</p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Link
                                to="/dashboard/schedules"
                                className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-800 transition-all duration-200 transform hover:scale-105 shadow-lg"
                            >
                                <span className="flex items-center space-x-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span>Schedule Pickup</span>
                                </span>
                            </Link>
                            <button
                                onClick={() => setShowCreateForm(true)}
                                className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-800 transition-all duration-200 transform hover:scale-105 shadow-lg"
                            >
                                <span className="flex items-center space-x-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    <span>Add New Bin</span>
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Bins</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                            <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Critical Bins</p>
                                <p className="text-3xl font-bold text-red-600">{stats.critical}</p>
                            </div>
                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Avg Fill Level</p>
                                <p className="text-3xl font-bold text-green-600">{stats.avgFillLevel}%</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Create Bin Modal */}
                {showCreateForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Add New Bin</h2>
                                <button
                                    onClick={() => setShowCreateForm(false)}
                                    className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-all duration-200"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={handleCreateBin} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Bin Label</label>
                                    <input
                                        type="text"
                                        value={formData.label}
                                        onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="e.g., Main Street Bin #1"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">Waste Type</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {wasteTypes.map((type) => (
                                            <label
                                                key={type.value}
                                                className={`relative flex flex-col items-center p-3 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                                                    formData.wasteType === type.value
                                                        ? 'border-teal-500 bg-teal-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="wasteType"
                                                    value={type.value}
                                                    checked={formData.wasteType === type.value}
                                                    onChange={(e) => setFormData({ ...formData, wasteType: e.target.value })}
                                                    className="sr-only"
                                                />
                                                <span className="text-2xl mb-1">{type.icon}</span>
                                                <span className="text-sm font-medium text-gray-700">{type.label}</span>
                                                {formData.wasteType === type.value && (
                                                    <div className="absolute top-2 right-2 w-3 h-3 bg-teal-500 rounded-full"></div>
                                                )}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Initial Fill Level: {formData.fillLevel}%
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={formData.fillLevel}
                                        onChange={(e) => setFormData({ ...formData, fillLevel: parseInt(e.target.value) })}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                                        <span>Empty</span>
                                        <span>Full</span>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateForm(false)}
                                        className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-800 transition-all duration-200 transform hover:scale-105"
                                    >
                                        Create Bin
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Bins Grid */}
                <div className="space-y-6">
                    {binsLoading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Loading bins...</p>
                        </div>
                    ) : bins.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No bins found</h3>
                            <p className="text-gray-600 mb-6">Get started by creating your first waste collection bin.</p>
                            <button
                                onClick={() => setShowCreateForm(true)}
                                className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-800 transition-all duration-200"
                            >
                                Add Your First Bin
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {bins.map((bin) => (
                                <BinCard
                                    key={bin._id}
                                    bin={bin}
                                    onEdit={handleEditBin}
                                    onDelete={handleDeleteBin}
                                    onUpdateFillLevel={handleUpdateFillLevel}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
