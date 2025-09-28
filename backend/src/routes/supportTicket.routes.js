import express from 'express';
import {
  createTicket,
  getUserTickets,
  getTicketById,
  updateTicket,
  getAllTickets,
  replyToTicket,
  updateTicketStatus,
  getTicketStats
} from '../controllers/supportTicket.controller.js';
import { auth } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { checkDatabaseConnection } from '../middleware/dbConnection.js';

const router = express.Router();

// Apply database connection check to all routes
router.use(checkDatabaseConnection);

// User routes (protected)
router.post('/', auth, createTicket);
router.get('/my-tickets', auth, getUserTickets);
router.get('/my-tickets/:ticketId', auth, getTicketById);
router.put('/my-tickets/:ticketId', auth, updateTicket);

// Admin routes (protected + admin role)
router.get('/admin/all', auth, authorize('admin'), getAllTickets);
router.post('/admin/:ticketId/reply', auth, authorize('admin'), replyToTicket);
router.put('/admin/:ticketId/status', auth, authorize('admin'), updateTicketStatus);
router.get('/admin/stats', auth, authorize('admin'), getTicketStats);

export default router;