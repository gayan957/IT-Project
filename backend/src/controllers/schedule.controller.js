
import UserSchedule from '../models/UserSchedule.js';

// Create a new schedule
import User from '../models/User.js';

export const createSchedule = async (req, res) => {
  try {
    const { pickupDate, pickupTime, pickupDueTime, wasteType } = req.body;
    const userId = req.user.id; // Changed from req.user._id to req.user.id
    
    console.log('Creating schedule for userId:', userId);
    console.log('Request body:', req.body);
    console.log('req.user:', req.user);
    
    const schedule = new UserSchedule({
      userId,
      pickupDate,
      pickupTime,
      pickupDueTime,
      wasteType
      // location will be populated by the pre-validation hook
    });
    
    await schedule.save();
    res.status(201).json(schedule);
  } catch (err) {
    console.error('Schedule creation error:', err);
    res.status(400).json({ error: err.message });
  }
};

// Get all schedules for a user
export const getUserSchedules = async (req, res) => {
  try {
    const userId = req.user.id; // Changed from req.user._id to req.user.id
    const schedules = await UserSchedule.find({ userId }).sort({ pickupDate: -1 });
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update schedule status
export const updateScheduleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;
    
    const schedule = await UserSchedule.findOne({ _id: id, userId });
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found or unauthorized' });
    }
    
    schedule.status = status;
    await schedule.save();
    
    res.json(schedule);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update/Edit entire schedule
export const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { pickupDate, pickupTime, pickupDueTime, wasteType, notes } = req.body;
    const userId = req.user.id;
    
    const schedule = await UserSchedule.findOne({ _id: id, userId });
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found or unauthorized' });
    }
    
    // Only allow editing if status is 'Scheduled'
    if (schedule.status !== 'Scheduled') {
      return res.status(400).json({ error: 'Can only edit scheduled pickups' });
    }
    
    // Update fields
    if (pickupDate) schedule.pickupDate = pickupDate;
    if (pickupTime) schedule.pickupTime = pickupTime;
    if (pickupDueTime) schedule.pickupDueTime = pickupDueTime;
    if (wasteType) schedule.wasteType = wasteType;
    if (notes !== undefined) schedule.notes = notes;
    
    await schedule.save();
    res.json(schedule);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete schedule
export const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const schedule = await UserSchedule.findOne({ _id: id, userId });
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found or unauthorized' });
    }
    
    // Only allow deletion if status is 'Scheduled'
    if (schedule.status !== 'Scheduled') {
      return res.status(400).json({ error: 'Can only delete scheduled pickups' });
    }
    
    await UserSchedule.findByIdAndDelete(id);
    res.json({ message: 'Schedule deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
