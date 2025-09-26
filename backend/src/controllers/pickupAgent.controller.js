import PickUpAgent from '../models/PickUpAgent.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Register a new PickUpAgent
export const registerPickUpAgent = async (req, res) => {
    try {
        const { name, email, password, address, phoneNumber, birthDate, vehicleNumber, assignedArea, partnerId } = req.body;
        
        const existingAgent = await PickUpAgent.findOne({ email });
        if (existingAgent) {
            return res.status(400).json({ error: 'Agent already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Generate unique agent ID
        const agentId = 'AGT' + Date.now().toString().slice(-6);

        const newAgent = new PickUpAgent({ 
            name, 
            email, 
            password: hashedPassword,
            address,
            phoneNumber,
            birthDate,
            agentId,
            partnerId,
            vehicleNumber,
            assignedArea
        });
        
        await newAgent.save();
        res.status(201).json({ message: 'Agent registered successfully', agent: newAgent });
    } catch (error) {
        console.error('Error registering agent:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Login PickUpAgent
export const loginPickUpAgent = async (req, res) => {
    try {
        const { email, password } = req.body;
        const agent = await PickUpAgent.findOne({ email });
        
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }

        const isMatch = await bcrypt.compare(password, agent.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Update agent login status
        await PickUpAgent.findByIdAndUpdate(agent._id, {
            isLoggedIn: true,
            lastLoginTime: new Date()
        });

        const token = jwt.sign({ id: agent._id, role: agent.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ 
            success: true, 
            token, 
            agent: {
                id: agent._id,
                name: agent.name,
                email: agent.email,
                agentId: agent.agentId,
                role: agent.role
            }
        });
    } catch (error) {
        console.error('Error logging in agent:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update agent details
export const updatePickUpAgent = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedData = req.body;

        const agent = await PickUpAgent.findByIdAndUpdate(id, updatedData, { new: true });
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }

        res.json({ message: 'Agent updated successfully', agent });
    } catch (error) {
        console.error('Error updating agent:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get agent current location
export const getPickUpAgentLocation = async (req, res) => {
    try {
        const { id } = req.params;
        const agent = await PickUpAgent.findById(id);
        
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }

        if (!agent.latitude || !agent.longitude) {
            return res.status(404).json({ error: 'Agent location not available' });
        }

        res.json({ 
            agentId: agent._id,
            latitude: agent.latitude,
            longitude: agent.longitude,
            timestamp: agent.updatedAt
        });
    } catch (error) {
        console.error('Error getting agent location:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Logout agent
export const logoutPickUpAgent = async (req, res) => {
    try {
        const { id } = req.params;
        
        const agent = await PickUpAgent.findByIdAndUpdate(id, {
            isLoggedIn: false,
            lastLogoutTime: new Date()
        }, { new: true });
        
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }

        res.json({ message: 'Agent logged out successfully', agent });
    } catch (error) {
        console.error('Error logging out agent:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get agent profile
export const getPickUpAgentProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const agent = await PickUpAgent.findById(id).select('-password');
        
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }

        res.json({ agent });
    } catch (error) {
        console.error('Error getting agent profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get all agents for a partner (or all for admin)
export const getPickUpAgents = async (req, res) => {
    try {
        const { user } = req;
        let query = {};

        // If user is a partner, only show their agents
        if (user.role === 'pickuppartner') {
            query.partnerId = user.id;
        }
        // If user is admin, show all agents (no additional filter)

        const agents = await PickUpAgent.find(query)
            .select('-password')
            .populate('partnerId', 'name companyName email')
            .sort({ createdAt: -1 });

        res.json({ agents });
    } catch (error) {
        console.error('Error getting agents:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Create a new agent (by partner or admin)
export const createPickUpAgent = async (req, res) => {
    try {
        const { name, email, password, address, phoneNumber, birthDate, vehicleNumber, assignedArea } = req.body;
        const { user } = req;
        
        const existingAgent = await PickUpAgent.findOne({ email });
        if (existingAgent) {
            return res.status(400).json({ error: 'Agent with this email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Generate unique agent ID
        const agentId = 'AGT' + Date.now().toString().slice(-6);

        // Set partnerId based on user role
        let partnerId;
        if (user.role === 'pickuppartner') {
            partnerId = user.id;
        } else if (user.role === 'admin') {
            // Admin can specify partnerId or it should be provided in request
            partnerId = req.body.partnerId;
            if (!partnerId) {
                return res.status(400).json({ error: 'Partner ID is required when creating agent as admin' });
            }
        } else {
            return res.status(403).json({ error: 'Unauthorized to create agents' });
        }

        const newAgent = new PickUpAgent({ 
            name, 
            email, 
            password: hashedPassword,
            address,
            phoneNumber,
            birthDate,
            agentId,
            partnerId,
            vehicleNumber,
            assignedArea
        });
        
        await newAgent.save();
        await newAgent.populate('partnerId', 'name companyName email');
        
        res.status(201).json({ 
            message: 'Agent created successfully', 
            agent: {
                ...newAgent.toObject(),
                password: undefined
            }
        });
    } catch (error) {
        console.error('Error creating agent:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update an agent (by partner who owns the agent or admin)
export const updatePickUpAgentByPartner = async (req, res) => {
    try {
        const { id } = req.params;
        const { user } = req;
        const updateData = { ...req.body };

        // Remove sensitive fields that shouldn't be updated via this endpoint
        delete updateData.password;
        delete updateData.agentId;
        delete updateData.partnerId;

        // Find the agent first
        const agent = await PickUpAgent.findById(id);
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }

        // Check authorization
        if (user.role === 'pickuppartner' && agent.partnerId.toString() !== user.id) {
            return res.status(403).json({ error: 'You can only update your own agents' });
        }
        // Admin can update any agent

        const updatedAgent = await PickUpAgent.findByIdAndUpdate(
            id, 
            updateData, 
            { new: true, runValidators: true }
        ).select('-password').populate('partnerId', 'name companyName email');

        res.json({ 
            message: 'Agent updated successfully', 
            agent: updatedAgent 
        });
    } catch (error) {
        console.error('Error updating agent:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete an agent (by partner who owns the agent or admin)
export const deletePickUpAgent = async (req, res) => {
    try {
        const { id } = req.params;
        const { user } = req;

        // Find the agent first
        const agent = await PickUpAgent.findById(id);
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }

        // Check authorization
        if (user.role === 'pickuppartner' && agent.partnerId.toString() !== user.id) {
            return res.status(403).json({ error: 'You can only delete your own agents' });
        }
        // Admin can delete any agent

        await PickUpAgent.findByIdAndDelete(id);

        res.json({ message: 'Agent deleted successfully' });
    } catch (error) {
        console.error('Error deleting agent:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get single agent details (by partner who owns the agent or admin)
export const getPickUpAgentById = async (req, res) => {
    try {
        const { id } = req.params;
        const { user } = req;

        const agent = await PickUpAgent.findById(id)
            .select('-password')
            .populate('partnerId', 'name companyName email');
        
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }

        // Check authorization
        if (user.role === 'pickuppartner' && agent.partnerId._id.toString() !== user.id) {
            return res.status(403).json({ error: 'You can only view your own agents' });
        }
        // Admin can view any agent

        res.json({ agent });
    } catch (error) {
        console.error('Error getting agent:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
