import WastePrice from '../models/WastePrice.js';

// Get all waste prices (accessible to all roles)
export const getAllWastePrices = async (req, res) => {
  try {
    const wastePrices = await WastePrice.find()
      .populate('updatedBy', 'name email')
      .sort({ wasteType: 1 });
    
    res.json({
      success: true,
      data: wastePrices
    });
  } catch (error) {
    console.error('Error fetching waste prices:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get price for a specific waste type
export const getWastePriceByType = async (req, res) => {
  try {
    const { wasteType } = req.params;
    
    const wastePrice = await WastePrice.findOne({ wasteType })
      .populate('updatedBy', 'name email');
    
    if (!wastePrice) {
      return res.status(404).json({
        success: false,
        message: `Price not found for waste type: ${wasteType}`
      });
    }
    
    res.json({
      success: true,
      data: wastePrice
    });
  } catch (error) {
    console.error('Error fetching waste price:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update or create waste price (admin only)
export const updateWastePrice = async (req, res) => {
  try {
    const { wasteType } = req.params;
    const { pricePerKg } = req.body;
    const adminId = req.user.id;
    
    // Validate input
    if (!pricePerKg || pricePerKg < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price per kg must be a positive number'
      });
    }
    
    // Update or create waste price
    const wastePrice = await WastePrice.findOneAndUpdate(
      { wasteType },
      {
        pricePerKg,
        updatedBy: adminId,
        updatedAt: new Date()
      },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    ).populate('updatedBy', 'name email');
    
    res.json({
      success: true,
      message: `Price for ${wasteType} waste updated successfully`,
      data: wastePrice
    });
  } catch (error) {
    console.error('Error updating waste price:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete waste price (admin only)
export const deleteWastePrice = async (req, res) => {
  try {
    const { wasteType } = req.params;
    
    const wastePrice = await WastePrice.findOneAndDelete({ wasteType });
    
    if (!wastePrice) {
      return res.status(404).json({
        success: false,
        message: `Price not found for waste type: ${wasteType}`
      });
    }
    
    res.json({
      success: true,
      message: `Price for ${wasteType} waste deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting waste price:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Initialize default waste prices (admin only)
export const initializeDefaultPrices = async (req, res) => {
  try {
    const adminId = req.user.id;
    
    const defaultPrices = [
      { wasteType: 'organic', pricePerKg: 5.00 },
      { wasteType: 'plastic', pricePerKg: 15.00 },
      { wasteType: 'paper', pricePerKg: 8.00 },
      { wasteType: 'glass', pricePerKg: 3.00 },
      { wasteType: 'metal', pricePerKg: 25.00 },
      { wasteType: 'electronic', pricePerKg: 50.00 },
      { wasteType: 'mixed', pricePerKg: 4.00 },
      { wasteType: 'other', pricePerKg: 2.00 }
    ];
    
    const existingPrices = await WastePrice.find();
    
    if (existingPrices.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Default prices already initialized'
      });
    }
    
    const pricesToInsert = defaultPrices.map(price => ({
      ...price,
      updatedBy: adminId,
      updatedAt: new Date()
    }));
    
    await WastePrice.insertMany(pricesToInsert);
    
    const createdPrices = await WastePrice.find()
      .populate('updatedBy', 'name email')
      .sort({ wasteType: 1 });
    
    res.json({
      success: true,
      message: 'Default waste prices initialized successfully',
      data: createdPrices
    });
  } catch (error) {
    console.error('Error initializing default prices:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};