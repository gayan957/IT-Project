import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import api from '../lib/api';
import { toast } from 'react-hot-toast';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function FinanceDashboardOverview() {
  const [financeStats, setFinanceStats] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    pendingPayments: 0,
    completedTransactions: 0,
    totalOrders: 0,
    pendingOrders: 0,
    approvedOrders: 0,
    rejectedOrders: 0
  });

  const [chartData, setChartData] = useState({
    revenueChart: {
      labels: [],
      datasets: []
    },
    orderChart: {
      labels: [],
      datasets: []
    },
    orderStatusChart: {
      labels: [],
      datasets: []
    }
  });

  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchFinanceData();
    
    // Set up auto-refresh every 30 seconds
    const dataInterval = setInterval(() => {
      fetchFinanceData();
    }, 30000);

    // Update current time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Cleanup intervals on unmount
    return () => {
      clearInterval(dataInterval);
      clearInterval(timeInterval);
    };
  }, []);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      
      // Fetch real data from waste orders API
      const [statsResponse, ordersResponse] = await Promise.all([
        api.get('/api/admin/waste-orders/stats'),
        api.get('/api/admin/waste-orders?limit=100') // Get more orders for better analytics
      ]);

      const stats = statsResponse.data;
      const orders = ordersResponse.data.orders || [];

      // Calculate total revenue from completed orders
      const totalRevenue = orders
        .filter(order => order.orderStatus === 'completed')
        .reduce((sum, order) => sum + (order.totalOrderValue || 0), 0);

      // Calculate monthly revenue (current month)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyRevenue = orders
        .filter(order => {
          const orderDate = new Date(order.createdAt);
          return order.orderStatus === 'completed' &&
                 orderDate.getMonth() === currentMonth &&
                 orderDate.getFullYear() === currentYear;
        })
        .reduce((sum, order) => sum + (order.totalOrderValue || 0), 0);

      // Calculate expenses (estimate as 30% of revenue for operational costs)
      const totalExpenses = totalRevenue * 0.3;
      const netProfit = totalRevenue - totalExpenses;

      // Set finance stats with real data
      setFinanceStats({
        totalRevenue: totalRevenue,
        monthlyRevenue: monthlyRevenue,
        totalExpenses: totalExpenses,
        netProfit: netProfit,
        pendingPayments: stats.pending || 0,
        completedTransactions: stats.completed || 0,
        totalOrders: stats.pending + stats.approved + stats.completed + stats.cancelled || 0,
        pendingOrders: stats.pending || 0,
        approvedOrders: stats.approved || 0,
        rejectedOrders: stats.cancelled || 0
      });

      // Generate chart data based on real orders
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        return {
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          monthNum: date.getMonth(),
          year: date.getFullYear()
        };
      }).reverse();

      const monthlyData = last6Months.map(month => {
        const monthOrders = orders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate.getMonth() === month.monthNum &&
                 orderDate.getFullYear() === month.year &&
                 order.orderStatus === 'completed';
        });
        
        const revenue = monthOrders.reduce((sum, order) => sum + (order.totalOrderValue || 0), 0);
        const expenses = revenue * 0.3; // Estimate expenses as 30% of revenue
        
        return {
          month: month.month,
          revenue,
          expenses
        };
      });

      // Generate weekly order data for current month
      const weeklyData = Array.from({ length: 4 }, (_, i) => {
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - (startOfWeek.getDay() + 7 * i));
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        const weekOrders = orders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= startOfWeek && orderDate <= endOfWeek;
        });
        
        return weekOrders.length;
      }).reverse();

      // Set chart data with real data
      setChartData({
        revenueChart: {
          labels: monthlyData.map(d => d.month),
          datasets: [
            {
              label: 'Revenue',
              data: monthlyData.map(d => d.revenue),
              borderColor: 'rgb(34, 197, 94)',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              tension: 0.4,
              fill: true
            },
            {
              label: 'Expenses',
              data: monthlyData.map(d => d.expenses),
              borderColor: 'rgb(239, 68, 68)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              tension: 0.4,
              fill: true
            }
          ]
        },
        orderChart: {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          datasets: [
            {
              label: 'Orders',
              data: weeklyData,
              backgroundColor: [
                'rgba(59, 130, 246, 0.8)',
                'rgba(16, 185, 129, 0.8)',
                'rgba(245, 158, 11, 0.8)',
                'rgba(139, 69, 19, 0.8)'
              ],
              borderColor: [
                'rgb(59, 130, 246)',
                'rgb(16, 185, 129)',
                'rgb(245, 158, 11)',
                'rgb(139, 69, 19)'
              ],
              borderWidth: 2
            }
          ]
        },
        orderStatusChart: {
          labels: ['Approved', 'Pending', 'Rejected'],
          datasets: [
            {
              data: [stats.approved || 0, stats.pending || 0, stats.cancelled || 0],
              backgroundColor: [
                'rgba(34, 197, 94, 0.8)',
                'rgba(245, 158, 11, 0.8)',
                'rgba(239, 68, 68, 0.8)'
              ],
              borderColor: [
                'rgb(34, 197, 94)',
                'rgb(245, 158, 11)',
                'rgb(239, 68, 68)'
              ],
              borderWidth: 2
            }
          ]
        }
      });

    } catch (error) {
      console.error('Error fetching finance data:', error);
      toast.error('Failed to load financial data');
      // Set default values on error
      setFinanceStats({
        totalRevenue: 0,
        monthlyRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        pendingPayments: 0,
        completedTransactions: 0,
        totalOrders: 0,
        pendingOrders: 0,
        approvedOrders: 0,
        rejectedOrders: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const chartOptions = {
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
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Modern Header */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 via-teal-500/10 to-green-600/10 rounded-3xl"></div>
        <div className="relative bg-white/90 backdrop-blur-md rounded-3xl p-8 border border-white/30 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 bg-clip-text text-transparent">
                  Finance Hub
                </h1>
                <p className="text-gray-600 text-lg font-medium mt-1">
                  Advanced Financial Analytics & Order Management
                </p>
              </div>
            </div>
            <div className="text-right">
              <button
                onClick={fetchFinanceData}
                disabled={loading}
                className="bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl border border-emerald-200 transition-colors flex items-center space-x-2"
              >
                <svg className={`w-4 h-4 text-emerald-600 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-sm text-emerald-600 font-semibold">
                  {loading ? 'Refreshing...' : 'Refresh'}
                </span>
              </button>
              <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200 mt-2">
                <p className="text-sm text-emerald-600 font-semibold">Real-time Data</p>
                <p className="text-lg font-bold text-emerald-800">
                  {currentTime.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-emerald-600 font-semibold text-lg">Loading financial data...</span>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Enhanced Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Revenue Card */}
            <div className="group relative bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex items-center text-white/80 text-sm">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    +15%
                  </div>
                </div>
                <p className="text-white/90 text-sm font-semibold uppercase tracking-wider mb-2">Total Revenue</p>
                <p className="text-3xl font-bold text-white mb-1">
                  LKR {financeStats.totalRevenue.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-white/70 text-xs">From completed orders</p>
              </div>
            </div>

            {/* Total Orders Card */}
            <div className="group relative bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <div className="flex items-center text-white/80 text-sm">
                    <div className="w-2 h-2 bg-white/60 rounded-full mr-2"></div>
                    This month
                  </div>
                </div>
                <p className="text-white/90 text-sm font-semibold uppercase tracking-wider mb-2">Total Orders</p>
                <p className="text-3xl font-bold text-white mb-1">{financeStats.totalOrders.toLocaleString()}</p>
                <p className="text-white/70 text-xs">All waste orders</p>
              </div>
            </div>

            {/* Net Profit Card */}
            <div className="group relative bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="flex items-center text-white/80 text-sm">
                    {financeStats.netProfit > 0 ? '+' : ''}{((financeStats.netProfit / (financeStats.totalRevenue || 1)) * 100).toFixed(1)}% margin
                  </div>
                </div>
                <p className="text-white/90 text-sm font-semibold uppercase tracking-wider mb-2">Net Profit</p>
                <p className="text-3xl font-bold text-white mb-1">
                  LKR {financeStats.netProfit.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-white/70 text-xs">After operational costs</p>
              </div>
            </div>

            {/* Pending Orders Card */}
            <div className="group relative bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex items-center text-white/80 text-sm">
                    Needs attention
                  </div>
                </div>
                <p className="text-white/90 text-sm font-semibold uppercase tracking-wider mb-2">Pending Orders</p>
                <p className="text-3xl font-bold text-white mb-1">{financeStats.pendingOrders}</p>
                <p className="text-white/70 text-xs">Awaiting approval</p>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Revenue & Expenses Chart */}
            <div className="lg:col-span-2 bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/30">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Revenue vs Expenses</h3>
                  <p className="text-gray-600">Monthly financial overview</p>
                </div>
                <div className="flex items-center space-x-2 bg-gray-100 rounded-xl px-3 py-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <span className="text-sm font-medium">Live Data</span>
                </div>
              </div>
              <div className="h-80">
                <Line data={chartData.revenueChart} options={chartOptions} />
              </div>
            </div>

            {/* Order Status Breakdown */}
            <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/30">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Order Status</h3>
                  <p className="text-gray-600">Current distribution</p>
                </div>
              </div>
              <div className="h-80">
                <Doughnut data={chartData.orderStatusChart} options={doughnutOptions} />
              </div>
            </div>
          </div>

          {/* Weekly Orders Chart */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/30">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Weekly Order Volume</h3>
                <p className="text-gray-600">Orders processed this month</p>
              </div>
              <div className="bg-gradient-to-r from-blue-100 to-indigo-100 px-4 py-2 rounded-xl">
                <span className="text-blue-800 font-semibold text-sm">Current Month</span>
              </div>
            </div>
            <div className="h-80">
              <Bar data={chartData.orderChart} options={chartOptions} />
            </div>
          </div>

          {/* Modern Quick Actions */}
          <div className="bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/30">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
                Quick Actions
              </h2>
              <p className="text-gray-600 text-lg">Fast access to essential financial operations</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link
                to="/admin/dashboard/waste-prices"
                className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative text-center text-white">
                  <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span className="text-3xl">💰</span>
                  </div>
                  <h3 className="font-bold text-lg mb-2">Update Prices</h3>
                  <p className="text-sm text-white/80">Manage waste collection pricing</p>
                </div>
              </Link>
              
              <Link
                to="/admin/finance/salaries"
                className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative text-center text-white">
                  <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span className="text-3xl">💼</span>
                  </div>
                  <h3 className="font-bold text-lg mb-2">Manage Salaries</h3>
                  <p className="text-sm text-white/80">Employee payroll management</p>
                </div>
              </Link>

              <Link
                to="/admin/finance/waste-orders"
                className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative text-center text-white">
                  <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span className="text-3xl">📦</span>
                  </div>
                  <h3 className="font-bold text-lg mb-2">Waste Orders</h3>
                  <p className="text-sm text-white/80">Track and manage orders</p>
                </div>
              </Link>

              <Link
                to="/admin/finance/analytics"
                className="group relative overflow-hidden bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative text-center text-white">
                  <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span className="text-3xl">📊</span>
                  </div>
                  <h3 className="font-bold text-lg mb-2">Analytics</h3>
                  <p className="text-sm text-white/80">Deep financial insights</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
