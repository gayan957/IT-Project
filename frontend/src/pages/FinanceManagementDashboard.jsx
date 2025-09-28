import { useAuth } from '../lib/auth';
import { Link, Outlet } from 'react-router-dom';

export default function FinanceManagementDashboard() {
  const { logout } = useAuth();

  const navigationSections = [
    {
      title: 'Financial Overview',
      items: [
        {
          id: 'analytics',
          label: 'Revenue Analytics',
          icon: '📈',
          path: '/admin/finance/analytics',
          description: 'Revenue trends and profit analysis'
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
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      

      <div className="flex">
        <aside className="w-80 bg-white/90 backdrop-blur-sm shadow-2xl min-h-[calc(100vh-80px)] border-r border-gray-200 flex flex-col">
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

          <nav className="p-4 space-y-6 flex-1 overflow-y-auto">
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

          {/* Bottom Navigation Buttons */}
          <div className="p-4 border-t border-gray-200 space-y-3">
            <Link
              to="/admin/dashboard"
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl font-medium hover:from-gray-200 hover:to-gray-300 transition-all duration-200 transform hover:scale-105 shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v14l-5-3-5 3V5z" />
              </svg>
              <span>Admin Dashboard</span>
            </Link>
            
            <button
              onClick={logout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
