"""
Models for employee management.
"""
from django.db import models
from django.core.validators import EmailValidator
from core.models import TenantModel


class Department(TenantModel):
    """Model representing a department within a client company."""

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    head_of_department = models.ForeignKey(
        'Employee',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='headed_departments'
    )

    class Meta:
        db_table = 'departments'
        verbose_name = 'Department'
        verbose_name_plural = 'Departments'
        unique_together = ('client', 'name')
        ordering = ['name']

    def __str__(self):
        return f"{self.name} - {self.client.name}"


class Employee(TenantModel):
    """Model representing an employee."""

    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('INACTIVE', 'Inactive'),
        ('ON_LEAVE', 'On Leave'),
        ('TERMINATED', 'Terminated'),
        ('PROBATION', 'Probation'),
        ('SUSPENDED', 'Suspended'),
    ]

    GENDER_CHOICES = [
        ('MALE', 'Male'),
        ('FEMALE', 'Female'),
        ('OTHER', 'Other'),
    ]

    # Personal Information
    employee_id = models.CharField(max_length=50, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True)
    email = models.EmailField(validators=[EmailValidator()])
    phone = models.CharField(max_length=20)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    photo = models.ImageField(upload_to='employee_photos/', null=True, blank=True)

    # Address
    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    country = models.CharField(max_length=100, default='Nigeria')

    # Employment Information
    department = models.ForeignKey(Department, on_delete=models.PROTECT, related_name='employees')
    position = models.CharField(max_length=100)
    date_hired = models.DateField()
    employment_type = models.CharField(
        max_length=50,
        choices=[
            ('FULL_TIME', 'Full Time'),
            ('PART_TIME', 'Part Time'),
            ('CONTRACT', 'Contract'),
            ('INTERN', 'Intern'),
        ],
        default='FULL_TIME'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')

    # Salary Information
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2)
    bank_name = models.CharField(max_length=100, blank=True)
    account_number = models.CharField(max_length=20, blank=True)
    account_name = models.CharField(max_length=255, blank=True)
    routing_code = models.CharField(max_length=50, blank=True)  # IFSC/Routing code
    account_type = models.CharField(
        max_length=20,
        choices=[('SAVINGS', 'Savings'), ('CURRENT', 'Current')],
        default='SAVINGS',
        blank=True
    )

    # Tax & Statutory Information
    tax_id = models.CharField(max_length=50, blank=True)  # Tax Identification Number
    pension_number = models.CharField(max_length=50, blank=True)  # Pension PIN

    # Documents
    resume = models.FileField(upload_to='employee_documents/resumes/', null=True, blank=True)
    contract = models.FileField(upload_to='employee_documents/contracts/', null=True, blank=True)

    # Emergency Contact
    emergency_contact_name = models.CharField(max_length=255, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)
    emergency_contact_relationship = models.CharField(max_length=50, blank=True)

    class Meta:
        db_table = 'employees'
        verbose_name = 'Employee'
        verbose_name_plural = 'Employees'
        ordering = ['-date_hired']
        indexes = [
            models.Index(fields=['employee_id']),
            models.Index(fields=['status']),
            models.Index(fields=['client', 'status']),
        ]

    def __str__(self):
        return f"{self.get_full_name()} ({self.employee_id})"

    def get_full_name(self):
        """Return employee's full name."""
        if self.middle_name:
            return f"{self.first_name} {self.middle_name} {self.last_name}"
        return f"{self.first_name} {self.last_name}"

    @property
    def is_active(self):
        """Check if employee is active."""
        return self.status == 'ACTIVE'

    @property
    def years_of_service(self):
        """Calculate years of service."""
        from django.utils import timezone
        today = timezone.now().date()
        delta = today - self.date_hired
        return delta.days // 365


class Allowance(TenantModel):
    """Model for employee allowances."""

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='allowances')
    name = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    is_taxable = models.BooleanField(default=True)
    is_recurring = models.BooleanField(default=True)
    description = models.TextField(blank=True)

    class Meta:
        db_table = 'allowances'
        verbose_name = 'Allowance'
        verbose_name_plural = 'Allowances'
        ordering = ['employee', 'name']

    def __str__(self):
        return f"{self.name} - {self.employee.get_full_name()}"


class Deduction(TenantModel):
    """Model for employee deductions (non-statutory)."""

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='deductions')
    name = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    is_recurring = models.BooleanField(default=True)
    description = models.TextField(blank=True)

    class Meta:
        db_table = 'deductions'
        verbose_name = 'Deduction'
        verbose_name_plural = 'Deductions'
        ordering = ['employee', 'name']

    def __str__(self):
        return f"{self.name} - {self.employee.get_full_name()}"


class EmployeeDocument(TenantModel):
    """Model for employee documents."""

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='documents')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    file = models.FileField(upload_to='employee_documents/')
    file_size = models.IntegerField(help_text='File size in bytes', null=True, blank=True)
    file_type = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = 'employee_documents'
        verbose_name = 'Employee Document'
        verbose_name_plural = 'Employee Documents'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.employee.get_full_name()}"

    def save(self, *args, **kwargs):
        """Save file metadata."""
        if self.file:
            self.file_size = self.file.size
            self.file_type = self.file.name.split('.')[-1].upper() if '.' in self.file.name else 'FILE'
        super().save(*args, **kwargs)
