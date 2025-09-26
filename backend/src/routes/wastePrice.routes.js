import express from 'express';
import {
  getAllWastePrices,
  getWastePriceByType,
  updateWastePrice,
  deleteWastePrice,
  initializeDefaultPrices
} from '../controllers/wastePrice.controller.js';
import { auth } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

// Public routes (all authenticated users can read)
router.get('/', auth, getAllWastePrices);
router.get('/:wasteType', auth, getWastePriceByType);

// Admin only routes
router.put('/:wasteType', auth, authorize('admin'), updateWastePrice);
router.delete('/:wasteType', auth, authorize('admin'), deleteWastePrice);
router.post('/initialize', auth, authorize('admin'), initializeDefaultPrices);

export default router;