"""
URL configuration for payroll app.
"""
from django.urls import path
from .views import (
    # Settings
    PayrollSettingsView,

    # Statutory Earnings & Deductions
    StatutoryEarningListCreateView, StatutoryEarningDetailView,
    StatutoryDeductionListCreateView, StatutoryDeductionDetailView,

    # Payroll Periods
    PayrollPeriodListCreateView, PayrollPeriodDetailView,

    # Payroll Batches
    PayrollBatchListCreateView, PayrollBatchDetailView, PayrollBatchActionsView,

    # Payrolls
    PayrollListCreateView, PayrollDetailView,
    BulkPayrollCreateView, PayrollStatsView,

    # Payroll Earnings & Deductions
    PayrollEarningListCreateView, PayrollEarningDetailView,
    PayrollDeductionListCreateView, PayrollDeductionDetailView,

    # Exports
    PayrollBatchExportExcelView, PayrollBatchExportPDFView,
    PayslipPDFExportView,
)

app_name = 'payroll'

urlpatterns = [
    # ========== SETTINGS ==========
    path('settings/', PayrollSettingsView.as_view(), name='payroll_settings'),

    # ========== STATUTORY EARNINGS ==========
    path('statutory-earnings/', StatutoryEarningListCreateView.as_view(), name='statutory_earning_list_create'),
    path('statutory-earnings/<int:pk>/', StatutoryEarningDetailView.as_view(), name='statutory_earning_detail'),

    # ========== STATUTORY DEDUCTIONS ==========
    path('statutory-deductions/', StatutoryDeductionListCreateView.as_view(), name='statutory_deduction_list_create'),
    path('statutory-deductions/<int:pk>/', StatutoryDeductionDetailView.as_view(), name='statutory_deduction_detail'),

    # ========== PAYROLL PERIODS ==========
    path('periods/', PayrollPeriodListCreateView.as_view(), name='period_list_create'),
    path('periods/<int:pk>/', PayrollPeriodDetailView.as_view(), name='period_detail'),

    # ========== PAYROLL BATCHES ==========
    path('batches/', PayrollBatchListCreateView.as_view(), name='batch_list_create'),
    path('batches/<int:pk>/', PayrollBatchDetailView.as_view(), name='batch_detail'),
    path('batches/<int:pk>/actions/', PayrollBatchActionsView.as_view(), name='batch_actions'),

    # ========== PAYROLLS ==========
    path('', PayrollListCreateView.as_view(), name='payroll_list_create'),
    path('<int:pk>/', PayrollDetailView.as_view(), name='payroll_detail'),
    path('bulk-create/', BulkPayrollCreateView.as_view(), name='bulk_create'),
    path('stats/', PayrollStatsView.as_view(), name='payroll_stats'),

    # ========== PAYROLL EARNINGS & DEDUCTIONS ==========
    path('earnings/', PayrollEarningListCreateView.as_view(), name='payroll_earning_list_create'),
    path('earnings/<int:pk>/', PayrollEarningDetailView.as_view(), name='payroll_earning_detail'),
    path('deductions/', PayrollDeductionListCreateView.as_view(), name='payroll_deduction_list_create'),
    path('deductions/<int:pk>/', PayrollDeductionDetailView.as_view(), name='payroll_deduction_detail'),

    # ========== EXPORTS ==========
    path('batches/<int:pk>/export/excel/', PayrollBatchExportExcelView.as_view(), name='batch_export_excel'),
    path('batches/<int:pk>/export/pdf/', PayrollBatchExportPDFView.as_view(), name='batch_export_pdf'),
    path('<int:pk>/payslip/export/', PayslipPDFExportView.as_view(), name='payslip_export_pdf'),
]
