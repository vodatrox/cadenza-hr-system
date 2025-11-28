'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import type { EmployeeStats, PayrollStats } from '@/types';
import { FiUsers, FiUserCheck, FiUserX, FiDollarSign } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function DashboardPage() {
  const router = useRouter();
  const { currentClient, isAuthenticated, _hasHydrated } = useAuthStore();
  const [employeeStats, setEmployeeStats] = useState<EmployeeStats | null>(null);
  const [payrollStats, setPayrollStats] = useState<PayrollStats | null>(null);
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
    fetchStats();
  }, [_hasHydrated, isAuthenticated, currentClient, router]);

  const fetchStats = async () => {
    try {
      const [empStats, payStats] = await Promise.all([
        api.get<EmployeeStats>('/employees/stats/'),
        api.get<PayrollStats>('/payroll/stats/'),
      ]);
      setEmployeeStats(empStats.data);
      setPayrollStats(payStats.data);
    } catch (error: any) {
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
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

  const stats = [
    {
      name: 'Total Employees',
      value: employeeStats?.total_employees || 0,
      icon: FiUsers,
      color: 'bg-blue-500',
    },
    {
      name: 'Active Employees',
      value: employeeStats?.active_employees || 0,
      icon: FiUserCheck,
      color: 'bg-green-500',
    },
    {
      name: 'On Leave',
      value: employeeStats?.on_leave || 0,
      icon: FiUserX,
      color: 'bg-yellow-500',
    },
    {
      name: 'Total Payroll',
      value: payrollStats?.total_net ? `₦${parseFloat(payrollStats.total_net).toLocaleString()}` : '₦0',
      icon: FiDollarSign,
      color: 'bg-purple-500',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600">Welcome to your HR management dashboard</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 ${stat.color} rounded-md p-3`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        {stat.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Department Breakdown */}
        {employeeStats && employeeStats.by_department.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Employees by Department
            </h3>
            <div className="space-y-3">
              {employeeStats.by_department.slice(0, 5).map((dept, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {dept.department__name}
                  </span>
                  <span className="text-sm text-gray-600">{dept.count} employees</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <button
              onClick={() => router.push('/dashboard/employees')}
              className="px-4 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              Manage Employees
            </button>
            <button
              onClick={() => router.push('/dashboard/payroll')}
              className="px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Process Payroll
            </button>
            <button
              onClick={() => router.push('/dashboard/settings')}
              className="px-4 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Settings
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
