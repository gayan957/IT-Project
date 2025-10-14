import { useState, useEffect, useMemo } from 'react';
import { salaryApi } from '../lib/salaryApi';
import { ErrorMessage, SuccessMessage } from '../components/SalaryComponents';
import { generatePaySlipPdfBase64 } from '../components/AgentSalarySlip';

export default function AgentSalaries() {
  const [salaries, setSalaries] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [sendLoading, setSendLoading] = useState(null);

  // Load salary records
  useEffect(() => {
    loadSalaries();
  }, []);

  const loadSalaries = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await salaryApi.getPartnerSalaries();
      setSalaries(response.data || []);
    } catch (error) {
      console.error('Error loading salaries:', error);
      setError('Failed to load salary records');
    } finally {
      setLoading(false);
    }
  };

  // Filter salaries by search term and month
  const filteredSalaries = useMemo(() => {
    let filtered = salaries;

    // Filter by search term (agent name or ID starting with search term)
    if (searchTerm) {
      filtered = filtered.filter(salary => {
        const name = salary.employee.name.toLowerCase();
        const agentId = salary.employee.agentId.toLowerCase();
        const search = searchTerm.toLowerCase();
        return name.startsWith(search) || agentId.startsWith(search);
      });
    }

    // Filter by month
    if (selectedMonth) {
      filtered = filtered.filter(salary => 
        salary.attendance.month === selectedMonth
      );
    }

    return filtered;
  }, [salaries, searchTerm, selectedMonth]);

  // Send salary slip PDF via email
  const handleSend = async (salary) => {
    try {
      setSendLoading(salary._id);
      setError('');
      
      // Validate employee email
      if (!salary.employee.email || salary.employee.email === 'N/A') {
        throw new Error('Employee email not found. Cannot send salary slip.');
      }
      
      // Generate PDF as base64
      console.log('Generating PDF for salary:', salary);
      const pdfBase64 = await generatePaySlipPdfBase64({ slip: salary });
      
      // Send PDF via email
      console.log('Sending PDF via email...');
      await salaryApi.sendSalarySlipEmail(salary._id, pdfBase64);
      
      setSuccess(`Salary slip sent successfully to ${salary.employee.name} (${salary.employee.email})`);
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000);
      
    } catch (error) {
      console.error('Error sending salary slip:', error);
      setError(error.message || 'Failed to send salary slip via email');
    } finally {
      setSendLoading(null);
    }
  };

  // Validate search input - only allow letters, numbers, and spaces
  const handleSearchChange = (e) => {
    const value = e.target.value;
    const validPattern = /^[a-zA-Z0-9\s]*$/;
    
    if (validPattern.test(value)) {
      setSearchTerm(value);
    }
  };

  // Delete salary record
  const handleDelete = async (salaryId) => {
    if (!window.confirm('Are you sure you want to delete this salary record?')) {
      return;
    }

    try {
      setDeleteLoading(salaryId);
      setError('');
      
      await salaryApi.deleteSalary(salaryId);
      setSuccess('Salary record deleted successfully');
      
      // Remove from local state
      setSalaries(prev => prev.filter(s => s._id !== salaryId));
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (error) {
      console.error('Error deleting salary:', error);
      setError(error.message || 'Failed to delete salary record');
    } finally {
      setDeleteLoading(null);
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading salary records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-lg mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-3">
            Agent Salaries
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Manage and review salary payments for your pickup agents
          </p>
        </div>

        {/* Messages */}
        <ErrorMessage message={error} />
        <SuccessMessage message={success} />

        {/* Filters */}
        <div className="mb-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Search Section */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Search Agent
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by agent name or ID..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Month Filter Section */}
            <div className="flex-none">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Filter by Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full lg:w-48 px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">All Months</option>
                {months.map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </div>

            {/* Results Counter */}
            <div className="flex-none flex items-end">
              <div className="text-sm text-slate-600 bg-slate-50 px-4 py-2 rounded-xl">
                <span className="font-medium">{filteredSalaries.length}</span> of{' '}
                <span className="font-medium">{salaries.length}</span> records
              </div>
            </div>
          </div>
        </div>

        {/* Salary Cards */}
        {filteredSalaries.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-slate-900 mb-2">No Salary Records Found</h3>
            <p className="text-slate-600">
              {searchTerm ? (
                <>
                  No salary records found matching "<strong>{searchTerm}</strong>".
                  {selectedMonth && ` for ${selectedMonth}`}
                  <br />
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedMonth('');
                    }}
                    className="text-blue-600 hover:text-blue-700 underline mt-2 inline-block"
                  >
                    Clear filters to see all records
                  </button>
                </>
              ) : selectedMonth ? (
                <>
                  No salary records found for {selectedMonth}. 
                  <br />
                  <button
                    onClick={() => setSelectedMonth('')}
                    className="text-blue-600 hover:text-blue-700 underline mt-2 inline-block"
                  >
                    View all months
                  </button>
                </>
              ) : (
                'No salary records have been created yet.'
              )}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSalaries.map((salary) => (
              <div
                key={salary._id}
                className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{salary.employee.name}</h3>
                      <p className="text-sm text-slate-600">ID: {salary.employee.agentId}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                    {salary.attendance.month}
                  </span>
                </div>

                {/* Salary Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Basic Salary</span>
                    <span className="font-medium">LKR {salary.salary.basic.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Total Allowances</span>
                    <span className="font-medium text-green-700">+LKR {salary.totals.totalAllowances.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Total Deductions</span>
                    <span className="font-medium text-red-700">-LKR {salary.totals.totalDeductions.toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-slate-900">Net Salary</span>
                      <span className="text-xl font-bold text-emerald-700">
                        LKR {salary.totals.netSalary.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Attendance Info */}
                <div className="bg-slate-50 rounded-xl p-4 mb-6">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-600">Working Days:</span>
                      <span className="font-medium ml-2">{salary.attendance.workingDays}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">Overtime:</span>
                      <span className="font-medium ml-2">{salary.attendance.overtimeHours || 0}h</span>
                    </div>
                    <div>
                      <span className="text-slate-600">No Pay Days:</span>
                      <span className="font-medium ml-2">{salary.attendance.noPayDays || 0}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">Created:</span>
                      <span className="font-medium ml-2">
                        {new Date(salary.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  {/* Send Button */}
                  <button
                    onClick={() => handleSend(salary)}
                    disabled={sendLoading === salary._id || deleteLoading === salary._id}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-green-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendLoading === salary._id ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Sending...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Send
                      </div>
                    )}
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(salary._id)}
                    disabled={deleteLoading === salary._id || sendLoading === salary._id}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:from-red-600 hover:to-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleteLoading === salary._id ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Deleting...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </div>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}