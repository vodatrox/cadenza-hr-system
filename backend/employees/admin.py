"""
Admin configuration for employees app.
"""
from django.contrib import admin
from .models import Employee, Department, Allowance, Deduction, EmployeeDocument


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    """Admin for Department model."""
    list_display = ('name', 'client', 'head_of_department', 'created_at')
    list_filter = ('client', 'created_at')
    search_fields = ('name', 'description')
    ordering = ('client', 'name')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    """Admin for Employee model."""
    list_display = (
        'employee_id', 'get_full_name', 'email', 'position',
        'department', 'client', 'status', 'date_hired'
    )
    list_filter = ('status', 'employment_type', 'gender', 'department', 'client', 'date_hired')
    search_fields = ('employee_id', 'first_name', 'last_name', 'email', 'position')
    ordering = ('-date_hired',)
    readonly_fields = ('created_at', 'updated_at', 'years_of_service')

    fieldsets = (
        ('Personal Information', {
            'fields': (
                'employee_id', 'first_name', 'middle_name', 'last_name',
                'email', 'phone', 'date_of_birth', 'gender', 'photo'
            )
        }),
        ('Address', {
            'fields': ('address', 'city', 'state', 'country')
        }),
        ('Employment Information', {
            'fields': (
                'client', 'department', 'position', 'date_hired',
                'employment_type', 'status'
            )
        }),
        ('Salary Information', {
            'fields': ('basic_salary', 'bank_name', 'account_number', 'account_name')
        }),
        ('Documents', {
            'fields': ('resume', 'contract')
        }),
        ('Emergency Contact', {
            'fields': (
                'emergency_contact_name', 'emergency_contact_phone',
                'emergency_contact_relationship'
            )
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'years_of_service')
        }),
    )

    def get_full_name(self, obj):
        return obj.get_full_name()
    get_full_name.short_description = 'Full Name'


@admin.register(Allowance)
class AllowanceAdmin(admin.ModelAdmin):
    """Admin for Allowance model."""
    list_display = ('name', 'employee', 'amount', 'is_taxable', 'is_recurring', 'client')
    list_filter = ('is_taxable', 'is_recurring', 'client', 'created_at')
    search_fields = ('name', 'employee__first_name', 'employee__last_name')
    ordering = ('employee', 'name')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Deduction)
class DeductionAdmin(admin.ModelAdmin):
    """Admin for Deduction model."""
    list_display = ('name', 'employee', 'amount', 'is_recurring', 'client')
    list_filter = ('is_recurring', 'client', 'created_at')
    search_fields = ('name', 'employee__first_name', 'employee__last_name')
    ordering = ('employee', 'name')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(EmployeeDocument)
class EmployeeDocumentAdmin(admin.ModelAdmin):
    """Admin for EmployeeDocument model."""
    list_display = ('name', 'employee', 'file_type', 'file_size', 'client', 'created_at')
    list_filter = ('file_type', 'client', 'created_at')
    search_fields = ('name', 'description', 'employee__first_name', 'employee__last_name')
    ordering = ('-created_at',)
    readonly_fields = ('file_size', 'file_type', 'created_at', 'updated_at')
