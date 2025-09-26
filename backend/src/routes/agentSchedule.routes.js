import express from 'express';
import { 
    collectScheduleWaste, 
    getAgentScheduleCollections,
    getMyScheduleCollections,
    getPartnerScheduleCollections,
    getScheduleCollectionStats,
    getScheduleForCollection,
    getSchedulesForMap,
    getUserScheduleCollections
} from '../controllers/agentSchedule.controller.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

// Schedule collection routes
router.get('/map', getSchedulesForMap);
router.get('/schedule/:scheduleId', getScheduleForCollection);
router.post('/collect', collectScheduleWaste);
router.get('/history', getMyScheduleCollections); // For authenticated agent
router.get('/user', getUserScheduleCollections); // For authenticated user
router.get('/agent/:agentId', getAgentScheduleCollections);
router.get('/partner/:partnerId', getPartnerScheduleCollections);
router.get('/stats', getScheduleCollectionStats);

export default router;