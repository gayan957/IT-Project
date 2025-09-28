import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import App from './App';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DashboardProfile from './pages/DashboardProfile';
import DashboardBins from './pages/DashboardBins';
import DashboardSchedules from './pages/DashboardSchedules';
import DashboardAnalytics from './pages/DashboardAnalytics';
import DashboardRewards from './pages/DashboardRewards';
import DashboardSupport from './pages/DashboardSupport';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import Unauthorized from './pages/Unauthorized';
import { AuthProvider } from './lib/auth';
import ProtectedRoute from './components/ProtectedRoute';
import PickupAgentLogin from './pages/PickupAgentLogin';
import PickupAgentDashboard from './pages/PickupAgentDashboard';
import PickupAgentProtectedRoute from './components/PickupAgentProtectedRoute';
import PickupAgentMap from './pages/PickupAgentMap';
import Collect from './pages/Collect';
import CollectWaste from './pages/CollectWaste';
import CollectScheduleWaste from './pages/CollectScheduleWaste';
import AgentPickups from './pages/AgentPickups';
import AgentSchedules from './pages/AgentSchedules';
import PickupPartnerLogin from './pages/PickupPartnerLogin';
import PickupPartnerDashboard from './pages/PickupPartnerDashboard';
import PickupPartnerProtectedRoute from './components/PickupPartnerProtectedRoute';
import PickupAgentManagement from './pages/PickupAgentManagement';
import PickupAgentProfile from './pages/PickupAgentProfile';
import PartnerBinCollection from './pages/PartnerBinCollection';
import PartnerScheduleCollection from './pages/PartnerScheduleCollection';
import AdminPickupPartners from './pages/AdminPickupPartners';
import AdminPickupAgents from './pages/AdminPickupAgents';
import AdminRecyclers from './pages/AdminRecyclers';
import AdminSchedules from './pages/AdminSchedules';
import AdminBins from './pages/AdminBins';
import RecyclerLogin from './pages/RecyclerLogin';
import RecyclerRegister from './pages/RecyclerRegister';
import RecyclerDashboard from './pages/RecyclerDashboard';
import RecyclerProtectedRoute from './components/RecyclerProtectedRoute';
import AdminWastePrices from './components/AdminWastePrices';
import AdminWarehouseWastePrices from './components/AdminWarehouseWastePrices';
import FinanceManagementDashboard from './pages/FinanceManagementDashboard';
import FinanceDashboardOverview from './pages/FinanceDashboardOverview';
import FinanceSalaryManagement from './pages/FinanceSalaryManagement';
import RevenueAnalytics from './pages/RevenueAnalytics';
import SalaryCalculation from './pages/SalaryCalculation';
import AgentSalaries from './pages/AgentSalaries';
import AgentSalaryInquiry from './pages/AgentSalaryInquiry';
import PickupPartnerOrders from './pages/PickupPartnerOrders';
import AdminWasteOrders from './pages/AdminWasteOrders';
import AIWastePriceForecasting from './pages/AIWastePriceForecasting';
import AdminSupportTickets from './pages/AdminSupportTickets';
import './index.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'unauthorized', element: <Unauthorized /> },
      { path: 'admin/login', element: <AdminLogin /> },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute allowedRoles={['user']}>
            <Dashboard />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <Navigate to="profile" replace /> }, // default
          { path: 'profile', element: <DashboardProfile /> },
          { path: 'bins', element: <DashboardBins /> },
          { path: 'schedules', element: <DashboardSchedules /> },
          { path: 'analytics', element: <DashboardAnalytics /> },
          { path: 'rewards', element: <DashboardRewards /> },
          { path: 'support', element: <DashboardSupport /> },
        ],
      },
      // Pickup Agent routes
      { path: 'pickup-agent/login', element: <PickupAgentLogin /> },
      { 
        path: 'pickup-agent-map', 
        element: (
          <PickupAgentProtectedRoute>
            <PickupAgentMap />
          </PickupAgentProtectedRoute>
        )
      },
      { 
        path: 'collect-waste', 
        element: (
          <PickupAgentProtectedRoute>
            <CollectWaste />
          </PickupAgentProtectedRoute>
        )
      },
      { 
        path: 'collect-schedule-waste', 
        element: (
          <PickupAgentProtectedRoute>
            <CollectScheduleWaste />
          </PickupAgentProtectedRoute>
        )
      },
      { 
        path: 'agent-pickups', 
        element: (
          <PickupAgentProtectedRoute>
            <AgentPickups />
          </PickupAgentProtectedRoute>
        )
      },
      { 
        path: 'agent-schedules', 
        element: (
          <PickupAgentProtectedRoute>
            <AgentSchedules />
          </PickupAgentProtectedRoute>
        )
      },
      {
        path: 'pickup-agent/dashboard',
        element: (
          <PickupAgentProtectedRoute>
            <PickupAgentDashboard />
          </PickupAgentProtectedRoute>
        ),
        children: [
          { path: 'map', element: <PickupAgentMap /> },
          { path: 'collect/:binId', element: <Collect /> },
          { path: 'pickups', element: <AgentPickups /> },
          { path: 'schedule', element: <AgentSchedules /> },
          { path: 'salary-inquiry', element: <AgentSalaryInquiry /> },
          { path: 'profile', element: <PickupAgentProfile /> },
        ],
      },
      // Pickup Partner routes
      { path: 'pickup-partner/login', element: <PickupPartnerLogin /> },
      {
        path: 'pickup-partner/dashboard',
        element: (
          <PickupPartnerProtectedRoute>
            <PickupPartnerDashboard />
          </PickupPartnerProtectedRoute>
        ),
        children: [
          { path: 'bin-collection', element: <PartnerBinCollection /> },
          { path: 'schedule-collection', element: <PartnerScheduleCollection /> },
          { path: 'orders', element: <PickupPartnerOrders /> },
          { path: 'agents', element: <PickupAgentManagement /> },
          { path: 'calculate-salary', element: <SalaryCalculation /> },
          { path: 'agent-salaries', element: <AgentSalaries /> },
          // Add more pickup partner routes here as needed
        ],
      },
      // Recycler routes
      { path: 'recycler/login', element: <RecyclerLogin /> },
      { path: 'recycler/register', element: <RecyclerRegister /> },
      {
        path: 'recycler/dashboard',
        element: (
          <RecyclerProtectedRoute>
            <RecyclerDashboard />
          </RecyclerProtectedRoute>
        ),
      },
      {
        path: 'admin/dashboard',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        ),
        children: [
          { path: 'users', element: <AdminUsers /> },
          { path: 'pickup-partners', element: <AdminPickupPartners /> },
          { path: 'pickup-agents', element: <AdminPickupAgents /> },
          { path: 'recyclers', element: <AdminRecyclers /> },
          { path: 'schedules', element: <AdminSchedules /> },
          { path: 'bins', element: <AdminBins /> },
          { path: 'support-tickets', element: <AdminSupportTickets /> },
          { path: 'waste-prices', element: <AdminWastePrices /> },
          { path: 'warehouse-waste-prices', element: <AdminWarehouseWastePrices /> },
          { path: 'ai-forecasting', element: <AIWastePriceForecasting /> },
          // Add more admin routes here as needed
        ],
      },
      // Standalone Finance Management Dashboard
      {
        path: 'admin/finance',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <FinanceManagementDashboard />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute allowedRoles={['admin']}>
                <FinanceDashboardOverview />
              </ProtectedRoute>
            ),
          },
          {
            path: 'waste-orders',
            element: (
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminWasteOrders />
              </ProtectedRoute>
            ),
          },
          {
            path: 'analytics',
            element: (
              <ProtectedRoute allowedRoles={['admin']}>
                <RevenueAnalytics />
              </ProtectedRoute>
            ),
          },
          {
            path: 'salaries',
            element: (
              <ProtectedRoute allowedRoles={['admin']}>
                <FinanceSalaryManagement />
              </ProtectedRoute>
            ),
          },
        ],
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
