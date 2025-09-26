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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredSalaries.map((salary) => (
              <div 
                key={salary._id} 
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Card Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-200 rounded-xl flex items-center justify-center">
                      <span className="text-lg">📄</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{salary.attendance.month}</h3>
                      <p className="text-sm text-gray-500">Pay Period</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Generated</p>
                    <p className="text-xs text-gray-400">{formatDate(salary.createdAt)}</p>
                  </div>
                </div>

                {/* Employee Info */}
                <div className="border-t border-gray-100 pt-4 mb-4">
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Agent:</span>
                      <span className="font-medium text-gray-800">{salary.employee.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ID:</span>
                      <span className="font-medium text-gray-800">{salary.employee.agentId}</span>
                    </div>
                  </div>
                </div>

                {/* Salary Summary */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">Gross Salary</p>
                      <p className="font-semibold text-purple-800">
                        {formatCurrency(salary.totals.grossSalary)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Deductions</p>
                      <p className="font-semibold text-red-600">
                        -{formatCurrency(salary.totals.totalDeductions)}
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-purple-200 mt-3 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-700">Net Salary:</span>
                      <span className="text-xl font-bold text-green-600">
                        {formatCurrency(salary.totals.netSalary)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Attendance Info */}
                <div className="text-xs text-gray-500 mb-4 grid grid-cols-3 gap-2">
                  <div>
                    <span className="block">Working Days</span>
                    <span className="font-medium text-gray-700">{salary.attendance.workingDays}</span>
                  </div>
                  <div>
                    <span className="block">Overtime Hrs</span>
                    <span className="font-medium text-gray-700">{salary.attendance.overtimeHours || 0}</span>
                  </div>
                  <div>
                    <span className="block">No Pay Days</span>
                    <span className="font-medium text-gray-700">{salary.attendance.noPayDays || 0}</span>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handlePrintSlip(salary)}
                  disabled={printingSlip === salary._id}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 px-4 rounded-xl font-medium hover:from-purple-600 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {printingSlip === salary._id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Print Salary Slip
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}