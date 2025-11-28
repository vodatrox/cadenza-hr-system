'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import type { PayrollSettings } from '@/types';
import { toast } from 'react-toastify';
import { FiSave } from 'react-icons/fi';

export default function SettingsPage() {
  const router = useRouter();
  const { currentClient, isAuthenticated } = useAuthStore();
  const [settings, setSettings] = useState<PayrollSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    if (!currentClient) {
      router.push('/clients');
      return;
    }
    fetchSettings();
  }, [isAuthenticated, currentClient, router]);

  const fetchSettings = async () => {
    try {
      const response = await api.get<PayrollSettings>('/payroll/settings/');
      setSettings(response.data);
    } catch (error: any) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      await api.put('/payroll/settings/', settings);
      toast.success('Settings saved successfully');
    } catch (error: any) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
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

  if (!settings) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Settings not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payroll Settings</h1>
            <p className="text-gray-600">Configure payroll calculation settings</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
          >
            <FiSave />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          {/* Pension Settings */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pension Contribution</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enable_pension"
                  checked={settings.enable_pension}
                  onChange={(e) => setSettings({ ...settings, enable_pension: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="enable_pension" className="ml-2 block text-sm text-gray-900">
                  Enable Pension Deduction
                </label>
              </div>
              {settings.enable_pension && (
                <div>
                  <label htmlFor="pension_rate" className="block text-sm font-medium text-gray-700">
                    Pension Rate (%)
                  </label>
                  <input
                    type="number"
                    id="pension_rate"
                    step="0.01"
                    min="0"
                    max="1"
                    value={parseFloat(settings.pension_rate) * 100}
                    onChange={(e) => setSettings({ ...settings, pension_rate: (parseFloat(e.target.value) / 100).toString() })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Current: {(parseFloat(settings.pension_rate) * 100).toFixed(2)}% (Nigerian standard: 8%)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* NHF Settings */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">National Housing Fund (NHF)</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enable_nhf"
                  checked={settings.enable_nhf}
                  onChange={(e) => setSettings({ ...settings, enable_nhf: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="enable_nhf" className="ml-2 block text-sm text-gray-900">
                  Enable NHF Deduction
                </label>
              </div>
              {settings.enable_nhf && (
                <div>
                  <label htmlFor="nhf_rate" className="block text-sm font-medium text-gray-700">
                    NHF Rate (%)
                  </label>
                  <input
                    type="number"
                    id="nhf_rate"
                    step="0.01"
                    min="0"
                    max="1"
                    value={parseFloat(settings.nhf_rate) * 100}
                    onChange={(e) => setSettings({ ...settings, nhf_rate: (parseFloat(e.target.value) / 100).toString() })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Current: {(parseFloat(settings.nhf_rate) * 100).toFixed(2)}% (Nigerian standard: 2.5%)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Tax Settings */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">PAYE Tax</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enable_tax"
                  checked={settings.enable_tax}
                  onChange={(e) => setSettings({ ...settings, enable_tax: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="enable_tax" className="ml-2 block text-sm text-gray-900">
                  Enable Tax Deduction
                </label>
              </div>
              {settings.enable_tax && (
                <div>
                  <label htmlFor="tax_free_allowance" className="block text-sm font-medium text-gray-700">
                    Annual Tax-Free Allowance (₦)
                  </label>
                  <input
                    type="number"
                    id="tax_free_allowance"
                    step="1000"
                    min="0"
                    value={parseFloat(settings.tax_free_allowance)}
                    onChange={(e) => setSettings({ ...settings, tax_free_allowance: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Current: ₦{parseFloat(settings.tax_free_allowance).toLocaleString()} (Nigerian standard: ₦200,000)
                  </p>
                </div>
              )}
            </div>

            {settings.enable_tax && (
              <div className="mt-4 p-4 bg-blue-50 rounded-md">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Nigerian Tax Bands (2024)</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>₦0 - ₦300,000: 7%</li>
                  <li>₦300,001 - ₦600,000: 11%</li>
                  <li>₦600,001 - ₦1,100,000: 15%</li>
                  <li>₦1,100,001 - ₦1,600,000: 19%</li>
                  <li>₦1,600,001 - ₦3,200,000: 21%</li>
                  <li>Above ₦3,200,000: 24%</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
