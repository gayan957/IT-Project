import jwt from 'jsonwebtoken';
import PickUpPartner from '../models/PickUpPartner.js';
import PickUpAgent from '../models/PickUpAgent.js';
import Recycler from '../models/Recycler.js';


// Verifies JWT and attaches { id, role, model } to req.user
export function auth(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;


    if (!token) return res.status(401).json({ message: 'No token provided' });


    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { id, role, model }
        next();
    } catch (err) {
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

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'No token provided' 
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
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid or expired token' 
        });
    }
};