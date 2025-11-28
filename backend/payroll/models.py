"""
Models for payroll management.
"""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal
from core.models import TenantModel
from employees.models import Employee


class PayrollSettings(TenantModel):
    """Model for client-specific payroll settings."""

    # Statutory deduction settings
    enable_pension = models.BooleanField(default=True)
    pension_rate = models.DecimalField(
        max_digits=5,
        decimal_places=4,
        default=Decimal('0.0800'),
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('1'))]
    )

    enable_nhf = models.BooleanField(default=True, help_text="National Housing Fund")
    nhf_rate = models.DecimalField(
        max_digits=5,
        decimal_places=4,
        default=Decimal('0.0250'),
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('1'))]
    )

    enable_tax = models.BooleanField(default=True)
    tax_free_allowance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('200000.00')
    )

    class Meta:
        db_table = 'payroll_settings'
        verbose_name = 'Payroll Setting'
        verbose_name_plural = 'Payroll Settings'

    def __str__(self):
        return f"Payroll Settings - {self.client.name}"


class PayrollPeriod(TenantModel):
    """Model representing a payroll period (usually monthly)."""

    PERIOD_CHOICES = [
        ('MONTHLY', 'Monthly'),
        ('WEEKLY', 'Weekly'),
        ('BI_WEEKLY', 'Bi-Weekly'),
    ]

    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('PROCESSING', 'Processing'),
        ('COMPLETED', 'Completed'),
        ('PAID', 'Paid'),
    ]

    period_type = models.CharField(max_length=20, choices=PERIOD_CHOICES, default='MONTHLY')
    start_date = models.DateField()
    end_date = models.DateField()
    payment_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'payroll_periods'
        verbose_name = 'Payroll Period'
        verbose_name_plural = 'Payroll Periods'
        ordering = ['-start_date']
        unique_together = ('client', 'start_date', 'end_date')

    def __str__(self):
        return f"{self.client.name} - {self.start_date} to {self.end_date}"

    @property
    def total_gross_pay(self):
        """Calculate total gross pay for this period."""
        return sum(payroll.gross_pay for payroll in self.payrolls.all())

    @property
    def total_net_pay(self):
        """Calculate total net pay for this period."""
        return sum(payroll.net_pay for payroll in self.payrolls.all())

    @property
    def total_deductions(self):
        """Calculate total deductions for this period."""
        return sum(payroll.total_deductions for payroll in self.payrolls.all())


class Payroll(TenantModel):
    """Model representing an individual employee's payroll for a period."""

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('PAID', 'Paid'),
        ('CANCELLED', 'Cancelled'),
    ]

    employee = models.ForeignKey(Employee, on_delete=models.PROTECT, related_name='payrolls')
    period = models.ForeignKey(PayrollPeriod, on_delete=models.CASCADE, related_name='payrolls')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')

    # Earnings
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2)
    total_allowances = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0'))
    gross_pay = models.DecimalField(max_digits=12, decimal_places=2)

    # Statutory Deductions
    pension = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0'))
    nhf = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0'))
    tax = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0'))

    # Non-Statutory Deductions
    other_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0'))

    # Total
    total_deductions = models.DecimalField(max_digits=12, decimal_places=2)
    net_pay = models.DecimalField(max_digits=12, decimal_places=2)

    # Payment tracking
    payment_date = models.DateField(null=True, blank=True)
    payment_reference = models.CharField(max_length=100, blank=True)

    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'payrolls'
        verbose_name = 'Payroll'
        verbose_name_plural = 'Payrolls'
        ordering = ['-period__start_date', 'employee__first_name']
        unique_together = ('employee', 'period')

    def __str__(self):
        return f"{self.employee.get_full_name()} - {self.period.start_date}"

    def calculate(self, settings=None):
        """Calculate payroll based on employee and settings."""
        if not settings:
            settings, _ = PayrollSettings.objects.get_or_create(client=self.client)

        # Get basic salary from employee
        self.basic_salary = self.employee.basic_salary

        # Calculate allowances
        allowances = self.employee.allowances.filter(is_recurring=True)
        self.total_allowances = sum(allowance.amount for allowance in allowances)

        # Calculate gross pay
        self.gross_pay = self.basic_salary + self.total_allowances

        # Calculate statutory deductions
        if settings.enable_pension:
            self.pension = self.basic_salary * settings.pension_rate

        if settings.enable_nhf:
            self.nhf = self.basic_salary * settings.nhf_rate

        if settings.enable_tax:
            # Calculate taxable income (gross pay minus pension and NHF)
            taxable_income = self.gross_pay - self.pension - self.nhf
            self.tax = self._calculate_nigerian_tax(taxable_income, settings.tax_free_allowance)

        # Calculate other deductions
        deductions = self.employee.deductions.filter(is_recurring=True)
        self.other_deductions = sum(deduction.amount for deduction in deductions)

        # Check if employee is suspended or on unpaid leave
        if self.employee.status in ['SUSPENDED', 'INACTIVE']:
            # Zero out salary for suspended/inactive employees
            self.basic_salary = Decimal('0')
            self.total_allowances = Decimal('0')
            self.gross_pay = Decimal('0')
            self.pension = Decimal('0')
            self.nhf = Decimal('0')
            self.tax = Decimal('0')

        # Calculate total deductions and net pay
        self.total_deductions = self.pension + self.nhf + self.tax + self.other_deductions
        self.net_pay = self.gross_pay - self.total_deductions

        # Ensure net pay is not negative
        if self.net_pay < 0:
            self.net_pay = Decimal('0')

    def _calculate_nigerian_tax(self, taxable_income, tax_free_allowance):
        """
        Calculate Nigerian PAYE tax based on tax bands.
        Annual income is calculated and tax is computed, then divided by 12 for monthly.
        """
        # Convert monthly to annual
        annual_income = taxable_income * 12

        # Apply tax-free allowance
        taxable_amount = annual_income - tax_free_allowance
        if taxable_amount <= 0:
            return Decimal('0')

        # Nigerian tax bands (2024)
        tax_bands = [
            {'min': 0, 'max': 300000, 'rate': Decimal('0.07')},
            {'min': 300001, 'max': 600000, 'rate': Decimal('0.11')},
            {'min': 600001, 'max': 1100000, 'rate': Decimal('0.15')},
            {'min': 1100001, 'max': 1600000, 'rate': Decimal('0.19')},
            {'min': 1600001, 'max': 3200000, 'rate': Decimal('0.21')},
            {'min': 3200001, 'max': float('inf'), 'rate': Decimal('0.24')},
        ]

        total_tax = Decimal('0')
        remaining_income = taxable_amount

        for band in tax_bands:
            if remaining_income <= 0:
                break

            band_min = Decimal(str(band['min']))
            band_max = Decimal(str(band['max']))
            rate = band['rate']

            if remaining_income > band_min:
                if band_max == float('inf'):
                    taxable_in_band = remaining_income - band_min
                else:
                    taxable_in_band = min(remaining_income - band_min, band_max - band_min)

                total_tax += taxable_in_band * rate
                remaining_income -= taxable_in_band

        # Return monthly tax
        return total_tax / 12


class PayrollItem(TenantModel):
    """Model for additional payroll items (one-time allowances or deductions)."""

    ITEM_TYPE_CHOICES = [
        ('ALLOWANCE', 'Allowance'),
        ('DEDUCTION', 'Deduction'),
    ]

    payroll = models.ForeignKey(Payroll, on_delete=models.CASCADE, related_name='items')
    name = models.CharField(max_length=100)
    item_type = models.CharField(max_length=20, choices=ITEM_TYPE_CHOICES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField(blank=True)

    class Meta:
        db_table = 'payroll_items'
        verbose_name = 'Payroll Item'
        verbose_name_plural = 'Payroll Items'
        ordering = ['payroll', 'name']

    def __str__(self):
        return f"{self.name} - {self.payroll}"
