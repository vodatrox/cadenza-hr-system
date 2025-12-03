'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import {
  FiArrowLeft, FiEye, FiCheck, FiDollarSign, FiRefreshCw, FiDownload, FiEdit2
} from 'react-icons/fi';
import type { PayrollBatch, Payroll } from '@/types';

function BatchDetailContent() {
  const router = useRouter();
  const params = useParams();
  const batchId = params.id as string;
  const { currentClient, isAuthenticated, _hasHydrated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [batch, setBatch] = useState<PayrollBatch | null>(null);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);

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
  }, [_hasHydrated, isAuthenticated, currentClient, batchId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [batchRes, payrollsRes] = await Promise.all([
        api.get(`/payroll/batches/${batchId}/`),
        api.get(`/payroll/?batch=${batchId}`)
      ]);
      setBatch(batchRes.data);
      setPayrolls(payrollsRes.data.results || payrollsRes.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to fetch batch details');
      router.push('/dashboard/payroll/batches');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchAction = async (action: string) => {
    try {
      setLoading(true);
      await api.post(`/payroll/batches/${batchId}/actions/`, { action });
      toast.success(`Batch ${action} successfully`);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || `Failed to ${action} batch`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      APPROVED: 'bg-blue-100 text-blue-800',
      PAID: 'bg-green-100 text-green-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!batch) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard/payroll/batches')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <FiArrowLeft className="mr-2" />
            Back to Batches
          </button>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{batch.title}</h1>
              <p className="text-gray-600 mt-1">{batch.batch_number}</p>
            </div>
            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusBadge(batch.status)}`}>
              {batch.status}
            </span>
          </div>
        </div>

        {/* Batch Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm text-gray-600 mb-1">Total Employees</p>
            <p className="text-2xl font-bold text-gray-900">{batch.payroll_count}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm text-gray-600 mb-1">Total Gross Pay</p>
            <p className="text-2xl font-bold text-gray-900">
              ₦{parseFloat(batch.total_gross_pay).toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm text-gray-600 mb-1">Total Deductions</p>
            <p className="text-2xl font-bold text-gray-900">
              ₦{parseFloat(batch.total_deductions).toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm text-gray-600 mb-1">Total Net Pay</p>
            <p className="text-2xl font-bold text-green-600">
              ₦{parseFloat(batch.total_net_pay).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Batch Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Batch Actions</h2>
          <div className="flex flex-wrap gap-3">
            {batch.status === 'DRAFT' && (
              <button
                onClick={() => handleBatchAction('approve')}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <FiCheck className="mr-2" />
                Approve Batch
              </button>
            )}

            {batch.status === 'APPROVED' && (
              <button
                onClick={() => handleBatchAction('mark_paid')}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <FiDollarSign className="mr-2" />
                Mark as Paid
              </button>
            )}

            <button
              onClick={() => handleBatchAction('recalculate')}
              className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              <FiRefreshCw className="mr-2" />
              Recalculate All
            </button>

            <button
              onClick={() => toast.info('Export feature coming soon')}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <FiDownload className="mr-2" />
              Export to CSV
            </button>
          </div>

          {batch.description && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Description</p>
              <p className="text-gray-900 mt-1">{batch.description}</p>
            </div>
          )}
        </div>

        {/* Payrolls List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Payrolls ({payrolls.length})</h2>
          </div>

          {payrolls.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">No payrolls in this batch</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gross Pay
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deductions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net Pay
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payrolls.map((payroll) => (
                  <tr key={payroll.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{payroll.employee_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{payroll.employee_id_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(payroll.status)}`}>
                        {payroll.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₦{parseFloat(payroll.gross_pay).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₦{parseFloat(payroll.total_deductions).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      ₦{parseFloat(payroll.net_pay).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => router.push(`/dashboard/payroll/${payroll.id}`)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <FiEye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function BatchDetailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BatchDetailContent />
    </Suspense>
  );
}
