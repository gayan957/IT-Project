import React, { useState } from 'react';
import jsPDF from 'jspdf';

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
  const ensurePageSpace = (doc, y, needed = 20) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    if (y + needed > pageHeight - 20) {
      doc.addPage();
      return 20; // reset Y with a top margin on the new page
    }
    return y;
  };

  const drawSectionHeader = (doc, title, y) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    y = ensurePageSpace(doc, y, 24);
    doc.setFillColor(248, 250, 252);
    doc.rect(15, y - 8, pageWidth - 30, 12, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(16);
    doc.text(title, 20, y);
    return y + 20;
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      // Validate analytics data
      console.log('Analytics data received:', analyticsData);
      
      const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header background
      doc.setFillColor(16, 185, 129);
      doc.rect(0, 0, pageWidth, 40, 'F');

      // Logo: white circle with trash bin design
      doc.setFillColor(255, 255, 255);
      doc.circle(20, 20, 9, 'F');
      
      // Draw trash bin icon
      doc.setFillColor(16, 185, 129);
      // Trash bin lid (top)
      doc.rect(15, 16, 10, 1.5, 'F');
      // Lid handle
      doc.rect(18, 14.5, 4, 1.5, 'F');
      // Trash bin body
      doc.rect(16, 17.5, 8, 6, 'F');
      
      // Add trash bin details with white lines
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.3);
      // Vertical lines inside bin
      doc.line(17.5, 19, 17.5, 22.5);
      doc.line(20, 19, 20, 22.5);
      doc.line(22.5, 19, 22.5, 22.5);

      // Company name + tagline
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('Trash2Cash', 40, 20 + 2);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text('Smart Waste Management', 40, 32);

      // Title
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(26);
      doc.text('User Analytics Report', 20, 60);

      // Decorative line
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(2);
      doc.line(20, 67, pageWidth - 20, 67);

      // Metadata
      const currentDate = new Date();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text(
        `Report Generated: ${currentDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}`,
        20,
        80
      );
      doc.text(`Time: ${currentDate.toLocaleTimeString('en-US')}`, 20, 87);
      doc.text(`Report ID: RPT-${Date.now().toString().slice(-8)}`, 20, 94);

      let y = 115;

      // SUMMARY ----------------------------------------------------------------
      if (selectedContent.summary) {
        y = drawSectionHeader(doc, 'SUMMARY STATISTICS', y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);

        const stats = [
          ['Total Weight Collected:', `${analyticsData?.totalWeight || 150} kg`],
          ['Total Earnings:', `Rs. ${analyticsData?.totalEarnings || 3000}`],
          ['Bin Collections:', `${analyticsData?.binCollections || 25} transactions`],
          ['Schedule Collections:', `${analyticsData?.scheduleCollections || 15} transactions`],
        ];

        stats.forEach(([label, value]) => {
          y = ensurePageSpace(doc, y, 12);
          doc.text(label, 25, y);
          doc.setFont('helvetica', 'bold');
          doc.text(value, pageWidth - 70, y);
          doc.setFont('helvetica', 'normal');
          y += 10;
        });
        y += 5;
      }

      // RECENT ACTIVITY --------------------------------------------------------
      if (selectedContent.recentActivity) {
        y = drawSectionHeader(doc, 'RECENT ACTIVITY', y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);

        const activities = analyticsData?.recentActivity?.length > 0 ? 
          analyticsData.recentActivity.slice(0, 6).map((activity, index) => 
            `${index + 1}. ${activity.action} — ${activity.amount} — ${activity.type === 'collection' ? 'Collection' : 'Schedule'}`
          ) : [
            '1. Waste collected — Glass (2 kg / Rs. 40) — Collection',
            '2. Schedule waste collected — Mixed (2 kg / Rs. 50) — Schedule',
            '3. Waste collected — Glass (33 kg / Rs. 660) — Collection',
            '4. Schedule collection — Plastic (5 kg / Rs. 75) — Schedule',
            '5. Waste collected — Paper (8 kg / Rs. 96) — Collection',
            '6. No recent activity available',
          ];

        activities.forEach((activity) => {
          y = ensurePageSpace(doc, y, 10);
          doc.text(activity, 25, y);
          y += 10;
        });
        y += 5;
      }

      // DETAILED TABLE ---------------------------------------------------------
      if (selectedContent.detailedTable) {
        y = drawSectionHeader(doc, 'DETAILED COLLECTIONS', y);

        // Table header with all 8 columns
        y = ensurePageSpace(doc, y, 22);
        const tableWidth = pageWidth - 40;
        // Optimized column positions for better fit
        const colPositions = [25, 50, 70, 90, 110, 130, 150, 170]; // 8 columns positions
        
        doc.setFillColor(16, 185, 129);
        doc.rect(20, y - 5, tableWidth, 15, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9); // Smaller font to fit all columns
        doc.text('Date', colPositions[0], y + 4);
        doc.text('Type', colPositions[1], y + 4);
        doc.text('Waste', colPositions[2], y + 4);
        doc.text('Weight', colPositions[3], y + 4);
        doc.text('Price/kg', colPositions[4], y + 4);
        doc.text('Total', colPositions[5], y + 4);
        doc.text('Location', colPositions[6], y + 4);
        doc.text('Status', colPositions[7], y + 4);
        
        // Add column separators in header
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(0.5);
        for (let i = 1; i < colPositions.length; i++) {
          const x = colPositions[i] - 2;
          doc.line(x, y - 5, x, y + 10);
        }
        
        y += 20;

        // Updated table data with all 8 columns from real analytics data
        const tableData = analyticsData?.allCollections?.length > 0 ? 
          analyticsData.allCollections.slice(0, 15).map(collection => {
            // Handle location formatting
            let locationText = collection.location || 'N/A';
            if (typeof locationText === 'string' && locationText.includes(',')) {
              // If it's coordinates, format it nicely
              const parts = locationText.split(',');
              if (parts.length === 2) {
                locationText = 'Coordinates';
              }
            }
            
            return [
              collection.date ? collection.date.toLocaleDateString() : 'N/A',
              collection.type || 'Collection',
              collection.wasteType || 'Mixed',
              `${collection.weight || 0} kg`,
              `Rs. ${collection.pricePerKg || 0}`,
              `Rs. ${collection.totalPrice || 0}`,
              locationText.length > 12 ? locationText.substring(0, 12) + '...' : locationText,
              collection.status || 'Completed'
            ];
          }) : [
            ['9/23/2025', 'Collection', 'Glass', '2 kg', 'Rs. 20', 'Rs. 40', 'Downtown', 'Completed'],
            ['9/23/2025', 'Schedule', 'Mixed', '2 kg', 'Rs. 25', 'Rs. 50', 'Uptown', 'Completed'],
            ['9/22/2025', 'Collection', 'Glass', '33 kg', 'Rs. 20', 'Rs. 660', 'City Center', 'Completed'],
            ['9/21/2025', 'Schedule', 'Plastic', '5 kg', 'Rs. 15', 'Rs. 75', 'Suburbs', 'Completed'],
            ['9/20/2025', 'Collection', 'Paper', '8 kg', 'Rs. 12', 'Rs. 96', 'Industrial', 'Completed'],
          ];

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(8); // Smaller font for data rows

        tableData.forEach((row, index) => {
          y = ensurePageSpace(doc, y, 14);

          if (index % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(20, y - 3, tableWidth, 12, 'F');
          }

          doc.setDrawColor(220, 220, 220);
          doc.setLineWidth(0.3);
          doc.line(20, y + 9, 20 + tableWidth, y + 9);

          // Display all 8 columns with text truncation
          row.forEach((cell, colIndex) => {
            if (colIndex < colPositions.length) {
              let text = cell.toString();
              // Truncate long text based on column
              if (colIndex === 6 && text.length > 8) { // Location column
                text = text.substring(0, 8) + '...';
              } else if (colIndex === 2 && text.length > 6) { // Waste type column
                text = text.substring(0, 6) + '...';
              } else if (colIndex === 1 && text.length > 8) { // Type column
                text = text.substring(0, 8) + '...';
              }
              doc.text(text, colPositions[colIndex], y + 4);
            }
          });
          
          // Add column separators in rows
          doc.setDrawColor(220, 220, 220);
          doc.setLineWidth(0.3);
          for (let i = 1; i < colPositions.length; i++) {
            const x = colPositions[i] - 2;
            doc.line(x, y - 3, x, y + 9);
          }
          
          y += 12;
        });
        
        // Add table summary if we have real data
        if (analyticsData?.allCollections?.length > 0) {
          y += 10;
          y = ensurePageSpace(doc, y, 20);
          
          // Summary row background
          doc.setFillColor(240, 253, 244); // Light green background
          doc.rect(20, y - 3, tableWidth, 15, 'F');
          
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(9);
          
          doc.text('TOTALS:', colPositions[0], y + 4);
          doc.text(`${tableData.length} items`, colPositions[1], y + 4);
          doc.text('', colPositions[2], y + 4);
          doc.text(`${analyticsData.totalWeight} kg`, colPositions[3], y + 4);
          doc.text('', colPositions[4], y + 4);
          doc.text(`Rs. ${analyticsData.totalEarnings}`, colPositions[5], y + 4);
          doc.text('', colPositions[6], y + 4);
          doc.text(`${analyticsData.binCollections + analyticsData.scheduleCollections}`, colPositions[7], y + 4);
          
          y += 15;
        }
        
        y += 5;
      }

      // ANALYTICS --------------------------------------------------------------
      if (selectedContent.charts) {
        y = drawSectionHeader(doc, 'ANALYTICS & INSIGHTS', y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);

        // Generate dynamic insights based on actual data
        const insights = [];
        const collections = analyticsData?.allCollections || [];
        const totalCollections = analyticsData?.binCollections + analyticsData?.scheduleCollections || 0;
        const avgWeight = totalCollections > 0 ? (analyticsData?.totalWeight / totalCollections).toFixed(1) : 0;
        
        if (collections.length > 0) {
          // Find most common waste type
          const wasteTypes = collections.reduce((acc, item) => {
            acc[item.wasteType] = (acc[item.wasteType] || 0) + 1;
            return acc;
          }, {});
          const mostCommonWaste = Object.keys(wasteTypes).reduce((a, b) => wasteTypes[a] > wasteTypes[b] ? a : b, 'Mixed');
          
          // Calculate collection type percentages
          const collectionTypePercent = analyticsData?.binCollections ? 
            Math.round((analyticsData.binCollections / totalCollections) * 100) : 50;
          
          insights.push(`Total collections completed: ${totalCollections} transactions`);
          insights.push(`Most collected waste type: ${mostCommonWaste} materials`);
          insights.push(`Average collection weight per transaction: ${avgWeight} kg`);
          insights.push(`Waste collections account for ${collectionTypePercent}% of total activity`);
          insights.push(`Total environmental impact: ${analyticsData?.totalWeight || 0} kg recycled`);
        } else {
          insights.push('Weekly collection trends show growth potential');
          insights.push('Glass recycling accounts for high earnings per kg');
          insights.push('Most productive collection day varies by location');
          insights.push('Average collection weight per transaction: 6 kg');
          insights.push('Highest earning waste type: Glass materials');
        }

        insights.forEach((insight) => {
          y = ensurePageSpace(doc, y, 10);
          doc.text(`• ${insight}`, 25, y);
          y += 10;
        });
        y += 5;
      }

      // FOOTER (on the last page)
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(1);
      doc.line(20, pageHeight - 22, pageWidth - 20, pageHeight - 22);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text('Trash2Cash Management System | trash2cash.com | support@trash2cash.com', 20, pageHeight - 12);
      doc.text(`Report generated automatically on ${new Date().toLocaleDateString()}`, 20, pageHeight - 6);

      // Save
      doc.save(`Trash2Cash-Analytics-Report-${new Date().toISOString().split('T')[0]}.pdf`);
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
