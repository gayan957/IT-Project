import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function AdminSupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    priority: '',
    search: ''
  });
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyModal, setReplyModal] = useState(false);
  const [replyForm, setReplyForm] = useState({
    reply: '',
    status: ''
  });
  const [submittingReply, setSubmittingReply] = useState(false);

  // Handle search input change with validation
  const handleSearchChange = (e) => {
    const value = e.target.value;
    // Allow only letters, numbers, and spaces
    const validPattern = /^[a-zA-Z0-9\s]*$/;
    
    if (validPattern.test(value)) {
      handleFilterChange('search', value);
    }
  };

  // Fetch all tickets
  const fetchTickets = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token'); // Use the main token for admin
      const queryParams = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key]) queryParams.append(key, filters[key]);
      });

      const response = await fetch(`/api/support-tickets/admin/all?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets || []);
        setStats(data.stats || []);
      } else if (response.status === 403) {
        toast.error('Access denied. Admin privileges required.');
      } else {
        toast.error('Failed to fetch tickets');
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  // Fetch ticket statistics
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/support-tickets/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || {});
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchStats();
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Reply to ticket
  const handleReply = async () => {
    if (!replyForm.reply.trim()) {
      toast.error('Please enter a reply');
      return;
    }

    setSubmittingReply(true);
    try {
      const token = localStorage.getItem('token');
      console.log('🎫 Reply Debug - Token:', token ? token.substring(0, 20) + '...' : 'null');
      console.log('🎫 Reply Debug - Ticket ID:', selectedTicket._id);
      console.log('🎫 Reply Debug - Reply:', replyForm.reply);
      console.log('🎫 Reply Debug - Status:', replyForm.status);

      const response = await fetch(`/api/support-tickets/admin/${selectedTicket._id}/reply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reply: replyForm.reply,
          status: replyForm.status || undefined
        })
      });

      console.log('🎫 Reply Debug - Response status:', response.status);
      console.log('🎫 Reply Debug - Response ok:', response.ok);

      const data = await response.json();
      console.log('🎫 Reply Debug - Response data:', data);

      if (response.ok) {
        toast.success('Reply sent successfully!');
        setReplyModal(false);
        setReplyForm({ reply: '', status: '' });
        setSelectedTicket(null);
        fetchTickets();
      } else {
        console.error('🎫 Reply Debug - Error response:', data);
        toast.error(data.message || 'Failed to send reply');
      }
    } catch (error) {
      console.error('🎫 Reply Debug - Catch error:', error);
      toast.error('Failed to send reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  // Update ticket status
  const updateTicketStatus = async (ticketId, status, priority) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/support-tickets/admin/${ticketId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, priority })
      });

      if (response.ok) {
        toast.success('Ticket updated successfully!');
        fetchTickets();
      } else {
        toast.error('Failed to update ticket');
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast.error('Failed to update ticket');
    }
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

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'billing': return '💳';
      case 'technical': return '🔧';
      case 'pickup': return '🚛';
      case 'account': return '👤';
      case 'other': return '❓';
      default: return '📝';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support Tickets Management</h1>
          <p className="text-gray-600 mt-2">Manage customer support requests and provide assistance</p>
        </div>
        <button
          onClick={fetchTickets}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-md hover:shadow-lg"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-blue-100 rounded-full p-3 mr-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTickets || 0}</p>
              <p className="text-sm text-gray-600">Total Tickets</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-red-100 rounded-full p-3 mr-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.openTickets || 0}</p>
              <p className="text-sm text-gray-600">Open</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-yellow-100 rounded-full p-3 mr-4">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.inProgressTickets || 0}</p>
              <p className="text-sm text-gray-600">In Progress</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-green-100 rounded-full p-3 mr-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.resolvedTickets || 0}</p>
              <p className="text-sm text-gray-600">Resolved</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-purple-100 rounded-full p-3 mr-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.urgentTickets || 0}</p>
              <p className="text-sm text-gray-600">Urgent</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={handleSearchChange}
              placeholder="Search tickets..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              <option value="billing">Billing & Payments</option>
              <option value="technical">Technical Issues</option>
              <option value="pickup">Pickup Problems</option>
              <option value="account">Account Management</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: '', category: '', priority: '', search: '' })}
              className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Support Tickets ({tickets.length})
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading tickets...</span>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tickets Found</h3>
            <p className="text-gray-600">No support tickets match your current filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {tickets.map((ticket) => (
              <div key={ticket._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{ticket.subject}</h3>
                      {ticket.isUrgent && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          URGENT
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                      <span>Ticket ID: {ticket.ticketId}</span>
                      <span>•</span>
                      <span>Customer: {ticket.userId?.name || 'Unknown'}</span>
                      <span>•</span>
                      <span>Category: {getCategoryIcon(ticket.category)} {ticket.category}</span>
                      <span>•</span>
                      <span>Created: {formatDate(ticket.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-700 mb-2">{ticket.message}</p>
                </div>

                {ticket.adminReply && (
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-blue-800">Your Response</h4>
                      <p className="text-xs text-blue-600">{formatDate(ticket.repliedAt)}</p>
                    </div>
                    <p className="text-blue-700">{ticket.adminReply}</p>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <div className="flex space-x-4">
                    <select
                      value={ticket.status}
                      onChange={(e) => updateTicketStatus(ticket._id, e.target.value)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>

                    <select
                      value={ticket.priority}
                      onChange={(e) => updateTicketStatus(ticket._id, ticket.status, e.target.value)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setReplyModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    <span>Reply</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {replyModal && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Reply to Ticket: {selectedTicket.ticketId}
              </h3>
              <button
                onClick={() => {
                  setReplyModal(false);
                  setSelectedTicket(null);
                  setReplyForm({ reply: '', status: '' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Original Message:</p>
              <div className="bg-gray-50 p-3 rounded border">
                <p className="text-gray-800">{selectedTicket.message}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Reply *
                </label>
                <textarea
                  rows={4}
                  value={replyForm.reply}
                  onChange={(e) => setReplyForm(prev => ({ ...prev, reply: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type your response here..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Update Status (optional)
                </label>
                <select
                  value={replyForm.status}
                  onChange={(e) => setReplyForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Keep current status</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setReplyModal(false);
                    setSelectedTicket(null);
                    setReplyForm({ reply: '', status: '' });
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReply}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Send Reply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}