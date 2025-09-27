import { useState, useEffect, useMemo, useCallback } from 'react';
import { SalaryCalculator } from '../lib/salaryCalculator';
import { salaryApi } from '../lib/salaryApi';
import {
  Field,
  Section,
  SummaryCard,
  Input,
  Select,
  ErrorMessage,
  SuccessMessage
} from '../components/SalaryComponents';

export default function SalaryCalculation() {
  const [agents, setAgents] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [calculationResult, setCalculationResult] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form data
  const [formData, setFormData] = useState(SalaryCalculator.createDefaultSalaryData());

  // Load pickup agents when component mounts
  const loadPartnerAgents = useCallback(async () => {
    try {
      const response = await salaryApi.getPartnerAgents();
      setAgents(response.data || []);
    } catch (error) {
      console.error('Error loading agents:', error);
      setError('Failed to load pickup agents');
    }
  }, []);

  useEffect(() => {
    loadPartnerAgents();
  }, [loadPartnerAgents]);

  // Update form data
  const updateFormData = (path, value) => {
    setFormData(prev => {
      const keys = path.split('.');
      const updated = { ...prev };
      let current = updated;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return updated;
    });
    setError('');
    setSuccess('');
  };

  // Save salary record
  const handleSave = async () => {
    // Basic validation - only check essential fields
    const validationErrors = [];
    
    if (!formData.employee.pickupAgentId) {
      validationErrors.push('Please select a pickup agent');
    }
    
    if (!formData.salary.basic || formData.salary.basic <= 0) {
      validationErrors.push('Basic salary must be greater than 0');
    }
    
    if (!previewCalculation) {
      validationErrors.push('Unable to calculate salary totals');
    }
    
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      
      // Prepare the salary data for saving
      const salaryData = {
        pickupAgentId: formData.employee.pickupAgentId,
        employee: {
          name: formData.employee.name,
          agentId: formData.employee.pickupAgentId,
          email: formData.employee.email,
          epfNo: formData.employee.epfNo
        },
        attendance: {
          month: formData.attendance.month,
          workingDays: formData.attendance.workingDays,
          overtimeHours: formData.attendance.overtimeHours,
          noPayDays: formData.attendance.noPayDays
        },
        salary: formData.salary,
        statutory: previewCalculation.statutory,
        totals: previewCalculation.totals
      };
      
      const response = await salaryApi.saveSalary(salaryData);
      setSuccess(`Salary record saved successfully! Net Salary: ${SalaryCalculator.formatCurrency(previewCalculation.totals.netSalary)}`);
      
      console.log('Salary saved:', response.data);
      
      // Reset form after successful save
      setTimeout(() => {
        setFormData(SalaryCalculator.createDefaultSalaryData());
        setCalculationResult(null);
        setSuccess('');
      }, 3000);
      
    } catch (error) {
      console.error('Error saving salary:', error);
      
      // Handle specific error cases
      if (error.status === 409) {
        setError(`Duplicate record: ${error.message}`);
      } else if (error.status === 404) {
        setError('Pickup agent not found. Please verify the agent ID.');
      } else if (error.status === 403) {
        setError('You do not have permission to save salary records.');
      } else {
        setError(error.message || 'Failed to save salary record. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Real-time calculations for preview
  const previewCalculation = useMemo(() => {
    if (!formData.salary.basic) return null;

    const statutory = SalaryCalculator.calculateStatutory(formData.salary);
    const totals = SalaryCalculator.calculateTotals(formData.salary, statutory);

    return {
      statutory,
      totals,
      formattedAmounts: {
        basic: SalaryCalculator.formatCurrency(formData.salary.basic),
        totalAllowances: SalaryCalculator.formatCurrency(totals.totalAllowances),
        totalDeductions: SalaryCalculator.formatCurrency(totals.totalDeductions),
        netSalary: SalaryCalculator.formatCurrency(totals.netSalary)
      }
    };
  }, [formData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-3">
            Salary Calculator
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Modern payroll management system for pickup agents with automated calculations and comprehensive reporting
          </p>
        </div>

        {/* Messages */}
        <ErrorMessage message={error} />
        <SuccessMessage message={success} />

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left Column - Employee & Attendance */}
          <div className="space-y-8">
            {/* Employee Information */}
            <div className="group">
              <Section 
                title="Employee Information" 
                icon={
                  <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl group-hover:from-blue-200 group-hover:to-blue-300 transition-all duration-300">
                    <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                }
              >
                <div className="space-y-6">
                  <Field label="Pickup Agent" required>
                    <Select
                      value={formData.employee.pickupAgentId}
                      onChange={(e) => {
                        const agent = agents.find(a => a.agentId === e.target.value);
                        updateFormData('employee.pickupAgentId', e.target.value);
                        if (agent) {
                          updateFormData('employee.name', agent.name || '');
                          updateFormData('employee.email', agent.email || '');
                          updateFormData('employee.agentId', agent.agentId || '');
                          updateFormData('employee.epfNo', agent.agentId || '');
                        } else {
                          updateFormData('employee.name', '');
                          updateFormData('employee.email', '');
                          updateFormData('employee.agentId', '');
                          updateFormData('employee.epfNo', '');
                        }
                      }}
                    >
                      <option value="">Select pickup agent</option>
                      {agents.map(agent => (
                        <option key={agent._id} value={agent.agentId}>
                          {agent.name} ({agent.agentId})
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <div className="grid grid-cols-1 gap-4">
                    <Field label="Full Name" required>
                      <Input
                        value={formData.employee.name}
                        readOnly
                        placeholder="Auto-filled when agent is selected"
                        className="bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200 cursor-not-allowed"
                      />
                    </Field>

                    <Field label="Agent ID" required>
                      <Input
                        value={formData.employee.agentId}
                        readOnly
                        placeholder="Auto-filled when agent is selected"
                        className="bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200 cursor-not-allowed"
                      />
                    </Field>
                  </div>

                  <Field label="Email Address" required>
                    <Input
                      value={formData.employee.email}
                      readOnly
                      placeholder="Auto-filled when agent is selected"
                      className="bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200 cursor-not-allowed"
                    />
                  </Field>

                  <Field label="EPF Number" helpText="Employee Provident Fund number">
                    <Input
                      value={formData.employee.epfNo}
                      readOnly
                      placeholder="Auto-filled when agent is selected"
                      className="bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200 cursor-not-allowed"
                    />
                  </Field>
                </div>
              </Section>
            </div>

            {/* Attendance Details */}
            <div className="group">
              <Section 
                title="Attendance Details" 
                icon={
                  <div className="p-2 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl group-hover:from-emerald-200 group-hover:to-emerald-300 transition-all duration-300">
                    <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                }
              >
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Month" required>
                      <Select
                        value={formData.attendance.month}
                        onChange={(e) => updateFormData('attendance.month', e.target.value)}
                        className="bg-white border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
                      >
                        {['January','February','March','April','May','June','July','August','September','October','November','December'].map((month) => 
                          <option key={month} value={month}>{month}</option>
                        )}
                      </Select>
                    </Field>

                    <Field label="Working Days" required helpText="Total working days">
                      <Input
                        type="number"
                        value={formData.attendance.workingDays}
                        onChange={(e) => updateFormData('attendance.workingDays', Number(e.target.value))}
                        placeholder="0"
                        min="0"
                        max="31"
                        className="bg-white border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Overtime Hours" helpText="Additional hours">
                      <Input
                        type="number"
                        value={formData.attendance.overtimeHours}
                        onChange={(e) => {
                          const overtimeHours = Number(e.target.value);
                          updateFormData('attendance.overtimeHours', overtimeHours);
                          
                          if (formData.salary.basic && formData.attendance.workingDays && overtimeHours >= 0) {
                            const overtimePay = SalaryCalculator.calculateOvertime(
                              formData.salary.basic,
                              formData.attendance.workingDays,
                              overtimeHours
                            );
                            updateFormData('salary.perks.overtime', overtimePay);
                          }
                        }}
                        placeholder="22"
                        min="0"
                        className="bg-white border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </Field>

                    <Field label="No Pay Days" helpText="Absence days">
                      <Input
                        type="number"
                        value={formData.attendance.noPayDays}
                        onChange={(e) => {
                          const noPayDays = Number(e.target.value);
                          updateFormData('attendance.noPayDays', noPayDays);
                          
                          if (formData.salary.basic && formData.attendance.workingDays && noPayDays >= 0) {
                            const noPayDeduction = SalaryCalculator.calculateNoPayDeduction(
                              formData.salary.basic,
                              formData.attendance.workingDays,
                              noPayDays
                            );
                            updateFormData('salary.deductions.noPay', noPayDeduction);
                          }
                        }}
                        placeholder="0"
                        min="0"
                        className="bg-white border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </Field>
                  </div>
                </div>
              </Section>
            </div>
          </div>

          {/* Right Column - Salary Calculations */}
          <div className="space-y-8">
            {/* Basic Salary */}
            <div className="group">
              <Section 
                title="Salary Calculations" 
                icon={
                  <div className="p-2 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl group-hover:from-purple-200 group-hover:to-purple-300 transition-all duration-300">
                    <svg className="w-5 h-5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                }
              >
                <Field label="Basic Salary" required helpText="Base monthly salary amount">
                  <Input
                    type="number"
                    value={formData.salary.basic}
                    onChange={(e) => updateFormData('salary.basic', Number(e.target.value))}
                    placeholder="1000"
                    min="0"
                    step="0.01"
                    className="text-xl font-semibold bg-white border-2 border-purple-200 focus:border-purple-500 focus:ring-purple-500 py-4"
                  />
                </Field>
              </Section>
            </div>

            {/* Allowances and Deductions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Allowances */}
              <div className="group">
                <Section 
                  title="Allowances" 
                  icon={
                    <div className="p-2 bg-gradient-to-br from-green-100 to-green-200 rounded-xl group-hover:from-green-200 group-hover:to-green-300 transition-all duration-300">
                      <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                  }
                >
                  <div className="space-y-5">
                    <Field label="Food Allowance">
                      <Input
                        type="number"
                        value={formData.salary.allowances.food}
                        onChange={(e) => updateFormData('salary.allowances.food', Number(e.target.value))}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className="bg-white border-slate-300 focus:border-green-500 focus:ring-green-500"
                      />
                    </Field>

                    <Field label="Medical Allowance">
                      <Input
                        type="number"
                        value={formData.salary.allowances.medical}
                        onChange={(e) => updateFormData('salary.allowances.medical', Number(e.target.value))}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className="bg-white border-slate-300 focus:border-green-500 focus:ring-green-500"
                      />
                    </Field>

                    <Field label="Cost of Living (COLA)">
                      <Input
                        type="number"
                        value={formData.salary.allowances.cola}
                        onChange={(e) => updateFormData('salary.allowances.cola', Number(e.target.value))}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className="bg-white border-slate-300 focus:border-green-500 focus:ring-green-500"
                      />
                    </Field>

                    <Field label="Overtime Pay" helpText="Auto-calculated from attendance">
                      <Input
                        type="number"
                        value={formData.salary.perks.overtime}
                        onChange={(e) => updateFormData('salary.perks.overtime', Number(e.target.value))}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 focus:border-green-500 focus:ring-green-500"
                      />
                    </Field>

                    <Field label="Bonus & Incentives">
                      <Input
                        type="number"
                        value={formData.salary.perks.bonus}
                        onChange={(e) => updateFormData('salary.perks.bonus', Number(e.target.value))}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className="bg-white border-slate-300 focus:border-green-500 focus:ring-green-500"
                      />
                    </Field>
                  </div>
                </Section>
              </div>

              {/* Deductions */}
              <div className="group">
                <Section 
                  title="Deductions" 
                  icon={
                    <div className="p-2 bg-gradient-to-br from-red-100 to-red-200 rounded-xl group-hover:from-red-200 group-hover:to-red-300 transition-all duration-300">
                      <svg className="w-5 h-5 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                      </svg>
                    </div>
                  }
                >
                  <div className="space-y-5">
                    <Field label="No Pay Amount" helpText="Auto-calculated from attendance">
                      <Input
                        type="number"
                        value={formData.salary.deductions.noPay}
                        onChange={(e) => updateFormData('salary.deductions.noPay', Number(e.target.value))}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className="bg-gradient-to-r from-red-50 to-red-100 border-red-200 focus:border-red-500 focus:ring-red-500"
                      />
                    </Field>

                    <Field label="EPF (Employee 8%)" helpText="Auto-calculated">
                      <Input
                        type="number"
                        value={previewCalculation?.statutory.epfEmployee || 0}
                        readOnly
                        placeholder="80"
                        className="bg-gradient-to-r from-slate-100 to-slate-200 border-slate-300 cursor-not-allowed"
                      />
                    </Field>

                    <Field label="ETF (Employer 3%)" helpText="Information only">
                      <Input
                        type="number"
                        value={previewCalculation?.statutory.etfEmployer || 0}
                        readOnly
                        placeholder="30"
                        className="bg-gradient-to-r from-slate-100 to-slate-200 border-slate-300 cursor-not-allowed"
                      />
                    </Field>

                    <Field label="Loans & Advances">
                      <Input
                        type="number"
                        value={formData.salary.deductions.loans}
                        onChange={(e) => updateFormData('salary.deductions.loans', Number(e.target.value))}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className="bg-white border-slate-300 focus:border-red-500 focus:ring-red-500"
                      />
                    </Field>

                    <Field label="EPF (Employer 12%)" helpText="Information only">
                      <Input
                        type="number"
                        value={previewCalculation?.statutory.epfEmployer || 0}
                        readOnly
                        placeholder="120"
                        className="bg-gradient-to-r from-slate-100 to-slate-200 border-slate-300 cursor-not-allowed"
                      />
                    </Field>
                  </div>
                </Section>
              </div>
            </div>
          </div>
        </div>

        {/* Calculation Result - Displayed after calculation */}
        {calculationResult && (
          <div className="mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Detailed Breakdown */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900">Calculation Breakdown</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex justify-between items-center p-4 bg-slate-50/50 rounded-xl">
                  <span className="text-sm font-medium text-slate-600">EPF Base</span>
                  <span className="font-bold text-slate-900">{SalaryCalculator.formatCurrency(calculationResult.statutory.epfBase)}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-blue-50/50 rounded-xl">
                  <span className="text-sm font-medium text-blue-700">EPF Employee (8%)</span>
                  <span className="font-bold text-blue-900">{SalaryCalculator.formatCurrency(calculationResult.statutory.epfEmployee)}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-green-50/50 rounded-xl">
                  <span className="text-sm font-medium text-green-700">EPF Employer (12%)</span>
                  <span className="font-bold text-green-900">{SalaryCalculator.formatCurrency(calculationResult.statutory.epfEmployer)}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-purple-50/50 rounded-xl">
                  <span className="text-sm font-medium text-purple-700">ETF Employer (3%)</span>
                  <span className="font-bold text-purple-900">{SalaryCalculator.formatCurrency(calculationResult.statutory.etfEmployer)}</span>
                </div>
              </div>
            </div>

            {/* Summary Cards - 2x2 Grid */}
            <div className="grid grid-cols-2 gap-6">
              {/* Total Allowances */}
              <div className="bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 rounded-3xl p-8 border border-blue-200 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-500 rounded-2xl shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                </div>
                <p className="text-blue-700 text-sm font-semibold mb-2">Total Allowances</p>
                <p className="text-3xl font-bold text-blue-900">
                  LKR {calculationResult.totals.totalAllowances.toLocaleString()}
                </p>
              </div>

              {/* Total Deductions */}
              <div className="bg-gradient-to-br from-red-50 via-red-100 to-red-200 rounded-3xl p-8 border border-red-200 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-red-500 rounded-2xl shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                    </svg>
                  </div>
                </div>
                <p className="text-red-700 text-sm font-semibold mb-2">Total Deductions</p>
                <p className="text-3xl font-bold text-red-900">
                  LKR {calculationResult.totals.totalDeductions.toLocaleString()}
                </p>
              </div>

              {/* Gross Salary */}
              <div className="bg-gradient-to-br from-purple-50 via-purple-100 to-purple-200 rounded-3xl p-8 border border-purple-200 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-500 rounded-2xl shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <p className="text-purple-700 text-sm font-semibold mb-2">Gross Salary</p>
                <p className="text-3xl font-bold text-purple-900">
                  LKR {calculationResult.totals.grossSalary.toLocaleString()}
                </p>
              </div>

              {/* Net Salary */}
              <div className="bg-gradient-to-br from-emerald-50 via-green-100 to-emerald-200 rounded-3xl p-8 border-2 border-emerald-300 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-2 ring-2 ring-emerald-400/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
                <p className="text-emerald-700 text-sm font-semibold mb-2">Net Salary</p>
                <p className="text-4xl font-bold text-emerald-900">
                  LKR {calculationResult.totals.netSalary.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Live Preview - Horizontal at Bottom */}
        {previewCalculation && (
          <div className="mt-12 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Live Preview</h3>
              <p className="text-slate-600">Real-time calculation updates as you type</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Basic Salary */}
              <div className="bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 rounded-2xl p-6 border border-slate-300 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-slate-500 rounded-xl flex items-center justify-center shadow-md">
                    <span className="text-white text-lg">💼</span>
                  </div>
                </div>
                <p className="text-slate-700 text-sm font-semibold mb-1">Basic Salary</p>
                <p className="text-2xl font-bold text-slate-900">{previewCalculation.formattedAmounts.basic}</p>
              </div>

              {/* Total Allowances */}
              <div className="bg-gradient-to-br from-green-100 via-green-200 to-green-300 rounded-2xl p-6 border border-green-300 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-md">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                </div>
                <p className="text-green-700 text-sm font-semibold mb-1">Total Allowances</p>
                <p className="text-2xl font-bold text-green-900">{previewCalculation.formattedAmounts.totalAllowances}</p>
              </div>

              {/* Total Deductions */}
              <div className="bg-gradient-to-br from-red-100 via-red-200 to-red-300 rounded-2xl p-6 border border-red-300 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center shadow-md">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                    </svg>
                  </div>
                </div>
                <p className="text-red-700 text-sm font-semibold mb-1">Total Deductions</p>
                <p className="text-2xl font-bold text-red-900">{previewCalculation.formattedAmounts.totalDeductions}</p>
              </div>

              {/* Net Salary */}
              <div className="bg-gradient-to-br from-blue-100 via-indigo-200 to-purple-300 rounded-2xl p-6 border-2 border-blue-300 ring-2 ring-blue-400/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                </div>
                <p className="text-blue-700 text-sm font-semibold mb-1">Net Salary</p>
                <p className="text-3xl font-bold text-blue-900">{previewCalculation.formattedAmounts.netSalary}</p>
              </div>
            </div>
          </div>
        )}

        {/* Save Salary Button */}
        <div className="mt-12 flex justify-center">
          <button
            onClick={handleSave}
            disabled={!previewCalculation || isSaving}
            className="px-12 py-4 bg-gradient-to-br from-emerald-600 to-green-700 text-white rounded-2xl font-semibold shadow-xl hover:shadow-2xl hover:from-emerald-700 hover:to-green-800 transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-xl"
          >
            {isSaving ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving Salary...
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save Salary
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}