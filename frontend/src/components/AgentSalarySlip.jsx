import { forwardRef } from 'react';
import jsPDF from 'jspdf';

// PDF generator function - Direct jsPDF approach (avoiding html2canvas oklch issues)
export async function downloadPaySlipPdf({ slip }) {
  try {
    console.log('Starting direct PDF generation...');
    console.log('Slip data:', slip);
    
    if (typeof jsPDF === 'undefined') {
      throw new Error('jsPDF library is not loaded');
    }

    if (!slip) {
      throw new Error('Salary data not provided');
    }

    // Create PDF document
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Safe data extraction with defaults - matching AgentSalaryInquiry structure
    const {
      employee = {},
      attendance = {},
      salary = { allowances: {}, perks: {}, deductions: {} },
      totals = {},
      createdAt
    } = slip;

    const safeEmployee = {
      name: employee.name || 'N/A',
      agentId: employee.agentId || 'N/A',
      epfNo: employee.epfNo || 'N/A',
      email: employee.email || 'N/A'
    };

    const safeAttendance = {
      month: attendance.month || 'N/A',
      workingDays: attendance.workingDays || 0,
      overtimeHours: attendance.overtimeHours || 0,
      noPayDays: attendance.noPayDays || 0
    };

    const safeSalary = {
      basic: salary.basic || 0,
      allowances: {
        food: salary.allowances?.food || 0,
        medical: salary.allowances?.medical || 0,
        cola: salary.allowances?.cola || 0
      },
      perks: {
        overtime: salary.perks?.overtime || 0,
        bonus: salary.perks?.bonus || 0
      },
      deductions: {
        noPay: salary.deductions?.noPay || 0,
        epf: salary.deductions?.epf || 0,
        etf: salary.deductions?.etf || 0,
        loans: salary.deductions?.loans || 0
      }
    };

    const safeTotals = {
      totalAllowances: totals.totalAllowances || 0,
      grossSalary: totals.grossSalary || 0,
      totalDeductions: totals.totalDeductions || 0,
      netSalary: totals.netSalary || 0
    };



    // Helper function for currency formatting
    const formatCurrency = (amount) => {
      return `Rs. ${Number(amount || 0).toLocaleString('en-LK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;
    };

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    };

    // Compact single-page layout
    let y = 20;
    
    // Compact Header with company branding
    doc.setFillColor(25, 46, 94);
    doc.rect(0, 0, pageWidth, 30, 'F');
    
    // Company logo area
    doc.setFillColor(255, 255, 255);
    doc.circle(20, 15, 6, 'F');
    doc.setFillColor(25, 46, 94);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.text('T2C', 20, 16.5, { align: 'center' });
    
    // Company name
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('TRASH2CASH', 30, 12);
    doc.setFontSize(8);
    doc.text('Waste Management Solutions', 30, 19);
    doc.setFontSize(7);
    doc.text('Smart • Sustainable • Profitable', 30, 24);
    
    // Document title (right side)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('PAYROLL STATEMENT', pageWidth - 15, 12, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`${safeAttendance.month} | ${formatDate(createdAt || new Date())}`, pageWidth - 15, 19, { align: 'right' });

    y = 40;

    // Compact Employee Information
    doc.setFillColor(248, 249, 252);
    doc.rect(15, y, pageWidth - 30, 25, 'F');
    doc.setDrawColor(25, 46, 94);
    doc.setLineWidth(0.5);
    doc.rect(15, y, pageWidth - 30, 25, 'S');
    
    doc.setTextColor(25, 46, 94);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('EMPLOYEE DETAILS', 20, y + 6);
    
    // Four columns for employee info
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    
    const emp1 = 20, emp2 = 65, emp3 = 110, emp4 = 155;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Name:', emp1, y + 12);
    doc.text('ID:', emp2, y + 12);
    doc.text('EPF:', emp3, y + 12);
    doc.text('Email:', emp4, y + 12);
    
    doc.setFont('helvetica', 'normal');
    doc.text(safeEmployee.name, emp1, y + 17);
    doc.text(safeEmployee.agentId, emp2, y + 17);
    doc.text(safeEmployee.epfNo, emp3, y + 17);
    doc.text(safeEmployee.email, emp4, y + 17);

    y += 35;

    // Compact Attendance
    doc.setFillColor(250, 252, 255);
    doc.rect(15, y, pageWidth - 30, 20, 'F');
    doc.setDrawColor(25, 46, 94);
    doc.rect(15, y, pageWidth - 30, 20, 'S');
    
    doc.setTextColor(25, 46, 94);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('ATTENDANCE', 20, y + 6);
    
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    
    const att1 = 70, att2 = 120, att3 = 170;
    doc.setFont('helvetica', 'bold');
    doc.text('Working Days:', att1, y + 10);
    doc.text('Overtime Hrs:', att2, y + 10);
    doc.text('Absent Days:', att3, y + 10);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(16, 185, 129);
    doc.text(safeAttendance.workingDays.toString(), att1, y + 15);
    doc.text(safeAttendance.overtimeHours.toString(), att2, y + 15);
    doc.setTextColor(239, 68, 68);
    doc.text(safeAttendance.noPayDays.toString(), att3, y + 15);

    y += 30;

    // Compact Salary Breakdown - Two columns
    doc.setTextColor(25, 46, 94);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('COMPENSATION BREAKDOWN', 20, y);
    doc.setDrawColor(25, 46, 94);
    doc.setLineWidth(1);
    doc.line(20, y + 2, pageWidth - 20, y + 2);
    
    y += 10;

    // Left Column - Earnings
    const leftStart = 20, rightStart = pageWidth / 2 + 10;
    const colWidth = (pageWidth / 2) - 25;
    
    // Earnings Section
    doc.setFillColor(240, 253, 244);
    doc.rect(leftStart - 2, y, colWidth, 90, 'F');
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.5);
    doc.rect(leftStart - 2, y, colWidth, 90, 'S');
    
    doc.setTextColor(25, 46, 94);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('EARNINGS', leftStart, y + 8);
    
    let leftY = y + 15;
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    
    // Basic and allowances
    doc.text('Basic Salary:', leftStart, leftY);
    doc.text(formatCurrency(safeSalary.basic), leftStart + colWidth - 5, leftY, { align: 'right' });
    leftY += 6;
    
    doc.text('Food Allowance:', leftStart, leftY);
    doc.text(formatCurrency(safeSalary.allowances.food), leftStart + colWidth - 5, leftY, { align: 'right' });
    leftY += 6;
    
    doc.text('Medical Allowance:', leftStart, leftY);
    doc.text(formatCurrency(safeSalary.allowances.medical), leftStart + colWidth - 5, leftY, { align: 'right' });
    leftY += 6;
    
    doc.text('COLA:', leftStart, leftY);
    doc.text(formatCurrency(safeSalary.allowances.cola), leftStart + colWidth - 5, leftY, { align: 'right' });
    leftY += 6;
    
    doc.text('Overtime Pay:', leftStart, leftY);
    doc.text(formatCurrency(safeSalary.perks.overtime), leftStart + colWidth - 5, leftY, { align: 'right' });
    leftY += 6;
    
    doc.text('Bonus:', leftStart, leftY);
    doc.text(formatCurrency(safeSalary.perks.bonus), leftStart + colWidth - 5, leftY, { align: 'right' });
    leftY += 8;
    
    // Gross total
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.5);
    doc.line(leftStart, leftY - 4, leftStart + colWidth - 5, leftY - 4);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text('GROSS SALARY:', leftStart, leftY);
    doc.text(formatCurrency(safeTotals.grossSalary), leftStart + colWidth - 5, leftY, { align: 'right' });

    // Right Column - Deductions
    doc.setFillColor(254, 242, 242);
    doc.rect(rightStart - 2, y, colWidth, 90, 'F');
    doc.setDrawColor(239, 68, 68);
    doc.setLineWidth(0.5);
    doc.rect(rightStart - 2, y, colWidth, 90, 'S');
    
    doc.setTextColor(25, 46, 94);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('DEDUCTIONS', rightStart, y + 8);
    
    let rightY = y + 15;
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    
    doc.text('No Pay:', rightStart, rightY);
    doc.setTextColor(239, 68, 68);
    doc.text(formatCurrency(safeSalary.deductions.noPay), rightStart + colWidth - 5, rightY, { align: 'right' });
    rightY += 6;
    
    doc.setTextColor(51, 65, 85);
    doc.text('EPF (8%):', rightStart, rightY);
    doc.setTextColor(239, 68, 68);
    doc.text(formatCurrency(safeSalary.deductions.epf), rightStart + colWidth - 5, rightY, { align: 'right' });
    rightY += 6;
    
    doc.setTextColor(51, 65, 85);
    doc.text('Loans:', rightStart, rightY);
    doc.setTextColor(239, 68, 68);
    doc.text(formatCurrency(safeSalary.deductions.loans), rightStart + colWidth - 5, rightY, { align: 'right' });
    rightY += 8;
    
    // Total deductions
    doc.setDrawColor(239, 68, 68);
    doc.setLineWidth(0.5);
    doc.line(rightStart, rightY - 4, rightStart + colWidth - 5, rightY - 4);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(25, 46, 94);
    doc.text('TOTAL DEDUCTIONS:', rightStart, rightY);
    doc.setTextColor(239, 68, 68);
    doc.text(formatCurrency(safeTotals.totalDeductions), rightStart + colWidth - 5, rightY, { align: 'right' });

    y += 100;
    
    // Compact Net Salary Highlight
    doc.setFillColor(25, 46, 94);
    doc.rect(20, y, pageWidth - 40, 20, 'F');
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(1);
    doc.rect(22, y + 2, pageWidth - 44, 16, 'S');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('NET SALARY', 30, y + 10);
    doc.setFontSize(18);
    doc.text(formatCurrency(safeTotals.netSalary), pageWidth - 30, y + 12, { align: 'right' });
    
    y += 35;

    // Authorized Signature Section with dotted line
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Authorized Signature:', 20, y);
    
    // Create dotted line aligned with text
    const textWidth = doc.getTextWidth('Authorized Signature:');
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.setLineDashPattern([2, 1], 0); // 2 points dash, 1 point gap
    // Line starts 5 points after text ends and extends 80 points for signature space
    doc.line(20 + textWidth + 5, y, 20 + textWidth + 50, y);
    doc.setLineDashPattern([], 0); // Reset to solid line for future elements
    
    // Compact Footer
    y = pageHeight - 25;
    
    doc.setFillColor(248, 250, 252);
    doc.rect(0, y, pageWidth, 10, 'F');
    doc.setDrawColor(25, 46, 94);
    doc.setLineWidth(0.3);
    doc.line(0, y, pageWidth, y);
    
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('TRASH2CASH | hr@trash2cash.com | +94 11 234 5678', pageWidth / 2, y + 5, { align: 'center' });
    
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(6);
    doc.text('Computer-generated document. For inquiries contact HR department.', pageWidth / 2, y + 15, { align: 'center' });
    doc.text(`Document ID: PS-${safeEmployee.agentId}-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`, pageWidth / 2, y + 20, { align: 'center' });

    // Generate professional filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const employeeName = safeEmployee.name.replace(/[^a-zA-Z0-9]/g, '_');
    const month = safeAttendance.month.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `PayrollStatement_${employeeName}_${month}_${timestamp}.pdf`;
    
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

// Helper functions for formatting
const formatCurrency = (amount) => {
  return `Rs. ${Number(amount || 0).toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long', 
    year: 'numeric'
  });
};

// Pay slip component - Updated to match AgentSalaryInquiry structure
const AgentSalarySlip = forwardRef(({ salaryData }, ref) => {
  console.log('AgentSalarySlip rendered with data:', salaryData);
  
  if (!salaryData) {
    console.log('No salary data provided to AgentSalarySlip');
    return <div ref={ref}>No salary data available</div>;
  }

  const { 
    employee = {}, 
    attendance = {}, 
    salary = { allowances: {}, perks: {}, deductions: {} }, 
    meta = {}, 
    totals = {}, 
    createdAt 
  } = salaryData;

  // Ensure we have default values for required fields - matching AgentSalaryInquiry
  const safeEmployee = {
    name: employee.name || 'N/A',
    agentId: employee.agentId || 'N/A',
    epfNo: employee.epfNo || 'N/A',
    email: employee.email || 'N/A'
  };

  const safeAttendance = {
    month: attendance.month || 'N/A',
    workingDays: attendance.workingDays || 0,
    overtimeHours: attendance.overtimeHours || 0,
    noPayDays: attendance.noPayDays || 0
  };

  const safeSalary = {
    basic: salary.basic || 0,
    allowances: {
      food: salary.allowances?.food || 0,
      medical: salary.allowances?.medical || 0,
      cola: salary.allowances?.cola || 0
    },
    perks: {
      overtime: salary.perks?.overtime || 0,
      bonus: salary.perks?.bonus || 0
    },
    deductions: {
      noPay: salary.deductions?.noPay || 0,
      epf: salary.deductions?.epf || 0,
      etf: salary.deductions?.etf || 0,
      loans: salary.deductions?.loans || 0
    }
  };

  const safeTotals = {
    totalAllowances: totals.totalAllowances || 0,
    grossSalary: totals.grossSalary || 0,
    totalDeductions: totals.totalDeductions || 0,
    netSalary: totals.netSalary || 0
  };

  const safeMeta = {
    epfBase: meta.epfBase || 0,
    epfEmployer: meta.epfEmployer || 0
  };

  return (
    <div ref={ref} className="bg-white p-8 max-w-6xl mx-auto" style={{ minHeight: '1000px' }}>
      {/* Header */}
      <div className="border-b-2 border-gray-200 pb-6 mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">TRASH2CASH</h1>
            <p className="text-gray-600">Waste Management Solutions</p>
            <p className="text-sm text-gray-500 mt-1">Colombo, Sri Lanka</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-semibold text-gray-800 mb-1">SALARY SLIP</h2>
            <p className="text-sm text-gray-600">Pay Period: {safeAttendance.month}</p>
            <p className="text-sm text-gray-600">Generated: {formatDate(createdAt || new Date())}</p>
          </div>
        </div>
      </div>

      {/* Employee Information - Matching AgentSalaryInquiry layout */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-6 border-b border-gray-200 pb-2">
          Employee Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Agent Name</p>
            <p className="font-semibold text-gray-800">{safeEmployee.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Agent ID</p>
            <p className="font-semibold text-gray-800">{safeEmployee.agentId}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Email</p>
            <p className="font-semibold text-gray-800">{safeEmployee.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">EPF Number</p>
            <p className="font-semibold text-gray-800">{safeEmployee.epfNo}</p>
          </div>
        </div>
      </div>

      {/* Attendance Details - Matching AgentSalaryInquiry */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-6 border-b border-gray-200 pb-2">
          Attendance Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl text-green-600">✓</span>
            </div>
            <p className="text-sm text-gray-600">Working Days</p>
            <p className="text-2xl font-bold text-green-600">{safeAttendance.workingDays}</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl text-blue-600">⏰</span>
            </div>
            <p className="text-sm text-gray-600">Overtime Hours</p>
            <p className="text-2xl font-bold text-blue-600">{safeAttendance.overtimeHours}</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl text-red-600">✗</span>
            </div>
            <p className="text-sm text-gray-600">No Pay Days</p>
            <p className="text-2xl font-bold text-red-600">{safeAttendance.noPayDays}</p>
          </div>
        </div>
      </div>

      {/* Comprehensive Salary Breakdown - Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Basic Salary & Allowances */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Basic & Allowances</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Basic Salary:</span>
              <span className="font-semibold text-gray-800">{formatCurrency(safeSalary.basic)}</span>
            </div>
            <div className="border-t border-purple-200 pt-3">
              <p className="text-sm font-medium text-gray-700 mb-2">Allowances:</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Food Allowance:</span>
                  <span className="text-gray-800">{formatCurrency(safeSalary.allowances.food)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Medical Allowance:</span>
                  <span className="text-gray-800">{formatCurrency(safeSalary.allowances.medical)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">COLA:</span>
                  <span className="text-gray-800">{formatCurrency(safeSalary.allowances.cola)}</span>
                </div>
              </div>
            </div>
            <div className="border-t border-purple-200 pt-3">
              <div className="flex justify-between font-semibold">
                <span className="text-purple-700">Total Allowances:</span>
                <span className="text-purple-700">{formatCurrency(safeTotals.totalAllowances)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Perks & Overtime */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Perks & Overtime</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Overtime Pay:</span>
              <span className="font-semibold text-gray-800">{formatCurrency(safeSalary.perks.overtime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Bonus:</span>
              <span className="font-semibold text-gray-800">{formatCurrency(safeSalary.perks.bonus)}</span>
            </div>
            <div className="border-t border-indigo-200 pt-3">
              <p className="text-sm font-medium text-gray-700 mb-2">EPF Details:</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">EPF Base:</span>
                  <span className="text-gray-800">{formatCurrency(safeMeta.epfBase)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Employer EPF:</span>
                  <span className="text-gray-800">{formatCurrency(safeMeta.epfEmployer)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Deductions */}
        <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Deductions</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">No Pay:</span>
              <span className="font-semibold text-red-600">-{formatCurrency(safeSalary.deductions.noPay)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">EPF (Employee):</span>
              <span className="font-semibold text-red-600">-{formatCurrency(safeSalary.deductions.epf)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ETF:</span>
              <span className="font-semibold text-red-600">-{formatCurrency(safeSalary.deductions.etf)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Loans:</span>
              <span className="font-semibold text-red-600">-{formatCurrency(safeSalary.deductions.loans)}</span>
            </div>
            <div className="border-t border-red-200 pt-3">
              <div className="flex justify-between font-semibold">
                <span className="text-red-700">Total Deductions:</span>
                <span className="text-red-700">-{formatCurrency(safeTotals.totalDeductions)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Salary Summary - Matching AgentSalaryInquiry */}
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-6 mb-8">
        <h4 className="text-xl font-semibold text-gray-800 mb-6">Salary Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <p className="text-sm text-gray-600 mb-2">Gross Salary</p>
            <p className="text-3xl font-bold text-blue-600">{formatCurrency(safeTotals.grossSalary)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Total Deductions</p>
            <p className="text-3xl font-bold text-red-600">-{formatCurrency(safeTotals.totalDeductions)}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-md">
            <p className="text-sm text-gray-600 mb-2">Net Salary</p>
            <p className="text-4xl font-bold text-green-600">{formatCurrency(safeTotals.netSalary)}</p>
          </div>
        </div>
      </div>

      {/* Employer Contributions (Information Only) */}
      <div className="bg-blue-50 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Employer Contributions (Information Only)
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="flex justify-between">
            <span className="text-gray-600">EPF Employer (12%):</span>
            <span className="font-medium">{formatCurrency(safeMeta.epfEmployer)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">ETF (3%):</span>
            <span className="font-medium">{formatCurrency(safeSalary.basic * 0.03)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t-2 border-gray-200 pt-6 text-center text-sm text-gray-500">
        <p>This is a computer-generated salary slip and does not require a signature.</p>
        <p className="mt-2">For any queries, please contact the HR department.</p>
        <p className="mt-2 font-medium">Document ID: PS-{safeEmployee.agentId}-{new Date().toISOString().slice(0, 7)}</p>
      </div>
    </div>
  );
});

AgentSalarySlip.displayName = 'AgentSalarySlip';

export default AgentSalarySlip;