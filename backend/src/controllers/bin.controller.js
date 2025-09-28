// controllers/bin.controller.js
import Bin from "../models/Bin.js";
import { sendBinFullNotification } from "../services/emailService.js";

/**
 * Get all bins owned by the logged-in user
 */
export async function getMyBins(req, res, next) {
  try {
    const bins = await Bin.find({ owner: req.user.id }).sort("-createdAt");
    res.json(bins);
  } catch (err) {
    next(err);
  }
}

/**
 * Create a new bin for the logged-in user
 */
export async function createBin(req, res, next) {
  try {
    const { location, fillLevel, wasteType, label } = req.body;

    if (!wasteType) {
      return res.status(400).json({ message: "Waste type is required" });
    }

    const bin = await Bin.create({
      owner: req.user.id,
      location, // optional; will default to user's location in schema if not provided
      fillLevel: fillLevel ?? 0,
      wasteType,
      label,
    });

    res.status(201).json(bin);
  } catch (err) {
    next(err);
  }
}

/**
 * Update an existing bin (only by owner or admin)
 */
export async function updateBin(req, res, next) {
  try {
    const bin = await Bin.findById(req.params.id);
    if (!bin) {
      return res.status(404).json({ message: "Bin not found" });
    }

    // Only owner or admin can update
    if (String(bin.owner) !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Allowed fields
    const allowed = ["location", "fillLevel", "wasteType", "status", "label", "address"];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    );

    const updated = await Bin.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

/**
 * Delete a bin (only by owner or admin)
 */
export async function deleteBin(req, res, next) {
  try {
    const bin = await Bin.findById(req.params.id);
    if (!bin) {
      return res.status(404).json({ message: "Bin not found" });
    }

    // Only owner or admin can delete
    if (String(bin.owner) !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    await bin.deleteOne();
    res.json({ message: "Bin deleted" });
  } catch (err) {
    next(err);
  }
}

/**
 * Blynk Polling Service Integration
 * Functions for managing Blynk data polling
 */

let blynkPollingService = null;

/**
 * Set the Blynk polling service instance
 */
export const setBlynkPollingService = (service) => {
  blynkPollingService = service;
};

/**
 * Get current bin fill level
 * GET /api/bin/fill
 */
export const getCurrentFillLevel = (req, res) => {
  try {
    if (!blynkPollingService) {
      return res.status(503).json({
        success: false,
        message: 'Blynk polling service not available'
      });
    }

    const fillData = blynkPollingService.getCurrentFillLevel();
    
    res.json({
      success: true,
      data: fillData
    });

  } catch (error) {
    console.error('❌ Get fill level error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get Blynk polling service status
 * GET /api/bin/status
 */
export const getPollingStatus = (req, res) => {
  try {
    if (!blynkPollingService) {
      return res.status(503).json({
        success: false,
        message: 'Blynk polling service not available'
      });
    }

    const status = blynkPollingService.getStatus();
    
    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('❌ Get polling status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Send bin full notification email to bin owner
 * POST /api/admin/bins/:id/notify
 */
export const sendBinFullNotificationEmail = async (req, res) => {
  try {
    const binId = req.params.id;
    
    // Find the bin and populate owner details
    const bin = await Bin.findById(binId).populate('owner', 'firstName lastName email');
    
    if (!bin) {
      return res.status(404).json({
        success: false,
        message: 'Bin not found'
      });
    }

    if (!bin.owner) {
      return res.status(400).json({
        success: false,
        message: 'Bin owner not found'
      });
    }

    if (!bin.owner.email) {
      return res.status(400).json({
        success: false,
        message: 'Bin owner email not available'
      });
    }

    // Check if bin fill level is actually 90% or more
    if (bin.fillLevel < 90) {
      return res.status(400).json({
        success: false,
        message: 'Bin fill level is below 90%. Notification not required.'
      });
    }

    // Prepare email data
    const emailData = {
      recipientEmail: bin.owner.email,
      recipientName: `${bin.owner.firstName} ${bin.owner.lastName}`,
      binLabel: bin.label || `Bin ${bin._id.toString().slice(-6)}`,
      binId: bin._id.toString(),
      fillLevel: bin.fillLevel,
      address: bin.address || 'Location not specified',
      wasteType: bin.wasteType || 'mixed'
    };

    console.log('📧 Sending bin full notification:', emailData);

    // Send the email
    const emailResult = await sendBinFullNotification(emailData);

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send notification email',
        error: emailResult.message
      });
    }

    // Update bin with notification sent timestamp
    bin.lastNotificationSent = new Date();
    await bin.save();

    res.json({
      success: true,
      message: 'Bin full notification sent successfully',
      data: {
        binId: bin._id,
        recipientEmail: bin.owner.email,
        messageId: emailResult.messageId,
        sentAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Send bin notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
