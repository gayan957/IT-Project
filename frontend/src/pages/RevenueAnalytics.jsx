import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getAllWasteOrders } from '../lib/adminWasteOrdersApi';
import jsPDF from 'jspdf';
import logoPng from '../assets/images/logos/trash2cash_logo.png';

const RevenueAnalytics = () => {
  const [orderWasteData, setOrderWasteData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, this-month, last-month, this-year
  const [searchTerm, setSearchTerm] = useState('');

  // Handle search input change with validation
  const handleSearchChange = (e) => {
    const value = e.target.value;
    // Allow only letters, numbers, and spaces
    const validPattern = /^[a-zA-Z0-9\s]*$/;
    
    if (validPattern.test(value)) {
      setSearchTerm(value);
    }
  };

  const [revenueStats, setRevenueStats] = useState({
    totalServiceCharge: 0,
    totalOrderValue: 0,
    totalOrders: 0,
    avgServiceCharge: 0,
    wasteTypeBreakdown: {}
  });

  useEffect(() => {
    fetchOrderWasteData();
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyDateFilter = (orders, filterType) => {
    if (filterType === 'all') return orders;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      const orderYear = orderDate.getFullYear();
      const orderMonth = orderDate.getMonth();

      switch (filterType) {
        case 'this-month':
          return orderYear === currentYear && orderMonth === currentMonth;
        case 'last-month': {
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          return orderYear === lastMonthYear && orderMonth === lastMonth;
        }
        case 'this-year':
          return orderYear === currentYear;
        default:
          return true;
      }
    });
  };

  // Filter orders based on search term
  const filteredOrderWasteData = orderWasteData.filter(order => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Search in recycler name, email, company name
    const recyclerMatch = 
      order.recyclerId?.name?.toLowerCase().startsWith(searchLower) ||
      order.recyclerId?.email?.toLowerCase().startsWith(searchLower) ||
      order.recyclerId?.companyName?.toLowerCase().startsWith(searchLower);
    
    // Search in waste type
    const wasteTypeMatch = 
      order.wasteWarehouseId?.wasteType?.toLowerCase().startsWith(searchLower) ||
      order.meta?.wasteType?.toLowerCase().startsWith(searchLower);
    
    // Search in order ID (last 6 characters)
    const orderIdMatch = order._id?.slice(-6).toLowerCase().startsWith(searchLower);
    
    // Search in status
    const statusMatch = order.orderStatus?.toLowerCase().startsWith(searchLower);
    
    return recyclerMatch || wasteTypeMatch || orderIdMatch || statusMatch;
  });

  const fetchOrderWasteData = async () => {
    try {
      setLoading(true);
      
      // Fetch orders
      const ordersResponse = await getAllWasteOrders(1, 1000, 'all');
      
      if (ordersResponse.success) {
        let orders = ordersResponse.data.orders || [];
        
        // Apply client-side filtering based on the selected filter
        orders = applyDateFilter(orders, filter);
        
        setOrderWasteData(orders);
        calculateRevenueStats(orders);
      } else {
        toast.error(ordersResponse.error || 'Failed to load revenue data');
      }
    } catch (error) {
      console.error('Error fetching order waste data:', error);
      toast.error('Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  };

  const calculateRevenueStats = (orders) => {
    const stats = {
      totalServiceCharge: 0,
      totalOrderValue: 0,
      totalOrders: orders.length,
      avgServiceCharge: 0,
      wasteTypeBreakdown: {},
      statusBreakdown: {
        pending: 0,
        approved: 0,
        completed: 0,
        cancelled: 0
      },
      recyclerBreakdown: {}
    };

    orders.forEach(order => {
      const serviceCharge = order.adminTaxAmount || 0;
      const orderValue = order.totalOrderValue || 0;
      const wasteType = order.wasteWarehouseId?.wasteType || order.meta?.wasteType || 'Unknown';
      const status = order.orderStatus || 'pending';
      const recyclerName = order.recyclerId?.companyName || order.recyclerId?.name || 'Unknown';

      stats.totalServiceCharge += serviceCharge;
      stats.totalOrderValue += orderValue;

      // Waste type breakdown
      if (!stats.wasteTypeBreakdown[wasteType]) {
        stats.wasteTypeBreakdown[wasteType] = {
          count: 0,
          serviceCharge: 0,
          totalValue: 0,
          weight: 0
        };
      }

      stats.wasteTypeBreakdown[wasteType].count += 1;
      stats.wasteTypeBreakdown[wasteType].serviceCharge += serviceCharge;
      stats.wasteTypeBreakdown[wasteType].totalValue += orderValue;
      stats.wasteTypeBreakdown[wasteType].weight += (order.weight || 0);

      // Status breakdown
      if (stats.statusBreakdown[status] !== undefined) {
        stats.statusBreakdown[status] += 1;
      }

      // Recycler breakdown
      if (!stats.recyclerBreakdown[recyclerName]) {
        stats.recyclerBreakdown[recyclerName] = {
          count: 0,
          serviceCharge: 0,
          totalValue: 0
        };
      }

      stats.recyclerBreakdown[recyclerName].count += 1;
      stats.recyclerBreakdown[recyclerName].serviceCharge += serviceCharge;
      stats.recyclerBreakdown[recyclerName].totalValue += orderValue;
    });

    stats.avgServiceCharge = stats.totalOrders > 0 ? stats.totalServiceCharge / stats.totalOrders : 0;
    setRevenueStats(stats);
  };

  // Revenue Report Generation Function
  const generateRevenueReport = () => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;

      // Header
      doc.setFillColor(16, 185, 129); // Emerald color
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      // Company logo and title
      try {
        // Add white circular background for logo visibility
        doc.setFillColor(255, 255, 255);
        doc.circle(25, 20, 8, 'F');
        
        // Add the Trash2Cash logo
        doc.addImage(logoPng, 'PNG', 19, 14, 12, 12);
      } catch (error) {
        // Fallback to text if logo fails to load
        console.warn('Logo failed to load, using fallback:', error);
        doc.setFillColor(255, 255, 255);
        doc.circle(25, 20, 6, 'F');
        doc.setFillColor(16, 185, 129);
        doc.setFontSize(8);
        doc.text('T2C', 22, 22);
      }
      
      // Company title next to logo
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.text('Trash2Cash', 40, 18);
      
      // Company address
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('No 23/A, Kandy Road, Malabe', 40, 26);
      
      doc.setFontSize(12);
      doc.text('Revenue Analytics Report', 40, 34);
      
      // Date and period info
      doc.setFontSize(10);
      const currentDate = new Date().toLocaleDateString();
      const periodText = filter === 'all' ? 'All Time' : 
                        filter === 'this-month' ? 'This Month' :
                        filter === 'last-month' ? 'Last Month' : 'This Year';
      
      doc.text(`Generated: ${currentDate}`, pageWidth - 20, 20, { align: 'right' });
      doc.text(`Period: ${periodText}`, pageWidth - 20, 30, { align: 'right' });

      yPosition = 60;

      // Executive Summary
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Revenue Summary', 20, yPosition);
      yPosition += 15;

      // Summary box
      doc.setFillColor(248, 250, 252);
      doc.rect(20, yPosition - 5, pageWidth - 40, 45, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(20, yPosition - 5, pageWidth - 40, 45);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      
      doc.text(`Total Service Charge Revenue: ${formatCurrency(revenueStats.totalServiceCharge)}`, 25, yPosition + 8);
      doc.text(`Total Order Value: ${formatCurrency(revenueStats.totalOrderValue)}`, 25, yPosition + 18);
      doc.text(`Total Orders Processed: ${revenueStats.totalOrders}`, 25, yPosition + 28);
      doc.text(`Average Service Charge: ${formatCurrency(revenueStats.avgServiceCharge)}`, 25, yPosition + 38);

      yPosition += 60;

      // Revenue Breakdown by Waste Type
      if (Object.keys(revenueStats.wasteTypeBreakdown).length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Revenue Breakdown by Waste Type', 20, yPosition);
        yPosition += 15;

        // Table headers
        doc.setFillColor(16, 185, 129);
        doc.rect(20, yPosition - 5, pageWidth - 40, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        
        doc.text('Waste Type', 25, yPosition + 2);
        doc.text('Orders', 70, yPosition + 2);
        doc.text('Weight (kg)', 100, yPosition + 2);
        doc.text('Service Charge', 135, yPosition + 2);
        doc.text('Percentage', 170, yPosition + 2);
        
        yPosition += 15;

        // Table rows
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);

        Object.entries(revenueStats.wasteTypeBreakdown).forEach(([wasteType, data], index) => {
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = 20;
          }

          // Alternate row colors
          if (index % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(20, yPosition - 3, pageWidth - 40, 10, 'F');
          }

          const percentage = revenueStats.totalServiceCharge > 0 ? 
            (data.serviceCharge / revenueStats.totalServiceCharge * 100).toFixed(1) : '0.0';
          
          doc.text(wasteType.charAt(0).toUpperCase() + wasteType.slice(1), 25, yPosition + 3);
          doc.text(data.count.toString(), 70, yPosition + 3);
          doc.text(data.weight.toFixed(1), 100, yPosition + 3);
          doc.text(formatCurrency(data.serviceCharge), 135, yPosition + 3);
          doc.text(`${percentage}%`, 170, yPosition + 3);
          
          yPosition += 10;
        });

        yPosition += 10;
      }

      // Top Recyclers (if available)
      if (Object.keys(revenueStats.recyclerBreakdown).length > 0) {
        if (yPosition > pageHeight - 60) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Top Recyclers by Revenue', 20, yPosition);
        yPosition += 15;

        // Sort recyclers by service charge and take top 10
        const topRecyclers = Object.entries(revenueStats.recyclerBreakdown)
          .sort((a, b) => b[1].serviceCharge - a[1].serviceCharge)
          .slice(0, 10);

        // Table headers
        doc.setFillColor(16, 185, 129);
        doc.rect(20, yPosition - 5, pageWidth - 40, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        
        doc.text('Recycler', 25, yPosition + 2);
        doc.text('Orders', 100, yPosition + 2);
        doc.text('Service Charge', 130, yPosition + 2);
        doc.text('Total Value', 170, yPosition + 2);
        
        yPosition += 15;

        // Table rows
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);

        topRecyclers.forEach(([recyclerName, data], index) => {
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = 20;
          }

          // Alternate row colors
          if (index % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(20, yPosition - 3, pageWidth - 40, 10, 'F');
          }

          // Truncate long names
          const displayName = recyclerName.length > 25 ? 
            recyclerName.substring(0, 25) + '...' : recyclerName;
          
          doc.text(displayName, 25, yPosition + 3);
          doc.text(data.count.toString(), 100, yPosition + 3);
          doc.text(formatCurrency(data.serviceCharge), 130, yPosition + 3);
          doc.text(formatCurrency(data.totalValue), 170, yPosition + 3);
          
          yPosition += 10;
        });

        yPosition += 15;
      }

      // Performance Analytics
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Performance Analytics', 20, yPosition);
      yPosition += 15;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      // Calculate additional metrics
      const totalWeight = Object.values(revenueStats.wasteTypeBreakdown)
        .reduce((sum, data) => sum + data.weight, 0);
      const avgWeightPerOrder = revenueStats.totalOrders > 0 ? totalWeight / revenueStats.totalOrders : 0;
      const revenuePerKg = totalWeight > 0 ? revenueStats.totalServiceCharge / totalWeight : 0;
      
      // Status breakdown
      const completedOrders = revenueStats.statusBreakdown?.completed || 0;
      const completionRate = revenueStats.totalOrders > 0 ? 
        (completedOrders / revenueStats.totalOrders * 100) : 0;
      
      doc.text(`• Total Weight Processed: ${totalWeight.toFixed(1)} kg`, 25, yPosition);
      yPosition += 8;
      doc.text(`• Average Weight per Order: ${avgWeightPerOrder.toFixed(2)} kg`, 25, yPosition);
      yPosition += 8;
      doc.text(`• Revenue per Kilogram: ${formatCurrency(revenuePerKg)}`, 25, yPosition);
      yPosition += 8;
      doc.text(`• Order Completion Rate: ${completionRate.toFixed(1)}%`, 25, yPosition);
      yPosition += 8;
      
      // Most profitable waste type
      const mostProfitableWaste = Object.entries(revenueStats.wasteTypeBreakdown)
        .sort((a, b) => b[1].serviceCharge - a[1].serviceCharge)[0];
      
      if (mostProfitableWaste) {
        doc.text(`• Most Profitable Waste Type: ${mostProfitableWaste[0]} (${formatCurrency(mostProfitableWaste[1].serviceCharge)})`, 25, yPosition);
      }

      yPosition += 20;

      // Authorized Signature Section
      if (yPosition > pageHeight - 70) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Authorization', 20, yPosition);
      yPosition += 20;

      // Signature area with box
      doc.setFillColor(248, 250, 252);
      doc.rect(20, yPosition - 5, pageWidth - 40, 40, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(20, yPosition - 5, pageWidth - 40, 40);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      // Left side - Prepared by
      doc.text('Prepared by:', 25, yPosition + 5);
      doc.text('Finance Department', 25, yPosition + 12);
      doc.text(`Date: ${currentDate}`, 25, yPosition + 19);
      
      // Signature line for prepared by
      doc.setDrawColor(100, 100, 100);
      doc.setLineWidth(0.5);
      doc.line(25, yPosition + 25, 85, yPosition + 25);
      doc.setFontSize(8);
      doc.text('Signature', 25, yPosition + 29);

      // Right side - Approved by
      doc.setFontSize(10);
      doc.text('Approved by:', pageWidth - 95, yPosition + 5);
      doc.text('Manager/Director', pageWidth - 95, yPosition + 12);
      doc.text(`Date: _______________`, pageWidth - 95, yPosition + 19);
      
      // Signature line for approved by
      doc.line(pageWidth - 95, yPosition + 25, pageWidth - 35, yPosition + 25);
      doc.setFontSize(8);
      doc.text('Signature', pageWidth - 95, yPosition + 29);

      yPosition += 50;

      // Footer
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(1);
      doc.line(20, yPosition, pageWidth - 20, yPosition);
      
      yPosition += 10;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('This report was generated automatically by Trash2Cash Revenue Analytics System', 20, yPosition);
      doc.text(`Generated on ${currentDate}`, pageWidth - 20, yPosition, { align: 'right' });

      // Generate filename
      const filterText = filter === 'all' ? 'AllTime' : 
                        filter === 'this-month' ? 'ThisMonth' :
                        filter === 'last-month' ? 'LastMonth' : 'ThisYear';
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `Revenue_Analytics_Report_${filterText}_${dateStr}.pdf`;

      // Save the PDF
      doc.save(filename);
      toast.success('Revenue report generated successfully!');
      
    } catch (error) {
      console.error('Error generating revenue report:', error);
      toast.error('Failed to generate revenue report. Please try again.');
    }
  };

  const formatCurrency = (amount) => {
    return `Rs${amount.toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      approved: { color: 'bg-blue-100 text-blue-800', text: 'Approved' },
      completed: { color: 'bg-green-100 text-green-800', text: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800', text: 'Cancelled' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading revenue analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Revenue Analytics</h1>
        <p className="text-gray-600">Track service charges and revenue from waste orders</p>
      </div>

      {/* Filter Controls */}
      <div className="mb-6 bg-white rounded-lg shadow-lg p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
            {/* Search Input */}
            <div className="flex-1 min-w-0">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search Orders
              </label>
              <div className="relative">
                <input
                  id="search"
                  type="text"
                  placeholder="Search by recycler name, waste type, order ID, or status..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Date Filter */}
            <div className="w-full sm:w-auto">
              <label htmlFor="dateFilter" className="block text-sm font-medium text-gray-700 mb-2">
                Time Period
              </label>
              <select
                id="dateFilter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">All Time</option>
                <option value="this-month">This Month</option>
                <option value="last-month">Last Month</option>
                <option value="this-year">This Year</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Clear Search Button */}
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear Search
              </button>
            )}
            
            {/* Generate Report Button */}
            <button
              onClick={generateRevenueReport}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Generate Report
            </button>
            
            {/* Refresh Button */}
            <button
              onClick={fetchOrderWasteData}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Data
            </button>
          </div>
        </div>

        {/* Search Results Summary */}
        <div className="mt-4 text-sm text-gray-600">
          {searchTerm ? (
            <p>
              Showing {filteredOrderWasteData.length} of {orderWasteData.length} orders matching "{searchTerm}"
            </p>
          ) : (
            <p>Showing all {orderWasteData.length} orders</p>
          )}
        </div>
      </div>

      {/* Revenue Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Service Charge Card */}
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
              <p className="text-sm font-medium text-emerald-700 uppercase tracking-wide mb-1">Total Service Charge</p>
              <p className="text-2xl font-bold text-gray-900 mb-2">{formatCurrency(revenueStats.totalServiceCharge)}</p>
              <div className="flex items-center">
                <svg className="w-4 h-4 text-emerald-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="text-sm text-emerald-600 font-medium">Revenue earned</span>
              </div>
            </div>
          </div>
        </div>

        {/* Total Order Value Card */}
        <div className="group bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-100 hover:border-blue-300 hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-medium text-blue-700 uppercase tracking-wide mb-1">Total Order Value</p>
              <p className="text-2xl font-bold text-gray-900 mb-2">{formatCurrency(revenueStats.totalOrderValue)}</p>
              <div className="flex items-center">
                <svg className="w-4 h-4 text-blue-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-sm text-blue-600 font-medium">Total transactions</span>
              </div>
            </div>
          </div>
        </div>

        {/* Total Orders Card */}
        <div className="group bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-6 border-2 border-purple-100 hover:border-purple-300 hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-violet-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-medium text-purple-700 uppercase tracking-wide mb-1">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900 mb-2">{revenueStats.totalOrders}</p>
              <div className="flex items-center">
                <svg className="w-4 h-4 text-purple-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-sm text-purple-600 font-medium">Orders processed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Average Service Charge Card */}
        <div className="group bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border-2 border-orange-100 hover:border-orange-300 hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-medium text-orange-700 uppercase tracking-wide mb-1">Avg Service Charge</p>
              <p className="text-2xl font-bold text-gray-900 mb-2">{formatCurrency(revenueStats.avgServiceCharge)}</p>
              <div className="flex items-center">
                <svg className="w-4 h-4 text-orange-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-sm text-orange-600 font-medium">Per order average</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* OrderWaste Table */}
      <div className="mb-8">
        {/* OrderWaste Table */}
        <div className="w-full">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Waste Orders & Service Charges</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Order ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Recycler</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Waste Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Weight (kg)</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Service Charge</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Total Value</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrderWasteData.length > 0 ? (
                    filteredOrderWasteData.slice(0, 15).map((order) => (
                      <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="font-mono text-sm text-gray-600">
                            {order._id?.slice(-6)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <span className="font-medium text-gray-900">
                              {order.recyclerId?.companyName || order.recyclerId?.name || 'Unknown'}
                            </span>
                            {order.recyclerId?.email && (
                              <p className="text-xs text-gray-500">{order.recyclerId.email}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="capitalize font-medium">
                            {order.wasteWarehouseId?.wasteType || order.meta?.wasteType || 'Unknown'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-gray-900">
                            {order.weight || 0}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-emerald-600">
                            {formatCurrency(order.adminTaxAmount || 0)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-blue-600">
                            {formatCurrency(order.totalOrderValue || 0)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(order.orderStatus)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatDate(order.createdAt)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center py-8 text-gray-500">
                        {searchTerm ? `No waste orders found matching "${searchTerm}"` : 'No waste orders found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {orderWasteData.length > 15 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500">
                  Showing 15 of {orderWasteData.length} orders
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueAnalytics;