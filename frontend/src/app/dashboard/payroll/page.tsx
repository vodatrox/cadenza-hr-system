'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import type { PayrollPeriod, Payroll } from '@/types';
import { FiPlus, FiDollarSign, FiCalendar } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

export default function PayrollPage() {
  const router = useRouter();
  const { currentClient, isAuthenticated, _hasHydrated } = useAuthStore();
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for hydration before checking auth
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
  }, [_hasHydrated, isAuthenticated, currentClient, router]);

  const fetchPeriods = async () => {
    try {
      const response = await api.get<any>('/payroll/periods/');
      console.log('[PayrollPage] Periods API response:', response.data);

      // Handle both paginated and non-paginated responses
      let periodsData: PayrollPeriod[];
      if (response.data.results && Array.isArray(response.data.results)) {
        periodsData = response.data.results;
      } else if (Array.isArray(response.data)) {
        periodsData = response.data;
      } else {
        periodsData = [];
      }

      console.log('[PayrollPage] Setting periods:', periodsData);
      setPeriods(periodsData);
      if (periodsData.length > 0) {
        setSelectedPeriod(periodsData[0]);
        fetchPayrolls(periodsData[0].id);
      }
    } catch (error: any) {
      console.error('[PayrollPage] Error fetching periods:', error);
      toast.error('Failed to load payroll periods');
      setPeriods([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayrolls = async (periodId: number) => {
    try {
      const response = await api.get<any>(`/payroll/?period=${periodId}`);
      console.log('[PayrollPage] Payrolls API response:', response.data);

      // Handle both paginated and non-paginated responses
      let payrollsData: Payroll[];
      if (response.data.results && Array.isArray(response.data.results)) {
        payrollsData = response.data.results;
      } else if (Array.isArray(response.data)) {
        payrollsData = response.data;
      } else {
        payrollsData = [];
      }

      console.log('[PayrollPage] Setting payrolls:', payrollsData);
      setPayrolls(payrollsData);
    } catch (error: any) {
      console.error('[PayrollPage] Error fetching payrolls:', error);
      toast.error('Failed to load payrolls');
      setPayrolls([]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payroll Management</h1>
            <p className="text-gray-600">Manage employee payroll and compensation</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
              <FiCalendar />
              New Period
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
              <FiPlus />
              Generate Payroll
            </button>
          </div>
        </div>

        {/* Period Selection */}
        {periods.length > 0 && (
          <div className="bg-white p-4 rounded-lg shadow">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Payroll Period
            </label>
            <select
              value={selectedPeriod?.id || ''}
              onChange={(e) => {
                const period = periods.find(p => p.id === Number(e.target.value));
                if (period) {
                  setSelectedPeriod(period);
                  fetchPayrolls(period.id);
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {periods.map((period) => (
                <option key={period.id} value={period.id}>
                  {format(new Date(period.start_date), 'MMM dd, yyyy')} - {format(new Date(period.end_date), 'MMM dd, yyyy')} ({period.status})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Period Summary */}
        {selectedPeriod && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                    <FiDollarSign className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Gross Pay
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        ₦{parseFloat(selectedPeriod.total_gross_pay || '0').toLocaleString()}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                    <FiDollarSign className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Net Pay
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        ₦{parseFloat(selectedPeriod.total_net_pay || '0').toLocaleString()}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
                    <FiDollarSign className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Deductions
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        ₦{parseFloat(selectedPeriod.total_deductions || '0').toLocaleString()}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payroll Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Basic Salary
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payrolls.map((payroll) => (
                <tr key={payroll.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {payroll.employee_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {payroll.employee_id}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₦{parseFloat(payroll.basic_salary).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₦{parseFloat(payroll.gross_pay).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₦{parseFloat(payroll.total_deductions).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₦{parseFloat(payroll.net_pay).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(payroll.status)}`}>
                      {payroll.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
