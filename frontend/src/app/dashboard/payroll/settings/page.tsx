'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import DashboardLayout from '@/components/DashboardLayout';

export default function PayrollSettingsRedirect() {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!_hasHydrated) return;

    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    // Redirect to main settings page with payroll tab
    router.push('/dashboard/settings?tab=payroll');
  }, [_hasHydrated, isAuthenticated, router]);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    </DashboardLayout>
  );
}
