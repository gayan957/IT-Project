import express from 'express';
import { 
    registerPickUpAgent, 
    loginPickUpAgent, 
    updatePickUpAgent, 
    getPickUpAgentLocation, 
    logoutPickUpAgent, 
    getPickUpAgentProfile,
    getPickUpAgents,
    createPickUpAgent,
    updatePickUpAgentByPartner,
    deletePickUpAgent,
    getPickUpAgentById
} from '../controllers/pickupAgent.controller.js';
import { auth } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

// Public routes
// Register
router.post('/register', registerPickUpAgent);
// Login
router.post('/login', loginPickUpAgent);

// Protected routes - require authentication
// Update agent details (legacy route)
router.post('/update/:id', auth, updatePickUpAgent);
// Get agent location
router.get('/location/:id', auth, getPickUpAgentLocation);
// Logout agent
router.post('/logout/:id', auth, logoutPickUpAgent);
// Get agent profile
router.get('/profile/:id', auth, getPickUpAgentProfile);

// Agent Management routes - for partners and admins
// Get all agents (partners see their own, admins see all)
router.get('/manage', auth, authorize('pickuppartner', 'admin'), getPickUpAgents);
// Create a new agent
router.post('/manage', auth, authorize('pickuppartner', 'admin'), createPickUpAgent);
// Get single agent by ID
router.get('/manage/:id', auth, authorize('pickuppartner', 'admin'), getPickUpAgentById);
// Update agent
router.put('/manage/:id', auth, authorize('pickuppartner', 'admin'), updatePickUpAgentByPartner);
// Delete agent
router.delete('/manage/:id', auth, authorize('pickuppartner', 'admin'), deletePickUpAgent);

export default router;
