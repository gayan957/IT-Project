import { useState } from 'react';
import { createUserSchedule } from '../lib/scheduleApi';
import {
  validatePickupDate,
  validatePickupTime,
  validateDueTime,
  validateScheduleForm,
  getMinPickupDate,
  getMaxPickupDate,
  formatTimeForDisplay
} from '../lib/scheduleValidation';

const wasteTypes = [
  { value: 'plastic', label: 'Plastic', icon: '♻️', color: 'from-teal-500 to-teal-600', bgColor: 'bg-teal-50', textColor: 'text-teal-700', hoverColor: 'hover:bg-teal-100' },
  { value: 'paper', label: 'Paper', icon: '📄', color: 'from-orange-500 to-orange-600', bgColor: 'bg-orange-50', textColor: 'text-orange-700', hoverColor: 'hover:bg-orange-100' },
  { value: 'glass', label: 'Glass', icon: '🍾', color: 'from-emerald-500 to-emerald-600', bgColor: 'bg-emerald-50', textColor: 'text-emerald-700', hoverColor: 'hover:bg-emerald-100' },
  { value: 'metal', label: 'Metal', icon: '🔩', color: 'from-gray-500 to-gray-600', bgColor: 'bg-gray-50', textColor: 'text-gray-700', hoverColor: 'hover:bg-gray-100' },
  { value: 'organic', label: 'Organic', icon: '🌱', color: 'from-emerald-500 to-emerald-600', bgColor: 'bg-emerald-50', textColor: 'text-emerald-700', hoverColor: 'hover:bg-emerald-100' },
  { value: 'coconut-shell', label: 'Coconut Shell', icon: '🥥', color: 'from-emerald-600 to-emerald-700', bgColor: 'bg-emerald-100', textColor: 'text-emerald-800', hoverColor: 'hover:bg-emerald-200' },
  { value: 'e-waste', label: 'E-Waste', icon: '⚡', color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-50', textColor: 'text-purple-700', hoverColor: 'hover:bg-purple-100' },
  { value: 'mixed', label: 'Mixed', icon: '🗂️', color: 'from-teal-600 to-cyan-600', bgColor: 'bg-teal-50', textColor: 'text-teal-700', hoverColor: 'hover:bg-teal-100' }
];

export default function ScheduleForm({ onCreated }) {
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [pickupDueTime, setPickupDueTime] = useState('');
  const [wasteType, setWasteType] = useState('mixed');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Generate valid time options (6 AM to 8 PM in 30-minute intervals)
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 6; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayTime = formatTimeForDisplay(timeString);
        options.push({ value: timeString, display: displayTime });
      }
    }
    return options;
  };

  // Generate valid due time options based on pickup time
  const generateDueTimeOptions = () => {
    if (!pickupTime) return [];
    
    const [pickupHour, pickupMinute] = pickupTime.split(':').map(Number);
    const pickupTimeInMinutes = pickupHour * 60 + pickupMinute;
    const minDueTimeInMinutes = pickupTimeInMinutes + 60; // 1 hour later
    
    const options = [];
    for (let hour = 6; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeInMinutes = hour * 60 + minute;
        if (timeInMinutes >= minDueTimeInMinutes) {
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          const displayTime = formatTimeForDisplay(timeString);
          options.push({ value: timeString, display: displayTime });
        }
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();
  const dueTimeOptions = generateDueTimeOptions();

  // Auto-suggest due time when pickup time changes
  const handlePickupTimeChange = (time) => {
    setPickupTime(time);
    
    // Clear validation error
    if (validationErrors.pickupTime) {
      setValidationErrors(prev => ({ ...prev, pickupTime: '' }));
    }
    
    // Validate pickup time
    const timeError = validatePickupTime(time);
    if (timeError) {
      setValidationErrors(prev => ({ ...prev, pickupTime: timeError }));
    }
    
    // Reset due time when pickup time changes to force user to select valid option
    setPickupDueTime('');
    
    // Clear due time validation error
    if (validationErrors.pickupDueTime) {
      setValidationErrors(prev => ({ ...prev, pickupDueTime: '' }));
    }
  };

  const handleDateChange = (date) => {
    setPickupDate(date);
    
    // Clear validation error
    if (validationErrors.pickupDate) {
      setValidationErrors(prev => ({ ...prev, pickupDate: '' }));
    }
    
    // Validate date
    const dateError = validatePickupDate(date);
    if (dateError) {
      setValidationErrors(prev => ({ ...prev, pickupDate: dateError }));
    }
  };

  const handleDueTimeChange = (time) => {
    setPickupDueTime(time);
    
    // Clear validation error
    if (validationErrors.pickupDueTime) {
      setValidationErrors(prev => ({ ...prev, pickupDueTime: '' }));
    }
    
    // Validate due time
    const dueTimeError = validateDueTime(pickupTime, time);
    if (dueTimeError) {
      setValidationErrors(prev => ({ ...prev, pickupDueTime: dueTimeError }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate entire form
    const validation = validateScheduleForm({
      pickupDate,
      pickupTime,
      pickupDueTime,
      wasteType
    });
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setError('Please correct the highlighted errors');
      return;
    }
    
    setValidationErrors({});
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      await createUserSchedule({ pickupDate, pickupTime, pickupDueTime, wasteType });
      setPickupDate('');
      setPickupTime('');
      setPickupDueTime('');
      setWasteType('mixed');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      onCreated && onCreated();
    } catch {
      setError('Failed to create schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedWasteType = wasteTypes.find(type => type.value === wasteType);

  return (
    <div className="animate-slide-up">
      {/* Floating Card with Gradient Border */}
      <div className={`bg-gradient-to-br ${selectedWasteType?.color || 'from-emerald-500 to-teal-600'} p-1 rounded-3xl shadow-2xl animate-float`}>
        <div className="bg-white rounded-2xl p-8 backdrop-blur-sm">
          
          {/* Animated Header */}
          <div className="text-center mb-8 animate-scale-in">
            <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${selectedWasteType?.color || 'from-emerald-500 to-teal-600'} rounded-2xl mb-4 animate-pulse-soft shadow-lg`}>
              <span className="text-2xl">{selectedWasteType?.icon || '📅'}</span>
            </div>
            <h3 className={`text-3xl font-bold bg-gradient-to-r ${selectedWasteType?.color || 'from-emerald-600 to-teal-600'} bg-clip-text text-transparent`}>
              Schedule Pickup
            </h3>
            <p className="text-gray-600 mt-2 text-lg">Plan your waste collection efficiently</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Waste Type Grid with Staggered Animation */}
            <div className="animate-scale-in" style={{ animationDelay: '0.1s' }}>
              <label className="block text-lg font-bold text-gray-800 mb-6 text-center">
                🗂️ Select Waste Type
              </label>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {wasteTypes.map((type, index) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setWasteType(type.value)}
                    className={`relative p-4 rounded-2xl border-3 transition-all duration-500 transform hover:scale-110 hover:-translate-y-2 animate-scale-in ${
                      wasteType === type.value
                        ? `border-transparent bg-gradient-to-br ${type.color} text-white shadow-2xl animate-pulse-soft`
                        : `border-gray-200 ${type.bgColor} ${type.textColor} ${type.hoverColor} hover:border-gray-300 hover:shadow-lg`
                    }`}
                    style={{ animationDelay: `${0.2 + index * 0.1}s` }}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <span className="text-3xl transform transition-transform duration-300 hover:scale-125">{type.icon}</span>
                      <span className="font-semibold text-sm">{type.label}</span>
                    </div>
                    
                    {/* Selection Indicator */}
                    {wasteType === type.value && (
                      <div className="absolute -top-2 -right-2 animate-scale-in">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-emerald-500 text-lg font-bold">✓</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Hover Glow Effect */}
                    <div className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-20 bg-white transition-opacity duration-300"></div>
                  </button>
                ))}
              </div>
            </div>

            {/* Date and Time Section */}
            <div className="grid md:grid-cols-3 gap-6">
              
              {/* Date Picker */}
              <div className="animate-scale-in" style={{ animationDelay: '0.3s' }}>
                <label className="block text-lg font-bold text-gray-800 mb-4">
                  📅 Pickup Date
                </label>
                <div className="relative group">
                  <input
                    type="date"
                    value={pickupDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    min={getMinPickupDate()}
                    max={getMaxPickupDate()}
                    className={`w-full px-4 py-3 text-base border-3 rounded-2xl focus:ring-4 focus:ring-emerald-200 transition-all duration-300 bg-gradient-to-r from-gray-50 to-white focus:from-white focus:to-white group-hover:shadow-lg ${
                      validationErrors.pickupDate 
                        ? 'border-red-500 focus:border-red-500' 
                        : 'border-gray-200 focus:border-indigo-500'
                    }`}
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-xl text-gray-400 group-hover:text-indigo-500 transition-colors duration-300">📅</span>
                  </div>
                </div>
                {validationErrors.pickupDate && (
                  <p className="text-red-500 text-sm mt-2 animate-slide-up">{validationErrors.pickupDate}</p>
                )}
                <p className="text-sm text-gray-500 mt-2">Available: Tomorrow to one week ahead</p>
              </div>

              {/* Pickup Start Time */}
              <div className="animate-scale-in" style={{ animationDelay: '0.4s' }}>
                <label className="block text-lg font-bold text-gray-800 mb-4">
                  🕐 Start Time
                </label>
                <div className="relative group">
                  <select
                    value={pickupTime}
                    onChange={(e) => handlePickupTimeChange(e.target.value)}
                    className={`w-full px-4 py-3 text-base border-3 rounded-2xl focus:ring-4 focus:ring-emerald-200 transition-all duration-300 bg-gradient-to-r from-gray-50 to-white focus:from-white focus:to-white group-hover:shadow-lg appearance-none cursor-pointer ${
                      validationErrors.pickupTime 
                        ? 'border-red-500 focus:border-red-500' 
                        : 'border-gray-200 focus:border-indigo-500'
                    }`}
                    required
                  >
                    <option value="">Select pickup time</option>
                    {timeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.display}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {validationErrors.pickupTime && (
                  <p className="text-red-500 text-sm mt-2 animate-slide-up">{validationErrors.pickupTime}</p>
                )}
                <p className="text-sm text-gray-500 mt-2">Available: 6:00 AM - 8:00 PM (30-min intervals)</p>
              </div>

              {/* Pickup Due Time */}
              <div className="animate-scale-in" style={{ animationDelay: '0.5s' }}>
                <label className="block text-lg font-bold text-gray-800 mb-4">
                  ⏰ Due Time
                </label>
                <div className="relative group">
                  <select
                    value={pickupDueTime}
                    onChange={(e) => handleDueTimeChange(e.target.value)}
                    className={`w-full px-4 py-3 text-base border-3 rounded-2xl focus:ring-4 focus:ring-emerald-200 transition-all duration-300 bg-gradient-to-r appearance-none cursor-pointer ${
                      !pickupTime 
                        ? 'from-gray-100 to-gray-200 text-gray-400 cursor-not-allowed' 
                        : 'from-gray-50 to-white focus:from-white focus:to-white group-hover:shadow-lg'
                    } ${
                      validationErrors.pickupDueTime 
                        ? 'border-red-500 focus:border-red-500' 
                        : 'border-gray-200 focus:border-indigo-500'
                    }`}
                    required
                    disabled={!pickupTime}
                  >
                    <option value="">
                      {pickupTime ? "Select due time" : "Select pickup time first"}
                    </option>
                    {dueTimeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.display}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {validationErrors.pickupDueTime && (
                  <p className="text-red-500 text-sm mt-2 animate-slide-up">{validationErrors.pickupDueTime}</p>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  Must be at least 1 hour after start time
                  {pickupTime && dueTimeOptions.length > 0 && ` (${dueTimeOptions.length} options available)`}
                </p>
              </div>
            </div>

            {/* Enhanced Submit Button */}
            <div className="animate-scale-in" style={{ animationDelay: '0.6s' }}>
              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-gradient-to-r ${selectedWasteType?.color || 'from-emerald-500 to-teal-600'} text-white py-5 px-8 rounded-2xl font-bold text-xl transition-all duration-500 transform hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group`}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating Your Schedule...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-3">
                    <span>Schedule My Pickup</span>
                    <span className="text-2xl transform group-hover:translate-x-2 transition-transform duration-300">🚛</span>
                  </div>
                )}
                
                {/* Animated Background Effect */}
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-all duration-500 transform scale-x-0 group-hover:scale-x-100"></div>
                
                {/* Ripple Effect */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-active:opacity-30 bg-white transition-opacity duration-150"></div>
              </button>
            </div>

            {/* Status Messages with Enhanced Styling */}
            {(success || error) && (
              <div className={`animate-slide-up p-6 rounded-2xl border-l-4 ${
                success 
                  ? 'bg-gradient-to-r from-emerald-50 to-emerald-50 border-emerald-400 text-emerald-800' 
                  : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-400 text-red-800'
              } shadow-lg`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    success ? 'bg-emerald-100' : 'bg-red-100'
                  }`}>
                    <span className="text-2xl">
                      {success ? '🎉' : '⚠️'}
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-lg">
                      {success ? 'Success!' : 'Oops!'}
                    </div>
                    <div className="text-sm opacity-90">
                      {success ? 'Your pickup has been scheduled successfully!' : error}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
