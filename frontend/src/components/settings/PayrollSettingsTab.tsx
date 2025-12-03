'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import {
  FiSettings, FiDollarSign, FiSave, FiPercent
} from 'react-icons/fi';
import type { PayrollSettings } from '@/types';

type SubTab = 'general' | 'earnings' | 'deductions';

interface SettingsFormData {
  enable_pension: boolean;
  pension_rate: string;
  enable_nhf: boolean;
  nhf_rate: string;
  enable_tax: boolean;
  tax_free_allowance: string;
}

export default function PayrollSettingsTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PayrollSettings | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SettingsFormData>();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get<PayrollSettings>('/payroll/settings/');
      setSettings(response.data);
      reset({
        enable_pension: response.data.enable_pension,
        pension_rate: (parseFloat(response.data.pension_rate) * 100).toString(),
        enable_nhf: response.data.enable_nhf,
        nhf_rate: (parseFloat(response.data.nhf_rate) * 100).toString(),
        enable_tax: response.data.enable_tax,
        tax_free_allowance: response.data.tax_free_allowance,
      });
    } catch (error: any) {
      toast.error('Failed to load payroll settings');
    } finally {
      setLoading(false);
    }
  };

  const onSubmitSettings = async (data: SettingsFormData) => {
    setSaving(true);
    try {
      const payload = {
        ...data,
        pension_rate: (parseFloat(data.pension_rate) / 100).toString(),
        nhf_rate: (parseFloat(data.nhf_rate) / 100).toString(),
      };
      await api.put('/payroll/settings/', payload);
      toast.success('Payroll settings updated successfully');
      fetchSettings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const subTabs: { key: SubTab; label: string; icon: any }[] = [
    { key: 'general', label: 'General Settings', icon: FiSettings },
    { key: 'earnings', label: 'Statutory Earnings', icon: FiDollarSign },
    { key: 'deductions', label: 'Statutory Deductions', icon: FiDollarSign },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <div className="flex gap-8">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveSubTab(tab.key)}
                className={`flex items-center gap-2 py-3 text-sm font-medium transition-colors relative ${
                  activeSubTab === tab.key
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="text-base" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        {activeSubTab === 'general' && (
          <form onSubmit={handleSubmit(onSubmitSettings)} className="max-w-3xl space-y-6">
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Pension Contribution</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Configure employee pension deduction</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('enable_pension')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pension Rate (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    {...register('pension_rate', { required: 'Pension rate is required' })}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="8.00"
                  />
                  <FiPercent className="absolute right-3 top-3 text-gray-400" />
                </div>
                {errors.pension_rate && (
                  <p className="text-red-500 text-xs mt-1">{errors.pension_rate.message}</p>
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">National Housing Fund (NHF)</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Configure NHF deduction</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('enable_nhf')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NHF Rate (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    {...register('nhf_rate', { required: 'NHF rate is required' })}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="2.50"
                  />
                  <FiPercent className="absolute right-3 top-3 text-gray-400" />
                </div>
                {errors.nhf_rate && (
                  <p className="text-red-500 text-xs mt-1">{errors.nhf_rate.message}</p>
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Income Tax (PAYE)</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Configure income tax deduction</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('enable_tax')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tax-Free Allowance (Annual)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">N</span>
                  <input
                    type="number"
                    {...register('tax_free_allowance', { required: 'Tax-free allowance is required' })}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="200000.00"
                  />
                </div>
                {errors.tax_free_allowance && (
                  <p className="text-red-500 text-xs mt-1">{errors.tax_free_allowance.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <FiSave className="text-base" />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {activeSubTab === 'earnings' && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <FiDollarSign className="text-5xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Statutory Earnings</h3>
            <p className="text-sm text-gray-500">
              Configure from the Payroll Settings page
            </p>
          </div>
        )}

        {activeSubTab === 'deductions' && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <FiDollarSign className="text-5xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Statutory Deductions</h3>
            <p className="text-sm text-gray-500">
              Configure from the Payroll Settings page
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
