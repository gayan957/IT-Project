import express from 'express';
import { 
    registerRecycler, 
    loginRecycler, 
    updateRecycler, 
    logoutRecycler, 
    getRecyclerProfile,
    getRecyclerWarehouse,
    getAvailableWaste,
    updateRecyclerPassword,
    getRecyclerStatistics
} from '../controllers/recycler.controller.js';
import { authenticateRecycler } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', registerRecycler);
router.post('/login', loginRecycler);
router.put('/update/:id', updateRecycler);
router.post('/logout/:id', logoutRecycler);
router.get('/profile/:id', getRecyclerProfile);
router.put('/password/:id', updateRecyclerPassword);

// Protected routes (require authentication)
router.get('/warehouse', authenticateRecycler, getRecyclerWarehouse);
router.get('/available-waste', authenticateRecycler, getAvailableWaste);
router.get('/statistics', authenticateRecycler, getRecyclerStatistics);

export default router;