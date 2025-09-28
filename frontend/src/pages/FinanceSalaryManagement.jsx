import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../lib/api';
import { SalaryCalculator } from '../lib/salaryCalculator';
import jsPDF from 'jspdf';
import logoPng from '../assets/images/logos/trash2cash_logo.png';

export default function FinanceSalaryManagement() {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  // Real-time calculation preview for editing (similar to SalaryCalculation.jsx)
  const editPreviewCalculation = useMemo(() => {
    if (!editData.salary?.basic || editId === null) return null;

    const statutory = SalaryCalculator.calculateStatutory(editData.salary);
    const totals = SalaryCalculator.calculateTotals(editData.salary, statutory);

    return {
      statutory,
      totals,
      formattedAmounts: {
        basic: SalaryCalculator.formatCurrency(editData.salary.basic),
        totalAllowances: SalaryCalculator.formatCurrency(totals.totalAllowances),
        totalDeductions: SalaryCalculator.formatCurrency(totals.totalDeductions),
        netSalary: SalaryCalculator.formatCurrency(totals.netSalary)
      }
    };
  }, [editData, editId]);

  // Filter salaries based on search term and selected month
  const filteredSalaries = useMemo(() => {
    return salaries.filter(salary => {
      const matchesSearch = searchTerm === '' || 
        salary.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        salary.employee?.agentId?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesMonth = selectedMonth === '' || 
        salary.attendance?.month?.toLowerCase() === selectedMonth.toLowerCase();
      
      return matchesSearch && matchesMonth;
    });
  }, [salaries, searchTerm, selectedMonth]);

  // Get unique months from all salary records for filter dropdown
  const availableMonths = useMemo(() => {
    const months = [...new Set(salaries.map(salary => salary.attendance?.month).filter(Boolean))];
    return months.sort();
  }, [salaries]);

  // Fetch all salary records (admin)
  useEffect(() => {
    loadSalaries();
  }, []);

  const loadSalaries = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/salary/admin/all');
      setSalaries(res.data.data || []);
    } catch (error) {
      console.error('Error loading salaries:', error);
      setError('Failed to load salary records');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (salary) => {
    setEditId(salary._id);
    
    // Auto-fill edit data with proper structure matching SalaryCalculation logic
    const editFormData = {
      _id: salary._id,
      employee: {
        name: salary.employee?.name || '',
        agentId: salary.employee?.agentId || '',
        email: salary.employee?.email || '',
        epfNo: salary.employee?.epfNo || ''
      },
      attendance: {
        month: salary.attendance?.month || SalaryCalculator.getCurrentMonth(),
        workingDays: salary.attendance?.workingDays || 22,
        overtimeHours: salary.attendance?.overtimeHours || 0,
        noPayDays: salary.attendance?.noPayDays || 0
      },
      salary: {
        basic: salary.salary?.basic || 0,
        deductions: {
          noPay: salary.salary?.deductions?.noPay || 0,
          epf: salary.salary?.deductions?.epf || 0,
          etf: salary.salary?.deductions?.etf || 0,
          loans: salary.salary?.deductions?.loans || 0
        },
        allowances: {
          food: salary.salary?.allowances?.food || 0,
          medical: salary.salary?.allowances?.medical || 0,
          cola: salary.salary?.allowances?.cola || 0
        },
        perks: {
          overtime: salary.salary?.perks?.overtime || 0,
          bonus: salary.salary?.perks?.bonus || 0
        }
      },
      totals: salary.totals || {}
    };

    setEditData(editFormData);
  };

  // Update form data with real-time calculations (similar to SalaryCalculation.jsx)
  const updateEditData = (path, value) => {
    setEditData(prev => {
      const keys = path.split('.');
      const updated = { ...prev };
      let current = updated;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;

      // Auto-calculate dependent values when attendance or salary changes
      if (path === 'attendance.overtimeHours' && updated.salary?.basic && updated.attendance?.workingDays) {
        const overtimePay = SalaryCalculator.calculateOvertime(
          updated.salary.basic,
          updated.attendance.workingDays,
          Number(value)
        );
        updated.salary.perks.overtime = overtimePay;
      }

      if (path === 'attendance.noPayDays' && updated.salary?.basic && updated.attendance?.workingDays) {
        const noPayDeduction = SalaryCalculator.calculateNoPayDeduction(
          updated.salary.basic,
          updated.attendance.workingDays,
          Number(value)
        );
        updated.salary.deductions.noPay = noPayDeduction;
      }

      // Recalculate EPF when basic salary or allowances change
      if (path.startsWith('salary.basic') || path.startsWith('salary.allowances') || path.startsWith('salary.perks.bonus')) {
        const statutory = SalaryCalculator.calculateStatutory(updated.salary);
        updated.salary.deductions.epf = statutory.epfEmployee;
        updated.salary.deductions.etf = 0; // ETF is employer contribution, not deducted from employee
      }

      // Recalculate totals
      const statutory = SalaryCalculator.calculateStatutory(updated.salary);
      const totals = SalaryCalculator.calculateTotals(updated.salary, statutory);
      updated.totals = totals;

      return updated;
    });
    setError('');
    setSuccess('');
  };

  const handleEditSave = async () => {
    try {
      setError('');
      
      // Validate form data
      const validation = SalaryCalculator.validateSalaryData({
        employee: editData.employee,
        attendance: editData.attendance,
        salary: editData.salary
      });
      
      if (!validation.isValid) {
        setError(validation.errors.join(', '));
        return;
      }

      // Prepare salary data with calculated totals (similar to SalaryCalculation.jsx)
      const statutory = SalaryCalculator.calculateStatutory(editData.salary);
      const totals = SalaryCalculator.calculateTotals(editData.salary, statutory);
      
      const salaryData = {
        ...editData,
        statutory,
        totals,
        // Ensure EPF deductions are updated with calculated values
        salary: {
          ...editData.salary,
          deductions: {
            ...editData.salary.deductions,
            epf: statutory.epfEmployee // Update with calculated EPF
          }
        }
      };

      await api.put(`/api/salary/admin/${editId}`, salaryData);
      setSuccess(`Salary updated successfully! Net Salary: ${SalaryCalculator.formatCurrency(totals.netSalary)}`);
      setEditId(null);
      loadSalaries();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating salary:', error);
      setError('Failed to update salary');
    }
  };

  const handleDelete = async (salaryId) => {
    if (!window.confirm('Are you sure you want to delete this salary record?')) return;
    try {
      setDeleteLoading(salaryId);
      setError('');
      await api.delete(`/api/salary/admin/${salaryId}`);
      setSuccess('Salary deleted successfully');
      setSalaries(prev => prev.filter(s => s._id !== salaryId));
      setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
      console.error('Error deleting salary:', error);
      setError('Failed to delete salary record');
    } finally {
      setDeleteLoading(null);
    }
  };

  // Salary Management Report Generation Function
  const generateSalaryReport = () => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;

      // Helper function for currency formatting
      const formatCurrency = (amount) => {
        return `Rs. ${Number(amount || 0).toLocaleString('en-LK', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`;
      };

      // Header with company branding (similar to AgentSalarySlip)
      doc.setFillColor(25, 46, 94);
      doc.rect(0, 0, pageWidth, 35, 'F');
      
      // Company logo area
      try {
        doc.setFillColor(255, 255, 255);
        doc.circle(25, 18, 8, 'F');
        doc.addImage(logoPng, 'PNG', 19, 12, 12, 12);
      } catch (error) {
        // Fallback to text if logo fails to load
        console.warn('Logo failed to load, using fallback:', error);
        doc.setFillColor(255, 255, 255);
        doc.circle(25, 18, 6, 'F');
        doc.setFillColor(25, 46, 94);
        doc.setFontSize(8);
        doc.text('T2C', 22, 19);
      }
      
      // Company name and title
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('TRASH2CASH', 40, 16);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('No 23/A, Kandy Road, Malabe', 40, 22);
      
      
      // Document title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('SALARY MANAGEMENT REPORT', pageWidth - 15, 16, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const currentDate = new Date().toLocaleDateString();
      const filterText = selectedMonth || 'All Months';
      doc.text(`Period: ${filterText}`, pageWidth - 15, 25, { align: 'right' });
      doc.text(`Generated: ${currentDate}`, pageWidth - 15, 31, { align: 'right' });

      yPosition = 50;

      // Executive Summary Section
      doc.setTextColor(25, 46, 94);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('SALARY SUMMARY', 20, yPosition);
      doc.setDrawColor(25, 46, 94);
      doc.setLineWidth(1);
      doc.line(20, yPosition + 2, pageWidth - 20, yPosition + 2);
      yPosition += 15;

      // Calculate summary statistics
      const totalEmployees = filteredSalaries.length;
      const totalBasicSalary = filteredSalaries.reduce((sum, salary) => sum + (salary.salary?.basic || 0), 0);
      const totalAllowances = filteredSalaries.reduce((sum, salary) => sum + (salary.totals?.totalAllowances || 0), 0);
      const totalDeductions = filteredSalaries.reduce((sum, salary) => sum + (salary.totals?.totalDeductions || 0), 0);
      const totalNetSalary = filteredSalaries.reduce((sum, salary) => sum + (salary.totals?.netSalary || 0), 0);
      const avgNetSalary = totalEmployees > 0 ? totalNetSalary / totalEmployees : 0;

      // Summary box with colored background
      doc.setFillColor(248, 249, 252);
      doc.rect(20, yPosition - 5, pageWidth - 40, 50, 'F');
      doc.setDrawColor(25, 46, 94);
      doc.setLineWidth(0.5);
      doc.rect(20, yPosition - 5, pageWidth - 40, 50, 'S');

      doc.setTextColor(51, 65, 85);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      // Two-column layout for summary
      const leftCol = 25, rightCol = pageWidth / 2 + 10;
      
      doc.text(`Total Employees: ${totalEmployees}`, leftCol, yPosition + 5);
      doc.text(`Average Net Salary: ${formatCurrency(avgNetSalary)}`, rightCol, yPosition + 5);
      
      doc.text(`Total Basic Salary: ${formatCurrency(totalBasicSalary)}`, leftCol, yPosition + 15);
      doc.text(`Total Allowances: ${formatCurrency(totalAllowances)}`, rightCol, yPosition + 15);
      
      doc.text(`Total Deductions: ${formatCurrency(totalDeductions)}`, leftCol, yPosition + 25);
      doc.text(`Total Net Salary: ${formatCurrency(totalNetSalary)}`, rightCol, yPosition + 25);
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(25, 46, 94);
      doc.text(`Payroll Period: ${filterText}`, leftCol, yPosition + 35);

      yPosition += 65;

      // Employee Salary Details Table
      if (filteredSalaries.length > 0) {
        doc.setTextColor(25, 46, 94);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('EMPLOYEE SALARY DETAILS', 20, yPosition);
        yPosition += 15;

        // Table headers with background
        doc.setFillColor(25, 46, 94);
        doc.rect(20, yPosition - 5, pageWidth - 40, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        
        doc.text('Employee', 25, yPosition + 2);
        doc.text('Agent ID', 80, yPosition + 2);
        doc.text('Month', 130, yPosition + 2);
        doc.text('Net Salary', pageWidth - 25, yPosition + 2, { align: 'right' });
        
        yPosition += 15;

        // Table rows
        doc.setTextColor(51, 65, 85);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);

        filteredSalaries.forEach((salary, index) => {
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = 20;
          }

          // Alternate row colors
          if (index % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(20, yPosition - 3, pageWidth - 40, 10, 'F');
          }

          // Truncate long names for table display
          const displayName = salary.employee?.name?.length > 12 ? 
            salary.employee?.name?.substring(0, 12) + '...' : salary.employee?.name || 'Unknown';
          
          doc.text(displayName, 25, yPosition + 3);
          doc.text(salary.employee?.agentId || 'N/A', 80, yPosition + 3);
          doc.text(salary.attendance?.month || 'N/A', 130, yPosition + 3);
          doc.text(formatCurrency(salary.totals?.netSalary || 0), pageWidth - 25, yPosition + 3, { align: 'right' });
          
          yPosition += 10;
        });

        yPosition += 10;
      }

      // Monthly Analysis (if multiple months available)
      if (availableMonths.length > 1) {
        if (yPosition > pageHeight - 80) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setTextColor(25, 46, 94);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('MONTHLY ANALYSIS', 20, yPosition);
        doc.setDrawColor(25, 46, 94);
        doc.line(20, yPosition + 2, pageWidth - 20, yPosition + 2);
        yPosition += 15;

        const monthlyStats = availableMonths.map(month => {
          const monthSalaries = salaries.filter(s => s.attendance?.month === month);
          const monthTotal = monthSalaries.reduce((sum, s) => sum + (s.totals?.netSalary || 0), 0);
          const monthEmployees = monthSalaries.length;
          const monthAvg = monthEmployees > 0 ? monthTotal / monthEmployees : 0;
          
          return { month, total: monthTotal, employees: monthEmployees, average: monthAvg };
        });

        // Monthly summary table
        doc.setFillColor(25, 46, 94);
        doc.rect(20, yPosition - 5, pageWidth - 40, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        
        doc.text('Month', 25, yPosition + 2);
        doc.text('Employees', 80, yPosition + 2);
        doc.text('Total Salary', 120, yPosition + 2);
        doc.text('Average', pageWidth - 25, yPosition + 2, { align: 'right' });
        
        yPosition += 15;

        doc.setTextColor(51, 65, 85);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);

        monthlyStats.forEach((stat, index) => {
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = 20;
          }

          if (index % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(20, yPosition - 3, pageWidth - 40, 10, 'F');
          }

          doc.text(stat.month, 25, yPosition + 3);
          doc.text(stat.employees.toString(), 80, yPosition + 3);
          doc.text(formatCurrency(stat.total), 120, yPosition + 3);
          doc.text(formatCurrency(stat.average), pageWidth - 25, yPosition + 3, { align: 'right' });
          
          yPosition += 10;
        });

        yPosition += 15;
      }

      // Performance Metrics
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setTextColor(25, 46, 94);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('PERFORMANCE METRICS', 20, yPosition);
      doc.setDrawColor(25, 46, 94);
      doc.line(20, yPosition + 2, pageWidth - 20, yPosition + 2);
      yPosition += 15;

      doc.setTextColor(51, 65, 85);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      
      // Calculate metrics
      const totalOvertimeHours = filteredSalaries.reduce((sum, s) => sum + (s.attendance?.overtimeHours || 0), 0);
      const totalWorkingDays = filteredSalaries.reduce((sum, s) => sum + (s.attendance?.workingDays || 0), 0);
      const avgWorkingDays = totalEmployees > 0 ? totalWorkingDays / totalEmployees : 0;
      const totalOvertimePay = filteredSalaries.reduce((sum, s) => sum + (s.salary?.perks?.overtime || 0), 0);
      
      // Highest and lowest salaries
      const salaryAmounts = filteredSalaries.map(s => s.totals?.netSalary || 0).filter(s => s > 0);
      const highestSalary = salaryAmounts.length > 0 ? Math.max(...salaryAmounts) : 0;
      const lowestSalary = salaryAmounts.length > 0 ? Math.min(...salaryAmounts) : 0;
      
      doc.text(`• Total Overtime Hours: ${totalOvertimeHours} hours`, 25, yPosition);
      yPosition += 8;
      doc.text(`• Total Overtime Pay: ${formatCurrency(totalOvertimePay)}`, 25, yPosition);
      yPosition += 8;
      doc.text(`• Average Working Days per Employee: ${avgWorkingDays.toFixed(1)} days`, 25, yPosition);
      yPosition += 8;
      doc.text(`• Highest Net Salary: ${formatCurrency(highestSalary)}`, 25, yPosition);
      yPosition += 8;
      doc.text(`• Lowest Net Salary: ${formatCurrency(lowestSalary)}`, 25, yPosition);
      yPosition += 8;
      doc.text(`• Salary Range: ${formatCurrency(highestSalary - lowestSalary)}`, 25, yPosition);

      yPosition += 20;

      // Authorized Signature Section
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setTextColor(25, 46, 94);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('AUTHORIZATION', 20, yPosition);
      yPosition += 15;

      // Signature area with professional layout
      doc.setFillColor(248, 250, 252);
      doc.rect(20, yPosition - 5, pageWidth - 40, 40, 'F');
      doc.setDrawColor(25, 46, 94);
      doc.setLineWidth(0.5);
      doc.rect(20, yPosition - 5, pageWidth - 40, 40, 'S');

      doc.setTextColor(51, 65, 85);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      
      // Left side - Prepared by
      doc.text('Prepared by:', 25, yPosition + 8);
      doc.text('HR Department', 25, yPosition + 15);
      doc.text(`Date: ${currentDate}`, 25, yPosition + 22);
      
      // Signature line
      doc.setDrawColor(100, 100, 100);
      doc.setLineWidth(0.5);
      doc.line(25, yPosition + 28, 85, yPosition + 28);
      doc.setFontSize(7);
      doc.text('Signature', 25, yPosition + 32);

      // Right side - Approved by
      doc.setFontSize(9);
      doc.text('Approved by:', pageWidth - 95, yPosition + 8);
      doc.text('Finance Manager', pageWidth - 95, yPosition + 15);
      doc.text('Date: _______________', pageWidth - 95, yPosition + 22);
      
      // Signature line
      doc.line(pageWidth - 95, yPosition + 28, pageWidth - 35, yPosition + 28);
      doc.setFontSize(7);
      doc.text('Signature', pageWidth - 95, yPosition + 32);

      yPosition += 50;

      // Professional Footer
      if (yPosition > pageHeight - 25) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFillColor(248, 250, 252);
      doc.rect(0, yPosition, pageWidth, 15, 'F');
      doc.setDrawColor(25, 46, 94);
      doc.setLineWidth(0.3);
      doc.line(0, yPosition, pageWidth, yPosition);
      
      doc.setTextColor(51, 65, 85);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text('TRASH2CASH | hr@trash2cash.com | +94 11 234 5678', pageWidth / 2, yPosition + 5, { align: 'center' });
      
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(6);
      doc.text('Computer-generated document. For inquiries contact HR department.', pageWidth / 2, yPosition + 10, { align: 'center' });

      // Generate professional filename
      const timestamp = new Date().toISOString().slice(0, 7); // YYYY-MM format
      const monthFilter = selectedMonth ? `_${selectedMonth.replace(/[^a-zA-Z0-9]/g, '_')}` : '_AllMonths';
      const filename = `SalaryManagement_Report${monthFilter}_${timestamp}.pdf`;

      // Save the PDF
      doc.save(filename);
      toast.success('Salary management report generated successfully!');
      
    } catch (error) {
      console.error('Error generating salary report:', error);
      toast.error('Failed to generate salary report. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
          Salary Management
        </h1>
        <p className="text-lg text-slate-600">View, edit, and delete salary records for all employees</p>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search by Employee Name or Agent ID
            </label>
            <div className="relative">
              <input
                id="search"
                type="text"
                placeholder="Enter employee name or agent ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <div className="w-full md:w-64">
            <label htmlFor="monthFilter" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Month
            </label>
            <select
              id="monthFilter"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full py-3 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            >
              <option value="">All Months</option>
              {availableMonths.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-end gap-3">
            {/* Generate Report Button */}
            <button
              onClick={generateSalaryReport}
              className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center gap-2 shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Generate Report
            </button>

            {/* Clear Filters Button */}
            {(searchTerm || selectedMonth) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedMonth('');
                }}
                className="px-4 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all duration-200 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Search Results Summary */}
        <div className="mt-4 text-sm text-gray-600">
          {searchTerm || selectedMonth ? (
            <p>
              Showing {filteredSalaries.length} of {salaries.length} records
              {searchTerm && ` matching "${searchTerm}"`}
              {selectedMonth && ` for ${selectedMonth}`}
            </p>
          ) : (
            <p>Showing all {salaries.length} records</p>
          )}
        </div>
      </div>

      {error && <div className="mb-4 text-red-600 font-medium">{error}</div>}
      {success && <div className="mb-4 text-green-600 font-medium">{success}</div>}
      {salaries.length === 0 ? (
        <div className="text-center py-16 text-slate-500">No salary records found.</div>
      ) : filteredSalaries.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-lg font-medium text-gray-600 mb-2">No matching records found</p>
          <p className="text-gray-500">
            {searchTerm && selectedMonth 
              ? `Try adjusting your search for "${searchTerm}" or selected month "${selectedMonth}"`
              : searchTerm 
                ? `No results found for "${searchTerm}"`
                : `No records found for "${selectedMonth}"`
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {filteredSalaries.map((salary) => (
            <div key={salary._id} className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              {/* Card Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{salary.employee?.name}</h3>
                  <div className="flex space-x-4 text-sm text-slate-600 mt-1">
                    <span>ID: {salary.employee?.agentId}</span>
                    <span>EPF: {salary.employee?.epfNo}</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{salary.employee?.email}</p>
                </div>
                <span className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-medium rounded-full">
                  {salary.attendance?.month}
                </span>
              </div>

              {/* Card Body */}
              {editId === salary._id ? (
                <div className="space-y-6">
                  {/* Employee Details */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Employee Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-600 flex items-center gap-1">
                          Name
                        </label>
                        <input
                          type="text"
                          value={editData.employee?.name || ''}
                          readOnly
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-100 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600 flex items-center gap-1">
                          Agent ID
                        </label>
                        <input
                          type="text"
                          value={editData.employee?.agentId || ''}
                          readOnly
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-100 cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Attendance */}
                  <div className="bg-blue-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Attendance</h4>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-sm text-gray-600">Month</label>
                        <select
                          value={editData.attendance?.month || ''}
                          onChange={e => updateEditData('attendance.month', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                        >
                          {['January','February','March','April','May','June','July','August','September','October','November','December'].map((month) => 
                            <option key={month} value={month}>{month}</option>
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Working Days</label>
                        <input
                          type="number"
                          value={editData.attendance?.workingDays || ''}
                          onChange={e => updateEditData('attendance.workingDays', Number(e.target.value))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          min="0" max="31"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-600">Overtime Hours</label>
                        <input
                          type="number"
                          value={editData.attendance?.overtimeHours || ''}
                          onChange={e => updateEditData('attendance.overtimeHours', Number(e.target.value))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">No Pay Days</label>
                        <input
                          type="number"
                          value={editData.attendance?.noPayDays || ''}
                          onChange={e => updateEditData('attendance.noPayDays', Number(e.target.value))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Salary Details */}
                  <div className="bg-green-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Salary & Allowances</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-600">Basic Salary (LKR)</label>
                        <input
                          type="number"
                          value={editData.salary?.basic || ''}
                          onChange={e => updateEditData('salary.basic', Number(e.target.value))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm text-gray-600">Food Allowance</label>
                          <input
                            type="number"
                            value={editData.salary?.allowances?.food || ''}
                            onChange={e => updateEditData('salary.allowances.food', Number(e.target.value))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">Medical Allowance</label>
                          <input
                            type="number"
                            value={editData.salary?.allowances?.medical || ''}
                            onChange={e => updateEditData('salary.allowances.medical', Number(e.target.value))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">COLA</label>
                          <input
                            type="number"
                            value={editData.salary?.allowances?.cola || ''}
                            onChange={e => updateEditData('salary.allowances.cola', Number(e.target.value))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-gray-600 flex items-center gap-1">
                            Overtime Pay 
                            
                          </label>
                          <input
                            type="number"
                            value={editData.salary?.perks?.overtime || ''}
                            onChange={e => updateEditData('salary.perks.overtime', Number(e.target.value))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-blue-50"
                            placeholder="Auto-calculated from OT hours"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">Bonus</label>
                          <input
                            type="number"
                            value={editData.salary?.perks?.bonus || ''}
                            onChange={e => updateEditData('salary.perks.bonus', Number(e.target.value))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className="bg-red-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Deductions</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-600 flex items-center gap-1">
                          No Pay Deduction 
                          
                        </label>
                        <input
                          type="number"
                          value={editData.salary?.deductions?.noPay || ''}
                          onChange={e => updateEditData('salary.deductions.noPay', Number(e.target.value))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-red-50"
                          placeholder="Auto-calculated from no-pay days"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600 flex items-center gap-1">
                          EPF (8%) 
                          
                        </label>
                        <input
                          type="number"
                          value={editPreviewCalculation?.statutory.epfEmployee || editData.salary?.deductions?.epf || ''}
                          onChange={e => updateEditData('salary.deductions.epf', Number(e.target.value))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-yellow-50"
                          placeholder="Auto-calculated from basic + allowances"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600 flex items-center gap-1">
                          ETF (3%) 
                          
                        </label>
                        <input
                          type="number"
                          value={editPreviewCalculation?.statutory.etfEmployer || editData.salary?.deductions?.etf || ''}
                          readOnly
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-100 cursor-not-allowed"
                          placeholder="Employer contribution (not deducted)"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Loans & Advances</label>
                        <input
                          type="number"
                          value={editData.salary?.deductions?.loans || ''}
                          onChange={e => updateEditData('salary.deductions.loans', Number(e.target.value))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Live Preview - Real-time calculations */}
                  {editPreviewCalculation && (
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border-2 border-indigo-200 shadow-lg">
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-md">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <h4 className="text-xs font-medium text-indigo-900">Live Preview - Calculations Update Automatically</h4>
                      </div>
                      
                      {/* Main calculation cards - responsive grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
                        <div className="bg-white/80 rounded p-2 text-center border border-indigo-100 shadow-sm hover:shadow-md transition-shadow">
                          <div className="text-xs font-medium text-indigo-500 uppercase tracking-wide mb-1">Basic Salary</div>
                          <div className="text-xs font-bold text-indigo-900">{editPreviewCalculation.formattedAmounts.basic}</div>
                        </div>
                        <div className="bg-white/80 rounded p-2 text-center border border-green-100 shadow-sm hover:shadow-md transition-shadow">
                          <div className="text-xs font-medium text-green-600 uppercase tracking-wide mb-1">Total Allowances</div>
                          <div className="text-xs font-bold text-green-800">{editPreviewCalculation.formattedAmounts.totalAllowances}</div>
                        </div>
                        <div className="bg-white/80 rounded p-2 text-center border border-red-100 shadow-sm hover:shadow-md transition-shadow">
                          <div className="text-xs font-medium text-red-600 uppercase tracking-wide mb-1">Total Deductions</div>
                          <div className="text-xs font-bold text-red-800">{editPreviewCalculation.formattedAmounts.totalDeductions}</div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 rounded p-2 text-center border border-blue-300 shadow-md">
                          <div className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">Net Salary</div>
                          <div className="text-sm font-bold text-blue-900">{editPreviewCalculation.formattedAmounts.netSalary}</div>
                        </div>
                      </div>
                      
                      {/* Statutory breakdown */}
                      <div className="bg-white/50 rounded-lg p-3 border border-indigo-200">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <svg className="w-3 h-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-xs font-medium text-indigo-800">Auto-calculated Statutory Contributions</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-center">
                          <div className="bg-yellow-50 rounded p-2 border border-yellow-200">
                            <div className="text-xs font-medium text-yellow-700">EPF Employee (8%)</div>
                            <div className="text-xs font-bold text-yellow-800">{SalaryCalculator.formatCurrency(editPreviewCalculation.statutory.epfEmployee)}</div>
                          </div>
                          <div className="bg-blue-50 rounded p-2 border border-blue-200">
                            <div className="text-xs font-medium text-blue-700">EPF Employer (12%)</div>
                            <div className="text-xs font-bold text-blue-800">{SalaryCalculator.formatCurrency(editPreviewCalculation.statutory.epfEmployer)}</div>
                          </div>
                          <div className="bg-purple-50 rounded p-2 border border-purple-200">
                            <div className="text-xs font-medium text-purple-700">ETF Employer (3%)</div>
                            <div className="text-xs font-bold text-purple-800">{SalaryCalculator.formatCurrency(editPreviewCalculation.statutory.etfEmployer)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleEditSave}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-xl font-medium hover:from-gray-500 hover:to-gray-600 transition-all duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Read-only view */}
                  <div className="space-y-6">
                    {/* Attendance Info */}
                    <div className="bg-blue-50 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-800 mb-3">Attendance</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{salary.attendance?.workingDays || 0}</p>
                          <p className="text-xs text-gray-600">Working Days</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-orange-600">{salary.attendance?.overtimeHours || 0}</p>
                          <p className="text-xs text-gray-600">OT Hours</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-red-600">{salary.attendance?.noPayDays || 0}</p>
                          <p className="text-xs text-gray-600">No Pay Days</p>
                        </div>
                      </div>
                    </div>

                    {/* Salary Breakdown */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-50 rounded-xl p-4">
                        <h4 className="font-semibold text-gray-800 mb-3">Income</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Basic Salary</span>
                            <span className="font-medium">LKR {salary.salary?.basic?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Food Allowance</span>
                            <span className="font-medium">LKR {salary.salary?.allowances?.food?.toLocaleString() || '0'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Medical Allowance</span>
                            <span className="font-medium">LKR {salary.salary?.allowances?.medical?.toLocaleString() || '0'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">COLA</span>
                            <span className="font-medium">LKR {salary.salary?.allowances?.cola?.toLocaleString() || '0'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Overtime</span>
                            <span className="font-medium">LKR {salary.salary?.perks?.overtime?.toLocaleString() || '0'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Bonus</span>
                            <span className="font-medium">LKR {salary.salary?.perks?.bonus?.toLocaleString() || '0'}</span>
                          </div>
                          <div className="border-t pt-2">
                            <div className="flex justify-between">
                              <span className="font-semibold text-green-700">Total Allowances</span>
                              <span className="font-bold text-green-700">+LKR {salary.totals?.totalAllowances?.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-red-50 rounded-xl p-4">
                        <h4 className="font-semibold text-gray-800 mb-3">Deductions</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">No Pay</span>
                            <span className="font-medium">LKR {salary.salary?.deductions?.noPay?.toLocaleString() || '0'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">EPF (8%)</span>
                            <span className="font-medium">LKR {salary.salary?.deductions?.epf?.toLocaleString() || '0'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">ETF</span>
                            <span className="font-medium">LKR {salary.salary?.deductions?.etf?.toLocaleString() || '0'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Loans</span>
                            <span className="font-medium">LKR {salary.salary?.deductions?.loans?.toLocaleString() || '0'}</span>
                          </div>
                          <div className="border-t pt-2">
                            <div className="flex justify-between">
                              <span className="font-semibold text-red-700">Total Deductions</span>
                              <span className="font-bold text-red-700">-LKR {salary.totals?.totalDeductions?.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Net Salary */}
                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-6 text-center">
                      <h4 className="text-sm text-gray-600 mb-2">Net Salary</h4>
                      <p className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                        LKR {salary.totals?.netSalary?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Card Footer */}
              <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => handleEdit(salary)}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
                  disabled={editId === salary._id}
                >
                  {editId === salary._id ? 'Editing...' : 'Edit Salary'}
                </button>
                <button
                  onClick={() => handleDelete(salary._id)}
                  disabled={deleteLoading === salary._id}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50"
                >
                  {deleteLoading === salary._id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
