import SupportTicket from '../models/SupportTicket.js';
import User from '../models/User.js';
import Admin from '../models/Admin.js';

// Create a new support ticket
export const createTicket = async (req, res) => {
  try {
    const { subject, category, message, isUrgent } = req.body;
    const userId = req.user.id;

    console.log('Creating ticket with data:', { subject, category, message, isUrgent, userId });

    // Validate required fields
    if (!subject || !category || !message) {
      return res.status(400).json({
        success: false,
        message: 'Subject, category, and message are required'
      });
    }

    // Generate ticket ID manually before creating the document
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const ticketId = `TKT-${timestamp.toString().slice(-6)}-${random.toString().padStart(4, '0')}`;
    
    console.log('Generated ticket ID:', ticketId);

    // Create new ticket with generated ticketId
    const ticket = new SupportTicket({
      ticketId,
      userId,
      subject,
      category,
      message,
      isUrgent: isUrgent || false,
      priority: isUrgent ? 'urgent' : 'medium'
    });

    console.log('Ticket object before save:', ticket);

    await ticket.save();

    console.log('Ticket saved successfully:', ticket);

    // Populate user information
    await ticket.populate('userId', 'name email');

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      ticket
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create support ticket',
      error: error.message
    });
  }
};

// Get user's tickets
export const getUserTickets = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, category, page = 1, limit = 10 } = req.query;

    // Build filter
    const filter = { userId };
    if (status) filter.status = status;
    if (category) filter.category = category;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get tickets with pagination
    const tickets = await SupportTicket.find(filter)
      .populate('userId', 'name email')
      .populate('adminId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalTickets = await SupportTicket.countDocuments(filter);
    const totalPages = Math.ceil(totalTickets / limit);

    res.status(200).json({
      success: true,
      tickets,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalTickets,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get user tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets',
      error: error.message
    });
  }
};

// Get single ticket by ID
export const getTicketById = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user.id;

    const ticket = await SupportTicket.findOne({
      $or: [
        { _id: ticketId, userId },
        { ticketId, userId }
      ]
    })
      .populate('userId', 'name email phone')
      .populate('adminId', 'name email');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    res.status(200).json({
      success: true,
      ticket
    });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket',
      error: error.message
    });
  }
};

// Update ticket (user can only update certain fields)
export const updateTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user.id;
    const { message, isUrgent } = req.body;

    const ticket = await SupportTicket.findOne({
      $or: [
        { _id: ticketId, userId },
        { ticketId, userId }
      ]
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Users can only update if ticket is still open
    if (ticket.status === 'closed' || ticket.status === 'resolved') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update closed or resolved ticket'
      });
    }

    // Update allowed fields
    if (message) ticket.message = message;
    if (typeof isUrgent !== 'undefined') {
      ticket.isUrgent = isUrgent;
      ticket.priority = isUrgent ? 'urgent' : ticket.priority;
    }

    await ticket.save();

    res.status(200).json({
      success: true,
      message: 'Ticket updated successfully',
      ticket
    });
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ticket',
      error: error.message
    });
  }
};

// Admin: Get all tickets with filtering and pagination
export const getAllTickets = async (req, res) => {
  try {
    const { status, category, priority, page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    
    // Search functionality
    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { ticketId: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get tickets with pagination
    const tickets = await SupportTicket.find(filter)
      .populate('userId', 'name email phone')
      .populate('adminId', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalTickets = await SupportTicket.countDocuments(filter);
    const totalPages = Math.ceil(totalTickets / limit);

    // Get statistics
    const stats = await SupportTicket.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      tickets,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalTickets,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      stats
    });
  } catch (error) {
    console.error('Get all tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets',
      error: error.message
    });
  }
};

// Admin: Reply to a ticket
export const replyToTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { reply, status } = req.body;
    const adminId = req.user.id; // Fixed: use req.user.id instead of req.admin.id

    console.log('🎫 Reply Debug - ticketId:', ticketId);
    console.log('🎫 Reply Debug - adminId:', adminId);
    console.log('🎫 Reply Debug - reply:', reply);
    console.log('🎫 Reply Debug - status:', status);

    if (!reply) {
      return res.status(400).json({
        success: false,
        message: 'Reply message is required'
      });
    }

    const ticket = await SupportTicket.findOne({
      $or: [
        { _id: ticketId },
        { ticketId }
      ]
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    console.log('🎫 Reply Debug - ticket found:', ticket._id);

    // Update ticket with admin reply
    ticket.adminReply = reply;
    ticket.adminId = adminId;
    ticket.repliedAt = new Date();
    
    // Update status if provided
    if (status && ['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      ticket.status = status;
    } else if (ticket.status === 'open') {
      // First reply sets status to in_progress
      ticket.status = 'in_progress';
    }

    await ticket.save();
    console.log('🎫 Reply Debug - ticket saved successfully');

    // Populate for response
    await ticket.populate([
      { path: 'userId', select: 'name email phone' },
      { path: 'adminId', select: 'name email' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Reply sent successfully',
      ticket
    });
  } catch (error) {
    console.error('❌ Reply to ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reply',
      error: error.message
    });
  }
};

// Admin: Update ticket status
export const updateTicketStatus = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status, priority } = req.body;

    const ticket = await SupportTicket.findOne({
      $or: [
        { _id: ticketId },
        { ticketId }
      ]
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Update status if provided and valid
    if (status && ['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      ticket.status = status;
    }

    // Update priority if provided and valid
    if (priority && ['low', 'medium', 'high', 'urgent'].includes(priority)) {
      ticket.priority = priority;
      ticket.isUrgent = priority === 'urgent';
    }

    await ticket.save();

    res.status(200).json({
      success: true,
      message: 'Ticket updated successfully',
      ticket
    });
  } catch (error) {
    console.error('Update ticket status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ticket',
      error: error.message
    });
  }
};

// Get ticket statistics
export const getTicketStats = async (req, res) => {
  try {
    const stats = await SupportTicket.aggregate([
      {
        $group: {
          _id: null,
          totalTickets: { $sum: 1 },
          openTickets: {
            $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] }
          },
          inProgressTickets: {
            $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
          },
          resolvedTickets: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          },
          closedTickets: {
            $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] }
          },
          urgentTickets: {
            $sum: { $cond: ['$isUrgent', 1, 0] }
          },
          avgResponseTime: {
            $avg: {
              $cond: [
                '$repliedAt',
                { $subtract: ['$repliedAt', '$createdAt'] },
                null
              ]
            }
          }
        }
      }
    ]);

    // Category-wise statistics
    const categoryStats = await SupportTicket.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      stats: stats[0] || {},
      categoryStats
    });
  } catch (error) {
    console.error('Get ticket stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};