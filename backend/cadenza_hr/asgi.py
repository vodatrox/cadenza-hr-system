"""
ASGI config for cadenza_hr project.
"""
import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cadenza_hr.settings')

application = get_asgi_application()
