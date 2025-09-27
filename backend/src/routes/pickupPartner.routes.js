import express from 'express';
import { 
    registerPickUpPartner, 
    loginPickUpPartner, 
    updatePickUpPartner, 
    logoutPickUpPartner, 
    getPickUpPartnerProfile,
    getPartnerBinCollections,
    updateCollectionStatus,
    getPartnerWarehouse,
    getPartnerScheduleCollections,
    updateScheduleCollectionStatus,
    getPartnerOrders
} from '../controllers/pickupPartner.controller.js';
import { authenticatePickupPartner } from '../middleware/auth.js';

const router = express.Router();

// Register
router.post('/register', registerPickUpPartner);
// Login
router.post('/login', loginPickUpPartner);
// Update partner details
router.post('/update/:id', updatePickUpPartner);
// Logout partner
router.post('/logout/:id', logoutPickUpPartner);
// Get partner profile
router.get('/profile/:id', getPickUpPartnerProfile);

// Protected routes (require authentication)
// Get bin collections for partner
router.get('/collections', authenticatePickupPartner, getPartnerBinCollections);
// Update collection status
router.put('/collections/:collectionId/status', authenticatePickupPartner, updateCollectionStatus);
// Get warehouse data
router.get('/warehouse', authenticatePickupPartner, getPartnerWarehouse);
// Get schedule collections for partner
router.get('/schedule-collections', authenticatePickupPartner, getPartnerScheduleCollections);
// Update schedule collection status
router.put('/schedule-collections/:collectionId/status', authenticatePickupPartner, updateScheduleCollectionStatus);
// Get orders for partner
router.get('/orders', authenticatePickupPartner, getPartnerOrders);

export default router;
