"""
URL configuration for payroll app.
"""
from django.urls import path
from .views import (
    PayrollSettingsView, PayrollPeriodListCreateView, PayrollPeriodDetailView,
    PayrollListCreateView, PayrollDetailView, BulkPayrollCreateView,
    PayrollStatsView, PayrollItemListCreateView, PayrollItemDetailView
)

app_name = 'payroll'

urlpatterns = [
    # Settings
    path('settings/', PayrollSettingsView.as_view(), name='payroll_settings'),

    # Periods
    path('periods/', PayrollPeriodListCreateView.as_view(), name='period_list_create'),
    path('periods/<int:pk>/', PayrollPeriodDetailView.as_view(), name='period_detail'),

    # Payrolls
    path('', PayrollListCreateView.as_view(), name='payroll_list_create'),
    path('<int:pk>/', PayrollDetailView.as_view(), name='payroll_detail'),
    path('bulk-create/', BulkPayrollCreateView.as_view(), name='bulk_create'),
    path('stats/', PayrollStatsView.as_view(), name='payroll_stats'),

    # Payroll Items
    path('items/', PayrollItemListCreateView.as_view(), name='item_list_create'),
    path('items/<int:pk>/', PayrollItemDetailView.as_view(), name='item_detail'),
]
