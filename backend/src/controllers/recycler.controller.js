import Recycler from '../models/Recycler.js';
import WasteWarehouse from '../models/WasteWarehouse.js';
import WarehouseWastePrice from '../models/WarehouseWastePrice.js';
import OrderWaste from '../models/OrderWaste.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Register a new Recycler
export const registerRecycler = async (req, res) => {
    try {
        const { 
            name, 
            email, 
            password, 
            address, 
            phoneNumber, 
            birthDate, 
            facilityName, 
            facilityLicense
        } = req.body;
        
        const existingRecycler = await Recycler.findOne({ email });
        if (existingRecycler) {
            return res.status(400).json({ error: 'Recycler already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Generate unique recycler ID
        const recyclerId = 'RCY' + Date.now().toString().slice(-6);

        const newRecycler = new Recycler({ 
            name, 
            email, 
            password: hashedPassword,
            address,
            phoneNumber,
            birthDate,
            facilityName,
            recyclerId,
            facilityLicense
        });
        
        await newRecycler.save();
        
        res.status(201).json({ 
            message: 'Recycler registered successfully', 
            recycler: {
                id: newRecycler._id,
                name: newRecycler.name,
                email: newRecycler.email,
                recyclerId: newRecycler.recyclerId
            }
        });
    } catch (error) {
        console.error('Error registering recycler:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Login Recycler
export const loginRecycler = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const recycler = await Recycler.findOne({ email });
        if (!recycler) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, recycler.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Update login status
        recycler.isLoggedIn = true;
        recycler.lastLoginTime = new Date();
        await recycler.save();

        const token = jwt.sign(
            { 
                id: recycler._id, 
                email: recycler.email, 
                role: recycler.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({ 
            message: 'Login successful',
            token,
            recycler: {
                id: recycler._id,
                name: recycler.name,
                email: recycler.email,
                role: recycler.role,
                recyclerId: recycler.recyclerId,
                facilityName: recycler.facilityName
            }
        });
    } catch (error) {
        console.error('Error logging in recycler:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update Recycler
export const updateRecycler = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Remove sensitive fields that shouldn't be updated directly
        delete updateData.password;
        delete updateData.email;
        delete updateData.role;
        delete updateData.recyclerId;

        const recycler = await Recycler.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!recycler) {
            return res.status(404).json({ error: 'Recycler not found' });
        }

        res.json({ 
            message: 'Recycler updated successfully', 
            recycler 
        });
    } catch (error) {
        console.error('Error updating recycler:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Logout Recycler
export const logoutRecycler = async (req, res) => {
    try {
        const { id } = req.params;
        
        const recycler = await Recycler.findById(id);
        if (!recycler) {
            return res.status(404).json({ error: 'Recycler not found' });
        }

        recycler.isLoggedIn = false;
        recycler.lastLogoutTime = new Date();
        await recycler.save();

        res.json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Error logging out recycler:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get Recycler Profile
export const getRecyclerProfile = async (req, res) => {
    try {
        const { id } = req.params;
        
        const recycler = await Recycler.findById(id).select('-password');
        if (!recycler) {
            return res.status(404).json({ error: 'Recycler not found' });
        }

        res.json({ recycler });
    } catch (error) {
        console.error('Error getting recycler profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get Recycler Warehouse Data
export const getRecyclerWarehouse = async (req, res) => {
    try {
        const recyclerId = req.user.id;
        
        // Get all warehouse entries for this recycler
        const wasteEntries = await WasteWarehouse.find({ pickupPartnerId: recyclerId })
            .populate('pickupPartnerId', 'name facilityName')
            .sort({ createdAt: -1 });

        // Calculate summary statistics
        const summary = {
            totalWeight: 0,
            totalEntries: wasteEntries.length,
            wasteTypeBreakdown: {},
            recentEntries: wasteEntries.slice(0, 10)
        };

        wasteEntries.forEach(entry => {
            summary.totalWeight += entry.totalWeight;
            
            if (summary.wasteTypeBreakdown[entry.wasteType]) {
                summary.wasteTypeBreakdown[entry.wasteType] += entry.totalWeight;
            } else {
                summary.wasteTypeBreakdown[entry.wasteType] = entry.totalWeight;
            }
        });

        res.json({
            success: true,
            data: {
                summary,
                entries: wasteEntries
            }
        });
    } catch (error) {
        console.error('Error fetching recycler warehouse data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch warehouse data'
        });
    }
};

// Get Available Waste for Recycling
export const getAvailableWaste = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const wasteType = req.query.wasteType;
        const skip = (page - 1) * limit;

        // Build filter based on recycler's accepted waste types
        const recycler = await Recycler.findById(req.user.id);
        if (!recycler) {
            return res.status(404).json({ error: 'Recycler not found' });
        }

        let filter = {};
        
        // Filter by specific waste type if provided
        if (wasteType && wasteType !== 'all') {
            filter.wasteType = wasteType;
        }

        const availableWaste = await WasteWarehouse.find(filter)
            .populate('pickupPartnerId', 'name companyName')
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);

        const totalWaste = await WasteWarehouse.countDocuments(filter);
        
        // Calculate summary
        const summary = await WasteWarehouse.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: '$wasteType',
                    totalWeight: { $sum: '$totalWeight' },
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                availableWaste,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalWaste / limit),
                    totalItems: totalWaste,
                    itemsPerPage: limit
                },
                summary: summary.reduce((acc, item) => {
                    acc[item._id] = {
                        weight: item.totalWeight,
                        count: item.count
                    };
                    return acc;
                }, {})
            }
        });
    } catch (error) {
        console.error('Error fetching available waste:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch available waste'
        });
    }
};

// Update Recycler Password
export const updateRecyclerPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { currentPassword, newPassword } = req.body;

        const recycler = await Recycler.findById(id);
        if (!recycler) {
            return res.status(404).json({ error: 'Recycler not found' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, recycler.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        recycler.password = hashedNewPassword;
        await recycler.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error updating recycler password:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get Recycler Statistics
export const getRecyclerStatistics = async (req, res) => {
    try {
        const recyclerId = req.user.id;

        // Get warehouse statistics
        const wasteStats = await WasteWarehouse.aggregate([
            { $match: { pickupPartnerId: recyclerId } },
            {
                $group: {
                    _id: null,
                    totalWeight: { $sum: '$totalWeight' },
                    totalEntries: { $sum: 1 }
                }
            }
        ]);

        // Get waste type breakdown
        const wasteTypeStats = await WasteWarehouse.aggregate([
            { $match: { pickupPartnerId: recyclerId } },
            {
                $group: {
                    _id: '$wasteType',
                    weight: { $sum: '$totalWeight' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get monthly trends (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyStats = await WasteWarehouse.aggregate([
            { 
                $match: { 
                    pickupPartnerId: recyclerId,
                    createdAt: { $gte: sixMonthsAgo }
                } 
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    weight: { $sum: '$totalWeight' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        const stats = {
            total: wasteStats[0] || { totalWeight: 0, totalEntries: 0 },
            wasteTypes: wasteTypeStats,
            monthlyTrends: monthlyStats
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching recycler statistics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch statistics'
        });
    }
};

// Place Order for Waste
export const placeOrder = async (req, res) => {
    try {
        const { wasteWarehouseId, weight } = req.body;
        const recyclerId = req.user.id;

        // Validate input
        if (!wasteWarehouseId || !weight || weight <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Valid waste warehouse ID and weight are required'
            });
        }

        // Find the waste warehouse
        const wasteWarehouse = await WasteWarehouse.findById(wasteWarehouseId);
        if (!wasteWarehouse) {
            return res.status(404).json({
                success: false,
                error: 'Waste warehouse not found'
            });
        }

        // Check if enough waste is available
        if (wasteWarehouse.totalWeight < weight) {
            return res.status(400).json({
                success: false,
                error: `Insufficient waste available. Only ${wasteWarehouse.totalWeight}kg available.`
            });
        }

        // Get pricing information
        const priceInfo = await WarehouseWastePrice.findOne({ 
            wasteType: wasteWarehouse.wasteType 
        });
        
        if (!priceInfo) {
            return res.status(404).json({
                success: false,
                error: 'Pricing information not found for this waste type'
            });
        }

        // Calculate amounts
        const wasteAmount = weight * priceInfo.pricePerKg;
        const adminTaxAmount = weight * priceInfo.adminTaxPerKg;
        const totalAmount = wasteAmount + adminTaxAmount;

        // Create the order
        const newOrder = new OrderWaste({
            wasteWarehouseId,
            recyclerId,
            wasteAmount,
            adminTaxAmount,
            totalOrderValue: totalAmount,
            weight: weight
        });

        // Save the order (this will populate metadata via pre-save middleware)
        await newOrder.save();

        // Reduce the weight from warehouse
        wasteWarehouse.totalWeight -= weight;
        await wasteWarehouse.save();

        // Populate the order with related data for response
        const populatedOrder = await OrderWaste.findById(newOrder._id)
            .populate('wasteWarehouseId', 'wasteType location')
            .populate('recyclerId', 'name facilityName')
            .populate('meta.pickupPartnerId', 'companyName');

        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            data: {
                orderId: populatedOrder._id,
                totalAmount,
                order: populatedOrder
            }
        });

    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to place order'
        });
    }
};

// Get Order Price Quote
export const getOrderQuote = async (req, res) => {
    try {
        const { wasteWarehouseId, weight } = req.query;

        // Validate input
        if (!wasteWarehouseId || !weight || weight <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Valid waste warehouse ID and weight are required'
            });
        }

        // Find the waste warehouse
        const wasteWarehouse = await WasteWarehouse.findById(wasteWarehouseId);
        if (!wasteWarehouse) {
            return res.status(404).json({
                success: false,
                error: 'Waste warehouse not found'
            });
        }

        // Check if enough waste is available
        if (wasteWarehouse.totalWeight < weight) {
            return res.status(400).json({
                success: false,
                error: `Insufficient waste available. Only ${wasteWarehouse.totalWeight}kg available.`,
                availableWeight: wasteWarehouse.totalWeight
            });
        }

        // Get pricing information
        const priceInfo = await WarehouseWastePrice.findOne({ 
            wasteType: wasteWarehouse.wasteType 
        });
        
        if (!priceInfo) {
            return res.status(404).json({
                success: false,
                error: 'Pricing information not found for this waste type'
            });
        }

        // Calculate amounts
        const wasteAmount = weight * priceInfo.pricePerKg;
        const adminTaxAmount = weight * priceInfo.adminTaxPerKg;
        const totalAmount = wasteAmount + adminTaxAmount;

        res.json({
            success: true,
            data: {
                weight: parseFloat(weight),
                wasteType: wasteWarehouse.wasteType,
                pricePerKg: priceInfo.pricePerKg,
                adminTaxPerKg: priceInfo.adminTaxPerKg,
                wasteAmount,
                adminTaxAmount,
                totalAmount,
                availableWeight: wasteWarehouse.totalWeight
            }
        });

    } catch (error) {
        console.error('Error getting order quote:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get order quote'
        });
    }
};

// Get Recycler Orders
export const getRecyclerOrders = async (req, res) => {
    try {
        const recyclerId = req.user.id;
        const { status } = req.query;

        // Build query options
        const options = {};
        if (status) {
            options.status = status;
        }

        // Get orders for this recycler
        const orders = await OrderWaste.getOrdersByRecycler(recyclerId, options);

        res.json({
            success: true,
            data: orders
        });

    } catch (error) {
        console.error('Error fetching recycler orders:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch orders'
        });
    }
};

// Process (Complete) a Recycler Order
export const processRecyclerOrder = async (req, res) => {
    try {
        const recyclerId = req.user.id;
        const { orderId } = req.params;

        // Find the order
        const order = await OrderWaste.findOne({
            _id: orderId,
            recyclerId: recyclerId,
            status: 'approved'
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found or not approved'
            });
        }

        // Complete the order using the model method
        const completedOrder = await order.completeOrder();

        res.json({
            success: true,
            message: 'Order processed successfully',
            data: completedOrder
        });

    } catch (error) {
        console.error('Error processing order:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to process order'
        });
    }
};