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
    getRecyclerStatistics,
    placeOrder,
    getOrderQuote,
    getRecyclerOrders,
    processRecyclerOrder
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
router.get('/order-quote', authenticateRecycler, getOrderQuote);
router.post('/place-order', authenticateRecycler, placeOrder);
router.get('/orders', authenticateRecycler, getRecyclerOrders);
router.patch('/orders/:orderId/process', authenticateRecycler, processRecyclerOrder);

export default router;