'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import type { EmployeeStats, PayrollStats } from '@/types';
import { FiUsers, FiUserCheck, FiUserX, FiTrendingUp, FiArrowRight, FiActivity, FiCreditCard } from 'react-icons/fi';
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
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            <div className="absolute inset-0 rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-200 animate-ping"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const stats = [
    {
      name: 'Total Employees',
      value: employeeStats?.total_employees || 0,
      icon: FiUsers,
      gradient: 'from-blue-500 to-blue-700',
      bgGradient: 'from-blue-50 to-blue-100',
      iconBg: 'bg-blue-500/10',
      change: '+12%',
      changeType: 'increase'
    },
    {
      name: 'Active Employees',
      value: employeeStats?.active_employees || 0,
      icon: FiUserCheck,
      gradient: 'from-emerald-500 to-emerald-700',
      bgGradient: 'from-emerald-50 to-emerald-100',
      iconBg: 'bg-emerald-500/10',
      change: '+8%',
      changeType: 'increase'
    },
    {
      name: 'On Leave',
      value: employeeStats?.on_leave || 0,
      icon: FiUserX,
      gradient: 'from-amber-500 to-amber-700',
      bgGradient: 'from-amber-50 to-amber-100',
      iconBg: 'bg-amber-500/10',
      change: '+3%',
      changeType: 'increase'
    },
    {
      name: 'Total Payroll',
      value: payrollStats?.total_net ? `₦${parseFloat(payrollStats.total_net).toLocaleString()}` : '₦0',
      icon: FiCreditCard,
      gradient: 'from-purple-500 to-purple-700',
      bgGradient: 'from-purple-50 to-purple-100',
      iconBg: 'bg-purple-500/10',
      change: '+15%',
      changeType: 'increase'
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Dashboard Overview
            </h1>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              <FiActivity className="w-4 h-4" />
              Real-time insights into your organization
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
              <p className="text-xs font-medium text-gray-600">Current Period</p>
              <p className="text-sm font-semibold text-gray-900">
                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={stat.name}
              className="group relative bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-gray-200 transition-all duration-300 overflow-hidden"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Gradient Background Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>

              <div className="relative p-6">
                {/* Icon */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`${stat.iconBg} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className={`h-6 w-6 bg-gradient-to-br ${stat.gradient} bg-clip-text text-transparent`} style={{ WebkitTextFillColor: 'transparent' }} />
                    <stat.icon className={`h-6 w-6 text-transparent absolute`} style={{
                      background: `linear-gradient(to bottom right, rgb(59, 130, 246), rgb(29, 78, 216))`,
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text'
                    }} />
                  </div>
                  {/* Change Indicator */}
                  <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-lg">
                    <FiTrendingUp className="w-3 h-3 text-emerald-600" />
                    <span className="text-xs font-semibold text-emerald-600">{stat.change}</span>
                  </div>
                </div>

                {/* Content */}
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {stat.name}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 tracking-tight">
                    {stat.value}
                  </p>
                </div>

                {/* Bottom accent */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Department Breakdown */}
          {employeeStats && employeeStats.by_department.length > 0 && (
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Department Distribution
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Employee allocation across departments</p>
                  </div>
                  <button className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 group">
                    View all
                    <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-5">
                  {employeeStats.by_department.slice(0, 5).map((dept, index) => {
                    const maxCount = Math.max(...employeeStats.by_department.map(d => d.count));
                    const percentage = (dept.count / maxCount) * 100;
                    const colors = [
                      'from-blue-500 to-blue-600',
                      'from-emerald-500 to-emerald-600',
                      'from-purple-500 to-purple-600',
                      'from-amber-500 to-amber-600',
                      'from-pink-500 to-pink-600',
                    ];

                    return (
                      <div key={index} className="group">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
                            {dept.department__name}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-gray-900">{dept.count}</span>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                              {Math.round((dept.count / (employeeStats.total_employees || 1)) * 100)}%
                            </span>
                          </div>
                        </div>
                        <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`absolute inset-y-0 left-0 bg-gradient-to-r ${colors[index % colors.length]} rounded-full transition-all duration-1000 ease-out shadow-sm`}
                            style={{
                              width: `${percentage}%`,
                              animationDelay: `${index * 100}ms`
                            }}
                          >
                            <div className="absolute inset-0 bg-white/20"></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
              <p className="text-sm text-gray-500 mt-1">Common tasks</p>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/dashboard/employees')}
                  className="w-full group relative px-5 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Manage Employees</span>
                    <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>

                <button
                  onClick={() => router.push('/dashboard/payroll')}
                  className="w-full group relative px-5 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Process Payroll</span>
                    <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>

                <button
                  onClick={() => router.push('/dashboard/payroll/periods')}
                  className="w-full group relative px-5 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/40 hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Manage Periods</span>
                    <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>

                <button
                  onClick={() => router.push('/dashboard/settings')}
                  className="w-full group relative px-5 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Settings</span>
                    <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats Row */}
        {payrollStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 text-white shadow-xl shadow-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <FiTrendingUp className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                  This Month
                </span>
              </div>
              <p className="text-sm font-medium text-blue-100 mb-1">Total Gross Pay</p>
              <p className="text-3xl font-bold tracking-tight">
                ₦{parseFloat(payrollStats.total_gross || '0').toLocaleString()}
              </p>
            </div>

            <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-6 text-white shadow-xl shadow-emerald-500/20 hover:shadow-2xl hover:shadow-emerald-500/30 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <FiTrendingUp className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                  Deductions
                </span>
              </div>
              <p className="text-sm font-medium text-emerald-100 mb-1">Total Tax & Deductions</p>
              <p className="text-3xl font-bold tracking-tight">
                ₦{parseFloat(payrollStats.total_deductions || '0').toLocaleString()}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-6 text-white shadow-xl shadow-purple-500/20 hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <FiUsers className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                  Processed
                </span>
              </div>
              <p className="text-sm font-medium text-purple-100 mb-1">Payroll Count</p>
              <p className="text-3xl font-bold tracking-tight">
                {payrollStats.count || 0}
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
