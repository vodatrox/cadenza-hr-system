"""
Admin configuration for payroll app.
"""
from django.contrib import admin
from .models import PayrollSettings, PayrollPeriod, Payroll, PayrollItem


@admin.register(PayrollSettings)
class PayrollSettingsAdmin(admin.ModelAdmin):
    """Admin for PayrollSettings model."""
    list_display = (
        'client', 'enable_pension', 'pension_rate', 'enable_nhf',
        'nhf_rate', 'enable_tax', 'tax_free_allowance', 'updated_at'
    )
    list_filter = ('enable_pension', 'enable_nhf', 'enable_tax', 'client')
    search_fields = ('client__name',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(PayrollPeriod)
class PayrollPeriodAdmin(admin.ModelAdmin):
    """Admin for PayrollPeriod model."""
    list_display = (
        'client', 'period_type', 'start_date', 'end_date',
        'payment_date', 'status', 'created_at'
    )
    list_filter = ('status', 'period_type', 'client', 'start_date')
    search_fields = ('client__name',)
    ordering = ('-start_date',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Payroll)
class PayrollAdmin(admin.ModelAdmin):
    """Admin for Payroll model."""
    list_display = (
        'employee', 'period', 'client', 'status', 'gross_pay',
        'total_deductions', 'net_pay', 'payment_date'
    )
    list_filter = ('status', 'client', 'period', 'payment_date')
    search_fields = (
        'employee__first_name', 'employee__last_name',
        'employee__employee_id', 'payment_reference'
    )
    ordering = ('-period__start_date', 'employee__first_name')
    readonly_fields = ('created_at', 'updated_at')

    fieldsets = (
        ('Basic Information', {
            'fields': ('employee', 'period', 'client', 'status')
        }),
        ('Earnings', {
            'fields': ('basic_salary', 'total_allowances', 'gross_pay')
        }),
        ('Deductions', {
            'fields': ('pension', 'nhf', 'tax', 'other_deductions', 'total_deductions')
        }),
        ('Payment', {
            'fields': ('net_pay', 'payment_date', 'payment_reference')
        }),
        ('Additional Info', {
            'fields': ('notes',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(PayrollItem)
class PayrollItemAdmin(admin.ModelAdmin):
    """Admin for PayrollItem model."""
    list_display = ('name', 'payroll', 'item_type', 'amount', 'client')
    list_filter = ('item_type', 'client', 'created_at')
    search_fields = ('name', 'payroll__employee__first_name', 'payroll__employee__last_name')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')
