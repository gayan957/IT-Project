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
      meta = {},
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

    const safeMeta = {
      epfBase: meta.epfBase || 0,
      epfEmployer: meta.epfEmployer || 0
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

    // Helper to ensure page space
    const ensurePageSpace = (y, needed = 20) => {
      if (y + needed > pageHeight - 20) {
        doc.addPage();
        return 20;
      }
      return y;
    };

    // Header with company info and professional branding
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
    doc.text('PAYROLL STATEMENT', pageWidth - 20, 18, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Pay Period: ${safeAttendance.month}`, pageWidth - 20, 25, { align: 'right' });
    doc.text(`Issue Date: ${formatDate(createdAt || new Date())}`, pageWidth - 20, 31, { align: 'right' });

    let y = 55;

    // Employee Information Section with professional styling
    doc.setTextColor(25, 46, 94);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('EMPLOYEE DETAILS', 20, y);
    
    // Create a subtle background for employee section
    doc.setFillColor(248, 249, 252);
    doc.rect(15, y + 2, pageWidth - 30, 40, 'F');
    
    // Professional border
    doc.setDrawColor(25, 46, 94);
    doc.setLineWidth(1);
    doc.line(20, y + 4, pageWidth - 20, y + 4);
    
    y += 12;
    
    doc.setTextColor(51, 65, 85); // Slate gray
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    
    // Two-column layout for employee info
    const leftCol = 25;
    const rightCol = pageWidth / 2 + 10;
    
    // Left column
    doc.setFont('helvetica', 'bold');
    doc.text('Full Name', leftCol, y);
    doc.setFont('helvetica', 'normal');
    doc.text(safeEmployee.name, leftCol, y + 6);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Employee ID', leftCol, y + 16);
    doc.setFont('helvetica', 'normal');
    doc.text(safeEmployee.agentId, leftCol, y + 22);
    
    // Right column
    doc.setFont('helvetica', 'bold');
    doc.text('EPF Registration', rightCol, y);
    doc.setFont('helvetica', 'normal');
    doc.text(safeEmployee.epfNo, rightCol, y + 6);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Contact Email', rightCol, y + 16);
    doc.setFont('helvetica', 'normal');
    doc.text(safeEmployee.email, rightCol, y + 22);

    y += 45;

    // Attendance Details Section with modern design
    doc.setTextColor(25, 46, 94);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('ATTENDANCE SUMMARY', 20, y);
    
    // Attendance background
    doc.setFillColor(250, 252, 255);
    doc.rect(15, y + 2, pageWidth - 30, 30, 'F');
    
    doc.setDrawColor(25, 46, 94);
    doc.setLineWidth(1);
    doc.line(20, y + 4, pageWidth - 20, y + 4);
    
    y += 12;
    
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    
    // Three-column layout for attendance
    const col1 = 25;
    const col2 = 85;
    const col3 = 145;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Working Days', col1, y);
    doc.text('Overtime Hours', col2, y);
    doc.text('Absent Days', col3, y);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(16, 185, 129); // Green for positive numbers
    doc.text(safeAttendance.workingDays.toString(), col1, y + 8);
    doc.text(safeAttendance.overtimeHours.toString(), col2, y + 8);
    
    doc.setTextColor(239, 68, 68); // Red for absent days
    doc.text(safeAttendance.noPayDays.toString(), col3, y + 8);

    y += 25;
    y = ensurePageSpace(y, 80);

    // Professional Salary Breakdown Section - Fixed spacing and layout
    doc.setTextColor(25, 46, 94);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('COMPENSATION BREAKDOWN', 20, y);
    
    // Create professional table-like layout
    doc.setDrawColor(25, 46, 94);
    doc.setLineWidth(1.5);
    doc.line(20, y + 4, pageWidth - 20, y + 4);
    
    y += 20;
    y = ensurePageSpace(y, 100);

    // Section 1: Basic & Allowances (Left Column)
    const salaryLeftCol = 20;
    const salaryMiddleCol = 75;
    const salaryRightCol = 130;
    const salaryColWidth = 50;
    
    // Basic & Allowances Section
    doc.setFillColor(240, 253, 244); // Light green background
    doc.rect(salaryLeftCol - 2, y - 5, salaryColWidth, 80, 'F');
    
    doc.setTextColor(25, 46, 94);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('BASIC & ALLOWANCES', salaryLeftCol, y);
    
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(1);
    doc.line(salaryLeftCol, y + 2, salaryLeftCol + salaryColWidth - 5, y + 2);
    
    let leftY = y + 10;
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    // Basic salary
    doc.setFont('helvetica', 'bold');
    doc.text('Basic Salary:', salaryLeftCol, leftY);
    doc.setFont('helvetica', 'normal');
    doc.text(formatCurrency(safeSalary.basic), salaryLeftCol + salaryColWidth - 5, leftY, { align: 'right' });
    leftY += 7;
    
    // Allowances
    doc.setFont('helvetica', 'bold');
    doc.text('ALLOWANCES:', salaryLeftCol, leftY);
    leftY += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.text('Food:', salaryLeftCol + 2, leftY);
    doc.text(formatCurrency(safeSalary.allowances.food), salaryLeftCol + salaryColWidth - 5, leftY, { align: 'right' });
    leftY += 5;
    
    doc.text('Medical:', salaryLeftCol + 2, leftY);
    doc.text(formatCurrency(safeSalary.allowances.medical), salaryLeftCol + salaryColWidth - 5, leftY, { align: 'right' });
    leftY += 5;
    
    doc.text('COLA:', salaryLeftCol + 2, leftY);
    doc.text(formatCurrency(safeSalary.allowances.cola), salaryLeftCol + salaryColWidth - 5, leftY, { align: 'right' });
    leftY += 8;
    
    // Total allowances
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.5);
    doc.line(salaryLeftCol, leftY - 2, salaryLeftCol + salaryColWidth - 5, leftY - 2);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text('Total Allowances:', salaryLeftCol, leftY);
    doc.text(formatCurrency(safeTotals.totalAllowances), salaryLeftCol + salaryColWidth - 5, leftY, { align: 'right' });
    leftY += 8;
    
    // Gross salary
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(1);
    doc.line(salaryLeftCol, leftY - 2, salaryLeftCol + salaryColWidth - 5, leftY - 2);
    
    doc.setTextColor(25, 46, 94);
    doc.text('GROSS SALARY:', salaryLeftCol, leftY);
    doc.setTextColor(16, 185, 129);
    doc.text(formatCurrency(safeTotals.grossSalary), salaryLeftCol + salaryColWidth - 5, leftY, { align: 'right' });

    // Section 2: Perks & Overtime (Middle Column)
    doc.setFillColor(250, 252, 255); // Light blue background
    doc.rect(salaryMiddleCol - 2, y - 5, salaryColWidth, 80, 'F');
    
    doc.setTextColor(25, 46, 94);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('PERKS & OVERTIME', salaryMiddleCol, y);
    
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(1);
    doc.line(salaryMiddleCol, y + 2, salaryMiddleCol + salaryColWidth - 5, y + 2);
    
    let middleY = y + 10;
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    doc.text('Overtime Pay:', salaryMiddleCol, middleY);
    doc.text(formatCurrency(safeSalary.perks.overtime), salaryMiddleCol + salaryColWidth - 5, middleY, { align: 'right' });
    middleY += 7;
    
    doc.text('Bonus:', salaryMiddleCol, middleY);
    doc.text(formatCurrency(safeSalary.perks.bonus), salaryMiddleCol + salaryColWidth - 5, middleY, { align: 'right' });
    middleY += 10;
    
    // EPF Details
    doc.setFont('helvetica', 'bold');
    doc.text('EPF DETAILS:', salaryMiddleCol, middleY);
    middleY += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.text('EPF Base:', salaryMiddleCol + 2, middleY);
    doc.text(formatCurrency(safeMeta.epfBase), salaryMiddleCol + salaryColWidth - 5, middleY, { align: 'right' });
    middleY += 5;
    
    doc.text('Employer EPF:', salaryMiddleCol + 2, middleY);
    doc.text(formatCurrency(safeMeta.epfEmployer), salaryMiddleCol + salaryColWidth - 5, middleY, { align: 'right' });

    // Section 3: Deductions (Right Column)
    doc.setFillColor(254, 242, 242); // Light red background
    doc.rect(salaryRightCol - 2, y - 5, salaryColWidth, 80, 'F');
    
    doc.setTextColor(25, 46, 94);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('DEDUCTIONS', salaryRightCol, y);
    
    doc.setDrawColor(239, 68, 68);
    doc.setLineWidth(1);
    doc.line(salaryRightCol, y + 2, salaryRightCol + salaryColWidth - 5, y + 2);
    
    let rightY = y + 10;
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    doc.text('No Pay:', salaryRightCol, rightY);
    doc.setTextColor(239, 68, 68);
    doc.text(formatCurrency(safeSalary.deductions.noPay), salaryRightCol + salaryColWidth - 5, rightY, { align: 'right' });
    rightY += 7;
    
    doc.setTextColor(51, 65, 85);
    doc.text('EPF (Employee):', salaryRightCol, rightY);
    doc.setTextColor(239, 68, 68);
    doc.text(formatCurrency(safeSalary.deductions.epf), salaryRightCol + salaryColWidth - 5, rightY, { align: 'right' });
    rightY += 7;
    
    doc.setTextColor(51, 65, 85);
    doc.text('ETF:', salaryRightCol, rightY);
    doc.setTextColor(239, 68, 68);
    doc.text(formatCurrency(safeSalary.deductions.etf), salaryRightCol + salaryColWidth - 5, rightY, { align: 'right' });
    rightY += 7;
    
    doc.setTextColor(51, 65, 85);
    doc.text('Loans:', salaryRightCol, rightY);
    doc.setTextColor(239, 68, 68);
    doc.text(formatCurrency(safeSalary.deductions.loans), salaryRightCol + salaryColWidth - 5, rightY, { align: 'right' });
    rightY += 10;
    
    // Total deductions
    doc.setDrawColor(239, 68, 68);
    doc.setLineWidth(1);
    doc.line(salaryRightCol, rightY - 2, salaryRightCol + salaryColWidth - 5, rightY - 2);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(25, 46, 94);
    doc.text('TOTAL DEDUCTIONS:', salaryRightCol, rightY);
    doc.setTextColor(239, 68, 68);
    doc.text(formatCurrency(safeTotals.totalDeductions), salaryRightCol + salaryColWidth - 5, rightY, { align: 'right' });

    y += 90;
    y = ensurePageSpace(y, 35);
    
    // Professional Net Salary Highlight
    doc.setFillColor(25, 46, 94); // Company blue background
    doc.rect(20, y - 8, pageWidth - 40, 25, 'F');
    
    // White border for elegance
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(2);
    doc.rect(22, y - 6, pageWidth - 44, 21, 'S');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('NET TAKE-HOME PAY', 30, y + 2);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text(formatCurrency(safeTotals.netSalary), pageWidth - 30, y + 2, { align: 'right' });
    
    y += 30;

    // Employer Contributions - Professional Information Box
    y = ensurePageSpace(y, 40);
    doc.setFillColor(248, 250, 252); // Light gray background
    doc.rect(20, y - 5, pageWidth - 40, 35, 'F');
    
    doc.setDrawColor(100, 116, 139);
    doc.setLineWidth(1);
    doc.rect(20, y - 5, pageWidth - 40, 35, 'S');
    
    doc.setTextColor(25, 46, 94);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('EMPLOYER CONTRIBUTIONS', 30, y + 3);
    
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('(For information purposes only - not deducted from your salary)', 30, y + 10);
    
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    y += 18;
    
    // Professional layout for contributions
    const contribCol1 = 40;
    const contribCol2 = pageWidth / 2 + 20;
    
    doc.setFont('helvetica', 'bold');
    doc.text('EPF Employer (12%)', contribCol1, y);
    doc.setFont('helvetica', 'normal');
    doc.text(formatCurrency(safeMeta.epfEmployer), contribCol1 + 60, y);
    
    doc.setFont('helvetica', 'bold');
    doc.text('ETF Contribution (3%)', contribCol2, y);
    doc.setFont('helvetica', 'normal');
    // Calculate ETF as 3% of basic salary
    const etfAmount = safeSalary.basic * 0.03;
    doc.text(formatCurrency(etfAmount), contribCol2 + 60, y);

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
    doc.text('TRASH2CASH | Waste Management Solutions | hr@trash2cash.com | +94 11 234 5678', pageWidth / 2, y + 2, { align: 'center' });
    
    y += 20;
    
    // Professional disclaimer
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('This document is computer-generated and does not require a physical signature.', pageWidth / 2, y, { align: 'center' });
    doc.text('For payroll inquiries, please contact Human Resources department.', pageWidth / 2, y + 6, { align: 'center' });
    doc.text(`Document ID: PS-${safeEmployee.agentId}-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`, pageWidth / 2, y + 12, { align: 'center' });

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