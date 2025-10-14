import { useState, useEffect } from 'react';
import api from '../lib/api';
import { toast } from 'react-hot-toast';

export default function AdminBins() {
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [wasteTypeFilter, setWasteTypeFilter] = useState('All');
  const [fillLevelFilter, setFillLevelFilter] = useState('All');
  const [sendingEmail, setSendingEmail] = useState({});

  useEffect(() => {
    fetchBins();
  }, []);

  // Validate search input - only allow letters, numbers, and spaces
  const handleSearchChange = (e) => {
    const value = e.target.value;
    const validPattern = /^[a-zA-Z0-9\s]*$/;
    
    if (validPattern.test(value)) {
      setSearchTerm(value);
    }
  };

  const fetchBins = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/bins');
      setBins(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch bins');
      console.error('Error fetching bins:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteBin = async (binId) => {
    if (!window.confirm('Are you sure you want to delete this bin? This action cannot be undone.')) return;
    
    try {
      await api.delete(`/api/admin/bins/${binId}`);
      setBins(bins.filter(bin => bin._id !== binId));
    } catch (err) {
      setError('Failed to delete bin');
      console.error('Error deleting bin:', err);
    }
  };

  const updateBinStatus = async (binId, newStatus) => {
    try {
      const response = await api.put(`/api/admin/bins/${binId}`, { 
        status: newStatus 
      });
      setBins(bins.map(bin => 
        bin._id === binId ? response.data.bin : bin
      ));
    } catch (err) {
      setError('Failed to update bin status');
      console.error('Error updating bin status:', err);
    }
  };

  const sendBinFullNotification = async (binId) => {
    try {
      setSendingEmail(prev => ({ ...prev, [binId]: true }));
      
      const response = await api.post(`/api/admin/bins/${binId}/notify`);
      
      if (response.data.success) {
        toast.success('Bin full notification sent successfully!');
        
        // Update the bin with notification timestamp
        setBins(bins.map(bin => 
          bin._id === binId ? { ...bin, lastNotificationSent: new Date().toISOString() } : bin
        ));
      } else {
        toast.error(response.data.message || 'Failed to send notification');
      }
    } catch (err) {
      console.error('Error sending bin notification:', err);
      const errorMessage = err.response?.data?.message || 'Failed to send bin full notification';
      toast.error(errorMessage);
    } finally {
      setSendingEmail(prev => ({ ...prev, [binId]: false }));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatWasteType = (wasteType) => {
    return wasteType.charAt(0).toUpperCase() + wasteType.slice(1).replace('-', ' ');
  };

  const formatLocation = (location) => {
    if (!location || !location.coordinates) return 'No location';
    const [lng, lat] = location.coordinates;
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'idle':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'picked':
        return 'bg-purple-100 text-purple-800';
      case 'maintenance':
        return 'bg-orange-100 text-orange-800';
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

  const getFillLevelColor = (fillLevel) => {
    if (fillLevel >= 90) return 'bg-red-500';
    if (fillLevel >= 70) return 'bg-orange-500';
    if (fillLevel >= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getFillLevelText = (fillLevel) => {
    if (fillLevel >= 90) return 'Critical';
    if (fillLevel >= 70) return 'High';
    if (fillLevel >= 40) return 'Medium';
    return 'Low';
  };

  const filteredBins = bins.filter(bin => {
    const matchesSearch = 
      bin.owner?.firstName?.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
      bin.owner?.lastName?.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
      bin.owner?.email?.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
      bin.label?.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
      bin.address?.toLowerCase().startsWith(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || bin.status === statusFilter;
    const matchesWasteType = wasteTypeFilter === 'All' || bin.wasteType === wasteTypeFilter;
    
    let matchesFillLevel = true;
    if (fillLevelFilter === 'Critical') matchesFillLevel = bin.fillLevel >= 90;
    else if (fillLevelFilter === 'High') matchesFillLevel = bin.fillLevel >= 70 && bin.fillLevel < 90;
    else if (fillLevelFilter === 'Medium') matchesFillLevel = bin.fillLevel >= 40 && bin.fillLevel < 70;
    else if (fillLevelFilter === 'Low') matchesFillLevel = bin.fillLevel < 40;
    
    return matchesSearch && matchesStatus && matchesWasteType && matchesFillLevel;
  });

  // Statistics
  const stats = {
    total: bins.length,
    active: bins.filter(b => b.isActive && b.status !== 'maintenance').length,
    needsPickup: bins.filter(b => b.fillLevel >= 80).length,
    maintenance: bins.filter(b => b.status === 'maintenance').length,
    avgFillLevel: bins.length > 0 ? Math.round(bins.reduce((sum, b) => sum + b.fillLevel, 0) / bins.length) : 0
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-green-200 border-t-green-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Bin Management</h2>
          <p className="text-gray-600 mt-1">Manage waste bins in the system</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-green-600">{stats.total}</span>
          <p className="text-sm text-gray-600">Total Bins</p>
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Bins</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              🗑️
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              ✅
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Needs Pickup</p>
              <p className="text-2xl font-bold text-red-600">{stats.needsPickup}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              🚛
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Maintenance</p>
              <p className="text-2xl font-bold text-orange-600">{stats.maintenance}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              🔧
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Fill</p>
              <p className="text-2xl font-bold text-blue-600">{stats.avgFillLevel}%</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              📊
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">🔍</span>
            <input
              type="text"
              placeholder="Search by owner, label, or address..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-300"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-3 px-4 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-300"
          >
            <option value="All">All Status</option>
            <option value="idle">Idle</option>
            <option value="scheduled">Scheduled</option>
            <option value="picked">Picked</option>
            <option value="maintenance">Maintenance</option>
          </select>
          <select
            value={wasteTypeFilter}
            onChange={(e) => setWasteTypeFilter(e.target.value)}
            className="py-3 px-4 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-300"
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
          <select
            value={fillLevelFilter}
            onChange={(e) => setFillLevelFilter(e.target.value)}
            className="py-3 px-4 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-300"
          >
            <option value="All">All Fill Levels</option>
            <option value="Critical">Critical (≥90%)</option>
            <option value="High">High (70-89%)</option>
            <option value="Medium">Medium (40-69%)</option>
            <option value="Low">Low (&lt;40%)</option>
          </select>
        </div>
      </div>

      {/* Bins Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBins.map((bin) => (
          <div key={bin._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300">
            {/* Bin Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {bin.owner?.firstName?.[0] || 'B'}{bin.owner?.lastName?.[0] || 'U'}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {bin.label || `Bin ${bin._id.slice(-4)}`}
                  </h3>
                  <p className="text-sm text-gray-500">{bin.owner?.firstName} {bin.owner?.lastName}</p>
                  <p className="text-xs text-gray-400">{bin.owner?.email}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                {bin.status === 'idle' && (
                  <div className="relative">
                    <select
                      onChange={(e) => updateBinStatus(bin._id, e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1 bg-white cursor-pointer"
                      defaultValue=""
                    >
                      <option value="" disabled>Change Status</option>
                      <option value="scheduled">Mark Scheduled</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="picked">Mark Picked</option>
                    </select>
                  </div>
                )}
                <button
                  onClick={() => deleteBin(bin._id)}
                  className="text-red-600 hover:text-red-800 transition-colors duration-200 p-1 hover:bg-red-50 rounded"
                  title="Delete Bin"
                >
                  🗑️
                </button>
              </div>
            </div>

            {/* Fill Level Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Fill Level</span>
                <span className="text-sm font-bold text-gray-900">{bin.fillLevel}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${getFillLevelColor(bin.fillLevel)}`}
                  style={{ width: `${bin.fillLevel}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  bin.fillLevel >= 90 ? 'bg-red-100 text-red-700' :
                  bin.fillLevel >= 70 ? 'bg-orange-100 text-orange-700' :
                  bin.fillLevel >= 40 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {getFillLevelText(bin.fillLevel)}
                </span>
                <span className="text-xs text-gray-500">
                  {bin.capacity ? `${Math.round((bin.fillLevel / 100) * bin.capacity)}L / ${bin.capacity}L` : 'No capacity set'}
                </span>
              </div>
            </div>

            {/* Send Mail Button for Full Bins */}
            {bin.fillLevel >= 90 && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-red-600 text-lg">🚨</span>
                    <div>
                      <p className="text-sm font-semibold text-red-800">Bin Nearly Full</p>
                      <p className="text-xs text-red-600">Notification recommended</p>
                    </div>
                  </div>
                  <button
                    onClick={() => sendBinFullNotification(bin._id)}
                    disabled={sendingEmail[bin._id]}
                    className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-1"
                    title="Send bin full notification to owner"
                  >
                    {sendingEmail[bin._id] ? (
                      <>
                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <span>📧</span>
                        <span>Send Mail</span>
                      </>
                    )}
                  </button>
                </div>
                {bin.lastNotificationSent && (
                  <p className="text-xs text-red-500 mt-2">
                    Last notification: {formatDate(bin.lastNotificationSent)}
                  </p>
                )}
              </div>
            )}

            {/* Bin Details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bin.status)}`}>
                  {bin.status.charAt(0).toUpperCase() + bin.status.slice(1)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Waste Type:</span>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getWasteTypeColor(bin.wasteType)}`}>
                  {formatWasteType(bin.wasteType)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active:</span>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                  bin.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {bin.isActive ? 'Yes' : 'No'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Location:</span>
                <span className="text-sm text-gray-900">
                  {formatLocation(bin.location)}
                </span>
              </div>

              {bin.address && (
                <div>
                  <span className="text-sm text-gray-600">Address:</span>
                  <p className="text-sm text-gray-900 mt-1 break-words">{bin.address}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Measured:</span>
                <span className="text-sm text-gray-900">
                  {formatDate(bin.lastMeasuredAt)}
                </span>
              </div>

              {bin.pickupHistory && bin.pickupHistory.length > 0 && (
                <div>
                  <span className="text-sm text-gray-600">Last Pickup:</span>
                  <p className="text-sm text-gray-900 mt-1">
                    {formatDate(bin.pickupHistory[bin.pickupHistory.length - 1].date)}
                  </p>
                </div>
              )}

              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Created: {formatDate(bin.createdAt)}</span>
                  {bin.updatedAt !== bin.createdAt && (
                    <span>Updated: {formatDate(bin.updatedAt)}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredBins.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <span className="text-6xl mb-4 block">🗑️</span>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No bins found</h3>
          <p className="text-gray-500">
            {searchTerm || statusFilter !== 'All' || wasteTypeFilter !== 'All' || fillLevelFilter !== 'All'
              ? 'Try adjusting your search or filters' 
              : 'No bins have been created yet'}
          </p>
        </div>
      )}
    </div>
  );
}