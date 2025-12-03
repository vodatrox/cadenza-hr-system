'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import DashboardLayout from '@/components/DashboardLayout';
import { FiSettings, FiDollarSign, FiUsers, FiBriefcase } from 'react-icons/fi';
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

    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    if (!currentClient) {
      router.push('/clients');
      return;
    }
  }, [_hasHydrated, isAuthenticated, currentClient]);

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    router.push(`/dashboard/settings?tab=${tab}`, { scroll: false });
  };

  const tabs: { key: SettingsTab; label: string; icon: any; available: boolean }[] = [
    { key: 'payroll', label: 'Payroll Settings', icon: FiDollarSign, available: true },
    { key: 'company', label: 'Company Settings', icon: FiBriefcase, available: false },
    { key: 'users', label: 'User Management', icon: FiUsers, available: false },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your application settings and configurations
          </p>
        </div>

        {/* Main Settings Container */}
        <div className="bg-white rounded-lg border border-gray-200">
          {/* Tabs Navigation */}
          <div className="border-b border-gray-200">
            <div className="flex gap-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => tab.available && handleTabChange(tab.key)}
                    disabled={!tab.available}
                    className={`flex items-center gap-2 py-4 text-sm font-medium transition-colors relative ${
                      activeTab === tab.key
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : tab.available
                        ? 'text-gray-500 hover:text-gray-700'
                        : 'text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    <Icon className="text-base" />
                    {tab.label}
                    {!tab.available && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">
                        Coming Soon
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'payroll' && <PayrollSettingsTab />}

            {activeTab === 'company' && (
              <div className="text-center py-12">
                <FiBriefcase className="text-5xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Company Settings</h3>
                <p className="text-sm text-gray-500">
                  Company settings will be available soon
                </p>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="text-center py-12">
                <FiUsers className="text-5xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">User Management</h3>
                <p className="text-sm text-gray-500">
                  User management will be available soon
                </p>
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
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    }>
      <SettingsContent />
    </Suspense>
  );
}
