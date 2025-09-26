import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

export default function FinanceSalaryManagement() {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [deleteLoading, setDeleteLoading] = useState(null);

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
    } catch (err) {
      setError('Failed to load salary records');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (salary) => {
    setEditId(salary._id);
    setEditData({ ...salary });
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleEditSave = async () => {
    try {
      setError('');
      await api.put(`/api/salary/admin/${editId}`, editData);
      setSuccess('Salary updated successfully');
      setEditId(null);
      loadSalaries();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
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
    } catch (err) {
      setError('Failed to delete salary');
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
      {error && <div className="mb-4 text-red-600 font-medium">{error}</div>}
      {success && <div className="mb-4 text-green-600 font-medium">{success}</div>}
      {salaries.length === 0 ? (
        <div className="text-center py-16 text-slate-500">No salary records found.</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {salaries.map((salary) => (
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
                          onChange={e => setEditData({
                            ...editData,
                            employee: { ...editData.employee, name: e.target.value }
                          })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Agent ID</label>
                        <input
                          type="text"
                          value={editData.employee?.agentId || ''}
                          onChange={e => setEditData({
                            ...editData,
                            employee: { ...editData.employee, agentId: e.target.value }
                          })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Attendance */}
                  <div className="bg-blue-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Attendance</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm text-gray-600">Working Days</label>
                        <input
                          type="number"
                          value={editData.attendance?.workingDays || ''}
                          onChange={e => setEditData({
                            ...editData,
                            attendance: { ...editData.attendance, workingDays: Number(e.target.value) }
                          })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Overtime Hours</label>
                        <input
                          type="number"
                          value={editData.attendance?.overtimeHours || ''}
                          onChange={e => setEditData({
                            ...editData,
                            attendance: { ...editData.attendance, overtimeHours: Number(e.target.value) }
                          })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">No Pay Days</label>
                        <input
                          type="number"
                          value={editData.attendance?.noPayDays || ''}
                          onChange={e => setEditData({
                            ...editData,
                            attendance: { ...editData.attendance, noPayDays: Number(e.target.value) }
                          })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
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
                          onChange={e => setEditData({
                            ...editData,
                            salary: { ...editData.salary, basic: Number(e.target.value) }
                          })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm text-gray-600">Food Allowance</label>
                          <input
                            type="number"
                            value={editData.salary?.allowances?.food || ''}
                            onChange={e => setEditData({
                              ...editData,
                              salary: {
                                ...editData.salary,
                                allowances: { ...editData.salary?.allowances, food: Number(e.target.value) }
                              }
                            })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">Medical Allowance</label>
                          <input
                            type="number"
                            value={editData.salary?.allowances?.medical || ''}
                            onChange={e => setEditData({
                              ...editData,
                              salary: {
                                ...editData.salary,
                                allowances: { ...editData.salary?.allowances, medical: Number(e.target.value) }
                              }
                            })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">COLA</label>
                          <input
                            type="number"
                            value={editData.salary?.allowances?.cola || ''}
                            onChange={e => setEditData({
                              ...editData,
                              salary: {
                                ...editData.salary,
                                allowances: { ...editData.salary?.allowances, cola: Number(e.target.value) }
                              }
                            })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-gray-600">Overtime Pay</label>
                          <input
                            type="number"
                            value={editData.salary?.perks?.overtime || ''}
                            onChange={e => setEditData({
                              ...editData,
                              salary: {
                                ...editData.salary,
                                perks: { ...editData.salary?.perks, overtime: Number(e.target.value) }
                              }
                            })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">Bonus</label>
                          <input
                            type="number"
                            value={editData.salary?.perks?.bonus || ''}
                            onChange={e => setEditData({
                              ...editData,
                              salary: {
                                ...editData.salary,
                                perks: { ...editData.salary?.perks, bonus: Number(e.target.value) }
                              }
                            })}
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
                        <label className="text-sm text-gray-600">No Pay Deduction</label>
                        <input
                          type="number"
                          value={editData.salary?.deductions?.noPay || ''}
                          onChange={e => setEditData({
                            ...editData,
                            salary: {
                              ...editData.salary,
                              deductions: { ...editData.salary?.deductions, noPay: Number(e.target.value) }
                            }
                          })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">EPF</label>
                        <input
                          type="number"
                          value={editData.salary?.deductions?.epf || ''}
                          onChange={e => setEditData({
                            ...editData,
                            salary: {
                              ...editData.salary,
                              deductions: { ...editData.salary?.deductions, epf: Number(e.target.value) }
                            }
                          })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">ETF</label>
                        <input
                          type="number"
                          value={editData.salary?.deductions?.etf || ''}
                          onChange={e => setEditData({
                            ...editData,
                            salary: {
                              ...editData.salary,
                              deductions: { ...editData.salary?.deductions, etf: Number(e.target.value) }
                            }
                          })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Loans</label>
                        <input
                          type="number"
                          value={editData.salary?.deductions?.loans || ''}
                          onChange={e => setEditData({
                            ...editData,
                            salary: {
                              ...editData.salary,
                              deductions: { ...editData.salary?.deductions, loans: Number(e.target.value) }
                            }
                          })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  </div>

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
