import { useState, useEffect } from 'react';

export default function AdminSalaryManagement() {
  const [salaries, setSalaries] = useState([]);
  const [agents, setAgents] = useState([]);
  const [filteredSalaries, setFilteredSalaries] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Load initial data
  useEffect(() => {
    Promise.all([loadSalaries(), loadAgents()]);
  }, []);

  // Filter salaries when filters change
  useEffect(() => {
    let filtered = salaries;
    
    if (selectedMonth) {
      filtered = filtered.filter(salary => salary.attendance.month === selectedMonth);
    }
    
    if (selectedAgent) {
      filtered = filtered.filter(salary => salary.pickupAgentId === selectedAgent);
    }
    
    setFilteredSalaries(filtered);
  }, [salaries, selectedMonth, selectedAgent]);

  const loadSalaries = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/salaries', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to load salaries');
      
      const data = await response.json();
      setSalaries(data.data || []);
    } catch (error) {
      console.error('Error loading salaries:', error);
      setError('Failed to load salary records');
    } finally {
      setLoading(false);
    }
  };

  const loadAgents = async () => {
    try {
      const response = await fetch('/api/admin/agents', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to load agents');
      
      const data = await response.json();
      setAgents(data.data || []);
    } catch (error) {
      console.error('Error loading agents:', error);
      setError('Failed to load agent data');
    }
  };

  const handleEdit = (salary) => {
    setEditingId(salary._id);
    setEditData({
      'attendance.workingDays': salary.attendance.workingDays,
      'attendance.overtimeHours': salary.attendance.overtimeHours,
      'attendance.noPayDays': salary.attendance.noPayDays,
      'salary.basic': salary.salary.basic,
      'salary.deductions.noPay': salary.salary.deductions.noPay,
      'salary.deductions.loans': salary.salary.deductions.loans,
      'salary.allowances.food': salary.salary.allowances.food,
      'salary.allowances.medical': salary.salary.allowances.medical,
      'salary.allowances.cola': salary.salary.allowances.cola,
      'salary.perks.overtime': salary.salary.perks.overtime,
      'salary.perks.bonus': salary.salary.perks.bonus
    });
  };

  const handleSave = async (salaryId) => {
    try {
      setError('');
      const response = await fetch(`/api/admin/salaries/${salaryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(editData)
      });

      if (!response.ok) throw new Error('Failed to update salary');

      const result = await response.json();
      setSuccess('Salary updated successfully');
      setEditingId(null);
      setEditData({});
      
      // Update local state
      setSalaries(prev => prev.map(salary => 
        salary._id === salaryId ? result.data : salary
      ));
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating salary:', error);
      setError('Failed to update salary');
    }
  };

  const handleDelete = async (salaryId) => {
    if (!window.confirm('Are you sure you want to delete this salary record?')) return;
    
    try {
      setError('');
      const response = await fetch(`/api/admin/salaries/${salaryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete salary');

      setSuccess('Salary record deleted successfully');
      setSalaries(prev => prev.filter(salary => salary._id !== salaryId));
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error deleting salary:', error);
      setError('Failed to delete salary record');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading salary records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Salary Management</h2>
          <p className="text-gray-600 mt-1">Manage and monitor agent salary records</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Total Records</p>
          <p className="text-2xl font-bold text-green-600">{salaries.length}</p>
        </div>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All Months</option>
              {months.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Agent</label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All Agents</option>
              {agents.map(agent => (
                <option key={agent.agentId} value={agent.agentId}>
                  {agent.name} ({agent.agentId})
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {(selectedMonth || selectedAgent) && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {filteredSalaries.length} of {salaries.length} records
            </p>
            <button
              onClick={() => {
                setSelectedMonth('');
                setSelectedAgent('');
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Salary Cards */}
      {filteredSalaries.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Salary Records Found</h3>
          <p className="text-gray-600">No salary records match your current filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredSalaries.map((salary) => (
            <div key={salary._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
              {/* Card Header */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{salary.employee.name}</h3>
                    <p className="text-green-100 text-sm">Agent ID: {salary.pickupAgentId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-100 text-sm">Month</p>
                    <p className="font-semibold">{salary.attendance.month}</p>
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-6">
                {editingId === salary._id ? (
                  /* Edit Mode */
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Working Days</label>
                        <input
                          type="number"
                          value={editData['attendance.workingDays'] || ''}
                          onChange={(e) => setEditData(prev => ({...prev, 'attendance.workingDays': Number(e.target.value)}))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Overtime Hours</label>
                        <input
                          type="number"
                          value={editData['attendance.overtimeHours'] || ''}
                          onChange={(e) => setEditData(prev => ({...prev, 'attendance.overtimeHours': Number(e.target.value)}))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Basic Salary</label>
                        <input
                          type="number"
                          value={editData['salary.basic'] || ''}
                          onChange={(e) => setEditData(prev => ({...prev, 'salary.basic': Number(e.target.value)}))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Food Allowance</label>
                        <input
                          type="number"
                          value={editData['salary.allowances.food'] || ''}
                          onChange={(e) => setEditData(prev => ({...prev, 'salary.allowances.food': Number(e.target.value)}))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSave(salary._id)}
                        className="px-3 py-1 text-sm text-white bg-green-600 rounded hover:bg-green-700"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <div className="space-y-4">
                    {/* Attendance Information */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Attendance</h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <p className="text-gray-500">Working Days</p>
                          <p className="font-semibold text-lg">{salary.attendance.workingDays}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-500">Overtime Hours</p>
                          <p className="font-semibold text-lg">{salary.attendance.overtimeHours}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-500">No Pay Days</p>
                          <p className="font-semibold text-lg text-red-600">{salary.attendance.noPayDays}</p>
                        </div>
                      </div>
                    </div>

                    {/* Salary Breakdown */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Salary Breakdown</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Basic Salary:</span>
                          <span className="font-medium">{formatCurrency(salary.salary.basic)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Food Allowance:</span>
                          <span className="font-medium">{formatCurrency(salary.salary.allowances.food)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Medical Allowance:</span>
                          <span className="font-medium">{formatCurrency(salary.salary.allowances.medical)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Overtime Pay:</span>
                          <span className="font-medium">{formatCurrency(salary.salary.perks.overtime)}</span>
                        </div>
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">EPF Deduction:</span>
                            <span className="font-medium text-red-600">-{formatCurrency(salary.salary.deductions.epf)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">No Pay Deduction:</span>
                            <span className="font-medium text-red-600">-{formatCurrency(salary.salary.deductions.noPay)}</span>
                          </div>
                        </div>
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between text-lg font-semibold">
                            <span>Net Salary:</span>
                            <span className="text-green-600">{formatCurrency(salary.totals.netSalary)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Partner Information */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Partner Information</h4>
                      <p className="text-sm text-gray-600">
                        Partner: {salary.pickupPartner?.name || 'Not assigned'}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-2 pt-4 border-t">
                      <button
                        onClick={() => handleEdit(salary)}
                        className="px-4 py-2 text-sm text-blue-600 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
                      >
                        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(salary._id)}
                        className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}