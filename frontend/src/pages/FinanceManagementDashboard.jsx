import { useAuth } from '../lib/auth';
import { Link, Outlet } from 'react-router-dom';

export default function FinanceManagementDashboard() {
  const { user, logout } = useAuth();

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
      <header className="shadow-lg border-b border-gray-200 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Finance Hub</h1>
                <p className="text-gray-600 text-sm font-medium">Comprehensive Financial Management System</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                to="/admin/dashboard"
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200"
              >
                <span>Admin Dashboard</span>
              </Link>
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

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
                  {section.items.map((item, itemIndex) => (
                    item.path ? (
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
                    ) : (
                      <div
                        key={itemIndex}
                        className="group flex items-center space-x-3 px-3 py-2 rounded-xl transition-all duration-300 text-gray-400 cursor-not-allowed"
                      >
                        <span className="text-lg">
                          {item.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">
                            {item.label}
                          </p>
                          <p className="text-xs truncate">
                            {item.description}
                          </p>
                        </div>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">Coming Soon</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
