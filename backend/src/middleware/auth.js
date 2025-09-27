import jwt from 'jsonwebtoken';
import PickUpPartner from '../models/PickUpPartner.js';
import PickUpAgent from '../models/PickUpAgent.js';
import Recycler from '../models/Recycler.js';
import User from '../models/User.js';
import Admin from '../models/Admin.js';


// Verifies JWT and attaches { id, role, model } to req.user
export async function auth(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    console.log('🔐 Auth Debug - Path:', req.path);
    console.log('🔐 Auth Debug - Token present:', !!token);
    console.log('🔐 Auth Debug - Token preview:', token ? `${token.substring(0, 20)}...` : 'null');

    if (!token) {
        console.log('❌ Auth Debug - No token provided');
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('🔐 Auth Debug - Decoded token:', decoded);
        
        // Try to find user in different models based on role
        let user = null;
        let userModel = null;

        switch (decoded.role) {
            case 'user':
                user = await User.findById(decoded.id).select('-password');
                userModel = 'User';
                break;
            case 'admin':
                user = await Admin.findById(decoded.id).select('-password');
                userModel = 'Admin';
                break;
            case 'pickuppartner':
                user = await PickUpPartner.findById(decoded.id).select('-password');
                userModel = 'PickUpPartner';
                break;
            case 'pickupagent':
                user = await PickUpAgent.findById(decoded.id).select('-password');
                userModel = 'PickUpAgent';
                break;
            case 'recycler':
                user = await Recycler.findById(decoded.id).select('-password');
                userModel = 'Recycler';
                break;
            default:
                console.log('❌ Auth Debug - Invalid role:', decoded.role);
                return res.status(401).json({ message: 'Invalid user role' });
        }

        console.log('🔐 Auth Debug - User found:', !!user, 'Model:', userModel);

        if (!user) {
            console.log('❌ Auth Debug - User not found in', userModel, 'model');
            return res.status(401).json({ message: 'User not found' });
        }

        // Check if user is active (if the model has isActive field)
        if (user.isActive !== undefined && !user.isActive) {
            console.log('❌ Auth Debug - User inactive');
            return res.status(403).json({ message: 'Account is deactivated' });
        }

        console.log('✅ Auth Debug - Authentication successful');

        req.user = {
            id: decoded.id,
            role: decoded.role,
            model: userModel,
            userData: user
        };
        
        next();
    } catch (err) {
        console.error('❌ Auth Debug - Authentication error:', err.message);
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
}

// Pickup Partner specific authentication middleware
export const authenticatePickupPartner = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'No token provided' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verify the user is a pickup partner
        const partner = await PickUpPartner.findById(decoded.id).select('-password');
        
        if (!partner) {
            return res.status(401).json({ 
                success: false, 
                message: 'Partner not found' 
            });
        }

        if (partner.role !== 'pickuppartner') {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied: Pickup partner role required' 
            });
        }

        req.user = {
            id: partner._id,
            role: partner.role,
            partnerId: partner.partnerId,
            companyName: partner.companyName,
            name: partner.name
        };
        
        next();
    } catch (err) {
        console.error('Authentication error:', err);
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid or expired token' 
        });
    }
};

// Pickup Agent specific authentication middleware
export const authenticatePickupAgent = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'No token provided' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verify the user is a pickup agent
        const agent = await PickUpAgent.findById(decoded.id).select('-password');
        
        if (!agent) {
            return res.status(401).json({ 
                success: false, 
                message: 'Pickup agent not found' 
            });
        }

        if (agent.role !== 'pickupagent') {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied: Pickup agent role required' 
            });
        }

        req.user = {
            id: agent._id,
            role: agent.role,
            agentId: agent.agentId,
            name: agent.name,
            email: agent.email,
            partnerId: agent.partnerId
        };
        
        next();
    } catch (err) {
        console.error('Pickup agent authentication error:', err);
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid or expired token' 
        });
    }
};

// Recycler specific authentication middleware
export const authenticateRecycler = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

        console.log('Auth header:', authHeader);
        console.log('Extracted token:', token ? `${token.substring(0, 20)}...` : 'null');

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'No token provided' 
            });
        }

        // Additional validation for token format
        if (!token || token === 'null' || token === 'undefined' || token.trim() === '') {
            console.log('Invalid token format detected');
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid token format' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verify the user is a recycler
        const recycler = await Recycler.findById(decoded.id).select('-password');
        
        if (!recycler) {
            return res.status(401).json({ 
                success: false, 
                message: 'Recycler not found' 
            });
        }

        if (recycler.role !== 'recycler') {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied: Recycler role required' 
            });
        }

        req.user = {
            id: recycler._id,
            role: recycler.role,
            recyclerId: recycler.recyclerId,
            facilityName: recycler.facilityName,
            name: recycler.name
        };
        
        next();
    } catch (err) {
        console.error('Authentication error:', err);
        
        // More specific error handling for JWT issues
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid token format or signature' 
            });
        } else if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Token has expired' 
            });
        } else {
            return res.status(401).json({ 
                success: false, 
                message: 'Token validation failed' 
            });
        }
    }
};

// User specific authentication middleware
export const authenticateUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'No token provided' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verify the user exists in the User model
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        if (!user.isActive) {
            return res.status(403).json({ 
                success: false, 
                message: 'Account is deactivated' 
            });
        }

        req.user = {
            id: user._id,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email
        };
        
        next();
    } catch (err) {
        console.error('User authentication error:', err);
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid or expired token' 
        });
    }
};

// Admin specific authentication middleware
export const authenticateAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'No token provided' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verify the user is an admin
        const admin = await Admin.findById(decoded.id).select('-password');
        
        if (!admin) {
            return res.status(401).json({ 
                success: false, 
                message: 'Admin not found' 
            });
        }

        if (admin.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied: Admin role required' 
            });
        }

        req.user = {
            id: admin._id,
            role: admin.role,
            name: admin.name,
            email: admin.email
        };
        
        next();
    } catch (err) {
        console.error('Admin authentication error:', err);
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid or expired token' 
        });
    }
};