"""
Tenant middleware for multi-tenancy support.
"""
import threading

# Thread-local storage for current client
_thread_locals = threading.local()


def get_current_client():
    """Get the current client from thread-local storage."""
    return getattr(_thread_locals, 'client', None)


def set_current_client(client):
    """Set the current client in thread-local storage."""
    _thread_locals.client = client


class TenantMiddleware:
    """
    Middleware to handle multi-tenancy by extracting client information
    from request headers and storing it in thread-local storage.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Extract client ID from request header
        client_id = request.headers.get('X-Client-ID')

        if client_id:
            # Import here to avoid circular imports
            from clients.models import Client
            try:
                client = Client.objects.get(id=client_id)
                set_current_client(client)
                request.current_client = client
            except Client.DoesNotExist:
                set_current_client(None)
                request.current_client = None
        else:
            set_current_client(None)
            request.current_client = None

        response = self.get_response(request)

        # Clean up thread-local storage
        set_current_client(None)

        return response
