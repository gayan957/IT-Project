import express from 'express';
import {
  getAllWarehouseWastePrices,
  getWarehouseWastePriceById,
  getWarehouseWastePriceByType,
  createOrUpdateWarehouseWastePrice,
  updateWarehouseWastePrice,
  deleteWarehouseWastePrice,
  calculateWarehouseEarnings,
  initializeDefaultWarehouseWastePrices
} from '../controllers/warehouseWastePrice.controller.js';
import { auth } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

// Routes that require admin authentication
router.use(auth, authorize('admin'));

// GET /api/admin/warehouse-waste-prices - Get all warehouse waste prices
router.get('/', getAllWarehouseWastePrices);

// GET /api/admin/warehouse-waste-prices/initialize - Initialize default prices
router.post('/initialize', initializeDefaultWarehouseWastePrices);

// GET /api/admin/warehouse-waste-prices/:id - Get warehouse waste price by ID
router.get('/:id', getWarehouseWastePriceById);

// GET /api/admin/warehouse-waste-prices/type/:wasteType - Get warehouse waste price by type
router.get('/type/:wasteType', getWarehouseWastePriceByType);

// POST /api/admin/warehouse-waste-prices - Create or update warehouse waste price
router.post('/', createOrUpdateWarehouseWastePrice);

// PUT /api/admin/warehouse-waste-prices/:id - Update warehouse waste price
router.put('/:id', updateWarehouseWastePrice);

// DELETE /api/admin/warehouse-waste-prices/:id - Delete (deactivate) warehouse waste price
router.delete('/:id', deleteWarehouseWastePrice);

// POST /api/admin/warehouse-waste-prices/calculate - Calculate earnings
router.post('/calculate', calculateWarehouseEarnings);

export default router;