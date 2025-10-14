import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { Outlet, Link, useLocation } from 'react-router-dom';

export default function PickupAgentDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const [stats, setStats] = useState({
    totalPickups: 0,
    todayPickups: 0,
    completedPickups: 0,
    earnings: 0
  });

  const navigationItems = [
    { path: '/pickup-agent/dashboard', label: 'Overview', icon: '📊' },
    { path: '/pickup-agent/dashboard/map', label: 'Collection Map', icon: '🗺️' },
    { path: '/pickup-agent/dashboard/pickups', label: 'Pickups', icon: '📦' },
    { path: '/pickup-agent/dashboard/schedule', label: 'Schedule', icon: '📅' },
    { path: '/pickup-agent/dashboard/salary-inquiry', label: 'Salary Inquiry', icon: '💰' },
    { path: '/pickup-agent/dashboard/profile', label: 'Profile', icon: '👤' }
  ];

  useEffect(() => {
    // Fetch agent stats here
    setStats({
      totalPickups: 45,
      todayPickups: 3,
      completedPickups: 42,
      earnings: 850
    });
  }, []);

  const isActiveLink = (path) => {
    if (path === '/pickup-agent/dashboard') {
      return location.pathname === '/pickup-agent/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white shadow-xl min-h-screen border-r border-gray-200">
          <div className="p-6">
            {/* Agent Info Section */}
            <div className="mb-8 p-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl text-white">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-bold text-lg">Agent Portal</h2>
                  <p className="text-purple-100 text-sm">Welcome back, {user?.name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">On Duty</span>
              </div>
            </div>
            
            <div className="space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActiveLink(item.path)
                      ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-700 hover:bg-purple-50 hover:text-purple-600'
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
          {location.pathname === '/pickup-agent/dashboard' ? (
            <div className="space-y-8">
              {/* Welcome Section */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Your Dashboard</h2>
                  <p className="text-gray-600">Track your pickups and manage your daily routes</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm font-medium">Total Pickups</p>
                        <p className="text-3xl font-bold">{stats.totalPickups}</p>
                      </div>
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">📦</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm font-medium">Today's Pickups</p>
                        <p className="text-3xl font-bold">{stats.todayPickups}</p>
                      </div>
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">📅</span>
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

                  <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-yellow-100 text-sm font-medium">Earnings</p>
                        <p className="text-3xl font-bold">Rs.{stats.earnings}</p>
                      </div>
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">💰</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl text-white">🗺️</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">Collection Map</h3>
                      <p className="text-gray-600 text-sm mb-4">View high-fill bins ready for collection</p>
                      <Link
                        to="/pickup-agent/dashboard/map"
                        className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        Open Map
                      </Link>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl text-white">📦</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">Manage Pickups</h3>
                      <p className="text-gray-600 text-sm mb-4">Update pickup status and details</p>
                      <Link
                        to="/pickup-agent/dashboard/pickups"
                        className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Manage Pickups
                      </Link>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl text-white">💰</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">View Earnings</h3>
                      <p className="text-gray-600 text-sm mb-4">Track your daily and monthly earnings</p>
                      <Link
                        to="/pickup-agent/dashboard/earnings"
                        className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        View Earnings
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
