import { useState } from 'react';
import api from '../lib/api';

export default function PaymentDebugTest() {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);

  const runTest = async (testName, apiCall) => {
    setLoading(true);
    try {
      const response = await apiCall();
      setResults(prev => ({
        ...prev,
        [testName]: {
          success: true,
          data: response.data,
          status: response.status
        }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [testName]: {
          success: false,
          error: error.message,
          status: error.response?.status,
          data: error.response?.data
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  const tests = [
    {
      name: 'API Health Check',
      call: () => api.get('/api/health')
    },
    {
      name: 'Simple Payment Test (No Auth)',
      call: () => api.get('/api/payments/simple-test')
    },
    {
      name: 'Payment Health Check',
      call: () => api.get('/api/payments/health')
    },
    {
      name: 'Payment Model Test',
      call: () => api.get('/api/payments/test/model')
    },
    {
      name: 'Payment History',
      call: () => api.get('/api/payments/history?limit=1')
    },
    {
      name: 'Create Test Payment',
      call: () => api.post('/api/payments/test/create')
    }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Payment API Debug Tests</h3>
      
      <div className="space-y-3 mb-6">
        {tests.map((test) => (
          <button
            key={test.name}
            onClick={() => runTest(test.name, test.call)}
            disabled={loading}
            className="w-full px-4 py-2 text-left bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors disabled:opacity-50"
          >
            {test.name}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {Object.entries(results).map(([testName, result]) => (
          <div key={testName} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">{testName}</h4>
              <span className={`px-2 py-1 text-xs rounded-full ${
                result.success 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {result.success ? 'SUCCESS' : 'ERROR'}
              </span>
            </div>
            
            <div className="text-sm">
              <p className="text-gray-600 mb-1">Status: {result.status}</p>
              <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(result.data || result.error, null, 2)}
              </pre>
            </div>
          </div>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Running test...</span>
        </div>
      )}
    </div>
  );
}