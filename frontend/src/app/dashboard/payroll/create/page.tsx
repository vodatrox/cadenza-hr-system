'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import {
  FiCalendar, FiUsers, FiFileText, FiCheck, FiChevronRight, FiChevronLeft, FiX, FiDollarSign, FiSearch
} from 'react-icons/fi';
import type { PayrollPeriod, Employee } from '@/types';

type Step = 1 | 2 | 3 | 4;

export default function CreatePayrollPage() {
  const router = useRouter();
  const { currentClient, isAuthenticated, _hasHydrated } = useAuthStore();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Period Selection
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null);
  const [batchTitle, setBatchTitle] = useState('');

  // Step 2: Employee Selection
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!_hasHydrated) return;

    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    if (!currentClient) {
      router.push('/clients');
      return;
    }

    fetchData();
  }, [_hasHydrated, isAuthenticated, currentClient]);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('[CreatePayroll] Fetching periods and employees...');

      const [periodsRes, employeesRes] = await Promise.all([
        api.get<any>('/payroll/periods/'),
        api.get<any>('/employees/')
      ]);

      console.log('[CreatePayroll] Periods response:', periodsRes.data);
      console.log('[CreatePayroll] Employees response:', employeesRes.data);

      // Handle both paginated and non-paginated responses for periods
      let periodsData: PayrollPeriod[];
      if (periodsRes.data.results && Array.isArray(periodsRes.data.results)) {
        periodsData = periodsRes.data.results;
      } else if (Array.isArray(periodsRes.data)) {
        periodsData = periodsRes.data;
      } else {
        periodsData = [];
      }

      // Handle both paginated and non-paginated responses for employees
      let employeesData: Employee[];
      if (employeesRes.data.results && Array.isArray(employeesRes.data.results)) {
        employeesData = employeesRes.data.results;
      } else if (Array.isArray(employeesRes.data)) {
        employeesData = employeesRes.data;
      } else {
        employeesData = [];
      }

      console.log('[CreatePayroll] Processed periods:', periodsData);
      console.log('[CreatePayroll] Processed employees:', employeesData);
      console.log('[CreatePayroll] Active employees:', employeesData.filter(e => e.is_active));

      setPeriods(periodsData.filter(p => p.status === 'DRAFT'));
      setEmployees(employeesData.filter(e => e.is_active));
    } catch (error: any) {
      console.error('[CreatePayroll] Error fetching data:', error);
      console.error('[CreatePayroll] Error response:', error.response?.data);
      toast.error(`Failed to load data: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && !selectedPeriod) {
      toast.error('Please select a payroll period');
      return;
    }
    if (currentStep === 2 && selectedEmployees.length === 0) {
      toast.error('Please select at least one employee');
      return;
    }
    if (currentStep < 4) {
      setCurrentStep((currentStep + 1) as Step);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const handleSubmit = async () => {
    if (!selectedPeriod) return;

    setSubmitting(true);
    try {
      const response = await api.post('/payroll/bulk-create/', {
        period: selectedPeriod.id,
        employee_ids: selectedEmployees,
        batch_title: batchTitle || undefined
      });
      toast.success(`Successfully created ${selectedEmployees.length} payroll records`);
      // Redirect to the created batch
      const batchId = response.data.batch?.id;
      if (batchId) {
        router.push(`/dashboard/payroll/batches/${batchId}`);
      } else {
        router.push('/dashboard/payroll/batches');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create payrolls');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleEmployeeSelection = (employeeId: number) => {
    setSelectedEmployees(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedEmployees.length === filteredEmployees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filteredEmployees.map(e => e.id));
    }
  };

  const filteredEmployees = employees.filter(emp =>
    (emp.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (emp.employee_id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (emp.department_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const steps = [
    { number: 1, title: 'Select Period', icon: FiCalendar },
    { number: 2, title: 'Select Employees', icon: FiUsers },
    { number: 3, title: 'Review', icon: FiFileText },
    { number: 4, title: 'Confirm', icon: FiCheck },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-300 border-t-accent-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Create Payroll</h1>
            <p className="text-sm text-slate-500 mt-1">
              Generate payroll for your employees in a few simple steps
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard/payroll')}
            className="text-slate-600 hover:text-slate-900"
          >
            <FiX className="text-2xl" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;

              return (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isCompleted
                          ? 'bg-accent-600 text-white'
                          : isActive
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {isCompleted ? <FiCheck className="text-xl" /> : <Icon className="text-xl" />}
                    </div>
                    <p className={`text-sm font-medium mt-2 ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-4 ${isCompleted ? 'bg-accent-600' : 'bg-slate-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          {/* Step 1: Select Period */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 mb-1">Select Payroll Period</h2>
                <p className="text-sm text-slate-500">Choose the period for which you want to create payroll</p>
              </div>

              {periods.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-lg">
                  <FiCalendar className="text-4xl text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm mb-4">No draft payroll periods available</p>
                  <button
                    onClick={() => router.push('/dashboard/payroll/periods')}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    Create Period
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {periods.map((period) => (
                    <div
                      key={period.id}
                      onClick={() => setSelectedPeriod(period)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedPeriod?.id === period.id
                          ? 'border-accent-600 bg-slate-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900">{period.title}</h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                            <span>{formatDate(period.start_date)} - {formatDate(period.end_date)}</span>
                            <span>•</span>
                            <span>Payment: {formatDate(period.payment_date)}</span>
                            {period.payroll_count > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-orange-600">{period.payroll_count} payrolls already created</span>
                              </>
                            )}
                          </div>
                        </div>
                        {selectedPeriod?.id === period.id && (
                          <FiCheck className="text-2xl text-accent-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Batch Title Input */}
              {selectedPeriod && (
                <div className="mt-6">
                  <label htmlFor="batch-title" className="block text-sm font-medium text-slate-700 mb-2">
                    Batch Title (Optional)
                  </label>
                  <input
                    id="batch-title"
                    type="text"
                    value={batchTitle}
                    onChange={(e) => setBatchTitle(e.target.value)}
                    placeholder={`${selectedPeriod.title} - Batch`}
                    className="input-field"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Leave empty to auto-generate: &quot;{selectedPeriod.title} - Batch&quot;
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Employees */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 mb-1">Select Employees</h2>
                  <p className="text-sm text-slate-500">Choose which employees to include in this payroll run</p>
                </div>
                <div className="text-sm font-medium text-slate-900">
                  {selectedEmployees.length} of {filteredEmployees.length} selected
                </div>
              </div>

              {/* Search and Select All */}
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <FiSearch className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, ID, or department..."
                    className="input-field pl-10"
                  />
                </div>
                <button
                  onClick={toggleSelectAll}
                  className="btn-secondary"
                >
                  {selectedEmployees.length === filteredEmployees.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {/* Employee List */}
              <div className="max-h-[400px] overflow-y-auto border border-slate-200 rounded-lg">
                {filteredEmployees.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    No employees found
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200">
                    {filteredEmployees.map((employee) => (
                      <div
                        key={employee.id}
                        onClick={() => toggleEmployeeSelection(employee.id)}
                        className="p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedEmployees.includes(employee.id)}
                            onChange={() => {}}
                            className="w-4 h-4 text-accent-600 border-slate-300 rounded focus:ring-accent-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h4 className="font-medium text-slate-900">{employee.full_name}</h4>
                              <span className="text-sm text-slate-500">#{employee.employee_id}</span>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-slate-600">
                              <span>{employee.department_name}</span>
                              <span>•</span>
                              <span>{employee.position}</span>
                              <span>•</span>
                              <span className="font-medium">₦{parseFloat(employee.basic_salary).toLocaleString()}/month</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {currentStep === 3 && selectedPeriod && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 mb-1">Review Selection</h2>
                <p className="text-sm text-slate-500">Review the payroll details before creating</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Payroll Period</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Period:</span>
                    <span className="font-medium text-slate-900">{selectedPeriod.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Duration:</span>
                    <span className="font-medium text-slate-900">
                      {formatDate(selectedPeriod.start_date)} - {formatDate(selectedPeriod.end_date)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Payment Date:</span>
                    <span className="font-medium text-slate-900">{formatDate(selectedPeriod.payment_date)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Selected Employees ({selectedEmployees.length})</h3>
                <div className="max-h-[300px] overflow-y-auto space-y-2">
                  {employees
                    .filter(e => selectedEmployees.includes(e.id))
                    .map((employee) => (
                      <div key={employee.id} className="flex items-center justify-between text-sm bg-white p-3 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-900">{employee.full_name}</p>
                          <p className="text-slate-600">{employee.department_name} - {employee.position}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-slate-900">₦{parseFloat(employee.basic_salary).toLocaleString()}</p>
                          <p className="text-xs text-slate-500">Basic Salary</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FiFileText className="text-slate-600 text-xl mt-0.5" />
                  <div className="text-sm text-slate-700">
                    <p className="font-medium mb-1">What happens next?</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Individual payroll records will be created for each selected employee</li>
                      <li>All calculations (allowances, deductions, tax) will be automatically computed</li>
                      <li>You can review and adjust individual payrolls before approval</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Confirm */}
          {currentStep === 4 && (
            <div className="space-y-6 text-center py-8">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                <FiCheck className="text-4xl text-accent-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">Ready to Create Payroll</h2>
                <p className="text-slate-600">
                  You are about to create {selectedEmployees.length} payroll record{selectedEmployees.length !== 1 ? 's' : ''} for {selectedPeriod?.title}
                </p>
              </div>

              <div className="bg-slate-50 rounded-lg p-6 max-w-md mx-auto">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Employees:</span>
                    <span className="font-semibold text-slate-900">{selectedEmployees.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Estimated Total Salary:</span>
                    <span className="font-semibold text-slate-900">
                      ₦{employees
                        .filter(e => selectedEmployees.includes(e.id))
                        .reduce((sum, e) => sum + parseFloat(e.basic_salary), 0)
                        .toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-500 max-w-lg mx-auto">
                Click the button below to create the payroll records. This action will create draft payroll entries that you can review and modify before final approval.
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-200 mt-6">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="btn-secondary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiChevronLeft className="text-base" />
              Back
            </button>

            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                className="btn-primary inline-flex items-center gap-2"
              >
                Next
                <FiChevronRight className="text-base" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-300 border-t-accent-600"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <FiCheck className="text-base" />
                    Create Payroll
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
