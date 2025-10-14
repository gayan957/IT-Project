import React, { useState, useEffect, useCallback } from 'react';
import { useBinFillUpdates } from '../hooks/useSocket';
import MapPicker from './MapPicker';

const wasteTypeColors = {
  plastic: { bg: 'bg-teal-500', text: 'text-teal-700', light: 'bg-teal-50', icon: '♻️' },
  paper: { bg: 'bg-orange-500', text: 'text-orange-700', light: 'bg-orange-50', icon: '📄' },
  glass: { bg: 'bg-emerald-500', text: 'text-emerald-700', light: 'bg-emerald-50', icon: '🍾' },
  metal: { bg: 'bg-gray-500', text: 'text-gray-700', light: 'bg-gray-50', icon: '🔩' },
  organic: { bg: 'bg-emerald-500', text: 'text-emerald-700', light: 'bg-emerald-50', icon: '🌱' },
  'coconut-shell': { bg: 'bg-emerald-600', text: 'text-emerald-800', light: 'bg-emerald-100', icon: '🥥' },
  'e-waste': { bg: 'bg-purple-500', text: 'text-purple-700', light: 'bg-purple-50', icon: '⚡' },
  mixed: { bg: 'bg-teal-600', text: 'text-teal-700', light: 'bg-teal-50', icon: '🗂️' },
};

const formatWasteTypeName = (type) => {
  const nameMap = {
    plastic: 'Plastic',
    paper: 'Paper',
    glass: 'Glass',
    metal: 'Metal',
    organic: 'Organic',
    'coconut-shell': 'Coconut Shell',
    'e-waste': 'E-Waste',
    mixed: 'Mixed',
  };
  return nameMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
};

const getFillLevelColor = (level) => {
  if (level <= 30) return 'from-green-400 to-green-600';
  if (level <= 60) return 'from-yellow-400 to-orange-500';
  if (level <= 85) return 'from-orange-400 to-red-500';
  return 'from-red-500 to-red-700';
};

const getFillLevelStatus = (level) => {
  if (level <= 30) return { text: 'Low', color: 'text-green-600' };
  if (level <= 60) return { text: 'Medium', color: 'text-yellow-600' };
  if (level <= 85) return { text: 'High', color: 'text-orange-600' };
  return { text: 'Critical', color: 'text-red-600' };
};

export default function BinCard({ bin, onEdit, onDelete, onUpdateFillLevel }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);

  // Keep current fill level separate (live)
  const [currentFillLevel, setCurrentFillLevel] = useState(bin.fillLevel ?? 0);
  const [lastUpdated, setLastUpdated] = useState(bin.lastUpdated || bin.lastMeasuredAt || null);
  const [isLive, setIsLive] = useState(false);

  // Full edit form (don’t drop fields when live updates come in)
  const [editForm, setEditForm] = useState({
    label: bin.label || '',
    wasteType: bin.wasteType || 'mixed',
    fillLevel: bin.fillLevel ?? 0,
    latitude: bin.location?.coordinates?.[1] ?? '',
    longitude: bin.location?.coordinates?.[0] ?? '',
    address: bin.address || '',
  });

  // When the bin prop itself changes (new card or hard refresh), reset edit form & live state once.
  useEffect(() => {
    setEditForm({
      label: bin.label || '',
      wasteType: bin.wasteType || 'mixed',
      fillLevel: bin.fillLevel ?? 0,
      latitude: bin.location?.coordinates?.[1] ?? '',
      longitude: bin.location?.coordinates?.[0] ?? '',
      address: bin.address || '',
    });
    setCurrentFillLevel(bin.fillLevel ?? 0);
    setLastUpdated(bin.lastUpdated || bin.lastMeasuredAt || null);
  }, [bin]);

  // Socket.IO integration for real-time updates
  useBinFillUpdates((data) => {
    if (data.binId === bin._id) {
      setCurrentFillLevel(data.fill);
      setLastUpdated(new Date(data.timestamp));
      setIsLive(true);
      // Don’t mutate editForm here—user may be editing.
      const t = setTimeout(() => setIsLive(false), 3000);
      return () => clearTimeout(t);
    }
  });

  const wasteTypeColor = wasteTypeColors[bin.wasteType] || wasteTypeColors.mixed;
  const fillStatus = getFillLevelStatus(currentFillLevel);

  const handleSave = () => {
    const lat = editForm.latitude === '' ? null : Number(editForm.latitude);
    const lng = editForm.longitude === '' ? null : Number(editForm.longitude);

    const payload = {
      label: editForm.label?.trim() || 'Unnamed Bin',
      wasteType: editForm.wasteType || 'mixed',
      fillLevel: Number.isFinite(editForm.fillLevel) ? editForm.fillLevel : 0,
      address: editForm.address || '',
      // If both present, send GeoJSON Point; else leave undefined (parent can decide)
      location:
        Number.isFinite(lat) && Number.isFinite(lng)
          ? { type: 'Point', coordinates: [lng, lat] }
          : undefined,
    };

    onEdit(bin._id, payload);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditForm({
      label: bin.label || '',
      wasteType: bin.wasteType || 'mixed',
      fillLevel: bin.fillLevel ?? 0,
      latitude: bin.location?.coordinates?.[1] ?? '',
      longitude: bin.location?.coordinates?.[0] ?? '',
      address: bin.address || '',
    });
    setIsEditing(false);
  };

  const simulateFillLevelChange = async () => {
    try {
      setIsUpdating(true);
      const inc = Math.floor(Math.random() * 20) + 5;
      const newLevel = Math.min(100, (currentFillLevel ?? 0) + inc);
      await onUpdateFillLevel(bin._id, newLevel);
      setCurrentFillLevel(newLevel);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error updating fill level:', error);
      alert('Failed to update fill level. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Modal helpers
  const closeMapModal = useCallback(() => setShowMapModal(false), []);
  const onBackdropClick = (e) => {
    if (e.target === e.currentTarget) closeMapModal();
  };
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && closeMapModal();
    if (showMapModal) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showMapModal, closeMapModal]);

  // -------- EDITING VIEW --------
  if (isEditing) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 transition-all duration-300">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bin Label</label>
            <input
              type="text"
              value={editForm.label}
              onChange={(e) => {
                // Only allow letters and numbers (alphanumeric characters)
                const value = e.target.value.replace(/[^a-zA-Z0-9\s]/g, '');
                setEditForm({ ...editForm, label: value });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter bin label (letters and numbers only)..."
              maxLength={50}
            />
            <p className="text-xs text-gray-500 mt-1">Only letters and numbers allowed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Waste Type</label>
            <select
              value={editForm.wasteType}
              onChange={(e) => setEditForm({ ...editForm, wasteType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              {Object.keys(wasteTypeColors).map((type) => (
                <option key={type} value={type}>
                  {wasteTypeColors[type].icon} {formatWasteTypeName(type)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fill Level: {editForm.fillLevel}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={editForm.fillLevel}
              onChange={(e) =>
                setEditForm({ ...editForm, fillLevel: parseInt(e.target.value, 10) || 0 })
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Empty</span>
              <span>Full</span>
            </div>
          </div>

          {/* Location Section */}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">📍 Location Information</label>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Enter bin address..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Location Coordinates</label>
                <button
                  type="button"
                  onClick={() => setShowMapModal(true)}
                  className="w-full px-4 py-3 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg hover:bg-blue-100 hover:border-blue-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm font-medium text-blue-700">
                      {editForm.latitude !== '' && editForm.longitude !== '' ? 'Update Location on Map' : 'Select Location on Map'}
                    </span>
                  </div>
                  {editForm.latitude !== '' && editForm.longitude !== '' && (
                    <div className="mt-2 text-xs text-gray-600">
                      Current:{' '}
                      {Number(editForm.latitude).toFixed(5)}, {Number(editForm.longitude).toFixed(5)}
                    </div>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={editForm.latitude}
                    onChange={(e) => setEditForm({ ...editForm, latitude: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="6.9271"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={editForm.longitude}
                    onChange={(e) => setEditForm({ ...editForm, longitude: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="79.8612"
                  />
                </div>
              </div>

              <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded-lg">
                💡 Tip: Use the map picker for precise coordinates or enter them manually.
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-4 py-2 rounded-lg font-medium hover:from-emerald-700 hover:to-teal-800 transition-all duration-200 transform hover:scale-105"
            >
              Save Changes
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-600 transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Map Modal */}
        {showMapModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={onBackdropClick}
          >
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Select Bin Location</span>
                </h3>
                <button
                  onClick={closeMapModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-4">
                  Click on the map or search for a location to set the bin coordinates.
                </p>

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <MapPicker
                    value={
                      editForm.latitude !== '' && editForm.longitude !== ''
                        ? { lat: Number(editForm.latitude), lng: Number(editForm.longitude) }
                        : null
                    }
                    onChange={(location) => {
                      if (location) {
                        setEditForm((prev) => ({
                          ...prev,
                          latitude: location.lat.toString(),
                          longitude: location.lng.toString(),
                        }));
                      }
                    }}
                    height="500px"
                  />
                </div>

                {editForm.latitude !== '' && editForm.longitude !== '' && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-medium text-green-800">Location Selected</span>
                    </div>
                    <div className="mt-1 text-sm text-green-700">
                      Coordinates: {Number(editForm.latitude).toFixed(6)}, {Number(editForm.longitude).toFixed(6)}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={closeMapModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={closeMapModal}
                  disabled={editForm.latitude === '' || editForm.longitude === ''}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Use This Location
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------- READ-ONLY CARD VIEW --------
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 ${wasteTypeColor.light} rounded-xl flex items-center justify-center text-2xl`}>
            {wasteTypeColor.icon}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{bin.label || 'Unnamed Bin'}</h3>
            <p className={`text-sm font-medium ${wasteTypeColor.text}`}>{formatWasteTypeName(bin.wasteType)} Waste</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
            title="Edit bin"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(bin)}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
            title="Delete bin"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Fill Level Display */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Fill Level</span>
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-semibold ${fillStatus.color}`}>{fillStatus.text}</span>
            <span className="text-lg font-bold text-gray-900">{currentFillLevel}%</span>
            {/* Real-time indicator */}
            <div
              className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`}
              title={isLive ? 'Live update received' : 'Waiting for updates'}
            />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative">
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${getFillLevelColor(currentFillLevel)} transition-all duration-700 ease-out relative`}
              style={{ width: `${currentFillLevel}%` }}
            >
              <div className="absolute inset-0 bg-white bg-opacity-20 animate-pulse" />
            </div>
          </div>

          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Status Indicators & Update */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span>Optimal (0-30%)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-red-400 rounded-full" />
              <span>Critical (85%+)</span>
            </div>
          </div>

          <button
            onClick={simulateFillLevelChange}
            disabled={isUpdating}
            className="text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-3 py-1 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
            title="Update fill level"
          >
            {isUpdating ? (
              <>
                <div className="w-3 h-3 border border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span>Updating...</span>
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Update Level</span>
              </>
            )}
          </button>
        </div>

        {/* Last Updated */}
        <div className="text-xs text-gray-400 border-t pt-2 mt-2 flex items-center justify-between">
          <span>Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Never'}</span>
          {isLive && (
            <span className="text-green-500 flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <span>Live</span>
            </span>
          )}
        </div>

        {/* Location Info */}
        {(bin.address || bin.location?.coordinates) && (
          <div className="text-xs text-gray-500 border-t pt-2 mt-2">
            <div className="flex items-start space-x-2">
              <svg className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div className="flex-1 min-w-0">
                {bin.address && (
                  <div className="text-gray-600 font-medium truncate" title={bin.address}>
                    {bin.address}
                  </div>
                )}
                {Array.isArray(bin.location?.coordinates) &&
                  Number.isFinite(bin.location.coordinates[1]) &&
                  Number.isFinite(bin.location.coordinates[0]) && (
                    <div className="text-gray-400 text-xs">
                      {bin.location.coordinates[1].toFixed(4)}, {bin.location.coordinates[0].toFixed(4)}
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
