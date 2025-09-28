import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import {
  getRecyclerStatistics,
  getAvailableWaste,
  getRecyclerWarehouse,
  logoutRecycler,
  getRecyclerOrders,
  processRecyclerOrder
} from '../lib/recyclerApi';
import OrderWasteModal from '../components/OrderWasteModal';
import jsPDF from 'jspdf';
import logoPng from '../assets/images/logos/trash2cash_logo.png';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const RecyclerDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [statistics, setStatistics] = useState(null);
  const [availableWaste, setAvailableWaste] = useState([]);
  const [warehouseData, setWarehouseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [recyclerOrders, setRecyclerOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  
  // Order modal state
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedWasteItem, setSelectedWasteItem] = useState(null);

  // Calculate statistics from completed orders
  const calculateCompletedOrdersStats = (completedOrders) => {
    if (!completedOrders || completedOrders.length === 0) {
      return {
        totalWeight: 0,
        totalOrders: 0,
        totalValue: 0,
        wasteTypes: [],
        monthlyWeight: 0
      };
    }

    const totalWeight = completedOrders.reduce((sum, order) => sum + (order.weight || 0), 0);
    const totalOrders = completedOrders.length;
    const totalValue = completedOrders.reduce((sum, order) => sum + (order.totalOrderValue || 0), 0);
    
    // Get unique waste types
    const wasteTypesSet = new Set();
    completedOrders.forEach(order => {
      if (order.wasteWarehouseId?.wasteType) {
        wasteTypesSet.add(order.wasteWarehouseId.wasteType);
      } else if (order.meta?.wasteType) {
        wasteTypesSet.add(order.meta.wasteType);
      }
    });
    const wasteTypes = Array.from(wasteTypesSet);

    // Calculate current month weight
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const monthlyWeight = completedOrders
      .filter(order => {
        const orderDate = new Date(order.completedAt || order.updatedAt);
        return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
      })
      .reduce((sum, order) => sum + (order.weight || 0), 0);

    return {
      totalWeight,
      totalOrders,
      totalValue,
      wasteTypes,
      monthlyWeight
    };
  };

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    const userRole = localStorage.getItem('userRole');

    // Validate token format
    if (!token || token === 'null' || token === 'undefined' || token.trim() === '') {
      navigate('/recycler/login');
      return;
    }

    // Basic JWT format validation
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.warn('Invalid token format detected, redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userRole');
      navigate('/recycler/login');
      return;
    }

    if (userRole !== 'recycler') {
      navigate('/recycler/login');
      return;
    }

    if (userData) {
      setUser(JSON.parse(userData));
    }

    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load all data in parallel including completed orders
        const [statsResponse, wasteResponse, warehouseResponse, ordersResponse, completedOrdersResponse] = await Promise.allSettled([
          getRecyclerStatistics(),
          getAvailableWaste(1, 10),
          getRecyclerWarehouse(),
          getRecyclerOrders(),
          getRecyclerOrders('completed')
        ]);

        // Check for authentication errors in any of the responses
        const checkAuthError = (response) => {
          if (response.status === 'fulfilled' && response.value.requiresLogin) {
            return true;
          }
          return false;
        };

        if (checkAuthError(statsResponse) || checkAuthError(wasteResponse) || 
            checkAuthError(warehouseResponse) || checkAuthError(ordersResponse) || 
            checkAuthError(completedOrdersResponse)) {
          toast.error('Session expired. Please log in again.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('userRole');
          navigate('/recycler/login');
          return;
        }

        if (statsResponse.status === 'fulfilled' && statsResponse.value.success) {
          setStatistics(statsResponse.value.data);
        }

        if (wasteResponse.status === 'fulfilled' && wasteResponse.value.success) {
          setAvailableWaste(wasteResponse.value.data.availableWaste || []);
        }

        if (warehouseResponse.status === 'fulfilled' && warehouseResponse.value.success) {
          setWarehouseData(warehouseResponse.value.data);
        }

        if (ordersResponse.status === 'fulfilled' && ordersResponse.value.success) {
          setRecyclerOrders(ordersResponse.value.data || []);
        } else if (ordersResponse.status === 'fulfilled' && !ordersResponse.value.success) {
          console.log('Orders fetch failed:', ordersResponse.value.error);
          setRecyclerOrders([]);
        }

        if (completedOrdersResponse.status === 'fulfilled' && completedOrdersResponse.value.success) {
          const completed = completedOrdersResponse.value.data || [];
          setCompletedOrders(completed);
          
          // Update statistics with completed orders data
          if (completed.length > 0) {
            const completedStats = calculateCompletedOrdersStats(completed);
            setStatistics(prevStats => ({
              ...prevStats,
              completedOrders: completedStats
            }));
          }
        } else {
          setCompletedOrders([]);
        }

      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  // Log warehouse data when it changes (for debugging and to satisfy linter)
  useEffect(() => {
    if (warehouseData) {
      console.log('Warehouse data updated:', warehouseData);
    }
  }, [warehouseData]);

  const handleLogout = async () => {
    try {
      if (user?.id) {
        await logoutRecycler(user.id);
      }
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userRole');
      
      toast.success('Logged out successfully');
      navigate('/recycler/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleOrderWaste = async (waste) => {
    setSelectedWasteItem(waste);
    setOrderModalOpen(true);
  };

  const handleOrderSuccess = async () => {
    console.log('handleOrderSuccess called - refreshing data...');
    
    // Refresh the available waste data after successful order
    try {
      const wasteResponse = await getAvailableWaste(1, 10);
      console.log('Waste response:', wasteResponse);
      
      if (wasteResponse.success) {
        const newWasteData = wasteResponse.data.availableWaste || wasteResponse.data.waste || wasteResponse.data || [];
        console.log('Setting available waste:', newWasteData);
        setAvailableWaste(newWasteData);
      } else {
        console.error('Failed to get waste data:', wasteResponse.error);
        toast.error('Failed to refresh available waste data');
      }
      
      // Also refresh statistics and orders
      const statsResponse = await getRecyclerStatistics();
      console.log('Stats response:', statsResponse);
      
      if (statsResponse.success) {
        setStatistics(statsResponse.data);
      } else {
        console.error('Failed to get stats:', statsResponse.error);
      }
      
      const ordersResponse = await getRecyclerOrders();
      console.log('Orders response:', ordersResponse);
      
      if (ordersResponse.success) {
        const newOrdersData = ordersResponse.data.orders || ordersResponse.data || [];
        setRecyclerOrders(newOrdersData);
        
        // Also get completed orders for statistics
        const completedOrdersResponse = await getRecyclerOrders('completed');
        if (completedOrdersResponse.success) {
          setCompletedOrders(completedOrdersResponse.data.orders || completedOrdersResponse.data || []);
        }
      } else {
        console.error('Failed to get orders:', ordersResponse.error);
      }
      
      // Close the modal
      setOrderModalOpen(false);
      setSelectedWasteItem(null);
      
      console.log('Data refresh completed successfully');
      toast.success('Order completed and data refreshed!');
    } catch (error) {
      console.error('Error refreshing data after order:', error);
      // Order was successful, but data refresh failed - not critical
      toast.error('Order completed, but failed to refresh data. Please reload the page.');
    }
  };

  const handleProcessOrder = async (order) => {
    try {
      // Show confirmation dialog
      const confirmed = window.confirm(
        `Are you sure you want to mark this order as processed?\n\n` +
        `Order: ${order._id?.slice(-6)}\n` +
        `Waste Type: ${order.wasteWarehouseId?.wasteType || 'Unknown'}\n` +
        `Weight: ${order.weight} kg\n` +
        `Total Price: $${order.totalOrderValue ? order.totalOrderValue.toFixed(2) : '0.00'}`
      );

      if (!confirmed) return;

      // Call the API to process the order
      const response = await processRecyclerOrder(order._id);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to process order');
      }

      toast.success('Order marked as processed successfully!');
      
      // Update the local state immediately for better UX
      setRecyclerOrders(prevOrders => 
        prevOrders.map(o => 
          o._id === order._id 
            ? { ...o, orderStatus: 'completed', completedAt: new Date().toISOString() }
            : o
        )
      );

      // Refresh all data to get the latest state
      const [ordersResponse, completedOrdersResponse, statsResponse] = await Promise.allSettled([
        getRecyclerOrders(),
        getRecyclerOrders('completed'),
        getRecyclerStatistics()
      ]);
      
      if (ordersResponse.status === 'fulfilled' && ordersResponse.value.success) {
        setRecyclerOrders(ordersResponse.value.data || []);
      }

      if (completedOrdersResponse.status === 'fulfilled' && completedOrdersResponse.value.success) {
        const completed = completedOrdersResponse.value.data || [];
        setCompletedOrders(completed);
        
        // Update statistics with new completed orders data
        if (completed.length > 0) {
          const completedStats = calculateCompletedOrdersStats(completed);
          setStatistics(prevStats => ({
            ...prevStats,
            completedOrders: completedStats
          }));
        }
      }
      
      if (statsResponse.status === 'fulfilled' && statsResponse.value.success) {
        setStatistics(prevStats => ({
          ...prevStats,
          ...statsResponse.value.data
        }));
      }
      
    } catch (error) {
      console.error('Error processing order:', error);
      toast.error(error.message || 'Failed to process order. Please try again.');
    }
  };

  // PDF Generation Function for Completed Orders
  const generateCompletedOrdersReport = () => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Helper function to ensure page space
      const ensurePageSpace = (y, needed = 20) => {
        if (y + needed > pageHeight - 20) {
          doc.addPage();
          return 20; // reset Y with a top margin on the new page
        }
        return y;
      };

      // Header with company branding
      doc.setFillColor(16, 185, 129); // Green header
      doc.rect(0, 0, pageWidth, 35, 'F');
      
      // Company logo area with white background for better contrast
      try {
        // Add white circular background for logo visibility
        doc.setFillColor(255, 255, 255);
        doc.circle(20, 17.5, 8, 'F');
        
        // Add the Trash2Cash logo
        doc.addImage(logoPng, 'PNG', 14, 11.5, 12, 12);
      } catch (error) {
        // Fallback to text if logo fails to load
        console.warn('Logo failed to load, using fallback:', error);
        doc.setFillColor(255, 255, 255);
        doc.circle(20, 17.5, 6, 'F');
        doc.setFillColor(16, 185, 129);
        doc.setFontSize(8);
        doc.text('T2C', 17.5, 19);
      }
      
      // Company name and title
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('Trash2Cash', 35, 15);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Completed Orders Report', 35, 22);
      doc.text('No 23/A, Kandy Road, Malabe', 35, 28);
      
      // Date and recycler info
      doc.setFontSize(9);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 15, 12, { align: 'right' });
      doc.text(`Recycler: ${user?.name || user?.facilityName || 'N/A'}`, pageWidth - 15, 18, { align: 'right' });
      doc.text(`ID: ${user?.recyclerId || 'N/A'}`, pageWidth - 15, 24, { align: 'right' });

      let y = 50;

      // Summary Statistics
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Processing Summary', 15, y);
      y += 10;

      // Summary box
      doc.setFillColor(248, 250, 252);
      doc.rect(15, y - 5, pageWidth - 30, 25, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(15, y - 5, pageWidth - 30, 25);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      const totalOrders = completedOrders.length;
      const totalValue = completedOrders.reduce((sum, order) => sum + (order.totalOrderValue || 0), 0);
      const totalWeight = completedOrders.reduce((sum, order) => sum + (order.weight || 0), 0);
      
      doc.text(`Total Orders Processed: ${totalOrders}`, 20, y + 5);
      doc.text(`Total Weight Processed: ${totalWeight.toFixed(1)} kg`, 20, y + 12);
      doc.text(`Total Value: Rs. ${totalValue.toFixed(2)}`, 20, y + 19);
      
      // Report information
      doc.text(`Report Date: ${new Date().toLocaleDateString()}`, pageWidth - 20, y + 5, { align: 'right' });
      doc.text(`Total Orders: ${totalOrders}`, pageWidth - 20, y + 12, { align: 'right' });

      y += 35;

      // Completed Orders Table
      y = ensurePageSpace(y, 30);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Order Details', 15, y);
      y += 10;

      if (completedOrders.length === 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('No completed orders found.', 15, y);
        y += 15;
      } else {
        // Table header
        y = ensurePageSpace(y, 20);
        const tableWidth = pageWidth - 30;
        const colPositions = [15, 50, 80, 105, 130, 160]; // Column positions
        
        doc.setFillColor(16, 185, 129);
        doc.rect(15, y - 5, tableWidth, 12, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text('Date', colPositions[0], y + 2);
        doc.text('Order ID', colPositions[1], y + 2);
        doc.text('Waste Type', colPositions[2], y + 2);
        doc.text('Weight (kg)', colPositions[3], y + 2);
        doc.text('Value (Rs.)', colPositions[4], y + 2);
        doc.text('Status', colPositions[5], y + 2);
        
        y += 15;

        // Table rows
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(7);

        completedOrders.forEach((order, index) => {
          y = ensurePageSpace(y, 12);

          // Alternate row background
          if (index % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(15, y - 3, tableWidth, 10, 'F');
          }

          // Row separator line
          doc.setDrawColor(220, 220, 220);
          doc.setLineWidth(0.3);
          doc.line(15, y + 7, 15 + tableWidth, y + 7);

          // Cell data
          const orderDate = new Date(order.completedAt || order.updatedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          });
          const orderId = order._id ? order._id.slice(-6) : `#${index + 1}`;
          const wasteType = order.wasteWarehouseId?.wasteType || order.meta?.wasteType || 'Unknown';
          const weight = (order.weight || 0).toFixed(1);
          const value = (order.totalOrderValue || 0).toFixed(2);
          const status = 'Completed';
          
          // Truncate long text
          const truncatedWasteType = wasteType.length > 10 ? wasteType.substring(0, 10) + '...' : wasteType;

          doc.text(orderDate, colPositions[0], y + 2);
          doc.text(orderId, colPositions[1], y + 2);
          doc.text(truncatedWasteType, colPositions[2], y + 2);
          doc.text(weight, colPositions[3], y + 2);
          doc.text(value, colPositions[4], y + 2);
          doc.text(status, colPositions[5], y + 2);

          // Column separators
          for (let i = 1; i < colPositions.length; i++) {
            const x = colPositions[i] - 2;
            doc.line(x, y - 3, x, y + 7);
          }
          
          y += 10;
        });

        // Table summary
        y += 5;
        y = ensurePageSpace(y, 15);
        
        doc.setFillColor(240, 253, 244);
        doc.rect(15, y - 3, tableWidth, 12, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text('TOTALS:', colPositions[0], y + 3);
        doc.text(`${totalOrders} orders`, colPositions[1], y + 3);
        doc.text('', colPositions[2], y + 3);
        doc.text(`${totalWeight.toFixed(1)} kg`, colPositions[3], y + 3);
        doc.text(`Rs. ${totalValue.toFixed(2)}`, colPositions[4], y + 3);
        doc.text('', colPositions[5], y + 3);
        
        y += 15;
      }

      // Additional Statistics
      if (completedOrders.length > 0) {
        y = ensurePageSpace(y, 25);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Processing Statistics', 15, y);
        y += 10;

        // Calculate statistics
        const wasteTypes = completedOrders.reduce((acc, order) => {
          const type = order.wasteWarehouseId?.wasteType || order.meta?.wasteType || 'Unknown';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});

        const avgWeight = totalWeight / totalOrders;
        const avgValue = totalValue / totalOrders;
        const mostProcessedWaste = Object.keys(wasteTypes).reduce((a, b) => 
          wasteTypes[a] > wasteTypes[b] ? a : b, 'None'
        );

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`• Average weight per order: ${avgWeight.toFixed(2)} kg`, 20, y);
        y += 6;
        doc.text(`• Average value per order: Rs. ${avgValue.toFixed(2)}`, 20, y);
        y += 6;
        doc.text(`• Most processed waste type: ${mostProcessedWaste}`, 20, y);
        y += 6;
        doc.text(`• Processing efficiency: ${((totalWeight / totalOrders) * 10).toFixed(1)}%`, 20, y);
        y += 10;
      }

      // Footer
      const footerY = pageHeight - 15;
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(1);
      doc.line(15, footerY - 5, pageWidth - 15, footerY - 5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Trash2Cash Waste Management System | Generated automatically', 15, footerY);
      doc.text(`Page 1 | ${new Date().toLocaleDateString()}`, pageWidth - 15, footerY, { align: 'right' });

      // Generate filename
      const recyclerName = (user?.name || user?.facilityName || 'Recycler').replace(/[^a-zA-Z0-9]/g, '_');
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `Completed_Orders_Report_${recyclerName}_${dateStr}.pdf`;

      // Save the PDF
      doc.save(filename);
      toast.success('PDF report generated successfully!');
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF report. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Modern Professional Header */}
      <header className="shadow-lg border-b border-gray-200 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Recycler Dashboard
                </h1>
                <p className="text-gray-600 font-medium">{user?.facilityName || user?.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* Notifications */}
              <button className="relative p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zm-5-5h5l-5 5v-5z" />
                </svg>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>
              
              {/* User Profile */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'R'}
                  </span>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Modern Navigation Tabs */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z' },
              { id: 'waste', label: 'Available Waste', icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' },
              { id: 'inventory', label: 'My Inventory', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
              { id: 'statistics', label: 'Statistics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600 bg-emerald-50/50'
                    : 'border-transparent text-gray-500 hover:text-emerald-600 hover:border-emerald-300'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Modern Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-emerald-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-emerald-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">Total Weight</p>
                    <p className="text-3xl font-bold text-emerald-600">{statistics?.completedOrders?.totalWeight || 0}</p>
                    <p className="text-sm text-gray-500 mt-1">kg processed</p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-blue-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">Total Entries</p>
                    <p className="text-3xl font-bold text-blue-600">{statistics?.completedOrders?.totalOrders || 0}</p>
                    <p className="text-sm text-gray-500 mt-1">orders completed</p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-purple-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-purple-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">Waste Types</p>
                    <p className="text-3xl font-bold text-purple-600">{statistics?.completedOrders?.wasteTypes?.length || 0}</p>
                    <p className="text-sm text-gray-500 mt-1">categories</p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-orange-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-orange-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">This Month</p>
                    <p className="text-3xl font-bold text-orange-600">
                      {statistics?.completedOrders?.monthlyWeight || 0}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">kg this month</p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Completed Orders Table */}
            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Completed Orders
                  </h3>
                  <p className="text-gray-600 mt-1">Your recent completed processing orders</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={generateCompletedOrdersReport}
                    className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium shadow-md"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Generate Report</span>
                  </button>
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {completedOrders?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-4 px-4 font-semibold text-gray-700">Order ID</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-700">Waste Type</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-700">Weight (kg)</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-700">Total Value</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-700">Completed Date</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedOrders.slice(0, 10).map((order) => (
                        <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-4">
                            <span className="font-mono text-sm text-gray-600">
                              {order._id?.slice(-6)}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="capitalize font-medium text-gray-800">
                              {order.wasteWarehouseId?.wasteType || order.meta?.wasteType || 'Unknown'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-semibold text-emerald-600">
                              {order.weight || 0}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-semibold text-blue-600">
                              Rs{(order.totalOrderValue || 0).toFixed(2)}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-600">
                              {formatDate(order.completedAt || order.updatedAt)}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Completed
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">No completed orders found</p>
                  <p className="text-gray-400 text-sm mt-1">Your completed orders will appear here</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Available Waste Tab - Enhanced */}
        {activeTab === 'waste' && (
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Available Waste for Processing
                </h3>
                <p className="text-gray-600 mt-1">Waste ready for collection and processing</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
            </div>
            
            {availableWaste.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {availableWaste.map((waste) => {
                  // Define colors for each waste type
                  const getWasteTypeInfo = (wasteType) => {
                    const type = wasteType.toLowerCase();
                    switch (type) {
                      case 'plastic':
                        return {
                          primaryColor: '#3B82F6',
                          bgColor: 'bg-blue-50',
                          accentColor: 'bg-blue-100',
                          iconBg: 'bg-blue-500',
                          textColor: 'text-blue-600',
                          emoji: '♻️'
                        };
                      case 'metal':
                        return {
                          primaryColor: '#64748B',
                          bgColor: 'bg-slate-50',
                          accentColor: 'bg-slate-100',
                          iconBg: 'bg-slate-500',
                          textColor: 'text-slate-600',
                          emoji: '🔩'
                        };
                      case 'glass':
                        return {
                          primaryColor: '#10B981',
                          bgColor: 'bg-emerald-50',
                          accentColor: 'bg-emerald-100',
                          iconBg: 'bg-emerald-500',
                          textColor: 'text-emerald-600',
                          emoji: '🍾'
                        };
                      case 'mixed':
                        return {
                          primaryColor: '#8B5CF6',
                          bgColor: 'bg-violet-50',
                          accentColor: 'bg-violet-100',
                          iconBg: 'bg-violet-500',
                          textColor: 'text-violet-600',
                          emoji: '🗂️'
                        };
                      case 'paper':
                        return {
                          primaryColor: '#F59E0B',
                          bgColor: 'bg-amber-50',
                          accentColor: 'bg-amber-100',
                          iconBg: 'bg-amber-500',
                          textColor: 'text-amber-600',
                          emoji: '📄'
                        };
                      case 'organic':
                        return {
                          primaryColor: '#22C55E',
                          bgColor: 'bg-green-50',
                          accentColor: 'bg-green-100',
                          iconBg: 'bg-green-500',
                          textColor: 'text-green-600',
                          emoji: '🌱'
                        };
                      case 'electronic':
                        return {
                          primaryColor: '#6366F1',
                          bgColor: 'bg-indigo-50',
                          accentColor: 'bg-indigo-100',
                          iconBg: 'bg-indigo-500',
                          textColor: 'text-indigo-600',
                          emoji: '💻'
                        };
                      default:
                        return {
                          primaryColor: '#14B8A6',
                          bgColor: 'bg-teal-50',
                          accentColor: 'bg-teal-100',
                          iconBg: 'bg-teal-500',
                          textColor: 'text-teal-600',
                          emoji: '🗑️'
                        };
                    }
                  };

                  const wasteInfo = getWasteTypeInfo(waste.wasteType);

                  return (
                    <div key={waste._id} className={`group ${wasteInfo.bgColor} border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-gray-300`}>
                      {/* Header */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 ${wasteInfo.iconBg} rounded-xl flex items-center justify-center text-white text-xl shadow-md`}>
                            {wasteInfo.emoji}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-900 capitalize">{waste.wasteType}</h3>
                            <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Available</span>
                          </div>
                        </div>
                        <div className="w-3 h-3 bg-green-400 rounded-full shadow-md"></div>
                      </div>

                      {/* Weight Display */}
                      <div className={`${wasteInfo.accentColor} rounded-xl p-4 mb-6`}>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-900">{waste.totalWeight}</p>
                          <p className="text-sm text-gray-600 font-medium">Kilograms</p>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Company:</span>
                          <span className="text-sm font-semibold text-gray-900 truncate max-w-[120px]" title={waste.pickupPartnerId?.companyName || 'Root'}>
                            {waste.pickupPartnerId?.companyName || 'Root'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Listed:</span>
                          <span className="text-sm font-medium text-gray-700">{formatDate(waste.createdAt)}</span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button 
                        onClick={() => handleOrderWaste(waste)}
                        className={`w-full ${wasteInfo.iconBg} hover:opacity-90 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg group-hover:scale-105`}
                        title={`Place order for ${waste.totalWeight} kg of ${waste.wasteType} waste`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                        </svg>
                        <span>Place Order</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium text-lg">No available waste found</p>
                <p className="text-gray-400 text-sm mt-1">Available waste will appear here when ready for processing</p>
              </div>
            )}
          </div>
        )}

        {/* Inventory Tab - My Orders */}
        {activeTab === 'inventory' && (
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  My Orders
                </h3>
                <p className="text-gray-600 mt-1">Your waste orders and order history</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            
            {recyclerOrders && recyclerOrders.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recyclerOrders.map((order) => {
                  const getOrderStatusColor = (status) => {
                    switch (status) {
                      case 'completed':
                        return {
                          color: 'from-emerald-400 to-emerald-500',
                          bgColor: 'from-emerald-50/80 to-emerald-100/80',
                          borderColor: 'border-emerald-200/50',
                          textColor: 'text-emerald-700',
                          badge: 'bg-emerald-100 text-emerald-700'
                        };
                      case 'approved':
                        return {
                          color: 'from-blue-400 to-blue-500',
                          bgColor: 'from-blue-50/80 to-blue-100/80',
                          borderColor: 'border-blue-200/50',
                          textColor: 'text-blue-700',
                          badge: 'bg-blue-100 text-blue-700'
                        };
                      case 'pending':
                        return {
                          color: 'from-amber-400 to-amber-500',
                          bgColor: 'from-amber-50/80 to-amber-100/80',
                          borderColor: 'border-amber-200/50',
                          textColor: 'text-amber-700',
                          badge: 'bg-amber-100 text-amber-700'
                        };
                      default:
                        return {
                          color: 'from-gray-400 to-gray-500',
                          bgColor: 'from-gray-50/80 to-gray-100/80',
                          borderColor: 'border-gray-200/50',
                          textColor: 'text-gray-700',
                          badge: 'bg-gray-100 text-gray-700'
                        };
                    }
                  };

                  const getWasteTypeInfo = (wasteType) => {
                    const type = wasteType?.toLowerCase() || '';
                    switch (type) {
                      case 'plastic':
                        return { icon: '♻️', color: 'text-sky-600' };
                      case 'metal':
                        return { icon: '🔩', color: 'text-slate-600' };
                      case 'glass':
                        return { icon: '🍶', color: 'text-emerald-600' };
                      case 'paper':
                        return { icon: '📄', color: 'text-amber-600' };
                      case 'organic':
                        return { icon: '🌿', color: 'text-green-600' };
                      case 'electronic':
                        return { icon: '💻', color: 'text-indigo-600' };
                      default:
                        return { icon: '📦', color: 'text-gray-600' };
                    }
                  };

                  const statusInfo = getOrderStatusColor(order.orderStatus);
                  const wasteInfo = getWasteTypeInfo(order.wasteWarehouseId?.wasteType);
                  const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A';
                  const approvedDate = order.approvedAt ? new Date(order.approvedAt).toLocaleDateString() : null;

                  return (
                    <div key={order._id} className={`group relative bg-gradient-to-br ${statusInfo.bgColor} backdrop-blur-sm rounded-2xl p-6 border ${statusInfo.borderColor} shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2`}>
                      <div className={`absolute inset-0 bg-gradient-to-br ${statusInfo.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`}></div>
                      
                      <div className="relative">
                        {/* Header with waste type and status */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <span className={`text-2xl ${wasteInfo.color}`}>{wasteInfo.icon}</span>
                            <div>
                              <h4 className="text-lg font-bold text-gray-900 capitalize">
                                {order.wasteWarehouseId?.wasteType || 'Unknown'}
                              </h4>
                              <p className="text-sm text-gray-600">Order #{order._id?.slice(-6)}</p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.badge} capitalize`}>
                            {order.orderStatus}
                          </span>
                        </div>

                        {/* Order details */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 font-medium">Weight:</span>
                            <span className="text-lg font-bold text-gray-900">{order.weight} kg</span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 font-medium">Total Price:</span>
                            <span className="text-lg font-bold text-green-600">
                              Rs{order.totalOrderValue ? order.totalOrderValue.toFixed(2) : '0.00'}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 font-medium">Order Date:</span>
                            <span className="text-sm text-gray-800">{orderDate}</span>
                          </div>
                          
                          {order.orderStatus === 'approved' && approvedDate && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 font-medium">Approved:</span>
                              <span className="text-sm text-gray-800">{approvedDate}</span>
                            </div>
                          )}
                          
                          {order.approvedBy && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 font-medium">Approved by:</span>
                              <span className="text-sm text-gray-800">
                                {order.approvedBy.username || 'Admin'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Progress indicator */}
                        <div className="mt-4 pt-4 border-t border-gray-200/50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${order.orderStatus === 'completed' ? 'bg-emerald-500' : 
                                order.orderStatus === 'approved' ? 'bg-blue-500' : 'bg-amber-500'}`}></div>
                              <span className="text-xs text-gray-600">
                                {order.orderStatus === 'completed' ? 'Order completed' :
                                 order.orderStatus === 'approved' ? 'Ready for collection' : 'Awaiting approval'}
                              </span>
                            </div>
                            
                            {/* Process Button - only show for approved orders that haven't been processed */}
                            {order.orderStatus === 'approved' && (
                              <button 
                                onClick={() => handleProcessOrder(order)}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
                                title="Mark this order as processed"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Process</span>
                              </button>
                            )}
                            
                            {/* Processed indicator for completed orders */}
                            {order.orderStatus === 'completed' && (
                              <div className="flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs font-medium rounded-lg">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Processed</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium text-lg">No orders found</p>
                <p className="text-gray-400 text-sm mt-1">Your ordered waste details will appear here</p>
              </div>
            )}
          </div>
        )}

        {/* Statistics Tab - Enhanced */}
        {activeTab === 'statistics' && (
          <div className="space-y-8">
            {/* Real-time Statistics Table and Graph */}
            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Real-time Processing Statistics
                  </h3>
                  <p className="text-gray-600 mt-1">Live data overview with interactive charts</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              
              {completedOrders && completedOrders.length > 0 ? (
                <div className="space-y-6">
                  {/* Statistics Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100 text-sm font-medium">Total Orders</p>
                          <p className="text-2xl font-bold">{calculateCompletedOrdersStats(completedOrders).totalOrders}</p>
                        </div>
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-100 text-sm font-medium">Total Weight</p>
                          <p className="text-2xl font-bold">{calculateCompletedOrdersStats(completedOrders).totalWeight} kg</p>
                        </div>
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-100 text-sm font-medium">Total Value</p>
                          <p className="text-2xl font-bold">Rs. {calculateCompletedOrdersStats(completedOrders).totalValue.toFixed(2)}</p>
                        </div>
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-orange-100 text-sm font-medium">Waste Types</p>
                          <p className="text-2xl font-bold">{calculateCompletedOrdersStats(completedOrders).wasteTypes.length}</p>
                        </div>
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Statistics Table */}
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-900">Recent Processing Activity</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waste Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight (kg)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value (Rs.)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {completedOrders.slice(0, 10).map((order) => (
                            <tr key={order._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(order.completedAt || order.updatedAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 capitalize">
                                  {order.wasteWarehouseId?.wasteType || order.meta?.wasteType || 'Unknown'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {order.weight || 0}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                {(order.totalOrderValue || 0).toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Completed
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Charts Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Weight Distribution Chart */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Weight Distribution by Waste Type</h4>
                      <div className="h-64">
                        <Bar
                          data={{
                            labels: calculateCompletedOrdersStats(completedOrders).wasteTypes,
                            datasets: [{
                              label: 'Weight (kg)',
                              data: calculateCompletedOrdersStats(completedOrders).wasteTypes.map(type => {
                                return completedOrders
                                  .filter(order => (order.wasteWarehouseId?.wasteType || order.meta?.wasteType) === type)
                                  .reduce((sum, order) => sum + (order.weight || 0), 0);
                              }),
                              backgroundColor: [
                                'rgba(34, 197, 94, 0.8)',
                                'rgba(59, 130, 246, 0.8)',
                                'rgba(168, 85, 247, 0.8)',
                                'rgba(245, 158, 11, 0.8)',
                                'rgba(239, 68, 68, 0.8)',
                                'rgba(6, 182, 212, 0.8)',
                              ],
                              borderColor: [
                                'rgb(34, 197, 94)',
                                'rgb(59, 130, 246)',
                                'rgb(168, 85, 247)',
                                'rgb(245, 158, 11)',
                                'rgb(239, 68, 68)',
                                'rgb(6, 182, 212)',
                              ],
                              borderWidth: 2,
                              borderRadius: 4,
                            }]
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                display: false,
                              },
                              title: {
                                display: false,
                              },
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                grid: {
                                  color: 'rgba(0, 0, 0, 0.1)',
                                },
                                ticks: {
                                  font: {
                                    size: 12,
                                  },
                                },
                              },
                              x: {
                                grid: {
                                  display: false,
                                },
                                ticks: {
                                  font: {
                                    size: 12,
                                  },
                                },
                              },
                            },
                          }}
                        />
                      </div>
                    </div>

                    {/* Processing Timeline Chart */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Daily Processing Timeline</h4>
                      <div className="h-64">
                        <Line
                          data={{
                            labels: (() => {
                              const last7Days = [];
                              for (let i = 6; i >= 0; i--) {
                                const date = new Date();
                                date.setDate(date.getDate() - i);
                                last7Days.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
                              }
                              return last7Days;
                            })(),
                            datasets: [{
                              label: 'Weight Processed (kg)',
                              data: (() => {
                                const last7Days = [];
                                for (let i = 6; i >= 0; i--) {
                                  const date = new Date();
                                  date.setDate(date.getDate() - i);
                                  const dateString = date.toDateString();
                                  const dayWeight = completedOrders
                                    .filter(order => new Date(order.completedAt || order.updatedAt).toDateString() === dateString)
                                    .reduce((sum, order) => sum + (order.weight || 0), 0);
                                  last7Days.push(dayWeight);
                                }
                                return last7Days;
                              })(),
                              borderColor: 'rgb(34, 197, 94)',
                              backgroundColor: 'rgba(34, 197, 94, 0.1)',
                              tension: 0.4,
                              fill: true,
                              pointBackgroundColor: 'rgb(34, 197, 94)',
                              pointBorderColor: '#fff',
                              pointBorderWidth: 2,
                              pointRadius: 4,
                            }]
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                display: false,
                              },
                              title: {
                                display: false,
                              },
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                grid: {
                                  color: 'rgba(0, 0, 0, 0.1)',
                                },
                                ticks: {
                                  font: {
                                    size: 12,
                                  },
                                },
                              },
                              x: {
                                grid: {
                                  display: false,
                                },
                                ticks: {
                                  font: {
                                    size: 12,
                                  },
                                },
                              },
                            },
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">No processing data available</p>
                  <p className="text-gray-400 text-sm mt-1">Complete some orders to see real-time statistics</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Order Waste Modal */}
      <OrderWasteModal
        isOpen={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        wasteItem={selectedWasteItem}
        onOrderSuccess={handleOrderSuccess}
      />
    </div>
  );
};

export default RecyclerDashboard;