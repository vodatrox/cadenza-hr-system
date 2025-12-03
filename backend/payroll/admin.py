"""
Admin configuration for payroll app.
"""
from django.contrib import admin
from .models import (
    PayrollSettings, StatutoryEarning, StatutoryDeduction,
    PayrollPeriod, Payroll, PayrollEarning, PayrollDeduction
)


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


@admin.register(StatutoryEarning)
class StatutoryEarningAdmin(admin.ModelAdmin):
    """Admin for StatutoryEarning model."""
    list_display = ('name', 'client', 'is_percentage', 'amount', 'is_taxable', 'is_active')
    list_filter = ('is_percentage', 'is_taxable', 'is_active', 'client')
    search_fields = ('name', 'description', 'client__name')
    ordering = ('client', 'name')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(StatutoryDeduction)
class StatutoryDeductionAdmin(admin.ModelAdmin):
    """Admin for StatutoryDeduction model."""
    list_display = ('name', 'client', 'is_percentage', 'amount', 'is_active')
    list_filter = ('is_percentage', 'is_active', 'client')
    search_fields = ('name', 'description', 'client__name')
    ordering = ('client', 'name')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(PayrollPeriod)
class PayrollPeriodAdmin(admin.ModelAdmin):
    """Admin for PayrollPeriod model."""
    list_display = (
        'title', 'client', 'period_type', 'start_date', 'end_date',
        'payment_date', 'status', 'created_at'
    )
    list_filter = ('status', 'period_type', 'client', 'start_date')
    search_fields = ('title', 'client__name')
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


@admin.register(PayrollEarning)
class PayrollEarningAdmin(admin.ModelAdmin):
    """Admin for PayrollEarning model."""
    list_display = ('name', 'payroll', 'amount', 'is_recurring', 'client')
    list_filter = ('is_recurring', 'client', 'created_at')
    search_fields = ('name', 'payroll__employee__first_name', 'payroll__employee__last_name')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(PayrollDeduction)
class PayrollDeductionAdmin(admin.ModelAdmin):
    """Admin for PayrollDeduction model."""
    list_display = ('name', 'payroll', 'amount', 'is_recurring', 'client')
    list_filter = ('is_recurring', 'client', 'created_at')
    search_fields = ('name', 'payroll__employee__first_name', 'payroll__employee__last_name')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')
