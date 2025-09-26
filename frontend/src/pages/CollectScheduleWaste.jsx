import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const CollectScheduleWaste = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const scheduleData = location.state?.schedule;

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [actualWeight, setActualWeight] = useState('');
    const [wastePrice, setWastePrice] = useState(null);
    const [totalPrice, setTotalPrice] = useState(0);
    const [notes, setNotes] = useState('');

    // Sample schedule data for testing when no data is passed
    const sampleScheduleData = {
        _id: 'sample-schedule-1',
        wasteType: 'mixed',
        address: 'Sample Schedule Location',
        userName: 'John Doe',
        scheduledDate: new Date().toISOString(),
        scheduledTime: '10:00',
        estimatedWeight: 5,
        location: { lat: 6.9271, lng: 79.8612 }
    };

    // Use scheduleData if available, otherwise use sample data for testing
    const currentScheduleData = scheduleData || sampleScheduleData;

    // Get agent info from localStorage
    const agentInfo = JSON.parse(localStorage.getItem('user') || '{}');

    const fetchWastePrice = useCallback(async () => {
        try {
            setLoading(true);
            
            // Get authentication token
            const token = localStorage.getItem('token');
            
            if (!token) {
                console.warn('No authentication token found');
                // For demo purposes, use default prices
                setWastePrice({
                    wasteType: currentScheduleData.wasteType,
                    pricePerKg: 25.0 // Default price for mixed
                });
                return;
            }
            
            // Fetch waste prices from backend API
            const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/waste-prices`;
            console.log('Fetching waste prices from:', apiUrl);
            
            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('API Response status:', response.status);

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Authentication failed - please login again');
                } else if (response.status === 404) {
                    throw new Error('Waste prices not found - database may need initialization');
                } else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            }

            const result = await response.json();
            console.log('API Response:', result);
            
            if (result.success && result.data) {
                // Find price for this waste type
                const priceData = result.data.find(p => p.wasteType === currentScheduleData.wasteType);
                if (priceData) {
                    console.log('Found price data:', priceData);
                    setWastePrice(priceData);
                    return;
                } else {
                    throw new Error(`Price not found for ${currentScheduleData.wasteType} waste`);
                }
            } else {
                throw new Error('Invalid response format from server');
            }
            
        } catch (error) {
            console.error('Error fetching waste price:', error);
            
            // For demo purposes, set a default price based on waste type
            const defaultPrices = {
                mixed: 25.0,
                organic: 15.0,
                plastic: 30.0,
                paper: 20.0,
                glass: 18.0,
                electronic: 45.0,
                metal: 35.0
            };
            
            const defaultPrice = defaultPrices[currentScheduleData.wasteType.toLowerCase()] || 25.0;
            
            setWastePrice({
                wasteType: currentScheduleData.wasteType,
                pricePerKg: defaultPrice
            });
            
            toast.error(`Using default price for ${currentScheduleData.wasteType}: Rs. ${defaultPrice}/kg`);
        } finally {
            setLoading(false);
        }
    }, [currentScheduleData.wasteType]);

    useEffect(() => {
        if (!scheduleData) {
            console.log('No schedule data provided, using sample data for testing');
        }

        fetchWastePrice();
    }, [scheduleData, fetchWastePrice]);

    useEffect(() => {
        // Calculate total price when weight changes
        if (actualWeight && wastePrice) {
            const weight = parseFloat(actualWeight);
            if (!isNaN(weight) && weight > 0) {
                setTotalPrice(weight * wastePrice.pricePerKg);
            } else {
                setTotalPrice(0);
            }
        } else {
            setTotalPrice(0);
        }
    }, [actualWeight, wastePrice]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!actualWeight || parseFloat(actualWeight) <= 0) {
            toast.error('Please enter a valid weight');
            return;
        }

        if (!wastePrice) {
            toast.error('Waste price not loaded');
            return;
        }

        try {
            setSubmitting(true);

            // Prepare collection data for AgentSchedule model
            const pricePerKg = wastePrice?.pricePerKg || (totalPrice / parseFloat(actualWeight)) || 0;
            
            const collectionData = {
                scheduleId: currentScheduleData._id,
                wasteType: currentScheduleData.wasteType,
                actualWeight: parseFloat(actualWeight),
                pricePerKg: pricePerKg,
                totalPrice: totalPrice,
                scheduleLocation: {
                    latitude: currentScheduleData.location?.lat || 6.9271,
                    longitude: currentScheduleData.location?.lng || 79.8612,
                    address: currentScheduleData.address || 'Unknown location'
                },
                notes: notes || `Schedule collection by ${agentInfo.name || 'Agent'} on ${new Date().toLocaleDateString()}`
            };

            console.log('🎯 Agent Info:', agentInfo);
            console.log('📋 Schedule Collection Data:', collectionData);
            console.log('💰 Price Details:', { pricePerKg, totalPrice, actualWeight });

            // Check if this is mock data (for testing)
            const isMockData = currentScheduleData._id.length < 20 || !currentScheduleData._id.match(/^[0-9a-fA-F]{24}$/);
            
            if (isMockData) {
                // For mock data, just show success message
                console.log('✅ Mock schedule collection completed:', collectionData);
                toast.success(`Mock schedule collected successfully! Weight: ${actualWeight}kg, Total: Rs. ${totalPrice.toFixed(2)}`);
            } else {
                // Save real schedule collection data
                try {
                    const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/agent-schedules/collect`;
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify(collectionData)
                    });

                    if (!response.ok) {
                        throw new Error('Failed to save schedule collection data');
                    }

                    const result = await response.json();
                    console.log('✅ Schedule collection saved successfully:', result);

                    if (result.message) {
                        toast.success(`Schedule collected successfully! Record ID: ${result.collection?._id?.slice(-6) || 'Unknown'}`);
                    } else {
                        toast.success('Schedule collection saved but with warnings');
                    }
                    
                } catch (apiError) {
                    console.warn('Backend API not available, saving locally:', apiError);
                    
                    // Fallback: Save to local storage if API is not available
                    const localCollections = JSON.parse(localStorage.getItem('localScheduleCollections') || '[]');
                    const newCollection = {
                        ...collectionData,
                        id: Date.now().toString(),
                        timestamp: new Date().toISOString()
                    };
                    localCollections.push(newCollection);
                    localStorage.setItem('localScheduleCollections', JSON.stringify(localCollections));
                    
                    toast.success('Schedule collected successfully! (Saved locally)');
                }
            }

            // Set flag to indicate schedule collection was completed for map refresh
            sessionStorage.setItem('refreshScheduleMap', 'true');
            
            navigate('/pickup-agent-map');

        } catch (error) {
            console.error('Error saving schedule collection:', error);
            toast.error('Failed to save schedule collection data');
        } finally {
            setSubmitting(false);
        }
    };

    if (!currentScheduleData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Schedule data not found</h2>
                    <button
                        onClick={() => navigate('/pickup-agent-map')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Back to Map
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-2xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Collect Schedule Waste</h1>
                        <div className="text-sm text-gray-600">
                            Schedule: {currentScheduleData.address} • {currentScheduleData.wasteType}
                        </div>
                    </div>
                    
                    {/* Schedule Info Card */}
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h3 className="font-semibold text-blue-900 mb-3">Schedule Information</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-medium text-gray-700">Date:</span>
                                <p className="text-gray-900">
                                    {new Date(currentScheduleData.scheduledDate).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <span className="font-medium text-gray-700">Time:</span>
                                <p className="text-gray-900">{currentScheduleData.scheduledTime}</p>
                            </div>
                            <div>
                                <span className="font-medium text-gray-700">User:</span>
                                <p className="text-gray-900">{currentScheduleData.userName || 'Unknown'}</p>
                            </div>
                            <div>
                                <span className="font-medium text-gray-700">Estimated Weight:</span>
                                <p className="text-gray-900">{currentScheduleData.estimatedWeight || 0} kg</p>
                            </div>
                            <div>
                                <span className="font-medium text-gray-700">Waste Type:</span>
                                <p className="text-gray-900 capitalize">{currentScheduleData.wasteType}</p>
                            </div>
                            <div>
                                <span className="font-medium text-gray-700">Price per kg:</span>
                                <p className="text-gray-900">
                                    {loading ? 'Loading...' : `Rs. ${wastePrice?.pricePerKg || 'N/A'}`}
                                </p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Weight Input */}
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label htmlFor="actualWeight" className="block text-sm font-medium text-gray-700 mb-2">
                                    Actual Weight Collected (kg) *
                                </label>
                                <input
                                    type="number"
                                    id="actualWeight"
                                    value={actualWeight}
                                    onChange={(e) => setActualWeight(e.target.value)}
                                    required
                                    min="0.1"
                                    step="0.1"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter weight in kg"
                                    disabled={loading || submitting}
                                />
                            </div>
                        </div>

                        {/* Price Display */}
                        {actualWeight && wastePrice && (
                            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium text-green-900">Calculation:</span>
                                    <span className="text-sm text-green-700">
                                        {actualWeight} kg × Rs. {wastePrice.pricePerKg}/kg
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-green-900">Total Payment:</span>
                                    <span className="text-xl font-bold text-green-900">
                                        Rs. {totalPrice.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        <div>
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                                Collection Notes (Optional)
                            </label>
                            <textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Any additional notes about the collection..."
                                disabled={submitting}
                            />
                        </div>

                        {/* Location Info (Read-only) */}
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-2">Collection Location</h4>
                            <div className="text-sm text-gray-600 space-y-1">
                                <p><span className="font-medium">Address:</span> {currentScheduleData.address}</p>
                                <p><span className="font-medium">Coordinates:</span> {currentScheduleData.location?.lat}, {currentScheduleData.location?.lng}</p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={() => navigate('/pickup-agent-map')}
                                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || !actualWeight || !wastePrice || loading}
                                className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                            >
                                {submitting ? 'Processing...' : 'Complete Collection'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CollectScheduleWaste;