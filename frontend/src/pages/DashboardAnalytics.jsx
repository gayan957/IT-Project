import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../lib/api';
import PDFReportModal from '../components/PDFReportModal';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

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
  const [selectedChartData, setSelectedChartData] = useState(null);
  const [showChartModal, setShowChartModal] = useState(false);
  const [selectedChartView, setSelectedChartView] = useState('collections-overview');
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [filteredCollections, setFilteredCollections] = useState([]);

  const chartOptions = [
    { id: 'collections-overview', name: 'Collections Overview', icon: '📈' },
    { id: 'monthly-analysis', name: 'Monthly Analysis', icon: '📊' },
    { id: 'waste-categories', name: 'Waste Categories', icon: '🗂️' },
    { id: 'collection-sources', name: 'Collection Sources', icon: '🔄' }
  ];

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
      const collectionsResponse = await api.get('/api/collections/user/history');
      
      // Fetch user's completed schedule collections from AgentSchedule
      const schedulesResponse = await api.get('/api/agent-schedules/user');

      let collectionsData = [];
      let scheduleData = [];

      if (collectionsResponse.status === 200) {
        collectionsData = collectionsResponse.data.collections || [];
      } else {
        console.warn('Failed to fetch collections:', collectionsResponse.status);
      }

      if (schedulesResponse.status === 200) {
        // AgentSchedule API returns { collections: [...] } format
        scheduleData = schedulesResponse.data.collections || [];
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

      // Initialize filtered data
      setFilteredActivities(recentActivity.slice(0, 8));
      setFilteredCollections(allCollections);

    } catch (error) {
      console.error('Failed to fetch collections:', error);
      if (error.response?.status === 403) {
        toast.error('Access denied. Please check your permissions.');
      } else if (error.response?.status === 401) {
        toast.error('Please log in to view analytics');
        // Optionally redirect to login page
      } else {
        toast.error('Failed to load analytics data');
      }
    } finally {
      setLoading(false);
    }
  };

  // Search and filter function
  const handleSearch = (searchValue) => {
    setSearchTerm(searchValue);
    
    if (!searchValue.trim()) {
      setFilteredActivities(analytics.recentActivity);
      setFilteredCollections(analytics.allCollections);
      return;
    }

    const searchLower = searchValue.toLowerCase();
    
    // Filter recent activities
    const filteredActivitiesResult = analytics.recentActivity.filter(activity =>
      activity.action.toLowerCase().includes(searchLower) ||
      activity.amount.toLowerCase().includes(searchLower) ||
      activity.time.toLowerCase().includes(searchLower) ||
      activity.type.toLowerCase().includes(searchLower)
    );
    
    // Filter all collections
    const filteredCollectionsResult = analytics.allCollections.filter(collection =>
      collection.wasteType.toLowerCase().includes(searchLower) ||
      collection.type.toLowerCase().includes(searchLower) ||
      collection.location.toLowerCase().includes(searchLower) ||
      collection.status.toLowerCase().includes(searchLower) ||
      collection.weight.toString().includes(searchLower) ||
      collection.totalPrice.toString().includes(searchLower)
    );
    
    setFilteredActivities(filteredActivitiesResult);
    setFilteredCollections(filteredCollectionsResult);
  };

  const renderSelectedChart = () => {
    switch (selectedChartView) {
      case 'collections-overview':
        return (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Collections Overview</h3>
                <p className="text-gray-600 text-sm mt-1">Recent performance trends • Click points for details</p>
              </div>
              <div className="text-blue-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="h-96">
              <Line 
                data={{
                  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                  datasets: [
                    {
                      label: 'Collections',
                      data: [12, 19, 8, 15, 24, 18],
                      borderColor: 'rgb(34, 197, 94)',
                      backgroundColor: 'rgba(34, 197, 94, 0.1)',
                      fill: true,
                      tension: 0.4,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                  onClick: (event, activeElements) => {
                    if (activeElements.length > 0) {
                      const index = activeElements[0].index;
                      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
                      const data = [12, 19, 8, 15, 24, 18];
                      
                      setSelectedChartData({
                        type: 'collections-overview',
                        title: `${months[index]} Collections Details`,
                        label: months[index],
                        value: `${data[index]} collections`,
                        color: '#22C55E',
                        details: {
                          month: months[index],
                          totalCollections: data[index],
                          trend: index > 0 ? (data[index] > data[index-1] ? 'Increasing' : 'Decreasing') : 'N/A',
                          change: index > 0 ? `${((data[index] - data[index-1]) / data[index-1] * 100).toFixed(1)}%` : 'N/A',
                          estimatedWeight: `${(data[index] * 4.2).toFixed(1)} kg`
                        }
                      });
                      setShowChartModal(true);
                    }
                  },
                }}
              />
            </div>
          </>
        );
        
      case 'monthly-analysis':
        return (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Monthly Analysis</h3>
                <p className="text-gray-600 text-sm mt-1">Weight vs Collections count • Click bars for details</p>
              </div>
              <div className="text-blue-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="h-96">
              <Bar 
                data={{
                  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                  datasets: [
                    {
                      label: 'Weight (kg)',
                      data: [65, 59, 80, 81, 56, 55],
                      backgroundColor: 'rgba(34, 197, 94, 0.8)',
                      borderColor: 'rgb(34, 197, 94)',
                      borderWidth: 1,
                    },
                    {
                      label: 'Collections',
                      data: [12, 19, 8, 15, 24, 18],
                      backgroundColor: 'rgba(168, 85, 247, 0.8)',
                      borderColor: 'rgb(168, 85, 247)',
                      borderWidth: 1,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                  onClick: (event, activeElements) => {
                    if (activeElements.length > 0) {
                      const datasetIndex = activeElements[0].datasetIndex;
                      const index = activeElements[0].index;
                      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
                      const weightData = [65, 59, 80, 81, 56, 55];
                      const collectionsData = [12, 19, 8, 15, 24, 18];
                      
                      const isWeight = datasetIndex === 0;
                      const value = isWeight ? weightData[index] : collectionsData[index];
                      
                      setSelectedChartData({
                        type: 'monthly-analysis',
                        title: `${months[index]} - ${isWeight ? 'Weight' : 'Collections'} Details`,
                        label: months[index],
                        value: isWeight ? `${value} kg` : `${value} collections`,
                        color: isWeight ? '#22C55E' : '#A855F7',
                        details: {
                          month: months[index],
                          totalWeight: `${weightData[index]} kg`,
                          totalCollections: collectionsData[index],
                          avgPerCollection: `${(weightData[index] / collectionsData[index]).toFixed(1)} kg`,
                          estimatedEarnings: `Rs. ${(weightData[index] * 30).toFixed(0)}`
                        }
                      });
                      setShowChartModal(true);
                    }
                  },
                }}
              />
            </div>
          </>
        );
        
      case 'waste-categories':
        return (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Waste Categories</h3>
                <p className="text-gray-600 text-sm mt-1">Distribution by waste type • Click segments for details</p>
              </div>
              <div className="text-blue-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
            </div>
            <div className="h-96">
              <Doughnut 
                data={{
                  labels: ['Plastic', 'Paper', 'Glass', 'Metal', 'Organic'],
                  datasets: [
                    {
                      data: [30, 25, 15, 20, 10],
                      backgroundColor: [
                        '#EF4444',
                        '#3B82F6',
                        '#10B981',
                        '#F59E0B',
                        '#8B5CF6',
                      ],
                      borderColor: [
                        '#DC2626',
                        '#2563EB',
                        '#059669',
                        '#D97706',
                        '#7C3AED',
                      ],
                      borderWidth: 2,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                  onClick: (event, activeElements) => {
                    if (activeElements.length > 0) {
                      const index = activeElements[0].index;
                      const labels = ['Plastic', 'Paper', 'Glass', 'Metal', 'Organic'];
                      const data = [30, 25, 15, 20, 10];
                      const colors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];
                      
                      setSelectedChartData({
                        type: 'waste-category',
                        title: `${labels[index]} Waste Details`,
                        label: labels[index],
                        value: data[index],
                        percentage: ((data[index] / data.reduce((a, b) => a + b, 0)) * 100).toFixed(1),
                        color: colors[index],
                        details: {
                          totalWeight: `${data[index]} kg`,
                          collections: Math.floor(data[index] / 2.5),
                          avgPerCollection: (data[index] / Math.floor(data[index] / 2.5)).toFixed(1),
                          estimatedValue: `Rs. ${(data[index] * 25).toFixed(0)}`
                        }
                      });
                      setShowChartModal(true);
                    }
                  },
                }}
              />
            </div>
          </>
        );
        
      case 'collection-sources':
        return (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Collection Sources</h3>
                <p className="text-gray-600 text-sm mt-1">Regular vs Scheduled collections • Click segments for details</p>
              </div>
              <div className="text-blue-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
            </div>
            <div className="h-96">
              <Pie 
                data={{
                  labels: ['Waste Collections', 'Schedule Collections'],
                  datasets: [
                    {
                      data: [analytics.binCollections, analytics.scheduleCollections],
                      backgroundColor: ['#8B5CF6', '#F59E0B'],
                      borderColor: ['#7C3AED', '#D97706'],
                      borderWidth: 2,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                  onClick: (event, activeElements) => {
                    if (activeElements.length > 0) {
                      const index = activeElements[0].index;
                      const labels = ['Waste Collections', 'Schedule Collections'];
                      const data = [analytics.binCollections, analytics.scheduleCollections];
                      const colors = ['#8B5CF6', '#F59E0B'];
                      const total = data.reduce((a, b) => a + b, 0);
                      
                      setSelectedChartData({
                        type: 'collection-source',
                        title: `${labels[index]} Details`,
                        label: labels[index],
                        value: data[index],
                        percentage: total > 0 ? ((data[index] / total) * 100).toFixed(1) : '0',
                        color: colors[index],
                        details: {
                          totalCollections: data[index],
                          totalWeight: `${(parseFloat(analytics.totalWeight) * (data[index] / total)).toFixed(1)} kg`,
                          totalEarnings: `Rs. ${(parseFloat(analytics.totalEarnings) * (data[index] / total)).toFixed(2)}`,
                          avgPerCollection: data[index] > 0 ? `${(parseFloat(analytics.totalWeight) / data[index]).toFixed(1)} kg` : '0 kg'
                        }
                      });
                      setShowChartModal(true);
                    }
                  },
                }}
              />
            </div>
          </>
        );
        
      default:
        return null;
    }
  };
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          My Waste Collection Analytics
        </h1>
        <p className="text-gray-600 mt-3 text-lg">
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
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
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

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
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

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
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

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
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

          {/* Charts Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.121 2.122" />
                </svg>
                <span>Click on any chart element to view detailed information</span>
              </div>
              
              {/* Chart Selector Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                >
                  <span>{chartOptions.find(option => option.id === selectedChartView)?.icon}</span>
                  <span>{chartOptions.find(option => option.id === selectedChartView)?.name}</span>
                  <svg className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                    <div className="p-2">
                      {chartOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => {
                            setSelectedChartView(option.id);
                            setShowDropdown(false);
                          }}
                          className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-md text-sm transition-colors ${
                            option.id === selectedChartView ? 'bg-purple-50 text-purple-700' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <span className="text-lg">{option.icon}</span>
                          <span>{option.name}</span>
                          {option.id === selectedChartView && (
                            <svg className="w-4 h-4 ml-auto text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Single Chart Container */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
            {renderSelectedChart()}
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

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by waste type, amount, location, or date..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => handleSearch('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {searchTerm && (
                <div className="mt-2 text-sm text-gray-600">
                  Found {!showDetailedTable ? filteredActivities.length : filteredCollections.length} result(s) for "{searchTerm}"
                </div>
              )}
            </div>
            
            {!showDetailedTable ? (
              // Summary View
              filteredActivities.length > 0 ? (
                <div className="space-y-4">
                  {filteredActivities.map((activity, index) => (
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
                  <p>{searchTerm ? `No activities found matching "${searchTerm}"` : 'No collection activity yet'}</p>
                  <p className="text-sm mt-1">{searchTerm ? 'Try adjusting your search terms' : 'Start collecting waste to see your activity here'}</p>
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
                    {filteredCollections.length > 0 ? (
                      filteredCollections.map((collection, index) => (
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
                          <p className="text-lg font-medium">{searchTerm ? `No collections found matching "${searchTerm}"` : 'No collection data available'}</p>
                          <p className="text-sm mt-1">{searchTerm ? 'Try adjusting your search terms' : 'Start collecting waste to see detailed records here'}</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                
                {/* Table Summary */}
                {filteredCollections.length > 0 && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">
                        Showing {filteredCollections.length} {searchTerm ? 'filtered' : 'total'} collections
                      </span>
                      <div className="flex space-x-4">
                        <span className="text-gray-600">
                          Total Weight: <span className="font-semibold text-gray-900">
                            {filteredCollections.reduce((sum, collection) => sum + (collection.weight || 0), 0).toFixed(1)} kg
                          </span>
                        </span>
                        <span className="text-gray-600">
                          Total Earnings: <span className="font-semibold text-green-600">
                            Rs. {filteredCollections.reduce((sum, collection) => sum + (collection.totalPrice || 0), 0).toFixed(2)}
                          </span>
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

      {/* Chart Details Modal */}
      {showChartModal && selectedChartData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: selectedChartData.color }}
                  ></div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedChartData.title}
                  </h3>
                </div>
                <button
                  onClick={() => setShowChartModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Main Value Display */}
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {selectedChartData.value}
                </div>
                {selectedChartData.percentage && (
                  <div className="text-lg text-gray-600">
                    {selectedChartData.percentage}% of total
                  </div>
                )}
              </div>

              {/* Details Grid */}
              <div className="space-y-4">
                {Object.entries(selectedChartData.details).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </span>
                    <span className="font-semibold text-gray-900">
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowChartModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // You could add more functionality here like exporting or filtering
                    toast.success(`Viewing ${selectedChartData.label} details`);
                  }}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  View More
                </button>
              </div>

              {/* Additional Info */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Interactive Chart</p>
                    <p>Click on different chart segments to view detailed information and insights about your waste collection data.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
