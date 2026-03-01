'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import DashboardLayout from '@/components/DashboardLayout';
import { FiFileText, FiUsers, FiDollarSign, FiPieChart } from 'react-icons/fi';

export default function ReportsPage() {
  const router = useRouter();
  const { currentClient, isAuthenticated, _hasHydrated } = useAuthStore();

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
  }, [_hasHydrated, isAuthenticated, currentClient, router]);

  const reportTypes = [
    {
      name: 'Payroll Reports',
      description: 'Monthly payroll summaries, tax reports, and payment histories',
      icon: FiDollarSign,
    },
    {
      name: 'Employee Reports',
      description: 'Headcount analytics, turnover rates, and department breakdowns',
      icon: FiUsers,
    },
    {
      name: 'Tax Reports',
      description: 'PAYE reports, pension summaries, and statutory compliance',
      icon: FiFileText,
    },
    {
      name: 'Custom Reports',
      description: 'Build custom reports from your organization data',
      icon: FiPieChart,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">Generate and view reports for your organization</p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-100 rounded-full mb-4">
            <FiFileText className="w-6 h-6 text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Coming Soon</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Reports and analytics are currently being developed. Check back soon for comprehensive reporting tools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reportTypes.map((report) => (
            <div
              key={report.name}
              className="bg-white rounded-lg border border-slate-200 p-5 opacity-60"
            >
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <report.icon className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{report.name}</h3>
                  <p className="text-sm text-slate-500 mt-0.5">{report.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
