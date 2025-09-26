import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  getRecyclerStatistics,
  getAvailableWaste,
  getRecyclerWarehouse,
  logoutRecycler
} from '../lib/recyclerApi';

const RecyclerDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [statistics, setStatistics] = useState(null);
  const [availableWaste, setAvailableWaste] = useState([]);
  const [warehouseData, setWarehouseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    const userRole = localStorage.getItem('userRole');

    if (!token || userRole !== 'recycler') {
      navigate('/recycler/login');
      return;
    }

    if (userData) {
      setUser(JSON.parse(userData));
    }

    loadDashboardData();
  }, [navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load all data in parallel
      const [statsResponse, wasteResponse, warehouseResponse] = await Promise.allSettled([
        getRecyclerStatistics(),
        getAvailableWaste(1, 10),
        getRecyclerWarehouse()
      ]);

      if (statsResponse.status === 'fulfilled') {
        setStatistics(statsResponse.value.data);
      }

      if (wasteResponse.status === 'fulfilled') {
        setAvailableWaste(wasteResponse.value.data.availableWaste);
      }

      if (warehouseResponse.status === 'fulfilled') {
        setWarehouseData(warehouseResponse.value.data);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (user?.id) {
        await logoutRecycler(user.id);
      }
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userRole');
      
      toast.success('Logged out successfully');
      navigate('/recycler/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-green-600 rounded-full p-2">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Recycler Dashboard</h1>
                <p className="text-gray-600">{user?.facilityName || user?.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-sm text-gray-600">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z' },
              { id: 'waste', label: 'Available Waste', icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' },
              { id: 'inventory', label: 'My Inventory', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
              { id: 'statistics', label: 'Statistics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Weight</p>
                    <p className="text-2xl font-bold text-gray-900">{statistics?.total?.totalWeight || 0} kg</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Entries</p>
                    <p className="text-2xl font-bold text-gray-900">{statistics?.total?.totalEntries || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Waste Types</p>
                    <p className="text-2xl font-bold text-gray-900">{statistics?.wasteTypes?.length || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">This Month</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {statistics?.monthlyTrends?.[statistics.monthlyTrends.length - 1]?.weight || 0} kg
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Waste Entries</h3>
              {warehouseData?.summary?.recentEntries?.length > 0 ? (
                <div className="space-y-3">
                  {warehouseData.summary.recentEntries.slice(0, 5).map((entry) => (
                    <div key={entry._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="bg-green-100 rounded-full p-2">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 capitalize">{entry.wasteType}</p>
                          <p className="text-sm text-gray-600">{formatDate(entry.createdAt)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{entry.totalWeight} kg</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-4">No recent entries found</p>
              )}
            </div>
          </div>
        )}

        {/* Available Waste Tab */}
        {activeTab === 'waste' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Waste for Processing</h3>
            {availableWaste.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableWaste.map((waste) => (
                  <div key={waste._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium text-gray-900 capitalize">{waste.wasteType}</h4>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        Available
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Weight:</span>
                        <span className="text-sm font-medium">{waste.totalWeight} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">From:</span>
                        <span className="text-sm font-medium">{waste.pickupPartnerId?.companyName || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Date:</span>
                        <span className="text-sm font-medium">{formatDate(waste.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-4">No available waste found</p>
            )}
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">My Inventory</h3>
            {warehouseData?.summary?.wasteTypeBreakdown ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(warehouseData.summary.wasteTypeBreakdown).map(([wasteType, weight]) => (
                  <div key={wasteType} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 capitalize">{wasteType}</h4>
                        <p className="text-3xl font-bold text-green-600">{weight} kg</p>
                      </div>
                      <div className="bg-green-100 rounded-full p-3">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-4">No inventory data available</p>
            )}
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'statistics' && (
          <div className="space-y-6">
            {/* Monthly Trends */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Processing Trends</h3>
              {statistics?.monthlyTrends?.length > 0 ? (
                <div className="space-y-4">
                  {statistics.monthlyTrends.map((trend, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          {new Date(trend._id.year, trend._id.month - 1).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long' 
                          })}
                        </p>
                        <p className="text-sm text-gray-600">{trend.count} entries</p>
                      </div>
                      <p className="text-xl font-bold text-green-600">{trend.weight} kg</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-4">No monthly data available</p>
              )}
            </div>

            {/* Waste Type Statistics */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Waste Type Processing Statistics</h3>
              {statistics?.wasteTypes?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {statistics.wasteTypes.map((type) => (
                    <div key={type._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 capitalize">{type._id}</p>
                        <p className="text-sm text-gray-600">{type.count} entries</p>
                      </div>
                      <p className="text-lg font-bold text-green-600">{type.weight} kg</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-4">No waste type data available</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecyclerDashboard;