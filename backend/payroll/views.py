"""
Views for payroll management.
"""
from rest_framework import generics, status, filters
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count
from .models import (
    PayrollSettings, StatutoryEarning, StatutoryDeduction,
    PayrollPeriod, PayrollBatch, Payroll, PayrollEarning, PayrollDeduction
)
from .serializers import (
    PayrollSettingsSerializer, StatutoryEarningSerializer, StatutoryDeductionSerializer,
    PayrollPeriodSerializer, PayrollBatchSerializer, PayrollListSerializer, PayrollDetailSerializer,
    PayrollCreateSerializer, BulkPayrollCreateSerializer,
    PayrollEarningSerializer, PayrollDeductionSerializer
)
from employees.models import Employee


# ============================================================================
# PAYROLL SETTINGS VIEWS
# ============================================================================

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


# ============================================================================
# STATUTORY EARNINGS VIEWS
# ============================================================================

class StatutoryEarningListCreateView(generics.ListCreateAPIView):
    """View to list and create statutory earnings."""
    serializer_class = StatutoryEarningSerializer
    permission_classes = (IsAuthenticated,)
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    search_fields = ('name', 'description')
    ordering = ('name',)

    def get_queryset(self):
        """Filter statutory earnings by client."""
        queryset = StatutoryEarning.objects.all()
        if hasattr(self.request, 'current_client') and self.request.current_client:
            queryset = queryset.filter(client=self.request.current_client)
        return queryset

    def create(self, request, *args, **kwargs):
        """Create statutory earning with client from request."""
        if not hasattr(request, 'current_client') or not request.current_client:
            return Response(
                {'error': 'Client ID must be provided in X-Client-ID header'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        earning = serializer.save(client=request.current_client)
        return Response(
            StatutoryEarningSerializer(earning).data,
            status=status.HTTP_201_CREATED
        )


class StatutoryEarningDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View to retrieve, update and delete a statutory earning."""
    serializer_class = StatutoryEarningSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        """Filter statutory earnings by client."""
        queryset = StatutoryEarning.objects.all()
        if hasattr(self.request, 'current_client') and self.request.current_client:
            queryset = queryset.filter(client=self.request.current_client)
        return queryset


# ============================================================================
# STATUTORY DEDUCTIONS VIEWS
# ============================================================================

class StatutoryDeductionListCreateView(generics.ListCreateAPIView):
    """View to list and create statutory deductions."""
    serializer_class = StatutoryDeductionSerializer
    permission_classes = (IsAuthenticated,)
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    search_fields = ('name', 'description')
    ordering = ('name',)

    def get_queryset(self):
        """Filter statutory deductions by client."""
        queryset = StatutoryDeduction.objects.all()
        if hasattr(self.request, 'current_client') and self.request.current_client:
            queryset = queryset.filter(client=self.request.current_client)
        return queryset

    def create(self, request, *args, **kwargs):
        """Create statutory deduction with client from request."""
        if not hasattr(request, 'current_client') or not request.current_client:
            return Response(
                {'error': 'Client ID must be provided in X-Client-ID header'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        deduction = serializer.save(client=request.current_client)
        return Response(
            StatutoryDeductionSerializer(deduction).data,
            status=status.HTTP_201_CREATED
        )


class StatutoryDeductionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View to retrieve, update and delete a statutory deduction."""
    serializer_class = StatutoryDeductionSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        """Filter statutory deductions by client."""
        queryset = StatutoryDeduction.objects.all()
        if hasattr(self.request, 'current_client') and self.request.current_client:
            queryset = queryset.filter(client=self.request.current_client)
        return queryset


# ============================================================================
# PAYROLL PERIOD VIEWS
# ============================================================================

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


# ============================================================================
# PAYROLL BATCH VIEWS
# ============================================================================

class PayrollBatchListCreateView(generics.ListCreateAPIView):
    """View to list and create payroll batches."""
    serializer_class = PayrollBatchSerializer
    permission_classes = (IsAuthenticated,)
    filter_backends = (DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter)
    filterset_fields = ('period', 'status')
    search_fields = ('batch_number', 'title', 'description')
    ordering_fields = ('created_at', 'batch_number')
    ordering = ('-created_at',)

    def get_queryset(self):
        """Filter payroll batches by client."""
        queryset = PayrollBatch.objects.all()
        if hasattr(self.request, 'current_client') and self.request.current_client:
            queryset = queryset.filter(client=self.request.current_client)
        return queryset

    def perform_create(self, serializer):
        """Set the client when creating a batch."""
        if hasattr(self.request, 'current_client') and self.request.current_client:
            serializer.save(client=self.request.current_client)
        else:
            serializer.save()


class PayrollBatchDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View to retrieve, update and delete a payroll batch."""
    serializer_class = PayrollBatchSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        """Filter payroll batches by client."""
        queryset = PayrollBatch.objects.all()
        if hasattr(self.request, 'current_client') and self.request.current_client:
            queryset = queryset.filter(client=self.request.current_client)
        return queryset


class PayrollBatchActionsView(APIView):
    """View to perform batch-level operations."""
    permission_classes = (IsAuthenticated,)

    def post(self, request, pk):
        """Perform batch action."""
        if not hasattr(request, 'current_client') or not request.current_client:
            return Response(
                {'error': 'Client ID must be provided in X-Client-ID header'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            batch = PayrollBatch.objects.get(pk=pk, client=request.current_client)
        except PayrollBatch.DoesNotExist:
            return Response(
                {'error': 'Batch not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        action = request.data.get('action')

        if action == 'approve':
            # Approve all payrolls in batch
            batch.payrolls.update(status='APPROVED')
            batch.status = 'APPROVED'
            batch.save()
            return Response({'message': 'Batch approved successfully'})

        elif action == 'mark_paid':
            # Mark all payrolls as paid
            batch.payrolls.update(status='PAID')
            batch.status = 'PAID'
            batch.save()
            return Response({'message': 'Batch marked as paid successfully'})

        elif action == 'recalculate':
            # Recalculate all payrolls in batch
            settings, _ = PayrollSettings.objects.get_or_create(client=request.current_client)
            for payroll in batch.payrolls.all():
                payroll.calculate(settings)
                payroll.save()
            return Response({'message': 'Batch recalculated successfully'})

        else:
            return Response(
                {'error': 'Invalid action. Valid actions: approve, mark_paid, recalculate'},
                status=status.HTTP_400_BAD_REQUEST
            )


# ============================================================================
# PAYROLL VIEWS
# ============================================================================

class PayrollListCreateView(generics.ListCreateAPIView):
    """View to list and create payrolls."""
    permission_classes = (IsAuthenticated,)
    filter_backends = (DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter)
    search_fields = ('employee__first_name', 'employee__last_name', 'employee__employee_id')
    ordering_fields = ('employee__first_name', 'net_pay', 'gross_pay')
    ordering = ('-period__start_date', 'employee__first_name')
    filterset_fields = ('status', 'period', 'batch')

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
        queryset = Payroll.objects.select_related('employee', 'period').prefetch_related(
            'earnings', 'deductions'
        )
        if hasattr(self.request, 'current_client') and self.request.current_client:
            queryset = queryset.filter(client=self.request.current_client)
        return queryset

    def update(self, request, *args, **kwargs):
        """Update payroll and recalculate if needed."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        # If status change, just update
        if 'status' in request.data and len(request.data) == 1:
            instance = serializer.save()
        else:
            # If other fields change, recalculate
            instance = serializer.save()
            instance.calculate()
            instance.save()

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
        settings, _ = PayrollSettings.objects.get_or_create(client=request.current_client)

        # Create or get batch
        batch_id = request.data.get('batch_id')
        batch_title = request.data.get('batch_title')

        if batch_id:
            # Use existing batch
            try:
                batch = PayrollBatch.objects.get(id=batch_id, client=request.current_client)
            except PayrollBatch.DoesNotExist:
                return Response(
                    {'error': 'Batch not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            # Auto-create new batch
            if not batch_title:
                batch_title = f"{period.title} - Batch"

            batch = PayrollBatch.objects.create(
                title=batch_title,
                period=period,
                client=request.current_client,
                status='DRAFT'
            )

        # Create payrolls
        created_payrolls = []
        errors = []

        for employee_id in employee_ids:
            try:
                employee = Employee.objects.get(id=employee_id, client=request.current_client)

                # Check if payroll already exists for this employee in this batch
                if Payroll.objects.filter(employee=employee, batch=batch).exists():
                    errors.append({
                        'employee_id': employee_id,
                        'employee_name': employee.get_full_name(),
                        'error': 'Payroll already exists in this batch'
                    })
                    continue

                # Create and calculate payroll
                payroll = Payroll(
                    employee=employee,
                    period=period,
                    batch=batch,
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
            'batch': PayrollBatchSerializer(batch).data,
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


# ============================================================================
# PAYROLL EARNINGS & DEDUCTIONS VIEWS
# ============================================================================

class PayrollEarningListCreateView(generics.ListCreateAPIView):
    """View to list and create payroll earnings."""
    serializer_class = PayrollEarningSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        """Filter payroll earnings by client and optionally by payroll."""
        queryset = PayrollEarning.objects.select_related('payroll')
        if hasattr(self.request, 'current_client') and self.request.current_client:
            queryset = queryset.filter(client=self.request.current_client)

        payroll_id = self.request.query_params.get('payroll')
        if payroll_id:
            queryset = queryset.filter(payroll_id=payroll_id)

        return queryset

    def create(self, request, *args, **kwargs):
        """Create payroll earning and recalculate payroll."""
        if not hasattr(request, 'current_client') or not request.current_client:
            return Response(
                {'error': 'Client ID must be provided in X-Client-ID header'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        earning = serializer.save(client=request.current_client)

        # Recalculate payroll
        earning.payroll.calculate()
        earning.payroll.save()

        return Response(
            PayrollEarningSerializer(earning).data,
            status=status.HTTP_201_CREATED
        )


class PayrollEarningDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View to retrieve, update and delete a payroll earning."""
    serializer_class = PayrollEarningSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        """Filter payroll earnings by client."""
        queryset = PayrollEarning.objects.all()
        if hasattr(self.request, 'current_client') and self.request.current_client:
            queryset = queryset.filter(client=self.request.current_client)
        return queryset

    def perform_update(self, serializer):
        """Update and recalculate payroll."""
        earning = serializer.save()
        earning.payroll.calculate()
        earning.payroll.save()

    def perform_destroy(self, instance):
        """Delete and recalculate payroll."""
        payroll = instance.payroll
        instance.delete()
        payroll.calculate()
        payroll.save()


class PayrollDeductionListCreateView(generics.ListCreateAPIView):
    """View to list and create payroll deductions."""
    serializer_class = PayrollDeductionSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        """Filter payroll deductions by client and optionally by payroll."""
        queryset = PayrollDeduction.objects.select_related('payroll')
        if hasattr(self.request, 'current_client') and self.request.current_client:
            queryset = queryset.filter(client=self.request.current_client)

        payroll_id = self.request.query_params.get('payroll')
        if payroll_id:
            queryset = queryset.filter(payroll_id=payroll_id)

        return queryset

    def create(self, request, *args, **kwargs):
        """Create payroll deduction and recalculate payroll."""
        if not hasattr(request, 'current_client') or not request.current_client:
            return Response(
                {'error': 'Client ID must be provided in X-Client-ID header'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        deduction = serializer.save(client=request.current_client)

        # Recalculate payroll
        deduction.payroll.calculate()
        deduction.payroll.save()

        return Response(
            PayrollDeductionSerializer(deduction).data,
            status=status.HTTP_201_CREATED
        )


class PayrollDeductionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View to retrieve, update and delete a payroll deduction."""
    serializer_class = PayrollDeductionSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        """Filter payroll deductions by client."""
        queryset = PayrollDeduction.objects.all()
        if hasattr(self.request, 'current_client') and self.request.current_client:
            queryset = queryset.filter(client=self.request.current_client)
        return queryset

    def perform_update(self, serializer):
        """Update and recalculate payroll."""
        deduction = serializer.save()
        deduction.payroll.calculate()
        deduction.payroll.save()

    def perform_destroy(self, instance):
        """Delete and recalculate payroll."""
        payroll = instance.payroll
        instance.delete()
        payroll.calculate()
        payroll.save()


# ============================================================================
# EXPORT VIEWS
# ============================================================================

class PayrollBatchExportExcelView(APIView):
    """Export payroll batch to Excel."""
    permission_classes = (IsAuthenticated,)

    def get(self, request, pk):
        """Generate and download Excel export."""
        from django.http import HttpResponse
        from .exports import PayrollBatchExcelExport

        try:
            batch = PayrollBatch.objects.get(pk=pk, client=request.current_client)
        except PayrollBatch.DoesNotExist:
            return Response(
                {'error': 'Payroll batch not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        exporter = PayrollBatchExcelExport(batch)
        excel_file = exporter.generate()

        response = HttpResponse(
            excel_file.read(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="Payroll_Batch_{batch.batch_number}.xlsx"'

        return response


class PayrollBatchExportPDFView(APIView):
    """Export payroll batch to PDF."""
    permission_classes = (IsAuthenticated,)

    def get(self, request, pk):
        """Generate and download PDF export."""
        from django.http import HttpResponse
        from .exports import PayrollBatchPDFExport

        try:
            batch = PayrollBatch.objects.get(pk=pk, client=request.current_client)
        except PayrollBatch.DoesNotExist:
            return Response(
                {'error': 'Payroll batch not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        exporter = PayrollBatchPDFExport(batch)
        pdf_file = exporter.generate()

        response = HttpResponse(pdf_file.read(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Payroll_Batch_{batch.batch_number}.pdf"'

        return response


class PayslipPDFExportView(APIView):
    """Export individual payslip to PDF."""
    permission_classes = (IsAuthenticated,)

    def get(self, request, pk):
        """Generate and download payslip PDF."""
        from django.http import HttpResponse
        from .exports import PayslipPDFExport

        try:
            payroll = Payroll.objects.select_related('employee', 'period', 'client').prefetch_related(
                'earnings', 'deductions'
            ).get(pk=pk, client=request.current_client)
        except Payroll.DoesNotExist:
            return Response(
                {'error': 'Payroll not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        exporter = PayslipPDFExport(payroll)
        pdf_file = exporter.generate()

        response = HttpResponse(pdf_file.read(), content_type='application/pdf')
        filename = f"Payslip_{payroll.employee.employee_id}_{payroll.period.title.replace(' ', '_')}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'

        return response
