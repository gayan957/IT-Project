import WastePrice from '../models/WastePrice.js';

// Get all waste prices (accessible to all roles)
export const getAllWastePrices = async (req, res) => {
  try {
    // Use the static method from the model to get active prices
    const wastePrices = await WastePrice.getActivePrices()
      .populate('updatedBy', 'name email');
    
    res.json({
      success: true,
      data: wastePrices,
      count: wastePrices.length
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
    
    // Use the static method from the model
    const wastePrice = await WastePrice.getPriceByType(wasteType)
      .populate('updatedBy', 'name email');
    
    if (!wastePrice) {
      return res.status(404).json({
        success: false,
        message: `Active price not found for waste type: ${wasteType}`
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
    
    // Update or create waste price with new schema fields
    const wastePrice = await WastePrice.findOneAndUpdate(
      { wasteType },
      {
        pricePerKg,
        updatedBy: adminId,
        updatedAt: new Date(),
        isActive: true
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
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
        message: `Validation Error: ${error.message}`
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: `Price for ${wasteType} already exists`
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete waste price (admin only) - Updated to use soft delete
export const deleteWastePrice = async (req, res) => {
  try {
    const { wasteType } = req.params;
    
    const wastePrice = await WastePrice.findOne({ wasteType, isActive: true });
    
    if (!wastePrice) {
      return res.status(404).json({
        success: false,
        message: `Active price not found for waste type: ${wasteType}`
      });
    }
    
    // Use the instance method to deactivate instead of hard delete
    await wastePrice.deactivate();
    
    res.json({
      success: true,
      message: `Price for ${wasteType} waste deactivated successfully`
    });
  } catch (error) {
    console.error('Error deactivating waste price:', error);
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
    
    // Updated default prices to match new WastePrice model enum
    const defaultPrices = [
      { wasteType: 'plastic', pricePerKg: 15.00 },
      { wasteType: 'paper', pricePerKg: 8.00 },
      { wasteType: 'glass', pricePerKg: 3.00 },
      { wasteType: 'metal', pricePerKg: 25.00 },
      { wasteType: 'organic', pricePerKg: 5.00 },
      { wasteType: 'coconut-shell', pricePerKg: 12.00 },
      { wasteType: 'e-waste', pricePerKg: 50.00 },
      { wasteType: 'mixed', pricePerKg: 4.00 }
    ];
    
    // Check if any active prices already exist
    const existingPrices = await WastePrice.find({ isActive: true });
    
    if (existingPrices.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Default prices already initialized. Use individual update endpoints to modify prices.'
      });
    }
    
    const pricesToInsert = defaultPrices.map(price => ({
      ...price,
      updatedBy: adminId,
      updatedAt: new Date(),
      createdAt: new Date(),
      isActive: true
    }));
    
    const createdPrices = await WastePrice.insertMany(pricesToInsert);
    
    // Fetch the created prices with populated admin info
    const populatedPrices = await WastePrice.find({ isActive: true })
      .populate('updatedBy', 'name email')
      .sort({ wasteType: 1 });
    
    res.json({
      success: true,
      message: 'Default waste prices initialized successfully',
      data: populatedPrices
    });
  } catch (error) {
    console.error('Error initializing default prices:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: `Validation Error: ${error.message}`
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};