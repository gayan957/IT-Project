import User from '../models/User.js';
import PickUpPartner from '../models/PickUpPartner.js';
import Recycler from '../models/Recycler.js';
import UserSchedule from '../models/UserSchedule.js';
import Bin from '../models/Bin.js';
import Salary from '../models/Salary.js';
import PickUpAgent from '../models/PickUpAgent.js';
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

// ---- Salary Management (admin only) ----

export async function getAllSalaries(req, res, next) {
    try {
        const { month, agentId } = req.query;
        
        let query = {};
        if (month) query['attendance.month'] = month;
        if (agentId) query.pickupAgentId = agentId;
        
        const salaries = await Salary.find(query)
            .populate('pickupAgent', 'name agentId email phoneNumber')
            .populate('pickupPartner', 'name email')
            .sort({ 'attendance.month': -1, createdAt: -1 });
        
        res.json({
            success: true,
            data: salaries,
            count: salaries.length
        });
    } catch (err) { 
        console.error('Error fetching salaries:', err);
        next(err); 
    }
}

export async function getSalaryById(req, res, next) {
    try {
        const salary = await Salary.findById(req.params.salaryId)
            .populate('pickupAgent', 'name agentId email phoneNumber')
            .populate('pickupPartner', 'name email');
        
        if (!salary) return res.status(404).json({ 
            success: false, 
            message: 'Salary record not found' 
        });
        
        res.json({
            success: true,
            data: salary
        });
    } catch (err) { 
        console.error('Error fetching salary:', err);
        next(err); 
    }
}

export async function updateSalaryById(req, res, next) {
    try {
        const allowedUpdates = [
            'attendance.workingDays', 
            'attendance.overtimeHours', 
            'attendance.noPayDays',
            'salary.basic',
            'salary.deductions.noPay',
            'salary.deductions.loans',
            'salary.allowances.food',
            'salary.allowances.medical',
            'salary.allowances.cola',
            'salary.perks.overtime',
            'salary.perks.bonus'
        ];
        
        const updates = {};
        Object.keys(req.body).forEach(key => {
            if (allowedUpdates.includes(key)) {
                const keys = key.split('.');
                if (keys.length === 1) {
                    updates[key] = req.body[key];
                } else if (keys.length === 2) {
                    if (!updates[keys[0]]) updates[keys[0]] = {};
                    updates[keys[0]][keys[1]] = req.body[key];
                } else if (keys.length === 3) {
                    if (!updates[keys[0]]) updates[keys[0]] = {};
                    if (!updates[keys[0]][keys[1]]) updates[keys[0]][keys[1]] = {};
                    updates[keys[0]][keys[1]][keys[2]] = req.body[key];
                }
            }
        });
        
        const salary = await Salary.findByIdAndUpdate(
            req.params.salaryId, 
            updates, 
            { new: true, runValidators: true }
        ).populate('pickupAgent', 'name agentId email phoneNumber')
         .populate('pickupPartner', 'name email');
        
        if (!salary) return res.status(404).json({ 
            success: false, 
            message: 'Salary record not found' 
        });
        
        res.json({ 
            success: true,
            message: 'Salary updated successfully', 
            data: salary 
        });
    } catch (err) { 
        console.error('Error updating salary:', err);
        next(err); 
    }
}

export async function deleteSalaryById(req, res, next) {
    try {
        const salary = await Salary.findByIdAndDelete(req.params.salaryId);
        if (!salary) return res.status(404).json({ 
            success: false, 
            message: 'Salary record not found' 
        });
        
        res.json({ 
            success: true,
            message: 'Salary record deleted successfully' 
        });
    } catch (err) { 
        console.error('Error deleting salary:', err);
        next(err); 
    }
}

export async function getAllAgents(req, res, next) {
    try {
        const agents = await PickUpAgent.find()
            .populate('partnerId', 'name email')
            .select('name agentId email phoneNumber address partnerId')
            .sort({ name: 1 });
        
        res.json({
            success: true,
            data: agents,
            count: agents.length
        });
    } catch (err) { 
        console.error('Error fetching agents:', err);
        next(err); 
    }
}