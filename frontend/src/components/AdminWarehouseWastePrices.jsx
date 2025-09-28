import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import trash2cashLogo from '../assets/images/trash2cash_logo.png';

// API functions for warehouse waste prices
const API_BASE_URL = 'http://localhost:5000/api';

const warehouseWastePriceApi = {
  getAllPrices: async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/admin/warehouse-waste-prices`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch warehouse waste prices');
    return response.json();
  },

  updatePrice: async (id, data) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/admin/warehouse-waste-prices/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update warehouse waste price');
    return response.json();
  },

  createPrice: async (data) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/admin/warehouse-waste-prices`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create warehouse waste price');
    return response.json();
  },

  initializeDefaults: async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/admin/warehouse-waste-prices/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to initialize default prices');
    return response.json();
  },

  deletePrice: async (id) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/admin/warehouse-waste-prices/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to delete warehouse waste price');
    return response.json();
  }
};

const WASTE_TYPES = [
  'plastic', 'paper', 'glass', 'metal', 
  'organic', 'coconut-shell', 'e-waste', 'mixed'
];

const formatWasteTypeName = (type) => {
  return type.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

const formatPrice = (price) => {
  return `Rs. ${parseFloat(price).toFixed(2)}`;
};

const AdminWarehouseWastePrices = () => {
  const [wastePrices, setWastePrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [editingPrice, setEditingPrice] = useState({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPriceForm, setNewPriceForm] = useState({
    wasteType: '',
    pricePerKg: '',
    adminTaxPerKg: ''
  });
  const [showReport, setShowReport] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchWastePrices();
  }, []);

  const fetchWastePrices = async () => {
    try {
      setLoading(true);
      const response = await warehouseWastePriceApi.getAllPrices();
      setWastePrices(response.data || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching warehouse waste prices:', error);
      setError('Failed to load warehouse waste prices. Make sure the backend server is running.');
      setWastePrices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeDefaults = async () => {
    try {
      setUpdating('initialize');
      await warehouseWastePriceApi.initializeDefaults();
      await fetchWastePrices();
      toast.success('Default warehouse waste prices initialized successfully!');
      setError(null);
    } catch (error) {
      console.error('Error initializing defaults:', error);
      setError('Failed to initialize default prices. Please try again.');
      toast.error('Failed to initialize default prices');
    } finally {
      setUpdating(null);
    }
  };

  const handleEditPrice = (price) => {
    setEditingPrice({
      [price._id]: {
        pricePerKg: price.pricePerKg.toString(),
        adminTaxPerKg: price.adminTaxPerKg.toString()
      }
    });
  };

  const handleCancelEdit = (priceId) => {
    const newEditingPrice = { ...editingPrice };
    delete newEditingPrice[priceId];
    setEditingPrice(newEditingPrice);
  };

  const handleSavePrice = async (price) => {
    try {
      setUpdating(price._id);
      const editData = editingPrice[price._id];
      const pricePerKg = parseFloat(editData.pricePerKg);
      const adminTaxPerKg = parseFloat(editData.adminTaxPerKg);

      if (isNaN(pricePerKg) || pricePerKg < 0) {
        toast.error('Please enter a valid price per kg');
        return;
      }

      if (isNaN(adminTaxPerKg) || adminTaxPerKg < 0) {
        toast.error('Please enter a valid admin tax per kg');
        return;
      }

      await warehouseWastePriceApi.updatePrice(price._id, {
        pricePerKg,
        adminTaxPerKg
      });

      await fetchWastePrices();
      handleCancelEdit(price._id);
      toast.success('Warehouse waste price updated successfully!');
      setError(null);
    } catch (error) {
      console.error('Error updating warehouse waste price:', error);
      setError('Failed to update price. Please try again.');
      toast.error('Failed to update warehouse waste price');
    } finally {
      setUpdating(null);
    }
  };

  const handleCreatePrice = async (e) => {
    e.preventDefault();
    try {
      setUpdating('create');
      const pricePerKg = parseFloat(newPriceForm.pricePerKg);
      const adminTaxPerKg = parseFloat(newPriceForm.adminTaxPerKg);

      if (!newPriceForm.wasteType) {
        toast.error('Please select a waste type');
        return;
      }

      if (isNaN(pricePerKg) || pricePerKg < 0) {
        toast.error('Please enter a valid price per kg');
        return;
      }

      if (isNaN(adminTaxPerKg) || adminTaxPerKg < 0) {
        toast.error('Please enter a valid admin tax per kg');
        return;
      }

      await warehouseWastePriceApi.createPrice({
        wasteType: newPriceForm.wasteType,
        pricePerKg,
        adminTaxPerKg
      });

      await fetchWastePrices();
      setShowCreateForm(false);
      setNewPriceForm({ wasteType: '', pricePerKg: '', adminTaxPerKg: '' });
      toast.success('Warehouse waste price created successfully!');
      setError(null);
    } catch (error) {
      console.error('Error creating warehouse waste price:', error);
      setError('Failed to create price. Please try again.');
      toast.error('Failed to create warehouse waste price');
    } finally {
      setUpdating(null);
    }
  };

  const handleDeletePrice = async (priceId) => {
    if (!window.confirm('Are you sure you want to delete this warehouse waste price?')) {
      return;
    }

    try {
      setUpdating(priceId);
      await warehouseWastePriceApi.deletePrice(priceId);
      await fetchWastePrices();
      toast.success('Warehouse waste price deleted successfully!');
    } catch (error) {
      console.error('Error deleting warehouse waste price:', error);
      toast.error('Failed to delete warehouse waste price');
    } finally {
      setUpdating(null);
    }
  };

  const getAvailableWasteTypes = () => {
    const usedTypes = wastePrices.map(price => price.wasteType);
    return WASTE_TYPES.filter(type => !usedTypes.includes(type));
  };

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      
      if (!wastePrices || wastePrices.length === 0) {
        toast.error('No warehouse waste price data available to generate report');
        return;
      }

      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Helper function for currency formatting
      const formatCurrency = (amount) => {
        return `Rs.${Number(amount || 0).toFixed(2)}`;
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
      doc.text('Warehouse Waste Price Report', 40, 32);
      
      // Report metadata
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const currentDate = new Date().toLocaleDateString('en-US');
      doc.text(`Generated: ${currentDate}`, pageWidth - 20, 25, { align: 'right' });
      doc.text(`Total Prices: ${wastePrices.length}`, pageWidth - 20, 31, { align: 'right' });

      let yPosition = 55;

      // Report Summary Section
      doc.setTextColor(16, 185, 129);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('WAREHOUSE WASTE PRICE SUMMARY', 20, yPosition);
      
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(1);
      doc.line(20, yPosition + 4, pageWidth - 20, yPosition + 4);
      
      yPosition += 20;

      // Summary statistics
      const totalWasteTypes = wastePrices.length;
      const averageBasePrice = wastePrices.reduce((sum, price) => sum + price.pricePerKg, 0) / totalWasteTypes;
      const averageTax = wastePrices.reduce((sum, price) => sum + price.adminTaxPerKg, 0) / totalWasteTypes;
      const averageTotal = averageBasePrice + averageTax;

      const summaryData = [
        ['Total Waste Types', totalWasteTypes.toString()],
        ['Average Base Price', formatCurrency(averageBasePrice)],
        ['Average Admin Tax', formatCurrency(averageTax)],
        ['Average Total Price', formatCurrency(averageTotal)]
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

      // Price Details Section
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setTextColor(16, 185, 129);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('DETAILED PRICE BREAKDOWN', 20, yPosition);
      
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(1);
      doc.line(20, yPosition + 4, pageWidth - 20, yPosition + 4);
      
      yPosition += 15;

      // Prices table
      const pricesData = wastePrices.map(price => [
        formatWasteTypeName(price.wasteType),
        formatCurrency(price.pricePerKg),
        formatCurrency(price.adminTaxPerKg),
        formatCurrency(price.pricePerKg + price.adminTaxPerKg),
        new Date(price.updatedAt).toLocaleDateString(),
        price.updatedBy?.name || 'System'
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Waste Type', 'Base Price', 'Admin Tax', 'Total Price', 'Last Updated', 'Updated By']],
        body: pricesData,
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
          0: { cellWidth: 30 }, // Waste Type
          1: { cellWidth: 25 }, // Base Price
          2: { cellWidth: 25 }, // Admin Tax
          3: { cellWidth: 25 }, // Total Price
          4: { cellWidth: 30 }, // Last Updated
          5: { cellWidth: 35 }  // Updated By
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
      doc.text('TRASH2CASH | Warehouse Management System | admin@trash2cash.com', pageWidth / 2, footerY - 5, { align: 'center' });
      
      doc.setFontSize(8);
      doc.text('This report is computer-generated and contains warehouse waste pricing information.', pageWidth / 2, footerY, { align: 'center' });
      doc.text(`Report ID: WWP-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Date.now().toString().slice(-4)}`, pageWidth / 2, footerY + 5, { align: 'center' });

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `WarehouseWastePrices_Report_${timestamp}.pdf`;
      
      // Download the PDF
      doc.save(filename);
      toast.success('Warehouse waste price report generated successfully!');
      
    } catch (error) {
      console.error('Error generating warehouse waste price report:', error);
      toast.error('Failed to generate warehouse waste price report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleShowReportModal = () => {
    setShowReport(true);
  };

  const handleCloseReportModal = () => {
    setShowReport(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          <span className="ml-3 text-gray-600 font-medium">Loading warehouse waste prices...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Warehouse Waste Prices
              </h2>
              <p className="text-gray-600 mt-1">Manage warehouse waste pricing with admin tax</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={handleShowReportModal}
              disabled={!wastePrices.length}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-colors font-medium shadow-md disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Report</span>
            </button>

            {getAvailableWasteTypes().length > 0 && (
              <button
                onClick={() => setShowCreateForm(true)}
                disabled={updating}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-colors font-medium shadow-md disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Price</span>
              </button>
            )}
            
            <button
              onClick={handleInitializeDefaults}
              disabled={updating === 'initialize'}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-colors font-medium shadow-md disabled:opacity-50"
            >
              {updating === 'initialize' ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              <span>Initialize Defaults</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Add New Warehouse Waste Price</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleCreatePrice} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Waste Type</label>
                <select
                  value={newPriceForm.wasteType}
                  onChange={(e) => setNewPriceForm({ ...newPriceForm, wasteType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                >
                  <option value="">Select waste type...</option>
                  {getAvailableWasteTypes().map(type => (
                    <option key={type} value={type}>
                      {formatWasteTypeName(type)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price per kg (Rs.)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newPriceForm.pricePerKg}
                  onChange={(e) => setNewPriceForm({ ...newPriceForm, pricePerKg: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Admin Tax per kg (Rs.)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newPriceForm.adminTaxPerKg}
                  onChange={(e) => setNewPriceForm({ ...newPriceForm, adminTaxPerKg: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="0.00"
                  required
                />
              </div>
              
              {newPriceForm.pricePerKg && newPriceForm.adminTaxPerKg && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-emerald-800">
                    Total per kg: Rs. {(parseFloat(newPriceForm.pricePerKg) + parseFloat(newPriceForm.adminTaxPerKg)).toFixed(2)}
                  </p>
                </div>
              )}
              
              <div className="flex items-center justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating === 'create'}
                  className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-colors font-medium disabled:opacity-50"
                >
                  {updating === 'create' ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Creating...</span>
                    </div>
                  ) : (
                    'Create Price'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Waste Prices List */}
      {wastePrices.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12 border border-gray-100 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Warehouse Waste Prices Found</h3>
          <p className="text-gray-600 mb-6">Get started by initializing default prices or adding a new price.</p>
          <button
            onClick={handleInitializeDefaults}
            disabled={updating === 'initialize'}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-colors font-medium shadow-md disabled:opacity-50"
          >
            {updating === 'initialize' ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            <span>Initialize Default Prices</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wastePrices.map((price) => (
            <div key={price._id} className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 capitalize">
                      {formatWasteTypeName(price.wasteType)}
                    </h3>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!editingPrice[price._id] ? (
                      <>
                        <button
                          onClick={() => handleEditPrice(price)}
                          disabled={updating}
                          className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Edit price"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeletePrice(price._id)}
                          disabled={updating}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete price"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleSavePrice(price)}
                          disabled={updating === price._id}
                          className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Save changes"
                        >
                          {updating === price._id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => handleCancelEdit(price._id)}
                          disabled={updating === price._id}
                          className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Cancel editing"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {editingPrice[price._id] ? (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Price per kg (Rs.)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editingPrice[price._id].pricePerKg}
                          onChange={(e) => setEditingPrice({
                            ...editingPrice,
                            [price._id]: {
                              ...editingPrice[price._id],
                              pricePerKg: e.target.value
                            }
                          })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Admin Tax per kg (Rs.)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editingPrice[price._id].adminTaxPerKg}
                          onChange={(e) => setEditingPrice({
                            ...editingPrice,
                            [price._id]: {
                              ...editingPrice[price._id],
                              adminTaxPerKg: e.target.value
                            }
                          })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>
                      {editingPrice[price._id].pricePerKg && editingPrice[price._id].adminTaxPerKg && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                          <p className="text-sm font-semibold text-emerald-800">
                            Total: {formatPrice(parseFloat(editingPrice[price._id].pricePerKg) + parseFloat(editingPrice[price._id].adminTaxPerKg))}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600 font-medium">Base Price:</span>
                        <span className="text-sm font-bold text-gray-900">{formatPrice(price.pricePerKg)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600 font-medium">Admin Tax:</span>
                        <span className="text-sm font-bold text-orange-600">{formatPrice(price.adminTaxPerKg)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <span className="text-sm text-emerald-700 font-semibold">Total per kg:</span>
                        <span className="text-sm font-bold text-emerald-800">{formatPrice(price.pricePerKg + price.adminTaxPerKg)}</span>
                      </div>
                    </>
                  )}
                  
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Last updated: {new Date(price.updatedAt).toLocaleDateString()}
                    </p>
                    {price.updatedBy?.name && (
                      <p className="text-xs text-gray-500">
                        By: {price.updatedBy.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-screen overflow-hidden flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Warehouse Waste Price Report</h3>
                <p className="text-sm text-gray-600 mt-1">Complete warehouse waste pricing details with admin tax breakdown</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleGenerateReport}
                  disabled={generating}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-colors font-medium shadow-md disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>{generating ? 'Generating...' : 'Download PDF'}</span>
                </button>
                <button
                  onClick={handleCloseReportModal}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              {/* Report Preview */}
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="mb-6">
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Report Preview</h4>
                  <p className="text-sm text-gray-600">This preview shows what will be included in your PDF report.</p>
                </div>
                
                {/* Summary Stats */}
                <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                  <h5 className="font-semibold text-gray-900 mb-3">Summary Statistics</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-600">{wastePrices.length}</div>
                      <div className="text-xs text-gray-600">Total Waste Types</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {wastePrices.length > 0 ? formatPrice(wastePrices.reduce((sum, price) => sum + price.pricePerKg, 0) / wastePrices.length) : 'Rs.0.00'}
                      </div>
                      <div className="text-xs text-gray-600">Avg Base Price</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {wastePrices.length > 0 ? formatPrice(wastePrices.reduce((sum, price) => sum + price.adminTaxPerKg, 0) / wastePrices.length) : 'Rs.0.00'}
                      </div>
                      <div className="text-xs text-gray-600">Avg Admin Tax</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-600">
                        {wastePrices.length > 0 ? formatPrice(wastePrices.reduce((sum, price) => sum + price.pricePerKg + price.adminTaxPerKg, 0) / wastePrices.length) : 'Rs.0.00'}
                      </div>
                      <div className="text-xs text-gray-600">Avg Total Price</div>
                    </div>
                  </div>
                </div>
                
                {/* Price List */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <h5 className="font-semibold text-gray-900 p-4 border-b border-gray-200">Detailed Price Breakdown</h5>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-emerald-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">Waste Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">Base Price</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">Admin Tax</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">Total Price</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">Last Updated</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {wastePrices.map((price, index) => (
                          <tr key={price._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 capitalize">
                              {formatWasteTypeName(price.wasteType)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {formatPrice(price.pricePerKg)}
                            </td>
                            <td className="px-4 py-3 text-sm text-orange-600 font-medium">
                              {formatPrice(price.adminTaxPerKg)}
                            </td>
                            <td className="px-4 py-3 text-sm font-bold text-emerald-600">
                              {formatPrice(price.pricePerKg + price.adminTaxPerKg)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {new Date(price.updatedAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWarehouseWastePrices;