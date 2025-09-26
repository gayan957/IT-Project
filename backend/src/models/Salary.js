import mongoose from 'mongoose';

const salarySchema = new mongoose.Schema({
  pickupAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PickUpAgent',
    required: true
  },
  pickupPartner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PickUpPartner',
    required: true
  },
  pickupAgentId: {
    type: String,
    required: true
  },
  employee: {
    name: String,
    agentId: String,
    email: String,
    epfNo: String
  },
  attendance: {
    month: { type: String, required: true },
    workingDays: Number,
    overtimeHours: Number,
    noPayDays: Number
  },
  salary: {
    basic: Number,
    deductions: {
      noPay: Number,
      epf: Number,
      etf: Number,
      loans: Number
    },
    allowances: {
      food: Number,
      medical: Number,
      cola: Number
    },
    perks: {
      overtime: Number,
      bonus: Number
    }
  },
  meta: {
    epfBase: Number,
    epfEmployer: Number
  },
  totals: {
    totalAllowances: Number,
    totalDeductions: Number,
    grossSalary: Number,
    netSalary: Number
  },
  createdAt: { type: Date, default: Date.now }
});

// Create compound unique index to prevent duplicate records for same agent in same month
salarySchema.index({ pickupAgentId: 1, 'attendance.month': 1 }, { unique: true });

export default mongoose.model('Salary', salarySchema);
