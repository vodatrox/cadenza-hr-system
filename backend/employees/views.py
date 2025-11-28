"""
Views for employee management.
"""
from rest_framework import generics, status, filters
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Sum
from .models import Employee, Department, Allowance, Deduction, EmployeeDocument
from .serializers import (
    EmployeeListSerializer, EmployeeDetailSerializer, EmployeeCreateSerializer,
    DepartmentSerializer, AllowanceSerializer, DeductionSerializer, EmployeeDocumentSerializer
)


class EmployeeListCreateView(generics.ListCreateAPIView):
    """View to list and create employees."""
    permission_classes = (IsAuthenticated,)
    filter_backends = (DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter)
    search_fields = ('employee_id', 'first_name', 'last_name', 'email', 'position')
    ordering_fields = ('employee_id', 'first_name', 'last_name', 'date_hired', 'basic_salary')
    ordering = ('-date_hired',)
    filterset_fields = ('status', 'department', 'employment_type', 'gender')

    def get_queryset(self):
        """Filter employees by client from request header."""
        queryset = Employee.objects.select_related('department')
        if hasattr(self.request, 'current_client') and self.request.current_client:
            queryset = queryset.filter(client=self.request.current_client)
        return queryset

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return EmployeeCreateSerializer
        return EmployeeListSerializer

    def create(self, request, *args, **kwargs):
        """Create employee with proper error handling."""
        if not hasattr(request, 'current_client') or not request.current_client:
            return Response(
                {'error': 'Client ID must be provided in X-Client-ID header'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        employee = serializer.save()
        response_serializer = EmployeeDetailSerializer(employee, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class EmployeeDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View to retrieve, update and delete an employee."""
    serializer_class = EmployeeDetailSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        """Filter employees by client."""
        queryset = Employee.objects.select_related('department').prefetch_related(
            'allowances', 'deductions', 'documents'
        )
        if hasattr(self.request, 'current_client') and self.request.current_client:
            queryset = queryset.filter(client=self.request.current_client)
        return queryset

    def destroy(self, request, *args, **kwargs):
        """Soft delete - mark as terminated instead of deleting."""
        instance = self.get_object()
        instance.status = 'TERMINATED'
        instance.save()
        return Response(
            {'message': 'Employee marked as terminated.'},
            status=status.HTTP_200_OK
        )


class EmployeeStatsView(APIView):
    """View to get employee statistics for dashboard."""
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        """Get employee statistics."""
        if not hasattr(request, 'current_client') or not request.current_client:
            return Response(
                {'error': 'Client ID must be provided in X-Client-ID header'},
                status=status.HTTP_400_BAD_REQUEST
            )

        employees = Employee.objects.filter(client=request.current_client)

        stats = {
            'total_employees': employees.count(),
            'active_employees': employees.filter(status='ACTIVE').count(),
            'inactive_employees': employees.filter(status='INACTIVE').count(),
            'on_leave': employees.filter(status='ON_LEAVE').count(),
            'probation': employees.filter(status='PROBATION').count(),
            'suspended': employees.filter(status='SUSPENDED').count(),
            'terminated': employees.filter(status='TERMINATED').count(),
            'by_department': list(
                employees.filter(status='ACTIVE')
                .values('department__name')
                .annotate(count=Count('id'))
                .order_by('-count')
            ),
            'by_employment_type': list(
                employees.filter(status='ACTIVE')
                .values('employment_type')
                .annotate(count=Count('id'))
            ),
        }

        return Response(stats)


class DepartmentListCreateView(generics.ListCreateAPIView):
    """View to list and create departments."""
    serializer_class = DepartmentSerializer
    permission_classes = (IsAuthenticated,)
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    search_fields = ('name',)
    ordering = ('name',)

    def get_queryset(self):
        """Filter departments by client."""
        queryset = Department.objects.all()
        if hasattr(self.request, 'current_client') and self.request.current_client:
            queryset = queryset.filter(client=self.request.current_client)
        return queryset

    def create(self, request, *args, **kwargs):
        """Create department with client from request."""
        if not hasattr(request, 'current_client') or not request.current_client:
            return Response(
                {'error': 'Client ID must be provided in X-Client-ID header'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Add client to validated data
        department = serializer.save(client=request.current_client)
        return Response(
            DepartmentSerializer(department).data,
            status=status.HTTP_201_CREATED
        )


class DepartmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View to retrieve, update and delete a department."""
    serializer_class = DepartmentSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        """Filter departments by client."""
        queryset = Department.objects.all()
        if hasattr(self.request, 'current_client') and self.request.current_client:
            queryset = queryset.filter(client=self.request.current_client)
        return queryset


class AllowanceListCreateView(generics.ListCreateAPIView):
    """View to list and create allowances."""
    serializer_class = AllowanceSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        """Filter allowances by client and optionally by employee."""
        queryset = Allowance.objects.select_related('employee')
        if hasattr(self.request, 'current_client') and self.request.current_client:
            queryset = queryset.filter(client=self.request.current_client)

        employee_id = self.request.query_params.get('employee')
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)

        return queryset

    def create(self, request, *args, **kwargs):
        """Create allowance with client from request."""
        if not hasattr(request, 'current_client') or not request.current_client:
            return Response(
                {'error': 'Client ID must be provided in X-Client-ID header'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        allowance = serializer.save(client=request.current_client)
        return Response(
            AllowanceSerializer(allowance).data,
            status=status.HTTP_201_CREATED
        )


class AllowanceDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View to retrieve, update and delete an allowance."""
    serializer_class = AllowanceSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        """Filter allowances by client."""
        queryset = Allowance.objects.all()
        if hasattr(self.request, 'current_client') and self.request.current_client:
            queryset = queryset.filter(client=self.request.current_client)
        return queryset


class DeductionListCreateView(generics.ListCreateAPIView):
    """View to list and create deductions."""
    serializer_class = DeductionSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        """Filter deductions by client and optionally by employee."""
        queryset = Deduction.objects.select_related('employee')
        if hasattr(self.request, 'current_client') and self.request.current_client:
            queryset = queryset.filter(client=self.request.current_client)

        employee_id = self.request.query_params.get('employee')
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)

        return queryset

    def create(self, request, *args, **kwargs):
        """Create deduction with client from request."""
        if not hasattr(request, 'current_client') or not request.current_client:
            return Response(
                {'error': 'Client ID must be provided in X-Client-ID header'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        deduction = serializer.save(client=request.current_client)
        return Response(
            DeductionSerializer(deduction).data,
            status=status.HTTP_201_CREATED
        )


class DeductionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View to retrieve, update and delete a deduction."""
    serializer_class = DeductionSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        """Filter deductions by client."""
        queryset = Deduction.objects.all()
        if hasattr(self.request, 'current_client') and self.request.current_client:
            queryset = queryset.filter(client=self.request.current_client)
        return queryset


class EmployeeDocumentListCreateView(generics.ListCreateAPIView):
    """View to list and create employee documents."""
    serializer_class = EmployeeDocumentSerializer
    permission_classes = (IsAuthenticated,)
    parser_classes = (MultiPartParser, FormParser)

    def get_queryset(self):
        """Filter documents by client and optionally by employee."""
        queryset = EmployeeDocument.objects.select_related('employee')
        if hasattr(self.request, 'current_client') and self.request.current_client:
            queryset = queryset.filter(client=self.request.current_client)

        employee_id = self.request.query_params.get('employee')
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)

        return queryset

    def create(self, request, *args, **kwargs):
        """Create document with client from request."""
        if not hasattr(request, 'current_client') or not request.current_client:
            return Response(
                {'error': 'Client ID must be provided in X-Client-ID header'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        document = serializer.save(client=request.current_client)
        return Response(
            EmployeeDocumentSerializer(document, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )


class EmployeeDocumentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View to retrieve, update and delete an employee document."""
    serializer_class = EmployeeDocumentSerializer
    permission_classes = (IsAuthenticated,)
    parser_classes = (MultiPartParser, FormParser)

    def get_queryset(self):
        """Filter documents by client."""
        queryset = EmployeeDocument.objects.all()
        if hasattr(self.request, 'current_client') and self.request.current_client:
            queryset = queryset.filter(client=self.request.current_client)
        return queryset
