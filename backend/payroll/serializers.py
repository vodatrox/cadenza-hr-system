"""
Serializers for payroll app.
"""
from rest_framework import serializers
from .models import PayrollSettings, PayrollPeriod, Payroll, PayrollItem
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


class PayrollPeriodSerializer(serializers.ModelSerializer):
    """Serializer for PayrollPeriod model."""
    total_gross_pay = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True
    )
    total_net_pay = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True
    )
    total_deductions = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True
    )
    payroll_count = serializers.SerializerMethodField()

    class Meta:
        model = PayrollPeriod
        fields = (
            'id', 'period_type', 'start_date', 'end_date', 'payment_date',
            'status', 'notes', 'total_gross_pay', 'total_net_pay',
            'total_deductions', 'payroll_count', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_payroll_count(self, obj):
        """Get count of payrolls in this period."""
        return obj.payrolls.count()

    def validate(self, data):
        """Validate that end_date is after start_date."""
        if data['end_date'] <= data['start_date']:
            raise serializers.ValidationError({
                'end_date': 'End date must be after start date.'
            })
        return data


class PayrollItemSerializer(serializers.ModelSerializer):
    """Serializer for PayrollItem model."""

    class Meta:
        model = PayrollItem
        fields = (
            'id', 'payroll', 'name', 'item_type', 'amount',
            'description', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class PayrollListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for payroll list."""
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    period_name = serializers.SerializerMethodField()

    class Meta:
        model = Payroll
        fields = (
            'id', 'employee', 'employee_name', 'employee_id',
            'period', 'period_name', 'status', 'basic_salary',
            'gross_pay', 'total_deductions', 'net_pay', 'payment_date'
        )

    def get_period_name(self, obj):
        """Get formatted period name."""
        return f"{obj.period.start_date} to {obj.period.end_date}"


class PayrollDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for Payroll model."""
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    period_details = PayrollPeriodSerializer(source='period', read_only=True)
    items = PayrollItemSerializer(many=True, read_only=True)

    class Meta:
        model = Payroll
        fields = (
            'id', 'employee', 'employee_name', 'employee_id', 'period',
            'period_details', 'status', 'basic_salary', 'total_allowances',
            'gross_pay', 'pension', 'nhf', 'tax', 'other_deductions',
            'total_deductions', 'net_pay', 'payment_date',
            'payment_reference', 'notes', 'items', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class PayrollCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating payroll."""

    class Meta:
        model = Payroll
        fields = ('employee', 'period')

    def validate(self, data):
        """Validate that payroll doesn't already exist for employee and period."""
        employee = data['employee']
        period = data['period']

        if Payroll.objects.filter(employee=employee, period=period).exists():
            raise serializers.ValidationError(
                'Payroll already exists for this employee and period.'
            )

        return data

    def create(self, validated_data):
        """Create payroll and calculate it."""
        request = self.context.get('request')
        if request and hasattr(request, 'current_client'):
            validated_data['client'] = request.current_client

        payroll = Payroll(**validated_data)

        # Get settings for this client
        try:
            settings = PayrollSettings.objects.get(client=validated_data['client'])
        except PayrollSettings.DoesNotExist:
            settings = PayrollSettings.objects.create(client=validated_data['client'])

        # Calculate payroll
        payroll.calculate(settings)
        payroll.save()

        return payroll


class BulkPayrollCreateSerializer(serializers.Serializer):
    """Serializer for bulk payroll creation."""
    period = serializers.PrimaryKeyRelatedField(queryset=PayrollPeriod.objects.all())
    employee_ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False
    )

    def validate_employee_ids(self, value):
        """Validate that all employee IDs exist."""
        request = self.context.get('request')
        if request and hasattr(request, 'current_client'):
            existing_ids = Employee.objects.filter(
                id__in=value,
                client=request.current_client,
                status='ACTIVE'
            ).values_list('id', flat=True)

            if len(existing_ids) != len(value):
                raise serializers.ValidationError(
                    'Some employee IDs are invalid or employees are not active.'
                )

        return value
