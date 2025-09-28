import User from '../models/User.js';
import PickUpPartner from '../models/PickUpPartner.js';
import Recycler from '../models/Recycler.js';
import UserSchedule from '../models/UserSchedule.js';
import Bin from '../models/Bin.js';
import WastePrice from '../models/WastePrice.js';
import WarehouseWastePrice from '../models/WarehouseWastePrice.js';
import bcrypt from 'bcryptjs';
//import Todo from '../models/Todo.js';




// ---- User management (admin only) ----
export async function listUsers(req, res, next) {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) { next(err); }
}




export async function getUserById(req, res, next) {
    try {
        const user = await User.findById(req.params.userId).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) { next(err); }
}




export async function updateUserById(req, res, next) {
    try {
        const allowed = ['firstName', 'lastName', 'address', 'email'];
        const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
        const user = await User.findByIdAndUpdate(req.params.userId, updates, { new: true }).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) { next(err); }
}




export async function deleteUserById(req, res, next) {
    try {
        const user = await User.findByIdAndDelete(req.params.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        // await Todo.deleteMany({ user: req.params.userId });
        res.json({ message: 'User deleted' });
    } catch (err) { next(err); }
}

// ---- PickUp Partner management (admin only) ----
export async function listPickupPartners(req, res, next) {
    try {
        const partners = await PickUpPartner.find().select('-password');
        res.json(partners);
    } catch (err) { next(err); }
}

export async function getPickupPartnerById(req, res, next) {
    try {
        const partner = await PickUpPartner.findById(req.params.partnerId).select('-password');
        if (!partner) return res.status(404).json({ message: 'Pickup partner not found' });
        res.json(partner);
    } catch (err) { next(err); }
}

export async function createPickupPartner(req, res, next) {
    try {
        console.log('Creating pickup partner with data:', req.body);
        
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
        
        console.log('Extracted fields:', { name, email, address, phoneNumber, birthDate, companyName });
        
        const existingPartner = await PickUpPartner.findOne({ email });
        if (existingPartner) {
            console.log('Partner already exists with email:', email);
            return res.status(400).json({ message: 'Partner with this email already exists' });
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
        
        console.log('About to save partner:', newPartner);
        await newPartner.save();
        console.log('Partner saved successfully');
        
        // Return partner without password
        const partnerResponse = await PickUpPartner.findById(newPartner._id).select('-password');
        res.status(201).json({ message: 'Pickup partner created successfully', partner: partnerResponse });
    } catch (err) { 
        console.error('Error creating pickup partner:', err);
        next(err); 
    }
}

export async function updatePickupPartnerById(req, res, next) {
    try {
        const allowed = [
            'name', 'email', 'address', 'phoneNumber', 'birthDate', 
            'companyName', 'businessLicense', 'contactPerson', 
            'serviceAreas', 'vehicleFleet', 'isActive'
        ];
        const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
        
        // If password is being updated, hash it
        if (req.body.password) {
            updates.password = await bcrypt.hash(req.body.password, 10);
        }
        
        const partner = await PickUpPartner.findByIdAndUpdate(req.params.partnerId, updates, { new: true }).select('-password');
        if (!partner) return res.status(404).json({ message: 'Pickup partner not found' });
        res.json({ message: 'Pickup partner updated successfully', partner });
    } catch (err) { next(err); }
}

export async function deletePickupPartnerById(req, res, next) {
    try {
        const partner = await PickUpPartner.findByIdAndDelete(req.params.partnerId);
        if (!partner) return res.status(404).json({ message: 'Pickup partner not found' });
        res.json({ message: 'Pickup partner deleted successfully' });
    } catch (err) { next(err); }
}

// ---- Recycler management (admin only) ----
export async function listRecyclers(req, res, next) {
    try {
        const recyclers = await Recycler.find().select('-password');
        res.json(recyclers);
    } catch (err) { next(err); }
}

export async function getRecyclerById(req, res, next) {
    try {
        const recycler = await Recycler.findById(req.params.recyclerId).select('-password');
        if (!recycler) return res.status(404).json({ message: 'Recycler not found' });
        res.json(recycler);
    } catch (err) { next(err); }
}

export async function createRecycler(req, res, next) {
    try {
        console.log('Creating recycler with data:', req.body);
        
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
        
        console.log('Extracted fields:', { name, email, address, phoneNumber, birthDate, facilityName });
        
        const existingRecycler = await Recycler.findOne({ email });
        if (existingRecycler) {
            console.log('Recycler already exists with email:', email);
            return res.status(400).json({ message: 'Recycler with this email already exists' });
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
        
        console.log('About to save recycler:', newRecycler);
        await newRecycler.save();
        console.log('Recycler saved successfully');
        
        // Return recycler without password
        const recyclerResponse = await Recycler.findById(newRecycler._id).select('-password');
        res.status(201).json({ message: 'Recycler created successfully', recycler: recyclerResponse });
    } catch (err) { 
        console.error('Error creating recycler:', err);
        next(err); 
    }
}

export async function updateRecyclerById(req, res, next) {
    try {
        const allowed = [
            'name', 'email', 'address', 'phoneNumber', 'birthDate', 
            'facilityName', 'facilityLicense'
        ];
        const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
        
        // If password is being updated, hash it
        if (req.body.password) {
            updates.password = await bcrypt.hash(req.body.password, 10);
        }
        
        const recycler = await Recycler.findByIdAndUpdate(req.params.recyclerId, updates, { new: true }).select('-password');
        if (!recycler) return res.status(404).json({ message: 'Recycler not found' });
        res.json({ message: 'Recycler updated successfully', recycler });
    } catch (err) { next(err); }
}

export async function deleteRecyclerById(req, res, next) {
    try {
        const recycler = await Recycler.findByIdAndDelete(req.params.recyclerId);
        if (!recycler) return res.status(404).json({ message: 'Recycler not found' });
        res.json({ message: 'Recycler deleted successfully' });
    } catch (err) { next(err); }
}

// ---- Schedule management (admin only) ----
export async function listSchedules(req, res, next) {
    try {
        const schedules = await UserSchedule.find()
            .populate('userId', 'firstName lastName email phone')
            .sort({ createdAt: -1 });
        res.json(schedules);
    } catch (err) { 
        console.error('Error listing schedules:', err);
        next(err); 
    }
}

export async function getScheduleById(req, res, next) {
    try {
        const schedule = await UserSchedule.findById(req.params.scheduleId)
            .populate('userId', 'firstName lastName email phone address');
        if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
        res.json(schedule);
    } catch (err) { 
        console.error('Error getting schedule by ID:', err);
        next(err); 
    }
}

export async function updateScheduleById(req, res, next) {
    try {
        const { scheduleId } = req.params;
        const allowedUpdates = ['status', 'notes', 'pickupDate', 'pickupTime', 'pickupDueTime', 'wasteType', 'estimatedWeight'];
        const updates = Object.fromEntries(
            Object.entries(req.body).filter(([key]) => allowedUpdates.includes(key))
        );
        
        const schedule = await UserSchedule.findByIdAndUpdate(
            scheduleId, 
            updates, 
            { new: true, runValidators: true }
        ).populate('userId', 'firstName lastName email phone');
        
        if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
        res.json({ message: 'Schedule updated successfully', schedule });
    } catch (err) { 
        console.error('Error updating schedule:', err);
        next(err); 
    }
}

export async function deleteScheduleById(req, res, next) {
    try {
        const schedule = await UserSchedule.findByIdAndDelete(req.params.scheduleId);
        if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
        res.json({ message: 'Schedule deleted successfully' });
    } catch (err) { 
        console.error('Error deleting schedule:', err);
        next(err); 
    }
}

// ---- Bin management (admin only) ----
export async function listBins(req, res, next) {
    try {
        const bins = await Bin.find()
            .populate('owner', 'firstName lastName email phone')
            .sort({ createdAt: -1 });
        res.json(bins);
    } catch (err) { 
        console.error('Error listing bins:', err);
        next(err); 
    }
}

export async function getBinById(req, res, next) {
    try {
        const bin = await Bin.findById(req.params.binId)
            .populate('owner', 'firstName lastName email phone address')
            .populate('pickupHistory.pickedBy', 'firstName lastName email');
        if (!bin) return res.status(404).json({ message: 'Bin not found' });
        res.json(bin);
    } catch (err) { 
        console.error('Error getting bin by ID:', err);
        next(err); 
    }
}

export async function updateBinById(req, res, next) {
    try {
        const { binId } = req.params;
        const allowedUpdates = ['status', 'label', 'address', 'fillLevel', 'wasteType', 'capacity', 'isActive'];
        const updates = Object.fromEntries(
            Object.entries(req.body).filter(([key]) => allowedUpdates.includes(key))
        );
        
        const bin = await Bin.findByIdAndUpdate(
            binId, 
            updates, 
            { new: true, runValidators: true }
        ).populate('owner', 'firstName lastName email phone');
        
        if (!bin) return res.status(404).json({ message: 'Bin not found' });
        res.json({ message: 'Bin updated successfully', bin });
    } catch (err) { 
        console.error('Error updating bin:', err);
        next(err); 
    }
}

export async function deleteBinById(req, res, next) {
    try {
        const bin = await Bin.findByIdAndDelete(req.params.binId);
        if (!bin) return res.status(404).json({ message: 'Bin not found' });
        res.json({ message: 'Bin deleted successfully' });
    } catch (err) { 
        console.error('Error deleting bin:', err);
        next(err); 
    }
}

// ---- Waste Order management (admin only) ----

// Get all waste orders
export async function getAllWasteOrders(req, res, next) {
    try {
        const { page = 1, limit = 20, status } = req.query;
        
        // Import OrderWaste model
        const OrderWaste = (await import('../models/OrderWaste.js')).default;

        // Build query
        let query = {};
        if (status && status !== 'all') {
            query.orderStatus = status;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const [orders, totalOrders] = await Promise.all([
            OrderWaste.find(query)
                .populate('wasteWarehouseId', 'wasteType totalWeight')
                .populate('recyclerId', 'name email companyName')
                .populate('approvedBy', 'name email username')
                .populate('meta.pickupPartnerId', 'companyName email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            OrderWaste.countDocuments(query)
        ]);

        const totalPages = Math.ceil(totalOrders / parseInt(limit));

        res.json({
            success: true,
            orders: orders,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalOrders,
                hasNext: parseInt(page) < totalPages,
                hasPrev: parseInt(page) > 1
            }
        });
    } catch (err) {
        console.error('Error fetching waste orders:', err);
        next(err);
    }
}

// Get waste order statistics
export async function getWasteOrderStats(req, res, next) {
    try {
        const OrderWaste = (await import('../models/OrderWaste.js')).default;

        const [statusCounts, totalValue] = await Promise.all([
            OrderWaste.aggregate([
                {
                    $group: {
                        _id: '$orderStatus',
                        count: { $sum: 1 }
                    }
                }
            ]),
            OrderWaste.aggregate([
                {
                    $group: {
                        _id: null,
                        totalValue: { $sum: '$totalOrderValue' }
                    }
                }
            ])
        ]);

        const stats = {
            pending: 0,
            approved: 0,
            completed: 0,
            cancelled: 0,
            totalValue: totalValue[0]?.totalValue || 0
        };

        statusCounts.forEach(item => {
            stats[item._id] = item.count;
        });

        res.json(stats);
    } catch (err) {
        console.error('Error fetching waste order stats:', err);
        next(err);
    }
}

// Approve a waste order
export async function approveWasteOrder(req, res, next) {
    try {
        const { orderId } = req.params;
        const adminId = req.user.id;

        const OrderWaste = (await import('../models/OrderWaste.js')).default;

        const order = await OrderWaste.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (order.orderStatus !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Only pending orders can be approved'
            });
        }

        // Use the instance method to approve the order
        await order.approveOrder(adminId);

        // Get the updated order with populated fields
        const updatedOrder = await OrderWaste.findById(orderId)
            .populate('wasteWarehouseId', 'wasteType totalWeight')
            .populate('recyclerId', 'name email companyName')
            .populate('approvedBy', 'name email username');

        res.json({
            success: true,
            message: 'Order approved successfully',
            order: updatedOrder
        });
    } catch (err) {
        console.error('Error approving waste order:', err);
        next(err);
    }
}

// Reject a waste order
export async function rejectWasteOrder(req, res, next) {
    try {
        const { orderId } = req.params;
        const { reason } = req.body;

        const OrderWaste = (await import('../models/OrderWaste.js')).default;

        const order = await OrderWaste.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (order.orderStatus !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Only pending orders can be rejected'
            });
        }

        // Update order status to cancelled
        order.orderStatus = 'cancelled';
        if (reason) {
            order.rejectionReason = reason;
        }
        await order.save();

        res.json({
            success: true,
            message: 'Order rejected successfully'
        });
    } catch (err) {
        console.error('Error rejecting waste order:', err);
        next(err);
    }
}

// Get combined pricing data for AI forecasting
export const getCombinedPricingData = async (req, res) => {
    try {
        // Fetch both WastePrice and WarehouseWastePrice data
        const [wastePrices, warehousePrices] = await Promise.all([
            WastePrice.getActivePrices(),
            WarehouseWastePrice.getActivePrices()
        ]);

        // Create a combined pricing structure
        const combinedPrices = {};
        
        // First add warehouse prices (which have both pricePerKg and adminTaxPerKg)
        warehousePrices.forEach(price => {
            combinedPrices[price.wasteType] = {
                wasteType: price.wasteType,
                pricePerKg: price.pricePerKg,
                adminTaxPerKg: price.adminTaxPerKg,
                totalPrice: price.pricePerKg + price.adminTaxPerKg,
                lastUpdated: price.updatedAt,
                source: 'warehouse'
            };
        });

        // Add waste prices that might not be in warehouse prices
        wastePrices.forEach(price => {
            if (!combinedPrices[price.wasteType]) {
                combinedPrices[price.wasteType] = {
                    wasteType: price.wasteType,
                    pricePerKg: price.pricePerKg,
                    adminTaxPerKg: 0, // Default to 0 if not in warehouse prices
                    totalPrice: price.pricePerKg,
                    lastUpdated: price.updatedAt,
                    source: 'waste'
                };
            }
        });

        // Convert to array and include e-waste in valid types
        const validWasteTypes = ['plastic', 'paper', 'glass', 'metal', 'organic', 'e-waste', 'mixed'];
        const filteredPrices = Object.values(combinedPrices).filter(
            price => validWasteTypes.includes(price.wasteType)
        );

        res.json({
            success: true,
            data: filteredPrices,
            count: filteredPrices.length
        });
    } catch (error) {
        console.error('Error fetching combined pricing data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pricing data',
            error: error.message
        });
    }
};