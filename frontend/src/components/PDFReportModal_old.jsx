import { useState } from 'react';
import jsPDF from 'jspdf';

export default function PDFReportModal({ isOpen, onClose }) {
  const [selectedContent, setSelectedContent] = useState({
    summary: true,
    recentActivity: true,
    detailedTable: true,
    charts: true
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleContentChange = (contentType) => {
    setSelectedContent(prev => ({
      ...prev,
      [contentType]: !prev[contentType]
    }));
  };

    const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      // Create new PDF document
      const doc = new jsPDF();
      
      // Company Header with Logo placeholder
      doc.setFillColor(88, 28, 135); // Purple color
      doc.rect(0, 0, 210, 35, 'F'); // Header background
      
      // Company name
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont(undefined, 'bold');
      doc.text('EcoWaste Management', 20, 20);
      
      // Company tagline
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text('Smart Waste Collection & Analytics Platform', 20, 28);
      
      // Report title section
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(28);
      doc.setFont(undefined, 'bold');
      doc.text('User Analytics Report', 20, 55);
      
      // Decorative line
      doc.setDrawColor(88, 28, 135);
      doc.setLineWidth(2);
      doc.line(20, 62, 190, 62);
      
      // Report metadata section
      const currentDate = new Date();
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(60, 60, 60);
      
      doc.text(`Report Generated: ${currentDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`, 20, 75);
      doc.text(`Time: ${currentDate.toLocaleTimeString('en-US')}`, 20, 82);
      doc.text(`Report ID: RPT-${Date.now().toString().slice(-8)}`, 20, 89);
      
      let yPosition = 110;
    
    // Add selected content
    if (selectedContent.summary) {
      doc.setFontSize(16);
      doc.text('Summary Statistics', 20, yPosition);
      yPosition += 15;
      
      doc.setFontSize(12);
      doc.text('• Total Weight Collected: 150 kg', 30, yPosition);
      yPosition += 10;
      doc.text('• Total Earnings: Rs. 3,000', 30, yPosition);
      yPosition += 10;
      doc.text('• Bin Collections: 25', 30, yPosition);
      yPosition += 10;
      doc.text('• Schedule Collections: 15', 30, yPosition);
      yPosition += 20;
    }
    
    if (selectedContent.recentActivity) {
      doc.setFontSize(16);
      doc.text('Recent Activity', 20, yPosition);
      yPosition += 15;
      
      doc.setFontSize(12);
      doc.text('• Waste collected - glass (2 kg / Rs. 40)', 30, yPosition);
      yPosition += 10;
      doc.text('• Schedule waste collected - mixed (2 kg / Rs. 50)', 30, yPosition);
      yPosition += 10;
      doc.text('• Waste collected - glass (33 kg / Rs. 660)', 30, yPosition);
      yPosition += 20;
    }
    
    if (selectedContent.detailedTable) {
      doc.setFontSize(16);
      doc.text('Detailed Collections', 20, yPosition);
      yPosition += 15;
      
      doc.setFontSize(10);
      doc.text('Date | Type | Weight | Earnings | Status', 30, yPosition);
      yPosition += 10;
      doc.text('9/23/2025 | Glass | 2 kg | Rs. 40 | Collection', 30, yPosition);
      yPosition += 8;
      doc.text('9/23/2025 | Mixed | 2 kg | Rs. 50 | Schedule', 30, yPosition);
      yPosition += 8;
      doc.text('9/22/2025 | Glass | 33 kg | Rs. 660 | Collection', 30, yPosition);
      yPosition += 20;
    }
    
    if (selectedContent.charts) {
      doc.setFontSize(16);
      doc.text('Charts & Analysis', 20, yPosition);
      yPosition += 15;
      
      doc.setFontSize(12);
      doc.text('• Weekly collection trends show 15% increase', 30, yPosition);
      yPosition += 10;
      doc.text('• Glass recycling accounts for 60% of earnings', 30, yPosition);
      yPosition += 10;
      doc.text('• Most productive collection day: Wednesday', 30, yPosition);
    }
    
    // Save the PDF
    doc.save('analytics-report.pdf');
    setIsGenerating(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Generate PDF Report</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-gray-600 mb-6 text-sm">
          Select which content to include in your analytics report:
        </p>

        <div className="space-y-3 mb-6">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedContent.summary}
              onChange={() => handleContentChange('summary')}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <span className="text-gray-700">Summary Statistics</span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedContent.recentActivity}
              onChange={() => handleContentChange('recentActivity')}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <span className="text-gray-700">Recent Activity</span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedContent.detailedTable}
              onChange={() => handleContentChange('detailedTable')}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <span className="text-gray-700">Detailed Collections Table</span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedContent.charts}
              onChange={() => handleContentChange('charts')}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <span className="text-gray-700">Charts & Graphs</span>
          </label>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={generatePDF}
            disabled={!Object.values(selectedContent).some(Boolean) || isGenerating}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
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