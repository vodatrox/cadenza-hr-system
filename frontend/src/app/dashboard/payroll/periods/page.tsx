'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useForm } from 'react-hook-form';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import {
  FiCalendar, FiPlus, FiEdit2, FiTrash2, FiX, FiDollarSign, FiUsers, FiClock, FiCheck
} from 'react-icons/fi';
import type { PayrollPeriod } from '@/types';

interface PeriodFormData {
  title: string;
  period_type: 'MONTHLY' | 'WEEKLY' | 'BI_WEEKLY';
  start_date: string;
  end_date: string;
  payment_date: string;
  notes: string;
}

export default function PayrollPeriodsPage() {
  const router = useRouter();
  const { currentClient, isAuthenticated, _hasHydrated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<PayrollPeriod | null>(null);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated()) { router.push('/login'); return; }
    if (!currentClient) { router.push('/clients'); return; }
    fetchPeriods();
  }, [_hasHydrated, isAuthenticated, currentClient]);

  const fetchPeriods = async () => {
    try {
      setLoading(true);
      const response = await api.get<any>('/payroll/periods/');
      let periodsData: PayrollPeriod[];
      if (response.data.results && Array.isArray(response.data.results)) {
        periodsData = response.data.results;
      } else if (Array.isArray(response.data)) {
        periodsData = response.data;
      } else {
        periodsData = [];
      }
      setPeriods(periodsData);
    } catch (error: any) {
      toast.error('Failed to load payroll periods');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePeriod = async (id: number) => {
    if (!confirm('Are you sure you want to delete this payroll period? This action cannot be undone.')) return;
    try {
      await api.delete(`/payroll/periods/${id}/`);
      toast.success('Payroll period deleted successfully');
      fetchPeriods();
    } catch (error: any) {
      toast.error('Failed to delete payroll period');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      DRAFT: 'bg-slate-100 text-slate-600',
      PROCESSING: 'bg-blue-50 text-blue-700',
      APPROVED: 'bg-emerald-50 text-emerald-700',
      PAID: 'bg-violet-50 text-violet-700',
      REVERSED: 'bg-red-50 text-red-700',
    };
    return styles[status] || 'bg-slate-100 text-slate-600';
  };

  const getStatusDot = (status: string) => {
    const dots: Record<string, string> = {
      DRAFT: 'bg-slate-400',
      PROCESSING: 'bg-blue-500',
      APPROVED: 'bg-emerald-500',
      PAID: 'bg-violet-500',
      REVERSED: 'bg-red-500',
    };
    return dots[status] || 'bg-slate-400';
  };

  const getPeriodTypeLabel = (type: string) => {
    const labels: Record<string, string> = { MONTHLY: 'Monthly', WEEKLY: 'Weekly', BI_WEEKLY: 'Bi-Weekly' };
    return labels[type] || type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
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

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Payroll Periods</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage payroll periods and payment cycles</p>
          </div>
          <button
            onClick={() => { setEditingPeriod(null); setShowPeriodModal(true); }}
            className="btn-primary"
          >
            <FiPlus className="w-4 h-4" />
            Create Period
          </button>
        </div>

        {/* Periods List */}
        {periods.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-100 rounded-full mb-3">
              <FiCalendar className="w-5 h-5 text-slate-400" />
            </div>
            <h3 className="text-sm font-medium text-slate-900 mb-1">No payroll periods yet</h3>
            <p className="text-sm text-slate-500 mb-4">Get started by creating your first payroll period</p>
            <button
              onClick={() => { setEditingPeriod(null); setShowPeriodModal(true); }}
              className="btn-primary"
            >
              <FiPlus className="w-4 h-4" />
              Create First Period
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {periods.map((period) => (
              <div key={period.id} className="bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-slate-900">{period.title}</h3>
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(period.status)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(period.status)}`} />
                          {period.status}
                        </span>
                        <span className="badge badge-neutral text-[11px]">{getPeriodTypeLabel(period.period_type)}</span>
                      </div>
                      {period.notes && <p className="text-xs text-slate-500">{period.notes}</p>}
                    </div>
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => { setEditingPeriod(period); setShowPeriodModal(true); }}
                        className="p-1.5 text-slate-400 hover:text-accent-600 hover:bg-accent-50 rounded-lg transition-colors"
                        disabled={period.status === 'PAID'}
                      >
                        <FiEdit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePeriod(period.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        disabled={period.status !== 'DRAFT'}
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Period Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <FiCalendar className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-[11px] text-slate-500 uppercase tracking-wider">Period</p>
                        <p className="text-sm text-slate-900">{formatDate(period.start_date)} - {formatDate(period.end_date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiClock className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-[11px] text-slate-500 uppercase tracking-wider">Payment</p>
                        <p className="text-sm text-slate-900">{formatDate(period.payment_date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiUsers className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-[11px] text-slate-500 uppercase tracking-wider">Employees</p>
                        <p className="text-sm text-slate-900">{period.payroll_count || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiDollarSign className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-[11px] text-slate-500 uppercase tracking-wider">Net Pay</p>
                        <p className="text-sm font-medium text-slate-900">₦{parseFloat(period.total_net_pay || '0').toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="border-t border-slate-100 pt-3">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-0.5">Gross Pay</p>
                        <p className="text-sm font-semibold text-slate-900">₦{parseFloat(period.total_gross_pay || '0').toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-0.5">Deductions</p>
                        <p className="text-sm font-semibold text-slate-900">₦{parseFloat(period.total_deductions || '0').toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-0.5">Tax</p>
                        <p className="text-sm font-semibold text-slate-900">₦{parseFloat(period.total_tax || '0').toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {period.status === 'DRAFT' && period.payroll_count > 0 && (
                    <div className="border-t border-slate-100 mt-3 pt-3">
                      <button
                        onClick={() => router.push(`/dashboard/payroll?period=${period.id}`)}
                        className="btn-primary w-full"
                      >
                        <FiCheck className="w-4 h-4" />
                        View Payrolls
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Period Modal */}
      {showPeriodModal && (
        <PeriodModal
          period={editingPeriod}
          onClose={() => { setShowPeriodModal(false); setEditingPeriod(null); }}
          onSuccess={() => { setShowPeriodModal(false); setEditingPeriod(null); fetchPeriods(); }}
        />
      )}
    </DashboardLayout>
  );
}

interface PeriodModalProps {
  period: PayrollPeriod | null;
  onClose: () => void;
  onSuccess: () => void;
}

function PeriodModal({ period, onClose, onSuccess }: PeriodModalProps) {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<PeriodFormData>({
    defaultValues: {
      title: period?.title || '',
      period_type: period?.period_type || 'MONTHLY',
      start_date: period?.start_date || '',
      end_date: period?.end_date || '',
      payment_date: period?.payment_date || '',
      notes: period?.notes || '',
    }
  });

  const onSubmit = async (data: PeriodFormData) => {
    setSaving(true);
    try {
      if (period) {
        await api.put(`/payroll/periods/${period.id}/`, data);
        toast.success('Payroll period updated successfully');
      } else {
        await api.post('/payroll/periods/', { ...data, status: 'DRAFT' });
        toast.success('Payroll period created successfully');
      }
      onSuccess();
    } catch (error: any) {
      const errorMessage = error.response?.data?.end_date?.[0] || error.response?.data?.message || 'Failed to save payroll period';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-elevated max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white">
          <h3 className="text-base font-semibold text-slate-900">
            {period ? 'Edit Payroll Period' : 'Create Payroll Period'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Period Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('title', { required: 'Title is required' })}
              className="input-field"
              placeholder="e.g., January 2024 Payroll"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Period Type <span className="text-red-500">*</span>
            </label>
            <select {...register('period_type', { required: 'Period type is required' })} className="input-field">
              <option value="MONTHLY">Monthly</option>
              <option value="WEEKLY">Weekly</option>
              <option value="BI_WEEKLY">Bi-Weekly</option>
            </select>
            {errors.period_type && <p className="text-red-500 text-xs mt-1">{errors.period_type.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input type="date" {...register('start_date', { required: 'Start date is required' })} className="input-field" />
              {errors.start_date && <p className="text-red-500 text-xs mt-1">{errors.start_date.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                End Date <span className="text-red-500">*</span>
              </label>
              <input type="date" {...register('end_date', { required: 'End date is required' })} className="input-field" />
              {errors.end_date && <p className="text-red-500 text-xs mt-1">{errors.end_date.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Payment Date <span className="text-red-500">*</span>
            </label>
            <input type="date" {...register('payment_date', { required: 'Payment date is required' })} className="input-field" />
            {errors.payment_date && <p className="text-red-500 text-xs mt-1">{errors.payment_date.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
            <textarea {...register('notes')} rows={3} className="input-field resize-none" placeholder="Optional notes about this payroll period" />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                  Saving...
                </span>
              ) : (
                period ? 'Update Period' : 'Create Period'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
