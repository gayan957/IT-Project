import User from '../models/User.js';
import Admin from '../models/Admin.js';
import PickUpAgent from '../models/PickUpAgent.js';
import PickUpPartner from '../models/PickUpPartner.js';

export async function getMe(req, res, next) {
    try {
        let me;
        if (req.user.model === 'Admin') {
            me = await Admin.findById(req.user.id).select('-password');
        } else if (req.user.model === 'PickUpAgent') {
            me = await PickUpAgent.findById(req.user.id).select('-password');
        } else if (req.user.model === 'PickUpPartner') {
            me = await PickUpPartner.findById(req.user.id).select('-password');
        } else {
            me = await User.findById(req.user.id).select('-password');
        }
        
        if (!me) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Add role information to the response
        const responseData = me.toObject();
        responseData.role = req.user.role;
        
        res.json(responseData);
    } catch (err) { 
        console.error('Error in getMe:', err);
        next(err); 
    }
}


export async function updateMe(req, res, next) {
  try {
    // allow location + profile fields
    const allowed = [
      'firstName', 'middleName', 'lastName',
      'email', 'phone', 'address', 'birthday', 'idCardNumber',
      'location' // ✅ include location
    ];

    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    );

    // Optional: validate GeoJSON structure if present
    if (updates.location) {
      const loc = updates.location;
      if (
        loc.type !== 'Point' ||
        !Array.isArray(loc.coordinates) ||
        loc.coordinates.length !== 2
      ) {
        return res.status(400).json({ message: 'Invalid location format. Use { type:"Point", coordinates:[lng,lat] }.' });
      }
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,           // ✅ return updated document
      runValidators: true, // ✅ run schema validation
    });

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
}


export async function deleteMe(req, res, next) {
    try {
        await User.findByIdAndDelete(req.user.id);
        res.json({ message: 'Account deleted' });
    } catch (err) { next(err); }
}

