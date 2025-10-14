import { useAuth } from '../lib/auth';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../lib/api';

export default function FinanceManagementDashboard() {
  const { user, logout } = useAuth();
  const location = useLocation();
  
  // State for financial data
  const [financeData, setFinanceData] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalOrders: 0,
    activeUsers: 0,
    totalSalaries: 0,
    operationalCosts: 0,
    profitMargin: 0,
    loading: true
  });
  
  // Check if we're on the main dashboard route
  const isMainDashboard = location.pathname === '/admin/finance' || location.pathname === '/admin/finance/';

  // Fetch financial data
  useEffect(() => {
    if (isMainDashboard) {
      fetchFinancialData();
    }
  }, [isMainDashboard]);

  const fetchFinancialData = async () => {
    try {
      setFinanceData(prev => ({ ...prev, loading: true }));

      // Fetch multiple data sources in parallel
      const [
        wasteOrdersResponse,
        salariesResponse,
        usersResponse,
        wastePricesResponse
      ] = await Promise.all([
        // Waste orders for revenue calculation
        api.get('/api/admin/waste-orders?limit=100').catch(() => ({ data: { orders: [] } })),
        
        // Salary data
        api.get('/api/salary/admin/all').catch(() => ({ data: { salaries: [] } })),
        
        // Users count
        api.get('/api/admin/users').catch(() => ({ data: { users: [] } })),
        
        // Waste prices for operational insights
        api.get('/api/waste-prices').catch(() => ({ data: { wastePrices: [] } }))
      ]);

      // Calculate financial metrics
      const orders = wasteOrdersResponse.data?.orders || [];
      const salaries = salariesResponse.data?.data || []; // Updated to access the correct data field
      const users = usersResponse.data?.users || [];

      // Total revenue from service charges
      const totalRevenue = orders.reduce((sum, order) => {
        return sum + (order.adminTaxAmount || 0);
      }, 0);

      // Monthly revenue (current month)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyRevenue = orders
        .filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
        })
        .reduce((sum, order) => sum + (order.adminTaxAmount || 0), 0);

      // Total orders count
      const totalOrders = orders.length;

      // Active users (users with recent activity)
      const activeUsers = users.filter(user => {
        if (!user.lastLogin) return false;
        const lastLogin = new Date(user.lastLogin);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return lastLogin >= thirtyDaysAgo;
      }).length;

      // Total salaries
      const totalSalaries = salaries.reduce((sum, salary) => {
        return sum + (salary.totalSalary || salary.amount || 0);
      }, 0);

      // Estimate operational costs (40% of revenue + salaries)
      const operationalCosts = (totalRevenue * 0.4) + totalSalaries;

      // Calculate profit margin
      const netProfit = totalRevenue - operationalCosts;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      setFinanceData({
        totalRevenue,
        monthlyRevenue,
        totalOrders,
        activeUsers: activeUsers || users.length, // Fallback to total users if no activity data
        totalSalaries,
        operationalCosts,
        profitMargin,
        loading: false
      });

    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast.error('Failed to load financial data');
      setFinanceData(prev => ({ ...prev, loading: false }));
    }
  };

  const navigationSections = [
    {
      title: 'Financial Overview',
      items: [
        {
          id: 'dashboard',
          label: 'Finance Dashboard',
          icon: '📊',
          description: 'Financial summary and key metrics'
        },
        {
          id: 'analytics',
          label: 'Revenue Analytics',
          icon: '📈',
          path: '/admin/finance/analytics',
          description: 'Revenue trends and profit analysis'
        },
        {
          id: 'reports',
          label: 'Financial Reports',
          icon: '📋',
          description: 'Generate comprehensive reports'
        }
      ]
    },
    {
      title: 'Pricing Management',
      items: [
        {
          id: 'waste-prices',
          label: 'Waste Prices',
          icon: '💰',
          path: '/admin/dashboard/waste-prices',
          description: 'Manage waste collection pricing'
        },
        {
          id: 'warehouse-prices',
          label: 'Warehouse Prices',
          icon: '🏭',
          path: '/admin/dashboard/warehouse-waste-prices',
          description: 'Warehouse waste pricing & taxes'
        },
        {
          id: 'rate-calculator',
          label: 'Rate Calculator',
          icon: '🔢',
          description: 'Calculate optimal pricing rates'
        }
      ]
    },
    {
      title: 'Payroll & Expenses',
      items: [
        {
          id: 'salaries',
          label: 'Salary Management',
          icon: '💼',
          path: '/admin/finance/salaries',
          description: 'Employee payroll and salaries'
        },
        {
          id: 'bonuses',
          label: 'Bonuses & Incentives',
          icon: '🎁',
          description: 'Performance bonuses and rewards'
        },
        {
          id: 'expenses',
          label: 'Operational Expenses',
          icon: '💸',
          description: 'Track operational costs'
        }
      ]
    },
    {
      title: 'Transactions & Payments',
      items: [
        {
          id: 'waste-orders',
          label: 'Waste Orders',
          icon: '🗂️',
          path: '/admin/finance/waste-orders',
          description: 'Manage and approve waste orders'
        },
        {
          id: 'transactions',
          label: 'Transaction History',
          icon: '💳',
          description: 'All financial transactions'
        },
        {
          id: 'payments',
          label: 'Payment Processing',
          icon: '💱',
          description: 'Process payments and refunds'
        },
        {
          id: 'invoices',
          label: 'Invoice Management',
          icon: '🧾',
          description: 'Generate and manage invoices'
        }
      ]
    },
    {
      title: 'Budget & Planning',
      items: [
        {
          id: 'budgets',
          label: 'Budget Management',
          icon: '📝',
          description: 'Create and manage budgets'
        },
        {
          id: 'forecasting',
          label: 'Financial Forecasting',
          icon: '🔮',
          description: 'Predict future financial trends'
        },
        {
          id: 'planning',
          label: 'Strategic Planning',
          icon: '🎯',
          description: 'Long-term financial planning'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      

      <div className="flex">
        <aside className="w-80 bg-white/90 backdrop-blur-sm shadow-2xl min-h-[calc(100vh-80px)] border-r border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold">F</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Navigation</h2>
                <p className="text-xs text-gray-600">Financial Tools & Reports</p>
              </div>
            </div>
          </div>

          <nav className="p-4 space-y-6 max-h-[calc(100vh-280px)] overflow-y-auto">
            {navigationSections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-1">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.filter(item => item.path).map((item, itemIndex) => (
                    <Link
                      key={itemIndex}
                      to={item.path}
                      className="group flex items-center space-x-3 px-3 py-2 rounded-xl transition-all duration-300 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:scale-105"
                    >
                      <span className="text-lg group-hover:scale-110 transition-transform duration-300">
                        {item.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm group-hover:text-green-700 transition-colors">
                          {item.label}
                        </p>
                        <p className="text-xs text-gray-500 group-hover:text-green-600 transition-colors truncate">
                          {item.description}
                        </p>
                      </div>
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-green-600 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            
            {/* Navigation Actions */}
            <div className="space-y-2 border-t border-gray-200 pt-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-1">
                Actions
              </h3>
              <div className="space-y-1">
                <Link
                  to="/admin/dashboard"
                  className="group flex items-center space-x-3 px-3 py-2 rounded-xl transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:scale-105"
                >
                  <span className="text-lg group-hover:scale-110 transition-transform duration-300">
                    🏠
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm group-hover:text-blue-700 transition-colors">
                      Admin Dashboard
                    </p>
                    <p className="text-xs text-gray-500 group-hover:text-blue-600 transition-colors truncate">
                      Return to main admin panel
                    </p>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                
                <button
                  onClick={logout}
                  className="group w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all duration-300 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 hover:scale-105"
                >
                  <span className="text-lg group-hover:scale-110 transition-transform duration-300">
                    🚪
                  </span>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-medium text-gray-900 text-sm group-hover:text-red-700 transition-colors">
                      Logout
                    </p>
                    <p className="text-xs text-gray-500 group-hover:text-red-600 transition-colors truncate">
                      Sign out of your account
                    </p>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-red-600 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </nav>
        </aside>

        <main className="flex-1 p-8">
          {isMainDashboard ? (
            <FinanceDashboardContent 
              financeData={financeData} 
              onRefresh={fetchFinancialData}
            />
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}

// Finance Dashboard Content Component
function FinanceDashboardContent({ financeData, onRefresh }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  if (financeData.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading financial data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Finance Dashboard</h1>
        </div>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Total Revenue Card */}
        <div className="group bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border-2 border-emerald-100 hover:border-emerald-300 hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-medium text-emerald-700 uppercase tracking-wide mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mb-2">{formatCurrency(financeData.totalRevenue)}</p>
              <div className="flex items-center">
                <svg className="w-4 h-4 text-emerald-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="text-sm text-emerald-600 font-medium">All time service charges</span>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Revenue Card */}
        <div className="group bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-100 hover:border-blue-300 hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-medium text-blue-700 uppercase tracking-wide mb-1">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mb-2">{formatCurrency(financeData.monthlyRevenue)}</p>
              <div className="flex items-center">
                <svg className="w-4 h-4 text-blue-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm text-blue-600 font-medium">Current month</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
        <h3 className="text-2xl font-bold text-gray-900 mb-8">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Revenue Analytics Card */}
          <Link
            to="/admin/finance/analytics"
            className="group bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border-2 border-emerald-100 hover:border-emerald-300 hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-emerald-700 transition-colors">Revenue Analytics</h4>
              <p className="text-sm text-gray-600 group-hover:text-emerald-600 transition-colors">Track revenue trends and growth patterns</p>
            </div>
          </Link>

          {/* Manage Salaries Card */}
          <Link
            to="/admin/finance/salaries"
            className="group bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-100 hover:border-blue-300 hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">Manage Salaries</h4>
              <p className="text-sm text-gray-600 group-hover:text-blue-600 transition-colors">Employee payroll and compensation management</p>
            </div>
          </Link>

          {/* Waste Orders Card */}
          <Link
            to="/admin/finance/waste-orders"
            className="group bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-6 border-2 border-purple-100 hover:border-purple-300 hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-violet-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-purple-700 transition-colors">Waste Orders</h4>
              <p className="text-sm text-gray-600 group-hover:text-purple-600 transition-colors">Monitor and approve waste collection orders</p>
            </div>
          </Link>

          {/* Manage Prices Card */}
          <Link
            to="/admin/dashboard/waste-prices"
            className="group bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border-2 border-orange-100 hover:border-orange-300 hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-orange-700 transition-colors">Manage Prices</h4>
              <p className="text-sm text-gray-600 group-hover:text-orange-600 transition-colors">Set and update waste collection pricing</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
