import express from 'express';
import * as scheduleController from '../controllers/schedule.controller.js';
import { auth } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();
// Create schedule
router.post('/', auth, authorize("user", "admin"), scheduleController.createSchedule);
// Get user schedules
router.get('/', auth, authorize("user", "admin"), scheduleController.getUserSchedules);
// Update entire schedule
router.put('/:id', auth, authorize("user", "admin"), scheduleController.updateSchedule);
// Update schedule status
router.patch('/:id/status', auth, authorize("user", "admin"), scheduleController.updateScheduleStatus);
// Delete schedule
router.delete('/:id', auth, authorize("user", "admin"), scheduleController.deleteSchedule);

export default router;
