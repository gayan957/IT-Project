import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

export default function PickupPartnerDashboard() {
  const location = useLocation();
  const [stats, setStats] = useState({
    totalPickups: 0,
    pendingPickups: 0,
    completedPickups: 0,
    monthlyEarnings: 0
  });

  const navigationItems = [
    { path: '/pickup-partner/dashboard', label: 'Overview', icon: '📊' },
    { path: '/pickup-partner/dashboard/bin-collection', label: 'Bin Collection', icon: '🗑️' },
    { path: '/pickup-partner/dashboard/schedule-collection', label: 'Schedule Collection', icon: '📅' },
    { path: '/pickup-partner/dashboard/orders', label: 'Orders', icon: '📋' },
    { path: '/pickup-partner/dashboard/agents', label: 'Pickup Agent Management', icon: '🚛' },
    { path: '/pickup-partner/dashboard/calculate-salary', label: 'Calculate Salary', icon: '🧮' },
    { path: '/pickup-partner/dashboard/agent-salaries', label: 'Agent Salaries', icon: '💰' }
  ];

  useEffect(() => {
    // Fetch partner stats here
    // This is a placeholder - you'd implement actual API calls
    setStats({
      totalPickups: 120,
      pendingPickups: 8,
      completedPickups: 112,
      monthlyEarnings: 2450
    });
  }, []);

  const isActiveLink = (path) => {
    if (path === '/pickup-partner/dashboard') {
      return location.pathname === '/pickup-partner/dashboard';
    }
    return location.pathname.startsWith(path);
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
