import Salary from '../models/Salary.js';
import PickUpAgent from '../models/PickUpAgent.js';
import PickUpPartner from '../models/PickUpPartner.js';
import { sendSalarySlipEmail as sendEmailService } from '../services/emailService.js';

// Salary calculation utilities
class SalaryCalculator {
  static round2(n) {
    return Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100;
  }

  static calculateStatutory(salaryData) {
    const { basic, allowances, perks } = salaryData;
    
    // EPF/ETF base = Basic + Food + Medical + COLA + Bonus (OT typically excluded)
    const epfBase = 
      Number(basic || 0) +
      Number(allowances.food || 0) +
      Number(allowances.medical || 0) +
      Number(allowances.cola || 0) +
      Number(perks.bonus || 0);

    const epfEmployee = this.round2(epfBase * 0.08); // 8% employee deduction
    const epfEmployer = this.round2(epfBase * 0.12); // 12% employer contribution
    const etfEmployer = this.round2(epfBase * 0.03); // 3% employer contribution

    return { epfBase, epfEmployee, epfEmployer, etfEmployer };
  }

  static calculateTotals(salaryData, statutory) {
    const { basic, allowances, perks, deductions } = salaryData;
    
    const totalAllowances = 
      Number(allowances.food || 0) +
      Number(allowances.medical || 0) +
      Number(allowances.cola || 0) +
      Number(perks.overtime || 0) +
      Number(perks.bonus || 0);

    const grossSalary = Number(basic || 0) + totalAllowances;

    const totalDeductions = 
      Number(deductions.noPay || 0) +
      Number(statutory.epfEmployee || 0) +
      Number(deductions.loans || 0);

    const netSalary = grossSalary - totalDeductions;

    return {
      totalAllowances,
      totalDeductions,
      grossSalary,
      netSalary
    };
  }

  static calculateOvertime(basicSalary, workingDays, overtimeHours) {
    if (workingDays <= 0) return 0;
    const dailyRate = Number(basicSalary || 0) / workingDays;
    const otRate = (dailyRate / 8) * 1.5; // 1.5x hourly rate for overtime
    return this.round2(otRate * Number(overtimeHours || 0));
  }

  static calculateNoPayDeduction(basicSalary, workingDays, noPayDays) {
    if (workingDays <= 0) return 0;
    const dailyRate = Number(basicSalary || 0) / workingDays;
    return this.round2(Number(noPayDays || 0) * dailyRate);
  }
}

// Calculate salary
export const calculateSalary = async (req, res, next) => {
  try {
    const {
      pickupAgentId,
      employee,
      attendance,
      salary
    } = req.body;

    // Validate required fields
    if (!pickupAgentId || !employee || !attendance || !salary) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Verify pickup agent exists and get partner info
    const pickupAgent = await PickUpAgent.findOne({ agentId: pickupAgentId })
      .populate('partnerId');

    if (!pickupAgent) {
      return res.status(404).json({
        success: false,
        message: 'Pickup agent not found'
      });
    }

    // Calculate statutory contributions
    const statutory = SalaryCalculator.calculateStatutory(salary);

    // Calculate totals
    const totals = SalaryCalculator.calculateTotals(salary, statutory);

    // Create response with all calculations
    const calculationResult = {
      employee: {
        ...employee,
        pickupAgentId
      },
      attendance,
      salary: {
        ...salary,
        deductions: {
          ...salary.deductions,
          epf: statutory.epfEmployee
        }
      },
      statutory: {
        epfBase: statutory.epfBase,
        epfEmployee: statutory.epfEmployee,
        epfEmployer: statutory.epfEmployer,
        etfEmployer: statutory.etfEmployer
      },
      totals,
      pickupAgent: {
        id: pickupAgent._id,
        agentId: pickupAgent.agentId,
        name: pickupAgent.name,
        partner: {
          id: pickupAgent.partnerId._id,
          name: pickupAgent.partnerId.name
        }
      }
    };

    res.json({
      success: true,
      data: calculationResult
    });

  } catch (error) {
    console.error('Error calculating salary:', error);
    next(error);
  }
};

// Save calculated salary
export const saveSalary = async (req, res, next) => {
  try {
    const {
      pickupAgentId,
      employee,
      attendance,
      salary,
      statutory,
      totals
    } = req.body;

    // Verify pickup agent exists
    const pickupAgent = await PickUpAgent.findOne({ agentId: pickupAgentId })
      .populate('partnerId');

    if (!pickupAgent) {
      return res.status(404).json({
        success: false,
        message: 'Pickup agent not found'
      });
    }

    // Check if salary record already exists for this agent and month
    const existingSalary = await Salary.findOne({
      pickupAgentId,
      'attendance.month': attendance.month
    });

    if (existingSalary) {
      return res.status(409).json({
        success: false,
        message: `Salary record already exists for agent ${pickupAgentId} for ${attendance.month}. Each agent can only have one salary record per month.`
      });
    }

    // Create salary record
    const salaryRecord = new Salary({
      pickupAgent: pickupAgent._id,
      pickupPartner: pickupAgent.partnerId._id,
      pickupAgentId,
      employee: {
        name: employee.name,
        agentId: employee.agentId,
        email: employee.email,
        epfNo: employee.epfNo
      },
      attendance,
      salary: {
        basic: salary.basic,
        deductions: {
          noPay: salary.deductions.noPay,
          epf: statutory.epfEmployee,
          etf: statutory.etfEmployer,
          loans: salary.deductions.loans
        },
        allowances: salary.allowances,
        perks: salary.perks
      },
      meta: {
        epfBase: statutory.epfBase,
        epfEmployer: statutory.epfEmployer
      },
      totals
    });

    const savedSalary = await salaryRecord.save();
    await savedSalary.populate(['pickupAgent', 'pickupPartner']);

    res.status(201).json({
      success: true,
      message: 'Salary record saved successfully',
      data: savedSalary
    });

  } catch (error) {
    console.error('Error saving salary:', error);
    
    // Handle mongoose duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Salary record already exists for this agent in this month'
      });
    }
    
    next(error);
  }
};

// Get salary records for a pickup partner
export const getPartnerSalaries = async (req, res, next) => {
  try {
    const { partnerId } = req.params;
    
    // Use authenticated user's ID if partnerId is 'current'
    const actualPartnerId = partnerId === 'current' ? req.user.id : partnerId;
    
    const salaries = await Salary.find({ pickupPartner: actualPartnerId })
      .populate('pickupAgent', 'name agentId')
      .populate('pickupPartner', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: salaries
    });

  } catch (error) {
    console.error('Error fetching partner salaries:', error);
    next(error);
  }
};

// Get pickup agents for a partner
export const getPartnerAgents = async (req, res, next) => {
  try {
    // Use the authenticated user's ID as the partner ID
    const partnerId = req.user.id;
    
    const agents = await PickUpAgent.find({ partnerId: partnerId })
      .select('name agentId email phoneNumber');

    res.json({
      success: true,
      data: agents
    });

  } catch (error) {
    console.error('Error fetching partner agents:', error);
    next(error);
  }
};

// Helper functions for frontend
export const calculateOvertimeHelper = async (req, res, next) => {
  try {
    const { basicSalary, workingDays, overtimeHours } = req.body;
    
    const overtimePay = SalaryCalculator.calculateOvertime(basicSalary, workingDays, overtimeHours);
    
    res.json({
      success: true,
      data: { overtimePay }
    });

  } catch (error) {
    console.error('Error calculating overtime:', error);
    next(error);
  }
};

export const calculateNoPayHelper = async (req, res, next) => {
  try {
    const { basicSalary, workingDays, noPayDays } = req.body;
    
    const noPayDeduction = SalaryCalculator.calculateNoPayDeduction(basicSalary, workingDays, noPayDays);
    
    res.json({
      success: true,
      data: { noPayDeduction }
    });

  } catch (error) {
    console.error('Error calculating no pay deduction:', error);
    next(error);
  }
};

// Delete salary record
export const deleteSalary = async (req, res, next) => {
  try {
    const { salaryId } = req.params;
    
    // Find and delete the salary record
    const deletedSalary = await Salary.findByIdAndDelete(salaryId);
    
    if (!deletedSalary) {
      return res.status(404).json({
        success: false,
        message: 'Salary record not found'
      });
    }

    res.json({
      success: true,
      message: 'Salary record deleted successfully',
      data: deletedSalary
    });

  } catch (error) {
    console.error('Error deleting salary:', error);
    next(error);
  }
};

// Get agent's own salary records
export const getAgentSalaries = async (req, res, next) => {
  try {
    // Get query parameters for filtering
    const { month, year } = req.query;
    
    // Use the authenticated agent's ID from the token
    const agentId = req.user.agentId || req.user.id;
    
    console.log('Fetching salaries for agent:', agentId);
    console.log('User object:', req.user);
    
    // Build query conditions
    let queryConditions = { pickupAgentId: agentId };
    
    // Add month filter if provided
    if (month) {
      queryConditions['attendance.month'] = month;
    }
    
    // Find salary records for this agent
    const salaries = await Salary.find(queryConditions)
      .populate('pickupAgent', 'name agentId email')
      .populate('pickupPartner', 'name')
      .sort({ 'attendance.month': -1, createdAt: -1 });

    console.log(`Found ${salaries.length} salary records for agent ${agentId}`);

    res.json({
      success: true,
      data: salaries,
      count: salaries.length
    });

  } catch (error) {
    console.error('Error fetching agent salaries:', error);
    next(error);
  }
};

// --- ADMIN SALARY MANAGEMENT CONTROLLERS ---

// Get all salary records (admin)
export const getAllSalariesAdmin = async (req, res, next) => {
  try {
    const salaries = await Salary.find().sort({ createdAt: -1 });
    res.json({ success: true, data: salaries });
  } catch (error) {
    console.error('Error fetching all salaries (admin):', error);
    next(error);
  }
};

// Get a single salary record by ID (admin)
export const getSalaryByIdAdmin = async (req, res, next) => {
  try {
    const { salaryId } = req.params;
    const salary = await Salary.findById(salaryId);
    if (!salary) {
      return res.status(404).json({ success: false, message: 'Salary record not found' });
    }
    res.json({ success: true, data: salary });
  } catch (error) {
    console.error('Error fetching salary by ID (admin):', error);
    next(error);
  }
};

// Update a salary record (admin)
export const updateSalaryAdmin = async (req, res, next) => {
  try {
    const { salaryId } = req.params;
    const update = req.body;
    const salary = await Salary.findByIdAndUpdate(salaryId, update, { new: true });
    if (!salary) {
      return res.status(404).json({ success: false, message: 'Salary record not found' });
    }
    res.json({ success: true, data: salary });
  } catch (error) {
    console.error('Error updating salary (admin):', error);
    next(error);
  }
};

// Delete a salary record (admin)
export const deleteSalaryAdmin = async (req, res, next) => {
  try {
    const { salaryId } = req.params;
    const deleted = await Salary.findByIdAndDelete(salaryId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Salary record not found' });
    }
    res.json({ success: true, message: 'Salary record deleted successfully' });
  } catch (error) {
    console.error('Error deleting salary (admin):', error);
    next(error);
  }
};

// Send salary slip via email
export const sendSalarySlipEmail = async (req, res, next) => {
  try {
    console.log('📧 Starting email sending process...');
    const { salaryId } = req.params;
    const { pdfData } = req.body;

    console.log('📋 Request data:', { salaryId, hasPdfData: !!pdfData });

    // Validate required data
    if (!pdfData) {
      console.log('❌ No PDF data provided');
      return res.status(400).json({ 
        success: false, 
        message: 'PDF data is required' 
      });
    }

    // Get salary record with employee details
    console.log('🔍 Finding salary record...');
    const salary = await Salary.findById(salaryId);

    if (!salary) {
      console.log('❌ Salary record not found');
      return res.status(404).json({ 
        success: false, 
        message: 'Salary record not found' 
      });
    }

    console.log('✅ Salary record found:', { 
      employeeName: salary.employee?.name, 
      employeeEmail: salary.employee?.email,
      agentId: salary.employee?.agentId,
      month: salary.attendance?.month
    });

    // Validate employee email
    if (!salary.employee || !salary.employee.email || salary.employee.email === 'N/A') {
      console.log('❌ Employee email not found or invalid');
      return res.status(400).json({ 
        success: false, 
        message: 'Employee email not found or invalid' 
      });
    }

    // Convert base64 to buffer
    console.log('🔄 Converting PDF data to buffer...');
    
    // Validate base64 format
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(pdfData)) {
      console.log('❌ Invalid base64 PDF data format');
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid PDF data format' 
      });
    }
    
    const pdfBuffer = Buffer.from(pdfData, 'base64');
    console.log('✅ PDF buffer created, size:', pdfBuffer.length, 'bytes');

    // Validate email before sending
    console.log('📧 Validating employee email...');
    if (!salary.employee.email) {
      console.log('❌ No email address found for employee');
      return res.status(400).json({ 
        success: false, 
        message: 'Employee email address is missing. Please update employee profile.' 
      });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(salary.employee.email)) {
      console.log('❌ Invalid email format:', salary.employee.email);
      return res.status(400).json({ 
        success: false, 
        message: `Invalid email address format: ${salary.employee.email}. Please update employee profile.` 
      });
    }
    
    console.log('✅ Email validation passed:', salary.employee.email);

    // Send email
    console.log('📤 Sending email...');
    const emailResult = await sendEmailService({
      recipientEmail: salary.employee.email,
      recipientName: salary.employee.name,
      agentId: salary.employee.agentId,
      month: salary.attendance.month,
      pdfBuffer: pdfBuffer
    });

    console.log('✅ Email sent successfully:', emailResult);

    // Update salary record to mark as sent
    console.log('💾 Updating salary record...');
    await Salary.findByIdAndUpdate(salaryId, {
      emailSent: true,
      emailSentAt: new Date()
    });

    console.log('🎉 Process completed successfully');
    res.json({
      success: true,
      message: `Salary slip sent successfully to ${salary.employee.email}`,
      emailId: emailResult.messageId
    });

  } catch (error) {
    console.error('💥 DETAILED ERROR in sendSalarySlipEmail:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Log additional context
    console.error('Request params:', req.params);
    console.error('Request body keys:', Object.keys(req.body || {}));
    console.error('User info:', req.user ? { id: req.user.id, role: req.user.role } : 'No user');
    
    // Provide specific error responses
    let errorMessage = 'Failed to send salary slip email';
    let statusCode = 500;
    
    if (error.message.includes('Email configuration missing')) {
      errorMessage = 'Email service is not configured properly. Please contact administrator.';
      statusCode = 503; // Service Unavailable
    } else if (error.message.includes('Invalid email address')) {
      errorMessage = `Invalid employee email address. Please update employee email in system.`;
      statusCode = 400; // Bad Request
    } else if (error.message.includes('authentication failed') || error.message.includes('Invalid login')) {
      errorMessage = 'Email service authentication failed. Please contact administrator.';
      statusCode = 503; // Service Unavailable
    } else if (error.message.includes('Network connection failed') || error.message.includes('ENOTFOUND')) {
      errorMessage = 'Network connection failed. Please check internet connection and try again.';
      statusCode = 503; // Service Unavailable
    } else if (error.message.includes('PDF')) {
      errorMessage = 'Failed to generate or process PDF document. Please try again.';
      statusCode = 500;
    } else if (error.message.includes('not found') || error.message.includes('does not exist')) {
      errorMessage = 'Salary record not found or employee data is incomplete.';
      statusCode = 404; // Not Found
    } else {
      errorMessage = error.message || 'An unexpected error occurred while sending the email';
    }
    
    res.status(statusCode).json({ 
      success: false, 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
};
