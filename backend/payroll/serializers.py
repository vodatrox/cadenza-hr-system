"""
Serializers for payroll app.
"""
from rest_framework import serializers
from .models import (
    PayrollSettings, StatutoryEarning, StatutoryDeduction,
    PayrollPeriod, PayrollBatch, Payroll, PayrollEarning, PayrollDeduction
)
from employees.models import Employee


class PayrollSettingsSerializer(serializers.ModelSerializer):
    """Serializer for PayrollSettings model."""

    class Meta:
        model = PayrollSettings
        fields = (
            'id', 'enable_pension', 'pension_rate', 'enable_nhf', 'nhf_rate',
            'enable_tax', 'tax_free_allowance', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class StatutoryEarningSerializer(serializers.ModelSerializer):
    """Serializer for StatutoryEarning model."""

    class Meta:
        model = StatutoryEarning
        fields = (
            'id', 'name', 'description', 'is_percentage', 'amount',
            'is_taxable', 'is_active', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class StatutoryDeductionSerializer(serializers.ModelSerializer):
    """Serializer for StatutoryDeduction model."""

    class Meta:
        model = StatutoryDeduction
        fields = (
            'id', 'name', 'description', 'is_percentage', 'amount',
            'is_active', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class PayrollPeriodSerializer(serializers.ModelSerializer):
    """Serializer for PayrollPeriod model."""
    total_gross_pay = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_net_pay = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_deductions = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_tax = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    payroll_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = PayrollPeriod
        fields = (
            'id', 'title', 'period_type', 'start_date', 'end_date', 'payment_date',
            'status', 'notes', 'total_gross_pay', 'total_net_pay', 'total_deductions',
            'total_tax', 'payroll_count', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def validate(self, data):
        """Validate dates."""
        if 'end_date' in data and 'start_date' in data:
            if data['end_date'] <= data['start_date']:
                raise serializers.ValidationError({
                    'end_date': 'End date must be after start date.'
                })
        return data


class PayrollBatchSerializer(serializers.ModelSerializer):
    """Serializer for PayrollBatch model."""
    period_name = serializers.CharField(source='period.title', read_only=True)
    total_gross_pay = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_net_pay = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_deductions = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    payroll_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = PayrollBatch
        fields = (
            'id', 'batch_number', 'title', 'period', 'period_name', 'status',
            'description', 'total_gross_pay', 'total_net_pay', 'total_deductions',
            'payroll_count', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'batch_number', 'created_at', 'updated_at')


class PayrollEarningSerializer(serializers.ModelSerializer):
    """Serializer for PayrollEarning model."""

    class Meta:
        model = PayrollEarning
        fields = ('id', 'payroll', 'name', 'amount', 'description', 'is_recurring', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class PayrollDeductionSerializer(serializers.ModelSerializer):
    """Serializer for PayrollDeduction model."""

    class Meta:
        model = PayrollDeduction
        fields = ('id', 'payroll', 'name', 'amount', 'description', 'is_recurring', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class PayrollListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for payroll list."""
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    employee_id_number = serializers.CharField(source='employee.employee_id', read_only=True)
    period_name = serializers.CharField(source='period.title', read_only=True)
    batch_number = serializers.CharField(source='batch.batch_number', read_only=True)

    class Meta:
        model = Payroll
        fields = (
            'id', 'employee', 'employee_name', 'employee_id_number', 'period', 'period_name',
            'batch', 'batch_number', 'status', 'gross_pay', 'total_deductions', 'net_pay',
            'created_at', 'updated_at'
        )


class PayrollDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for Payroll model."""
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    employee_id_number = serializers.CharField(source='employee.employee_id', read_only=True)
    period_details = PayrollPeriodSerializer(source='period', read_only=True)
    batch_details = PayrollBatchSerializer(source='batch', read_only=True)
    earnings = PayrollEarningSerializer(many=True, read_only=True)
    deductions = PayrollDeductionSerializer(many=True, read_only=True)

    class Meta:
        model = Payroll
        fields = (
            'id', 'employee', 'employee_name', 'employee_id_number', 'period', 'period_details',
            'batch', 'batch_details', 'status', 'basic_salary', 'total_allowances',
            'total_statutory_earnings', 'total_additional_earnings', 'gross_pay', 'pension',
            'nhf', 'tax', 'total_statutory_deductions', 'other_deductions',
            'total_additional_deductions', 'total_deductions', 'net_pay', 'payment_date',
            'payment_reference', 'notes', 'earnings', 'deductions', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class PayrollCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating payroll."""

    class Meta:
        model = Payroll
        fields = ('employee', 'period')

    def validate(self, data):
        """Validate that payroll doesn't already exist."""
        if Payroll.objects.filter(employee=data['employee'], period=data['period']).exists():
            raise serializers.ValidationError('Payroll already exists for this employee and period.')
        return data

    def create(self, validated_data):
        """Create payroll and calculate amounts."""
        request = self.context.get('request')
        if request and hasattr(request, 'current_client'):
            validated_data['client'] = request.current_client

        payroll = Payroll(**validated_data)
        payroll.calculate()
        payroll.save()
        return payroll


class BulkPayrollCreateSerializer(serializers.Serializer):
    """Serializer for bulk payroll creation."""
    period = serializers.PrimaryKeyRelatedField(queryset=PayrollPeriod.objects.all())
    employee_ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False
    )

    def validate_period(self, value):
        """Validate period belongs to current client."""
        request = self.context.get('request')
        if request and hasattr(request, 'current_client'):
            if value.client != request.current_client:
                raise serializers.ValidationError("Period does not belong to your organization.")
        return value

    def validate_employee_ids(self, value):
        """Validate all employees exist and belong to current client."""
        request = self.context.get('request')
        if request and hasattr(request, 'current_client'):
            existing_count = Employee.objects.filter(
                id__in=value,
                client=request.current_client
            ).count()
            if existing_count != len(value):
                raise serializers.ValidationError("Some employees do not exist or don't belong to your organization.")
        return value
