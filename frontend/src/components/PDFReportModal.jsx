import React, { useState } from 'react';
import jsPDF from 'jspdf';
import logoPng from '../assets/images/logos/trash2cash_logo.png';

export default function PDFReportModal({ isOpen, onClose, analyticsData }) {
  const [selectedContent, setSelectedContent] = useState({
    summary: true,
    recentActivity: true,
    detailedTable: true,
    charts: true,
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleContentChange = (contentType) => {
    setSelectedContent((prev) => ({
      ...prev,
      [contentType]: !prev[contentType],
    }));
  };

  // --- helpers --------------------------------------------------------------
  const ensurePageSpace = (doc, y, needed = 25) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Leave space for footer (30mm from bottom)
    if (y + needed > pageHeight - 35) {
      doc.addPage();
      
      // Add header to new page
      doc.setFillColor(16, 185, 129);
      doc.rect(0, 0, pageWidth, 25, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Trash2Cash', 15, 15);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Analytics Report (Continued)', 15, 20);
      
      return 35; // Start content with proper margin below header
    }
    return y;
  };

  const drawSectionHeader = (doc, title, y) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    y = ensurePageSpace(doc, y, 25);
    
    // Modern section header
    doc.setFillColor(240, 253, 244); // Green-50
    doc.rect(15, y - 5, pageWidth - 30, 15, 'F');
    
    // Add colored left border
    doc.setFillColor(16, 185, 129); // Emerald-500
    doc.rect(15, y - 5, 3, 15, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105); // Emerald-600
    doc.setFontSize(14);
    doc.text(title, 22, y + 3);
    
    return y + 20;
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      // Validate analytics data
      console.log('Analytics data received:', analyticsData);
      
      const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Professional header with proper spacing (based on AgentPickups design)
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
        // Enhanced fallback design
        console.warn('Logo failed to load, using enhanced fallback:', error);
        doc.setFillColor(255, 255, 255);
        doc.circle(20, 17.5, 8, 'F');
        
        // Create modern trash/recycle icon
        doc.setFillColor(16, 185, 129);
        doc.setFontSize(8);
        doc.text('T2C', 17.5, 19);
      }
      
      // Company name and title with proper positioning
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('Trash2Cash', 35, 13);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Smart Waste Management Platform', 35, 19);
      doc.setFontSize(8);
      doc.text('No 23/A, Kandy Road, Malabe', 35, 24);
      doc.text('Email: info@trash2cash.lk | Phone: +94 11 234 5678', 35, 28);
      doc.setFontSize(10);
      doc.text('Analytics Report', 35, 32);
      
      // Date and report info in header
      doc.setFontSize(9);
      const currentDate = new Date();
      doc.text(`Generated: ${currentDate.toLocaleDateString()}`, pageWidth - 15, 12, { align: 'right' });
      doc.text(`Report #: ${Date.now().toString().slice(-6)}`, pageWidth - 15, 18, { align: 'right' });

      // Main content starts with proper margin after header
      let y = 50; // Clear space after header

      // Enhanced title section
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.text('Analytics Report', 20, y);
      
      // Add subtitle
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(75, 85, 99); // Gray-600
      doc.text('Personal Waste Collection Summary', 20, y + 8);

      // Decorative line
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(2);
      doc.line(20, y + 15, 100, y + 15);

      y += 25; // Move content down with proper spacing

      // SUMMARY with enhanced styling ----------------------------------------------------------------
      if (selectedContent.summary) {
        y = drawSectionHeader(doc, 'SUMMARY STATISTICS', y);
        
        // Create modern stats cards with proper spacing
        const stats = [
          {
            label: 'Total Weight Collected',
            value: `${analyticsData?.totalWeight || 150} kg`,
            icon: '[WEIGHT]',
            color: [34, 197, 94] // Green-500
          },
          {
            label: 'Total Earnings',
            value: `Rs. ${analyticsData?.totalEarnings || 3000}`,
            icon: '[MONEY]',
            color: [59, 130, 246] // Blue-500
          },
          {
            label: 'Waste Collections',
            value: `${analyticsData?.binCollections || 25} transactions`,
            icon: '[WASTE]',
            color: [168, 85, 247] // Purple-500
          },
          {
            label: 'Schedule Collections',
            value: `${analyticsData?.scheduleCollections || 15} transactions`,
            icon: '[SCHEDULE]',
            color: [245, 158, 11] // Amber-500
          },
        ];

        // Draw stats in a 2x2 grid layout with proper spacing
        const cardWidth = 85;
        const cardHeight = 30; // Reduced height
        const spacing = 8;
        let cardX = 20;
        let cardY = y;

        stats.forEach((stat, index) => {
          if (index === 2) {
            cardX = 20;
            cardY = y + cardHeight + spacing;
          } else if (index === 1 || index === 3) {
            cardX = 20 + cardWidth + spacing;
          }

          // Card background
          doc.setFillColor(255, 255, 255);
          doc.rect(cardX, cardY, cardWidth, cardHeight, 'F');
          
          // Colored top border
          doc.setFillColor(...stat.color);
          doc.rect(cardX, cardY, cardWidth, 3, 'F');
          
          // Card border
          doc.setDrawColor(229, 231, 235);
          doc.setLineWidth(0.5);
          doc.rect(cardX, cardY, cardWidth, cardHeight, 'D');

          // Label
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(107, 114, 128);
          doc.text(stat.label, cardX + 5, cardY + 8);
          
          // Value
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.setTextColor(31, 41, 55);
          doc.text(stat.value, cardX + 5, cardY + 22);
        });

        y = cardY + cardHeight + 20; // Proper spacing after cards
      }

      // RECENT ACTIVITY with proper spacing --------------------------------------------------------
      if (selectedContent.recentActivity) {
        y = ensurePageSpace(doc, y, 40);
        y = drawSectionHeader(doc, 'RECENT ACTIVITY', y);
        
        const activities = analyticsData?.recentActivity?.length > 0 ? 
          analyticsData.recentActivity.slice(0, 6) : [
            { action: 'Waste collected - Glass', amount: '2 kg / Rs. 40', type: 'collection' },
            { action: 'Schedule waste collected - Mixed', amount: '2 kg / Rs. 50', type: 'schedule' },
            { action: 'Waste collected - Glass', amount: '33 kg / Rs. 660', type: 'collection' },
            { action: 'Schedule collection - Plastic', amount: '5 kg / Rs. 75', type: 'schedule' },
            { action: 'Waste collected - Paper', amount: '8 kg / Rs. 96', type: 'collection' },
            { action: 'Regular collection - Metal', amount: '12 kg / Rs. 180', type: 'collection' }
          ];

        activities.forEach((activity, index) => {
          y = ensurePageSpace(doc, y, 12);
          
          // Activity item with better spacing
          const bgColor = index % 2 === 0 ? [249, 250, 251] : [255, 255, 255];
          doc.setFillColor(...bgColor);
          doc.rect(20, y - 3, pageWidth - 40, 10, 'F');
          
          // Left colored indicator
          const indicatorColor = activity.type === 'collection' ? [59, 130, 246] : [34, 197, 94];
          doc.setFillColor(...indicatorColor);
          doc.rect(20, y - 3, 3, 10, 'F');
          
          // Activity text with proper font sizing
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(31, 41, 55);
          const activityText = typeof activity === 'string' ? activity : 
            `${activity.action} — ${activity.amount}`;
          doc.text(activityText, 26, y + 2);
          
          y += 12;
        });
        y += 15;
      }

      // DETAILED TABLE with proper spacing ---------------------------------------------------------
      if (selectedContent.detailedTable) {
        y = ensurePageSpace(doc, y, 50);
        y = drawSectionHeader(doc, 'DETAILED COLLECTIONS', y);

        // Professional table header
        const tableWidth = pageWidth - 40;
        const colPositions = [25, 55, 80, 105, 130, 160]; // Better column spacing
        
        // Table header with professional styling
        doc.setFillColor(16, 185, 129);
        doc.rect(20, y, tableWidth, 12, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.text('Date', colPositions[0], y + 8);
        doc.text('Type', colPositions[1], y + 8);
        doc.text('Waste', colPositions[2], y + 8);
        doc.text('Weight', colPositions[3], y + 8);
        doc.text('Rate', colPositions[4], y + 8);
        doc.text('Total', colPositions[5], y + 8);
        
        y += 15;

        // Enhanced table data
        const tableData = analyticsData?.allCollections?.length > 0 ? 
          analyticsData.allCollections.slice(0, 15).map(collection => [
            collection.date ? collection.date.toLocaleDateString() : new Date().toLocaleDateString(),
            collection.type || 'Collection',
            collection.wasteType || 'Mixed',
            `${collection.weight || 0} kg`,
            `Rs. ${collection.pricePerKg || 0}`,
            `Rs. ${collection.totalPrice || 0}`
          ]) : [
            ['Oct 9, 2025', 'Collection', 'Glass', '2 kg', 'Rs. 20', 'Rs. 40'],
            ['Oct 9, 2025', 'Schedule', 'Mixed', '2 kg', 'Rs. 25', 'Rs. 50'],
            ['Oct 8, 2025', 'Collection', 'Glass', '33 kg', 'Rs. 20', 'Rs. 660'],
            ['Oct 7, 2025', 'Schedule', 'Plastic', '5 kg', 'Rs. 15', 'Rs. 75'],
            ['Oct 6, 2025', 'Collection', 'Paper', '8 kg', 'Rs. 12', 'Rs. 96'],
          ];

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(31, 41, 55);
        doc.setFontSize(8);

        tableData.forEach((row, index) => {
          y = ensurePageSpace(doc, y, 12);

          // Alternating row colors
          const rowColor = index % 2 === 0 ? [249, 250, 251] : [255, 255, 255];
          doc.setFillColor(...rowColor);
          doc.rect(20, y - 2, tableWidth, 10, 'F');

          // Row data with proper alignment
          row.forEach((cell, colIndex) => {
            if (colIndex < colPositions.length) {
              let text = cell.toString();
              if (text.length > 12) {
                text = text.substring(0, 10) + '..';
              }
              
              // Color coding for money values
              if (colIndex >= 4) {
                doc.setTextColor(5, 150, 105);
                doc.setFont('helvetica', 'bold');
              } else {
                doc.setTextColor(31, 41, 55);
                doc.setFont('helvetica', 'normal');
              }
              
              doc.text(text, colPositions[colIndex], y + 5);
            }
          });

          y += 12;
        });
        
        y += 15;
      }

      // ANALYTICS & INSIGHTS with proper spacing ----------------------------------------------
      if (selectedContent.charts) {
        y = ensurePageSpace(doc, y, 40);
        y = drawSectionHeader(doc, 'ANALYTICS & INSIGHTS', y);
        
        const insights = [
          { text: 'Weekly collection trends show consistent growth', highlight: 'growth' },
          { text: 'Glass recycling offers highest value per kilogram', highlight: 'highest value' },
          { text: 'Location-based optimization opportunities identified', highlight: 'optimization' },
          { text: 'Average processing efficiency: 85% target achieved', highlight: '85%' },
          { text: 'Top performing waste category: Glass materials', highlight: 'Glass materials' },
        ];

        // Render insights with proper spacing
        insights.forEach((insight) => {
          y = ensurePageSpace(doc, y, 10);
          
          // Insight item background
          doc.setFillColor(240, 253, 244);
          doc.rect(25, y - 3, pageWidth - 50, 8, 'F');
          
          // Left accent
          doc.setFillColor(34, 197, 94);
          doc.rect(25, y - 3, 2, 8, 'F');

          // Text
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(31, 41, 55);
          doc.text(`• ${insight.text}`, 30, y + 2);

          y += 10;
        });
        y += 10;
      }

      // Professional footer
      const footerY = pageHeight - 20;
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(1);
      doc.line(15, footerY - 5, pageWidth - 15, footerY - 5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Trash2Cash Waste Management System | Confidential Report', 15, footerY);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 15, footerY, { align: 'right' });

      // Save with proper filename
      const userName = analyticsData?.user?.name || 'User';
      const dateStr = new Date().toISOString().split('T')[0];
      doc.save(`Trash2Cash_Analytics_${userName.replace(/\s+/g, '_')}_${dateStr}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsGenerating(false);
      onClose?.();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Generate PDF Report</h3>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600 transition-colors" type="button">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-gray-600 mb-6 text-sm">Select which content to include in your analytics report:</p>

        <div className="space-y-3 mb-6">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedContent.summary}
              onChange={() => handleContentChange('summary')}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <span className="text-gray-700">Summary Statistics</span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedContent.recentActivity}
              onChange={() => handleContentChange('recentActivity')}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <span className="text-gray-700">Recent Activity</span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedContent.detailedTable}
              onChange={() => handleContentChange('detailedTable')}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <span className="text-gray-700">Detailed Collections Table</span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedContent.charts}
              onChange={() => handleContentChange('charts')}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <span className="text-gray-700">Analytics & Insights</span>
          </label>
        </div>

        <div className="flex space-x-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors" type="button">
            Cancel
          </button>
          <button
            onClick={generatePDF}
            type="button"
            disabled={!Object.values(selectedContent).some(Boolean) || isGenerating}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              'Generate PDF'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
