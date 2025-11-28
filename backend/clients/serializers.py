"""
Serializers for client app.
"""
from rest_framework import serializers
from .models import Client


class ClientSerializer(serializers.ModelSerializer):
    """Serializer for Client model."""
    total_employees = serializers.IntegerField(read_only=True)
    active_employees = serializers.IntegerField(read_only=True)
    logo_url = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = (
            'id', 'name', 'logo', 'logo_url', 'email', 'phone', 'address',
            'industry', 'contact_person', 'contact_person_email',
            'contact_person_phone', 'is_active', 'rc_number', 'tax_id',
            'total_employees', 'active_employees', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_logo_url(self, obj):
        """Get full URL for logo."""
        if obj.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo.url)
            return obj.logo.url
        return None


class ClientCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating clients."""

    class Meta:
        model = Client
        fields = (
            'name', 'logo', 'email', 'phone', 'address', 'industry',
            'contact_person', 'contact_person_email', 'contact_person_phone',
            'rc_number', 'tax_id'
        )

    def validate_email(self, value):
        """Validate email is unique."""
        if Client.objects.filter(email=value).exists():
            raise serializers.ValidationError("A client with this email already exists.")
        return value


class ClientListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for client list."""
    total_employees = serializers.IntegerField(read_only=True)
    active_employees = serializers.IntegerField(read_only=True)
    logo_url = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = (
            'id', 'name', 'logo_url', 'email', 'phone', 'industry',
            'contact_person', 'is_active', 'total_employees',
            'active_employees', 'created_at'
        )

    def get_logo_url(self, obj):
        """Get full URL for logo."""
        if obj.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo.url)
            return obj.logo.url
        return None
