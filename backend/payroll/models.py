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


class StatutoryEarning(TenantModel):
    """Model for statutory earnings configured per client."""

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_percentage = models.BooleanField(default=False, help_text="If True, amount is a percentage of basic salary")
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Fixed amount or percentage (0.15 = 15%)"
    )
    is_taxable = models.BooleanField(default=True, help_text="Include in taxable income")
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'statutory_earnings'
        verbose_name = 'Statutory Earning'
        verbose_name_plural = 'Statutory Earnings'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} - {self.client.name}"

    def calculate_amount(self, basic_salary):
        """Calculate the earning amount based on basic salary."""
        if self.is_percentage:
            return basic_salary * (self.amount / 100)
        return self.amount


class StatutoryDeduction(TenantModel):
    """Model for statutory deductions configured per client."""

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_percentage = models.BooleanField(default=False, help_text="If True, amount is a percentage of basic salary")
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Fixed amount or percentage (0.05 = 5%)"
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'statutory_deductions'
        verbose_name = 'Statutory Deduction'
        verbose_name_plural = 'Statutory Deductions'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} - {self.client.name}"

    def calculate_amount(self, basic_salary):
        """Calculate the deduction amount based on basic salary."""
        if self.is_percentage:
            return basic_salary * (self.amount / 100)
        return self.amount


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
        ('APPROVED', 'Approved'),
        ('PAID', 'Paid'),
        ('REVERSED', 'Reversed'),
    ]

    title = models.CharField(max_length=255)
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

    def __str__(self):
        return f"{self.title} - {self.client.name}"

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

    @property
    def total_tax(self):
        """Calculate total tax for this period."""
        return sum(payroll.tax for payroll in self.payrolls.all())

    @property
    def payroll_count(self):
        """Get count of payrolls in this period."""
        return self.payrolls.count()


class PayrollBatch(TenantModel):
    """Model representing a batch of payrolls within a period."""

    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('APPROVED', 'Approved'),
        ('PAID', 'Paid'),
    ]

    batch_number = models.CharField(max_length=50, unique=True)
    title = models.CharField(max_length=255)
    period = models.ForeignKey(PayrollPeriod, on_delete=models.CASCADE, related_name='batches')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    description = models.TextField(blank=True)

    class Meta:
        db_table = 'payroll_batches'
        verbose_name = 'Payroll Batch'
        verbose_name_plural = 'Payroll Batches'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.batch_number} - {self.title}"

    def save(self, *args, **kwargs):
        """Auto-generate batch number if not provided."""
        if not self.batch_number:
            # Generate batch number: BATCH-YYYY-MM-XXX
            from django.utils import timezone
            now = timezone.now()
            prefix = f"BATCH-{now.year}-{now.month:02d}"

            # Get the last batch number for this month
            last_batch = PayrollBatch.objects.filter(
                batch_number__startswith=prefix
            ).order_by('-batch_number').first()

            if last_batch:
                # Extract the sequence number and increment
                try:
                    last_seq = int(last_batch.batch_number.split('-')[-1])
                    new_seq = last_seq + 1
                except (ValueError, IndexError):
                    new_seq = 1
            else:
                new_seq = 1

            self.batch_number = f"{prefix}-{new_seq:03d}"

        super().save(*args, **kwargs)

    @property
    def total_gross_pay(self):
        """Calculate total gross pay for this batch."""
        return sum(payroll.gross_pay for payroll in self.payrolls.all())

    @property
    def total_net_pay(self):
        """Calculate total net pay for this batch."""
        return sum(payroll.net_pay for payroll in self.payrolls.all())

    @property
    def total_deductions(self):
        """Calculate total deductions for this batch."""
        return sum(payroll.total_deductions for payroll in self.payrolls.all())

    @property
    def payroll_count(self):
        """Get count of payrolls in this batch."""
        return self.payrolls.count()


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
    batch = models.ForeignKey(PayrollBatch, on_delete=models.CASCADE, related_name='payrolls', null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')

    # Earnings
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2)
    total_allowances = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0'))
    total_statutory_earnings = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0'))
    total_additional_earnings = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0'))
    gross_pay = models.DecimalField(max_digits=12, decimal_places=2)

    # Statutory Deductions
    pension = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0'))
    nhf = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0'))
    tax = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0'))
    total_statutory_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0'))

    # Non-Statutory Deductions
    other_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0'))
    total_additional_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0'))

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
        unique_together = ('employee', 'batch')

    def __str__(self):
        return f"{self.employee.get_full_name()} - {self.period.title}"

    def calculate(self, settings=None):
        """Calculate payroll based on employee and settings."""
        if not settings:
            settings, _ = PayrollSettings.objects.get_or_create(client=self.client)

        # Get basic salary from employee
        self.basic_salary = self.employee.basic_salary

        # Calculate recurring employee allowances
        allowances = self.employee.allowances.filter(is_recurring=True)
        self.total_allowances = sum(allowance.amount for allowance in allowances)

        # Calculate statutory earnings
        statutory_earnings = StatutoryEarning.objects.filter(client=self.client, is_active=True)
        self.total_statutory_earnings = sum(
            earning.calculate_amount(self.basic_salary) for earning in statutory_earnings
        )

        # Calculate additional earnings (from payroll_earnings table)
        if self.pk:
            additional_earnings = self.earnings.all()
            self.total_additional_earnings = sum(earning.amount for earning in additional_earnings)
        else:
            self.total_additional_earnings = Decimal('0')

        # Calculate gross pay
        self.gross_pay = (
            self.basic_salary +
            self.total_allowances +
            self.total_statutory_earnings +
            self.total_additional_earnings
        )

        # Calculate statutory deductions
        if settings.enable_pension:
            self.pension = self.basic_salary * settings.pension_rate

        if settings.enable_nhf:
            self.nhf = self.basic_salary * settings.nhf_rate

        # Calculate other statutory deductions
        statutory_deductions = StatutoryDeduction.objects.filter(client=self.client, is_active=True)
        self.total_statutory_deductions = sum(
            deduction.calculate_amount(self.basic_salary) for deduction in statutory_deductions
        )

        # Calculate taxable income for tax calculation
        if settings.enable_tax:
            # Get taxable statutory earnings
            taxable_statutory_earnings = sum(
                earning.calculate_amount(self.basic_salary)
                for earning in statutory_earnings if earning.is_taxable
            )
            # Taxable income = basic + allowances + taxable statutory earnings - pension - NHF
            taxable_income = (
                self.basic_salary +
                self.total_allowances +
                taxable_statutory_earnings -
                self.pension -
                self.nhf
            )
            self.tax = self._calculate_nigerian_tax(taxable_income, settings.tax_free_allowance)

        # Calculate employee recurring deductions
        deductions = self.employee.deductions.filter(is_recurring=True)
        self.other_deductions = sum(deduction.amount for deduction in deductions)

        # Calculate additional deductions (from payroll_deductions table)
        if self.pk:
            additional_deductions = self.deductions.all()
            self.total_additional_deductions = sum(deduction.amount for deduction in additional_deductions)
        else:
            self.total_additional_deductions = Decimal('0')

        # Check if employee is suspended or on unpaid leave
        if self.employee.status in ['SUSPENDED', 'INACTIVE']:
            # Zero out salary for suspended/inactive employees
            self.basic_salary = Decimal('0')
            self.total_allowances = Decimal('0')
            self.total_statutory_earnings = Decimal('0')
            self.total_additional_earnings = Decimal('0')
            self.gross_pay = Decimal('0')
            self.pension = Decimal('0')
            self.nhf = Decimal('0')
            self.tax = Decimal('0')
            self.total_statutory_deductions = Decimal('0')

        # Calculate total deductions and net pay
        self.total_deductions = (
            self.pension +
            self.nhf +
            self.tax +
            self.total_statutory_deductions +
            self.other_deductions +
            self.total_additional_deductions
        )
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


class PayrollEarning(TenantModel):
    """Model for additional earnings specific to a payroll run (temporary)."""

    payroll = models.ForeignKey(Payroll, on_delete=models.CASCADE, related_name='earnings')
    name = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField(blank=True)
    is_recurring = models.BooleanField(
        default=False,
        help_text="If True, this earning will be added to future payrolls for this employee"
    )

    class Meta:
        db_table = 'payroll_earnings'
        verbose_name = 'Payroll Earning'
        verbose_name_plural = 'Payroll Earnings'
        ordering = ['payroll', 'name']

    def __str__(self):
        return f"{self.name} - {self.payroll}"


class PayrollDeduction(TenantModel):
    """Model for additional deductions specific to a payroll run (temporary)."""

    payroll = models.ForeignKey(Payroll, on_delete=models.CASCADE, related_name='deductions')
    name = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField(blank=True)
    is_recurring = models.BooleanField(
        default=False,
        help_text="If True, this deduction will be added to future payrolls for this employee"
    )

    class Meta:
        db_table = 'payroll_deductions'
        verbose_name = 'Payroll Deduction'
        verbose_name_plural = 'Payroll Deductions'
        ordering = ['payroll', 'name']

    def __str__(self):
        return f"{self.name} - {self.payroll}"
