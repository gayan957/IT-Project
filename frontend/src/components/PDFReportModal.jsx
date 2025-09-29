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
    y = ensurePageSpace(doc, y, 30);
    
    // Modern section header with gradient-like effect
    doc.setFillColor(240, 253, 244); // Green-50
    doc.rect(15, y - 10, pageWidth - 30, 18, 'F');
    
    // Add colored left border
    doc.setFillColor(16, 185, 129); // Emerald-500
    doc.rect(15, y - 10, 4, 18, 'F');
    
    // Add subtle shadow effect
    doc.setFillColor(229, 231, 235); // Gray-200
    doc.rect(16, y + 9, pageWidth - 32, 1, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105); // Emerald-600
    doc.setFontSize(16);
    doc.text(title, 25, y - 2);
    
    // Add decorative icon based on section
    const getIcon = (title) => {
      if (title.includes('SUMMARY')) return '[STATS]';
      if (title.includes('ACTIVITY')) return '[ACTIVITY]';
      if (title.includes('DETAILED')) return '[DATA]';
      if (title.includes('ANALYTICS')) return '[INSIGHTS]';
      return '[INFO]';
    };
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(getIcon(title), pageWidth - 50, y - 2);
    
    return y + 25;
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      // Validate analytics data
      console.log('Analytics data received:', analyticsData);
      
      const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header background with modern gradient
      doc.setFillColor(16, 185, 129); // Emerald green
      doc.rect(0, 0, pageWidth, 45, 'F');
      
      // Add decorative accent strip
      doc.setFillColor(5, 150, 105); // Darker emerald
      doc.rect(0, 40, pageWidth, 5, 'F');

      // Company logo area with enhanced styling
      try {
        // Add white circular background with shadow effect for logo visibility
        doc.setFillColor(255, 255, 255);
        doc.circle(25, 22, 12, 'F');
        
        // Add subtle shadow effect
        doc.setFillColor(200, 200, 200);
        doc.circle(26, 23, 11, 'F');
        doc.setFillColor(255, 255, 255);
        doc.circle(25, 22, 11, 'F');
        
        // Add the Trash2Cash logo
        doc.addImage(logoPng, 'PNG', 18, 15, 14, 14);
      } catch (error) {
        // Enhanced fallback design
        console.warn('Logo failed to load, using enhanced fallback:', error);
        doc.setFillColor(255, 255, 255);
        doc.circle(25, 22, 12, 'F');
        
        // Create modern trash/recycle icon
        doc.setFillColor(16, 185, 129);
        // Recycle symbol
        doc.setLineWidth(2);
        doc.setDrawColor(16, 185, 129);
        // Draw recycling arrows in a circle
        const centerX = 25, centerY = 22, radius = 8;
        for (let i = 0; i < 3; i++) {
          const angle = (i * 120 * Math.PI) / 180;
          const startX = centerX + Math.cos(angle) * radius;
          const startY = centerY + Math.sin(angle) * radius;
          const endX = centerX + Math.cos(angle + Math.PI / 3) * radius;
          const endY = centerY + Math.sin(angle + Math.PI / 3) * radius;
          
          // Draw arrow shaft
          doc.line(startX, startY, endX, endY);
          // Draw arrowhead
          const headAngle = angle + Math.PI / 3;
          const headX1 = endX - 2 * Math.cos(headAngle - 0.5);
          const headY1 = endY - 2 * Math.sin(headAngle - 0.5);
          const headX2 = endX - 2 * Math.cos(headAngle + 0.5);
          const headY2 = endY - 2 * Math.sin(headAngle + 0.5);
          doc.line(endX, endY, headX1, headY1);
          doc.line(endX, endY, headX2, headY2);
        }
        
        // Add dollar sign in center
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(16, 185, 129);
        doc.text('$', 23, 25);
      }

      // Company name + tagline with enhanced typography
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.text('Trash2Cash', 45, 18);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text('Smart Waste Management Platform', 45, 26);
      doc.setFontSize(9);
      doc.text('Turning Waste into Value', 45, 32);

      // Enhanced title section with gradient effect simulation
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(28);
      doc.text('Analytics Report', 20, 65);
      
      // Add subtitle
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(14);
      doc.setTextColor(75, 85, 99); // Gray-600
      doc.text('Personal Waste Collection Summary', 20, 75);

      // Enhanced decorative elements
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(3);
      doc.line(20, 80, 100, 80);
      doc.setDrawColor(34, 197, 94); // Lighter green
      doc.setLineWidth(1);
      doc.line(20, 83, 80, 83);

      // Enhanced metadata section with modern styling
      const currentDate = new Date();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128); // Gray-500
      
      // Create info box with border
      doc.setFillColor(249, 250, 251); // Gray-50
      doc.setDrawColor(209, 213, 219); // Gray-300
      doc.setLineWidth(0.5);
      doc.rect(pageWidth - 85, 88, 75, 25, 'FD');
      
      doc.setTextColor(75, 85, 99); // Gray-600
      doc.text(
        `Generated: ${currentDate.toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}`,
        pageWidth - 82, 95
      );
      doc.text(`Time: ${currentDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })}`, pageWidth - 82, 102);
      doc.text(`Report #: ${Date.now().toString().slice(-6)}`, pageWidth - 82, 109);

      let y = 125;

      // SUMMARY with enhanced styling ----------------------------------------------------------------
      if (selectedContent.summary) {
        y = drawSectionHeader(doc, 'SUMMARY STATISTICS', y);
        
        // Create modern stats cards
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

        // Draw stats in a 2x2 grid layout
        const cardWidth = 85;
        const cardHeight = 35;
        const spacing = 10;
        let cardX = 20;
        let cardY = y;

        stats.forEach((stat, index) => {
          if (index === 2) {
            cardX = 20;
            cardY = y + cardHeight + spacing;
          } else if (index === 1 || index === 3) {
            cardX = 20 + cardWidth + spacing;
          }

          // Card background with gradient effect
          doc.setFillColor(255, 255, 255);
          doc.rect(cardX, cardY, cardWidth, cardHeight, 'F');
          
          // Colored top border
          doc.setFillColor(...stat.color);
          doc.rect(cardX, cardY, cardWidth, 3, 'F');
          
          // Card border
          doc.setDrawColor(229, 231, 235); // Gray-200
          doc.setLineWidth(0.5);
          doc.rect(cardX, cardY, cardWidth, cardHeight, 'D');

          // Label
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(107, 114, 128); // Gray-500
          doc.text(stat.label, cardX + 5, cardY + 8);
          
          // Icon
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(31, 41, 55);
          doc.text(stat.icon, cardX + 5, cardY + 18);

          // Value
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.setTextColor(31, 41, 55); // Gray-800
          doc.text(stat.value, cardX + 5, cardY + 28);
        });

        y = cardY + cardHeight + 15;
      }

      // RECENT ACTIVITY with modern list design --------------------------------------------------------
      if (selectedContent.recentActivity) {
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
          y = ensurePageSpace(doc, y, 18);
          
          // Activity item background
          const bgColor = index % 2 === 0 ? [249, 250, 251] : [255, 255, 255]; // Alternating gray-50/white
          doc.setFillColor(...bgColor);
          doc.rect(20, y - 8, pageWidth - 40, 15, 'F');
          
          // Left colored indicator
          const indicatorColor = activity.type === 'collection' ? [59, 130, 246] : [34, 197, 94]; // Blue or Green
          doc.setFillColor(...indicatorColor);
          doc.rect(20, y - 8, 3, 15, 'F');
          
          // Activity type icon
          const icon = activity.type === 'collection' ? '[COLLECT]' : '[SCHEDULE]';
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7);
          doc.setTextColor(31, 41, 55);
          doc.text(icon, 26, y);
          
          // Activity text
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(31, 41, 55); // Gray-800
          const activityText = typeof activity === 'string' ? activity : 
            `${activity.action} — ${activity.amount}`;
          doc.text(activityText, 55, y);
          
          y += 15;
        });
        y += 10;
      }

      // DETAILED TABLE ---------------------------------------------------------
      if (selectedContent.detailedTable) {
        y = drawSectionHeader(doc, 'DETAILED COLLECTIONS', y);

        // Enhanced table header with modern styling
        y = ensurePageSpace(doc, y, 22);
        const tableWidth = pageWidth - 40;
        const colPositions = [25, 50, 70, 90, 110, 130, 150, 170]; // 8 columns positions
        
        // Table header with gradient effect
        doc.setFillColor(16, 185, 129); // Emerald-500
        doc.rect(20, y - 5, tableWidth, 15, 'F');
        
        // Add darker top border for depth
        doc.setFillColor(5, 150, 105); // Emerald-600
        doc.rect(20, y - 5, tableWidth, 2, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.text('Date', colPositions[0], y + 4);
        doc.text('Type', colPositions[1], y + 4);
        doc.text('Waste', colPositions[2], y + 4);
        doc.text('Weight', colPositions[3], y + 4);
        doc.text('Rate', colPositions[4], y + 4);
        doc.text('Total', colPositions[5], y + 4);
        doc.text('Location', colPositions[6], y + 4);
        doc.text('Status', colPositions[7], y + 4);
        
        // Enhanced column separators
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(0.8);
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

          // Enhanced alternating row colors
          const rowColors = [
            [249, 250, 251], // Gray-50
            [255, 255, 255], // White
          ];
          doc.setFillColor(...rowColors[index % 2]);
          doc.rect(20, y - 3, tableWidth, 12, 'F');

          // Add subtle row separator
          doc.setDrawColor(229, 231, 235); // Gray-200
          doc.setLineWidth(0.3);
          doc.line(20, y + 9, 20 + tableWidth, y + 9);

          // Enhanced text rendering with better formatting
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(31, 41, 55); // Gray-800
          
          // Render each column with proper spacing and color coding
          row.forEach((cell, colIndex) => {
            if (colIndex < colPositions.length) {
              let text = cell.toString();
              let textColor = [31, 41, 55]; // Default gray-800
              
              // Truncate text if too long to prevent overlap
              if (text.length > 12) {
                text = text.substring(0, 10) + '...';
              }
              
              // Color coding for specific columns
              if (colIndex === 4 || colIndex === 5) { // Price columns
                textColor = [5, 150, 105]; // Emerald-600 for money values
                doc.setFont('helvetica', 'bold');
              } else if (colIndex === 7 && text.toLowerCase().includes('completed')) { // Status
                textColor = [34, 197, 94]; // Green-500 for completed status
                doc.setFont('helvetica', 'normal');
              } else if (colIndex === 2) { // Waste type
                textColor = [168, 85, 247]; // Purple-500 for waste types
                doc.setFont('helvetica', 'normal');
              } else {
                doc.setFont('helvetica', 'normal');
              }
              
              doc.setTextColor(...textColor);
              doc.text(text, colPositions[colIndex], y + 5);
              doc.setTextColor(31, 41, 55); // Reset to default
              doc.setFont('helvetica', 'normal'); // Reset font
            }
          });

          y += 14;
        });
        
        // Enhanced table summary with modern design
        if (analyticsData?.allCollections?.length > 0) {
          y += 10;
          y = ensurePageSpace(doc, y, 25);
          
          // Modern summary card design
          doc.setFillColor(240, 253, 244); // Green-50
          doc.setDrawColor(34, 197, 94); // Green-500
          doc.setLineWidth(1);
          doc.rect(20, y - 5, tableWidth, 20, 'FD');
          
          // Add green accent border
          doc.setFillColor(34, 197, 94);
          doc.rect(20, y - 5, 4, 20, 'F');
          
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(5, 150, 105); // Emerald-600
          doc.setFontSize(9);
          
          // Summary with text labels
          doc.text('SUMMARY:', 25, y + 8);
          doc.text(`${tableData.length} items`, 70, y + 8);
          doc.text(`${analyticsData?.totalWeight || 150} kg`, 110, y + 8);
          doc.text(`Rs. ${analyticsData?.totalEarnings || 3000}`, 150, y + 8);
          
          // Add performance indicator
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(107, 114, 128); // Gray-500
          doc.text(`Avg per collection: ${(analyticsData.totalWeight / (analyticsData.binCollections + analyticsData.scheduleCollections)).toFixed(1)} kg`, 25, y + 12);
          
          y += 20;
        }
        
        y += 5;
      }

      // ANALYTICS & INSIGHTS with modern design --------------------------------------------------------------
      if (selectedContent.charts) {
        y = drawSectionHeader(doc, 'ANALYTICS & INSIGHTS', y);
        
        // Generate enhanced dynamic insights
        const insights = [];
        const collections = analyticsData?.allCollections || [];
        const totalCollections = analyticsData?.binCollections + analyticsData?.scheduleCollections || 0;
        const avgWeight = totalCollections > 0 ? (analyticsData?.totalWeight / totalCollections).toFixed(1) : 0;
        
        if (collections.length > 0) {
          // Enhanced insights with icons and better formatting
          const wasteTypes = collections.reduce((acc, item) => {
            acc[item.wasteType] = (acc[item.wasteType] || 0) + 1;
            return acc;
          }, {});
          const mostCommonWaste = Object.keys(wasteTypes).reduce((a, b) => wasteTypes[a] > wasteTypes[b] ? a : b, 'Mixed');
          const collectionTypePercent = analyticsData?.binCollections ? 
            Math.round((analyticsData.binCollections / totalCollections) * 100) : 50;
          
          insights.push({
            icon: '[STATS]',
            text: `Total collections completed: ${totalCollections} transactions`,
            highlight: totalCollections.toString()
          });
          insights.push({
            icon: '[RECYCLE]',
            text: `Most collected waste type: ${mostCommonWaste} materials`,
            highlight: mostCommonWaste
          });
          insights.push({
            icon: '[WEIGHT]',
            text: `Average collection weight: ${avgWeight} kg per transaction`,
            highlight: `${avgWeight} kg`
          });
          insights.push({
            icon: '[TREND]',
            text: `Collection efficiency: ${collectionTypePercent}% regular collections`,
            highlight: `${collectionTypePercent}%`
          });
          insights.push({
            icon: '[ECO]',
            text: `Environmental impact: ${analyticsData?.totalWeight || 0} kg recycled`,
            highlight: `${analyticsData?.totalWeight || 0} kg`
          });
        } else {
          // Default insights with modern styling
          insights.push({ icon: '[TREND]', text: 'Weekly collection trends show growth potential', highlight: 'growth potential' });
          insights.push({ icon: '[VALUE]', text: 'Glass recycling offers highest value per kilogram', highlight: 'highest value' });
          insights.push({ icon: '[LOCATION]', text: 'Location-based optimization opportunities identified', highlight: 'optimization' });
          insights.push({ icon: '[EFFICIENT]', text: 'Average processing efficiency: 6 kg per collection', highlight: '6 kg' });
          insights.push({ icon: '[TOP]', text: 'Top performing waste category: Glass materials', highlight: 'Glass materials' });
        }

        // Render insights with modern card design
        insights.forEach((insight, index) => {
          y = ensurePageSpace(doc, y, 16);
          
          // Insight card background
          const cardColors = [
            [239, 246, 255], // Blue-50
            [240, 253, 244], // Green-50
            [252, 231, 243], // Pink-50
            [254, 249, 195], // Yellow-50
            [237, 233, 254], // Indigo-50
          ];
          
          doc.setFillColor(...cardColors[index % cardColors.length]);
          doc.rect(25, y - 8, pageWidth - 50, 14, 'F');
          
          // Left accent border
          const accentColors = [
            [59, 130, 246],   // Blue-500
            [34, 197, 94],    // Green-500
            [236, 72, 153],   // Pink-500
            [245, 158, 11],   // Amber-500
            [139, 92, 246],   // Violet-500
          ];
          doc.setFillColor(...accentColors[index % accentColors.length]);
          doc.rect(25, y - 8, 3, 14, 'F');

          // Icon
          doc.setFontSize(7);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(31, 41, 55);
          doc.text(insight.icon, 30, y + 1);

          // Main text
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(31, 41, 55); // Gray-800
          doc.text(insight.text, 42, y + 1);

          y += 14;
        });
        y += 10;
      }

      // Enhanced FOOTER with modern design
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Footer background
      doc.setFillColor(249, 250, 251); // Gray-50
      doc.rect(0, pageHeight - 30, pageWidth, 30, 'F');
      
      // Decorative top border
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(2);
      doc.line(15, pageHeight - 28, pageWidth - 15, pageHeight - 28);
      
      // Add small accent line
      doc.setDrawColor(34, 197, 94);
      doc.setLineWidth(1);
      doc.line(15, pageHeight - 26, pageWidth - 15, pageHeight - 26);
      
      // Company info and contact
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(16, 185, 129);
      doc.text('Trash2Cash', 20, pageHeight - 18);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128); // Gray-500
      doc.text('Smart Waste Management Platform', 20, pageHeight - 13);
      doc.text('Email: support@trash2cash.lk | Web: www.trash2cash.lk', 20, pageHeight - 8);
      
      // Generation info
      doc.text(`Generated: ${new Date().toLocaleDateString('en-US')} | Automated Report`, pageWidth - 20, pageHeight - 13, { align: 'right' });
      doc.text(`Confidential Document | For ${analyticsData?.user || 'User'} Only`, pageWidth - 20, pageHeight - 8, { align: 'right' });

      // Save with enhanced filename
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
