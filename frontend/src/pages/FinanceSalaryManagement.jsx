import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { SalaryCalculator } from '../lib/salaryCalculator';

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

          {/* Clear Filters Button */}
          {(searchTerm || selectedMonth) && (
            <div className="flex items-end">
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
            </div>
          )}
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
                        <label className="text-sm text-gray-600">Name</label>
                        <input
                          type="text"
                          value={editData.employee?.name || ''}
                          onChange={e => updateEditData('employee.name', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Agent ID</label>
                        <input
                          type="text"
                          value={editData.employee?.agentId || ''}
                          onChange={e => updateEditData('employee.agentId', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
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
                            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Auto-calc</span>
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
                          <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Auto-calc</span>
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
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">Auto-calc</span>
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
                          <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Info Only</span>
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
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <h4 className="text-sm font-semibold text-indigo-900">Live Preview - Calculations Update Automatically</h4>
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="text-center p-2.5 bg-white/60 rounded-lg border border-white">
                          <p className="text-xs text-indigo-600 font-medium mb-1">Basic Salary</p>
                          <p className="text-sm font-bold text-indigo-900">{editPreviewCalculation.formattedAmounts.basic}</p>
                        </div>
                        <div className="text-center p-2.5 bg-white/60 rounded-lg border border-white">
                          <p className="text-xs text-green-600 font-medium mb-1">Total Allowances</p>
                          <p className="text-sm font-bold text-green-900">{editPreviewCalculation.formattedAmounts.totalAllowances}</p>
                        </div>
                        <div className="text-center p-2.5 bg-white/60 rounded-lg border border-white">
                          <p className="text-xs text-red-600 font-medium mb-1">Total Deductions</p>
                          <p className="text-sm font-bold text-red-900">{editPreviewCalculation.formattedAmounts.totalDeductions}</p>
                        </div>
                        <div className="text-center p-2.5 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg border-2 border-blue-300">
                          <p className="text-xs text-blue-600 font-medium mb-1">Net Salary</p>
                          <p className="text-sm font-bold text-blue-900">{editPreviewCalculation.formattedAmounts.netSalary}</p>
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-indigo-600 bg-white/40 rounded-lg p-2.5">
                        💡 <strong>Auto-calculated:</strong> EPF Employee: {SalaryCalculator.formatCurrency(editPreviewCalculation.statutory.epfEmployee)} | 
                        EPF Employer: {SalaryCalculator.formatCurrency(editPreviewCalculation.statutory.epfEmployer)} | 
                        ETF Employer: {SalaryCalculator.formatCurrency(editPreviewCalculation.statutory.etfEmployer)}
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
