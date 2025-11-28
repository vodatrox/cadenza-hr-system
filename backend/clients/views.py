"""
Views for client management.
"""
from rest_framework import generics, status, filters
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Client
from .serializers import ClientSerializer, ClientCreateSerializer, ClientListSerializer


class ClientListCreateView(generics.ListCreateAPIView):
    """View to list and create clients."""
    queryset = Client.objects.all()
    permission_classes = (IsAuthenticated,)
    filter_backends = (DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter)
    search_fields = ('name', 'email', 'contact_person', 'industry')
    ordering_fields = ('name', 'created_at', 'industry')
    ordering = ('-created_at',)
    filterset_fields = ('is_active', 'industry')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ClientCreateSerializer
        return ClientListSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        client = serializer.save()
        response_serializer = ClientSerializer(client, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class ClientDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View to retrieve, update and delete a client."""
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = (IsAuthenticated,)

    def destroy(self, request, *args, **kwargs):
        """Soft delete - mark as inactive instead of deleting."""
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response(
            {'message': 'Client deactivated successfully.'},
            status=status.HTTP_200_OK
        )
