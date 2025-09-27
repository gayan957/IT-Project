import WarehouseWastePrice from '../models/WarehouseWastePrice.js';
import Admin from '../models/Admin.js';

// Get all warehouse waste prices
export const getAllWarehouseWastePrices = async (req, res) => {
  try {
    const prices = await WarehouseWastePrice.find({ isActive: true })
      .populate('updatedBy', 'name email')
      .sort({ wasteType: 1 });

    res.status(200).json({
      success: true,
      count: prices.length,
      data: prices
    });
  } catch (error) {
    console.error('Error fetching warehouse waste prices:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching warehouse waste prices',
      error: error.message
    });
  }
};

// Get warehouse waste price by ID
export const getWarehouseWastePriceById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const price = await WarehouseWastePrice.findById(id)
      .populate('updatedBy', 'name email');

    if (!price) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse waste price not found'
      });
    }

    res.status(200).json({
      success: true,
      data: price
    });
  } catch (error) {
    console.error('Error fetching warehouse waste price:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching warehouse waste price',
      error: error.message
    });
  }
};

// Get warehouse waste price by waste type
export const getWarehouseWastePriceByType = async (req, res) => {
  try {
    const { wasteType } = req.params;
    
    const price = await WarehouseWastePrice.getPriceByType(wasteType);

    if (!price) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse waste price not found for this waste type'
      });
    }

    res.status(200).json({
      success: true,
      data: price
    });
  } catch (error) {
    console.error('Error fetching warehouse waste price by type:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching warehouse waste price',
      error: error.message
    });
  }
};

// Create or update warehouse waste price
export const createOrUpdateWarehouseWastePrice = async (req, res) => {
  try {
    const { wasteType, pricePerKg, adminTaxPerKg } = req.body;
    const adminId = req.user.id;

    // Basic validation
    if (!wasteType || !pricePerKg || !adminTaxPerKg) {
      return res.status(400).json({
        success: false,
        message: 'Waste type, price per kg, and admin tax per kg are required'
      });
    }

    if (isNaN(pricePerKg) || pricePerKg < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price per kg must be a positive number'
      });
    }

    if (isNaN(adminTaxPerKg) || adminTaxPerKg < 0) {
      return res.status(400).json({
        success: false,
        message: 'Admin tax per kg must be a positive number'
      });
    }

    const validWasteTypes = ['plastic', 'paper', 'glass', 'metal', 'organic', 'coconut-shell', 'e-waste', 'mixed'];
    if (!validWasteTypes.includes(wasteType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid waste type'
      });
    }

    // Verify admin exists
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Check if price already exists for this waste type
    let wastePrice = await WarehouseWastePrice.findOne({ wasteType, isActive: true });

    if (wastePrice) {
      // Update existing price
      wastePrice.pricePerKg = pricePerKg;
      wastePrice.adminTaxPerKg = adminTaxPerKg;
      wastePrice.updatedBy = adminId;
      wastePrice.updatedAt = new Date();
      
      await wastePrice.save();
      
      await wastePrice.populate('updatedBy', 'name email');

      res.status(200).json({
        success: true,
        message: 'Warehouse waste price updated successfully',
        data: wastePrice
      });
    } else {
      // Create new price
      wastePrice = new WarehouseWastePrice({
        wasteType,
        pricePerKg,
        adminTaxPerKg,
        updatedBy: adminId
      });

      await wastePrice.save();
      await wastePrice.populate('updatedBy', 'name email');

      res.status(201).json({
        success: true,
        message: 'Warehouse waste price created successfully',
        data: wastePrice
      });
    }
  } catch (error) {
    console.error('Error creating/updating warehouse waste price:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Warehouse waste price already exists for this waste type'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating/updating warehouse waste price',
      error: error.message
    });
  }
};

// Update warehouse waste price
export const updateWarehouseWastePrice = async (req, res) => {
  try {
    const { id } = req.params;
    const { pricePerKg, adminTaxPerKg } = req.body;
    const adminId = req.user.id;

    // Basic validation
    if (!pricePerKg || !adminTaxPerKg) {
      return res.status(400).json({
        success: false,
        message: 'Price per kg and admin tax per kg are required'
      });
    }

    if (isNaN(pricePerKg) || pricePerKg < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price per kg must be a positive number'
      });
    }

    if (isNaN(adminTaxPerKg) || adminTaxPerKg < 0) {
      return res.status(400).json({
        success: false,
        message: 'Admin tax per kg must be a positive number'
      });
    }

    // Verify admin exists
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin not found'
      });
    }

    const wastePrice = await WarehouseWastePrice.findById(id);
    if (!wastePrice) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse waste price not found'
      });
    }

    // Update the price
    wastePrice.pricePerKg = pricePerKg;
    wastePrice.adminTaxPerKg = adminTaxPerKg;
    wastePrice.updatedBy = adminId;
    wastePrice.updatedAt = new Date();

    await wastePrice.save();
    await wastePrice.populate('updatedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Warehouse waste price updated successfully',
      data: wastePrice
    });
  } catch (error) {
    console.error('Error updating warehouse waste price:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating warehouse waste price',
      error: error.message
    });
  }
};

// Delete (deactivate) warehouse waste price
export const deleteWarehouseWastePrice = async (req, res) => {
  try {
    const { id } = req.params;

    const wastePrice = await WarehouseWastePrice.findById(id);
    if (!wastePrice) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse waste price not found'
      });
    }

    await wastePrice.deactivate();

    res.status(200).json({
      success: true,
      message: 'Warehouse waste price deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting warehouse waste price:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting warehouse waste price',
      error: error.message
    });
  }
};

// Calculate earnings for waste transaction
export const calculateWarehouseEarnings = async (req, res) => {
  try {
    const { wasteType, weight } = req.body;

    if (!wasteType || !weight) {
      return res.status(400).json({
        success: false,
        message: 'Waste type and weight are required'
      });
    }

    if (isNaN(weight) || weight < 0) {
      return res.status(400).json({
        success: false,
        message: 'Weight must be a positive number'
      });
    }

    const earnings = await WarehouseWastePrice.calculateEarnings(wasteType, weight);
    
    if (!earnings) {
      return res.status(404).json({
        success: false,
        message: 'Price not found for this waste type'
      });
    }

    res.status(200).json({
      success: true,
      data: earnings
    });
  } catch (error) {
    console.error('Error calculating warehouse earnings:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating earnings',
      error: error.message
    });
  }
};

// Initialize default warehouse waste prices
export const initializeDefaultWarehouseWastePrices = async (req, res) => {
  try {
    const adminId = req.user.id;
    
    const defaultPrices = [
      { wasteType: 'plastic', pricePerKg: 45, adminTaxPerKg: 5 },
      { wasteType: 'paper', pricePerKg: 25, adminTaxPerKg: 3 },
      { wasteType: 'glass', pricePerKg: 15, adminTaxPerKg: 2 },
      { wasteType: 'metal', pricePerKg: 85, adminTaxPerKg: 10 },
      { wasteType: 'organic', pricePerKg: 8, adminTaxPerKg: 1 },
      { wasteType: 'coconut-shell', pricePerKg: 12, adminTaxPerKg: 1.5 },
      { wasteType: 'e-waste', pricePerKg: 65, adminTaxPerKg: 8 },
      { wasteType: 'mixed', pricePerKg: 20, adminTaxPerKg: 2.5 }
    ];

    const createdPrices = [];

    for (const defaultPrice of defaultPrices) {
      const existingPrice = await WarehouseWastePrice.findOne({ 
        wasteType: defaultPrice.wasteType, 
        isActive: true 
      });

      if (!existingPrice) {
        const wastePrice = new WarehouseWastePrice({
          ...defaultPrice,
          updatedBy: adminId
        });
        
        await wastePrice.save();
        createdPrices.push(wastePrice);
      }
    }

    res.status(200).json({
      success: true,
      message: `Initialized ${createdPrices.length} default warehouse waste prices`,
      data: createdPrices
    });
  } catch (error) {
    console.error('Error initializing default warehouse waste prices:', error);
    res.status(500).json({
      success: false,
      message: 'Error initializing default prices',
      error: error.message
    });
  }
};