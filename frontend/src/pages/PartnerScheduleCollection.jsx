import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getPartnerScheduleCollections, updateScheduleCollectionStatus } from '../lib/pickupPartnerApi';

const PartnerScheduleCollection = () => {
  const [scheduleCollections, setScheduleCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [summary, setSummary] = useState({
    totalEarnings: 0,
    totalCollections: 0,
    statusCounts: {}
  });

  // Fetch schedule collections data
  const fetchScheduleCollections = async (page = 1, status = 'all') => {
    try {
      setLoading(true);
      const response = await getPartnerScheduleCollections(page, 20, status);
      
      if (response.success) {
        setScheduleCollections(response.data.scheduleCollections);
        setCurrentPage(response.data.pagination.currentPage);
        setTotalPages(response.data.pagination.totalPages);
        setSummary(response.data.summary);
      } else {
        throw new Error('Failed to fetch schedule collections');
      }
    } catch (error) {
      console.error('Error fetching schedule collections:', error);
      toast.error('Failed to load schedule collections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduleCollections(currentPage, statusFilter);
  }, [currentPage, statusFilter]);

  // Handle status update (Collect button)
  const handleStatusUpdate = async (collectionId, newStatus = 'processed') => {
    if (updating[collectionId]) return;

    try {
      setUpdating(prev => ({ ...prev, [collectionId]: true }));
      
      const response = await updateScheduleCollectionStatus(collectionId, newStatus);
      
      if (response.success) {
        if (newStatus === 'processed') {
          toast.success('Schedule collection processed and saved to warehouse!');
        } else {
          toast.success('Schedule collection status updated successfully!');
        }
        // Refresh the collections list
        await fetchScheduleCollections(currentPage, statusFilter);
      } else {
        throw new Error(response.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating schedule collection status:', error);
      toast.error(error.message || 'Failed to update schedule collection status');
    } finally {
      setUpdating(prev => ({ ...prev, [collectionId]: false }));
    }
  };

  // Get status badge styling
  const getStatusBadge = (status) => {
    const statusConfig = {
      collected: { 
        bg: 'bg-blue-100', 
        text: 'text-blue-800', 
        label: 'Collected' 
      },
      processed: { 
        bg: 'bg-yellow-100', 
        text: 'text-yellow-800', 
        label: 'Processed' 
      },
      completed: { 
        bg: 'bg-green-100', 
        text: 'text-green-800', 
        label: 'Completed' 
      }
    };

    const config = statusConfig[status] || statusConfig.collected;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && scheduleCollections.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading schedule collections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Schedule Collection Management</h1>
          <p className="text-gray-600">Monitor and manage scheduled waste collection activities</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">Rs. {summary.totalEarnings.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4h8M8 12h8m0 6H8v-6z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Collections</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalCollections}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Processed</p>
                <p className="text-2xl font-bold text-gray-900">{summary.statusCounts.processed || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{summary.statusCounts.completed || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="collected">Collected</option>
                <option value="processed">Processed</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            
            <button
              onClick={() => fetchScheduleCollections(currentPage, statusFilter)}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Schedule Collections Grid */}
        {scheduleCollections.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="w-24 h-24 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4h8M8 12h8m0 6H8v-6z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Schedule Collections Found</h3>
            <p className="text-gray-600">No scheduled collection records match your current filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {scheduleCollections.map((collection) => (
              <div key={collection._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                {/* Collection Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {collection.wasteType.charAt(0).toUpperCase() + collection.wasteType.slice(1)} Waste
                    </h3>
                    <p className="text-sm text-gray-600">
                      Schedule ID: {collection.scheduleId?._id?.slice(-6) || 'N/A'}
                    </p>
                  </div>
                  {getStatusBadge(collection.status)}
                </div>

                {/* Collection Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Weight:</span>
                    <span className="text-sm font-medium">{collection.wasteWeight} kg</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Price per kg:</span>
                    <span className="text-sm font-medium">Rs. {collection.pricePerKg}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Amount:</span>
                    <span className="text-sm font-bold text-green-600">Rs. {collection.totalPrice}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Collection Date:</span>
                    <span className="text-sm font-medium">{formatDate(collection.collectionDate)}</span>
                  </div>

                  {collection.agentId && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Agent:</span>
                      <span className="text-sm font-medium">{collection.agentId.name}</span>
                    </div>
                  )}

                  {collection.scheduleLocation && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Location:</span>
                      <span className="text-sm font-medium truncate ml-2">{collection.scheduleLocation.address}</span>
                    </div>
                  )}

                  {collection.notes && (
                    <div className="pt-2 border-t">
                      <span className="text-sm text-gray-600">Notes:</span>
                      <p className="text-sm text-gray-800 mt-1">{collection.notes}</p>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="pt-4 border-t">
                  {collection.status === 'collected' && (
                    <button
                      onClick={() => handleStatusUpdate(collection._id, 'processed')}
                      disabled={updating[collection._id]}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {updating[collection._id] ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Mark as Processed</span>
                        </>
                      )}
                    </button>
                  )}
                  
                  {collection.status === 'processed' && (
                    <button
                      onClick={() => handleStatusUpdate(collection._id, 'completed')}
                      disabled={updating[collection._id]}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {updating[collection._id] ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Completing...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Mark as Completed</span>
                        </>
                      )}
                    </button>
                  )}
                  
                  {collection.status === 'completed' && (
                    <div className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-md">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Completed</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <span className="px-4 py-2 text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnerScheduleCollection;