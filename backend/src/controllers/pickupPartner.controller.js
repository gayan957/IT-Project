import PickUpPartner from '../models/PickUpPartner.js';
import AgentBin from '../models/AgentBin.js';
import AgentSchedule from '../models/AgentSchedule.js';
import WasteWarehouse from '../models/WasteWarehouse.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Helper function to handle warehouse operations
const updateWarehouseInventory = async (partnerId, wasteType, wasteWeight) => {
    try {
        const existingWarehouse = await WasteWarehouse.findOne({
            pickupPartnerId: partnerId,
            wasteType: wasteType
        });

        if (existingWarehouse) {
            existingWarehouse.totalWeight += wasteWeight;
            await existingWarehouse.save();
        } else {
            const newWarehouse = new WasteWarehouse({
                pickupPartnerId: partnerId,
                wasteType: wasteType,
                totalWeight: wasteWeight
            });
            await newWarehouse.save();
        }
    } catch (warehouseError) {
        console.error('Error updating warehouse inventory:', warehouseError);
        throw warehouseError;
    }
};

// Register a new PickUpPartner
export const registerPickUpPartner = async (req, res) => {
    try {
        const { 
            name, 
            email, 
            password, 
            address, 
            phoneNumber, 
            birthDate, 
            companyName, 
            businessLicense, 
            contactPerson,
            serviceAreas,
            vehicleFleet
        } = req.body;
        
        const existingPartner = await PickUpPartner.findOne({ email });
        if (existingPartner) {
            return res.status(400).json({ 
                success: false, 
                error: 'Partner already exists' 
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Generate unique partner ID
        const partnerId = 'PTR' + Date.now().toString().slice(-6);

        const newPartner = new PickUpPartner({ 
            name, 
            email, 
            password: hashedPassword,
            address,
            phoneNumber,
            birthDate,
            companyName,
            partnerId,
            businessLicense,
            contactPerson,
            serviceAreas,
            vehicleFleet
        });
        
        await newPartner.save();
        res.status(201).json({ 
            success: true, 
            message: 'Partner registered successfully' 
        });
    } catch (error) {
        console.error('Error registering partner:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
};

// Login PickUpPartner
export const loginPickUpPartner = async (req, res) => {
    try {
        const { email, password } = req.body;
        const partner = await PickUpPartner.findOne({ email });
        
        if (!partner) {
            return res.status(404).json({ 
                success: false, 
                error: 'Partner not found' 
            });
        }

        const isMatch = await bcrypt.compare(password, partner.password);
        if (!isMatch) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid credentials' 
            });
        }

        // Update partner login status
        await PickUpPartner.findByIdAndUpdate(partner._id, {
            isLoggedIn: true,
            lastLoginTime: new Date()
        });

        const token = jwt.sign({ id: partner._id, role: partner.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ 
            success: true, 
            token, 
            partner: {
                id: partner._id,
                name: partner.name,
                email: partner.email,
                partnerId: partner.partnerId,
                companyName: partner.companyName,
                role: partner.role
            }
        });
    } catch (error) {
        console.error('Error logging in partner:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
};

// Update partner details
export const updatePickUpPartner = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedData = req.body;

        const partner = await PickUpPartner.findByIdAndUpdate(id, updatedData, { new: true });
        if (!partner) {
            return res.status(404).json({ 
                success: false, 
                error: 'Partner not found' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Partner updated successfully', 
            data: partner 
        });
    } catch (error) {
        console.error('Error updating partner:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
};

// Logout partner
export const logoutPickUpPartner = async (req, res) => {
    try {
        const { id } = req.params;
        
        const partner = await PickUpPartner.findByIdAndUpdate(id, {
            isLoggedIn: false,
            lastLogoutTime: new Date()
        }, { new: true });
        
        if (!partner) {
            return res.status(404).json({ 
                success: false, 
                error: 'Partner not found' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Partner logged out successfully', 
            data: partner 
        });
    } catch (error) {
        console.error('Error logging out partner:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
};

// Get partner profile
export const getPickUpPartnerProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const partner = await PickUpPartner.findById(id).select('-password');
        
        if (!partner) {
            return res.status(404).json({ 
                success: false, 
                error: 'Partner not found' 
            });
        }

        res.json({ 
            success: true, 
            data: partner 
        });
    } catch (error) {
        console.error('Error getting partner profile:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
};

// Get bin collections for pickup partner
export const getPartnerBinCollections = async (req, res) => {
    try {
        const { user } = req;
        const { page = 1, limit = 20, status = 'all' } = req.query;

        // Build filter query
        let filterQuery = { partnerId: user.id };
        
        if (status !== 'all') {
            filterQuery.status = status;
        }

        const collections = await AgentBin.find(filterQuery)
            .populate('agentId', 'name agentId email phoneNumber')
            .populate('binId', 'binId wasteType location address')
            .populate('userId', 'name email phoneNumber')
            .sort({ collectionDate: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await AgentBin.countDocuments(filterQuery);

        // Calculate totals for dashboard
        const totalEarnings = await AgentBin.aggregate([
            { $match: { partnerId: user.id } },
            { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]);

        const statusCounts = await AgentBin.aggregate([
            { $match: { partnerId: user.id } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const statusStats = {};
        statusCounts.forEach(item => {
            statusStats[item._id] = item.count;
        });

        res.json({
            success: true,
            data: {
                collections,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                },
                summary: {
                    totalEarnings: totalEarnings[0]?.total || 0,
                    totalCollections: total,
                    statusCounts: statusStats
                }
            }
        });
    } catch (error) {
        console.error('Error fetching partner bin collections:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
};

// Update collection status (for collect button functionality)
export const updateCollectionStatus = async (req, res) => {
    try {
        const { collectionId } = req.params;
        const { status, notes } = req.body;
        const { user } = req;

        // Verify the collection belongs to this partner
        const collection = await AgentBin.findOne({
            _id: collectionId,
            partnerId: user.id
        });

        if (!collection) {
            return res.status(404).json({
                success: false,
                error: 'Collection not found or unauthorized'
            });
        }

        // If marking as processed, save to WasteWarehouse
        if (status === 'processed' && collection.status === 'collected') {
            try {
                await updateWarehouseInventory(user.id, collection.wasteType, collection.wasteWeight);
            } catch (warehouseError) {
                console.error('Error saving to warehouse:', warehouseError);
                // Continue with status update even if warehouse save fails
            }
        }

        // Update the collection status
        const updatedCollection = await AgentBin.findByIdAndUpdate(
            collectionId,
            { 
                status: status || 'processed',
                notes: notes || collection.notes,
                updatedAt: new Date()
            },
            { new: true }
        ).populate('agentId', 'name agentId email')
         .populate('binId', 'binId wasteType location address')
         .populate('userId', 'name email');

        res.json({
            success: true,
            message: 'Collection status updated successfully',
            data: updatedCollection
        });
    } catch (error) {
        console.error('Error updating collection status:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

// Get partner warehouse data
export const getPartnerWarehouse = async (req, res) => {
    try {
        const { user } = req;

        const warehouseData = await WasteWarehouse.find({ pickupPartnerId: user.id })
            .sort({ wasteType: 1 });

        // Calculate total weight across all waste types
        const totalWeight = warehouseData.reduce((sum, item) => sum + item.totalWeight, 0);

        res.json({
            success: true,
            data: {
                warehouseData,
                totalWeight,
                wasteTypeCount: warehouseData.length
            }
        });
    } catch (error) {
        console.error('Error fetching partner warehouse data:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

// Get schedule collections for pickup partner
export const getPartnerScheduleCollections = async (req, res) => {
    try {
        const { user } = req;
        const { page = 1, limit = 20, status = 'all' } = req.query;

        // Build filter query
        let filterQuery = { partnerId: user.id };
        
        if (status !== 'all') {
            filterQuery.status = status;
        }

        const scheduleCollections = await AgentSchedule.find(filterQuery)
            .populate('agentId', 'name agentId email phoneNumber')
            .populate('scheduleId', 'wasteType pickupTime')
            .populate('userId', 'name email phoneNumber')
            .sort({ collectionDate: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await AgentSchedule.countDocuments(filterQuery);

        // Calculate totals for dashboard
        const totalEarnings = await AgentSchedule.aggregate([
            { $match: { partnerId: user.id } },
            { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]);

        const statusCounts = await AgentSchedule.aggregate([
            { $match: { partnerId: user.id } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const statusStats = {};
        statusCounts.forEach(item => {
            statusStats[item._id] = item.count;
        });

        res.json({
            success: true,
            data: {
                scheduleCollections,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                },
                summary: {
                    totalEarnings: totalEarnings[0]?.total || 0,
                    totalCollections: total,
                    statusCounts: statusStats
                }
            }
        });
    } catch (error) {
        console.error('Error fetching partner schedule collections:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
};

// Update schedule collection status
export const updateScheduleCollectionStatus = async (req, res) => {
    try {
        const { collectionId } = req.params;
        const { status, notes } = req.body;
        const { user } = req;

        // Verify the schedule collection belongs to this partner
        const scheduleCollection = await AgentSchedule.findOne({
            _id: collectionId,
            partnerId: user.id
        });

        if (!scheduleCollection) {
            return res.status(404).json({
                success: false,
                error: 'Schedule collection not found or unauthorized'
            });
        }

        // If marking as processed, save to WasteWarehouse
        if (status === 'processed' && scheduleCollection.status === 'collected') {
            try {
                await updateWarehouseInventory(user.id, scheduleCollection.wasteType, scheduleCollection.wasteWeight);
            } catch (warehouseError) {
                console.error('Error saving schedule to warehouse:', warehouseError);
                // Continue with status update even if warehouse save fails
            }
        }

        // Update the schedule collection status
        const updatedScheduleCollection = await AgentSchedule.findByIdAndUpdate(
            collectionId,
            { 
                status: status || 'processed',
                notes: notes || scheduleCollection.notes,
                updatedAt: new Date()
            },
            { new: true }
        ).populate('agentId', 'name agentId email')
         .populate('scheduleId', 'wasteType pickupTime')
         .populate('userId', 'name email');

        res.json({
            success: true,
            message: 'Schedule collection status updated successfully',
            data: updatedScheduleCollection
        });
    } catch (error) {
        console.error('Error updating schedule collection status:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};