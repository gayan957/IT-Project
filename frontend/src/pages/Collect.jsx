import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import collectionApi from '../lib/collectionApi';

const Collect = () => {
  const { binId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get bin data from navigation state or fetch it
  const binFromState = location.state?.bin;
  
  const [bin, setBin] = useState(binFromState || null);
  const [loading, setLoading] = useState(!binFromState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    paymentAmount: '',
    notes: ''
  });

  const fetchBinData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await collectionApi.getBinDetails(binId);
      setBin(response.data.bin);
    } catch (err) {
      setError('Failed to fetch bin details');
      console.error('Error fetching bin:', err);
    } finally {
      setLoading(false);
    }
  }, [binId]);

  useEffect(() => {
    if (!binFromState && binId) {
      fetchBinData();
    }
  }, [binId, binFromState, fetchBinData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!bin) {
      setError('Bin data not available');
      return;
    }

    if (!formData.paymentAmount) {
      setError('Please enter a payment amount');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      const collectionData = {
        paymentAmount: parseFloat(formData.paymentAmount),
        notes: formData.notes
      };

      await collectionApi.collectBin(bin._id, collectionData);
      setSuccess('Collection completed successfully!');
      
      // Navigate back to map after a short delay
      setTimeout(() => {
        navigate('/agent/map', { replace: true });
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete collection');
      console.error('Collection error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(-1); // Go back to previous page
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!bin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Bin not found or invalid collection request.</p>
          <button 
            onClick={handleCancel}
            className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Complete Collection</h1>
          <button
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Bin Information */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h2 className="text-lg font-semibold mb-3 text-gray-700">Bin Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="font-medium text-gray-600">Bin ID:</span>
              <p className="text-gray-800">{bin._id}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Fill Level:</span>
              <p className="text-gray-800">
                <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                  bin.fillLevel >= 75 ? 'bg-red-500' :
                  bin.fillLevel >= 50 ? 'bg-orange-500' : 'bg-green-500'
                }`}></span>
                {bin.fillLevel}%
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Location:</span>
              <p className="text-gray-800">{bin.location?.address || 'N/A'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Bin Type:</span>
              <p className="text-gray-800">{bin.type || 'Standard'}</p>
            </div>
            {bin.user && (
              <div className="md:col-span-2">
                <span className="font-medium text-gray-600">Owner:</span>
                <p className="text-gray-800">{bin.user.name} ({bin.user.email})</p>
              </div>
            )}
          </div>
        </div>

        {/* Collection Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Collection Info - Read Only */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Collection Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-700">Collection Time:</span>
                <p className="text-blue-800">{new Date().toLocaleString()}</p>
              </div>
              <div>
                <span className="font-medium text-blue-700">Waste Type:</span>
                <p className="text-blue-800">{bin.wasteType || 'Mixed'}</p>
              </div>
              <div>
                <span className="font-medium text-blue-700">Estimated Weight:</span>
                <p className="text-blue-800">{((bin.fillLevel / 100) * (bin.capacity || 50)).toFixed(1)} kg</p>
              </div>
              <div>
                <span className="font-medium text-blue-700">Fill Level:</span>
                <p className="text-blue-800">{bin.fillLevel}%</p>
              </div>
            </div>
          </div>

          {/* Payment Amount - Required Field */}
          <div>
            <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-700 mb-1">
              Payment Amount (LKR) *
            </label>
            <input
              type="number"
              id="paymentAmount"
              name="paymentAmount"
              value={formData.paymentAmount}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter payment amount"
              required
            />
          </div>

          {/* Notes - Optional Field */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any additional notes about the collection..."
            />
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 px-6 rounded-md transition duration-200"
            >
              {submitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                'Complete Collection'
              )}
            </button>
            
            <button
              type="button"
              onClick={handleCancel}
              disabled={submitting}
              className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-md transition duration-200"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Collection Guidelines */}
        <div className="mt-8 bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Collection Guidelines</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Ensure proper waste segregation before collection</li>
            <li>• Verify the weight and record accurate measurements</li>
            <li>• Calculate payment based on weight and waste type</li>
            <li>• Take photos if necessary for documentation</li>
            <li>• Leave the area clean after collection</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Collect;