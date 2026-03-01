'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useForm } from 'react-hook-form';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import {
  FiArrowLeft, FiPlus, FiEdit2, FiTrash2, FiX, FiDollarSign, FiCalendar, FiDownload, FiUser
} from 'react-icons/fi';
import type { Payroll, PayrollEarning, PayrollDeduction } from '@/types';

interface EarningFormData {
  name: string;
  amount: string;
  description: string;
  is_recurring: boolean;
}

interface DeductionFormData {
  name: string;
  amount: string;
  description: string;
  is_recurring: boolean;
}

export default function PayrollDetailPage() {
  const router = useRouter();
  const params = useParams();
  const payrollId = params.id as string;

  const { currentClient, isAuthenticated, _hasHydrated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [payroll, setPayroll] = useState<Payroll | null>(null);

  // Earnings & Deductions Modals
  const [showEarningModal, setShowEarningModal] = useState(false);
  const [editingEarning, setEditingEarning] = useState<PayrollEarning | null>(null);
  const [showDeductionModal, setShowDeductionModal] = useState(false);
  const [editingDeduction, setEditingDeduction] = useState<PayrollDeduction | null>(null);

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

    fetchPayroll();
  }, [_hasHydrated, isAuthenticated, currentClient, payrollId]);

  const fetchPayroll = async () => {
    try {
      setLoading(true);
      const response = await api.get<Payroll>(`/payroll/${payrollId}/`);
      setPayroll(response.data);
    } catch (error: any) {
      toast.error('Failed to load payroll details');
      router.push('/dashboard/payroll');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEarning = async (id: number) => {
    if (!confirm('Are you sure you want to delete this earning?')) return;

    try {
      await api.delete(`/payroll/earnings/${id}/`);
      toast.success('Earning deleted successfully');
      fetchPayroll();
    } catch (error: any) {
      toast.error('Failed to delete earning');
    }
  };

  const handleDeleteDeduction = async (id: number) => {
    if (!confirm('Are you sure you want to delete this deduction?')) return;

    try {
      await api.delete(`/payroll/deductions/${id}/`);
      toast.success('Deduction deleted successfully');
      fetchPayroll();
    } catch (error: any) {
      toast.error('Failed to delete deduction');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      PAID: 'bg-purple-100 text-purple-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-slate-100 text-slate-800';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-accent-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!payroll) return null;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard/payroll')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <FiArrowLeft className="text-xl" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Payroll Details</h1>
              <p className="text-sm text-slate-500 mt-1">
                {payroll.employee_name} - {payroll.period_name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(payroll.status)}`}>
              {payroll.status}
            </span>
            <button
              onClick={() => router.push(`/dashboard/payroll/${payrollId}/payslip`)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <FiDownload className="text-base" />
              View Payslip
            </button>
            <button
              onClick={async () => {
                try {
                  const response = await api.get(`/payroll/${payrollId}/payslip/export/`, {
                    responseType: 'blob'
                  });
                  const url = window.URL.createObjectURL(new Blob([response.data]));
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', `Payslip_${payroll.employee_id_number}_${payroll.period_name?.replace(' ', '_')}.pdf`);
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                  window.URL.revokeObjectURL(url);
                  toast.success('Payslip downloaded successfully');
                } catch (error) {
                  toast.error('Failed to download payslip');
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              <FiDownload className="text-base" />
              Download PDF
            </button>
          </div>
        </div>

        {/* Employee & Period Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-accent-50 rounded-lg">
                <FiUser className="text-2xl text-accent-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Employee</p>
                <p className="text-lg font-semibold text-slate-900">{payroll.employee_name}</p>
              </div>
            </div>
            <div className="text-sm text-slate-600">
              <p>Employee ID: #{payroll.employee_id_number}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <FiCalendar className="text-2xl text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Payroll Period</p>
                <p className="text-lg font-semibold text-slate-900">{payroll.period_name}</p>
              </div>
            </div>
            {payroll.payment_date && (
              <div className="text-sm text-slate-600">
                <p>Payment Date: {formatDate(payroll.payment_date)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Earnings Section */}
        <div className="bg-white rounded-lg border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Earnings</h2>
              {payroll.status === 'PENDING' && (
                <button
                  onClick={() => {
                    setEditingEarning(null);
                    setShowEarningModal(true);
                  }}
                  className="btn-primary inline-flex items-center gap-2 text-sm"
                >
                  <FiPlus className="text-sm" />
                  Add Earning
                </button>
              )}
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Basic Salary */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <p className="font-medium text-slate-900">Basic Salary</p>
                <p className="text-sm text-slate-500">Base monthly compensation</p>
              </div>
              <p className="text-lg font-semibold text-slate-900">
                ₦{parseFloat(payroll.basic_salary).toLocaleString()}
              </p>
            </div>

            {/* Allowances */}
            {parseFloat(payroll.total_allowances) > 0 && (
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <p className="font-medium text-slate-900">Total Allowances</p>
                  <p className="text-sm text-slate-500">Employee-specific allowances</p>
                </div>
                <p className="text-lg font-semibold text-slate-900">
                  ₦{parseFloat(payroll.total_allowances).toLocaleString()}
                </p>
              </div>
            )}

            {/* Statutory Earnings */}
            {payroll.statutory_earnings_breakdown && payroll.statutory_earnings_breakdown.length > 0 ? (
              <>
                {payroll.statutory_earnings_breakdown.map((earning) => (
                  <div key={earning.id} className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900">{earning.name}</p>
                        {earning.is_taxable && (
                          <span className="text-xs px-2 py-0.5 bg-accent-100 text-accent-800 rounded-full">
                            Taxable
                          </span>
                        )}
                      </div>
                      {earning.description && (
                        <p className="text-sm text-slate-500">{earning.description}</p>
                      )}
                    </div>
                    <p className="text-lg font-semibold text-slate-900">
                      ₦{parseFloat(earning.amount).toLocaleString()}
                    </p>
                  </div>
                ))}
              </>
            ) : parseFloat(payroll.total_statutory_earnings) > 0 && (
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <p className="font-medium text-slate-900">Statutory Earnings</p>
                  <p className="text-sm text-slate-500">Housing, transport, etc.</p>
                </div>
                <p className="text-lg font-semibold text-slate-900">
                  ₦{parseFloat(payroll.total_statutory_earnings).toLocaleString()}
                </p>
              </div>
            )}

            {/* Additional Earnings */}
            {payroll.earnings && payroll.earnings.length > 0 && (
              <>
                {payroll.earnings.map((earning) => (
                  <div key={earning.id} className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900">{earning.name}</p>
                        {earning.is_recurring && (
                          <span className="text-xs px-2 py-0.5 bg-accent-100 text-accent-800 rounded-full">
                            Recurring
                          </span>
                        )}
                      </div>
                      {earning.description && (
                        <p className="text-sm text-slate-500">{earning.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-lg font-semibold text-slate-900">
                        ₦{parseFloat(earning.amount).toLocaleString()}
                      </p>
                      {payroll.status === 'PENDING' && (
                        <button
                          onClick={() => handleDeleteEarning(earning.id)}
                          className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <FiTrash2 className="text-sm" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Gross Pay */}
            <div className="flex items-center justify-between pt-3 bg-accent-50 -mx-6 px-6 py-4 rounded-b-lg">
              <p className="text-lg font-bold text-slate-900">Gross Pay</p>
              <p className="text-2xl font-bold text-accent-600">
                ₦{parseFloat(payroll.gross_pay).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Deductions Section */}
        <div className="bg-white rounded-lg border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Deductions</h2>
              {payroll.status === 'PENDING' && (
                <button
                  onClick={() => {
                    setEditingDeduction(null);
                    setShowDeductionModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  <FiPlus className="text-sm" />
                  Add Deduction
                </button>
              )}
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Pension */}
            {parseFloat(payroll.pension) > 0 && (
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <p className="font-medium text-slate-900">Pension</p>
                  <p className="text-sm text-slate-500">Retirement contribution</p>
                </div>
                <p className="text-lg font-semibold text-red-600">
                  ₦{parseFloat(payroll.pension).toLocaleString()}
                </p>
              </div>
            )}

            {/* NHF */}
            {parseFloat(payroll.nhf) > 0 && (
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <p className="font-medium text-slate-900">NHF</p>
                  <p className="text-sm text-slate-500">National Housing Fund</p>
                </div>
                <p className="text-lg font-semibold text-red-600">
                  ₦{parseFloat(payroll.nhf).toLocaleString()}
                </p>
              </div>
            )}

            {/* Tax */}
            {parseFloat(payroll.tax) > 0 && (
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <p className="font-medium text-slate-900">Income Tax (PAYE)</p>
                  <p className="text-sm text-slate-500">Tax deduction</p>
                </div>
                <p className="text-lg font-semibold text-red-600">
                  ₦{parseFloat(payroll.tax).toLocaleString()}
                </p>
              </div>
            )}

            {/* Other Statutory Deductions */}
            {payroll.statutory_deductions_breakdown && payroll.statutory_deductions_breakdown.length > 0 ? (
              <>
                {payroll.statutory_deductions_breakdown.map((deduction) => (
                  <div key={deduction.id} className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{deduction.name}</p>
                      {deduction.description && (
                        <p className="text-sm text-slate-500">{deduction.description}</p>
                      )}
                    </div>
                    <p className="text-lg font-semibold text-red-600">
                      ₦{parseFloat(deduction.amount).toLocaleString()}
                    </p>
                  </div>
                ))}
              </>
            ) : parseFloat(payroll.total_statutory_deductions) > 0 && (
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <p className="font-medium text-slate-900">Other Statutory Deductions</p>
                  <p className="text-sm text-slate-500">Additional statutory items</p>
                </div>
                <p className="text-lg font-semibold text-red-600">
                  ₦{parseFloat(payroll.total_statutory_deductions).toLocaleString()}
                </p>
              </div>
            )}

            {/* Additional Deductions */}
            {payroll.deductions && payroll.deductions.length > 0 && (
              <>
                {payroll.deductions.map((deduction) => (
                  <div key={deduction.id} className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900">{deduction.name}</p>
                        {deduction.is_recurring && (
                          <span className="text-xs px-2 py-0.5 bg-red-100 text-red-800 rounded-full">
                            Recurring
                          </span>
                        )}
                      </div>
                      {deduction.description && (
                        <p className="text-sm text-slate-500">{deduction.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-lg font-semibold text-red-600">
                        ₦{parseFloat(deduction.amount).toLocaleString()}
                      </p>
                      {payroll.status === 'PENDING' && (
                        <button
                          onClick={() => handleDeleteDeduction(deduction.id)}
                          className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <FiTrash2 className="text-sm" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Total Deductions */}
            <div className="flex items-center justify-between pt-3 bg-red-50 -mx-6 px-6 py-4 rounded-b-lg">
              <p className="text-lg font-bold text-slate-900">Total Deductions</p>
              <p className="text-2xl font-bold text-red-600">
                ₦{parseFloat(payroll.total_deductions).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Net Pay */}
        <div className="bg-white rounded-lg border-l-4 border-l-accent-600 border border-slate-200 p-6">
          <p className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4">Take Home Pay</p>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">
                  ₦{parseFloat(payroll.net_pay).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-2">
                Net amount after all deductions
              </p>
            </div>
          </div>
        </div>

        {/* Notes */}
        {payroll.notes && (
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">Notes</h3>
            <p className="text-slate-700">{payroll.notes}</p>
          </div>
        )}
      </div>

      {/* Earning Modal */}
      {showEarningModal && (
        <EarningModal
          payrollId={parseInt(payrollId)}
          earning={editingEarning}
          onClose={() => {
            setShowEarningModal(false);
            setEditingEarning(null);
          }}
          onSuccess={() => {
            setShowEarningModal(false);
            setEditingEarning(null);
            fetchPayroll();
          }}
        />
      )}

      {/* Deduction Modal */}
      {showDeductionModal && (
        <DeductionModal
          payrollId={parseInt(payrollId)}
          deduction={editingDeduction}
          onClose={() => {
            setShowDeductionModal(false);
            setEditingDeduction(null);
          }}
          onSuccess={() => {
            setShowDeductionModal(false);
            setEditingDeduction(null);
            fetchPayroll();
          }}
        />
      )}
    </DashboardLayout>
  );
}

// Earning Modal Component
interface EarningModalProps {
  payrollId: number;
  earning: PayrollEarning | null;
  onClose: () => void;
  onSuccess: () => void;
}

function EarningModal({ payrollId, earning, onClose, onSuccess }: EarningModalProps) {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<EarningFormData>({
    defaultValues: {
      name: earning?.name || '',
      amount: earning?.amount || '',
      description: earning?.description || '',
      is_recurring: earning?.is_recurring || false,
    }
  });

  const onSubmit = async (data: EarningFormData) => {
    setSaving(true);
    try {
      if (earning) {
        await api.put(`/payroll/earnings/${earning.id}/`, { ...data, payroll: payrollId });
        toast.success('Earning updated successfully');
      } else {
        await api.post('/payroll/earnings/', { ...data, payroll: payrollId });
        toast.success('Earning added successfully');
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save earning');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-elevated max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900">
            {earning ? 'Edit Earning' : 'Add Earning'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <FiX className="text-xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('name', { required: 'Name is required' })}
              className="input-field"
              placeholder="e.g., Bonus, Overtime"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-slate-500">₦</span>
              <input
                type="number"
                step="0.01"
                {...register('amount', {
                  required: 'Amount is required',
                  min: { value: 0, message: 'Amount must be positive' }
                })}
                className="input-field pl-8"
                placeholder="0.00"
              />
            </div>
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              className="input-field resize-none"
              placeholder="Optional description"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('is_recurring')}
                className="w-4 h-4 text-accent-600 border-slate-300 rounded focus:ring-accent-500"
              />
              <span className="text-sm font-medium text-slate-700">Recurring earning</span>
            </label>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {saving ? 'Saving...' : earning ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Deduction Modal Component
interface DeductionModalProps {
  payrollId: number;
  deduction: PayrollDeduction | null;
  onClose: () => void;
  onSuccess: () => void;
}

function DeductionModal({ payrollId, deduction, onClose, onSuccess }: DeductionModalProps) {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<DeductionFormData>({
    defaultValues: {
      name: deduction?.name || '',
      amount: deduction?.amount || '',
      description: deduction?.description || '',
      is_recurring: deduction?.is_recurring || false,
    }
  });

  const onSubmit = async (data: DeductionFormData) => {
    setSaving(true);
    try {
      if (deduction) {
        await api.put(`/payroll/deductions/${deduction.id}/`, { ...data, payroll: payrollId });
        toast.success('Deduction updated successfully');
      } else {
        await api.post('/payroll/deductions/', { ...data, payroll: payrollId });
        toast.success('Deduction added successfully');
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save deduction');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-elevated max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900">
            {deduction ? 'Edit Deduction' : 'Add Deduction'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <FiX className="text-xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('name', { required: 'Name is required' })}
              className="input-field"
              placeholder="e.g., Loan, Advance"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-slate-500">₦</span>
              <input
                type="number"
                step="0.01"
                {...register('amount', {
                  required: 'Amount is required',
                  min: { value: 0, message: 'Amount must be positive' }
                })}
                className="input-field pl-8"
                placeholder="0.00"
              />
            </div>
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              className="input-field resize-none"
              placeholder="Optional description"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('is_recurring')}
                className="w-4 h-4 text-accent-600 border-slate-300 rounded focus:ring-accent-500"
              />
              <span className="text-sm font-medium text-slate-700">Recurring deduction</span>
            </label>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : deduction ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
