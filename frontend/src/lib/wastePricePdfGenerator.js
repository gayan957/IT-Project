import jsPDF from 'jspdf';
import { formatWasteTypeName } from '../lib/wastePriceApi.js';

// PDF generator function for waste price report
export async function generateWastePriceReportPdf(wastePrices) {
  try {
    console.log('Starting waste price report PDF generation...');
    
    if (typeof jsPDF === 'undefined') {
      throw new Error('jsPDF library is not loaded');
    }

    if (!wastePrices || wastePrices.length === 0) {
      throw new Error('No waste price data provided');
    }

    // Create PDF document
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Helper function to ensure page space
    const ensurePageSpace = (y, needed = 20) => {
      if (y + needed > pageHeight - 20) {
        doc.addPage();
        return 20;
      }
      return y;
    };

    // Helper function for currency formatting
    const formatCurrency = (amount) => {
      return `Rs. ${Number(amount || 0).toFixed(2)}`;
    };

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    };

    // Header with company info
    doc.setFillColor(25, 46, 94); // Professional dark blue
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Company logo area (simulated)
    doc.setFillColor(255, 255, 255);
    doc.circle(25, 20, 8, 'F');
    doc.setFillColor(25, 46, 94);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('T2C', 25, 22, { align: 'center' });
    
    // Company name and tagline
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.text('TRASH2CASH', 40, 18);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text('Waste Management Solutions', 40, 26);
    doc.setFontSize(9);
    doc.text('Smart • Sustainable • Profitable', 40, 32);
    
    // Document title and info (right side)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('WASTE PRICE REPORT', pageWidth - 20, 18, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Generated: ${formatDate(new Date())}`, pageWidth - 20, 25, { align: 'right' });
    doc.text(`Total Types: ${wastePrices.length}`, pageWidth - 20, 31, { align: 'right' });

    let y = 55;

    // Report Summary Section
    doc.setTextColor(25, 46, 94);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('REPORT SUMMARY', 20, y);
    
    doc.setDrawColor(25, 46, 94);
    doc.setLineWidth(1);
    doc.line(20, y + 4, pageWidth - 20, y + 4);
    
    y += 15;
    
    // Summary statistics
    const activePrices = wastePrices.filter(p => p.isActive !== false);
    const totalValue = wastePrices.reduce((sum, p) => sum + (p.pricePerKg || 0), 0);
    const avgPrice = totalValue / wastePrices.length;
    
    doc.setFillColor(248, 249, 252);
    doc.rect(20, y - 5, pageWidth - 40, 35, 'F');
    
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    
    const col1 = 30;
    const col2 = pageWidth / 2;
    const col3 = pageWidth - 80;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Active Price Types:', col1, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(`${activePrices.length} of ${wastePrices.length}`, col1, y + 12);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Average Price:', col2, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(formatCurrency(avgPrice), col2, y + 12);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Report Status:', col3, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.text('Complete', col3, y + 12);
    
    y += 45;
    y = ensurePageSpace(y, 60);

    // Detailed Waste Prices Section
    doc.setTextColor(25, 46, 94);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('DETAILED WASTE PRICES', 20, y);
    
    doc.setDrawColor(25, 46, 94);
    doc.setLineWidth(1);
    doc.line(20, y + 4, pageWidth - 20, y + 4);
    
    y += 15;

    // Sort waste prices for consistent display
    const sortedPrices = [...wastePrices].sort((a, b) => a.wasteType.localeCompare(b.wasteType));
    
    // Table header
    doc.setFillColor(25, 46, 94);
    doc.rect(20, y - 3, pageWidth - 40, 12, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    
    doc.text('Waste Type', 25, y + 4);
    doc.text('Price/kg', 80, y + 4);
    doc.text('Status', 120, y + 4);
    doc.text('Last Updated', 145, y + 4);
    
    y += 15;
    
    // Table rows
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    sortedPrices.forEach((price, index) => {
      y = ensurePageSpace(y, 15);
      
      // Alternating row colors
      if (index % 2 === 0) {
        doc.setFillColor(248, 249, 252);
        doc.rect(20, y - 3, pageWidth - 40, 12, 'F');
      }
      
      // Waste type with formatting
      doc.setFont('helvetica', 'bold');
      doc.text(formatWasteTypeName(price.wasteType), 25, y + 4);
      
      // Price with color coding
      doc.setFont('helvetica', 'normal');
      if (price.pricePerKg > 20) {
        doc.setTextColor(16, 185, 129); // Green for high prices
      } else if (price.pricePerKg > 10) {
        doc.setTextColor(59, 130, 246); // Blue for medium prices
      } else {
        doc.setTextColor(51, 65, 85); // Gray for low prices
      }
      doc.text(formatCurrency(price.pricePerKg), 80, y + 4);
      
      // Status
      doc.setTextColor(price.isActive === false ? 239 : 16, price.isActive === false ? 68 : 185, price.isActive === false ? 68 : 129);
      doc.text(price.isActive === false ? 'Inactive' : 'Active', 120, y + 4);
      
      // Last updated
      doc.setTextColor(107, 114, 128);
      doc.text(formatDate(price.updatedAt || new Date()), 145, y + 4);
      
      // Updated by (if available)
      if (price.updatedBy && price.updatedBy.name) {
        doc.setFontSize(7);
        doc.text(`by ${price.updatedBy.name}`, 145, y + 8);
        doc.setFontSize(9);
      }
      
      doc.setTextColor(51, 65, 85); // Reset color
      y += 15;
    });

    y += 10;
    y = ensurePageSpace(y, 40);

    // Price Categories Section
    doc.setTextColor(25, 46, 94);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('PRICE CATEGORIES', 20, y);
    
    doc.setDrawColor(25, 46, 94);
    doc.setLineWidth(1);
    doc.line(20, y + 4, pageWidth - 20, y + 4);
    
    y += 15;
    
    // Categorize prices
    const highValue = sortedPrices.filter(p => p.pricePerKg > 20);
    const mediumValue = sortedPrices.filter(p => p.pricePerKg >= 10 && p.pricePerKg <= 20);
    const lowValue = sortedPrices.filter(p => p.pricePerKg < 10);
    
    // Three column layout for categories
    const catCol1 = 25;
    const catCol2 = 85;
    const catCol3 = 145;
    
    // High Value Category
    doc.setFillColor(240, 253, 244);
    doc.rect(catCol1 - 3, y - 3, 55, 35, 'F');
    
    doc.setTextColor(16, 185, 129);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('HIGH VALUE', catCol1, y + 3);
    doc.text('(> Rs. 20/kg)', catCol1, y + 9);
    
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    highValue.forEach((item, i) => {
      doc.text(`• ${formatWasteTypeName(item.wasteType)}`, catCol1, y + 17 + (i * 4));
    });
    
    // Medium Value Category
    doc.setFillColor(250, 252, 255);
    doc.rect(catCol2 - 3, y - 3, 55, 35, 'F');
    
    doc.setTextColor(59, 130, 246);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('MEDIUM VALUE', catCol2, y + 3);
    doc.text('(Rs. 10-20/kg)', catCol2, y + 9);
    
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    mediumValue.forEach((item, i) => {
      doc.text(`• ${formatWasteTypeName(item.wasteType)}`, catCol2, y + 17 + (i * 4));
    });
    
    // Low Value Category
    doc.setFillColor(254, 242, 242);
    doc.rect(catCol3 - 3, y - 3, 55, 35, 'F');
    
    doc.setTextColor(239, 68, 68);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('LOW VALUE', catCol3, y + 3);
    doc.text('(< Rs. 10/kg)', catCol3, y + 9);
    
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    lowValue.forEach((item, i) => {
      doc.text(`• ${formatWasteTypeName(item.wasteType)}`, catCol3, y + 17 + (i * 4));
    });

    y += 45;

    // Professional Footer
    y = pageHeight - 35;
    
    // Company contact bar
    doc.setFillColor(248, 250, 252);
    doc.rect(0, y - 5, pageWidth, 15, 'F');
    
    doc.setDrawColor(25, 46, 94);
    doc.setLineWidth(0.5);
    doc.line(0, y - 5, pageWidth, y - 5);
    doc.line(0, y + 10, pageWidth, y + 10);
    
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('TRASH2CASH | Waste Management Solutions | admin@trash2cash.com | +94 11 234 5678', pageWidth / 2, y + 2, { align: 'center' });
    
    y += 20;
    
    // Professional disclaimer
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('This report is computer-generated and contains current waste pricing information.', pageWidth / 2, y, { align: 'center' });
    doc.text('For pricing inquiries, please contact the administration department.', pageWidth / 2, y + 6, { align: 'center' });
    doc.text(`Report ID: WPR-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Date.now().toString().slice(-4)}`, pageWidth / 2, y + 12, { align: 'center' });

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD format
    const filename = `WastePriceReport_${timestamp}.pdf`;
    
    console.log('Saving PDF with filename:', filename);
    
    // Download the PDF
    doc.save(filename);
    
    console.log('PDF download initiated successfully');
    return true;
  } catch (error) {
    console.error('Detailed PDF generation error:', error);
    console.error('Error stack:', error.stack);
    throw new Error(`PDF generation failed: ${error.message}`);
  }
}