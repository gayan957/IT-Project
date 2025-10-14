import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getPartnerOrders } from '../lib/pickupPartnerApi';
import jsPDF from 'jspdf';
import logoPng from '../assets/images/logos/trash2cash_logo.png';

const PickupPartnerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadOrdersData = async () => {
      try {
        setLoading(true);
        const response = await getPartnerOrders(currentPage, 12, statusFilter);
        
        if (response.success) {
          setOrders(response.data.orders || []);
          setTotalPages(response.data.pagination?.totalPages || 1);
        } else {
          toast.error('Failed to load orders');
        }
      } catch (error) {
        console.error('Error loading orders:', error);
        toast.error(error.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    loadOrdersData();
  }, [currentPage, statusFilter]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return {
          bg: 'from-emerald-50/80 to-emerald-100/80',
          border: 'border-emerald-200/50',
          badge: 'bg-emerald-100 text-emerald-700',
          icon: '✅'
        };
      case 'approved':
        return {
          bg: 'from-blue-50/80 to-blue-100/80',
          border: 'border-blue-200/50',
          badge: 'bg-blue-100 text-blue-700',
          icon: '👍'
        };
      case 'pending':
        return {
          bg: 'from-amber-50/80 to-amber-100/80',
          border: 'border-amber-200/50',
          badge: 'bg-amber-100 text-amber-700',
          icon: '⏳'
        };
      case 'cancelled':
        return {
          bg: 'from-red-50/80 to-red-100/80',
          border: 'border-red-200/50',
          badge: 'bg-red-100 text-red-700',
          icon: '❌'
        };
      default:
        return {
          bg: 'from-gray-50/80 to-gray-100/80',
          border: 'border-gray-200/50',
          badge: 'bg-gray-100 text-gray-700',
          icon: '📋'
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
      case 'mixed':
        return { icon: '🗂️', color: 'text-purple-600' };
      default:
        return { icon: '📦', color: 'text-gray-600' };
    }
  };

  // Validate search input - only allow letters, numbers, and spaces
  const handleSearchChange = (e) => {
    const value = e.target.value;
    const validPattern = /^[a-zA-Z0-9\s]*$/;
    
    if (validPattern.test(value)) {
      setSearchTerm(value);
    }
  };

  // PDF Generation Function for Partner Orders
  const generateOrdersReport = () => {
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

      // Filter orders based on current filter
      const filteredOrders = statusFilter === 'all' ? orders : orders.filter(order => order.orderStatus === statusFilter);

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
      doc.text('Partner Orders Report', 35, 22);
      doc.text('No 23/A, Kandy Road, Malabe', 35, 28);
      
      // Date and report info
      doc.setFontSize(9);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 15, 12, { align: 'right' });
      doc.text(`Partner Report`, pageWidth - 15, 18, { align: 'right' });
      doc.text(`Recycler Orders`, pageWidth - 15, 24, { align: 'right' });

      let y = 50;

      // Summary Statistics
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Orders Summary', 15, y);
      y += 10;

      // Summary box
      doc.setFillColor(248, 250, 252);
      doc.rect(15, y - 5, pageWidth - 30, 25, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(15, y - 5, pageWidth - 30, 25);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      const totalOrders = filteredOrders.length;
      const totalValue = filteredOrders.reduce((sum, order) => sum + (order.wasteAmount || 0), 0);
      const totalWeight = filteredOrders.reduce((sum, order) => sum + (order.weight || 0), 0);
      
      doc.text(`Total Orders: ${totalOrders}`, 20, y + 5);
      doc.text(`Total Weight: ${totalWeight.toFixed(1)} kg`, 20, y + 12);
      doc.text(`Total Value: Rs. ${totalValue.toFixed(2)}`, 20, y + 19);
      
      // Filter information
      const filterText = statusFilter === 'all' ? 'All Orders' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1);
      doc.text(`Filter: ${filterText}`, pageWidth - 20, y + 5, { align: 'right' });
      doc.text(`Report Date: ${new Date().toLocaleDateString()}`, pageWidth - 20, y + 12, { align: 'right' });

      y += 35;

      // Orders Table
      y = ensurePageSpace(y, 30);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Order Details', 15, y);
      y += 10;

      if (filteredOrders.length === 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('No orders found for the selected filter.', 15, y);
        y += 15;
      } else {
        // Table header
        y = ensurePageSpace(y, 20);
        const tableWidth = pageWidth - 30;
        const colPositions = [15, 40, 70, 95, 125, 155]; // Column positions
        
        doc.setFillColor(16, 185, 129);
        doc.rect(15, y - 5, tableWidth, 12, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text('Order ID', colPositions[0], y + 2);
        doc.text('Waste Type', colPositions[1], y + 2);
        doc.text('Weight (kg)', colPositions[2], y + 2);
        doc.text('Value (Rs.)', colPositions[3], y + 2);
        doc.text('Status', colPositions[4], y + 2);
        doc.text('Recycler', colPositions[5], y + 2);
        
        y += 15;

        // Table rows
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(7);

        filteredOrders.forEach((order, index) => {
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
          const orderId = order._id ? order._id.slice(-6) : `#${index + 1}`;
          const wasteType = order.wasteWarehouseId?.wasteType || 'Unknown';
          const weight = (order.weight || 0).toFixed(1);
          const value = (order.wasteAmount || 0).toFixed(2);
          const status = order.orderStatus || 'N/A';
          const recycler = order.recyclerId?.companyName || order.recyclerId?.name || 'N/A';
          
          // Truncate long text
          const truncatedWasteType = wasteType.length > 8 ? wasteType.substring(0, 8) + '...' : wasteType;
          const truncatedRecycler = recycler.length > 12 ? recycler.substring(0, 12) + '...' : recycler;
          const truncatedStatus = status.length > 8 ? status.substring(0, 8) + '...' : status;

          doc.text(orderId, colPositions[0], y + 2);
          doc.text(truncatedWasteType, colPositions[1], y + 2);
          doc.text(weight, colPositions[2], y + 2);
          doc.text(value, colPositions[3], y + 2);
          doc.text(truncatedStatus, colPositions[4], y + 2);
          doc.text(truncatedRecycler, colPositions[5], y + 2);

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
        doc.text(`${totalWeight.toFixed(1)} kg`, colPositions[2], y + 3);
        doc.text(`Rs. ${totalValue.toFixed(2)}`, colPositions[3], y + 3);
        doc.text('', colPositions[4], y + 3);
        doc.text('', colPositions[5], y + 3);
        
        y += 15;
      }

      // Additional Statistics
      if (filteredOrders.length > 0) {
        y = ensurePageSpace(y, 25);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Statistics & Analysis', 15, y);
        y += 10;

        // Calculate statistics
        const wasteTypes = filteredOrders.reduce((acc, order) => {
          const type = order.wasteWarehouseId?.wasteType || 'Unknown';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});

        const statusCounts = filteredOrders.reduce((acc, order) => {
          const status = order.orderStatus || 'Unknown';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});

        const avgWeight = totalWeight / totalOrders;
        const avgValue = totalValue / totalOrders;
        const mostCommonWaste = Object.keys(wasteTypes).reduce((a, b) => 
          wasteTypes[a] > wasteTypes[b] ? a : b, 'None'
        );

        // Calculate unique recyclers
        const uniqueRecyclers = new Set(filteredOrders.map(order => order.recyclerId?._id).filter(Boolean)).size;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`• Average weight per order: ${avgWeight.toFixed(2)} kg`, 20, y);
        y += 6;
        doc.text(`• Average value per order: Rs. ${avgValue.toFixed(2)}`, 20, y);
        y += 6;
        doc.text(`• Most ordered waste type: ${mostCommonWaste}`, 20, y);
        y += 6;
        doc.text(`• Unique recyclers: ${uniqueRecyclers}`, 20, y);
        y += 6;
        doc.text(`• Order completion rate: ${((statusCounts.completed || 0) / totalOrders * 100).toFixed(1)}%`, 20, y);
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
      doc.text('Trash2Cash Partner Management System | Generated automatically', 15, footerY);
      doc.text(`Page 1 | ${new Date().toLocaleDateString()}`, pageWidth - 15, footerY, { align: 'right' });

      // Generate filename
      const dateStr = new Date().toISOString().split('T')[0];
      const filterStr = statusFilter === 'all' ? 'All' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1);
      const filename = `Partner_Orders_Report_${filterStr}_${dateStr}.pdf`;

      // Save the PDF
      doc.save(filename);
      toast.success('Orders report generated successfully!');
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF report. Please try again.');
    }
  };

  // Filter orders based on search term and status
  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.orderStatus === statusFilter;
    const matchesSearch = searchTerm === '' || 
      (order.wasteWarehouseId?.wasteType?.toLowerCase().startsWith(searchTerm.toLowerCase())) ||
      (order.orderStatus?.toLowerCase().startsWith(searchTerm.toLowerCase())) ||
      (order.recyclerId?.companyName?.toLowerCase().startsWith(searchTerm.toLowerCase())) ||
      (order.recyclerId?.name?.toLowerCase().startsWith(searchTerm.toLowerCase()));
    
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Partner Orders
            </h1>
            <p className="text-gray-600 mt-1">Manage waste orders from recyclers</p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Search Orders:</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by waste type, status, or recycler..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full px-4 py-2 pl-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
                <svg
                  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
            
            <div className="sm:w-48">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Filter by Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            {/* Clear Filters Button */}
            {(searchTerm || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Clear</span>
              </button>
            )}
          </div>
          
          {/* Search Results Summary and Export Button */}
          <div className="flex items-center justify-between">
            <div>
              {(searchTerm || statusFilter !== 'all') && (
                <div className="text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
                  <span>
                    Showing {filteredOrders.length} of {orders.length} orders
                    {searchTerm && ` matching "${searchTerm}"`}
                    {statusFilter !== 'all' && ` with status "${statusFilter}"`}
                  </span>
                </div>
              )}
            </div>
          
            <button
              onClick={generateOrdersReport}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Generate Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      {filteredOrders && filteredOrders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order) => {
            const statusInfo = getStatusColor(order.orderStatus);
            const wasteInfo = getWasteTypeInfo(order.wasteWarehouseId?.wasteType);
            const orderDate = order.createdAt ? formatDate(order.createdAt) : 'N/A';
            const approvedDate = order.approvedAt ? formatDate(order.approvedAt) : null;

            return (
              <div 
                key={order._id} 
                className={`group relative bg-gradient-to-br ${statusInfo.bg} backdrop-blur-sm rounded-2xl p-6 border ${statusInfo.border} shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2`}
              >
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
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.badge} capitalize flex items-center space-x-1`}>
                      <span>{statusInfo.icon}</span>
                      <span>{order.orderStatus}</span>
                    </span>
                  </div>

                  {/* Order details */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 font-medium">Waste Weight:</span>
                      <span className="text-lg font-bold text-gray-900">{order.weight || order.wasteAmount || 'N/A'} kg</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 font-medium">Order Value:</span>
                      <span className="text-lg font-bold text-emerald-600">
                        {order.wasteAmount ? `Rs. ${order.wasteAmount}` : 'N/A'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 font-medium">Recycler:</span>
                      <span className="text-sm text-gray-800 font-medium">
                        {order.recyclerId?.companyName || order.recyclerId?.name || 'N/A'}
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
                          {order.approvedBy.username || order.approvedBy.name || 'Admin'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Progress indicator */}
                  <div className="mt-4 pt-4 border-t border-gray-200/50">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        order.orderStatus === 'completed' ? 'bg-emerald-500' : 
                        order.orderStatus === 'approved' ? 'bg-blue-500' : 
                        order.orderStatus === 'cancelled' ? 'bg-red-500' : 'bg-amber-500'
                      }`}></div>
                      <span className="text-xs text-gray-600">
                        {order.orderStatus === 'completed' ? 'Order completed' :
                         order.orderStatus === 'approved' ? 'Ready for processing' : 
                         order.orderStatus === 'cancelled' ? 'Order cancelled' : 'Awaiting approval'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-16 border border-gray-100 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium text-lg">No orders found</p>
          <p className="text-gray-400 text-sm mt-1">
            {searchTerm || statusFilter !== 'all' 
              ? 'No orders match your search criteria. Try adjusting your filters.' 
              : 'Orders will appear here when recyclers place them'
            }
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 bg-blue-500 text-white rounded-lg">
            {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default PickupPartnerOrders;