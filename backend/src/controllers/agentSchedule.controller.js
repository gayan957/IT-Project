import AgentSchedule from '../models/AgentSchedule.js';
import UserSchedule from '../models/UserSchedule.js';
import User from '../models/User.js';
import PickUpAgent from '../models/PickUpAgent.js';
import PickUpPartner from '../models/PickUpPartner.js';
import WastePrice from '../models/WastePrice.js';

// Get schedule details with waste price for collection
export const getScheduleForCollection = async (req, res) => {
    try {
        const { scheduleId } = req.params;

        // Get schedule with user details
        const schedule = await UserSchedule.findById(scheduleId)
            .populate('userId', 'name email phone')
            .lean();

        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }

        // Get waste price for the schedule's waste type
        const wastePrice = await WastePrice.findOne({ wasteType: schedule.wasteType });

        if (!wastePrice) {
            return res.status(404).json({ 
                message: `No price found for waste type: ${schedule.wasteType}` 
            });
        }

        // Format the response
        const scheduleData = {
            _id: schedule._id,
            userId: schedule.userId._id,
            userName: schedule.userId.name,
            userEmail: schedule.userId.email,
            userPhone: schedule.userId.phone,
            scheduledDate: schedule.pickupDate,
            scheduledTime: schedule.pickupTime,
            wasteType: schedule.wasteType,
            estimatedWeight: schedule.estimatedWeight || 0,
            location: {
                lat: schedule.location.lat,
                lng: schedule.location.lng,
                address: schedule.address || 'Address not provided'
            },
            pricePerKg: wastePrice.pricePerKg,
            notes: schedule.notes || ''
        };

        res.json(scheduleData);

    } catch (error) {
        console.error('Error fetching schedule for collection:', error);
        res.status(500).json({ 
            message: 'Failed to fetch schedule details', 
            error: error.message 
        });
    }
};

// Collect waste from a schedule
export const collectScheduleWaste = async (req, res) => {
    try {
        console.log('🎯 Schedule Collection Request Body:', JSON.stringify(req.body, null, 2));
        
        const {
            scheduleId,
            wasteType,
            actualWeight,
            pricePerKg,
            totalPrice,
            scheduleLocation,
            notes
        } = req.body;
        
        const { user } = req; // Get user from authentication middleware

        console.log('📋 Extracted fields:', {
            scheduleId, wasteType, actualWeight, pricePerKg, totalPrice, scheduleLocation, notes
        });
        console.log('👤 Authenticated user:', user?.id);

        // Validate required fields
        if (!scheduleId || !wasteType || !actualWeight || !pricePerKg || !scheduleLocation) {
            console.error('❌ Missing required fields');
            return res.status(400).json({ 
                message: 'Missing required fields: scheduleId, wasteType, actualWeight, pricePerKg, scheduleLocation' 
            });
        }

        if (actualWeight <= 0 || pricePerKg <= 0) {
            console.error('❌ Invalid weight or price values');
            return res.status(400).json({ 
                message: 'Weight and price must be positive values' 
            });
        }

        // Find the schedule
        console.log('� Finding schedule with ID:', scheduleId);
        const schedule = await UserSchedule.findById(scheduleId).populate('userId');
        if (!schedule) {
            console.error('❌ Schedule not found:', scheduleId);
            return res.status(404).json({ message: 'Schedule not found' });
        }

        // Find the agent from authenticated user
        console.log('👷 Finding agent with user ID:', user.id);
        const agent = await PickUpAgent.findById(user.id).populate('partnerId');
        if (!agent) {
            console.error('❌ Agent not found for user:', user.id);
            return res.status(404).json({ message: 'Agent not found' });
        }

        console.log('✅ Found agent:', agent.name, 'Partner:', agent.partnerId?.name);

        // Validate schedule location
        if (!scheduleLocation.latitude || !scheduleLocation.longitude || !scheduleLocation.address) {
            console.error('❌ Invalid schedule location:', scheduleLocation);
            return res.status(400).json({ 
                message: 'Schedule location with latitude, longitude, and address is required' 
            });
        }

        // Create the agent schedule collection record (following AgentBin pattern)
        console.log('💾 Creating AgentSchedule record...');
        const agentSchedule = new AgentSchedule({
            scheduleId: schedule._id,
            userId: schedule.userId._id,
            agentId: agent._id,
            partnerId: agent.partnerId._id,
            wasteType,
            wasteWeight: actualWeight,
            pricePerKg,
            totalPrice: totalPrice || (actualWeight * pricePerKg),
            scheduleLocation: {
                latitude: parseFloat(scheduleLocation.latitude),
                longitude: parseFloat(scheduleLocation.longitude),
                address: scheduleLocation.address
            },
            notes: notes || '',
            status: 'collected'
        });

        console.log('💾 Saving AgentSchedule to database...');
        await agentSchedule.save();
        console.log('✅ AgentSchedule saved successfully with ID:', agentSchedule._id);

        // Update the original schedule status to completed
        console.log('📝 Updating original schedule status...');
        await UserSchedule.findByIdAndUpdate(scheduleId, { 
            status: 'completed',
            collectedBy: agent._id,
            collectionDate: new Date()
        });
        console.log('✅ Original schedule status updated');

        // Populate the saved record for response (following AgentBin pattern)
        await agentSchedule.populate([
            { path: 'agentId', select: 'name agentId email' },
            { path: 'scheduleId', select: 'scheduledDate scheduledTime wasteType estimatedWeight' },
            { path: 'userId', select: 'name email phoneNumber' },
            { path: 'partnerId', select: 'companyName name email' }
        ]);

        res.status(201).json({
            message: 'Schedule waste collected successfully',
            collection: agentSchedule
        });

    } catch (error) {
        console.error('❌ Error collecting schedule waste:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ 
            message: 'Failed to collect schedule waste', 
            error: error.message 
        });
    }
};

// Get all schedule collections for an agent
export const getAgentScheduleCollections = async (req, res) => {
    try {
        const { agentId } = req.params;
        const { page = 1, limit = 10, status, startDate, endDate } = req.query;

        // Build filter
        const filter = { agentId };
        
        if (status) {
            filter.status = status;
        }
        
        if (startDate || endDate) {
            filter.collectionDate = {};
            if (startDate) filter.collectionDate.$gte = new Date(startDate);
            if (endDate) filter.collectionDate.$lte = new Date(endDate);
        }

        // Execute query with pagination
        const collections = await AgentSchedule.find(filter)
            .populate('scheduleId', 'scheduledDate scheduledTime wasteType estimatedWeight')
            .populate('userId', 'name email phone')
            .populate('agentId', 'name phone')
            .sort({ collectionDate: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const total = await AgentSchedule.countDocuments(filter);

        res.json({
            collections,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });

    } catch (error) {
        console.error('Error fetching agent schedule collections:', error);
        res.status(500).json({ 
            message: 'Failed to fetch schedule collections', 
            error: error.message 
        });
    }
};

// Get schedule collection history for authenticated agent (similar to getAgentCollections in collection controller)
export const getMyScheduleCollections = async (req, res) => {
    try {
        const { user } = req;
        const { page = 1, limit = 20 } = req.query;

        const collections = await AgentSchedule.find({ agentId: user.id })
            .populate('scheduleId', 'scheduledDate scheduledTime wasteType estimatedWeight')
            .populate('userId', 'name email phoneNumber')
            .populate('partnerId', 'companyName name')
            .sort({ collectionDate: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await AgentSchedule.countDocuments({ agentId: user.id });

        res.json({
            collections,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });

    } catch (error) {
        console.error('Error fetching my schedule collections:', error);
        res.status(500).json({ 
            message: 'Failed to fetch schedule collections', 
            error: error.message 
        });
    }
};

// Get all schedule collections for a partner
export const getPartnerScheduleCollections = async (req, res) => {
    try {
        const { partnerId } = req.params;
        const { page = 1, limit = 10, status, startDate, endDate } = req.query;

        // Build filter
        const filter = { partnerId };
        
        if (status) {
            filter.status = status;
        }
        
        if (startDate || endDate) {
            filter.collectionDate = {};
            if (startDate) filter.collectionDate.$gte = new Date(startDate);
            if (endDate) filter.collectionDate.$lte = new Date(endDate);
        }

        // Execute query with pagination
        const collections = await AgentSchedule.find(filter)
            .populate('scheduleId', 'scheduledDate scheduledTime wasteType estimatedWeight')
            .populate('userId', 'name email phone')
            .populate('agentId', 'name phone')
            .sort({ collectionDate: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const total = await AgentSchedule.countDocuments(filter);

        res.json({
            collections,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });

    } catch (error) {
        console.error('Error fetching partner schedule collections:', error);
        res.status(500).json({ 
            message: 'Failed to fetch schedule collections', 
            error: error.message 
        });
    }
};

// Get schedule collection statistics
export const getScheduleCollectionStats = async (req, res) => {
    try {
        const { agentId, partnerId, startDate, endDate } = req.query;

        // Build match filter
        const matchFilter = {};
        if (agentId) matchFilter.agentId = agentId;
        if (partnerId) matchFilter.partnerId = partnerId;
        
        if (startDate || endDate) {
            matchFilter.collectionDate = {};
            if (startDate) matchFilter.collectionDate.$gte = new Date(startDate);
            if (endDate) matchFilter.collectionDate.$lte = new Date(endDate);
        }

        const stats = await AgentSchedule.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: null,
                    totalCollections: { $sum: 1 },
                    totalWeight: { $sum: '$actualWeight' },
                    totalEstimatedWeight: { $sum: '$estimatedWeight' },
                    totalValue: { $sum: '$totalPrice' },
                    avgWeight: { $avg: '$actualWeight' },
                    avgPrice: { $avg: '$totalPrice' },
                    completedSchedules: {
                        $sum: { $cond: [{ $eq: ['$scheduleStatus', 'completed'] }, 1, 0] }
                    }
                }
            }
        ]);

        // Get status breakdown
        const statusBreakdown = await AgentSchedule.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get waste type breakdown
        const wasteTypeBreakdown = await AgentSchedule.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: '$wasteType',
                    count: { $sum: 1 },
                    totalWeight: { $sum: '$actualWeight' },
                    totalValue: { $sum: '$totalPrice' }
                }
            },
            { $sort: { totalWeight: -1 } }
        ]);

        res.json({
            stats: stats[0] || {
                totalCollections: 0,
                totalWeight: 0,
                totalEstimatedWeight: 0,
                totalValue: 0,
                avgWeight: 0,
                avgPrice: 0,
                completedSchedules: 0
            },
            statusBreakdown,
            wasteTypeBreakdown
        });

    } catch (error) {
        console.error('Error fetching schedule collection stats:', error);
        res.status(500).json({ 
            message: 'Failed to fetch collection statistics', 
            error: error.message 
        });
    }
};

// Get schedules for agent map view
export const getSchedulesForMap = async (req, res) => {
    try {
        const { lat, lng, radius = 20 } = req.query; // radius in km

        // Get schedules that are active and not yet collected
        const schedules = await UserSchedule.find({
            status: 'Scheduled',
            pickupDate: { $gte: new Date() } // Only future schedules
        })
        .populate('userId', 'name email phone')
        .sort({ pickupDate: 1, pickupTime: 1 })
        .limit(50) // Limit to 50 schedules for performance
        .lean();

        // Transform schedules to match frontend format
        const transformedSchedules = schedules.map(schedule => ({
            _id: schedule._id,
            location: {
                lat: schedule.location.lat,
                lng: schedule.location.lng
            },
            address: schedule.address || `${schedule.location.lat.toFixed(4)}, ${schedule.location.lng.toFixed(4)}`,
            scheduledDate: schedule.pickupDate,
            scheduledTime: schedule.pickupTime,
            wasteType: schedule.wasteType,
            estimatedWeight: schedule.estimatedWeight || 0,
            status: schedule.status,
            userName: schedule.userId?.name || 'Unknown User',
            userEmail: schedule.userId?.email,
            userPhone: schedule.userId?.phone,
            notes: schedule.notes || ''
        }));

        res.json(transformedSchedules);

    } catch (error) {
        console.error('Error fetching schedules for map:', error);
        res.status(500).json({ 
            message: 'Failed to fetch schedules', 
            error: error.message 
        });
    }
};

// Get user's completed schedule collections (for user dashboard analytics)
export const getUserScheduleCollections = async (req, res) => {
    try {
        const { user } = req;
        const { page = 1, limit = 50 } = req.query;

        // Get user's completed schedule collections from AgentSchedule
        const collections = await AgentSchedule.find({ userId: user.id })
            .populate('scheduleId', 'pickupDate pickupTime')
            .populate('agentId', 'name')
            .populate('partnerId', 'companyName')
            .sort({ collectionDate: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await AgentSchedule.countDocuments({ userId: user.id });

        res.json({
            collections,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });

    } catch (error) {
        console.error('Error fetching user schedule collections:', error);
        res.status(500).json({ 
            message: 'Failed to fetch user schedule collections', 
            error: error.message 
        });
    }
};