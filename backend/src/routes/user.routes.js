import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { deleteMe, getMe, updateMe } from '../controllers/user.controller.js';


const router = Router();


router.get('/me', auth, authorize('user', 'admin', 'pickupagent', 'pickuppartner'), getMe);
router.put('/me', auth, authorize('user'), updateMe);
router.delete('/me', auth, authorize('user'), deleteMe);


export default router;