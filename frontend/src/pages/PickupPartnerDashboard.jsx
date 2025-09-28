import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import api from '../lib/api';

export default function PickupPartnerDashboard() {
  const location = useLocation();
  const [stats, setStats] = useState({
    totalPickups: 0,
    pendingPickups: 0,
    completedPickups: 0,
    monthlyEarnings: 0
  });

  const [warehouseData, setWarehouseData] = useState([]);
  const [warehouseLoading, setWarehouseLoading] = useState(true);
  const [totalWeight, setTotalWeight] = useState(0);

  const navigationItems = [
    { path: '/pickup-partner/dashboard', label: 'Overview', icon: '📊' },
    { path: '/pickup-partner/dashboard/bin-collection', label: 'Bin Collection', icon: '🗑️' },
    { path: '/pickup-partner/dashboard/schedule-collection', label: 'Schedule Collection', icon: '📅' },
    { path: '/pickup-partner/dashboard/warehouse', label: 'Warehouse', icon: '🏪' },
    { path: '/pickup-partner/dashboard/orders', label: 'Orders', icon: '📋' },
    { path: '/pickup-partner/dashboard/agents', label: 'Pickup Agent Management', icon: '🚛' },
    { path: '/pickup-partner/dashboard/calculate-salary', label: 'Calculate Salary', icon: '🧮' },
    { path: '/pickup-partner/dashboard/agent-salaries', label: 'Agent Salaries', icon: '💰' }
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch partner stats
        setStats({
          totalPickups: 120,
          pendingPickups: 8,
          completedPickups: 112,
          monthlyEarnings: 2450
        });

        // Fetch warehouse data
        const response = await api.get('/api/pickup-partners/warehouse');
        if (response.data.success) {
          setWarehouseData(response.data.data.warehouseData);
          setTotalWeight(response.data.data.totalWeight);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setWarehouseLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const isActiveLink = (path) => {
    if (path === '/pickup-partner/dashboard') {
      return location.pathname === '/pickup-partner/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  // Helper function to get waste type emoji and color
  const getWasteTypeInfo = (wasteType) => {
    const wasteTypeMap = {
      plastic: { emoji: '♻️', color: 'from-blue-500 to-cyan-500', bgColor: 'bg-blue-50', textColor: 'text-blue-700' },
      paper: { emoji: '📄', color: 'from-yellow-500 to-orange-500', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700' },
      glass: { emoji: '🍶', color: 'from-green-500 to-emerald-500', bgColor: 'bg-green-50', textColor: 'text-green-700' },
      metal: { emoji: '🔧', color: 'from-gray-500 to-slate-500', bgColor: 'bg-gray-50', textColor: 'text-gray-700' },
      organic: { emoji: '🌱', color: 'from-green-600 to-lime-600', bgColor: 'bg-green-50', textColor: 'text-green-700' },
      electronic: { emoji: '💻', color: 'from-purple-500 to-indigo-500', bgColor: 'bg-purple-50', textColor: 'text-purple-700' },
      mixed: { emoji: '🗂️', color: 'from-red-500 to-pink-500', bgColor: 'bg-red-50', textColor: 'text-red-700' }
    };
    return wasteTypeMap[wasteType] || { emoji: '📦', color: 'from-gray-400 to-gray-500', bgColor: 'bg-gray-50', textColor: 'text-gray-700' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white shadow-xl min-h-screen border-r border-gray-200">
          <div className="p-6">
            <div className="space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActiveLink(item.path)
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {location.pathname === '/pickup-partner/dashboard' ? (
            <div className="space-y-8">
              {/* Welcome Section */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Partner Dashboard</h1>
                <p className="text-gray-600">Manage your pickup operations and track your performance</p>
              </div>

              {/* Stats Grid */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm font-medium">Total Pickups</p>
                        <p className="text-3xl font-bold">{stats.totalPickups}</p>
                      </div>
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">📦</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-yellow-100 text-sm font-medium">Pending</p>
                        <p className="text-3xl font-bold">{stats.pendingPickups}</p>
                      </div>
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">⏰</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm font-medium">Completed</p>
                        <p className="text-3xl font-bold">{stats.completedPickups}</p>
                      </div>
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">✅</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm font-medium">Monthly Earnings</p>
                        <p className="text-3xl font-bold">${stats.monthlyEarnings}</p>
                      </div>
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">💰</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Warehouse Inventory */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Warehouse Inventory</h3>
                    <p className="text-gray-600">Current waste storage by type</p>
                  </div>
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 px-4 py-2 rounded-xl border border-emerald-200">
                    <span className="text-emerald-700 font-semibold text-sm">
                      Total: {totalWeight.toFixed(2)} kg
                    </span>
                  </div>
                </div>
                
                {warehouseLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-gray-600">Loading warehouse data...</span>
                    </div>
                  </div>
                ) : warehouseData.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl text-gray-400">📦</span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">No Waste in Warehouse</h4>
                    <p className="text-gray-500">Start collecting waste to see your inventory here</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {warehouseData.map((item, index) => {
                      const wasteInfo = getWasteTypeInfo(item.wasteType);
                      const percentage = totalWeight > 0 ? ((item.totalWeight / totalWeight) * 100).toFixed(1) : 0;
                      
                      return (
                        <div key={index} className={`relative overflow-hidden rounded-2xl p-6 ${wasteInfo.bgColor} border border-gray-200 hover:shadow-lg transition-all duration-300 group`}>
                          <div className={`absolute inset-0 bg-gradient-to-br ${wasteInfo.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                          <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                              <div className={`w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm`}>
                                <span className="text-2xl">{wasteInfo.emoji}</span>
                              </div>
                              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${wasteInfo.textColor} bg-white/60`}>
                                {percentage}% of total
                              </div>
                            </div>
                            <div>
                              <h4 className={`font-bold ${wasteInfo.textColor} text-lg mb-1 capitalize`}>
                                {item.wasteType}
                              </h4>
                              <p className="text-gray-600 text-sm mb-3">
                                Weight stored in warehouse
                              </p>
                              <div className="flex items-baseline space-x-2">
                                <span className={`text-2xl font-bold ${wasteInfo.textColor}`}>
                                  {item.totalWeight.toFixed(1)}
                                </span>
                                <span className="text-gray-500 text-sm font-medium">kg</span>
                              </div>
                              <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`bg-gradient-to-r ${wasteInfo.color} h-2 rounded-full transition-all duration-500`}
                                  style={{ width: `${Math.min(percentage, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl text-white">�️</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">Bin Collection</h3>
                      <p className="text-gray-600 text-sm mb-4">Monitor and manage bin collection activities</p>
                      <Link
                        to="/pickup-partner/dashboard/bin-collection"
                        className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        View Collections
                      </Link>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl text-white">�</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">Schedule Collection</h3>
                      <p className="text-gray-600 text-sm mb-4">Plan and schedule collection routes</p>
                      <Link
                        to="/pickup-partner/dashboard/schedule-collection"
                        className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        Schedule Now
                      </Link>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl text-white">�</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">Manage Pickup Agents</h3>
                      <p className="text-gray-600 text-sm mb-4">Assign and manage your pickup agents</p>
                      <Link
                        to="/pickup-partner/dashboard/agents"
                        className="inline-flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                      >
                        Manage Agents
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}
