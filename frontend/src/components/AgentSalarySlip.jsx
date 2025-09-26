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
    
    // Safe data extraction with defaults
    const {
      employee = {},
      attendance = {},
      salary = { allowances: {}, perks: {}, deductions: {} },
      statutory = {},
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
        loans: salary.deductions?.loans || 0
      }
    };

    const safeTotals = {
      grossSalary: totals.grossSalary || 0,
      totalDeductions: totals.totalDeductions || 0,
      netSalary: totals.netSalary || 0
    };

    const safeStatutory = {
      epfEmployee: statutory.epfEmployee || 0,
      epfEmployer: statutory.epfEmployer || 0,
      etfEmployer: statutory.etfEmployer || 0
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

    // Professional Salary Breakdown Section
    doc.setTextColor(25, 46, 94);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('COMPENSATION BREAKDOWN', 20, y);
    
    // Create professional table-like layout
    doc.setDrawColor(25, 46, 94);
    doc.setLineWidth(1.5);
    doc.line(20, y + 4, pageWidth - 20, y + 4);
    
    y += 15;
    
    // Earnings Section (Left Side) with modern styling
    doc.setFillColor(240, 253, 244); // Light green background
    doc.rect(20, y - 5, 85, 120, 'F');
    
    doc.setTextColor(25, 46, 94);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('EARNINGS', 25, y);
    
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(2);
    doc.line(25, y + 2, 95, y + 2);
    
    y += 12;
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    
    let earningsY = y;
    
    // Basic salary with emphasis
    doc.setFont('helvetica', 'bold');
    doc.text('Base Salary', 25, earningsY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text(formatCurrency(safeSalary.basic), 95, earningsY, { align: 'right' });
    earningsY += 10;
    
    // Allowances with conditional display
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    
    if (safeSalary.allowances.food > 0) {
      doc.text('Food Allowance', 25, earningsY);
      doc.setFont('helvetica', 'normal');
      doc.text(formatCurrency(safeSalary.allowances.food), 95, earningsY, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      earningsY += 8;
    }
    
    if (safeSalary.allowances.medical > 0) {
      doc.text('Medical Allowance', 25, earningsY);
      doc.text(formatCurrency(safeSalary.allowances.medical), 95, earningsY, { align: 'right' });
      earningsY += 8;
    }
    
    if (safeSalary.allowances.cola > 0) {
      doc.text('Cost of Living', 25, earningsY);
      doc.text(formatCurrency(safeSalary.allowances.cola), 95, earningsY, { align: 'right' });
      earningsY += 8;
    }
    
    // Performance incentives
    if (safeSalary.perks.overtime > 0) {
      doc.text('Overtime Payment', 25, earningsY);
      doc.text(formatCurrency(safeSalary.perks.overtime), 95, earningsY, { align: 'right' });
      earningsY += 8;
    }
    
    if (safeSalary.perks.bonus > 0) {
      doc.text('Performance Bonus', 25, earningsY);
      doc.text(formatCurrency(safeSalary.perks.bonus), 95, earningsY, { align: 'right' });
      earningsY += 8;
    }
    
    // Total earnings with emphasis
    earningsY += 8;
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(1);
    doc.line(25, earningsY - 3, 95, earningsY - 3);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(25, 46, 94);
    doc.text('GROSS EARNINGS', 25, earningsY);
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(14);
    doc.text(formatCurrency(safeTotals.grossSalary), 95, earningsY, { align: 'right' });
    
    // Deductions Section (Right Side) with professional styling
    let deductionsY = y - 12;
    
    doc.setFillColor(254, 242, 242); // Light red background
    doc.rect(110, deductionsY - 5, 85, 120, 'F');
    
    doc.setTextColor(25, 46, 94);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('DEDUCTIONS', 115, deductionsY);
    
    doc.setDrawColor(239, 68, 68);
    doc.setLineWidth(2);
    doc.line(115, deductionsY + 2, 185, deductionsY + 2);
    
    deductionsY += 12;
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    
    // Statutory deductions
    if (safeStatutory.epfEmployee > 0) {
      doc.text('EPF Contribution (8%)', 115, deductionsY);
      doc.text(formatCurrency(safeStatutory.epfEmployee), 185, deductionsY, { align: 'right' });
      deductionsY += 8;
    }
    
    // Other deductions
    if (safeSalary.deductions.noPay > 0) {
      doc.text('Absence Deduction', 115, deductionsY);
      doc.text(formatCurrency(safeSalary.deductions.noPay), 185, deductionsY, { align: 'right' });
      deductionsY += 8;
    }
    
    if (safeSalary.deductions.loans > 0) {
      doc.text('Loan Repayment', 115, deductionsY);
      doc.text(formatCurrency(safeSalary.deductions.loans), 185, deductionsY, { align: 'right' });
      deductionsY += 8;
    }
    
    // Total deductions with emphasis
    deductionsY += 8;
    doc.setDrawColor(239, 68, 68);
    doc.setLineWidth(1);
    doc.line(115, deductionsY - 3, 185, deductionsY - 3);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(25, 46, 94);
    doc.text('TOTAL DEDUCTIONS', 115, deductionsY);
    doc.setTextColor(239, 68, 68);
    doc.setFontSize(14);
    doc.text(formatCurrency(safeTotals.totalDeductions), 185, deductionsY, { align: 'right' });

    y = Math.max(earningsY, deductionsY) + 20;
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
    const contrib1 = 40;
    const contrib2 = pageWidth / 2 + 20;
    
    doc.setFont('helvetica', 'bold');
    doc.text('EPF Employer (12%)', contrib1, y);
    doc.setFont('helvetica', 'normal');
    doc.text(formatCurrency(safeStatutory.epfEmployer), contrib1 + 60, y);
    
    doc.setFont('helvetica', 'bold');
    doc.text('ETF Contribution (3%)', contrib2, y);
    doc.setFont('helvetica', 'normal');
    doc.text(formatCurrency(safeStatutory.etfEmployer), contrib2 + 60, y);

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

// Pay slip component
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
    statutory = {}, 
    totals = {}, 
    createdAt 
  } = salaryData;

  // Ensure we have default values for required fields
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
      loans: salary.deductions?.loans || 0
    }
  };

  const safeTotals = {
    grossSalary: totals.grossSalary || 0,
    totalDeductions: totals.totalDeductions || 0,
    netSalary: totals.netSalary || 0
  };

  const safeStatutory = {
    epfEmployee: statutory.epfEmployee || 0,
    epfEmployer: statutory.epfEmployer || 0,
    etfEmployer: statutory.etfEmployer || 0
  };

  return (
    <div ref={ref} className="bg-white p-8 max-w-4xl mx-auto" style={{ minHeight: '800px' }}>
      {/* Header */}
      <div className="border-b-2 border-gray-200 pb-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">TRASH2CASH</h1>
            <p className="text-gray-600">Waste Management Solutions</p>
            <p className="text-sm text-gray-500 mt-1">Colombo, Sri Lanka</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-semibold text-gray-800 mb-1">SALARY SLIP</h2>
            <p className="text-sm text-gray-600">Pay Period: {safeAttendance.month}</p>
            <p className="text-sm text-gray-600">Generated: {formatDate(createdAt || new Date())}</p>
          </div>
        </div>
      </div>

      {/* Employee Information */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
            Employee Information
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Name:</span>
              <span className="font-medium">{safeEmployee.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Agent ID:</span>
              <span className="font-medium">{safeEmployee.agentId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">EPF No:</span>
              <span className="font-medium">{safeEmployee.epfNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium">{safeEmployee.email}</span>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
            Attendance Details
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Working Days:</span>
              <span className="font-medium">{safeAttendance.workingDays}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Overtime Hours:</span>
              <span className="font-medium">{safeAttendance.overtimeHours}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">No Pay Days:</span>
              <span className="font-medium">{safeAttendance.noPayDays}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Salary Breakdown */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Earnings */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
            Earnings
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Basic Salary:</span>
              <span className="font-medium">{formatCurrency(safeSalary.basic)}</span>
            </div>
            
            {safeSalary.allowances.food > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Food Allowance:</span>
                <span className="font-medium">{formatCurrency(safeSalary.allowances.food)}</span>
              </div>
            )}
            
            {safeSalary.allowances.medical > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Medical Allowance:</span>
                <span className="font-medium">{formatCurrency(safeSalary.allowances.medical)}</span>
              </div>
            )}
            
            {safeSalary.allowances.cola > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">COLA:</span>
                <span className="font-medium">{formatCurrency(safeSalary.allowances.cola)}</span>
              </div>
            )}
            
            {safeSalary.perks.overtime > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Overtime Pay:</span>
                <span className="font-medium">{formatCurrency(safeSalary.perks.overtime)}</span>
              </div>
            )}
            
            {safeSalary.perks.bonus > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Bonus:</span>
                <span className="font-medium">{formatCurrency(safeSalary.perks.bonus)}</span>
              </div>
            )}
            
            <div className="border-t border-gray-200 pt-2 font-semibold">
              <div className="flex justify-between">
                <span>Total Earnings:</span>
                <span>{formatCurrency(safeTotals.grossSalary)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Deductions */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
            Deductions
          </h3>
          <div className="space-y-3">
            {safeSalary.deductions.noPay > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">No Pay Deduction:</span>
                <span className="font-medium">{formatCurrency(safeSalary.deductions.noPay)}</span>
              </div>
            )}
            
            {safeStatutory.epfEmployee > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">EPF (8%):</span>
                <span className="font-medium">{formatCurrency(safeStatutory.epfEmployee)}</span>
              </div>
            )}
            
            {safeSalary.deductions.loans > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Loans & Advances:</span>
                <span className="font-medium">{formatCurrency(safeSalary.deductions.loans)}</span>
              </div>
            )}
            
            <div className="border-t border-gray-200 pt-2 font-semibold">
              <div className="flex justify-between">
                <span>Total Deductions:</span>
                <span>{formatCurrency(safeTotals.totalDeductions)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Net Salary */}
      <div className="bg-green-50 rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">Net Salary:</h3>
          <span className="text-2xl font-bold text-green-600">
            {formatCurrency(safeTotals.netSalary)}
          </span>
        </div>
      </div>

      {/* Employer Contributions (Information Only) */}
      <div className="bg-blue-50 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Employer Contributions (Information Only)
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex justify-between">
            <span className="text-gray-600">EPF (12%):</span>
            <span className="font-medium">{formatCurrency(safeStatutory.epfEmployer)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">ETF (3%):</span>
            <span className="font-medium">{formatCurrency(safeStatutory.etfEmployer)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t-2 border-gray-200 pt-4 text-center text-sm text-gray-500">
        <p>This is a computer-generated salary slip and does not require a signature.</p>
        <p className="mt-2">For any queries, please contact the HR department.</p>
      </div>
    </div>
  );
});

AgentSalarySlip.displayName = 'AgentSalarySlip';

export default AgentSalarySlip;