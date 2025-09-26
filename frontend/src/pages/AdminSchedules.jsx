import { useState, useEffect } from 'react';
import api from '../lib/api';

export default function AdminSchedules() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [wasteTypeFilter, setWasteTypeFilter] = useState('All');

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/schedules');
      setSchedules(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch schedules');
      console.error('Error fetching schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteSchedule = async (scheduleId) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) return;
    
    try {
      await api.delete(`/api/admin/schedules/${scheduleId}`);
      setSchedules(schedules.filter(schedule => schedule._id !== scheduleId));
    } catch (err) {
      setError('Failed to delete schedule');
      console.error('Error deleting schedule:', err);
    }
  };

  const updateScheduleStatus = async (scheduleId, newStatus) => {
    try {
      const response = await api.put(`/api/admin/schedules/${scheduleId}`, { 
        status: newStatus 
      });
      setSchedules(schedules.map(schedule => 
        schedule._id === scheduleId ? response.data.schedule : schedule
      ));
    } catch (err) {
      setError('Failed to update schedule status');
      console.error('Error updating schedule status:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatWasteType = (wasteType) => {
    return wasteType.charAt(0).toUpperCase() + wasteType.slice(1).replace('-', ' ');
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getWasteTypeColor = (wasteType) => {
    const colors = {
      plastic: 'bg-blue-100 text-blue-700',
      paper: 'bg-yellow-100 text-yellow-700',
      glass: 'bg-green-100 text-green-700',
      metal: 'bg-gray-100 text-gray-700',
      organic: 'bg-orange-100 text-orange-700',
      'coconut-shell': 'bg-amber-100 text-amber-700',
      'e-waste': 'bg-purple-100 text-purple-700',
      mixed: 'bg-indigo-100 text-indigo-700'
    };
    return colors[wasteType] || 'bg-gray-100 text-gray-700';
  };

  const filteredSchedules = schedules.filter(schedule => {
    const matchesSearch = 
      schedule.userId?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.userId?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.address?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || schedule.status === statusFilter;
    const matchesWasteType = wasteTypeFilter === 'All' || schedule.wasteType === wasteTypeFilter;
    
    return matchesSearch && matchesStatus && matchesWasteType;
  });

  // Statistics
  const stats = {
    total: schedules.length,
    scheduled: schedules.filter(s => s.status === 'Scheduled').length,
    completed: schedules.filter(s => s.status === 'Completed').length,
    cancelled: schedules.filter(s => s.status === 'Cancelled').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Schedule Management</h2>
          <p className="text-gray-600 mt-1">Manage user pickup schedules in the system</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-blue-600">{stats.total}</span>
          <p className="text-sm text-gray-600">Total Schedules</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center space-x-2">
            <span className="text-red-500 text-lg">⚠️</span>
            <span className="text-red-700 font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              📅
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Scheduled</p>
              <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              🕒
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              ✅
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Cancelled</p>
              <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              ❌
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">🔍</span>
            <input
              type="text"
              placeholder="Search by user name, email, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-3 px-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
          >
            <option value="All">All Status</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <select
            value={wasteTypeFilter}
            onChange={(e) => setWasteTypeFilter(e.target.value)}
            className="py-3 px-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
          >
            <option value="All">All Waste Types</option>
            <option value="plastic">Plastic</option>
            <option value="paper">Paper</option>
            <option value="glass">Glass</option>
            <option value="metal">Metal</option>
            <option value="organic">Organic</option>
            <option value="coconut-shell">Coconut Shell</option>
            <option value="e-waste">E-Waste</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>
      </div>

      {/* Schedules Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSchedules.map((schedule) => (
          <div key={schedule._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300">
            {/* Schedule Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {schedule.userId?.firstName?.[0] || 'U'}{schedule.userId?.lastName?.[0] || ''}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {schedule.userId?.firstName || 'Unknown'} {schedule.userId?.lastName || 'User'}
                  </h3>
                  <p className="text-sm text-gray-500">{schedule.userId?.email}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                {schedule.status === 'Scheduled' && (
                  <div className="relative">
                    <select
                      onChange={(e) => updateScheduleStatus(schedule._id, e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1 bg-white cursor-pointer"
                      defaultValue=""
                    >
                      <option value="" disabled>Change Status</option>
                      <option value="Completed">Mark Completed</option>
                      <option value="Cancelled">Cancel</option>
                    </select>
                  </div>
                )}
                <button
                  onClick={() => deleteSchedule(schedule._id)}
                  className="text-red-600 hover:text-red-800 transition-colors duration-200 p-1 hover:bg-red-50 rounded"
                  title="Delete Schedule"
                >
                  🗑️
                </button>
              </div>
            </div>

            {/* Schedule Details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(schedule.status)}`}>
                  {schedule.status}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Waste Type:</span>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getWasteTypeColor(schedule.wasteType)}`}>
                  {formatWasteType(schedule.wasteType)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pickup Date:</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatDate(schedule.pickupDate)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pickup Time:</span>
                <span className="text-sm font-medium text-gray-900">
                  {schedule.pickupTime} - {schedule.pickupDueTime}
                </span>
              </div>

              {schedule.estimatedWeight > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Est. Weight:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {schedule.estimatedWeight} kg
                  </span>
                </div>
              )}

              {schedule.location && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Location:</span>
                  <span className="text-sm text-gray-900">
                    {schedule.location.lat.toFixed(4)}, {schedule.location.lng.toFixed(4)}
                  </span>
                </div>
              )}

              {schedule.address && (
                <div>
                  <span className="text-sm text-gray-600">Address:</span>
                  <p className="text-sm text-gray-900 mt-1 break-words">{schedule.address}</p>
                </div>
              )}

              {schedule.notes && (
                <div>
                  <span className="text-sm text-gray-600">Notes:</span>
                  <p className="text-sm text-gray-900 mt-1 break-words">{schedule.notes}</p>
                </div>
              )}

              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Created: {formatDate(schedule.createdAt)}</span>
                  {schedule.updatedAt !== schedule.createdAt && (
                    <span>Updated: {formatDate(schedule.updatedAt)}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredSchedules.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <span className="text-6xl mb-4 block">📅</span>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No schedules found</h3>
          <p className="text-gray-500">
            {searchTerm || statusFilter !== 'All' || wasteTypeFilter !== 'All' 
              ? 'Try adjusting your search or filters' 
              : 'No schedules have been created yet'}
          </p>
        </div>
      )}
    </div>
  );
}