'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import {
  FiSettings, FiDollarSign, FiSave, FiPercent, FiPlus, FiEdit2, FiTrash2, FiX, FiCheck
} from 'react-icons/fi';
import type { PayrollSettings, StatutoryEarning, StatutoryDeduction } from '@/types';

type SubTab = 'general' | 'earnings' | 'deductions';

interface SettingsFormData {
  enable_pension: boolean;
  pension_rate: string;
  enable_nhf: boolean;
  nhf_rate: string;
  enable_tax: boolean;
  tax_free_allowance: string;
}

interface EarningFormData {
  name: string;
  description: string;
  is_percentage: boolean;
  amount: string;
  is_taxable: boolean;
  is_active: boolean;
}

interface DeductionFormData {
  name: string;
  description: string;
  is_percentage: boolean;
  amount: string;
  is_active: boolean;
}

export default function PayrollSettingsTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PayrollSettings | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SettingsFormData>();

  // Earnings
  const [earnings, setEarnings] = useState<StatutoryEarning[]>([]);
  const [showEarningModal, setShowEarningModal] = useState(false);
  const [editingEarning, setEditingEarning] = useState<StatutoryEarning | null>(null);

  // Deductions
  const [deductions, setDeductions] = useState<StatutoryDeduction[]>([]);
  const [showDeductionModal, setShowDeductionModal] = useState(false);
  const [editingDeduction, setEditingDeduction] = useState<StatutoryDeduction | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchSettings(), fetchEarnings(), fetchDeductions()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
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
    }
  };

  const fetchEarnings = async () => {
    try {
      const response = await api.get<any>('/payroll/statutory-earnings/');
      // Handle both paginated and non-paginated responses
      const earningsData = response.data.results || response.data;
      setEarnings(Array.isArray(earningsData) ? earningsData : []);
    } catch (error: any) {
      toast.error('Failed to load statutory earnings');
    }
  };

  const fetchDeductions = async () => {
    try {
      const response = await api.get<any>('/payroll/statutory-deductions/');
      // Handle both paginated and non-paginated responses
      const deductionsData = response.data.results || response.data;
      setDeductions(Array.isArray(deductionsData) ? deductionsData : []);
    } catch (error: any) {
      toast.error('Failed to load statutory deductions');
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

  const handleDeleteEarning = async (id: number) => {
    if (!confirm('Are you sure you want to delete this statutory earning?')) return;

    try {
      await api.delete(`/payroll/statutory-earnings/${id}/`);
      toast.success('Statutory earning deleted successfully');
      fetchEarnings();
    } catch (error: any) {
      toast.error('Failed to delete statutory earning');
    }
  };

  const handleToggleEarning = async (earning: StatutoryEarning) => {
    try {
      await api.put(`/payroll/statutory-earnings/${earning.id}/`, {
        ...earning,
        is_active: !earning.is_active
      });
      toast.success(`Earning ${!earning.is_active ? 'activated' : 'deactivated'}`);
      fetchEarnings();
    } catch (error: any) {
      toast.error('Failed to toggle earning');
    }
  };

  const handleDeleteDeduction = async (id: number) => {
    if (!confirm('Are you sure you want to delete this statutory deduction?')) return;

    try {
      await api.delete(`/payroll/statutory-deductions/${id}/`);
      toast.success('Statutory deduction deleted successfully');
      fetchDeductions();
    } catch (error: any) {
      toast.error('Failed to delete statutory deduction');
    }
  };

  const handleToggleDeduction = async (deduction: StatutoryDeduction) => {
    try {
      await api.put(`/payroll/statutory-deductions/${deduction.id}/`, {
        ...deduction,
        is_active: !deduction.is_active
      });
      toast.success(`Deduction ${!deduction.is_active ? 'activated' : 'deactivated'}`);
      fetchDeductions();
    } catch (error: any) {
      toast.error('Failed to toggle deduction');
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
        {/* General Settings Tab */}
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

        {/* Statutory Earnings Tab */}
        {activeSubTab === 'earnings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Statutory Earnings</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Manage statutory earnings like housing allowance, transport allowance, etc.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingEarning(null);
                  setShowEarningModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiPlus className="text-base" />
                Add Earning
              </button>
            </div>

            {earnings.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                <FiDollarSign className="text-5xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">No statutory earnings configured</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {earnings.map((earning) => (
                  <div
                    key={earning.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900">{earning.name}</h4>
                          {earning.is_active && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <FiCheck className="mr-1" />
                              Active
                            </span>
                          )}
                          {earning.is_taxable && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Taxable
                            </span>
                          )}
                        </div>
                        {earning.description && (
                          <p className="text-sm text-gray-500 mt-1">{earning.description}</p>
                        )}
                        <p className="text-lg font-bold text-blue-600 mt-2">
                          {earning.is_percentage ? `${earning.amount}%` : `N${parseFloat(earning.amount).toLocaleString()}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleEarning(earning)}
                          className={`p-2 rounded-lg transition-colors ${
                            earning.is_active
                              ? 'text-green-600 hover:text-green-700 hover:bg-green-50'
                              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                          }`}
                          title={earning.is_active ? 'Deactivate' : 'Activate'}
                        >
                          <FiCheck className="text-base" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingEarning(earning);
                            setShowEarningModal(true);
                          }}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <FiEdit2 className="text-base" />
                        </button>
                        <button
                          onClick={() => handleDeleteEarning(earning.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <FiTrash2 className="text-base" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Statutory Deductions Tab */}
        {activeSubTab === 'deductions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Statutory Deductions</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Manage statutory deductions applicable to employees
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingDeduction(null);
                  setShowDeductionModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiPlus className="text-base" />
                Add Deduction
              </button>
            </div>

            {deductions.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                <FiDollarSign className="text-5xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">No statutory deductions configured</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deductions.map((deduction) => (
                  <div
                    key={deduction.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900">{deduction.name}</h4>
                          {deduction.is_active && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <FiCheck className="mr-1" />
                              Active
                            </span>
                          )}
                        </div>
                        {deduction.description && (
                          <p className="text-sm text-gray-500 mt-1">{deduction.description}</p>
                        )}
                        <p className="text-lg font-bold text-red-600 mt-2">
                          {deduction.is_percentage ? `${deduction.amount}%` : `N${parseFloat(deduction.amount).toLocaleString()}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleDeduction(deduction)}
                          className={`p-2 rounded-lg transition-colors ${
                            deduction.is_active
                              ? 'text-green-600 hover:text-green-700 hover:bg-green-50'
                              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                          }`}
                          title={deduction.is_active ? 'Deactivate' : 'Activate'}
                        >
                          <FiCheck className="text-base" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingDeduction(deduction);
                            setShowDeductionModal(true);
                          }}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <FiEdit2 className="text-base" />
                        </button>
                        <button
                          onClick={() => handleDeleteDeduction(deduction.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <FiTrash2 className="text-base" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showEarningModal && (
        <EarningModal
          earning={editingEarning}
          onClose={() => {
            setShowEarningModal(false);
            setEditingEarning(null);
          }}
          onSuccess={() => {
            setShowEarningModal(false);
            setEditingEarning(null);
            fetchEarnings();
          }}
        />
      )}

      {showDeductionModal && (
        <DeductionModal
          deduction={editingDeduction}
          onClose={() => {
            setShowDeductionModal(false);
            setEditingDeduction(null);
          }}
          onSuccess={() => {
            setShowDeductionModal(false);
            setEditingDeduction(null);
            fetchDeductions();
          }}
        />
      )}
    </div>
  );
}

// Earning Modal Component
interface EarningModalProps {
  earning: StatutoryEarning | null;
  onClose: () => void;
  onSuccess: () => void;
}

function EarningModal({ earning, onClose, onSuccess }: EarningModalProps) {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<EarningFormData>({
    defaultValues: {
      name: earning?.name || '',
      description: earning?.description || '',
      is_percentage: earning?.is_percentage || false,
      amount: earning?.amount || '',
      is_taxable: earning?.is_taxable || false,
      is_active: earning?.is_active ?? true,
    }
  });

  const isPercentage = watch('is_percentage');

  const onSubmit = async (data: EarningFormData) => {
    setSaving(true);
    try {
      if (earning) {
        await api.put(`/payroll/statutory-earnings/${earning.id}/`, data);
        toast.success('Statutory earning updated successfully');
      } else {
        await api.post('/payroll/statutory-earnings/', data);
        toast.success('Statutory earning created successfully');
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save statutory earning');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {earning ? 'Edit Statutory Earning' : 'Add Statutory Earning'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('name', { required: 'Name is required' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Housing Allowance"
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Optional description"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('is_percentage')}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Percentage of basic salary</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              {!isPercentage && (
                <span className="absolute left-3 top-3 text-gray-500">N</span>
              )}
              <input
                type="number"
                step="0.01"
                {...register('amount', {
                  required: 'Amount is required',
                  min: { value: 0, message: 'Amount must be positive' }
                })}
                className={`w-full ${isPercentage ? 'px-4' : 'pl-8'} ${isPercentage ? 'pr-10' : 'pr-4'} py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder={isPercentage ? "10.00" : "50000.00"}
              />
              {isPercentage && (
                <FiPercent className="absolute right-3 top-3 text-gray-400" />
              )}
            </div>
            {errors.amount && (
              <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('is_taxable')}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Taxable earning</span>
            </label>
            <p className="text-xs text-gray-500 ml-6 mt-0.5">Check if this earning is subject to income tax</p>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('is_active')}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>
            <p className="text-xs text-gray-500 ml-6 mt-0.5">Only active earnings will be applied to payroll</p>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  Saving...
                </span>
              ) : (
                earning ? 'Update' : 'Create'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Deduction Modal Component
interface DeductionModalProps {
  deduction: StatutoryDeduction | null;
  onClose: () => void;
  onSuccess: () => void;
}

function DeductionModal({ deduction, onClose, onSuccess }: DeductionModalProps) {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<DeductionFormData>({
    defaultValues: {
      name: deduction?.name || '',
      description: deduction?.description || '',
      is_percentage: deduction?.is_percentage || false,
      amount: deduction?.amount || '',
      is_active: deduction?.is_active ?? true,
    }
  });

  const isPercentage = watch('is_percentage');

  const onSubmit = async (data: DeductionFormData) => {
    setSaving(true);
    try {
      if (deduction) {
        await api.put(`/payroll/statutory-deductions/${deduction.id}/`, data);
        toast.success('Statutory deduction updated successfully');
      } else {
        await api.post('/payroll/statutory-deductions/', data);
        toast.success('Statutory deduction created successfully');
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save statutory deduction');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {deduction ? 'Edit Statutory Deduction' : 'Add Statutory Deduction'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('name', { required: 'Name is required' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Union Dues"
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Optional description"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('is_percentage')}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Percentage of basic salary</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              {!isPercentage && (
                <span className="absolute left-3 top-3 text-gray-500">N</span>
              )}
              <input
                type="number"
                step="0.01"
                {...register('amount', {
                  required: 'Amount is required',
                  min: { value: 0, message: 'Amount must be positive' }
                })}
                className={`w-full ${isPercentage ? 'px-4' : 'pl-8'} ${isPercentage ? 'pr-10' : 'pr-4'} py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder={isPercentage ? "5.00" : "10000.00"}
              />
              {isPercentage && (
                <FiPercent className="absolute right-3 top-3 text-gray-400" />
              )}
            </div>
            {errors.amount && (
              <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('is_active')}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>
            <p className="text-xs text-gray-500 ml-6 mt-0.5">Only active deductions will be applied to payroll</p>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  Saving...
                </span>
              ) : (
                deduction ? 'Update' : 'Create'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
