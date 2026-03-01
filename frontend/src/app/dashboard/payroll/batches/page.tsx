'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import {
  FiPlus, FiEye, FiTrash2, FiSearch, FiCheck, FiDollarSign, FiRefreshCw, FiCalendar
} from 'react-icons/fi';
import type { PayrollBatch, PayrollPeriod } from '@/types';

function BatchListContent() {
  const router = useRouter();
  const { currentClient, isAuthenticated, _hasHydrated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState<PayrollBatch[]>([]);
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated()) { router.push('/login'); return; }
    if (!currentClient) { router.push('/clients'); return; }
    fetchData();
  }, [_hasHydrated, isAuthenticated, currentClient]);

  useEffect(() => {
    if (!loading) fetchBatches();
  }, [selectedPeriod, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [batchesRes, periodsRes] = await Promise.all([
        api.get('/payroll/batches/'),
        api.get('/payroll/periods/')
      ]);
      setBatches(batchesRes.data.results || batchesRes.data);
      setPeriods(periodsRes.data.results || periodsRes.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const params: any = {};
      if (selectedPeriod) params.period = selectedPeriod;
      if (statusFilter !== 'all') params.status = statusFilter.toUpperCase();
      const response = await api.get('/payroll/batches/', { params });
      setBatches(response.data.results || response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to fetch batches');
    }
  };

  const handleBatchAction = async (batchId: number, action: string) => {
    try {
      setActionLoading(batchId);
      await api.post(`/payroll/batches/${batchId}/actions/`, { action });
      toast.success(`Batch ${action.replace('_', ' ')} successfully`);
      fetchBatches();
    } catch (error: any) {
      toast.error(error.response?.data?.error || `Failed to ${action} batch`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteBatch = async (batchId: number) => {
    if (!confirm('Are you sure you want to delete this batch? All payrolls in this batch will be deleted.')) return;
    try {
      setActionLoading(batchId);
      await api.delete(`/payroll/batches/${batchId}/`);
      toast.success('Batch deleted successfully');
      fetchBatches();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete batch');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredBatches = batches.filter(batch =>
    batch.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.batch_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      DRAFT: 'bg-slate-100 text-slate-600',
      APPROVED: 'bg-blue-50 text-blue-700',
      PAID: 'bg-emerald-50 text-emerald-700'
    };
    return styles[status] || 'bg-slate-100 text-slate-600';
  };

  const getStatusDot = (status: string) => {
    const dots: Record<string, string> = {
      DRAFT: 'bg-slate-400',
      APPROVED: 'bg-blue-500',
      PAID: 'bg-emerald-500'
    };
    return dots[status] || 'bg-slate-400';
  };

  const totalBatches = batches.length;
  const draftCount = batches.filter(b => b.status === 'DRAFT').length;
  const paidCount = batches.filter(b => b.status === 'PAID').length;

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Payroll Batches</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage payroll batches and process payments</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/dashboard/payroll/periods')}
              className="btn-secondary"
            >
              <FiCalendar className="w-4 h-4" />
              Periods
            </button>
            <button
              onClick={() => router.push('/dashboard/payroll/create')}
              className="btn-primary"
            >
              <FiPlus className="w-4 h-4" />
              Create Payroll
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Total Batches</p>
            <p className="text-2xl font-semibold text-slate-900 mt-1">{totalBatches}</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Draft</p>
            <p className="text-2xl font-semibold text-slate-900 mt-1">{draftCount}</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Paid</p>
            <p className="text-2xl font-semibold text-slate-900 mt-1">{paidCount}</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-slate-200">
          {/* Filters */}
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search batches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-9"
              />
            </div>
            <select
              value={selectedPeriod || ''}
              onChange={(e) => setSelectedPeriod(e.target.value ? parseInt(e.target.value) : null)}
              className="input-field w-auto"
            >
              <option value="">All Periods</option>
              {periods.map(period => (
                <option key={period.id} value={period.id}>{period.title}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field w-auto"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          {/* Table Content */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-accent-600"></div>
            </div>
          ) : filteredBatches.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-slate-500">No batches found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Batch</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Period</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Employees</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Net Pay</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBatches.map((batch) => {
                    const isActioning = actionLoading === batch.id;
                    return (
                      <tr key={batch.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => router.push(`/dashboard/payroll/batches/${batch.id}`)}
                            className="text-left group/link"
                          >
                            <p className="text-sm font-medium text-slate-900 group-hover/link:text-accent-700 transition-colors">{batch.batch_number}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{batch.title}</p>
                          </button>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-slate-700">{batch.period_name}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(batch.status)}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(batch.status)}`} />
                            {batch.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-slate-900 text-right tabular-nums">{batch.payroll_count}</td>
                        <td className="px-5 py-3.5 text-sm text-slate-900 text-right font-medium tabular-nums">
                          ₦{parseFloat(batch.total_net_pay).toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View — always visible */}
                            <button
                              onClick={() => router.push(`/dashboard/payroll/batches/${batch.id}`)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-md transition-colors"
                              title="View Details"
                            >
                              <FiEye className="w-3.5 h-3.5" />
                              <span className="hidden lg:inline">View</span>
                            </button>

                            {/* Primary status action */}
                            {batch.status === 'DRAFT' && (
                              <button
                                onClick={() => handleBatchAction(batch.id, 'approve')}
                                disabled={isActioning}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors disabled:opacity-50"
                                title="Approve Batch"
                              >
                                {isActioning ? (
                                  <div className="w-3.5 h-3.5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                                ) : (
                                  <FiCheck className="w-3.5 h-3.5" />
                                )}
                                <span className="hidden lg:inline">Approve</span>
                              </button>
                            )}

                            {batch.status === 'APPROVED' && (
                              <button
                                onClick={() => handleBatchAction(batch.id, 'mark_paid')}
                                disabled={isActioning}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors disabled:opacity-50"
                                title="Mark as Paid"
                              >
                                {isActioning ? (
                                  <div className="w-3.5 h-3.5 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin" />
                                ) : (
                                  <FiDollarSign className="w-3.5 h-3.5" />
                                )}
                                <span className="hidden lg:inline">Pay</span>
                              </button>
                            )}

                            {/* Recalculate */}
                            <button
                              onClick={() => handleBatchAction(batch.id, 'recalculate')}
                              disabled={isActioning}
                              className="inline-flex items-center gap-1 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-50"
                              title="Recalculate"
                            >
                              <FiRefreshCw className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteBatch(batch.id)}
                              disabled={isActioning}
                              className="inline-flex items-center gap-1 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                              title="Delete Batch"
                            >
                              <FiTrash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function BatchListPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BatchListContent />
    </Suspense>
  );
}
