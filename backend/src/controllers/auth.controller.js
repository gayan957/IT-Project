import bcrypt from 'bcryptjs';
import Admin from '../models/Admin.js';
import User from '../models/User.js';
import { generateToken } from "../utils/generateToken.js"; // helper you already have
import dotenv from "dotenv";

dotenv.config();


// ---------- USER AUTH ----------// controllers/auth.controller.js

const SALT_ROUNDS = 10;

export async function registerUser(req, res, next) {
    try {
        const {
            firstName,
            middleName,
            lastName,
            email,
            password,
            phone,
            address,
            birthday,
            location,
            idCardNumber,
        } = req.body;

        // ✅ Check required fields
        if (!firstName || !lastName || !email || !password || !phone || !address || !birthday || !idCardNumber) {
            return res.status(400).json({ message: "All required fields must be filled" });
        }

        // ✅ Check if user already exists
        const exists = await User.findOne({ email });
        if (exists) {
            return res.status(409).json({ message: "User already exists" });
        }

        // ✅ Check if ID card number already exists
        const idExists = await User.findOne({ idCardNumber });
        if (idExists) {
            return res.status(409).json({ message: "ID card number already registered" });
        }

        // ✅ Hash password
        const hash = await bcrypt.hash(password, SALT_ROUNDS);

        // ✅ Create new user
        const user = await User.create({
            firstName,
            middleName,
            lastName,
            email,
            password: hash,
            phone,
            address,
            birthday,
            location, // expects { type: "Point", coordinates: [lng, lat] }
            idCardNumber,
        });

        // ✅ Generate JWT
        const token = generateToken(
            { id: user._id, role: "user", model: "User" },
            process.env.JWT_SECRET,
            process.env.JWT_EXPIRES_IN
        );

        // ✅ Response
        res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                id: user._id,
                firstName,
                middleName,
                lastName,
                email,
                phone,
                address,
                birthday,
                location: user.location,
                idCardNumber,
                role: "user",
            },
        });
    } catch (err) {
        next(err);
    }
}


export async function loginUser(req, res, next) {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        console.log('Login attempt for email:', email);
        console.log('Password provided:', password ? 'Yes' : 'No');

        // Check if user exists (explicitly select password field)
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            console.log('User not found for email:', email);
            return res.status(401).json({ message: "Invalid credentials" });
        }

        console.log('User found:', user.email);
        console.log('User password exists:', user.password ? 'Yes' : 'No');
        console.log('User password length:', user.password ? user.password.length : 'N/A');

        // Check if user password exists
        if (!user.password) {
            console.log('User password is missing in database');
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Check password
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            console.log('Password comparison failed');
            return res.status(401).json({ message: "Invalid credentials" });
        }

        console.log('Login successful for user:', user.email);

        // Generate JWT
        const token = generateToken(
            { id: user._id, role: "user", model: "User" },
            process.env.JWT_SECRET,
            process.env.JWT_EXPIRES_IN
        );

        // Success response
        res.json({
            message: "Login success",
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                middleName: user.middleName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                address: user.address,
                birthday: user.birthday,
                location: user.location,
                idCardNumber: user.idCardNumber,
                role: user.role, // from schema (default: "user")
            },
        });
    } catch (err) {
        next(err);
    }
}

// ---------- ADMIN AUTH ----------
export async function registerAdmin(req, res, next) {
    try {
        const { name, email, password } = req.body;


        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }


        const exists = await Admin.findOne({ email });
        if (exists) return res.status(409).json({ message: 'Admin already exists' });


        const hash = await bcrypt.hash(password, SALT_ROUNDS);
        const admin = await Admin.create({ name, email, password: hash });


        const token = generateToken({ id: admin._id, role: 'admin', model: 'Admin' }, process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN);
        res.status(201).json({
            message: 'Admin registered',
            token,
            admin: { id: admin._id, name, email, role: 'admin' }
        });
    } catch (err) { next(err); }
}


export async function loginAdmin(req, res, next) {
    try {
        const { email, password } = req.body;
        const admin = await Admin.findOne({ email });
        if (!admin) return res.status(401).json({ message: 'Invalid credentials' });


        const match = await bcrypt.compare(password, admin.password);
        if (!match) return res.status(401).json({ message: 'Invalid credentials' });


        const token = generateToken({ id: admin._id, role: 'admin', model: 'Admin' }, process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN);
        res.json({
            message: 'Login success',
            token,
            admin: { id: admin._id, name: admin.name, email: admin.email, role: 'admin' }
        });
    } catch (err) { next(err); }
}

// General login function for all user types
export async function generalLogin(req, res, next) {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        console.log('General login attempt for email:', email);

        // Import models dynamically to avoid circular dependencies
        const PickUpAgent = (await import('../models/PickUpAgent.js')).default;
        const PickUpPartner = (await import('../models/PickUpPartner.js')).default;

        // Check in User model first
        let user = await User.findOne({ email }).select('+password');
        let userType = 'user';
        let userModel = 'User';

        // If not found in User, check in PickUpAgent
        if (!user) {
            user = await PickUpAgent.findOne({ email }).select('+password');
            userType = 'pickupagent';
            userModel = 'PickUpAgent';
        }

        // If not found in PickUpAgent, check in PickUpPartner
        if (!user) {
            user = await PickUpPartner.findOne({ email }).select('+password');
            userType = 'pickuppartner';
            userModel = 'PickUpPartner';
        }

        // If not found in any model, check Admin
        if (!user) {
            user = await Admin.findOne({ email }).select('+password');
            userType = 'admin';
            userModel = 'Admin';
        }

        if (!user) {
            console.log('User not found for email:', email);
            return res.status(401).json({ message: "Invalid credentials" });
        }

        console.log('User found in', userModel, ':', user.email);

        // Check if user password exists
        if (!user.password) {
            console.log('User password is missing in database');
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Check password
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            console.log('Password comparison failed');
            return res.status(401).json({ message: "Invalid credentials" });
        }

        console.log('Login successful for user:', user.email, 'Role:', userType);

        // Generate JWT
        const token = generateToken(
            { id: user._id, role: userType, model: userModel },
            process.env.JWT_SECRET,
            process.env.JWT_EXPIRES_IN
        );

        // Prepare user data based on type
        let userData;
        if (userType === 'user') {
            userData = {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: userType
            };
        } else if (userType === 'pickupagent') {
            userData = {
                id: user._id,
                name: user.name,
                email: user.email,
                agentId: user.agentId,
                partnerId: user.partnerId,
                role: userType
            };
        } else if (userType === 'pickuppartner') {
            userData = {
                id: user._id,
                name: user.name,
                companyName: user.companyName,
                email: user.email,
                partnerId: user.partnerId,
                role: userType
            };
        } else if (userType === 'admin') {
            userData = {
                id: user._id,
                name: user.name,
                email: user.email,
                role: userType
            };
        }

        // Success response
        res.json({
            message: 'Login successful',
            token,
            user: userData
        });

    } catch (err) {
        console.error('General login error:', err);
        next(err);
    }
}