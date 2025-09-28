import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
import trash2cashLogo from '../assets/images/trash2cash_logo.png';

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
  
  // Search functionality state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Overview search functionality state
  const [overviewSearchTerm, setOverviewSearchTerm] = useState('');
  const [overviewDateFilter, setOverviewDateFilter] = useState('all');
  const [overviewWasteTypeFilter, setOverviewWasteTypeFilter] = useState('all');
  const [showAllOverviewResults, setShowAllOverviewResults] = useState(false);

  // Filter orders based on search term and status
  const filteredOrders = recyclerOrders.filter(order => {
    const matchesSearch = !searchTerm || 
      order._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.wasteWarehouseId?.wasteType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.weight?.toString().includes(searchTerm) ||
      order.totalOrderValue?.toString().includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || order.orderStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Filter completed orders for Overview section
  const filteredCompletedOrders = completedOrders.filter(order => {
    const matchesSearch = !overviewSearchTerm || 
      order._id?.toLowerCase().includes(overviewSearchTerm.toLowerCase()) ||
      (order.wasteWarehouseId?.wasteType || order.meta?.wasteType || '').toLowerCase().includes(overviewSearchTerm.toLowerCase()) ||
      order.weight?.toString().includes(overviewSearchTerm) ||
      order.totalOrderValue?.toString().includes(overviewSearchTerm);
    
    const wasteType = order.wasteWarehouseId?.wasteType || order.meta?.wasteType || '';
    const matchesWasteType = overviewWasteTypeFilter === 'all' || 
      wasteType.toLowerCase() === overviewWasteTypeFilter.toLowerCase();
    
    const orderDate = new Date(order.completedAt || order.updatedAt);
    const now = new Date();
    const matchesDate = overviewDateFilter === 'all' || 
      (overviewDateFilter === 'today' && orderDate.toDateString() === now.toDateString()) ||
      (overviewDateFilter === 'week' && (now - orderDate) <= 7 * 24 * 60 * 60 * 1000) ||
      (overviewDateFilter === 'month' && orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear()) ||
      (overviewDateFilter === 'year' && orderDate.getFullYear() === now.getFullYear());
    
    return matchesSearch && matchesWasteType && matchesDate;
  });

  // Get unique waste types for filter dropdown
  const availableWasteTypes = [...new Set(completedOrders.map(order => 
    order.wasteWarehouseId?.wasteType || order.meta?.wasteType || ''
  ).filter(Boolean))].sort();

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
    // Refresh the available waste data after successful order
    try {
      const wasteResponse = await getAvailableWaste(1, 10);
      setAvailableWaste(wasteResponse.data || []);
      
      // Also refresh statistics and orders
      const statsResponse = await getRecyclerStatistics();
      setStatistics(statsResponse.data);
      
      const ordersResponse = await getRecyclerOrders();
      setRecyclerOrders(ordersResponse.data || []);
      
      toast.success('Order completed successfully!');
    } catch (error) {
      console.error('Error refreshing data after order:', error);
      // Order was successful, but data refresh failed - not critical
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

  const generateOrdersReport = () => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Helper function for currency formatting
      const formatCurrency = (amount) => {
        return `Rs.${Number(amount || 0).toFixed(2)}`;
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

      // Header with company info
      doc.setFillColor(16, 185, 129); // Emerald color
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      // Add white background circle for logo
      doc.setFillColor(255, 255, 255); // White background
      doc.circle(25, 20, 12, 'F'); // Larger circle for background
      
      // Add company logo
      try {
        doc.addImage(trash2cashLogo, 'PNG', 15, 10, 20, 20);
      } catch (error) {
        console.log('Logo could not be added:', error);
        // Fallback to circle placeholder if logo fails
        doc.setFillColor(255, 255, 255);
        doc.circle(25, 20, 8, 'F');
        doc.setFillColor(16, 185, 129);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(16, 185, 129);
        doc.text('T2C', 25, 22, { align: 'center' });
      }
      
      // Company name and title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('TRASH2CASH', 40, 22);
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.text('Recycler Orders Report', 40, 32);
      
      // Report metadata
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const currentDate = new Date().toLocaleDateString('en-US');
      doc.text(`Generated: ${currentDate}`, pageWidth - 20, 25, { align: 'right' });
      doc.text(`Total Orders: ${filteredOrders.length}`, pageWidth - 20, 31, { align: 'right' });

      let yPosition = 55;

      // Report Summary Section
      doc.setTextColor(16, 185, 129);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('REPORT SUMMARY', 20, yPosition);
      
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(1);
      doc.line(20, yPosition + 4, pageWidth - 20, yPosition + 4);
      
      yPosition += 20;

      // Summary statistics
      const totalOrders = filteredOrders.length;
      const totalWeight = filteredOrders.reduce((sum, order) => sum + (order.weight || 0), 0);
      const totalValue = filteredOrders.reduce((sum, order) => sum + (order.totalOrderValue || 0), 0);
      
      const pendingOrders = filteredOrders.filter(order => order.orderStatus === 'pending').length;
      const approvedOrders = filteredOrders.filter(order => order.orderStatus === 'approved').length;
      const completedOrders = filteredOrders.filter(order => order.orderStatus === 'completed').length;

      doc.setTextColor(60, 60, 60);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      
      const summaryData = [
        ['Total Orders', totalOrders.toString()],
        ['Total Weight', `${totalWeight.toFixed(1)} kg`],
        ['Total Value', formatCurrency(totalValue)],
        ['Pending Orders', pendingOrders.toString()],
        ['Approved Orders', approvedOrders.toString()],
        ['Completed Orders', completedOrders.toString()]
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'grid',
        headStyles: { 
          fillColor: [16, 185, 129],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        bodyStyles: { 
          fillColor: [248, 250, 252],
          textColor: [60, 60, 60]
        },
        alternateRowStyles: {
          fillColor: [255, 255, 255]
        },
        margin: { left: 20, right: 20 }
      });

      yPosition = doc.lastAutoTable.finalY + 20;

      // Orders Details Section
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setTextColor(16, 185, 129);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('ORDER DETAILS', 20, yPosition);
      
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(1);
      doc.line(20, yPosition + 4, pageWidth - 20, yPosition + 4);
      
      yPosition += 15;

      // Orders table
      const ordersData = filteredOrders.map(order => [
        order._id ? order._id.slice(-6) : 'N/A',
        (order.wasteWarehouseId?.wasteType || 'Unknown').charAt(0).toUpperCase() + (order.wasteWarehouseId?.wasteType || 'Unknown').slice(1),
        `${order.weight || 0} kg`,
        formatCurrency(order.totalOrderValue || 0),
        order.orderStatus ? order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1) : 'N/A',
        formatDate(order.createdAt || new Date())
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Order ID', 'Waste Type', 'Weight', 'Total Value', 'Status', 'Order Date']],
        body: ordersData,
        theme: 'grid',
        headStyles: { 
          fillColor: [16, 185, 129],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10
        },
        bodyStyles: { 
          fontSize: 9,
          textColor: [60, 60, 60]
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: {
          0: { cellWidth: 25 }, // Order ID
          1: { cellWidth: 30 }, // Waste Type
          2: { cellWidth: 25 }, // Weight
          3: { cellWidth: 30 }, // Total Value
          4: { cellWidth: 25 }, // Status
          5: { cellWidth: 35 }  // Order Date
        },
        margin: { left: 20, right: 20 }
      });

      // Footer
      const finalY = doc.lastAutoTable.finalY || yPosition;
      if (finalY > pageHeight - 40) {
        doc.addPage();
      }
      
      const footerY = pageHeight - 25;
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(0.5);
      doc.line(20, footerY - 10, pageWidth - 20, footerY - 10);
      
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('TRASH2CASH | Recycler Management System | recycler@trash2cash.com', pageWidth / 2, footerY - 5, { align: 'center' });
      
      doc.setFontSize(8);
      doc.text('This report is computer-generated and contains recycler order information.', pageWidth / 2, footerY, { align: 'center' });
      doc.text(`Report ID: ROR-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Date.now().toString().slice(-4)}`, pageWidth / 2, footerY + 5, { align: 'center' });

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 10);
      const statusSuffix = statusFilter !== 'all' ? `_${statusFilter}` : '';
      const filename = `RecyclerOrders_Report${statusSuffix}_${timestamp}.pdf`;
      
      // Download the PDF
      doc.save(filename);
      toast.success('Orders report generated successfully!');
      
    } catch (error) {
      console.error('Error generating orders report:', error);
      toast.error('Failed to generate orders report. Please try again.');
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
              { id: 'inventory', label: 'My Orders', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
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
                  <p className="text-gray-600 mt-1">
                    Your recent completed processing orders
                    {completedOrders && completedOrders.length > 0 && (
                      <span className="ml-2 text-sm">
                        ({filteredCompletedOrders.length} of {completedOrders.length} orders)
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  {completedOrders && completedOrders.length > 0 && (
                    <div className="text-right">
                      <p className="text-sm font-semibold text-emerald-600">{filteredCompletedOrders.length}</p>
                      <p className="text-xs text-gray-500">showingg</p>
                    </div>
                  )}
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Search and Filter Controls for Overview */}
              {completedOrders && completedOrders.length > 0 && (
                <div className="mb-6 space-y-4">
                  <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                    {/* Search Input */}
                    <div className="relative flex-1 max-w-lg">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={overviewSearchTerm}
                        onChange={(e) => setOverviewSearchTerm(e.target.value)}
                        placeholder="Search completed orders..."
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white/90 backdrop-blur-sm placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                      />
                      {overviewSearchTerm && (
                        <button
                          onClick={() => setOverviewSearchTerm('')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Filter Controls */}
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                      {/* Waste Type Filter */}
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Waste Type:</label>
                        <select
                          value={overviewWasteTypeFilter}
                          onChange={(e) => setOverviewWasteTypeFilter(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg bg-white/90 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                        >
                          <option value="all">All Types</option>
                          {availableWasteTypes.map(type => (
                            <option key={type} value={type} className="capitalize">{type}</option>
                          ))}
                        </select>
                      </div>

                      {/* Date Filter */}
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Period:</label>
                        <select
                          value={overviewDateFilter}
                          onChange={(e) => setOverviewDateFilter(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg bg-white/90 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                        >
                          <option value="all">All Time</option>
                          <option value="today">Today</option>
                          <option value="week">This Week</option>
                          <option value="month">This Month</option>
                          <option value="year">This Year</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Search Results Summary */}
                  {(overviewSearchTerm || overviewWasteTypeFilter !== 'all' || overviewDateFilter !== 'all') && (
                    <div className="flex items-center justify-between px-4 py-2 bg-emerald-50/80 backdrop-blur-sm border border-emerald-200 rounded-lg">
                      <span className="text-sm text-emerald-700">
                        {filteredCompletedOrders.length} order{filteredCompletedOrders.length !== 1 ? 's' : ''} found
                        {overviewSearchTerm && ` matching "${overviewSearchTerm}"`}
                        {overviewWasteTypeFilter !== 'all' && ` of type "${overviewWasteTypeFilter}"`}
                        {overviewDateFilter !== 'all' && ` from ${overviewDateFilter === 'today' ? 'today' : 
                          overviewDateFilter === 'week' ? 'this week' : 
                          overviewDateFilter === 'month' ? 'this month' : 'this year'}`}
                      </span>
                      <button
                        onClick={() => {
                          setOverviewSearchTerm('');
                          setOverviewWasteTypeFilter('all');
                          setOverviewDateFilter('all');
                        }}
                        className="text-sm text-emerald-600 hover:text-emerald-800 font-medium"
                      >
                        Clear filters
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {filteredCompletedOrders?.length > 0 ? (
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
                      {(showAllOverviewResults ? filteredCompletedOrders : filteredCompletedOrders.slice(0, 10)).map((order) => (
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
                  
                  {/* Show More/Less Button */}
                  {filteredCompletedOrders.length > 10 && (
                    <div className="text-center mt-6 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => setShowAllOverviewResults(!showAllOverviewResults)}
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        {showAllOverviewResults ? (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                            Show Less (10 results)
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                            Show All ({filteredCompletedOrders.length} results)
                          </>
                        )}
                      </button>
                      <p className="text-sm text-gray-500 mt-2">
                        Showing {showAllOverviewResults ? filteredCompletedOrders.length : Math.min(10, filteredCompletedOrders.length)} of {filteredCompletedOrders.length} orders
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  {completedOrders && completedOrders.length > 0 ? (
                    // Has orders but filtered results are empty
                    <>
                      <p className="text-gray-500 font-medium">No matching completed orders found</p>
                      <p className="text-gray-400 text-sm mt-1">
                        Try adjusting your search criteria or clear the filters
                      </p>
                      <button
                        onClick={() => {
                          setOverviewSearchTerm('');
                          setOverviewWasteTypeFilter('all');
                          setOverviewDateFilter('all');
                        }}
                        className="mt-3 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium"
                      >
                        Clear Filters
                      </button>
                    </>
                  ) : (
                    // No orders at all
                    <>
                      <p className="text-gray-500 font-medium">No completed orders found</p>
                      <p className="text-gray-400 text-sm mt-1">Your completed orders will appear here</p>
                    </>
                  )}
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableWaste.map((waste) => {
                  // Define colors and icons for each waste type
                  const getWasteTypeInfo = (wasteType) => {
                    const type = wasteType.toLowerCase();
                    switch (type) {
                      case 'plastic':
                        return {
                          color: 'from-sky-400 to-sky-500',
                          bgColor: 'from-sky-50/90 to-sky-100/80',
                          borderColor: 'border-sky-200/60',
                          textColor: 'text-sky-800',
                          icon: (
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-1.12.23-2.19.65-3.17L9 10.5V12c0 .55.45 1 1 1h1v1.5c0 .28.22.5.5.5s.5-.22.5-.5V13h1c.55 0 1-.45 1-1v-1.5l4.35-1.67c.42.98.65 2.05.65 3.17 0 4.41-3.59 8-8 8z"/>
                            </svg>
                          )
                        };
                      case 'metal':
                        return {
                          color: 'from-slate-400 to-slate-500',
                          bgColor: 'from-slate-50/90 to-slate-100/80',
                          borderColor: 'border-slate-200/60',
                          textColor: 'text-slate-800',
                          icon: (
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7H14A7,7 0 0,1 21,14H22A1,1 0 0,1 23,15V18A1,1 0 0,1 22,19H21A7,7 0 0,1 14,26H10A7,7 0 0,1 3,19H2A1,1 0 0,1 1,18V15A1,1 0 0,1 2,14H3A7,7 0 0,1 10,7H11V5.73C10.4,5.39 10,4.74 10,4A2,2 0 0,1 12,2M12,4.5A0.5,0.5 0 0,0 11.5,5A0.5,0.5 0 0,0 12,5.5A0.5,0.5 0 0,0 12.5,5A0.5,0.5 0 0,0 12,4.5Z"/>
                            </svg>
                          )
                        };
                      case 'glass':
                        return {
                          color: 'from-emerald-400 to-emerald-500',
                          bgColor: 'from-emerald-50/90 to-emerald-100/80',
                          borderColor: 'border-emerald-200/60',
                          textColor: 'text-emerald-800',
                          icon: (
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M5,4V6H6V10A4,4 0 0,0 10,14V20A2,2 0 0,0 12,22A2,2 0 0,0 14,20V14A4,4 0 0,0 18,10V6H19V4H5M8,6H16V10A2,2 0 0,1 14,12H10A2,2 0 0,1 8,10V6Z"/>
                            </svg>
                          )
                        };
                      case 'mixed':
                        return {
                          color: 'from-violet-400 to-violet-500',
                          bgColor: 'from-violet-50/90 to-violet-100/80',
                          borderColor: 'border-violet-200/60',
                          textColor: 'text-violet-800',
                          icon: (
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5C15.78,14 16,14.22 16,14.5V16H14.5C14.22,16 14,15.78 14,15.5V14H13.71L13.44,13.73C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7.56,5 6,6.56 6,8.5C6,10.44 7.56,12 9.5,12C11.44,12 13,10.44 13,8.5C13,6.56 11.44,5 9.5,5Z"/>
                            </svg>
                          )
                        };
                      case 'paper':
                        return {
                          color: 'from-amber-400 to-amber-500',
                          bgColor: 'from-amber-50/90 to-amber-100/80',
                          borderColor: 'border-amber-200/60',
                          textColor: 'text-amber-800',
                          icon: (
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                            </svg>
                          )
                        };
                      case 'organic':
                        return {
                          color: 'from-green-400 to-green-500',
                          bgColor: 'from-green-50/90 to-green-100/80',
                          borderColor: 'border-green-200/60',
                          textColor: 'text-green-800',
                          icon: (
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z"/>
                            </svg>
                          )
                        };
                      case 'electronic':
                        return {
                          color: 'from-indigo-400 to-indigo-500',
                          bgColor: 'from-indigo-50/90 to-indigo-100/80',
                          borderColor: 'border-indigo-200/60',
                          textColor: 'text-indigo-800',
                          icon: (
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M21,16V4H3V16H21M21,2A2,2 0 0,1 23,4V16A2,2 0 0,1 21,18H14L16,21V22H8V21L10,18H3C1.89,18 1,17.1 1,16V4C1,2.89 1.89,2 3,2H21Z"/>
                            </svg>
                          )
                        };
                      default:
                        return {
                          color: 'from-teal-400 to-teal-500',
                          bgColor: 'from-teal-50/90 to-teal-100/80',
                          borderColor: 'border-teal-200/60',
                          textColor: 'text-teal-800',
                          icon: (
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                          )
                        };
                    }
                  };

                  const wasteInfo = getWasteTypeInfo(waste.wasteType);

                  return (
                    <div key={waste._id} className={`group relative bg-gradient-to-br ${wasteInfo.bgColor} backdrop-blur-sm border-2 ${wasteInfo.borderColor} rounded-2xl p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:border-opacity-60`}>
                      <div className={`absolute inset-0 bg-gradient-to-br ${wasteInfo.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`}></div>
                      <div className="relative">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-3 bg-gradient-to-br ${wasteInfo.color} text-white rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                              {wasteInfo.icon}
                            </div>
                            <div>
                              <h4 className={`font-bold text-xl capitalize ${wasteInfo.textColor}`}>{waste.wasteType}</h4>
                              <span className={`bg-gradient-to-r ${wasteInfo.color} text-white text-xs px-3 py-1 rounded-full font-medium shadow-md`}>
                                Available
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center justify-between p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-white/40">
                            <span className="text-sm text-gray-600 font-medium">Weight:</span>
                            <span className={`text-lg font-bold ${wasteInfo.textColor}`}>{waste.totalWeight} kg</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-white/40">
                            <span className="text-sm text-gray-600 font-medium">From:</span>
                            <span className="text-sm font-semibold text-gray-900">{waste.pickupPartnerId?.companyName || 'root'}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-white/40">
                            <span className="text-sm text-gray-600 font-medium">Date:</span>
                            <span className="text-sm font-medium text-gray-700">{formatDate(waste.createdAt)}</span>
                          </div>
                        </div>

                        {/* Order Button */}
                        <button 
                          onClick={() => handleOrderWaste(waste)}
                          className={`w-full bg-gradient-to-r ${wasteInfo.color} text-white font-bold py-4 px-6 rounded-xl hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 group-hover:shadow-2xl relative overflow-hidden`}
                          title={`Place order for ${waste.totalWeight} kg of ${waste.wasteType} waste`}
                        >
                          <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                          <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                          </svg>
                          <span className="relative z-10">Place Order</span>
                          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                          </svg>
                        </button>
                      </div>
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
                <p className="text-gray-600 mt-1">
                  Your waste orders and order history
                  {recyclerOrders && recyclerOrders.length > 0 && (
                    <span className="ml-2 text-sm">
                      ({filteredOrders.length} of {recyclerOrders.length} orders)
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                {recyclerOrders && recyclerOrders.length > 0 && (
                  <button
                    onClick={generateOrdersReport}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg text-sm font-medium"
                    title="Generate PDF report of filtered orders"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Generate Report</span>
                  </button>
                )}
                {recyclerOrders && recyclerOrders.length > 0 && (
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-600">{filteredOrders.length}</p>
                    <p className="text-xs text-gray-500">showing</p>
                  </div>
                )}
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Search and Filter Controls */}
            <div className="mb-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by Order ID, waste type, weight..."
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white/90 backdrop-blur-sm placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Status Filter */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg bg-white/90 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Search Results Summary */}
              {(searchTerm || statusFilter !== 'all') && (
                <div className="flex items-center justify-between px-4 py-2 bg-emerald-50/80 backdrop-blur-sm border border-emerald-200 rounded-lg">
                  <span className="text-sm text-emerald-700">
                    {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} found
                    {searchTerm && ` matching "${searchTerm}"`}
                    {statusFilter !== 'all' && ` with status "${statusFilter}"`}
                  </span>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                    }}
                    className="text-sm text-emerald-600 hover:text-emerald-800 font-medium"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
            
            {filteredOrders && filteredOrders.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOrders.map((order) => {
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
                {(searchTerm || statusFilter !== 'all') ? (
                  <>
                    <p className="text-gray-500 font-medium text-lg">No matching orders found</p>
                    <p className="text-gray-400 text-sm mt-1">
                      Try adjusting your search criteria or clear the filters
                    </p>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                      }}
                      className="mt-3 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium"
                    >
                      Clear Filters
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-gray-500 font-medium text-lg">No orders found</p>
                    <p className="text-gray-400 text-sm mt-1">Your ordered waste details will appear here</p>
                  </>
                )}
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