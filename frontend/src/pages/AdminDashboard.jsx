import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { Outlet, Link, useLocation } from 'react-router-dom';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSchedules: 0,
    pendingSchedules: 0,
    completedSchedules: 0
  });

  const navigationItems = [
    { path: '/admin/dashboard', label: 'Overview', icon: '📊' },
    { path: '/admin/dashboard/users', label: 'User Management', icon: '👥' },
    { path: '/admin/dashboard/pickup-partners', label: 'Pickup Partners', icon: '🚛' },
    { path: '/admin/dashboard/pickup-agents', label: 'Pickup Agents', icon: '🚚' },
    { path: '/admin/dashboard/recyclers', label: 'Recycler Management', icon: '♻️' },
    { path: '/admin/dashboard/schedules', label: 'Schedule Management', icon: '📅' },
    { path: '/admin/dashboard/bins', label: 'Bin Management', icon: '🗑️' },
    { path: '/admin/dashboard/support-tickets', label: 'Support Tickets', icon: '🎫' },
    { path: '/admin/dashboard/waste-prices', label: 'Waste Prices', icon: '💰' },
    { path: '/admin/dashboard/warehouse-waste-prices', label: 'Warehouse Waste Prices', icon: '🏭' },
    { path: '/admin/dashboard/ai-forecasting', label: 'Waste Price Forecasting', icon: '🤖' }
  ];

  useEffect(() => {
    // Fetch admin stats here
    // This is a placeholder - you'd implement actual API calls
    setStats({
      totalUsers: 150,
      totalSchedules: 45,
      pendingSchedules: 12,
      completedSchedules: 33
    });
  }, []);

  const isActiveLink = (path) => {
    if (path === '/admin/dashboard') {
      return location.pathname === '/admin/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Modern Admin Header */}
      <header className="shadow-lg border-b border-gray-200 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Admin Portal</h1>
                <p className="text-gray-600 text-sm font-medium">Welcome back, {user?.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 bg-emerald-50 px-4 py-2 rounded-xl">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-emerald-700 text-sm font-medium">System Online</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Modern Sidebar */}
        <aside className="w-72 bg-white/80 backdrop-blur-sm shadow-xl min-h-screen border-r border-gray-200">
          <nav className="p-6">
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Navigation</h2>
              <div className="w-12 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></div>
            </div>
            
            {/* Finance Management Dashboard Link */}
            <div className="mb-6">
              <Link
                to="/admin/finance"
                className="group relative bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl p-4 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-500 hover:scale-105 overflow-hidden block"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-white text-base group-hover:text-green-50 transition-colors">Finance Management Dashboard</p>
                    <p className="text-green-100 text-xs group-hover:text-green-50 transition-colors">Comprehensive financial management</p>
                  </div>
                  <svg className="w-5 h-5 text-white/80 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            </div>
            <ul className="space-y-2">
              {navigationItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`group flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-300 ${
                      isActiveLink(item.path)
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg transform scale-105'
                        : 'text-gray-600 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 hover:text-emerald-700 hover:scale-105'
                    }`}
                  >
                    <span className={`text-xl transition-transform duration-300 ${isActiveLink(item.path) ? 'scale-110' : 'group-hover:scale-110'}`}>
                      {item.icon}
                    </span>
                    <span className="font-semibold">{item.label}</span>
                    {isActiveLink(item.path) && (
                      <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {location.pathname === '/admin/dashboard' ? (
            // Enhanced admin dashboard content
            <div className="space-y-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-3xl"></div>
                <div className="relative bg-white/60 backdrop-blur-sm rounded-3xl p-8 border border-white/20 shadow-xl">
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3">
                    Dashboard Overview
                  </h2>
                  <p className="text-gray-600 text-lg">Monitor and manage your waste management system with real-time insights</p>
                </div>
              </div>

              {/* Enhanced Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="group relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-500 hover:scale-105">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">Total Users</p>
                      <p className="text-4xl font-bold text-gray-900 mb-1">{stats.totalUsers}</p>
                      <div className="flex items-center text-sm text-green-600 font-medium">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        +12% this month
                      </div>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="group relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-500 hover:scale-105">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">Total Schedules</p>
                      <p className="text-4xl font-bold text-gray-900 mb-1">{stats.totalSchedules}</p>
                      <div className="flex items-center text-sm text-green-600 font-medium">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        +8% this week
                      </div>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="group relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-500 hover:scale-105">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-orange-600/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">Pending</p>
                      <p className="text-4xl font-bold text-orange-600 mb-1">{stats.pendingSchedules}</p>
                      <div className="flex items-center text-sm text-orange-600 font-medium">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse"></div>
                        Needs attention
                      </div>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="group relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-500 hover:scale-105">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">Completed</p>
                      <p className="text-4xl font-bold text-green-600 mb-1">{stats.completedSchedules}</p>
                      <div className="flex items-center text-sm text-green-600 font-medium">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        98% success rate
                      </div>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Quick Actions */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-3xl"></div>
                <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Quick Actions</h3>
                      <p className="text-gray-600 mt-1">Streamline your workflow with these essential tools</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Link
                      to="/admin/dashboard/users"
                      className="group relative bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30 hover:shadow-2xl transition-all duration-500 hover:scale-105 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="relative flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-bold text-blue-900 text-lg group-hover:text-blue-700 transition-colors">Manage Users</p>
                          <p className="text-sm text-blue-700/70 group-hover:text-blue-600 transition-colors">View and edit user accounts</p>
                        </div>
                      </div>
                    </Link>

                    <Link
                      to="/admin/dashboard/schedules"
                      className="group relative bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30 hover:shadow-2xl transition-all duration-500 hover:scale-105 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="relative flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-bold text-emerald-900 text-lg group-hover:text-emerald-700 transition-colors">Schedule Overview</p>
                          <p className="text-sm text-emerald-700/70 group-hover:text-emerald-600 transition-colors">Monitor pickup schedules</p>
                        </div>
                      </div>
                    </Link>

                    <Link
                      to="/admin/dashboard/bins"
                      className="group relative bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30 hover:shadow-2xl transition-all duration-500 hover:scale-105 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="relative flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-bold text-green-900 text-lg group-hover:text-green-700 transition-colors">Bin Management</p>
                          <p className="text-sm text-green-700/70 group-hover:text-green-600 transition-colors">Monitor waste bins</p>
                        </div>
                      </div>
                    </Link>

                    <Link
                      to="/admin/dashboard/analytics"
                      className="group relative bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30 hover:shadow-2xl transition-all duration-500 hover:scale-105 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="relative flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-bold text-purple-900 text-lg group-hover:text-purple-700 transition-colors">View Analytics</p>
                          <p className="text-sm text-purple-700/70 group-hover:text-purple-600 transition-colors">System performance insights</p>
                        </div>
                      </div>
                    </Link>
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
