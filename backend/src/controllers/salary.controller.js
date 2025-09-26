import Salary from '../models/Salary.js';
import PickUpAgent from '../models/PickUpAgent.js';
import PickUpPartner from '../models/PickUpPartner.js';

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
