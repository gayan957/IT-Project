import { forwardRef } from 'react';
import jsPDF from 'jspdf';

// PDF generator function for email sending - returns base64
export async function generatePaySlipPdfBase64({ slip }) {
  try {
    console.log('Starting PDF generation for email...');
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
    doc.setFontSize(8);
    doc.text('ECO', 17.5, 16.5);
    
    // Company name and payslip title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Trash2Cash', 35, 18);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Monthly Salary Slip', 35, 25);
    
    // Period and date
    doc.setFontSize(9);
    doc.text(`Period: ${safeAttendance.month}`, pageWidth - 60, 18);
    doc.text(`Generated: ${formatDate(createdAt || new Date())}`, pageWidth - 60, 25);
    
    y = 40;
    doc.setTextColor(0, 0, 0);

    // Employee Information Section (Compact)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Employee Information', 15, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    // Two-column layout for employee info
    doc.text(`Name: ${safeEmployee.name}`, 15, y);
    doc.text(`Agent ID: ${safeEmployee.agentId}`, 110, y);
    y += 6;
    doc.text(`EPF No: ${safeEmployee.epfNo}`, 15, y);
    doc.text(`Email: ${safeEmployee.email}`, 110, y);
    y += 10;

    // Attendance Summary (Compact horizontal layout)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Attendance Summary', 15, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const attendanceY = y;
    doc.text(`Working Days: ${safeAttendance.workingDays}`, 15, attendanceY);
    doc.text(`Overtime: ${safeAttendance.overtimeHours}h`, 70, attendanceY);
    doc.text(`No Pay Days: ${safeAttendance.noPayDays}`, 125, attendanceY);
    y += 12;

    // Salary Breakdown (Single comprehensive section)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Salary Breakdown', 15, y);
    y += 8;

    // Draw table header
    doc.setFillColor(240, 240, 240);
    doc.rect(15, y - 3, pageWidth - 30, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Description', 18, y + 2);
    doc.text('Amount (Rs.)', pageWidth - 20, y + 2, { align: 'right' });
    y += 10;

    // Helper function for table rows
    const addTableRow = (label, amount, isBold = false, isTotal = false) => {
      if (isTotal) {
        doc.setFillColor(250, 250, 250);
        doc.rect(15, y - 3, pageWidth - 30, 7, 'F');
      }
      
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setFontSize(9);
      doc.text(label, 18, y + 1);
      doc.text(formatCurrency(amount), pageWidth - 20, y + 1, { align: 'right' });
      y += 6;
    };

    // Basic salary
    addTableRow('Basic Salary', safeSalary.basic);
    
    // Allowances
    if (safeSalary.allowances.food > 0) addTableRow('Food Allowance', safeSalary.allowances.food);
    if (safeSalary.allowances.medical > 0) addTableRow('Medical Allowance', safeSalary.allowances.medical);
    if (safeSalary.allowances.cola > 0) addTableRow('Cost of Living Allowance', safeSalary.allowances.cola);
    
    // Perks
    if (safeSalary.perks.overtime > 0) addTableRow('Overtime Payment', safeSalary.perks.overtime);
    if (safeSalary.perks.bonus > 0) addTableRow('Bonus', safeSalary.perks.bonus);
    
    // Subtotal
    y += 2;
    addTableRow('Total Allowances', safeTotals.totalAllowances, true, true);
    addTableRow('Gross Salary', safeTotals.grossSalary, true, true);
    
    y += 3;
    
    // Deductions
    if (safeSalary.deductions.noPay > 0) addTableRow('No Pay Deduction', safeSalary.deductions.noPay);
    if (safeSalary.deductions.epf > 0) addTableRow('EPF (8%)', safeSalary.deductions.epf);
    if (safeSalary.deductions.etf > 0) addTableRow('ETF (3%)', safeSalary.deductions.etf);
    if (safeSalary.deductions.loans > 0) addTableRow('Loan Deduction', safeSalary.deductions.loans);
    
    y += 2;
    addTableRow('Total Deductions', safeTotals.totalDeductions, true, true);
    
    y += 5;
    
    // Net salary (highlighted)
    doc.setFillColor(220, 245, 220);
    doc.rect(15, y - 3, pageWidth - 30, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Net Salary', 18, y + 3);
    doc.text(formatCurrency(safeTotals.netSalary), pageWidth - 20, y + 3, { align: 'right' });
    y += 15;

    // Footer with dotted line and signature areas (Compact)
    y += 10;
    
    // Dotted line
    doc.setLineDashPattern([1, 1], 0);
    doc.line(15, y, pageWidth - 15, y);
    doc.setLineDashPattern([], 0);
    y += 8;

    // Compact signature section
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Employee Signature: _________________', 15, y);
    doc.text('HR Signature: _________________', pageWidth - 80, y);
    y += 8;

    // Footer note
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text('This is a system-generated payslip. No signature required.', 15, y);
    doc.text(`Generated on ${formatDate(new Date())}`, pageWidth - 60, y);

    // Return PDF as base64 string
    const pdfOutput = doc.output('datauristring');
    if (!pdfOutput || !pdfOutput.includes(',')) {
      throw new Error('Invalid PDF output format');
    }
    
    const pdfBase64 = pdfOutput.split(',')[1];
    if (!pdfBase64 || pdfBase64.length < 100) {
      throw new Error('Generated PDF appears to be too small or invalid');
    }
    
    console.log('PDF generated successfully as base64, size:', pdfBase64.length);
    return pdfBase64;

  } catch (error) {
    console.error('Error generating PDF:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    throw new Error(`Failed to generate salary slip PDF: ${error.message}`);
  }
}

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

    // Simple single-page layout matching the email PDF
    let y = 20;
    
    // Header with company branding
    doc.setFillColor(25, 46, 94);
    doc.rect(0, 0, pageWidth, 30, 'F');
    
    // Company logo area
    doc.setFillColor(255, 255, 255);
    doc.circle(20, 15, 6, 'F');
    doc.setFillColor(25, 46, 94);
    doc.setFontSize(8);
    doc.text('ECO', 17.5, 16.5);
    
    // Company name and title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Trash2Cash', 30, 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text('Monthly Salary Slip', 30, 20);
    
    // Period and generation date (right side)
    doc.setFontSize(9);
    doc.text(`Period: ${safeAttendance.month}`, pageWidth - 15, 12, { align: 'right' });
    doc.text(`Generated: ${formatDate(new Date())}`, pageWidth - 15, 18, { align: 'right' });

    y = 40;

    // Employee Information Section
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Employee Information', 15, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    // Left side employee info
    doc.text(`Name: ${safeEmployee.name}`, 15, y);
    doc.text(`Agent ID: ${safeEmployee.agentId}`, pageWidth / 2, y);
    y += 6;
    doc.text(`EPF No: ${safeEmployee.epfNo}`, 15, y);
    doc.text(`Email: ${safeEmployee.email}`, pageWidth / 2, y);
    y += 10;

    // Attendance Summary Section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Attendance Summary', 15, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Working Days: ${safeAttendance.workingDays}`, 15, y);
    doc.text(`Overtime: ${safeAttendance.overtimeHours}h`, pageWidth / 2 - 20, y);
    doc.text(`No Pay Days: ${safeAttendance.noPayDays}`, pageWidth / 2 + 40, y);

    y += 15;

    // Salary Breakdown (Simple table format)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Salary Breakdown', 15, y);
    y += 8;

    // Draw table header
    doc.setFillColor(240, 240, 240);
    doc.rect(15, y - 3, pageWidth - 30, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Description', 18, y + 2);
    doc.text('Amount (Rs.)', pageWidth - 20, y + 2, { align: 'right' });
    y += 10;

    // Helper function for table rows
    const addTableRow = (label, amount, isBold = false, isTotal = false) => {
      if (isTotal) {
        doc.setFillColor(250, 250, 250);
        doc.rect(15, y - 3, pageWidth - 30, 7, 'F');
      }
      
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setFontSize(9);
      doc.text(label, 18, y + 1);
      doc.text(formatCurrency(amount), pageWidth - 20, y + 1, { align: 'right' });
      y += 6;
    };

    // Basic salary
    addTableRow('Basic Salary', safeSalary.basic);
    
    // Allowances
    if (safeSalary.allowances.food > 0) addTableRow('Food Allowance', safeSalary.allowances.food);
    if (safeSalary.allowances.medical > 0) addTableRow('Medical Allowance', safeSalary.allowances.medical);
    if (safeSalary.allowances.cola > 0) addTableRow('Cost of Living Allowance', safeSalary.allowances.cola);
    
    // Perks
    if (safeSalary.perks.overtime > 0) addTableRow('Overtime Payment', safeSalary.perks.overtime);
    if (safeSalary.perks.bonus > 0) addTableRow('Bonus', safeSalary.perks.bonus);
    
    // Subtotal
    y += 2;
    addTableRow('Total Allowances', safeTotals.totalAllowances, true, true);
    addTableRow('Gross Salary', safeTotals.grossSalary, true, true);
    
    y += 3;
    
    // Deductions
    if (safeSalary.deductions.noPay > 0) addTableRow('No Pay Deduction', safeSalary.deductions.noPay);
    if (safeSalary.deductions.epf > 0) addTableRow('EPF (8%)', safeSalary.deductions.epf);
    if (safeSalary.deductions.etf > 0) addTableRow('ETF (3%)', safeSalary.deductions.etf);
    if (safeSalary.deductions.loans > 0) addTableRow('Loan Deduction', safeSalary.deductions.loans);
    
    y += 2;
    addTableRow('Total Deductions', safeTotals.totalDeductions, true, true);
    
    y += 5;
    
    // Net salary (highlighted)
    doc.setFillColor(220, 245, 220);
    doc.rect(15, y - 3, pageWidth - 30, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Net Salary', 18, y + 3);
    doc.text(formatCurrency(safeTotals.netSalary), pageWidth - 20, y + 3, { align: 'right' });
    y += 15;


    // Footer with dotted line and signature areas
    y += 10;
    
    // Dotted line separator
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(15, y, pageWidth - 15, y);
    doc.setLineDashPattern([], 0);
    
    y += 10;
    
    // Signature sections
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Employee Signature: ___________________________', 20, y);
    doc.text('HR Signature: ___________________________', pageWidth - 100, y);
    
    y += 10;
    doc.setFontSize(7);
    doc.text('This is a system-generated payslip. No signature required.', 20, y);
    doc.text(`Generated on ${formatDate(new Date())}`, pageWidth - 70, y);

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