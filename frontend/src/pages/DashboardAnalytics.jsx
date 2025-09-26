import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import PDFReportModal from '../components/PDFReportModal';

export default function DashboardAnalytics() {
  const [analytics, setAnalytics] = useState({
    totalWeight: 0,
    totalEarnings: 0,
    binCollections: 0,
    scheduleCollections: 0,
    recentActivity: [],
    allCollections: []
  });
  const [loading, setLoading] = useState(true);
  const [showDetailedTable, setShowDetailedTable] = useState(false);
  const [showPDFModal, setShowPDFModal] = useState(false);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Please login to view analytics');
        return;
      }

      // Fetch user collections data (bins and schedules combined)
      const collectionsResponse = await fetch('/api/collections/user/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Fetch user's completed schedule collections from AgentSchedule
      const schedulesResponse = await fetch('/api/agent-schedules/user', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      let collectionsData = [];
      let scheduleData = [];

      if (collectionsResponse.ok) {
        const collectionsResult = await collectionsResponse.json();
        collectionsData = collectionsResult.collections || [];
      } else {
        console.warn('Failed to fetch collections:', collectionsResponse.status);
      }

      if (schedulesResponse.ok) {
        const schedulesResult = await schedulesResponse.json();
        // AgentSchedule API returns { collections: [...] } format
        scheduleData = schedulesResult.collections || [];
      } else {
        console.warn('Failed to fetch schedule collections:', schedulesResponse.status);
      }

      // Calculate analytics
      const totalCollectionsWeight = collectionsData.reduce((sum, item) => sum + (item.wasteWeight || 0), 0);
      const totalScheduleWeight = scheduleData.reduce((sum, item) => sum + (item.wasteWeight || 0), 0);
      const totalWeight = totalCollectionsWeight + totalScheduleWeight;

      const totalCollectionsEarnings = collectionsData.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
      const totalScheduleEarnings = scheduleData.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
      const totalEarnings = totalCollectionsEarnings + totalScheduleEarnings;

      // Create recent activity from both sources
      const recentActivity = [];
      const allCollections = [];
      
      // Add collections data (from bins or other sources)
      collectionsData.forEach(collection => {
        // Handle location - convert coordinate objects to readable strings
        let locationDisplay = 'Collection Point';
        if (collection.location) {
          if (typeof collection.location === 'object' && 
              collection.location.lat && collection.location.lng) {
            // Convert coordinate object to readable string
            locationDisplay = `${collection.location.lat.toFixed(4)}, ${collection.location.lng.toFixed(4)}`;
          } else if (typeof collection.location === 'string') {
            locationDisplay = collection.location;
          }
        }

        const collectionData = {
          id: collection._id,
          type: 'Waste Collection',
          wasteType: collection.wasteType,
          weight: collection.wasteWeight,
          pricePerKg: collection.pricePerKg,
          totalPrice: collection.totalPrice,
          location: locationDisplay,
          date: new Date(collection.collectedAt || collection.createdAt),
          status: collection.status || 'Completed',
          collectionType: 'collection'
        };
        allCollections.push(collectionData);
        
        if (recentActivity.length < 5) {
          recentActivity.push({
            action: `Waste collected - ${collection.wasteType}`,
            amount: `${collection.wasteWeight} kg / Rs. ${collection.totalPrice}`,
            time: new Date(collection.collectedAt || collection.createdAt).toLocaleDateString(),
            color: 'blue',
            type: 'collection'
          });
        }
      });

      // Add schedule collections (from AgentSchedule - completed collections)
      scheduleData.forEach(collection => {
        // Handle location - convert coordinate objects to readable strings  
        let locationDisplay = 'Collection Location';
        if (collection.scheduleLocation) {
          if (collection.scheduleLocation.address) {
            locationDisplay = collection.scheduleLocation.address;
          } else if (collection.scheduleLocation.latitude && collection.scheduleLocation.longitude) {
            // Convert coordinate object to readable string
            locationDisplay = `${collection.scheduleLocation.latitude.toFixed(4)}, ${collection.scheduleLocation.longitude.toFixed(4)}`;
          }
        }

        const collectionData = {
          id: collection._id,
          type: 'Schedule Collection',
          wasteType: collection.wasteType,
          weight: collection.wasteWeight,
          pricePerKg: collection.pricePerKg,
          totalPrice: collection.totalPrice,
          location: locationDisplay,
          date: new Date(collection.collectionDate || collection.createdAt),
          status: collection.status || 'Completed',
          collectionType: 'schedule'
        };
        allCollections.push(collectionData);
        
        if (recentActivity.length < 10) {
          recentActivity.push({
            action: `Schedule waste collected - ${collection.wasteType}`,
            amount: `${collection.wasteWeight} kg / Rs. ${collection.totalPrice}`,
            time: new Date(collection.collectionDate || collection.createdAt).toLocaleDateString(),
            color: 'green',
            type: 'schedule'
          });
        }
      });

      // Sort collections by most recent
      allCollections.sort((a, b) => new Date(b.date) - new Date(a.date));
      recentActivity.sort((a, b) => new Date(b.time) - new Date(a.time));

      setAnalytics({
        totalWeight: totalWeight.toFixed(1),
        totalEarnings: totalEarnings.toFixed(2),
        binCollections: collectionsData.length,
        scheduleCollections: scheduleData.length,
        recentActivity: recentActivity.slice(0, 8),
        allCollections: allCollections
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Waste Collection Analytics</h1>
        <p className="text-gray-600 mt-2">
          Track your waste collection history and earnings from recycling activities
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Total Weight Collected</p>
                  <p className="text-3xl font-bold">{analytics.totalWeight} kg</p>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4-8-4m16 0v10l-8 4-8-4V7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Earnings</p>
                  <p className="text-3xl font-bold">Rs. {analytics.totalEarnings}</p>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Waste Collections</p>
                  <p className="text-3xl font-bold">{analytics.binCollections}</p>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Schedule Collections</p>
                  <p className="text-3xl font-bold">{analytics.scheduleCollections}</p>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Collection Type Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Collection Summary</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                    <span className="font-medium text-gray-900">Waste Collections</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{analytics.binCollections} collections</p>
                    <p className="text-sm text-gray-500">From recycling activities</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                    <span className="font-medium text-gray-900">Schedule Collections</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{analytics.scheduleCollections} collections</p>
                    <p className="text-sm text-gray-500">From scheduled activities</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Average per Collection</p>
                    <p className="text-sm text-gray-500">Weight collected per pickup</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {(analytics.binCollections + analytics.scheduleCollections) > 0 
                        ? (analytics.totalWeight / (analytics.binCollections + analytics.scheduleCollections)).toFixed(1)
                        : '0.0'} kg
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Average Earnings</p>
                    <p className="text-sm text-gray-500">Per collection earnings</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      Rs. {(analytics.binCollections + analytics.scheduleCollections) > 0 
                        ? (analytics.totalEarnings / (analytics.binCollections + analytics.scheduleCollections)).toFixed(0)
                        : '0'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Collection Activity</h3>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPDFModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  Report
                </button>
                <button
                  onClick={() => setShowDetailedTable(!showDetailedTable)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                  {showDetailedTable ? 'Show Summary' : 'Show Detailed Table'}
                </button>
              </div>
            </div>
            
            {!showDetailedTable ? (
              // Summary View
              analytics.recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {analytics.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 ${activity.color === 'blue' ? 'bg-blue-500' : 'bg-green-500'} rounded-full`}></div>
                        <div>
                          <p className="font-medium text-gray-900">{activity.action}</p>
                          <p className="text-sm text-gray-500">{activity.time}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{activity.amount}</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          activity.type === 'collection' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {activity.type === 'collection' ? 'Collection' : 'Schedule'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p>No collection activity yet</p>
                  <p className="text-sm mt-1">Start collecting waste to see your activity here</p>
                </div>
              )
            ) : (
              // Detailed Table View
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Waste Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Weight (kg)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price/kg
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Earnings
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analytics.allCollections.length > 0 ? (
                      analytics.allCollections.map((collection, index) => (
                        <tr key={collection.id || index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>
                              <div className="font-medium">{collection.date.toLocaleDateString()}</div>
                              <div className="text-gray-500">{collection.date.toLocaleTimeString()}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              collection.collectionType === 'collection' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {collection.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                            {collection.wasteType}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {collection.weight} kg
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            Rs. {collection.pricePerKg}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                            Rs. {collection.totalPrice}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {collection.location}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              collection.status === 'Completed' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {collection.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <p className="text-lg font-medium">No collection data available</p>
                          <p className="text-sm mt-1">Start collecting waste to see detailed records here</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                
                {/* Table Summary */}
                {analytics.allCollections.length > 0 && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">
                        Showing {analytics.allCollections.length} total collections
                      </span>
                      <div className="flex space-x-4">
                        <span className="text-gray-600">
                          Total Weight: <span className="font-semibold text-gray-900">{analytics.totalWeight} kg</span>
                        </span>
                        <span className="text-gray-600">
                          Total Earnings: <span className="font-semibold text-green-600">Rs. {analytics.totalEarnings}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* PDF Report Modal */}
      <PDFReportModal 
        isOpen={showPDFModal}
        onClose={() => setShowPDFModal(false)}
        analyticsData={analytics}
      />
    </div>
  );
}
