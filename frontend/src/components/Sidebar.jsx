import { NavLink } from "react-router-dom";
import { useAuth } from "../lib/auth";

const MenuItem = ({ to, icon, children, badge }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group
       ${
         isActive
           ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg"
           : "text-gray-700 hover:bg-emerald-50 hover:text-emerald-900"
       }`
    }
  >
    <div className="flex items-center space-x-3">
      <span className="flex-shrink-0">{icon}</span>
      <span className="font-medium">{children}</span>
    </div>
    {badge && (
      <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
        {badge}
      </span>
    )}
  </NavLink>
);

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <div className="p-6">
      {/* User Info */}
      <div className="text-center mb-8 pb-6 border-b border-gray-200">
        <div className="w-16 h-16 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-white font-bold text-xl">
            {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
          </span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{user?.fullName || user?.firstName}</h3>
        <p className="text-sm text-gray-500">{user?.email}</p>
      </div>

      {/* Navigation Menu */}
      <nav className="space-y-2">
        <MenuItem
          to="/dashboard/profile"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        >
          Profile Settings
        </MenuItem>

        <MenuItem
          to="/dashboard/bins"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          }
        >
          My Bins
        </MenuItem>

        <MenuItem
          to="/dashboard/schedules"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        >
          Pickup Schedules
        </MenuItem>

        <MenuItem
          to="/dashboard/analytics"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        >
          Analytics
        </MenuItem>

        <MenuItem
          to="/dashboard/rewards"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          }
        >
          Rewards
        </MenuItem>

        <MenuItem
          to="/dashboard/support"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 12h.01" />
            </svg>
          }
        >
          Support
        </MenuItem>
      </nav>
    </div>
  );
}
