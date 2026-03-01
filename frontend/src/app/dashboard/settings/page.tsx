'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import DashboardLayout from '@/components/DashboardLayout';
import { FiDollarSign, FiUsers, FiBriefcase } from 'react-icons/fi';
import PayrollSettingsTab from '@/components/settings/PayrollSettingsTab';

type SettingsTab = 'payroll' | 'company' | 'users';

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as SettingsTab | null;
  const { currentClient, isAuthenticated, _hasHydrated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>(tabParam || 'payroll');

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated()) { router.push('/login'); return; }
    if (!currentClient) { router.push('/clients'); return; }
  }, [_hasHydrated, isAuthenticated, currentClient]);

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    router.push(`/dashboard/settings?tab=${tab}`, { scroll: false });
  };

  const tabs: { key: SettingsTab; label: string; description: string; icon: any; available: boolean }[] = [
    { key: 'payroll', label: 'Payroll Settings', description: 'Configure payroll rules and statutory items', icon: FiDollarSign, available: true },
    { key: 'company', label: 'Company Settings', description: 'Manage company profile and preferences', icon: FiBriefcase, available: false },
    { key: 'users', label: 'User Management', description: 'Manage users, roles, and permissions', icon: FiUsers, available: false },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your application settings and configurations</p>
        </div>

        <div className="flex gap-6">
          {/* Vertical Sidebar Tabs */}
          <div className="w-56 flex-shrink-0 hidden md:block">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => tab.available && handleTabChange(tab.key)}
                    disabled={!tab.available}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                      activeTab === tab.key
                        ? 'bg-slate-900 text-white'
                        : tab.available
                        ? 'text-slate-600 hover:bg-slate-100'
                        : 'text-slate-300 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{tab.label}</span>
                    </div>
                    {!tab.available && (
                      <span className="ml-6 text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">Soon</span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Mobile horizontal tabs */}
          <div className="md:hidden w-full">
            <div className="flex gap-1 mb-4 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => tab.available && handleTabChange(tab.key)}
                  disabled={!tab.available}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap ${
                    activeTab === tab.key ? 'bg-slate-900 text-white' : tab.available ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {activeTab === 'payroll' && <PayrollSettingsTab />}
            {activeTab === 'company' && (
              <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
                <FiBriefcase className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-slate-900 mb-1">Company Settings</h3>
                <p className="text-sm text-slate-500">Company settings will be available soon</p>
              </div>
            )}
            {activeTab === 'users' && (
              <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
                <FiUsers className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-slate-900 mb-1">User Management</h3>
                <p className="text-sm text-slate-500">User management will be available soon</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-accent-600"></div>
        </div>
      </DashboardLayout>
    }>
      <SettingsContent />
    </Suspense>
  );
}
