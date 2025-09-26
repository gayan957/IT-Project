import { useState, useEffect } from 'react';
import { useBinFillUpdates } from '../hooks/useSocket';

const wasteTypeColors = {
  plastic: { bg: 'bg-teal-500', text: 'text-teal-700', light: 'bg-teal-50', icon: '♻️' },
  paper: { bg: 'bg-orange-500', text: 'text-orange-700', light: 'bg-orange-50', icon: '📄' },
  glass: { bg: 'bg-emerald-500', text: 'text-emerald-700', light: 'bg-emerald-50', icon: '🍾' },
  metal: { bg: 'bg-gray-500', text: 'text-gray-700', light: 'bg-gray-50', icon: '🔩' },
  organic: { bg: 'bg-emerald-500', text: 'text-emerald-700', light: 'bg-emerald-50', icon: '🌱' },
  'coconut-shell': { bg: 'bg-emerald-600', text: 'text-emerald-800', light: 'bg-emerald-100', icon: '🥥' },
  'e-waste': { bg: 'bg-purple-500', text: 'text-purple-700', light: 'bg-purple-50', icon: '⚡' },
  mixed: { bg: 'bg-teal-600', text: 'text-teal-700', light: 'bg-teal-50', icon: '🗂️' }
};

const formatWasteTypeName = (type) => {
  const nameMap = {
    'plastic': 'Plastic',
    'paper': 'Paper',
    'glass': 'Glass',
    'metal': 'Metal',
    'organic': 'Organic',
    'coconut-shell': 'Coconut Shell',
    'e-waste': 'E-Waste',
    'mixed': 'Mixed'
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
    const [editForm, setEditForm] = useState({
        label: bin.label || '',
        wasteType: bin.wasteType,
        fillLevel: bin.fillLevel,
        latitude: bin.location?.coordinates?.[1] || '',
        longitude: bin.location?.coordinates?.[0] || '',
        address: bin.address || ''
    });

    // Real-time fill level updates
    const [currentFillLevel, setCurrentFillLevel] = useState(bin.fillLevel);
    const [lastUpdated, setLastUpdated] = useState(bin.lastUpdated || bin.lastMeasuredAt);
    const [isLive, setIsLive] = useState(false);

    // Socket.IO integration for real-time updates
    const { fillData, isConnected, isDataFresh } = useBinFillUpdates((data) => {
        // Only update if this is the correct bin
        if (data.binId === bin._id) {
            setCurrentFillLevel(data.fill);
            setLastUpdated(new Date(data.timestamp));
            setIsLive(true);
            
            // Reset live indicator after 3 seconds
            setTimeout(() => setIsLive(false), 3000);
        }
    });

    // Update form when bin data changes
    useEffect(() => {
        setEditForm({
            label: bin.label || '',
            wasteType: bin.wasteType,
            fillLevel: currentFillLevel
        });
    }, [bin.label, bin.wasteType, currentFillLevel]);

    const wasteTypeColor = wasteTypeColors[bin.wasteType] || wasteTypeColors.mixed;
    const fillStatus = getFillLevelStatus(currentFillLevel); // Use real-time fill level

    const handleSave = () => {
        onEdit(bin._id, editForm);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditForm({
            label: bin.label || '',
            wasteType: bin.wasteType,
            fillLevel: bin.fillLevel,
            latitude: bin.location?.coordinates?.[1] || '',
            longitude: bin.location?.coordinates?.[0] || '',
            address: bin.address || ''
        });
        setIsEditing(false);
    };

    const simulateFillLevelChange = async () => {
        try {
            setIsUpdating(true);
            const newLevel = Math.min(100, currentFillLevel + Math.floor(Math.random() * 20) + 5);
            await onUpdateFillLevel(bin._id, newLevel);
            // Update local state immediately for better UX
            setCurrentFillLevel(newLevel);
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Error updating fill level:', error);
            alert('Failed to update fill level. Please try again.');
        } finally {
            setIsUpdating(false);
        }
    };

    if (isEditing) {
        return (
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 transition-all duration-300">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bin Label</label>
                        <input
                            type="text"
                            value={editForm.label}
                            onChange={(e) => setEditForm({...editForm, label: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter bin label..."
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Waste Type</label>
                        <select
                            value={editForm.wasteType}
                            onChange={(e) => setEditForm({...editForm, wasteType: e.target.value})}
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
                            onChange={(e) => setEditForm({...editForm, fillLevel: parseInt(e.target.value)})}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Empty</span>
                            <span>Full</span>
                        </div>
                    </div>

                    {/* Location Section */}
                    <div className="border-t pt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">📍 Location Information</label>
                        
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                                <input
                                    type="text"
                                    value={editForm.address}
                                    onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    placeholder="Enter bin address..."
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Latitude</label>
                                    <input
                                        type="number"
                                        step="0.000001"
                                        value={editForm.latitude}
                                        onChange={(e) => setEditForm({...editForm, latitude: e.target.value})}
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
                                        onChange={(e) => setEditForm({...editForm, longitude: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                        placeholder="79.8612"
                                    />
                                </div>
                            </div>
                            
                            <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded-lg">
                                💡 Tip: You can get coordinates from Google Maps by right-clicking on your location
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
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 ${wasteTypeColor.light} rounded-xl flex items-center justify-center text-2xl`}>
                        {wasteTypeColor.icon}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">
                            {bin.label || 'Unnamed Bin'}
                        </h3>
                        <p className={`text-sm font-medium ${wasteTypeColor.text}`}>
                            {formatWasteTypeName(bin.wasteType)} Waste
                        </p>
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
                        <span className={`text-sm font-semibold ${fillStatus.color}`}>
                            {fillStatus.text}
                        </span>
                        <span className="text-lg font-bold text-gray-900">{currentFillLevel}%</span>
                        {/* Real-time indicator */}
                        {isConnected && (
                            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`} 
                                 title={isLive ? 'Live update received' : 'Connected to real-time updates'}>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modern Progress Bar */}
                <div className="relative">
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                        <div 
                            className={`h-full bg-gradient-to-r ${getFillLevelColor(currentFillLevel)} transition-all duration-700 ease-out relative`}
                            style={{ width: `${currentFillLevel}%` }}
                        >
                            <div className="absolute inset-0 bg-white bg-opacity-20 animate-pulse"></div>
                        </div>
                    </div>
                    
                    {/* Fill level markers */}
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>0%</span>
                        <span>25%</span>
                        <span>50%</span>
                        <span>75%</span>
                        <span>100%</span>
                    </div>
                </div>

                {/* Status Indicators */}
                <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span>Optimal (0-30%)</span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
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
                                <div className="w-3 h-3 border border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
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
                    <span>
                        Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Never'}
                    </span>
                    {isConnected && (
                        <span className="text-green-500 flex items-center space-x-1">
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                            <span>Live</span>
                        </span>
                    )}
                </div>

                {/* Location Information */}
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
                                {bin.location?.coordinates && (
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