import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const CollectWaste = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const binData = location.state?.binData;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [wasteWeight, setWasteWeight] = useState('');
  const [wastePrice, setWastePrice] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);

  // Sample bin data for testing when no data is passed
  const sampleBinData = {
    _id: 'sample-bin-1',
    wasteType: 'metal',
    fillLevel: 84,
    address: 'Sample Location for Testing',
    owner: { fullName: 'Sample Owner' },
    location: { coordinates: [79.8612, 6.9271] }
  };

  // Use binData if available, otherwise use sample data for testing
  const currentBinData = binData || sampleBinData;

  // Get agent info from localStorage or context
  const agentInfo = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchWastePrice = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get authentication token
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.warn('No authentication token found');
        // For demo purposes, create a demo token or use sample prices
        setWastePrice({
          wasteType: currentBinData.wasteType,
          pricePerKg: 35.0 // Default price for metal
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
        const priceData = result.data.find(p => p.wasteType === currentBinData.wasteType);
        if (priceData) {
          console.log('Found price data:', priceData);
          setWastePrice(priceData);
          return;
        } else {
          throw new Error(`Price not found for ${currentBinData.wasteType} waste`);
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
      
      const defaultPrice = defaultPrices[currentBinData.wasteType.toLowerCase()] || 25.0;
      
      setWastePrice({
        wasteType: currentBinData.wasteType,
        pricePerKg: defaultPrice
      });
      
      toast.error(`Using default price for ${currentBinData.wasteType}: Rs. ${defaultPrice}/kg`);
    } finally {
      setLoading(false);
    }
  }, [currentBinData.wasteType]);

  useEffect(() => {
    if (!binData) {
      console.log('No bin data provided, using sample data for testing');
    }

    fetchWastePrice();
  }, [binData, fetchWastePrice]);

  useEffect(() => {
    // Calculate total price when weight changes
    if (wasteWeight && wastePrice) {
      const weight = parseFloat(wasteWeight);
      if (!isNaN(weight) && weight > 0) {
        setTotalPrice(weight * wastePrice.pricePerKg);
      } else {
        setTotalPrice(0);
      }
    } else {
      setTotalPrice(0);
    }
  }, [wasteWeight, wastePrice]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!wasteWeight || parseFloat(wasteWeight) <= 0) {
      toast.error('Please enter a valid weight');
      return;
    }

    if (!wastePrice) {
      toast.error('Waste price not loaded');
      return;
    }

    try {
      setSubmitting(true);

      // Prepare collection data for new AgentBin model
      const pricePerKg = wastePrice?.pricePerKg || (totalPrice / parseFloat(wasteWeight)) || 0;
      
      const collectionData = {
        agentId: agentInfo._id || agentInfo.id,
        binId: currentBinData._id,
        userId: currentBinData.owner?._id || currentBinData.userId,
        partnerId: agentInfo.partnerId,
        wasteType: currentBinData.wasteType,
        wasteWeight: parseFloat(wasteWeight),
        pricePerKg: pricePerKg,
        totalPrice: totalPrice,
        fillLevelBefore: currentBinData.fillLevel || 0,
        fillLevelAfter: 0,
        binLocation: {
          latitude: currentBinData.location?.coordinates?.[1] || currentBinData.latitude || 6.9271, // Default to Colombo
          longitude: currentBinData.location?.coordinates?.[0] || currentBinData.longitude || 79.8612, // Default to Colombo
          address: currentBinData.address || currentBinData.location?.address || 'Unknown location'
        },
        status: 'collected',
        notes: `Collection by ${agentInfo.name || 'Agent'} on ${new Date().toLocaleDateString()}`
      };

      console.log('🎯 Agent Info:', agentInfo);
      console.log('📋 Collection Data:', collectionData);
      console.log('💰 Price Details:', { pricePerKg, totalPrice, wasteWeight });

      // Save collection data
      try {
        const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/collections`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(collectionData)
        });

        if (!response.ok) {
          throw new Error('Failed to save collection data');
        }

        const result = await response.json();
        console.log('✅ Collection saved successfully:', result);

        if (result.success) {
          toast.success(`Waste collected successfully! Record ID: ${result.recordId?.slice(-6) || 'Unknown'}`);
          console.log('🗂️ Bin updated:', result.binUpdated ? 'Yes' : 'No');
        } else {
          toast.success('Collection saved but with warnings');
        }
        
      } catch (apiError) {
        console.warn('Backend API not available, saving locally:', apiError);
        
        // Fallback: Save to local storage if API is not available
        const localCollections = JSON.parse(localStorage.getItem('localCollections') || '[]');
        const newCollection = {
          ...collectionData,
          id: Date.now().toString(),
          timestamp: new Date().toISOString()
        };
        localCollections.push(newCollection);
        localStorage.setItem('localCollections', JSON.stringify(localCollections));
        
        toast.success('Waste collected successfully! (Saved locally)');
      }

      // Set flag to indicate collection was completed for map refresh
      sessionStorage.setItem('collectionCompleted', 'true');
      
      navigate('/pickup-agent-map');

    } catch (error) {
      console.error('Error saving collection:', error);
      toast.error('Failed to save collection data');
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentBinData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Bin data not found</h2>
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
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Collect Waste</h1>
          <button
            onClick={() => navigate('/pickup-agent-map')}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Bin Information */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Bin Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Location:</span>
              <span className="text-gray-900">
                {currentBinData.address || currentBinData.label || currentBinData._id || 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Current Fill:</span>
              <span className="text-gray-900">{currentBinData.fillLevel || 0}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Owner:</span>
              <span className="text-gray-900">
                {currentBinData.owner?.fullName || currentBinData.owner?.name || 'Unknown'}
              </span>
            </div>
          </div>
        </div>

        {/* Waste Type */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Waste Type
          </label>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-blue-900 font-semibold capitalize">
              {currentBinData.wasteType}
            </span>
          </div>
        </div>

        {/* Price per KG */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price per 1kg
          </label>
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            {loading ? (
              <div className="animate-pulse text-gray-500">Loading price...</div>
            ) : wastePrice ? (
              <span className="text-green-900 font-semibold">
                Rs. {wastePrice.pricePerKg.toFixed(2)}
              </span>
            ) : (
              <span className="text-red-600">Price not available</span>
            )}
          </div>
        </div>

        {/* Weight Input */}
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-2">
              Weight (kg) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="weight"
              value={wasteWeight}
              onChange={(e) => setWasteWeight(e.target.value)}
              step="0.1"
              min="0.1"
              placeholder="Enter weight in kg"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Total Price */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Price
            </label>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <span className="text-yellow-900 font-bold text-lg">
                Rs. {totalPrice.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || loading || !wastePrice || !wasteWeight}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </div>
            ) : (
              'Done'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CollectWaste;