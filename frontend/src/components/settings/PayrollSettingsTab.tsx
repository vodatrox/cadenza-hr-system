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

  const [earnings, setEarnings] = useState<StatutoryEarning[]>([]);
  const [showEarningModal, setShowEarningModal] = useState(false);
  const [editingEarning, setEditingEarning] = useState<StatutoryEarning | null>(null);

  const [deductions, setDeductions] = useState<StatutoryDeduction[]>([]);
  const [showDeductionModal, setShowDeductionModal] = useState(false);
  const [editingDeduction, setEditingDeduction] = useState<StatutoryDeduction | null>(null);

  useEffect(() => { fetchAllData(); }, []);

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
      const earningsData = response.data.results || response.data;
      setEarnings(Array.isArray(earningsData) ? earningsData : []);
    } catch (error: any) {
      toast.error('Failed to load statutory earnings');
    }
  };

  const fetchDeductions = async () => {
    try {
      const response = await api.get<any>('/payroll/statutory-deductions/');
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
      await api.put(`/payroll/statutory-earnings/${earning.id}/`, { ...earning, is_active: !earning.is_active });
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
      await api.put(`/payroll/statutory-deductions/${deduction.id}/`, { ...deduction, is_active: !deduction.is_active });
      toast.success(`Deduction ${!deduction.is_active ? 'activated' : 'deactivated'}`);
      fetchDeductions();
    } catch (error: any) {
      toast.error('Failed to toggle deduction');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-accent-600"></div>
      </div>
    );
  }

  const subTabs: { key: SubTab; label: string }[] = [
    { key: 'general', label: 'General' },
    { key: 'earnings', label: 'Statutory Earnings' },
    { key: 'deductions', label: 'Statutory Deductions' },
  ];

  return (
    <div className="space-y-5">
      {/* Sub-tabs */}
      <div className="flex gap-1">
        {subTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSubTab(tab.key)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              activeSubTab === tab.key
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Settings */}
      {activeSubTab === 'general' && (
        <form onSubmit={handleSubmit(onSubmitSettings)} className="space-y-4">
          {/* Pension */}
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Pension Contribution</h3>
                <p className="text-xs text-slate-500 mt-0.5">Configure employee pension deduction</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" {...register('enable_pension')} className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent-600"></div>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Pension Rate (%)</label>
              <div className="relative max-w-xs">
                <input
                  type="number"
                  step="0.01"
                  {...register('pension_rate', { required: 'Pension rate is required' })}
                  className="input-field pr-10"
                  placeholder="8.00"
                />
                <FiPercent className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              </div>
              {errors.pension_rate && <p className="text-red-500 text-xs mt-1">{errors.pension_rate.message}</p>}
            </div>
          </div>

          {/* NHF */}
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">National Housing Fund (NHF)</h3>
                <p className="text-xs text-slate-500 mt-0.5">Configure NHF deduction</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" {...register('enable_nhf')} className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent-600"></div>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">NHF Rate (%)</label>
              <div className="relative max-w-xs">
                <input
                  type="number"
                  step="0.01"
                  {...register('nhf_rate', { required: 'NHF rate is required' })}
                  className="input-field pr-10"
                  placeholder="2.50"
                />
                <FiPercent className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              </div>
              {errors.nhf_rate && <p className="text-red-500 text-xs mt-1">{errors.nhf_rate.message}</p>}
            </div>
          </div>

          {/* Tax */}
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Income Tax (PAYE)</h3>
                <p className="text-xs text-slate-500 mt-0.5">Configure income tax deduction</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" {...register('enable_tax')} className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent-600"></div>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Tax-Free Allowance (Annual)</label>
              <div className="relative max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">₦</span>
                <input
                  type="number"
                  {...register('tax_free_allowance', { required: 'Tax-free allowance is required' })}
                  className="input-field pl-8"
                  placeholder="200000.00"
                />
              </div>
              {errors.tax_free_allowance && <p className="text-red-500 text-xs mt-1">{errors.tax_free_allowance.message}</p>}
            </div>
          </div>

          <div className="pt-2">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <FiSave className="w-4 h-4" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Statutory Earnings */}
      {activeSubTab === 'earnings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Statutory Earnings</h3>
              <p className="text-xs text-slate-500 mt-0.5">Manage statutory earnings like housing allowance, transport allowance, etc.</p>
            </div>
            <button
              onClick={() => { setEditingEarning(null); setShowEarningModal(true); }}
              className="btn-primary"
            >
              <FiPlus className="w-4 h-4" />
              Add Earning
            </button>
          </div>

          {earnings.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
              <FiDollarSign className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No statutory earnings configured</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {earnings.map((earning) => (
                <div key={earning.id} className="bg-white border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-slate-900">{earning.name}</h4>
                        {earning.is_active && <span className="badge badge-success"><FiCheck className="w-3 h-3" /> Active</span>}
                        {earning.is_taxable && <span className="badge badge-info">Taxable</span>}
                      </div>
                      {earning.description && <p className="text-xs text-slate-500">{earning.description}</p>}
                      <p className="text-base font-semibold text-accent-600 mt-2">
                        {earning.is_percentage ? `${earning.amount}%` : `₦${parseFloat(earning.amount).toLocaleString()}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => handleToggleEarning(earning)}
                        className={`p-1.5 rounded-lg transition-colors ${earning.is_active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-50'}`}
                        title={earning.is_active ? 'Deactivate' : 'Activate'}
                      >
                        <FiCheck className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { setEditingEarning(earning); setShowEarningModal(true); }}
                        className="p-1.5 text-slate-400 hover:text-accent-600 hover:bg-accent-50 rounded-lg transition-colors"
                      >
                        <FiEdit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteEarning(earning.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Statutory Deductions */}
      {activeSubTab === 'deductions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Statutory Deductions</h3>
              <p className="text-xs text-slate-500 mt-0.5">Manage statutory deductions applicable to employees</p>
            </div>
            <button
              onClick={() => { setEditingDeduction(null); setShowDeductionModal(true); }}
              className="btn-primary"
            >
              <FiPlus className="w-4 h-4" />
              Add Deduction
            </button>
          </div>

          {deductions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
              <FiDollarSign className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No statutory deductions configured</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {deductions.map((deduction) => (
                <div key={deduction.id} className="bg-white border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-slate-900">{deduction.name}</h4>
                        {deduction.is_active && <span className="badge badge-success"><FiCheck className="w-3 h-3" /> Active</span>}
                      </div>
                      {deduction.description && <p className="text-xs text-slate-500">{deduction.description}</p>}
                      <p className="text-base font-semibold text-red-600 mt-2">
                        {deduction.is_percentage ? `${deduction.amount}%` : `₦${parseFloat(deduction.amount).toLocaleString()}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => handleToggleDeduction(deduction)}
                        className={`p-1.5 rounded-lg transition-colors ${deduction.is_active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-50'}`}
                        title={deduction.is_active ? 'Deactivate' : 'Activate'}
                      >
                        <FiCheck className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { setEditingDeduction(deduction); setShowDeductionModal(true); }}
                        className="p-1.5 text-slate-400 hover:text-accent-600 hover:bg-accent-50 rounded-lg transition-colors"
                      >
                        <FiEdit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteDeduction(deduction.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showEarningModal && (
        <EarningModal
          earning={editingEarning}
          onClose={() => { setShowEarningModal(false); setEditingEarning(null); }}
          onSuccess={() => { setShowEarningModal(false); setEditingEarning(null); fetchEarnings(); }}
        />
      )}
      {showDeductionModal && (
        <DeductionModal
          deduction={editingDeduction}
          onClose={() => { setShowDeductionModal(false); setEditingDeduction(null); }}
          onSuccess={() => { setShowDeductionModal(false); setEditingDeduction(null); fetchDeductions(); }}
        />
      )}
    </div>
  );
}

function EarningModal({ earning, onClose, onSuccess }: { earning: StatutoryEarning | null; onClose: () => void; onSuccess: () => void }) {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<EarningFormData>({
    defaultValues: {
      name: earning?.name || '', description: earning?.description || '',
      is_percentage: earning?.is_percentage || false, amount: earning?.amount || '',
      is_taxable: earning?.is_taxable || false, is_active: earning?.is_active ?? true,
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
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-elevated max-w-lg w-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-900">{earning ? 'Edit Statutory Earning' : 'Add Statutory Earning'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><FiX className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Name <span className="text-red-500">*</span></label>
            <input type="text" {...register('name', { required: 'Name is required' })} className="input-field" placeholder="e.g., Housing Allowance" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea {...register('description')} rows={2} className="input-field resize-none" placeholder="Optional description" />
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('is_percentage')} className="w-4 h-4 text-accent-600 border-slate-300 rounded focus:ring-accent-500" />
              <span className="text-sm text-slate-700">Percentage of basic salary</span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount <span className="text-red-500">*</span></label>
            <div className="relative">
              {!isPercentage && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">₦</span>}
              <input
                type="number" step="0.01"
                {...register('amount', { required: 'Amount is required', min: { value: 0, message: 'Amount must be positive' } })}
                className={`input-field ${isPercentage ? '' : 'pl-8'} ${isPercentage ? 'pr-10' : ''}`}
                placeholder={isPercentage ? "10.00" : "50000.00"}
              />
              {isPercentage && <FiPercent className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />}
            </div>
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('is_taxable')} className="w-4 h-4 text-accent-600 border-slate-300 rounded focus:ring-accent-500" />
              <span className="text-sm text-slate-700">Taxable earning</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('is_active')} className="w-4 h-4 text-accent-600 border-slate-300 rounded focus:ring-accent-500" />
              <span className="text-sm text-slate-700">Active</span>
            </label>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving...' : earning ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeductionModal({ deduction, onClose, onSuccess }: { deduction: StatutoryDeduction | null; onClose: () => void; onSuccess: () => void }) {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<DeductionFormData>({
    defaultValues: {
      name: deduction?.name || '', description: deduction?.description || '',
      is_percentage: deduction?.is_percentage || false, amount: deduction?.amount || '',
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
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-elevated max-w-lg w-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-900">{deduction ? 'Edit Statutory Deduction' : 'Add Statutory Deduction'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><FiX className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Name <span className="text-red-500">*</span></label>
            <input type="text" {...register('name', { required: 'Name is required' })} className="input-field" placeholder="e.g., Union Dues" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea {...register('description')} rows={2} className="input-field resize-none" placeholder="Optional description" />
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('is_percentage')} className="w-4 h-4 text-accent-600 border-slate-300 rounded focus:ring-accent-500" />
              <span className="text-sm text-slate-700">Percentage of basic salary</span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount <span className="text-red-500">*</span></label>
            <div className="relative">
              {!isPercentage && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">₦</span>}
              <input
                type="number" step="0.01"
                {...register('amount', { required: 'Amount is required', min: { value: 0, message: 'Amount must be positive' } })}
                className={`input-field ${isPercentage ? '' : 'pl-8'} ${isPercentage ? 'pr-10' : ''}`}
                placeholder={isPercentage ? "5.00" : "10000.00"}
              />
              {isPercentage && <FiPercent className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />}
            </div>
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('is_active')} className="w-4 h-4 text-accent-600 border-slate-300 rounded focus:ring-accent-500" />
              <span className="text-sm text-slate-700">Active</span>
            </label>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving...' : deduction ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
