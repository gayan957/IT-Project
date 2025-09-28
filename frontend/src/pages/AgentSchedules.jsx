import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../lib/api';
import jsPDF from 'jspdf';
import logoPng from '../assets/images/logos/trash2cash_logo.png';

const AgentSchedules = () => {
  const navigate = useNavigate();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, today, week, month
  const [sortBy, setSortBy] = useState('recent'); // recent, oldest, highest, lowest

  useEffect(() => {
    fetchScheduleCollections();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchScheduleCollections = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Please login to access schedule collections');
        navigate('/login');
        return;
      }

      const response = await api.get('/api/agent-schedules/history');
      
      setCollections(response.data.collections || response.data || []);
      
    } catch (error) {
      console.error('Error fetching schedule collections:', error);
      setCollections([]); // Set empty array to prevent crashes
      
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/login');
      } else if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        toast.error('Cannot connect to server. Please check your connection.');
      } else if (error.response?.status === 404) {
        toast.error('Schedule endpoint not found. Please contact support.');
      } else {
        toast.error('Failed to load schedule collections. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getWasteTypeColor = (wasteType) => {
    const colors = {
      organic: 'bg-green-100 text-green-800',
      plastic: 'bg-blue-100 text-blue-800',
      paper: 'bg-yellow-100 text-yellow-800',
      glass: 'bg-purple-100 text-purple-800',
      metal: 'bg-gray-100 text-gray-800',
      electronic: 'bg-red-100 text-red-800',
      mixed: 'bg-orange-100 text-orange-800',
      other: 'bg-indigo-100 text-indigo-800',
      unknown: 'bg-gray-100 text-gray-600'
    };
    return colors[wasteType?.toLowerCase()] || colors.other;
  };

  const formatLocation = (location) => {
    if (!location) return 'N/A';
    if (typeof location === 'string') return location;
    if (location.address) return location.address;
    if (location.latitude && location.longitude) {
      return `${location.latitude?.toFixed(4) || 'N/A'}, ${location.longitude?.toFixed(4) || 'N/A'}`;
    }
    return 'N/A';
  };

  const formatScheduledDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // PDF Generation Function for Schedule Collections
  const generateScheduleCollectionsPDF = () => {
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
      doc.text('Schedule Collections Report', 35, 22);
      doc.text('No 23/A, Kandy Road, Malabe', 35, 28);
      
      // Date and agent info
      doc.setFontSize(9);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 15, 12, { align: 'right' });
      doc.text(`Agent Report`, pageWidth - 15, 18, { align: 'right' });
      doc.text(`Schedule Collections`, pageWidth - 15, 24, { align: 'right' });

      let y = 50;

      // Summary Statistics
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Schedule Collection Summary', 15, y);
      y += 10;

      // Summary box
      doc.setFillColor(248, 250, 252);
      doc.rect(15, y - 5, pageWidth - 30, 25, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(15, y - 5, pageWidth - 30, 25);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      const totalCollections = filteredCollections.length;
      const totalEarnings = filteredCollections.reduce((sum, c) => sum + (c.totalPrice || 0), 0);
      const totalWeight = filteredCollections.reduce((sum, c) => sum + (c.wasteWeight || 0), 0);
      
      doc.text(`Total Schedule Collections: ${totalCollections}`, 20, y + 5);
      doc.text(`Total Weight: ${totalWeight.toFixed(1)} kg`, 20, y + 12);
      doc.text(`Total Earnings: Rs. ${totalEarnings.toFixed(2)}`, 20, y + 19);
      
      // Filter information
      const filterText = filter === 'all' ? 'All Time' : 
                        filter === 'today' ? 'Today' :
                        filter === 'week' ? 'Last 7 Days' : 'Last 30 Days';
      doc.text(`Period: ${filterText}`, pageWidth - 20, y + 5, { align: 'right' });
      doc.text(`Report Date: ${new Date().toLocaleDateString()}`, pageWidth - 20, y + 12, { align: 'right' });

      y += 35;

      // Schedule Collections Table
      y = ensurePageSpace(y, 30);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Schedule Collection Details', 15, y);
      y += 10;

      if (filteredCollections.length === 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('No schedule collections found for the selected period.', 15, y);
        y += 15;
      } else {
        // Table header
        y = ensurePageSpace(y, 20);
        const tableWidth = pageWidth - 30;
        const colPositions = [15, 40, 70, 100, 125, 155]; // Column positions
        
        doc.setFillColor(16, 185, 129);
        doc.rect(15, y - 5, tableWidth, 12, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text('Date', colPositions[0], y + 2);
        doc.text('Collection ID', colPositions[1], y + 2);
        doc.text('Waste Type', colPositions[2], y + 2);
        doc.text('Weight (kg)', colPositions[3], y + 2);
        doc.text('Payment (Rs.)', colPositions[4], y + 2);
        doc.text('Customer', colPositions[5], y + 2);
        
        y += 15;

        // Table rows
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(7);

        filteredCollections.forEach((collection, index) => {
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
          const collectionDate = new Date(collection.collectionDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          });
          const collectionId = collection._id ? collection._id.slice(-6) : `#${index + 1}`;
          const wasteType = collection.wasteType || 'Mixed';
          const weight = (collection.wasteWeight || 0).toFixed(1);
          const payment = (collection.totalPrice || 0).toFixed(2);
          const customer = collection.userId?.name || 'Unknown';
          
          // Truncate long text
          const truncatedCustomer = customer.length > 10 ? customer.substring(0, 10) + '...' : customer;
          const truncatedWasteType = wasteType.length > 8 ? wasteType.substring(0, 8) + '...' : wasteType;

          doc.text(collectionDate, colPositions[0], y + 2);
          doc.text(collectionId, colPositions[1], y + 2);
          doc.text(truncatedWasteType, colPositions[2], y + 2);
          doc.text(weight, colPositions[3], y + 2);
          doc.text(payment, colPositions[4], y + 2);
          doc.text(truncatedCustomer, colPositions[5], y + 2);

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
        doc.text(`${totalCollections} items`, colPositions[1], y + 3);
        doc.text('', colPositions[2], y + 3);
        doc.text(`${totalWeight.toFixed(1)} kg`, colPositions[3], y + 3);
        doc.text(`Rs. ${totalEarnings.toFixed(2)}`, colPositions[4], y + 3);
        doc.text('', colPositions[5], y + 3);
        
        y += 15;
      }

      // Additional Statistics
      if (filteredCollections.length > 0) {
        y = ensurePageSpace(y, 25);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Statistics & Analysis', 15, y);
        y += 10;

        // Calculate statistics
        const wasteTypes = filteredCollections.reduce((acc, c) => {
          const type = c.wasteType || 'Unknown';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});

        const avgWeight = totalWeight / totalCollections;
        const avgEarnings = totalEarnings / totalCollections;
        const mostCommonWaste = Object.keys(wasteTypes).reduce((a, b) => 
          wasteTypes[a] > wasteTypes[b] ? a : b, 'None'
        );

        // Calculate unique customers
        const uniqueCustomers = new Set(filteredCollections.map(c => c.userId?._id).filter(Boolean)).size;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`• Average weight per schedule collection: ${avgWeight.toFixed(2)} kg`, 20, y);
        y += 6;
        doc.text(`• Average earnings per collection: Rs. ${avgEarnings.toFixed(2)}`, 20, y);
        y += 6;
        doc.text(`• Most collected waste type: ${mostCommonWaste}`, 20, y);
        y += 6;
        doc.text(`• Unique customers served: ${uniqueCustomers}`, 20, y);
        y += 6;
        doc.text(`• Collection efficiency: ${((totalWeight / totalCollections) * 8).toFixed(1)}%`, 20, y);
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
      doc.text('Trash2Cash Schedule Management System | Generated automatically', 15, footerY);
      doc.text(`Page 1 | ${new Date().toLocaleDateString()}`, pageWidth - 15, footerY, { align: 'right' });

      // Generate filename
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `Schedule_Collections_Report_${dateStr}.pdf`;

      // Save the PDF
      doc.save(filename);
      toast.success('Schedule collections PDF report generated successfully!');
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF report. Please try again.');
    }
  };

  // Calculate today's stats
  const calculateTodaysStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaysCollections = collections.filter(collection => {
      const collectionDate = new Date(collection.collectionDate);
      collectionDate.setHours(0, 0, 0, 0);
      return collectionDate.getTime() === today.getTime();
    });

    return {
      totalCollections: todaysCollections.length,
      totalEarnings: todaysCollections.reduce((sum, collection) => sum + (collection.totalPrice || 0), 0),
      totalWeight: todaysCollections.reduce((sum, collection) => sum + (collection.wasteWeight || 0), 0)
    };
  }, [collections]);

  // Filter and sort collections
  const filteredCollections = useMemo(() => {
    let filtered = [...collections];
    const now = new Date();
    
    // Apply time filter
    switch (filter) {
      case 'today': {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filtered = filtered.filter(collection => 
          new Date(collection.collectionDate) >= today
        );
        break;
      }
      case 'week': {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(collection => 
          new Date(collection.collectionDate) >= weekAgo
        );
        break;
      }
      case 'month': {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(collection => 
          new Date(collection.collectionDate) >= monthAgo
        );
        break;
      }
      default:
        // 'all' - no filtering
        break;
    }
    
    // Sort collections
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.collectionDate) - new Date(a.collectionDate);
        case 'oldest':
          return new Date(a.collectionDate) - new Date(b.collectionDate);
        case 'highest':
          return (b.totalPrice || 0) - (a.totalPrice || 0);
        case 'lowest':
          return (a.totalPrice || 0) - (b.totalPrice || 0);
        default:
          return new Date(b.collectionDate) - new Date(a.collectionDate);
      }
    });
    
    return filtered;
  }, [collections, filter, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/pickup-agent-map')}
                className="mr-4 p-2 text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">My Schedule Collections</h1>
            </div>
            <div className="flex gap-3">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
              <button
                onClick={generateScheduleCollectionsPDF}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Generate PDF
              </button>
              <button
                onClick={fetchScheduleCollections}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards - Today's Schedule Collections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Today's Schedule Collections</p>
                <p className="text-2xl font-semibold text-gray-900">{calculateTodaysStats.totalCollections}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Today's Earnings</p>
                <p className="text-2xl font-semibold text-gray-900">Rs. {calculateTodaysStats.totalEarnings.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16l3-9M15 9h.01" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Today's Weight</p>
                <p className="text-2xl font-semibold text-gray-900">{calculateTodaysStats.totalWeight.toFixed(1)} kg</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-2">
                Time Period
              </label>
              <select
                id="filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
            <div className="flex-1">
              <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="recent">Most Recent</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Payment</option>
                <option value="lowest">Lowest Payment</option>
              </select>
            </div>
          </div>
        </div>

        {/* Schedule Collections List */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin mx-auto h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading schedule collections...</p>
            </div>
          ) : filteredCollections.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No schedule collections found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter === 'all' 
                  ? "You haven't collected any scheduled waste yet."
                  : "No schedule collections found for the selected time period."
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredCollections.map((collection, index) => (
                <div key={collection._id || index} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            Schedule Collection #{collection._id ? collection._id.slice(-8) : `${index + 1}`}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Collected: {formatDate(collection.collectionDate)}
                          </p>
                          {collection.scheduleId?.scheduledDate && (
                            <p className="text-sm text-gray-500">
                              Originally scheduled: {formatScheduledDate(collection.scheduleId.scheduledDate)}
                              {collection.scheduleId?.scheduledTime && ` at ${collection.scheduleId.scheduledTime}`}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Collection Location</p>
                          <p className="text-sm text-gray-900 font-medium">
                            {formatLocation(collection.scheduleLocation)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Waste Type</p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getWasteTypeColor(collection.wasteType)}`}>
                            {collection.wasteType || 'Unknown'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Weight Collected</p>
                          <p className="text-sm text-gray-900 font-medium">
                            {(collection.wasteWeight || 0).toFixed(1)} kg
                          </p>
                          {collection.scheduleId?.estimatedWeight && (
                            <p className="text-xs text-gray-500">
                              Est: {collection.scheduleId.estimatedWeight.toFixed(1)} kg
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Payment</p>
                          <p className="text-sm text-gray-900 font-medium">
                            Rs. {(collection.totalPrice || 0).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">
                            @ Rs. {(collection.pricePerKg || 0).toFixed(2)}/kg
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Customer</p>
                          <p className="text-sm text-gray-900 font-medium">
                            {collection.userId?.name || 'Unknown Customer'}
                          </p>
                          {collection.userId?.email && (
                            <p className="text-xs text-gray-500">{collection.userId.email}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Partner</p>
                          <p className="text-sm text-gray-900 font-medium">
                            {collection.partnerId?.companyName || collection.partnerId?.name || 'Unknown Partner'}
                          </p>
                        </div>
                      </div>
                      
                      {collection.notes && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-600">Notes</p>
                          <p className="text-sm text-gray-900">{collection.notes}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 capitalize">
                        {collection.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Showing {filteredCollections.length} of {collections.length} schedule collections
        </div>
      </div>
    </div>
  );
};

export default AgentSchedules;