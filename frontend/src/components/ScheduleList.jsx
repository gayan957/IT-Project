import { useState, useEffect } from 'react';
import { getUserSchedules, updateSchedule, deleteSchedule } from '../lib/scheduleApi';

const wasteTypeIcons = {
  plastic: '♻️',
  paper: '📄', 
  glass: '🍾',
  metal: '🔩',
  organic: '🌱',
  'coconut-shell': '🥥',
  'e-waste': '⚡',
  mixed: '🗂️'
};

const statusConfig = {
  pending: { 
    label: 'Pending', 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
    icon: '⏳',
    progress: 25,
    gradient: 'from-yellow-400 to-orange-400'
  },
  confirmed: { 
    label: 'Confirmed', 
    color: 'bg-teal-100 text-teal-800 border-teal-200', 
    icon: '✅',
    progress: 50,
    gradient: 'from-teal-400 to-emerald-400'
  },
  'in-progress': { 
    label: 'In Progress', 
    color: 'bg-cyan-100 text-cyan-800 border-cyan-200', 
    icon: '🚛',
    progress: 75,
    gradient: 'from-cyan-400 to-teal-400'
  },
  completed: { 
    label: 'Completed', 
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200', 
    icon: '🎉',
    progress: 100,
    gradient: 'from-emerald-400 to-emerald-500'
  },
  cancelled: { 
    label: 'Cancelled', 
    color: 'bg-red-100 text-red-800 border-red-200', 
    icon: '❌',
    progress: 0,
    gradient: 'from-red-400 to-red-500'
  }
};

function ScheduleList({ refreshTrigger }) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [editForm, setEditForm] = useState({
    pickupDate: '',
    pickupTime: '',
    pickupDueTime: '',
    wasteType: '',
    notes: ''
  });

  useEffect(() => {
    fetchSchedules();
  }, [refreshTrigger]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const data = await getUserSchedules();
      setSchedules(data);
      setError(null);
    } catch {
      setError('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule._id);
    setEditForm({
      pickupDate: schedule.pickupDate.split('T')[0],
      pickupTime: schedule.pickupTime,
      pickupDueTime: schedule.pickupDueTime || '',
      wasteType: schedule.wasteType,
      notes: schedule.notes || ''
    });
  };

  const handleSaveEdit = async () => {
    try {
      await updateSchedule(editingSchedule, editForm);
      setEditingSchedule(null);
      fetchSchedules(); // Refresh the list
    } catch (error) {
      console.error('Failed to update schedule:', error);
      setError('Failed to update schedule');
    }
  };

  const handleCancelEdit = () => {
    setEditingSchedule(null);
    setEditForm({
      pickupDate: '',
      pickupTime: '',
      pickupDueTime: '',
      wasteType: '',
      notes: ''
    });
  };

  const handleDelete = async (scheduleId) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      try {
        await deleteSchedule(scheduleId);
        fetchSchedules(); // Refresh the list
      } catch (error) {
        console.error('Failed to delete schedule:', error);
        setError('Failed to delete schedule');
      }
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-8 border border-emerald-100">
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-teal-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-700 mb-2">Loading Schedules</h3>
              <p className="text-gray-500 animate-pulse">Fetching your pickup schedule...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-slide-up">
        <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-3xl p-8 border-l-4 border-red-400">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center animate-pulse-soft">
              <span className="text-2xl">⚠️</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-red-800">Unable to Load Schedules</h3>
              <p className="text-red-600 mt-1">{error}</p>
              <button 
                onClick={fetchSchedules}
                className="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-300 transform hover:scale-105"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (schedules.length === 0) {
    return (
      <div className="animate-scale-in">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-12 text-center border border-emerald-200">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full mb-6 animate-float">
            <span className="text-4xl">📋</span>
          </div>
          <h3 className="text-2xl font-bold text-emerald-700 mb-3">No Schedules Yet</h3>
          <p className="text-emerald-600 text-lg">
            Ready to schedule your first pickup? Create one above to get started!
          </p>
          <div className="mt-6 flex justify-center">
            <div className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full text-sm font-medium animate-pulse-soft">
              ⬆️ Use the form above to create your first schedule
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Simple Header */}
      <div className="bg-teal-600 rounded-lg p-4 text-white mb-4">
        <h3 className="text-lg font-semibold">📅 Your Schedules ({schedules.length})</h3>
      </div>

      {/* Schedule Cards - Simple Vertical Stack */}
      <div className="space-y-4">
        {schedules.map((schedule) => {
          const wasteIcon = wasteTypeIcons[schedule.wasteType] || '🗂️';
          const status = statusConfig[schedule.status] || statusConfig.pending;
          
          return (
            <div key={schedule._id} className="bg-white rounded-lg border border-gray-200 p-4 mb-3">
              
              {/* Card Header - Simple Row */}
              <div className="mb-3">
                <div className="bg-teal-100 rounded-lg p-2 mb-2 inline-block">
                  <span className="text-lg">{wasteIcon}</span>
                </div>
                <div className={`inline-block ml-2 px-2 py-1 rounded text-xs ${status.color}`}>
                  {status.icon} {status.label}
                </div>
              </div>

              {/* Waste Type */}
              <div className="mb-3">
                <h4 className="text-lg font-semibold text-gray-900 capitalize">
                  {schedule.wasteType} Waste
                </h4>
              </div>

              {/* Date & Time - Simple List */}
              <div className="mb-3">
                <div className="mb-1">
                  <span className="text-sm text-gray-600">📅 {formatDate(schedule.pickupDate)}</span>
                </div>
                <div className="mb-1">
                  <span className="text-sm text-gray-600">🕐 {formatTime(schedule.pickupTime)}</span>
                </div>
                {schedule.pickupDueTime && (
                  <div className="mb-1">
                    <span className="text-sm text-gray-600">⏰ Due: {formatTime(schedule.pickupDueTime)}</span>
                  </div>
                )}
              </div>

              {/* Location */}
              {schedule.location && (
                <div className="mb-3">
                  <div className="bg-gray-50 rounded p-2">
                    <span className="text-xs text-gray-500">
                      📍 Lat: {schedule.location.lat?.toFixed(4)}, Lng: {schedule.location.lng?.toFixed(4)}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons - Simple Block Layout */}
              {schedule.status === 'Scheduled' && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="mb-2">
                    <button
                      onClick={() => handleEdit(schedule)}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white px-3 py-2 rounded text-sm mb-2"
                    >
                      ✏️ Edit Schedule
                    </button>
                  </div>
                  <div>
                    <button
                      onClick={() => handleDelete(schedule._id)}
                      className="w-full bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm"
                    >
                      🗑️ Delete Schedule
                    </button>
                  </div>
                </div>
              )}

              {/* Created Date */}
              <div className="mt-3 pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-400">
                  Created: {new Date(schedule.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {editingSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Edit Schedule</h3>
              <button
                onClick={handleCancelEdit}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pickup Date
                </label>
                <input
                  type="date"
                  value={editForm.pickupDate}
                  onChange={(e) => setEditForm({ ...editForm, pickupDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={editForm.pickupTime}
                  onChange={(e) => setEditForm({ ...editForm, pickupTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Time
                </label>
                <input
                  type="time"
                  value={editForm.pickupDueTime}
                  onChange={(e) => setEditForm({ ...editForm, pickupDueTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Waste Type
                </label>
                <select
                  value={editForm.wasteType}
                  onChange={(e) => setEditForm({ ...editForm, wasteType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="plastic">Plastic</option>
                  <option value="paper">Paper</option>
                  <option value="glass">Glass</option>
                  <option value="metal">Metal</option>
                  <option value="organic">Organic</option>
                  <option value="e-waste">E-Waste</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Add any special instructions..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white py-2 px-4 rounded-lg font-medium transition-all duration-200"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Summary - Remove flexbox and simplify */}
      <div className="mt-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Schedule Summary</h4>
          <div className="space-y-2">
            {Object.entries(statusConfig).map(([status, config]) => {
              const count = schedules.filter(s => s.status === status).length;
              return (
                <div key={status} className="bg-white rounded p-2">
                  <div className="text-sm">
                    <span className="mr-2">{config.icon}</span>
                    <span className="font-medium">{config.label}:</span>
                    <span className="ml-2 font-bold">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScheduleList;
