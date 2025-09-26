import { Router } from 'express';
import { auth, authenticatePickupAgent } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import {
  calculateSalary,
  saveSalary,
  getPartnerSalaries,
  getPartnerAgents,
  getAgentSalaries,
  deleteSalary,
  calculateOvertimeHelper,
  calculateNoPayHelper
} from '../controllers/salary.controller.js';

const router = Router();

// Salary calculation routes (require partner authentication)
router.post('/calculate', auth, authorize('pickuppartner'), calculateSalary);
router.post('/save', auth, authorize('pickuppartner'), saveSalary);
router.get('/partner/:partnerId', auth, authorize('pickuppartner'), getPartnerSalaries);
router.get('/agents', auth, authorize('pickuppartner'), getPartnerAgents);
router.delete('/:salaryId', auth, authorize('pickuppartner'), deleteSalary);

// Agent salary inquiry routes (require agent authentication)
router.get('/agent/my-salaries', authenticatePickupAgent, getAgentSalaries);

// Debug route to check authentication
router.get('/debug/auth', auth, (req, res) => {
  res.json({
    success: true,
    user: req.user,
    message: 'Authentication successful'
  });
});

// Helper calculation routes
router.post('/calculate-overtime', auth, authorize('pickuppartner'), calculateOvertimeHelper);
router.post('/calculate-nopay', auth, authorize('pickuppartner'), calculateNoPayHelper);

export default router;
