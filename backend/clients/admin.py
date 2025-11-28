"""
Admin configuration for clients app.
"""
from django.contrib import admin
from .models import Client


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    """Admin for Client model."""
    list_display = ('name', 'email', 'phone', 'industry', 'contact_person', 'is_active', 'created_at')
    list_filter = ('is_active', 'industry', 'created_at')
    search_fields = ('name', 'email', 'contact_person', 'rc_number', 'tax_id')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')

    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'logo', 'email', 'phone', 'address', 'industry')
        }),
        ('Contact Person', {
            'fields': ('contact_person', 'contact_person_email', 'contact_person_phone')
        }),
        ('Business Details', {
            'fields': ('rc_number', 'tax_id')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
