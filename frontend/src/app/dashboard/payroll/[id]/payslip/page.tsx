'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiDownload, FiPrinter, FiMail } from 'react-icons/fi';
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

    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    if (!currentClient) {
      router.push('/clients');
      return;
    }

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

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!payroll) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Action Bar - Hidden on print */}
      <div className="print:hidden bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push(`/dashboard/payroll/${payrollId}`)}
              className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiArrowLeft />
              Back to Payroll
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FiPrinter />
                Print
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiDownload />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payslip Content */}
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none">
          {/* Header */}
          <div className="bg-blue-600 text-white p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{currentClient?.name}</h1>
                <p className="text-blue-100">{currentClient?.address}</p>
                <p className="text-blue-100">{currentClient?.email} | {currentClient?.phone}</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold">PAYSLIP</p>
                <p className="text-blue-100 mt-2">{payroll.period_name}</p>
              </div>
            </div>
          </div>

          {/* Employee Information */}
          <div className="p-8 border-b border-gray-200">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">EMPLOYEE DETAILS</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-semibold text-gray-900">{payroll.employee_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Employee ID</p>
                    <p className="font-semibold text-gray-900">#{payroll.employee_id_number}</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">PAY PERIOD</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">Period</p>
                    <p className="font-semibold text-gray-900">{payroll.period_name}</p>
                  </div>
                  {payroll.payment_date && (
                    <div>
                      <p className="text-sm text-gray-600">Payment Date</p>
                      <p className="font-semibold text-gray-900">{formatDate(payroll.payment_date)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Earnings & Deductions */}
          <div className="p-8">
            <div className="grid grid-cols-2 gap-12">
              {/* Earnings */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-600">
                  EARNINGS
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Basic Salary</span>
                    <span className="font-medium text-gray-900">
                      ₦{parseFloat(payroll.basic_salary).toLocaleString()}
                    </span>
                  </div>

                  {parseFloat(payroll.total_allowances) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">Allowances</span>
                      <span className="font-medium text-gray-900">
                        ₦{parseFloat(payroll.total_allowances).toLocaleString()}
                      </span>
                    </div>
                  )}

                  {payroll.statutory_earnings_breakdown && payroll.statutory_earnings_breakdown.length > 0 ? (
                    payroll.statutory_earnings_breakdown.map((earning) => (
                      <div key={earning.id} className="flex justify-between">
                        <span className="text-gray-700">{earning.name}</span>
                        <span className="font-medium text-gray-900">
                          ₦{parseFloat(earning.amount).toLocaleString()}
                        </span>
                      </div>
                    ))
                  ) : parseFloat(payroll.total_statutory_earnings) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">Statutory Earnings</span>
                      <span className="font-medium text-gray-900">
                        ₦{parseFloat(payroll.total_statutory_earnings).toLocaleString()}
                      </span>
                    </div>
                  )}

                  {payroll.earnings && payroll.earnings.map((earning) => (
                    <div key={earning.id} className="flex justify-between">
                      <span className="text-gray-700">{earning.name}</span>
                      <span className="font-medium text-gray-900">
                        ₦{parseFloat(earning.amount).toLocaleString()}
                      </span>
                    </div>
                  ))}

                  <div className="pt-3 mt-3 border-t-2 border-gray-300 flex justify-between font-bold text-lg">
                    <span className="text-gray-900">Gross Pay</span>
                    <span className="text-blue-600">
                      ₦{parseFloat(payroll.gross_pay).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b-2 border-red-600">
                  DEDUCTIONS
                </h3>
                <div className="space-y-3">
                  {parseFloat(payroll.pension) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">Pension</span>
                      <span className="font-medium text-gray-900">
                        ₦{parseFloat(payroll.pension).toLocaleString()}
                      </span>
                    </div>
                  )}

                  {parseFloat(payroll.nhf) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">NHF</span>
                      <span className="font-medium text-gray-900">
                        ₦{parseFloat(payroll.nhf).toLocaleString()}
                      </span>
                    </div>
                  )}

                  {parseFloat(payroll.tax) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">Income Tax</span>
                      <span className="font-medium text-gray-900">
                        ₦{parseFloat(payroll.tax).toLocaleString()}
                      </span>
                    </div>
                  )}

                  {payroll.statutory_deductions_breakdown && payroll.statutory_deductions_breakdown.length > 0 ? (
                    payroll.statutory_deductions_breakdown.map((deduction) => (
                      <div key={deduction.id} className="flex justify-between">
                        <span className="text-gray-700">{deduction.name}</span>
                        <span className="font-medium text-gray-900">
                          ₦{parseFloat(deduction.amount).toLocaleString()}
                        </span>
                      </div>
                    ))
                  ) : parseFloat(payroll.total_statutory_deductions) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">Other Statutory</span>
                      <span className="font-medium text-gray-900">
                        ₦{parseFloat(payroll.total_statutory_deductions).toLocaleString()}
                      </span>
                    </div>
                  )}

                  {payroll.deductions && payroll.deductions.map((deduction) => (
                    <div key={deduction.id} className="flex justify-between">
                      <span className="text-gray-700">{deduction.name}</span>
                      <span className="font-medium text-gray-900">
                        ₦{parseFloat(deduction.amount).toLocaleString()}
                      </span>
                    </div>
                  ))}

                  <div className="pt-3 mt-3 border-t-2 border-gray-300 flex justify-between font-bold text-lg">
                    <span className="text-gray-900">Total Deductions</span>
                    <span className="text-red-600">
                      ₦{parseFloat(payroll.total_deductions).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Net Pay */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-t-2 border-emerald-200 p-8 print:border-t print:border-gray-300 print:bg-white">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-emerald-900 uppercase tracking-wide mb-3 print:text-gray-700">Take Home Pay</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-bold text-gray-900 tracking-tight">
                    ₦{parseFloat(payroll.net_pay).toLocaleString()}
                  </span>
                  <span className="text-lg text-gray-500 font-medium">.00</span>
                </div>
                <p className="text-sm text-gray-600 mt-3">Net amount after all deductions</p>
              </div>
              <div className="hidden md:flex print:hidden items-center justify-center w-28 h-28 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/20">
                <div className="text-center text-white">
                  <div className="text-3xl font-bold">₦</div>
                  <div className="text-xs font-medium mt-1 opacity-90">NGN</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="p-8 bg-gray-50 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              This is a computer-generated payslip and does not require a signature.
            </p>
            <p className="text-xs text-gray-500 text-center mt-2">
              For any queries regarding this payslip, please contact the HR department.
            </p>
          </div>
        </div>

        {/* Print Instructions */}
        <div className="print:hidden mt-6 text-center text-sm text-gray-500">
          <p>Click the Print button above to save this payslip as a PDF or print a physical copy.</p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          @page {
            margin: 0.5cm;
          }
        }
      `}</style>
    </div>
  );
}
