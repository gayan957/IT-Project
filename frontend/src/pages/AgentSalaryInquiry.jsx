import { useState, useEffect } from 'react';
import { salaryApi } from '../lib/salaryApi';
import { ErrorMessage, SuccessMessage } from '../components/SalaryComponents';
import AgentSalarySlip, { downloadPaySlipPdf } from '../components/AgentSalarySlip';

export default function AgentSalaryInquiry() {
  const [salaries, setSalaries] = useState([]);
  const [filteredSalaries, setFilteredSalaries] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [printingSlip, setPrintingSlip] = useState(null);

  // Load agent's salary records
  useEffect(() => {
    loadAgentSalaries();
  }, []);

  const loadAgentSalaries = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await salaryApi.getAgentSalaries();
      setSalaries(response.data || []);
      setFilteredSalaries(response.data || []);
    } catch (error) {
      console.error('Error loading salaries:', error);
      setError('Failed to load salary records');
    } finally {
      setLoading(false);
    }
  };

  // Filter by month
  useEffect(() => {
    if (selectedMonth) {
      setFilteredSalaries(salaries.filter(salary => 
        salary.attendance.month === selectedMonth
      ));
    } else {
      setFilteredSalaries(salaries);
    }
  }, [selectedMonth, salaries]);

  // Handle print salary slip
  const handlePrintSlip = async (salaryData) => {
    if (!salaryData) {
      setError('No salary data available for printing');
      return;
    }

    try {
      console.log('Starting print process for salary:', salaryData._id);
      setPrintingSlip(salaryData._id);
      setError(''); // Clear any previous errors
      
      console.log('Attempting to generate PDF...');
      await downloadPaySlipPdf({ 
        slip: salaryData
      });
      
      setSuccess('Salary slip downloaded successfully!');
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (error) {
      console.error('Error in handlePrintSlip:', error);
      setError(`Failed to generate salary slip: ${error.message}`);
    } finally {
      setPrintingSlip(null);
    }
  };

  const formatCurrency = (amount) => {
    return `Rs. ${Number(amount || 0).toLocaleString('en-LK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-900 to-pink-700 bg-clip-text text-transparent mb-3">
            Salary Inquiry
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            View and download your salary records and payment slips
          </p>
        </div>

        {/* Messages */}
        <ErrorMessage message={error} />
        <SuccessMessage message={success} />

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Filter by Month:</span>
            </div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-sm"
            >
              <option value="">All Months</option>
              {months.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-3 text-gray-600">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              Loading salary records...
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredSalaries.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Salary Records Found</h3>
            <p className="text-gray-600">
              {selectedMonth 
                ? `No salary records found for ${selectedMonth}. Try selecting a different month.`
                : 'No salary records have been generated yet. Contact your supervisor for more information.'
              }
            </p>
          </div>
        )}

                {/* Salary Cards */}
        {!loading && filteredSalaries.length > 0 && (
          <div className="space-y-6">
            {filteredSalaries.map((salary) => (
              <div 
                key={salary._id} 
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Card Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-200 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">📄</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">{salary.attendance.month}</h3>
                      <p className="text-sm text-gray-500">Pay Period</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Generated</p>
                    <p className="text-xs text-gray-400">{formatDate(salary.createdAt)}</p>
                  </div>
                </div>

                {/* Employee Information */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Employee Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Agent Name</p>
                      <p className="font-semibold text-gray-800">{salary.employee.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Agent ID</p>
                      <p className="font-semibold text-gray-800">{salary.employee.agentId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold text-gray-800">{salary.employee.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">EPF Number</p>
                      <p className="font-semibold text-gray-800">{salary.employee.epfNo || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Attendance Details */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Attendance Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-2xl text-green-600">✓</span>
                      </div>
                      <p className="text-sm text-gray-600">Working Days</p>
                      <p className="text-xl font-bold text-green-600">{salary.attendance.workingDays}</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-2xl text-blue-600">⏰</span>
                      </div>
                      <p className="text-sm text-gray-600">Overtime Hours</p>
                      <p className="text-xl font-bold text-blue-600">{salary.attendance.overtimeHours || 0}</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-2xl text-red-600">✗</span>
                      </div>
                      <p className="text-sm text-gray-600">No Pay Days</p>
                      <p className="text-xl font-bold text-red-600">{salary.attendance.noPayDays || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Salary Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  {/* Basic Salary & Allowances */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Basic & Allowances</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Basic Salary:</span>
                        <span className="font-semibold text-gray-800">{formatCurrency(salary.salary?.basic || 0)}</span>
                      </div>
                      <div className="border-t border-purple-200 pt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Allowances:</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Food Allowance:</span>
                            <span className="text-gray-800">{formatCurrency(salary.salary?.allowances?.food || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Medical Allowance:</span>
                            <span className="text-gray-800">{formatCurrency(salary.salary?.allowances?.medical || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">COLA:</span>
                            <span className="text-gray-800">{formatCurrency(salary.salary?.allowances?.cola || 0)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="border-t border-purple-200 pt-3">
                        <div className="flex justify-between font-semibold">
                          <span className="text-purple-700">Total Allowances:</span>
                          <span className="text-purple-700">{formatCurrency(salary.totals?.totalAllowances || 0)}</span>
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
                        <span className="font-semibold text-gray-800">{formatCurrency(salary.salary?.perks?.overtime || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bonus:</span>
                        <span className="font-semibold text-gray-800">{formatCurrency(salary.salary?.perks?.bonus || 0)}</span>
                      </div>
                      <div className="border-t border-indigo-200 pt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">EPF Details:</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">EPF Base:</span>
                            <span className="text-gray-800">{formatCurrency(salary.meta?.epfBase || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Employer EPF:</span>
                            <span className="text-gray-800">{formatCurrency(salary.meta?.epfEmployer || 0)}</span>
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
                        <span className="font-semibold text-red-600">-{formatCurrency(salary.salary?.deductions?.noPay || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">EPF (Employee):</span>
                        <span className="font-semibold text-red-600">-{formatCurrency(salary.salary?.deductions?.epf || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">ETF:</span>
                        <span className="font-semibold text-red-600">-{formatCurrency(salary.salary?.deductions?.etf || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Loans:</span>
                        <span className="font-semibold text-red-600">-{formatCurrency(salary.salary?.deductions?.loans || 0)}</span>
                      </div>
                      <div className="border-t border-red-200 pt-3">
                        <div className="flex justify-between font-semibold">
                          <span className="text-red-700">Total Deductions:</span>
                          <span className="text-red-700">-{formatCurrency(salary.totals?.totalDeductions || 0)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Salary Summary */}
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-6 mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Salary Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Gross Salary</p>
                      <p className="text-2xl font-bold text-blue-600">{formatCurrency(salary.totals?.grossSalary || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Total Deductions</p>
                      <p className="text-2xl font-bold text-red-600">-{formatCurrency(salary.totals?.totalDeductions || 0)}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-md">
                      <p className="text-sm text-gray-600 mb-2">Net Salary</p>
                      <p className="text-3xl font-bold text-green-600">{formatCurrency(salary.totals?.netSalary || 0)}</p>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => handlePrintSlip(salary)}
                    disabled={printingSlip === salary._id}
                    className="bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 px-8 rounded-xl font-medium hover:from-purple-600 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {printingSlip === salary._id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Download Salary Slip
                      </>
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