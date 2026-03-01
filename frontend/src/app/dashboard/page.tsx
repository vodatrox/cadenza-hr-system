'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import type { EmployeeStats, PayrollStats } from '@/types';
import { FiUsers, FiUserCheck, FiUserX, FiArrowRight, FiCreditCard, FiCalendar } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function DashboardPage() {
  const router = useRouter();
  const { currentClient, user, isAuthenticated, _hasHydrated } = useAuthStore();
  const [employeeStats, setEmployeeStats] = useState<EmployeeStats | null>(null);
  const [payrollStats, setPayrollStats] = useState<PayrollStats | null>(null);
  const [loading, setLoading] = useState(true);

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
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-accent-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  const stats = [
    {
      name: 'Total Employees',
      value: employeeStats?.total_employees || 0,
      icon: FiUsers,
      color: 'text-blue-600',
      border: 'border-l-blue-600',
      bg: 'bg-blue-50',
    },
    {
      name: 'Active Employees',
      value: employeeStats?.active_employees || 0,
      icon: FiUserCheck,
      color: 'text-emerald-600',
      border: 'border-l-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      name: 'On Leave',
      value: employeeStats?.on_leave || 0,
      icon: FiUserX,
      color: 'text-amber-600',
      border: 'border-l-amber-600',
      bg: 'bg-amber-50',
    },
    {
      name: 'Total Net Pay',
      value: payrollStats?.total_net ? `₦${parseFloat(payrollStats.total_net).toLocaleString()}` : '₦0',
      icon: FiCreditCard,
      color: 'text-violet-600',
      border: 'border-l-violet-600',
      bg: 'bg-violet-50',
    },
  ];

  const quickActions = [
    { label: 'Manage Employees', href: '/dashboard/employees', icon: FiUsers },
    { label: 'Process Payroll', href: '/dashboard/payroll', icon: FiCreditCard },
    { label: 'Manage Periods', href: '/dashboard/payroll/periods', icon: FiCalendar },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Welcome back, {user?.first_name}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div className="hidden md:block px-3 py-1.5 bg-white border border-slate-200 rounded-lg">
            <p className="text-xs text-slate-500">Current Period</p>
            <p className="text-sm font-medium text-slate-900">
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.name}
              className={`bg-white rounded-lg border border-slate-200 border-l-4 ${stat.border} p-5`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
              <p className="text-sm text-slate-500 mb-1">{stat.name}</p>
              <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Department Distribution */}
          {employeeStats && employeeStats.by_department.length > 0 && (
            <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200">
              <div className="px-5 py-4 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Department Distribution</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Employee allocation across departments</p>
                  </div>
                  <button
                    onClick={() => router.push('/dashboard/departments')}
                    className="text-xs font-medium text-accent-600 hover:text-accent-700 flex items-center gap-1"
                  >
                    View all
                    <FiArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="p-5">
                <div className="space-y-4">
                  {employeeStats.by_department.slice(0, 5).map((dept, index) => {
                    const maxCount = Math.max(...employeeStats.by_department.map(d => d.count));
                    const percentage = (dept.count / maxCount) * 100;
                    const colors = [
                      'bg-slate-700',
                      'bg-slate-600',
                      'bg-slate-500',
                      'bg-slate-400',
                      'bg-slate-300',
                    ];

                    return (
                      <div key={index}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm text-slate-700">{dept.department__name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900">{dept.count}</span>
                            <span className="text-xs text-slate-400">
                              {Math.round((dept.count / (employeeStats.total_employees || 1)) * 100)}%
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${colors[index % colors.length]} rounded-full transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Quick Actions</h3>
            </div>
            <div className="p-4 space-y-2">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => router.push(action.href)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors group"
                >
                  <span className="flex items-center gap-3">
                    <action.icon className="w-4 h-4 text-slate-400" />
                    {action.label}
                  </span>
                  <FiArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Payroll Summary */}
        {payrollStats && (
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Payroll Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border border-slate-200 p-5">
                <p className="text-sm text-slate-500 mb-1">Total Gross Pay</p>
                <p className="text-xl font-semibold text-slate-900">
                  ₦{parseFloat(payrollStats.total_gross || '0').toLocaleString()}
                </p>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-5">
                <p className="text-sm text-slate-500 mb-1">Total Deductions</p>
                <p className="text-xl font-semibold text-slate-900">
                  ₦{parseFloat(payrollStats.total_deductions || '0').toLocaleString()}
                </p>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-5">
                <p className="text-sm text-slate-500 mb-1">Payroll Count</p>
                <p className="text-xl font-semibold text-slate-900">
                  {payrollStats.count || 0}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
