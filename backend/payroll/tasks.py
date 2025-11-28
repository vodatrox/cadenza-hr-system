"""
Celery tasks for payroll processing.
"""
from celery import shared_task
from django.utils import timezone
from .models import PayrollPeriod, Payroll, PayrollSettings
from employees.models import Employee


@shared_task
def generate_payroll_for_period(period_id, client_id):
    """
    Generate payroll for all active employees in a period.
    """
    try:
        period = PayrollPeriod.objects.get(id=period_id, client_id=client_id)
        settings = PayrollSettings.objects.get(client_id=client_id)

        # Update period status
        period.status = 'PROCESSING'
        period.save()

        # Get all active employees for this client
        employees = Employee.objects.filter(
            client_id=client_id,
            status='ACTIVE'
        )

        created_count = 0
        for employee in employees:
            # Check if payroll already exists
            if not Payroll.objects.filter(employee=employee, period=period).exists():
                payroll = Payroll(
                    employee=employee,
                    period=period,
                    client_id=client_id
                )
                payroll.calculate(settings)
                payroll.save()
                created_count += 1

        # Update period status to completed
        period.status = 'COMPLETED'
        period.save()

        return {
            'success': True,
            'period_id': period_id,
            'created_count': created_count
        }

    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


@shared_task
def recalculate_payroll(payroll_id):
    """
    Recalculate a specific payroll.
    """
    try:
        payroll = Payroll.objects.get(id=payroll_id)
        settings = PayrollSettings.objects.get(client=payroll.client)

        payroll.calculate(settings)
        payroll.save()

        return {
            'success': True,
            'payroll_id': payroll_id
        }

    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


@shared_task
def send_payslip_notifications(period_id):
    """
    Send payslip notifications to employees.
    This is a placeholder for future email functionality.
    """
    try:
        period = PayrollPeriod.objects.get(id=period_id)
        payrolls = Payroll.objects.filter(period=period, status='APPROVED')

        # Placeholder: In production, you would send emails here
        sent_count = 0
        for payroll in payrolls:
            # Send email to payroll.employee.email
            # For now, just count
            sent_count += 1

        return {
            'success': True,
            'sent_count': sent_count
        }

    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }
