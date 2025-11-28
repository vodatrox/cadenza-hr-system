"""
Views for payroll management.
"""
from rest_framework import generics, status, filters
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count
from .models import PayrollSettings, PayrollPeriod, Payroll, PayrollItem
from .serializers import (
    PayrollSettingsSerializer, PayrollPeriodSerializer, PayrollListSerializer,
    PayrollDetailSerializer, PayrollCreateSerializer, PayrollItemSerializer,
    BulkPayrollCreateSerializer
)
from employees.models import Employee


class PayrollSettingsView(APIView):
    """View to get and update payroll settings."""
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        """Get payroll settings for current client."""
        if not hasattr(request, 'current_client') or not request.current_client:
            return Response(
                {'error': 'Client ID must be provided in X-Client-ID header'},
                status=status.HTTP_400_BAD_REQUEST
            )

        settings, created = PayrollSettings.objects.get_or_create(
            client=request.current_client
        )
        serializer = PayrollSettingsSerializer(settings)
        return Response(serializer.data)

    def put(self, request):
        """Update payroll settings."""
        if not hasattr(request, 'current_client') or not request.current_client:
            return Response(
                {'error': 'Client ID must be provided in X-Client-ID header'},
                status=status.HTTP_400_BAD_REQUEST
            )

        settings, created = PayrollSettings.objects.get_or_create(
            client=request.current_client
        )
        serializer = PayrollSettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PayrollPeriodListCreateView(generics.ListCreateAPIView):
    """View to list and create payroll periods."""
    serializer_class = PayrollPeriodSerializer
    permission_classes = (IsAuthenticated,)
    filter_backends = (DjangoFilterBackend, filters.OrderingFilter)
    filterset_fields = ('status', 'period_type')
    ordering = ('-start_date',)

    def get_queryset(self):
        """Filter payroll periods by client."""
        queryset = PayrollPeriod.objects.all()
        if hasattr(self.request, 'current_client') and self.request.current_client:
            queryset = queryset.filter(client=self.request.current_client)
        return queryset

    def create(self, request, *args, **kwargs):
        """Create payroll period with client from request."""
        if not hasattr(request, 'current_client') or not request.current_client:
            return Response(
                {'error': 'Client ID must be provided in X-Client-ID header'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        period = serializer.save(client=request.current_client)
        return Response(
            PayrollPeriodSerializer(period).data,
            status=status.HTTP_201_CREATED
        )


class PayrollPeriodDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View to retrieve, update and delete a payroll period."""
    serializer_class = PayrollPeriodSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        """Filter payroll periods by client."""
        queryset = PayrollPeriod.objects.all()
        if hasattr(self.request, 'current_client') and self.request.current_client:
            queryset = queryset.filter(client=self.request.current_client)
        return queryset


class PayrollListCreateView(generics.ListCreateAPIView):
    """View to list and create payrolls."""
    permission_classes = (IsAuthenticated,)
    filter_backends = (DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter)
    search_fields = ('employee__first_name', 'employee__last_name', 'employee__employee_id')
    ordering_fields = ('employee__first_name', 'net_pay', 'gross_pay')
    ordering = ('-period__start_date', 'employee__first_name')
    filterset_fields = ('status', 'period')

    def get_queryset(self):
        """Filter payrolls by client."""
        queryset = Payroll.objects.select_related('employee', 'period')
        if hasattr(self.request, 'current_client') and self.request.current_client:
            queryset = queryset.filter(client=self.request.current_client)
        return queryset

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PayrollCreateSerializer
        return PayrollListSerializer

    def create(self, request, *args, **kwargs):
        """Create payroll with calculations."""
        if not hasattr(request, 'current_client') or not request.current_client:
            return Response(
                {'error': 'Client ID must be provided in X-Client-ID header'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payroll = serializer.save()
        response_serializer = PayrollDetailSerializer(payroll, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class PayrollDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View to retrieve, update and delete a payroll."""
    serializer_class = PayrollDetailSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        """Filter payrolls by client."""
        queryset = Payroll.objects.select_related('employee', 'period').prefetch_related('items')
        if hasattr(self.request, 'current_client') and self.request.current_client:
            queryset = queryset.filter(client=self.request.current_client)
        return queryset

    def update(self, request, *args, **kwargs):
        """Update payroll and recalculate if needed."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        # If certain fields change, recalculate
        if any(field in request.data for field in ['basic_salary', 'total_allowances', 'other_deductions']):
            instance = serializer.save()
            try:
                settings = PayrollSettings.objects.get(client=instance.client)
            except PayrollSettings.DoesNotExist:
                settings = PayrollSettings.objects.create(client=instance.client)
            instance.calculate(settings)
            instance.save()
        else:
            instance = serializer.save()

        return Response(PayrollDetailSerializer(instance).data)


class BulkPayrollCreateView(APIView):
    """View to create payrolls for multiple employees at once."""
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        """Create payrolls for multiple employees."""
        if not hasattr(request, 'current_client') or not request.current_client:
            return Response(
                {'error': 'Client ID must be provided in X-Client-ID header'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = BulkPayrollCreateSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        period = serializer.validated_data['period']
        employee_ids = serializer.validated_data['employee_ids']

        # Get payroll settings
        try:
            settings = PayrollSettings.objects.get(client=request.current_client)
        except PayrollSettings.DoesNotExist:
            settings = PayrollSettings.objects.create(client=request.current_client)

        # Create payrolls
        created_payrolls = []
        errors = []

        for employee_id in employee_ids:
            try:
                employee = Employee.objects.get(id=employee_id, client=request.current_client)

                # Check if payroll already exists
                if Payroll.objects.filter(employee=employee, period=period).exists():
                    errors.append({
                        'employee_id': employee_id,
                        'error': 'Payroll already exists for this period'
                    })
                    continue

                # Create and calculate payroll
                payroll = Payroll(
                    employee=employee,
                    period=period,
                    client=request.current_client
                )
                payroll.calculate(settings)
                payroll.save()
                created_payrolls.append(payroll)

            except Employee.DoesNotExist:
                errors.append({
                    'employee_id': employee_id,
                    'error': 'Employee not found'
                })

        response_data = {
            'created': len(created_payrolls),
            'errors': errors,
            'payrolls': PayrollListSerializer(created_payrolls, many=True).data
        }

        return Response(response_data, status=status.HTTP_201_CREATED)


class PayrollStatsView(APIView):
    """View to get payroll statistics."""
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        """Get payroll statistics."""
        if not hasattr(request, 'current_client') or not request.current_client:
            return Response(
                {'error': 'Client ID must be provided in X-Client-ID header'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get period ID if provided
        period_id = request.query_params.get('period')
        payrolls = Payroll.objects.filter(client=request.current_client)

        if period_id:
            payrolls = payrolls.filter(period_id=period_id)

        stats = payrolls.aggregate(
            total_gross=Sum('gross_pay'),
            total_net=Sum('net_pay'),
            total_tax=Sum('tax'),
            total_pension=Sum('pension'),
            total_nhf=Sum('nhf'),
            total_deductions=Sum('total_deductions'),
            count=Count('id')
        )

        # Get breakdown by status
        status_breakdown = list(
            payrolls.values('status')
            .annotate(count=Count('id'), total=Sum('net_pay'))
            .order_by('-count')
        )

        stats['by_status'] = status_breakdown

        return Response(stats)


class PayrollItemListCreateView(generics.ListCreateAPIView):
    """View to list and create payroll items."""
    serializer_class = PayrollItemSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        """Filter payroll items by client and optionally by payroll."""
        queryset = PayrollItem.objects.select_related('payroll')
        if hasattr(self.request, 'current_client') and self.request.current_client:
            queryset = queryset.filter(client=self.request.current_client)

        payroll_id = self.request.query_params.get('payroll')
        if payroll_id:
            queryset = queryset.filter(payroll_id=payroll_id)

        return queryset

    def create(self, request, *args, **kwargs):
        """Create payroll item with client from request."""
        if not hasattr(request, 'current_client') or not request.current_client:
            return Response(
                {'error': 'Client ID must be provided in X-Client-ID header'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = serializer.save(client=request.current_client)
        return Response(
            PayrollItemSerializer(item).data,
            status=status.HTTP_201_CREATED
        )


class PayrollItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View to retrieve, update and delete a payroll item."""
    serializer_class = PayrollItemSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        """Filter payroll items by client."""
        queryset = PayrollItem.objects.all()
        if hasattr(self.request, 'current_client') and self.request.current_client:
            queryset = queryset.filter(client=self.request.current_client)
        return queryset
