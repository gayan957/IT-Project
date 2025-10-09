import AgentBin from '../models/AgentBin.js';
import Bin from '../models/Bin.js';
import User from '../models/User.js';
import PickUpAgent from '../models/PickUpAgent.js';
import PickUpPartner from '../models/PickUpPartner.js';
import UserSchedule from '../models/UserSchedule.js';
import WastePrice from '../models/WastePrice.js';

// Get high-fill bins (>75%) for agent map
export const getHighFillBins = async (req, res) => {
    try {
        const { user } = req;
        
        console.log('=== getHighFillBins DEBUG ===');
        
        // First, let's check all bins to see their fillLevel values
        const allBins = await Bin.find({}).select('fillLevel isActive').limit(5);
        console.log('Sample bins in database:', allBins.map(b => ({ _id: b._id, fillLevel: b.fillLevel, isActive: b.isActive })));
        
        // Find bins with fill level >= 75% (75% or more)
        const highFillBins = await Bin.find({ 
            fillLevel: { $gte: 75 },
            isActive: true 
        })
        .populate('owner', 'name email phoneNumber')
        .sort({ fillLevel: -1 });

        console.log('High fill bins found:', highFillBins.length);
        console.log('High fill bins details:', highFillBins.map(b => ({ 
            _id: b._id, 
            fillLevel: b.fillLevel, 
            isActive: b.isActive,
            owner: b.owner?.name || 'Unknown'
        })));

        // Get pickup schedules for the current agent's area (if agent exists)
        let schedules = [];
        if (user) {
            const agent = await PickUpAgent.findById(user.id);
            if (agent) {
                schedules = await UserSchedule.find({
                    assignedArea: agent.assignedArea,
                    status: 'pending'
                })
                .populate('userId', 'name email phoneNumber')
                .populate('binId', 'binId location fillLevel wasteType')
                .sort({ scheduledDate: 1 });
            }
        }

        const response = {
            bins: highFillBins,
            schedules: schedules,
            agentLocation: user ? {
                assignedArea: user.assignedArea || 'Colombo',
                currentLocation: {
                    latitude: user.latitude || 6.9271,
                    longitude: user.longitude || 79.8612
                }
            } : {
                assignedArea: 'Colombo',
                currentLocation: {
                    latitude: 6.9271,
                    longitude: 79.8612
                }
            }
        };
        
        console.log('Sending response with', response.bins.length, 'bins');
        console.log('=== END DEBUG ===');

        res.json(response);
    } catch (error) {
        console.error('Error fetching high-fill bins:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get bin details for collection
export const getBinForCollection = async (req, res) => {
    try {
        const { binId } = req.params;
        
        const bin = await Bin.findById(binId)
            .populate('owner', 'name email phoneNumber address');
        
        if (!bin) {
            return res.status(404).json({ error: 'Bin not found' });
        }

        if (bin.fillLevel < 75) {
            return res.status(400).json({ error: 'Bin fill level is not high enough for collection (must be 75% or more)' });
        }

        res.json({ bin });
    } catch (error) {
        console.error('Error fetching bin details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Process bin collection
export const collectBin = async (req, res) => {
    try {
        const { binId } = req.params;
        const { paymentAmount, notes } = req.body;
        const { user } = req;

        // Validate required fields
        if (!paymentAmount || paymentAmount <= 0) {
            return res.status(400).json({ error: 'Valid payment amount is required' });
        }

        // Find the bin
        const bin = await Bin.findById(binId).populate('owner');
        if (!bin) {
            return res.status(404).json({ error: 'Bin not found' });
        }

        if (bin.fillLevel < 75) {
            return res.status(400).json({ error: 'Bin fill level is not high enough for collection (must be 75% or more)' });
        }

        // Find the agent
        const agent = await PickUpAgent.findById(user.id).populate('partnerId');
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }

        // Create collection record
        const agentBinRecord = new AgentBin({
            agentId: agent._id,
            binId: bin._id,
            userId: bin.owner._id,
            partnerId: agent.partnerId._id,
            paymentAmount: paymentAmount,
            fillLevelBefore: bin.fillLevel,
            fillLevelAfter: 0,
            wasteType: bin.wasteType,
            wasteWeight: (bin.fillLevel / 100) * bin.capacity, // Estimate weight based on capacity
            binLocation: {
                latitude: bin.location.coordinates[1],
                longitude: bin.location.coordinates[0],
                address: bin.address || 'Location not specified'
            },
            notes: notes || ''
        });

        await agentBinRecord.save();

        // Reset bin fill level to 0
        console.log('🗂️ Updating bin fillLevel to 0 for binId:', binId);
        const updatedBin = await Bin.findByIdAndUpdate(binId, {
            fillLevel: 0
        }, { new: true });

        if (updatedBin) {
            console.log('✅ Bin updated successfully:', `fillLevel: ${updatedBin.fillLevel}`);
        } else {
            console.log('⚠️ Bin update failed - bin not found with ID:', binId);
        }

        // Populate the saved record for response
        await agentBinRecord.populate([
            { path: 'agentId', select: 'name agentId email' },
            { path: 'binId', select: 'binId wasteType capacity location' },
            { path: 'userId', select: 'name email phoneNumber' },
            { path: 'partnerId', select: 'companyName name email' }
        ]);

        res.status(201).json({
            message: 'Bin collected successfully',
            collection: agentBinRecord,
            binUpdated: !!updatedBin,
            binFillLevel: updatedBin?.fillLevel || 'unknown'
        });
    } catch (error) {
        console.error('Error processing bin collection:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get collection history for agent
export const getAgentCollections = async (req, res) => {
    try {
        const { user } = req;
        const { page = 1, limit = 20 } = req.query;

        const collections = await AgentBin.find({ agentId: user.id })
            .populate('binId', 'binId wasteType location')
            .populate('userId', 'name email')
            .populate('partnerId', 'companyName name')
            .sort({ collectionDate: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await AgentBin.countDocuments({ agentId: user.id });

        res.json({
            collections,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error('Error fetching agent collections:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get collection history for user
export const getUserCollections = async (req, res) => {
    try {
        const { user } = req;
        const { page = 1, limit = 20 } = req.query;

        const collections = await AgentBin.find({ userId: user.id })
            .populate('agentId', 'name agentId email')
            .populate('binId', 'binId wasteType')
            .populate('partnerId', 'companyName name')
            .sort({ collectionDate: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await AgentBin.countDocuments({ userId: user.id });

        res.json({
            collections,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error('Error fetching user collections:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get collection history for partner
export const getPartnerCollections = async (req, res) => {
    try {
        const { user } = req;
        const { page = 1, limit = 20 } = req.query;

        const collections = await AgentBin.find({ partnerId: user.id })
            .populate('agentId', 'name agentId email')
            .populate('binId', 'binId wasteType location')
            .populate('userId', 'name email')
            .sort({ collectionDate: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await AgentBin.countDocuments({ partnerId: user.id });

        // Calculate total earnings for partner
        const totalEarnings = await AgentBin.aggregate([
            { $match: { partnerId: user.id } },
            { $group: { _id: null, total: { $sum: '$paymentAmount' } } }
        ]);

        res.json({
            collections,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total,
            totalEarnings: totalEarnings[0]?.total || 0
        });
    } catch (error) {
        console.error('Error fetching partner collections:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get collection statistics
export const getCollectionStats = async (req, res) => {
    try {
        const { user } = req;
        let matchFilter = {};

        // Set filter based on user role
        if (user.role === 'pickupagent') {
            matchFilter = { agentId: user.id };
        } else if (user.role === 'pickuppartner') {
            matchFilter = { partnerId: user.id };
        } else if (user.role === 'user') {
            matchFilter = { userId: user.id };
        }

        const stats = await AgentBin.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: null,
                    totalCollections: { $sum: 1 },
                    totalPayments: { $sum: '$paymentAmount' },
                    totalWasteWeight: { $sum: '$wasteWeight' },
                    avgPayment: { $avg: '$paymentAmount' }
                }
            }
        ]);

        const monthlyStats = await AgentBin.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: {
                        year: { $year: '$collectionDate' },
                        month: { $month: '$collectionDate' }
                    },
                    collections: { $sum: 1 },
                    payments: { $sum: '$paymentAmount' }
                }
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } },
            { $limit: 12 }
        ]);

        res.json({
            overall: stats[0] || {
                totalCollections: 0,
                totalPayments: 0,
                totalWasteWeight: 0,
                avgPayment: 0
            },
            monthly: monthlyStats
        });
    } catch (error) {
        console.error('Error fetching collection stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Process waste collection with weight input and price calculation
export const collectWasteByWeight = async (req, res) => {
    try {
        console.log('🗑️ ===== COLLECTION REQUEST RECEIVED =====');
        console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
        console.log('👤 User info:', JSON.stringify(req.user, null, 2));
        console.log('🌐 Request headers:', JSON.stringify(req.headers, null, 2));
        console.log('🗑️ ==========================================');
        
        const { 
            binId, 
            agentId, 
            userId, 
            partnerId, 
            wasteType, 
            wasteWeight, 
            pricePerKg,
            totalPrice,
            paymentAmount, // Keep for backward compatibility
            fillLevelBefore,
            binLocation,
            notes 
        } = req.body;

        // Validate required fields
        if (!binId) {
            console.log('❌ Missing binId');
            return res.status(400).json({ error: 'Bin ID is required' });
        }
        if (!agentId) {
            console.log('❌ Missing agentId');
            return res.status(400).json({ error: 'Agent ID is required' });
        }
        if (!wasteType) {
            console.log('❌ Missing wasteType');
            return res.status(400).json({ error: 'Waste type is required' });
        }
        if (!wasteWeight || wasteWeight <= 0) {
            console.log('❌ Invalid wasteWeight:', wasteWeight);
            return res.status(400).json({ error: 'Valid waste weight is required' });
        }

        console.log('✅ Basic validation passed');

        // Verify the bin exists
        console.log('🔍 Looking for bin:', binId);
        const bin = await Bin.findById(binId);
        if (!bin) {
            console.log('❌ Bin not found:', binId);
            return res.status(404).json({ error: 'Bin not found' });
        }
        console.log('✅ Bin found:', bin.binId, 'Type:', bin.wasteType);

        // Verify the agent exists
        console.log('🔍 Looking for agent:', agentId);
        const agent = await PickUpAgent.findById(agentId);
        if (!agent) {
            console.log('❌ Agent not found:', agentId);
            return res.status(404).json({ error: 'Agent not found' });
        }
        console.log('✅ Agent found:', agent.name, 'Partner:', agent.partnerId);

        // Get partnerId - use from request or agent
        const finalPartnerId = partnerId || agent.partnerId;
        if (!finalPartnerId) {
            console.log('❌ No partnerId available');
            return res.status(400).json({ error: 'Partner ID is required but not found' });
        }
        console.log('✅ Partner ID:', finalPartnerId);

        // Calculate pricing - use new format first, fallback to old format
        const finalPricePerKg = pricePerKg || (paymentAmount || 0) / parseFloat(wasteWeight) || 0;
        const finalTotalPrice = totalPrice || paymentAmount || 0;

        console.log('💰 Price calculation:', { 
            finalPricePerKg, 
            finalTotalPrice, 
            wasteWeight,
            originalPricePerKg: pricePerKg,
            originalTotalPrice: totalPrice 
        });

        // Ensure binLocation has required coordinates
        const finalBinLocation = {
            latitude: binLocation?.latitude || bin.location?.coordinates?.[1] || 0,
            longitude: binLocation?.longitude || bin.location?.coordinates?.[0] || 0,
            address: binLocation?.address || bin.address || 'Location not specified'
        };

        console.log('📍 Location data:', { 
            originalBinLocation: binLocation,
            binLocationFromDB: bin.location,
            finalBinLocation 
        });

        // Create collection record with all required fields
        const collectionData = {
            agentId: agentId,
            binId: binId,
            partnerId: finalPartnerId,
            userId: userId || null, // Optional field
            wasteType: wasteType,
            wasteWeight: parseFloat(wasteWeight),
            pricePerKg: finalPricePerKg,
            totalPrice: finalTotalPrice,
            fillLevelBefore: fillLevelBefore || bin.fillLevel || 0,
            fillLevelAfter: 0,
            binLocation: finalBinLocation,
            notes: notes || '',
            status: 'collected'
        };

        console.log('📋 Creating AgentBin record with data:', JSON.stringify(collectionData, null, 2));

        const agentBinRecord = new AgentBin(collectionData);
        
        // Save the record
        console.log('💾 Saving to database...');
        const savedRecord = await agentBinRecord.save();
        console.log('✅ AgentBin record saved successfully!');
        console.log('🆔 Saved record ID:', savedRecord._id);
        console.log('📊 Saved record data:', JSON.stringify(savedRecord.toObject(), null, 2));

        // Update the bin's fill level to 0 after successful collection
        console.log('🗂️ Updating bin fillLevel to 0...');
        const updatedBin = await Bin.findByIdAndUpdate(
            binId,
            {
                fillLevel: 0
            },
            { new: true }
        );
        
        if (updatedBin) {
            console.log('✅ Bin updated successfully:', `fillLevel: ${updatedBin.fillLevel}`);
        } else {
            console.log('⚠️ Bin update failed');
        }

        // Populate the saved record for response
        console.log('🔄 Populating saved record...');
        await savedRecord.populate([
            { path: 'agentId', select: 'name agentId email' },
            { path: 'binId', select: 'binId wasteType capacity location address' },
            { path: 'userId', select: 'name email phoneNumber' },
            { path: 'partnerId', select: 'companyName name email' }
        ]);

        console.log('🎉 Collection process completed successfully!');

        res.status(201).json({
            success: true,
            message: 'Waste collected successfully',
            collection: savedRecord,
            binUpdated: !!updatedBin,
            recordId: savedRecord._id
        });

    } catch (error) {
        console.error('💥 Error in collectWasteByWeight:', error);
        console.error('🔍 Error stack:', error.stack);
        res.status(500).json({ 
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
};

// Reset bin weight to zero
export const resetBinWeight = async (req, res) => {
    try {
        const { binId } = req.params;

        // Find and update the bin
        const bin = await Bin.findByIdAndUpdate(
            binId,
            {
                fillLevel: 0
            },
            { new: true }
        );

        if (!bin) {
            return res.status(404).json({ error: 'Bin not found' });
        }

        res.json({
            message: 'Bin weight reset successfully',
            bin: {
                id: bin._id,
                fillLevel: bin.fillLevel
            }
        });
    } catch (error) {
        console.error('Error resetting bin weight:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};