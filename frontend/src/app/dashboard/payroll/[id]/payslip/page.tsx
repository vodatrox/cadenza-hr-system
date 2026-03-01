'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiDownload, FiPrinter } from 'react-icons/fi';
import type { Payroll } from '@/types';

export default function PayslipPage() {
  const router = useRouter();
  const params = useParams();
  const payrollId = params.id as string;

  const { currentClient, isAuthenticated, _hasHydrated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [payroll, setPayroll] = useState<Payroll | null>(null);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated()) { router.push('/login'); return; }
    if (!currentClient) { router.push('/clients'); return; }
    fetchPayroll();
  }, [_hasHydrated, isAuthenticated, currentClient, payrollId]);

  const fetchPayroll = async () => {
    try {
      setLoading(true);
      const response = await api.get<Payroll>(`/payroll/${payrollId}/`);
      setPayroll(response.data);
    } catch (error: any) {
      toast.error('Failed to load payslip');
      router.push('/dashboard/payroll');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  const fmt = (val: string) => parseFloat(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-accent-600"></div>
      </div>
    );
  }

  if (!payroll) return null;

  // Collect all earnings into a flat list
  const earningLines: { label: string; amount: string }[] = [
    { label: 'Basic Salary', amount: payroll.basic_salary },
  ];
  if (parseFloat(payroll.total_allowances) > 0)
    earningLines.push({ label: 'Allowances', amount: payroll.total_allowances });
  if (payroll.statutory_earnings_breakdown?.length) {
    payroll.statutory_earnings_breakdown.forEach(e => earningLines.push({ label: e.name, amount: e.amount }));
  } else if (parseFloat(payroll.total_statutory_earnings) > 0) {
    earningLines.push({ label: 'Statutory Earnings', amount: payroll.total_statutory_earnings });
  }
  payroll.earnings?.forEach(e => earningLines.push({ label: e.name, amount: e.amount }));

  // Collect all deductions
  const deductionLines: { label: string; amount: string }[] = [];
  if (parseFloat(payroll.pension) > 0) deductionLines.push({ label: 'Pension', amount: payroll.pension });
  if (parseFloat(payroll.nhf) > 0) deductionLines.push({ label: 'NHF', amount: payroll.nhf });
  if (parseFloat(payroll.tax) > 0) deductionLines.push({ label: 'Income Tax (PAYE)', amount: payroll.tax });
  if (payroll.statutory_deductions_breakdown?.length) {
    payroll.statutory_deductions_breakdown.forEach(d => deductionLines.push({ label: d.name, amount: d.amount }));
  } else if (parseFloat(payroll.total_statutory_deductions) > 0) {
    deductionLines.push({ label: 'Other Statutory', amount: payroll.total_statutory_deductions });
  }
  payroll.deductions?.forEach(d => deductionLines.push({ label: d.name, amount: d.amount }));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Action Bar */}
      <div className="print:hidden bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-[800px] mx-auto px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => router.push(`/dashboard/payroll/${payrollId}`)}
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Payroll
          </button>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="btn-secondary text-sm">
              <FiPrinter className="w-4 h-4" />
              Print
            </button>
            <button onClick={handlePrint} className="btn-primary text-sm">
              <FiDownload className="w-4 h-4" />
              Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* Payslip Document */}
      <div className="max-w-[800px] mx-auto py-8 px-6 print:py-0 print:px-0">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden print:shadow-none print:border-0 print:rounded-none">

          {/* Document Header */}
          <div className="px-10 pt-10 pb-8 print:px-8 print:pt-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center print:bg-slate-800">
                    <span className="text-white font-bold text-sm">{currentClient?.name?.charAt(0) || 'C'}</span>
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-slate-900">{currentClient?.name}</h1>
                    <p className="text-xs text-slate-500">{currentClient?.email}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-1">Payslip</p>
                <p className="text-sm font-semibold text-slate-900">{payroll.period_name}</p>
                {payroll.payment_date && (
                  <p className="text-xs text-slate-500 mt-0.5">Paid {formatDate(payroll.payment_date)}</p>
                )}
              </div>
            </div>
          </div>

          {/* Employee Info Strip */}
          <div className="mx-10 print:mx-8 rounded-lg bg-slate-50 px-6 py-4 mb-8 print:bg-slate-50">
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Employee</p>
                <p className="text-sm font-semibold text-slate-900">{payroll.employee_name}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Employee ID</p>
                <p className="text-sm font-semibold text-slate-900">#{payroll.employee_id_number}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Period</p>
                <p className="text-sm font-semibold text-slate-900">{payroll.period_name}</p>
              </div>
            </div>
          </div>

          {/* Earnings & Deductions — Side by Side */}
          <div className="px-10 print:px-8 pb-8">
            <div className="grid grid-cols-2 gap-8">
              {/* Earnings */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Earnings</h3>
                </div>
                <div className="space-y-0">
                  {earningLines.map((line, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                      <span className="text-sm text-slate-600">{line.label}</span>
                      <span className="text-sm font-medium text-slate-900 tabular-nums">₦{fmt(line.amount)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-3 mt-1 border-t-2 border-slate-200">
                    <span className="text-sm font-semibold text-slate-900">Gross Pay</span>
                    <span className="text-sm font-bold text-emerald-700 tabular-nums">₦{fmt(payroll.gross_pay)}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Deductions</h3>
                </div>
                <div className="space-y-0">
                  {deductionLines.length > 0 ? deductionLines.map((line, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                      <span className="text-sm text-slate-600">{line.label}</span>
                      <span className="text-sm font-medium text-slate-900 tabular-nums">₦{fmt(line.amount)}</span>
                    </div>
                  )) : (
                    <div className="py-2.5 text-sm text-slate-400">No deductions</div>
                  )}
                  <div className="flex items-center justify-between pt-3 mt-1 border-t-2 border-slate-200">
                    <span className="text-sm font-semibold text-slate-900">Total Deductions</span>
                    <span className="text-sm font-bold text-red-600 tabular-nums">₦{fmt(payroll.total_deductions)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Net Pay */}
          <div className="mx-10 print:mx-8 mb-10 rounded-xl bg-slate-900 px-8 py-7 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Net Pay</p>
                <p className="text-3xl font-bold tracking-tight tabular-nums">
                  ₦{fmt(payroll.net_pay)}
                </p>
              </div>
              <div className="text-right hidden sm:block print:block">
                <p className="text-xs text-slate-400 mb-1">Breakdown</p>
                <p className="text-sm text-slate-300 tabular-nums">
                  ₦{fmt(payroll.gross_pay)} gross
                  <span className="mx-1.5 text-slate-600">-</span>
                  ₦{fmt(payroll.total_deductions)} deductions
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-10 print:px-8 py-6 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-slate-400">
                This is a computer-generated payslip and does not require a signature.
              </p>
              <p className="text-[11px] text-slate-400">
                {currentClient?.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body { background: white !important; }
          @page { margin: 1cm; }
        }
      `}</style>
    </div>
  );
}
