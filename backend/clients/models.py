"""
Models for client management.
"""
from django.db import models
from core.models import TimeStampedModel


class Client(TimeStampedModel):
    """Model representing a client company."""

    name = models.CharField(max_length=255, unique=True)
    logo = models.ImageField(upload_to='client_logos/', null=True, blank=True)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    address = models.TextField(blank=True)
    industry = models.CharField(max_length=100, blank=True)
    contact_person = models.CharField(max_length=255)
    contact_person_email = models.EmailField()
    contact_person_phone = models.CharField(max_length=20)
    is_active = models.BooleanField(default=True)

    # Business details
    rc_number = models.CharField(max_length=50, blank=True, help_text="Registration number")
    tax_id = models.CharField(max_length=50, blank=True, help_text="Tax identification number")

    class Meta:
        db_table = 'clients'
        verbose_name = 'Client'
        verbose_name_plural = 'Clients'
        ordering = ['name']

    def __str__(self):
        return self.name

    @property
    def total_employees(self):
        """Return the total number of employees for this client."""
        return self.employee_set.count()

    @property
    def active_employees(self):
        """Return the number of active employees."""
        return self.employee_set.filter(status='ACTIVE').count()
