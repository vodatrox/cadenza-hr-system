"""
Serializers for employees app.
"""
from rest_framework import serializers
from .models import Employee, Department, Allowance, Deduction, EmployeeDocument


class DepartmentSerializer(serializers.ModelSerializer):
    """Serializer for Department model."""
    head_of_department_name = serializers.CharField(
        source='head_of_department.get_full_name',
        read_only=True
    )
    employee_count = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = (
            'id', 'name', 'description', 'head_of_department',
            'head_of_department_name', 'employee_count',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_employee_count(self, obj):
        """Get count of employees in department."""
        return obj.employees.filter(status='ACTIVE').count()


class AllowanceSerializer(serializers.ModelSerializer):
    """Serializer for Allowance model."""

    class Meta:
        model = Allowance
        fields = (
            'id', 'employee', 'name', 'amount', 'is_taxable',
            'is_recurring', 'description', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class DeductionSerializer(serializers.ModelSerializer):
    """Serializer for Deduction model."""

    class Meta:
        model = Deduction
        fields = (
            'id', 'employee', 'name', 'amount', 'is_recurring',
            'description', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class EmployeeListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for employee list."""
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    photo_url = serializers.SerializerMethodField()
    is_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = Employee
        fields = (
            'id', 'employee_id', 'first_name', 'last_name', 'full_name',
            'email', 'phone', 'position', 'department_name', 'status',
            'photo_url', 'date_hired', 'basic_salary', 'is_active'
        )

    def get_photo_url(self, obj):
        """Get full URL for photo."""
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return None


class EmployeeDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for Employee model."""
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    years_of_service = serializers.IntegerField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    photo_url = serializers.SerializerMethodField()
    allowances = AllowanceSerializer(many=True, read_only=True)
    deductions = DeductionSerializer(many=True, read_only=True)
    documents = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = (
            'id', 'employee_id', 'first_name', 'last_name', 'middle_name',
            'full_name', 'email', 'phone', 'date_of_birth', 'gender',
            'photo', 'photo_url', 'address', 'city', 'state', 'country',
            'department', 'department_name', 'position', 'date_hired',
            'employment_type', 'status', 'basic_salary', 'bank_name',
            'account_number', 'account_name', 'routing_code', 'account_type',
            'tax_id', 'pension_number', 'resume', 'contract',
            'emergency_contact_name', 'emergency_contact_phone',
            'emergency_contact_relationship', 'years_of_service',
            'is_active', 'allowances', 'deductions', 'documents',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_photo_url(self, obj):
        """Get full URL for photo."""
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return None

    def get_documents(self, obj):
        """Get employee documents."""
        from .serializers import EmployeeDocumentSerializer
        documents = obj.documents.all()
        return EmployeeDocumentSerializer(documents, many=True, context=self.context).data


class EmployeeCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating employees."""

    class Meta:
        model = Employee
        fields = (
            'employee_id', 'first_name', 'last_name', 'middle_name',
            'email', 'phone', 'date_of_birth', 'gender', 'photo',
            'address', 'city', 'state', 'country', 'department',
            'position', 'date_hired', 'employment_type', 'status',
            'basic_salary', 'bank_name', 'account_number', 'account_name',
            'routing_code', 'account_type', 'tax_id', 'pension_number',
            'resume', 'contract', 'emergency_contact_name',
            'emergency_contact_phone', 'emergency_contact_relationship'
        )

    def validate_employee_id(self, value):
        """Validate employee ID is unique."""
        if Employee.objects.filter(employee_id=value).exists():
            raise serializers.ValidationError("An employee with this ID already exists.")
        return value

    def validate_email(self, value):
        """Validate email is unique within client."""
        request = self.context.get('request')
        if request and hasattr(request, 'current_client') and request.current_client:
            if Employee.objects.filter(
                client=request.current_client,
                email=value
            ).exists():
                raise serializers.ValidationError(
                    "An employee with this email already exists for this client."
                )
        return value

    def create(self, validated_data):
        """Create employee with client from request context."""
        request = self.context.get('request')
        if request and hasattr(request, 'current_client'):
            validated_data['client'] = request.current_client
        return super().create(validated_data)


class EmployeeDocumentSerializer(serializers.ModelSerializer):
    """Serializer for Employee Document model."""
    file_url = serializers.SerializerMethodField()
    file_size_display = serializers.SerializerMethodField()

    class Meta:
        model = EmployeeDocument
        fields = (
            'id', 'employee', 'name', 'description', 'file', 'file_url',
            'file_size', 'file_size_display', 'file_type',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'file_size', 'file_type', 'created_at', 'updated_at')

    def get_file_url(self, obj):
        """Get full URL for file."""
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

    def get_file_size_display(self, obj):
        """Get human-readable file size."""
        if not obj.file_size:
            return None

        size = obj.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} TB"

    def create(self, validated_data):
        """Create document with client from request context."""
        request = self.context.get('request')
        if request and hasattr(request, 'current_client'):
            validated_data['client'] = request.current_client
        return super().create(validated_data)
