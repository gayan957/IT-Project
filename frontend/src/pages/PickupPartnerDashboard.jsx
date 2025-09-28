import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import api from '../lib/api';
import logoPng from '../assets/images/logos/trash2cash_logo.png';

export default function PickupPartnerDashboard() {
  const location = useLocation();
  const [stats, setStats] = useState({
    totalPickups: 0,
    pendingPickups: 0,
    completedPickups: 0,
    monthlyEarnings: 0
  });

  const [warehouseData, setWarehouseData] = useState([]);
  const [warehouseLoading, setWarehouseLoading] = useState(true);
  const [totalWeight, setTotalWeight] = useState(0);

  const navigationItems = [
    { path: '/pickup-partner/dashboard', label: 'Overview', icon: '📊' },
    { path: '/pickup-partner/dashboard/bin-collection', label: 'Bin Collection', icon: '🗑️' },
    { path: '/pickup-partner/dashboard/schedule-collection', label: 'Schedule Collection', icon: '📅' },
    { path: '/pickup-partner/dashboard/warehouse', label: 'Warehouse', icon: '🏪' },
    { path: '/pickup-partner/dashboard/orders', label: 'Orders', icon: '📋' },
    { path: '/pickup-partner/dashboard/agents', label: 'Pickup Agent Management', icon: '🚛' },
    { path: '/pickup-partner/dashboard/calculate-salary', label: 'Calculate Salary', icon: '🧮' },
    { path: '/pickup-partner/dashboard/agent-salaries', label: 'Agent Salaries', icon: '💰' }
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch partner stats
        setStats({
          totalPickups: 120,
          pendingPickups: 8,
          completedPickups: 112,
          monthlyEarnings: 2450
        });

        // Fetch warehouse data
        const response = await api.get('/api/pickup-partners/warehouse');
        if (response.data.success) {
          setWarehouseData(response.data.data.warehouseData);
          setTotalWeight(response.data.data.totalWeight);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setWarehouseLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const isActiveLink = (path) => {
    if (path === '/pickup-partner/dashboard') {
      return location.pathname === '/pickup-partner/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  // Helper function to get waste type emoji and color
  const getWasteTypeInfo = (wasteType) => {
    const wasteTypeMap = {
      plastic: { emoji: '♻️', color: 'from-blue-500 to-cyan-500', bgColor: 'bg-blue-50', textColor: 'text-blue-700' },
      paper: { emoji: '📄', color: 'from-yellow-500 to-orange-500', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700' },
      glass: { emoji: '🍶', color: 'from-green-500 to-emerald-500', bgColor: 'bg-green-50', textColor: 'text-green-700' },
      metal: { emoji: '🔧', color: 'from-gray-500 to-slate-500', bgColor: 'bg-gray-50', textColor: 'text-gray-700' },
      organic: { emoji: '🌱', color: 'from-green-600 to-lime-600', bgColor: 'bg-green-50', textColor: 'text-green-700' },
      electronic: { emoji: '💻', color: 'from-purple-500 to-indigo-500', bgColor: 'bg-purple-50', textColor: 'text-purple-700' },
      mixed: { emoji: '🗂️', color: 'from-red-500 to-pink-500', bgColor: 'bg-red-50', textColor: 'text-red-700' }
    };
    return wasteTypeMap[wasteType] || { emoji: '📦', color: 'from-gray-400 to-gray-500', bgColor: 'bg-gray-50', textColor: 'text-gray-700' };
  };

  // PDF Generation Function for Warehouse Inventory Report
  const generateWarehouseInventoryPDF = () => {
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
      doc.text('Warehouse Inventory Report', 35, 22);
      doc.text('No 23/A, Kandy Road, Malabe', 35, 28);
      
      // Date and partner info
      doc.setFontSize(9);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 15, 12, { align: 'right' });
      doc.text('Partner Dashboard', pageWidth - 15, 18, { align: 'right' });
      doc.text(`Report Type: Inventory`, pageWidth - 15, 24, { align: 'right' });

      let y = 50;

      // Report Title and Summary
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Warehouse Inventory Summary', 15, y);
      y += 15;

      // Summary Statistics Box
      doc.setFillColor(248, 250, 252);
      doc.rect(15, y - 5, pageWidth - 30, 30, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(15, y - 5, pageWidth - 30, 30);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      
      const totalItems = warehouseData.length;
      const reportDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      doc.text(`Total Waste Categories: ${totalItems}`, 20, y + 5);
      doc.text(`Total Weight in Warehouse: ${totalWeight.toFixed(2)} kg`, 20, y + 12);
      doc.text(`Report Generated: ${reportDate}`, 20, y + 19);
      
      y += 40;

      // Inventory Details
      if (warehouseData.length === 0) {
        y = ensurePageSpace(y, 30);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Inventory Status', 15, y);
        y += 10;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text('No waste materials currently stored in warehouse.', 15, y);
        y += 15;
      } else {
        y = ensurePageSpace(y, 30);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Detailed Inventory Breakdown', 15, y);
        y += 15;

        // Table header
        const tableWidth = pageWidth - 30;
        const colPositions = [15, 70, 120, 155]; // Column positions
        
        doc.setFillColor(16, 185, 129);
        doc.rect(15, y - 5, tableWidth, 12, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text('Waste Type', colPositions[0], y + 2);
        doc.text('Weight (kg)', colPositions[1], y + 2);
        doc.text('Percentage', colPositions[2], y + 2);
        doc.text('Status', colPositions[3], y + 2);
        
        y += 17;

        // Table rows
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);

        warehouseData.forEach((item, index) => {
          y = ensurePageSpace(y, 15);

          const percentage = totalWeight > 0 ? ((item.totalWeight / totalWeight) * 100).toFixed(1) : 0;
          
          // Alternate row background
          if (index % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(15, y - 3, tableWidth, 12, 'F');
          }

          // Row separator line
          doc.setDrawColor(220, 220, 220);
          doc.setLineWidth(0.3);
          doc.line(15, y + 9, 15 + tableWidth, y + 9);

          // Cell data
          const wasteType = item.wasteType ? item.wasteType.charAt(0).toUpperCase() + item.wasteType.slice(1) : 'Unknown';
          const weight = item.totalWeight.toFixed(2);
          const status = item.totalWeight > 0 ? 'In Stock' : 'Empty';
          
          doc.text(wasteType, colPositions[0], y + 3);
          doc.text(weight, colPositions[1], y + 3);
          doc.text(`${percentage}%`, colPositions[2], y + 3);
          doc.text(status, colPositions[3], y + 3);

          // Column separators
          for (let i = 1; i < colPositions.length; i++) {
            const x = colPositions[i] - 5;
            doc.setDrawColor(220, 220, 220);
            doc.line(x, y - 3, x, y + 9);
          }
          
          y += 12;
        });

        // Table summary
        y += 5;
        y = ensurePageSpace(y, 15);
        
        doc.setFillColor(240, 253, 244);
        doc.rect(15, y - 3, tableWidth, 12, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('TOTALS:', colPositions[0], y + 3);
        doc.text(`${totalWeight.toFixed(2)} kg`, colPositions[1], y + 3);
        doc.text('100.0%', colPositions[2], y + 3);
        doc.text(`${totalItems} Categories`, colPositions[3], y + 3);
        
        y += 20;

        // Warehouse Analytics
        y = ensurePageSpace(y, 35);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Warehouse Analytics', 15, y);
        y += 10;

        // Find dominant waste type
        let dominantWaste = { type: 'None', weight: 0, percentage: 0 };
        if (warehouseData.length > 0) {
          const sortedByWeight = [...warehouseData].sort((a, b) => b.totalWeight - a.totalWeight);
          dominantWaste = {
            type: sortedByWeight[0].wasteType,
            weight: sortedByWeight[0].totalWeight,
            percentage: totalWeight > 0 ? ((sortedByWeight[0].totalWeight / totalWeight) * 100).toFixed(1) : 0
          };
        }

        const averageWeight = totalItems > 0 ? (totalWeight / totalItems).toFixed(2) : 0;
        const warehouseUtilization = Math.min((totalWeight / 1000) * 100, 100).toFixed(1); // Assuming 1000kg capacity

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`• Dominant waste type: ${dominantWaste.type.charAt(0).toUpperCase() + dominantWaste.type.slice(1)} (${dominantWaste.percentage}%)`, 20, y);
        y += 7;
        doc.text(`• Average weight per category: ${averageWeight} kg`, 20, y);
        y += 7;
        doc.text(`• Estimated warehouse utilization: ${warehouseUtilization}%`, 20, y);
        y += 7;
        doc.text(`• Total storage categories: ${totalItems}`, 20, y);
        y += 15;
      }

      // Recommendations Section
      y = ensurePageSpace(y, 30);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Recommendations', 15, y);
      y += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      if (totalWeight < 100) {
        doc.text('• Warehouse capacity is low. Consider increasing collection activities.', 20, y);
        y += 6;
      } else if (totalWeight > 800) {
        doc.text('• Warehouse is reaching capacity. Schedule urgent recycler pickups.', 20, y);
        y += 6;
      }
      
      doc.text('• Regular inventory monitoring helps optimize storage efficiency.', 20, y);
      y += 6;
      doc.text('• Contact recyclers when specific waste types reach optimal quantities.', 20, y);
      y += 6;
      doc.text('• Maintain proper segregation to ensure quality and better pricing.', 20, y);

      // Footer
      const footerY = pageHeight - 15;
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(1);
      doc.line(15, footerY - 5, pageWidth - 15, footerY - 5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Trash2Cash Waste Management System | Warehouse Inventory Report', 15, footerY);
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - 15, footerY, { align: 'right' });

      // Generate filename
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `Warehouse_Inventory_Report_${dateStr}.pdf`;

      // Save the PDF
      doc.save(filename);
      toast.success('Warehouse inventory report generated successfully!');
      
    } catch (error) {
      console.error('Error generating warehouse inventory PDF:', error);
      toast.error('Failed to generate inventory report. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white shadow-xl min-h-screen border-r border-gray-200">
          <div className="p-6">
            <div className="space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActiveLink(item.path)
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
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
        <main className="flex-1 p-8">
          {location.pathname === '/pickup-partner/dashboard' ? (
            <div className="space-y-8">
              {/* Welcome Section */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Partner Dashboard</h1>
                <p className="text-gray-600">Manage your pickup operations and track your performance</p>
              </div>

              {/* Stats Grid */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm font-medium">Total Pickups</p>
                        <p className="text-3xl font-bold">{stats.totalPickups}</p>
                      </div>
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">📦</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-yellow-100 text-sm font-medium">Pending</p>
                        <p className="text-3xl font-bold">{stats.pendingPickups}</p>
                      </div>
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">⏰</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm font-medium">Completed</p>
                        <p className="text-3xl font-bold">{stats.completedPickups}</p>
                      </div>
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">✅</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm font-medium">Monthly Earnings</p>
                        <p className="text-3xl font-bold">${stats.monthlyEarnings}</p>
                      </div>
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">💰</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Warehouse Inventory */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Warehouse Inventory</h3>
                    <p className="text-gray-600">Current waste storage by type</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 px-4 py-2 rounded-xl border border-emerald-200">
                      <span className="text-emerald-700 font-semibold text-sm">
                        Total: {totalWeight.toFixed(2)} kg
                      </span>
                    </div>
                    <button
                      onClick={generateWarehouseInventoryPDF}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-sm"
                      title="Export Warehouse Inventory Report"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Export Report</span>
                    </button>
                  </div>
                </div>
                
                {warehouseLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-gray-600">Loading warehouse data...</span>
                    </div>
                  </div>
                ) : warehouseData.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl text-gray-400">📦</span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">No Waste in Warehouse</h4>
                    <p className="text-gray-500">Start collecting waste to see your inventory here</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {warehouseData.map((item, index) => {
                      const wasteInfo = getWasteTypeInfo(item.wasteType);
                      const percentage = totalWeight > 0 ? ((item.totalWeight / totalWeight) * 100).toFixed(1) : 0;
                      
                      return (
                        <div key={index} className={`relative overflow-hidden rounded-2xl p-6 ${wasteInfo.bgColor} border border-gray-200 hover:shadow-lg transition-all duration-300 group`}>
                          <div className={`absolute inset-0 bg-gradient-to-br ${wasteInfo.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                          <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                              <div className={`w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm`}>
                                <span className="text-2xl">{wasteInfo.emoji}</span>
                              </div>
                              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${wasteInfo.textColor} bg-white/60`}>
                                {percentage}% of total
                              </div>
                            </div>
                            <div>
                              <h4 className={`font-bold ${wasteInfo.textColor} text-lg mb-1 capitalize`}>
                                {item.wasteType}
                              </h4>
                              <p className="text-gray-600 text-sm mb-3">
                                Weight stored in warehouse
                              </p>
                              <div className="flex items-baseline space-x-2">
                                <span className={`text-2xl font-bold ${wasteInfo.textColor}`}>
                                  {item.totalWeight.toFixed(1)}
                                </span>
                                <span className="text-gray-500 text-sm font-medium">kg</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl text-white">�️</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">Bin Collection</h3>
                      <p className="text-gray-600 text-sm mb-4">Monitor and manage bin collection activities</p>
                      <Link
                        to="/pickup-partner/dashboard/bin-collection"
                        className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        View Collections
                      </Link>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl text-white">�</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">Schedule Collection</h3>
                      <p className="text-gray-600 text-sm mb-4">Plan and schedule collection routes</p>
                      <Link
                        to="/pickup-partner/dashboard/schedule-collection"
                        className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        Schedule Now
                      </Link>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl text-white">�</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">Manage Pickup Agents</h3>
                      <p className="text-gray-600 text-sm mb-4">Assign and manage your pickup agents</p>
                      <Link
                        to="/pickup-partner/dashboard/agents"
                        className="inline-flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                      >
                        Manage Agents
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}
