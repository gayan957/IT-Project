import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../lib/auth';
import api from '../lib/api';
import jsPDF from 'jspdf';
import logoPng from '../assets/images/logos/trash2cash_logo.png';

const AgentPickups = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, today, week, month
  const [sortBy, setSortBy] = useState('recent'); // recent, oldest, highest, lowest

  const navigationItems = [
    { path: '/pickup-agent/dashboard', label: 'Overview', icon: '📊' },
    { path: '/pickup-agent/dashboard/map', label: 'Collection Map', icon: '🗺️' },
    { path: '/pickup-agent/dashboard/pickups', label: 'Pickups', icon: '📦' },
    { path: '/pickup-agent/dashboard/schedule', label: 'Schedule', icon: '📅' },
    { path: '/pickup-agent/dashboard/earnings', label: 'Earnings', icon: '💰' },
    { path: '/pickup-agent/dashboard/profile', label: 'Profile', icon: '👤' }
  ];

  const isActiveLink = (path) => {
    if (path === '/pickup-agent/dashboard/pickups') {
      return location.pathname === '/pickup-agent/dashboard/pickups' || location.pathname === '/agent-pickups';
    }
    if (path === '/pickup-agent/dashboard') {
      return location.pathname === '/pickup-agent/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  // Check if this component is being rendered within the dashboard
  const isStandalonePage = location.pathname === '/agent-pickups';

  useEffect(() => {
    fetchCollections();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Please login to access collections');
        navigate('/login');
        return;
      }

      // Fetch both bin collections and schedule collections
      const [binCollectionsResponse, scheduleCollectionsResponse] = await Promise.allSettled([
        api.get('/api/collections/agent/history'),
        api.get('/api/agent-schedules/history')
      ]);

      let allCollections = [];

      // Process bin collections
      if (binCollectionsResponse.status === 'fulfilled') {
        const binCollections = binCollectionsResponse.value.data.collections || [];
        // Add a type field to distinguish bin collections
        const formattedBinCollections = binCollections.map(collection => ({
          ...collection,
          collectionType: 'bin'
        }));
        allCollections = [...allCollections, ...formattedBinCollections];
      } else {
        console.warn('Failed to fetch bin collections:', binCollectionsResponse.reason);
      }

      // Process schedule collections
      if (scheduleCollectionsResponse.status === 'fulfilled') {
        const scheduleCollections = scheduleCollectionsResponse.value.data.collections || [];
        // Add a type field and transform structure to match bin collections
        const formattedScheduleCollections = scheduleCollections.map(collection => ({
          ...collection,
          collectionType: 'schedule',
          // Map schedule collection fields to bin collection structure for consistency
          wasteWeight: collection.wasteWeight,
          totalPrice: collection.totalPrice,
          wasteType: collection.wasteType,
          binId: {
            location: {
              address: collection.scheduleLocation?.address || 'Schedule Location'
            }
          },
          createdAt: collection.createdAt || collection.collectionDate
        }));
        allCollections = [...allCollections, ...formattedScheduleCollections];
      } else {
        console.warn('Failed to fetch schedule collections:', scheduleCollectionsResponse.reason);
      }

      // Sort all collections by date (most recent first)
      allCollections.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setCollections(allCollections);
      
    } catch (error) {
      console.error('Error fetching collections:', error);
      setCollections([]); // Set empty array to prevent crashes
      
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/login');
      } else if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        toast.error('Cannot connect to server. Please check your connection.');
      } else {
        toast.error('Failed to load collections. Please try again.');
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
    if (location.coordinates && Array.isArray(location.coordinates)) {
      const [lng, lat] = location.coordinates;
      return `${lat?.toFixed(4) || 'N/A'}, ${lng?.toFixed(4) || 'N/A'}`;
    }
    return 'N/A';
  };

  const getWeight = (collection) => {
    // Check multiple possible weight field names
    return collection.wasteWeight || collection.weight || collection.totalWeight || 0;
  };

  // PDF Generation Function
  const generateCollectionsPDF = () => {
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
      doc.text('Waste Collection Report', 35, 22);
      doc.text('No 23/A, Kandy Road, Malabe', 35, 28);
      
      // Date and agent info
      doc.setFontSize(9);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 15, 12, { align: 'right' });
      doc.text(`Agent: ${user?.name || 'N/A'}`, pageWidth - 15, 18, { align: 'right' });
      doc.text(`ID: ${user?.agentId || 'N/A'}`, pageWidth - 15, 24, { align: 'right' });

      let y = 50;

      // Summary Statistics
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Collection Summary', 15, y);
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
      const totalWeight = filteredCollections.reduce((sum, c) => sum + getWeight(c), 0);
      
      doc.text(`Total Collections: ${totalCollections}`, 20, y + 5);
      doc.text(`Total Weight: ${totalWeight.toFixed(1)} kg`, 20, y + 12);
      doc.text(`Total Earnings: Rs. ${totalEarnings.toFixed(2)}`, 20, y + 19);
      
      // Filter information
      const filterText = filter === 'all' ? 'All Time' : 
                        filter === 'today' ? 'Today' :
                        filter === 'week' ? 'Last 7 Days' : 'Last 30 Days';
      doc.text(`Period: ${filterText}`, pageWidth - 20, y + 5, { align: 'right' });
      doc.text(`Report Date: ${new Date().toLocaleDateString()}`, pageWidth - 20, y + 12, { align: 'right' });

      y += 35;

      // Collections Table
      y = ensurePageSpace(y, 30);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Collection Details', 15, y);
      y += 10;

      if (filteredCollections.length === 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('No collections found for the selected period.', 15, y);
        y += 15;
      } else {
        // Table header
        y = ensurePageSpace(y, 20);
        const tableWidth = pageWidth - 30;
        const colPositions = [15, 40, 75, 105, 130, 160]; // Column positions
        
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
        doc.text('Location', colPositions[5], y + 2);
        
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
          const collectionDate = new Date(collection.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          });
          const collectionId = collection._id ? collection._id.slice(-6) : `#${index + 1}`;
          const wasteType = collection.wasteType || 'Mixed';
          const weight = getWeight(collection).toFixed(1);
          const payment = (collection.totalPrice || 0).toFixed(2);
          const location = formatLocation(collection.binId?.location);
          
          // Truncate long text
          const truncatedLocation = location.length > 15 ? location.substring(0, 15) + '...' : location;
          const truncatedWasteType = wasteType.length > 8 ? wasteType.substring(0, 8) + '...' : wasteType;

          doc.text(collectionDate, colPositions[0], y + 2);
          doc.text(collectionId, colPositions[1], y + 2);
          doc.text(truncatedWasteType, colPositions[2], y + 2);
          doc.text(weight, colPositions[3], y + 2);
          doc.text(payment, colPositions[4], y + 2);
          doc.text(truncatedLocation, colPositions[5], y + 2);

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
        doc.text('Statistics', 15, y);
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

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`• Average weight per collection: ${avgWeight.toFixed(2)} kg`, 20, y);
        y += 6;
        doc.text(`• Average earnings per collection: Rs. ${avgEarnings.toFixed(2)}`, 20, y);
        y += 6;
        doc.text(`• Most collected waste type: ${mostCommonWaste}`, 20, y);
        y += 6;
        doc.text(`• Collection efficiency: ${((totalWeight / totalCollections) * 10).toFixed(1)}%`, 20, y);
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
      const agentName = user?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Agent';
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `Collections_Report_${agentName}_${dateStr}.pdf`;

      // Save the PDF
      doc.save(filename);
      toast.success('PDF report generated successfully!');
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF report. Please try again.');
    }
  };

  // Calculate today's real-time statistics
  const calculateTodaysStats = useMemo(() => {
    if (!collections || !Array.isArray(collections)) {
      return {
        totalCollections: 0,
        totalEarnings: 0,
        totalWeight: 0
      };
    }

    const today = new Date();
    const todaysCollections = collections.filter(collection => {
      const collectionDate = new Date(collection.createdAt);
      return collectionDate.toDateString() === today.toDateString();
    });

    const totalCollections = todaysCollections.length;
    const totalEarnings = todaysCollections.reduce((sum, collection) => {
      return sum + (collection.totalPrice || 0);
    }, 0);
    const totalWeight = todaysCollections.reduce((sum, collection) => {
      return sum + getWeight(collection);
    }, 0);

    return {
      totalCollections,
      totalEarnings,
      totalWeight
    };
  }, [collections]);

  // Filter collections based on selected filter
  const filteredCollections = useMemo(() => {
    if (!collections || !Array.isArray(collections)) return [];
    
    let filtered = [...collections];
    const now = new Date();
    
    // Filter by time period
    switch (filter) {
      case 'today': {
        filtered = filtered.filter(collection => {
          const collectionDate = new Date(collection.createdAt);
          return collectionDate.toDateString() === now.toDateString();
        });
        break;
      }
      case 'week': {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(collection => 
          new Date(collection.createdAt) >= weekAgo
        );
        break;
      }
      case 'month': {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(collection => 
          new Date(collection.createdAt) >= monthAgo
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
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'highest':
          return (b.totalPrice || 0) - (a.totalPrice || 0);
        case 'lowest':
          return (a.totalPrice || 0) - (b.totalPrice || 0);
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
    
    return filtered;
  }, [collections, filter, sortBy]);

  // Render for standalone page with sidebar
  if (isStandalonePage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
        <div className="flex">
          {/* Sidebar */}
          <nav className="w-64 bg-white shadow-xl min-h-screen border-r border-gray-200">
            <div className="p-6">
              {/* Agent Info Section */}
              <div className="mb-8 p-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl text-white">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">Agent Portal</h2>
                    <p className="text-purple-100 text-sm">Welcome back, {user?.name}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">On Duty</span>
                </div>
              </div>
              
              <div className="space-y-2">
                {navigationItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActiveLink(item.path)
                        ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg transform scale-105'
                        : 'text-gray-700 hover:bg-purple-50 hover:text-purple-600'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1">
            <PickupsContent />
          </main>
        </div>
      </div>
    );
  }

  // Render for dashboard child route without sidebar
  return <PickupsContent />;

  // Content component function
  function PickupsContent() {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">My Pickups</h1>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={generateCollectionsPDF}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Export PDF</span>
                </button>
                <button
                  onClick={fetchCollections}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards - Today's Collections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Today's Collections</p>
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

        {/* Collections List */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin mx-auto h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading collections...</p>
            </div>
          ) : filteredCollections.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m12-7l-3 3m0 0l-3-3m3 3V8m-6 3h-.01" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No collections found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter === 'all' 
                  ? "You haven't collected any waste yet."
                  : "No collections found for the selected time period."
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
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                            <span>
                              Collection #{collection._id ? collection._id.slice(-8) : `${index + 1}`}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              collection.collectionType === 'schedule' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {collection.collectionType === 'schedule' ? '📅 Schedule' : '🗑️ Bin'}
                            </span>
                          </h3>
                          <p className="text-sm text-gray-500">
                            {formatDate(collection.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">
                            {collection.collectionType === 'schedule' ? 'Schedule Location' : 'Bin Location'}
                          </p>
                          <p className="text-sm text-gray-900 font-medium">
                            {formatLocation(collection.binId?.location)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Waste Type</p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getWasteTypeColor(collection.wasteType)}`}>
                            {collection.wasteType || 'Unknown'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Weight</p>
                          <p className="text-sm text-gray-900 font-medium">
                            {getWeight(collection).toFixed(1)} kg
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Payment</p>
                          <p className="text-sm text-gray-900 font-medium">
                            Rs. {(collection.totalPrice || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {collection.collectionType === 'bin' && (
                          <div>
                            <p className="text-sm text-gray-600">Fill Level</p>
                            <p className="text-sm text-gray-900">
                              Before: <span className="font-medium">{collection.fillLevelBefore || 0}%</span>
                            </p>
                            <p className="text-sm text-gray-900">
                              After: <span className="font-medium">{collection.fillLevelAfter || 0}%</span>
                            </p>
                          </div>
                        )}
                        {collection.collectionType === 'schedule' && (
                          <div>
                            <p className="text-sm text-gray-600">Collection Type</p>
                            <p className="text-sm text-gray-900">
                              <span className="font-medium">Scheduled Pickup</span>
                            </p>
                            <p className="text-sm text-gray-500">
                              Payment processed via gateway
                            </p>
                          </div>
                        )}
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
          Showing {filteredCollections.length} of {collections.length} collections
        </div>
      </div>
      </div>
    );
  }
};

export default AgentPickups;