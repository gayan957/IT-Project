import { Router } from 'express';
import { loginAdmin, loginUser, registerAdmin, registerUser, generalLogin } from '../controllers/auth.controller.js';


const router = Router();

// General login for all user types
router.post('/login', generalLogin);

// User auth
router.post('/users/register', registerUser);
router.post('/users/login', loginUser);


// Admin auth
router.post('/admin/register', registerAdmin);
router.post('/admin/login', loginAdmin);


export default router;