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

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      const response = await api.get(`/payroll/batches/${batchId}/export/${format}/`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Payroll_Batch_${batch?.batch_number}.${format === 'excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Batch exported to ${format.toUpperCase()} successfully`);
    } catch (error: any) {
      toast.error(`Failed to export batch to ${format.toUpperCase()}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      DRAFT: 'bg-slate-100 text-slate-600',
      APPROVED: 'bg-blue-50 text-blue-700',
      PAID: 'bg-emerald-50 text-emerald-700',
      PENDING: 'bg-amber-50 text-amber-700',
      CANCELLED: 'bg-red-50 text-red-700'
    };
    return styles[status] || 'bg-slate-100 text-slate-600';
  };

  const getStatusDot = (status: string) => {
    const dots: Record<string, string> = {
      DRAFT: 'bg-slate-400',
      APPROVED: 'bg-blue-500',
      PAID: 'bg-emerald-500',
      PENDING: 'bg-amber-500',
      CANCELLED: 'bg-red-500'
    };
    return dots[status] || 'bg-slate-400';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-300 border-t-accent-600"></div>
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
            className="flex items-center text-slate-600 hover:text-slate-900 mb-4"
          >
            <FiArrowLeft className="mr-2" />
            Back to Batches
          </button>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">{batch.title}</h1>
              <p className="text-slate-600 mt-1">{batch.batch_number}</p>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(batch.status)}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(batch.status)}`}></span>
              {batch.status}
            </span>
          </div>
        </div>

        {/* Batch Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <p className="text-sm text-slate-600 mb-1">Total Employees</p>
            <p className="text-2xl font-bold text-slate-900">{batch.payroll_count}</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <p className="text-sm text-slate-600 mb-1">Total Gross Pay</p>
            <p className="text-2xl font-bold text-slate-900">
              ₦{parseFloat(batch.total_gross_pay).toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <p className="text-sm text-slate-600 mb-1">Total Deductions</p>
            <p className="text-2xl font-bold text-slate-900">
              ₦{parseFloat(batch.total_deductions).toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <p className="text-sm text-slate-600 mb-1">Total Net Pay</p>
            <p className="text-2xl font-bold text-emerald-600">
              ₦{parseFloat(batch.total_net_pay).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Batch Actions */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Batch Actions</h2>
          <div className="flex flex-wrap gap-3">
            {batch.status === 'DRAFT' && (
              <button
                onClick={() => handleBatchAction('approve')}
                className="btn-primary flex items-center px-4 py-2 rounded-lg"
              >
                <FiCheck className="mr-2" />
                Approve Batch
              </button>
            )}

            {batch.status === 'APPROVED' && (
              <button
                onClick={() => handleBatchAction('mark_paid')}
                className="btn-primary flex items-center px-4 py-2 rounded-lg"
              >
                <FiDollarSign className="mr-2" />
                Mark as Paid
              </button>
            )}

            <button
              onClick={() => handleBatchAction('recalculate')}
              className="btn-secondary flex items-center px-4 py-2 rounded-lg"
            >
              <FiRefreshCw className="mr-2" />
              Recalculate All
            </button>

            <button
              onClick={() => handleExport('excel')}
              className="btn-secondary flex items-center px-4 py-2 rounded-lg"
            >
              <FiDownload className="mr-2" />
              Export to Excel
            </button>

            <button
              onClick={() => handleExport('pdf')}
              className="btn-secondary flex items-center px-4 py-2 rounded-lg"
            >
              <FiDownload className="mr-2" />
              Export to PDF
            </button>
          </div>

          {batch.description && (
            <div className="mt-4 p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600">Description</p>
              <p className="text-slate-900 mt-1">{batch.description}</p>
            </div>
          )}
        </div>

        {/* Payrolls List */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Payrolls ({payrolls.length})</h2>
          </div>

          {payrolls.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-500">No payrolls in this batch</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-100">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Employee ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Gross Pay
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Deductions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Net Pay
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {payrolls.map((payroll) => (
                  <tr key={payroll.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{payroll.employee_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{payroll.employee_id_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(payroll.status)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(payroll.status)}`}></span>
                        {payroll.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      ₦{parseFloat(payroll.gross_pay).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      ₦{parseFloat(payroll.total_deductions).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-600">
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
