import express from 'express';
import {
    getHighFillBins,
    getBinForCollection,
    collectBin,
    getAgentCollections,
    getUserCollections,
    getPartnerCollections,
    getCollectionStats,
    collectWasteByWeight,
    resetBinWeight
} from '../controllers/collection.controller.js';
import { auth } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

// Public routes for testing
router.get('/bins/high-fill/public', getHighFillBins);

// Agent routes
router.get('/bins/high-fill', auth, authorize('pickupagent'), getHighFillBins);
router.get('/bins/:binId/details', auth, authorize('pickupagent'), getBinForCollection);
router.post('/bins/:binId/collect', auth, authorize('pickupagent'), collectBin);
router.post('/', auth, authorize('pickupagent'), collectWasteByWeight); // New collection endpoint
router.get('/agent/history', auth, authorize('pickupagent'), getAgentCollections);

// User routes
router.get('/user/history', auth, authorize('user'), getUserCollections);

// Partner routes
router.get('/partner/history', auth, authorize('pickuppartner'), getPartnerCollections);

// General stats (role-specific)
router.get('/stats', auth, authorize('pickupagent', 'pickuppartner', 'user'), getCollectionStats);

export default router;