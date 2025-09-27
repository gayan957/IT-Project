// Salary calculation utilities for frontend
export class SalaryCalculator {
  static round2(n) {
    return Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100;
  }

  static calculateStatutory(salaryData) {
    const { basic, allowances, perks } = salaryData;
    
    // Calculate gross salary first (Basic + All Allowances + Perks)
    const grossSalary = 
      Number(basic || 0) +
      Number(allowances.food || 0) +
      Number(allowances.medical || 0) +
      Number(allowances.cola || 0) +
      Number(perks.overtime || 0) +
      Number(perks.bonus || 0);

    // EPF/ETF calculated from gross salary
    const epfBase = grossSalary;
    const epfEmployee = this.round2(grossSalary * 0.08); // 8% employee deduction
    const epfEmployer = this.round2(grossSalary * 0.12); // 12% employer contribution
    const etfEmployer = this.round2(grossSalary * 0.03); // 3% employer contribution (ATF)

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

  static formatCurrency(amount, currency = 'LKR') {
    const formatter = new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    });
    return formatter.format(Number(amount || 0));
  }

  static getCurrentMonth() {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[new Date().getMonth()];
  }

  static getCurrentYear() {
    return new Date().getFullYear();
  }

  static getWorkingDaysInMonth(month, year) {
    const monthIndex = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ].indexOf(month);
    
    if (monthIndex === -1) return 22; // default
    
    const date = new Date(year, monthIndex, 1);
    let workingDays = 0;
    
    while (date.getMonth() === monthIndex) {
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
        workingDays++;
      }
      date.setDate(date.getDate() + 1);
    }
    
    return workingDays;
  }

  static validateSalaryData(data) {
    const errors = [];

    // Employee validation
    if (!data.employee?.pickupAgentId) {
      errors.push('Pickup Agent selection is required');
    }
    if (!data.employee?.name) {
      errors.push('Employee name is required');
    }
    if (!data.employee?.agentId) {
      errors.push('Agent ID is required');
    }
    if (!data.employee?.email) {
      errors.push('Employee email is required');
    }
    if (!data.employee?.epfNo) {
      errors.push('EPF Number is required');
    }

    // Attendance validation
    if (!data.attendance?.month) {
      errors.push('Month is required');
    }
    if (!data.attendance?.workingDays || data.attendance.workingDays <= 0) {
      errors.push('Valid working days is required');
    }

    // Salary validation
    if (!data.salary?.basic || data.salary.basic <= 0) {
      errors.push('Basic salary is required and must be greater than 0');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Create default salary structure
  static createDefaultSalaryData() {
    return {
      employee: {
        pickupAgentId: '',
        agentId: '',
        name: '',
        email: '',
        epfNo: ''
      },
      attendance: {
        month: this.getCurrentMonth(),
        year: this.getCurrentYear(),
        workingDays: 22,
        overtimeHours: 0,
        noPayDays: 0
      },
      salary: {
        basic: 0,
        deductions: {
          noPay: 0,
          loans: 0
        },
        allowances: {
          food: 0,
          medical: 0,
          cola: 0
        },
        perks: {
          overtime: 0,
          bonus: 0
        }
      }
    };
  }
}