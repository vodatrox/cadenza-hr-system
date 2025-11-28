"""
URL configuration for clients app.
"""
from django.urls import path
from .views import ClientListCreateView, ClientDetailView

app_name = 'clients'

urlpatterns = [
    path('', ClientListCreateView.as_view(), name='client_list_create'),
    path('<int:pk>/', ClientDetailView.as_view(), name='client_detail'),
]
