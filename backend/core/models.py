"""
Core models for the Cadenza HR system.
"""
from django.db import models
from django.utils import timezone


class TimeStampedModel(models.Model):
    """
    Abstract base model that provides self-updating
    'created_at' and 'updated_at' fields.
    """
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class TenantModel(TimeStampedModel):
    """
    Abstract base model that includes tenant (client) relationship.
    All models that need to be filtered by client should inherit from this.
    """
    client = models.ForeignKey(
        'clients.Client',
        on_delete=models.CASCADE,
        related_name='%(class)s_set'
    )

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        """
        Ensure client is set from current request context.
        """
        if not self.client_id and hasattr(self, '_current_client'):
            self.client = self._current_client
        super().save(*args, **kwargs)
