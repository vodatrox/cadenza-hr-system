"""
URL configuration for employees app.
"""
from django.urls import path
from .views import (
    EmployeeListCreateView, EmployeeDetailView, EmployeeStatsView,
    DepartmentListCreateView, DepartmentDetailView,
    AllowanceListCreateView, AllowanceDetailView,
    DeductionListCreateView, DeductionDetailView,
    EmployeeDocumentListCreateView, EmployeeDocumentDetailView
)

app_name = 'employees'

urlpatterns = [
    # Employee endpoints
    path('', EmployeeListCreateView.as_view(), name='employee_list_create'),
    path('<int:pk>/', EmployeeDetailView.as_view(), name='employee_detail'),
    path('stats/', EmployeeStatsView.as_view(), name='employee_stats'),

    # Department endpoints
    path('departments/', DepartmentListCreateView.as_view(), name='department_list_create'),
    path('departments/<int:pk>/', DepartmentDetailView.as_view(), name='department_detail'),

    # Allowance endpoints
    path('allowances/', AllowanceListCreateView.as_view(), name='allowance_list_create'),
    path('allowances/<int:pk>/', AllowanceDetailView.as_view(), name='allowance_detail'),

    # Deduction endpoints
    path('deductions/', DeductionListCreateView.as_view(), name='deduction_list_create'),
    path('deductions/<int:pk>/', DeductionDetailView.as_view(), name='deduction_detail'),

    # Document endpoints
    path('documents/', EmployeeDocumentListCreateView.as_view(), name='document_list_create'),
    path('documents/<int:pk>/', EmployeeDocumentDetailView.as_view(), name='document_detail'),
]
