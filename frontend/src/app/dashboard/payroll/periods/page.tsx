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

    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    if (!currentClient) {
      router.push('/clients');
      return;
    }

    fetchPeriods();
  }, [_hasHydrated, isAuthenticated, currentClient]);

  const fetchPeriods = async () => {
    try {
      setLoading(true);
      const response = await api.get<any>('/payroll/periods/');

      // Handle both paginated and non-paginated responses
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

  const getStatusColor = (status: string) => {
    const colors = {
      DRAFT: 'bg-gray-100 text-gray-800',
      PROCESSING: 'bg-blue-100 text-blue-800',
      APPROVED: 'bg-green-100 text-green-800',
      PAID: 'bg-purple-100 text-purple-800',
      REVERSED: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPeriodTypeLabel = (type: string) => {
    const labels = {
      MONTHLY: 'Monthly',
      WEEKLY: 'Weekly',
      BI_WEEKLY: 'Bi-Weekly',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Payroll Periods</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage payroll periods and payment cycles
            </p>
          </div>
          <button
            onClick={() => {
              setEditingPeriod(null);
              setShowPeriodModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="text-base" />
            Create Period
          </button>
        </div>

        {/* Periods List */}
        {periods.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="text-center py-16">
              <FiCalendar className="text-5xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payroll periods yet</h3>
              <p className="text-sm text-gray-500 mb-6">
                Get started by creating your first payroll period
              </p>
              <button
                onClick={() => {
                  setEditingPeriod(null);
                  setShowPeriodModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiPlus className="text-base" />
                Create First Period
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {periods.map((period) => (
              <div
                key={period.id}
                className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{period.title}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(period.status)}`}>
                          {period.status}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {getPeriodTypeLabel(period.period_type)}
                        </span>
                      </div>
                      {period.notes && (
                        <p className="text-sm text-gray-600">{period.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingPeriod(period);
                          setShowPeriodModal(true);
                        }}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        disabled={period.status === 'PAID'}
                      >
                        <FiEdit2 className="text-base" />
                      </button>
                      <button
                        onClick={() => handleDeletePeriod(period.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        disabled={period.status !== 'DRAFT'}
                      >
                        <FiTrash2 className="text-base" />
                      </button>
                    </div>
                  </div>

                  {/* Period Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <FiCalendar className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Period Range</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(period.start_date)} - {formatDate(period.end_date)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-50 rounded-lg">
                        <FiClock className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Payment Date</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(period.payment_date)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-50 rounded-lg">
                        <FiUsers className="text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Employees</p>
                        <p className="text-sm font-medium text-gray-900">
                          {period.payroll_count || 0}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-yellow-50 rounded-lg">
                        <FiDollarSign className="text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total Net Pay</p>
                        <p className="text-sm font-medium text-gray-900">
                          ₦{parseFloat(period.total_net_pay || '0').toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Gross Pay</p>
                        <p className="text-base font-semibold text-gray-900">
                          ₦{parseFloat(period.total_gross_pay || '0').toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Deductions</p>
                        <p className="text-base font-semibold text-red-600">
                          ₦{parseFloat(period.total_deductions || '0').toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Tax</p>
                        <p className="text-base font-semibold text-orange-600">
                          ₦{parseFloat(period.total_tax || '0').toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {period.status === 'DRAFT' && period.payroll_count > 0 && (
                    <div className="border-t border-gray-200 mt-4 pt-4">
                      <button
                        onClick={() => router.push(`/dashboard/payroll?period=${period.id}`)}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <FiCheck className="text-base" />
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
          onClose={() => {
            setShowPeriodModal(false);
            setEditingPeriod(null);
          }}
          onSuccess={() => {
            setShowPeriodModal(false);
            setEditingPeriod(null);
            fetchPeriods();
          }}
        />
      )}
    </DashboardLayout>
  );
}

// Period Modal Component
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
        // Update existing period
        await api.put(`/payroll/periods/${period.id}/`, data);
        toast.success('Payroll period updated successfully');
      } else {
        // Create new period with DRAFT status
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-gray-900">
            {period ? 'Edit Payroll Period' : 'Create Payroll Period'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Period Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('title', { required: 'Title is required' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., January 2024 Payroll"
            />
            {errors.title && (
              <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Period Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Period Type <span className="text-red-500">*</span>
            </label>
            <select
              {...register('period_type', { required: 'Period type is required' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="MONTHLY">Monthly</option>
              <option value="WEEKLY">Weekly</option>
              <option value="BI_WEEKLY">Bi-Weekly</option>
            </select>
            {errors.period_type && (
              <p className="text-red-500 text-xs mt-1">{errors.period_type.message}</p>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register('start_date', { required: 'Start date is required' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.start_date && (
                <p className="text-red-500 text-xs mt-1">{errors.start_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register('end_date', { required: 'End date is required' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.end_date && (
                <p className="text-red-500 text-xs mt-1">{errors.end_date.message}</p>
              )}
            </div>
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              {...register('payment_date', { required: 'Payment date is required' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.payment_date && (
              <p className="text-red-500 text-xs mt-1">{errors.payment_date.message}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Optional notes about this payroll period"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
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
