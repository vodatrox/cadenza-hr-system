'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import {
  FiPlus, FiEye, FiEdit2, FiTrash2, FiFilter, FiSearch, FiCheck, FiDollarSign, FiRefreshCw, FiCalendar
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
  const [showActions, setShowActions] = useState<number | null>(null);

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

  useEffect(() => {
    if (!loading) {
      fetchBatches();
    }
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
      setLoading(true);
      await api.post(`/payroll/batches/${batchId}/actions/`, { action });
      toast.success(`Batch ${action} successfully`);
      fetchBatches();
    } catch (error: any) {
      toast.error(error.response?.data?.error || `Failed to ${action} batch`);
    } finally {
      setLoading(false);
      setShowActions(null);
    }
  };

  const handleDeleteBatch = async (batchId: number) => {
    if (!confirm('Are you sure you want to delete this batch? All payrolls in this batch will be deleted.')) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/payroll/batches/${batchId}/`);
      toast.success('Batch deleted successfully');
      fetchBatches();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete batch');
    } finally {
      setLoading(false);
    }
  };

  const filteredBatches = batches.filter(batch =>
    batch.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.batch_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      APPROVED: 'bg-blue-100 text-blue-800',
      PAID: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payroll Batches</h1>
            <p className="text-gray-600 mt-1">Manage payroll batches and process payments</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard/payroll/periods')}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <FiCalendar className="mr-2" />
              Manage Periods
            </button>
            <button
              onClick={() => router.push('/dashboard/payroll/create')}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <FiPlus className="mr-2" />
              Create Payroll
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search batches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Period Filter */}
            <select
              value={selectedPeriod || ''}
              onChange={(e) => setSelectedPeriod(e.target.value ? parseInt(e.target.value) : null)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Periods</option>
              {periods.map(period => (
                <option key={period.id} value={period.id}>{period.title}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>

        {/* Batches List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500">No batches found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Batch Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employees
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Net Pay
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBatches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{batch.batch_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{batch.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{batch.period_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(batch.status)}`}>
                        {batch.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {batch.payroll_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₦{parseFloat(batch.total_net_pay).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2 relative">
                        <button
                          onClick={() => router.push(`/dashboard/payroll/batches/${batch.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <FiEye className="w-5 h-5" />
                        </button>

                        {batch.status === 'DRAFT' && (
                          <button
                            onClick={() => handleBatchAction(batch.id, 'approve')}
                            className="text-green-600 hover:text-green-900"
                            title="Approve Batch"
                          >
                            <FiCheck className="w-5 h-5" />
                          </button>
                        )}

                        {batch.status === 'APPROVED' && (
                          <button
                            onClick={() => handleBatchAction(batch.id, 'mark_paid')}
                            className="text-purple-600 hover:text-purple-900"
                            title="Mark as Paid"
                          >
                            <FiDollarSign className="w-5 h-5" />
                          </button>
                        )}

                        <button
                          onClick={() => handleBatchAction(batch.id, 'recalculate')}
                          className="text-orange-600 hover:text-orange-900"
                          title="Recalculate"
                        >
                          <FiRefreshCw className="w-5 h-5" />
                        </button>

                        <button
                          onClick={() => handleDeleteBatch(batch.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Batch"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
