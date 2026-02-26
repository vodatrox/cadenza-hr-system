"""
Export utilities for payroll data.
"""
from io import BytesIO
from datetime import datetime
from decimal import Decimal

from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from openpyxl.utils import get_column_letter

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT

from .models import PayrollBatch, Payroll


class PayrollBatchExcelExport:
    """Generate Excel export for payroll batch."""

    def __init__(self, batch):
        self.batch = batch
        self.wb = Workbook()
        self.ws = self.wb.active
        self.ws.title = "Payroll Batch"

    def generate(self):
        """Generate the Excel file."""
        self._add_header()
        self._add_batch_info()
        self._add_summary()
        self._add_payroll_details()
        self._format_columns()

        # Save to BytesIO
        output = BytesIO()
        self.wb.save(output)
        output.seek(0)
        return output

    def _add_header(self):
        """Add header section."""
        # Company header
        self.ws['A1'] = self.batch.client.name
        self.ws['A1'].font = Font(size=16, bold=True, color="1F4788")
        self.ws.merge_cells('A1:H1')

        self.ws['A2'] = 'Payroll Batch Report'
        self.ws['A2'].font = Font(size=14, bold=True)
        self.ws.merge_cells('A2:H2')

        self.ws['A3'] = f"Generated on: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}"
        self.ws['A3'].font = Font(size=10, italic=True, color="666666")
        self.ws.merge_cells('A3:H3')

    def _add_batch_info(self):
        """Add batch information."""
        row = 5

        # Batch details
        info = [
            ('Batch Number:', self.batch.batch_number),
            ('Batch Title:', self.batch.title),
            ('Period:', self.batch.period.title),
            ('Status:', self.batch.status),
            ('Employee Count:', str(self.batch.payroll_count)),
        ]

        for label, value in info:
            self.ws[f'A{row}'] = label
            self.ws[f'A{row}'].font = Font(bold=True)
            self.ws[f'B{row}'] = value
            row += 1

    def _add_summary(self):
        """Add summary section."""
        row = 12

        # Summary header
        self.ws[f'A{row}'] = 'FINANCIAL SUMMARY'
        self.ws[f'A{row}'].font = Font(size=12, bold=True, color="FFFFFF")
        self.ws[f'A{row}'].fill = PatternFill(start_color="1F4788", end_color="1F4788", fill_type="solid")
        self.ws.merge_cells(f'A{row}:B{row}')
        row += 1

        # Summary data
        summary_data = [
            ('Total Gross Pay:', f"₦{self.batch.total_gross_pay:,.2f}"),
            ('Total Deductions:', f"₦{self.batch.total_deductions:,.2f}"),
            ('Total Net Pay:', f"₦{self.batch.total_net_pay:,.2f}"),
        ]

        for label, value in summary_data:
            self.ws[f'A{row}'] = label
            self.ws[f'A{row}'].font = Font(bold=True)
            self.ws[f'B{row}'] = value
            self.ws[f'B{row}'].font = Font(size=11)
            row += 1

    def _add_payroll_details(self):
        """Add detailed payroll table."""
        row = 18

        # Table header
        self.ws[f'A{row}'] = 'PAYROLL DETAILS'
        self.ws[f'A{row}'].font = Font(size=12, bold=True, color="FFFFFF")
        self.ws[f'A{row}'].fill = PatternFill(start_color="1F4788", end_color="1F4788", fill_type="solid")
        self.ws.merge_cells(f'A{row}:H{row}')
        row += 1

        # Column headers
        headers = ['Employee ID', 'Employee Name', 'Basic Salary', 'Gross Pay',
                   'Deductions', 'Net Pay', 'Status', 'Payment Date']

        for col_num, header in enumerate(headers, 1):
            cell = self.ws.cell(row=row, column=col_num)
            cell.value = header
            cell.font = Font(bold=True, color="FFFFFF")
            cell.fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
            cell.alignment = Alignment(horizontal='center', vertical='center')

        row += 1

        # Payroll data
        payrolls = self.batch.payrolls.all().select_related('employee').order_by('employee__first_name')

        for payroll in payrolls:
            data = [
                payroll.employee.employee_id,
                payroll.employee.get_full_name(),
                float(payroll.basic_salary),
                float(payroll.gross_pay),
                float(payroll.total_deductions),
                float(payroll.net_pay),
                payroll.status,
                payroll.payment_date.strftime('%Y-%m-%d') if payroll.payment_date else '-'
            ]

            for col_num, value in enumerate(data, 1):
                cell = self.ws.cell(row=row, column=col_num)
                cell.value = value

                # Format currency columns
                if col_num in [3, 4, 5, 6]:
                    cell.number_format = '₦#,##0.00'

                # Alternate row colors
                if row % 2 == 0:
                    cell.fill = PatternFill(start_color="F2F2F2", end_color="F2F2F2", fill_type="solid")

            row += 1

        # Total row
        total_row = row
        self.ws[f'A{total_row}'] = 'TOTAL'
        self.ws[f'A{total_row}'].font = Font(bold=True, size=11)
        self.ws.merge_cells(f'A{total_row}:B{total_row}')

        self.ws[f'C{total_row}'] = float(sum(p.basic_salary for p in payrolls))
        self.ws[f'D{total_row}'] = float(sum(p.gross_pay for p in payrolls))
        self.ws[f'E{total_row}'] = float(sum(p.total_deductions for p in payrolls))
        self.ws[f'F{total_row}'] = float(sum(p.net_pay for p in payrolls))

        for col in ['C', 'D', 'E', 'F']:
            cell = self.ws[f'{col}{total_row}']
            cell.font = Font(bold=True, size=11)
            cell.number_format = '₦#,##0.00'
            cell.fill = PatternFill(start_color="D9E1F2", end_color="D9E1F2", fill_type="solid")

    def _format_columns(self):
        """Format column widths."""
        column_widths = {
            'A': 15, 'B': 30, 'C': 15, 'D': 15,
            'E': 15, 'F': 15, 'G': 12, 'H': 15
        }

        for col, width in column_widths.items():
            self.ws.column_dimensions[col].width = width


class PayrollBatchPDFExport:
    """Generate PDF export for payroll batch."""

    def __init__(self, batch):
        self.batch = batch
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()

    def _setup_custom_styles(self):
        """Setup custom styles."""
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1F4788'),
            spaceAfter=12,
            alignment=TA_CENTER
        ))

        self.styles.add(ParagraphStyle(
            name='CustomHeading',
            parent=self.styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#1F4788'),
            spaceAfter=6,
            spaceBefore=12
        ))

    def generate(self):
        """Generate PDF file."""
        output = BytesIO()
        doc = SimpleDocTemplate(
            output,
            pagesize=A4,
            rightMargin=30,
            leftMargin=30,
            topMargin=30,
            bottomMargin=30
        )

        story = []

        # Header
        story.append(Paragraph(self.batch.client.name, self.styles['CustomTitle']))
        story.append(Paragraph('Payroll Batch Report', self.styles['Heading2']))
        story.append(Paragraph(
            f"Generated on: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}",
            self.styles['Normal']
        ))
        story.append(Spacer(1, 0.3*inch))

        # Batch Info
        batch_data = [
            ['Batch Number:', self.batch.batch_number],
            ['Batch Title:', self.batch.title],
            ['Period:', self.batch.period.title],
            ['Status:', self.batch.status],
            ['Employee Count:', str(self.batch.payroll_count)],
        ]

        batch_table = Table(batch_data, colWidths=[2*inch, 4*inch])
        batch_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(batch_table)
        story.append(Spacer(1, 0.3*inch))

        # Summary
        story.append(Paragraph('Financial Summary', self.styles['CustomHeading']))
        summary_data = [
            ['Total Gross Pay:', f"₦{self.batch.total_gross_pay:,.2f}"],
            ['Total Deductions:', f"₦{self.batch.total_deductions:,.2f}"],
            ['Total Net Pay:', f"₦{self.batch.total_net_pay:,.2f}"],
        ]

        summary_table = Table(summary_data, colWidths=[2*inch, 2*inch])
        summary_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F0F0F0')),
            ('BOX', (0, 0), (-1, -1), 1, colors.grey),
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 0.3*inch))

        # Payroll Details
        story.append(Paragraph('Payroll Details', self.styles['CustomHeading']))

        payrolls = self.batch.payrolls.all().select_related('employee').order_by('employee__first_name')

        table_data = [['Employee ID', 'Name', 'Basic Salary', 'Gross Pay', 'Deductions', 'Net Pay']]

        for payroll in payrolls:
            table_data.append([
                payroll.employee.employee_id,
                payroll.employee.get_full_name()[:25],
                f"₦{payroll.basic_salary:,.0f}",
                f"₦{payroll.gross_pay:,.0f}",
                f"₦{payroll.total_deductions:,.0f}",
                f"₦{payroll.net_pay:,.0f}",
            ])

        # Total row
        table_data.append([
            'TOTAL', '',
            f"₦{sum(p.basic_salary for p in payrolls):,.0f}",
            f"₦{sum(p.gross_pay for p in payrolls):,.0f}",
            f"₦{sum(p.total_deductions for p in payrolls):,.0f}",
            f"₦{sum(p.net_pay for p in payrolls):,.0f}",
        ])

        payroll_table = Table(table_data, colWidths=[0.8*inch, 1.8*inch, 1.2*inch, 1.2*inch, 1.2*inch, 1.2*inch])
        payroll_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4788')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -2), colors.beige),
            ('GRID', (0, 0), (-1, -2), 1, colors.grey),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#D9E1F2')),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ]))

        story.append(payroll_table)

        doc.build(story)
        output.seek(0)
        return output


class PayslipPDFExport:
    """Generate professional PDF payslip."""

    def __init__(self, payroll):
        self.payroll = payroll
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()

    def _setup_custom_styles(self):
        """Setup custom styles for payslip."""
        self.styles.add(ParagraphStyle(
            name='CompanyName',
            parent=self.styles['Heading1'],
            fontSize=20,
            textColor=colors.HexColor('#1F4788'),
            spaceAfter=6,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))

        self.styles.add(ParagraphStyle(
            name='PayslipTitle',
            parent=self.styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#333333'),
            spaceAfter=12,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))

        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            fontSize=11,
            textColor=colors.HexColor('#1F4788'),
            spaceAfter=6,
            spaceBefore=8,
            fontName='Helvetica-Bold'
        ))

    def generate(self):
        """Generate the payslip PDF."""
        output = BytesIO()
        doc = SimpleDocTemplate(
            output,
            pagesize=letter,
            rightMargin=50,
            leftMargin=50,
            topMargin=40,
            bottomMargin=40
        )

        story = []

        # Header
        story.append(Paragraph(self.payroll.client.name, self.styles['CompanyName']))
        story.append(Paragraph('PAYSLIP', self.styles['PayslipTitle']))
        story.append(Spacer(1, 0.2*inch))

        # Period info
        period_data = [[
            Paragraph(f"<b>Pay Period:</b> {self.payroll.period.title}", self.styles['Normal']),
            Paragraph(f"<b>Payment Date:</b> {self.payroll.payment_date or 'Pending'}", self.styles['Normal'])
        ]]

        period_table = Table(period_data, colWidths=[3.25*inch, 3.25*inch])
        period_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F5F5F5')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#CCCCCC')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(period_table)
        story.append(Spacer(1, 0.2*inch))

        # Employee Details
        emp_data = [
            [Paragraph('<b>Employee Name:</b>', self.styles['Normal']),
             Paragraph(self.payroll.employee.get_full_name(), self.styles['Normal']),
             Paragraph('<b>Employee ID:</b>', self.styles['Normal']),
             Paragraph(self.payroll.employee.employee_id, self.styles['Normal'])],
        ]

        emp_table = Table(emp_data, colWidths=[1.3*inch, 2*inch, 1.2*inch, 1.5*inch])
        emp_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.white),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#CCCCCC')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(emp_table)
        story.append(Spacer(1, 0.3*inch))

        # Earnings and Deductions
        earnings_deductions_data = []

        # Headers
        earnings_deductions_data.append([
            Paragraph('<b>EARNINGS</b>', self.styles['SectionHeader']),
            '',
            Paragraph('<b>DEDUCTIONS</b>', self.styles['SectionHeader']),
            ''
        ])

        # Earnings list
        earnings = [
            ('Basic Salary', self.payroll.basic_salary),
        ]

        if self.payroll.total_allowances > 0:
            earnings.append(('Allowances', self.payroll.total_allowances))

        # Statutory earnings
        from .serializers import PayrollDetailSerializer
        serializer = PayrollDetailSerializer(self.payroll)
        if serializer.data.get('statutory_earnings_breakdown'):
            for earning in serializer.data['statutory_earnings_breakdown']:
                earnings.append((earning['name'], Decimal(earning['amount'])))

        if self.payroll.earnings.exists():
            for earning in self.payroll.earnings.all():
                earnings.append((earning.name, earning.amount))

        # Deductions list
        deductions = []

        if self.payroll.pension > 0:
            deductions.append(('Pension', self.payroll.pension))

        if self.payroll.nhf > 0:
            deductions.append(('NHF', self.payroll.nhf))

        if self.payroll.tax > 0:
            deductions.append(('Income Tax', self.payroll.tax))

        # Statutory deductions
        if serializer.data.get('statutory_deductions_breakdown'):
            for deduction in serializer.data['statutory_deductions_breakdown']:
                deductions.append((deduction['name'], Decimal(deduction['amount'])))

        if self.payroll.deductions.exists():
            for deduction in self.payroll.deductions.all():
                deductions.append((deduction.name, deduction.amount))

        # Build rows
        max_rows = max(len(earnings), len(deductions))

        for i in range(max_rows):
            row = []

            if i < len(earnings):
                row.extend([earnings[i][0], f"₦{earnings[i][1]:,.2f}"])
            else:
                row.extend(['', ''])

            if i < len(deductions):
                row.extend([deductions[i][0], f"₦{deductions[i][1]:,.2f}"])
            else:
                row.extend(['', ''])

            earnings_deductions_data.append(row)

        # Totals
        earnings_deductions_data.append([
            Paragraph('<b>GROSS PAY</b>', self.styles['Normal']),
            Paragraph(f"<b>₦{self.payroll.gross_pay:,.2f}</b>", self.styles['Normal']),
            Paragraph('<b>TOTAL DEDUCTIONS</b>', self.styles['Normal']),
            Paragraph(f"<b>₦{self.payroll.total_deductions:,.2f}</b>", self.styles['Normal']),
        ])

        ed_table = Table(earnings_deductions_data, colWidths=[2*inch, 1.25*inch, 2*inch, 1.25*inch])
        ed_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (1, 0), colors.HexColor('#E8F0FE')),
            ('BACKGROUND', (2, 0), (3, 0), colors.HexColor('#FCE8E6')),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('ALIGN', (1, 1), (1, -1), 'RIGHT'),
            ('ALIGN', (3, 1), (3, -1), 'RIGHT'),
            ('GRID', (0, 0), (-1, -2), 0.5, colors.grey),
            ('LINEABOVE', (0, -1), (-1, -1), 2, colors.HexColor('#1F4788')),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#F0F0F0')),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))

        story.append(ed_table)
        story.append(Spacer(1, 0.3*inch))

        # Net Pay
        net_pay_data = [[
            Paragraph('<b>NET PAY (Take Home)</b>', self.styles['Heading3']),
            Paragraph(f"<b>₦{self.payroll.net_pay:,.2f}</b>", self.styles['Heading3'])
        ]]

        net_pay_table = Table(net_pay_data, colWidths=[4.5*inch, 2*inch])
        net_pay_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#D5EAD8')),
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
            ('BOX', (0, 0), (-1, -1), 2, colors.HexColor('#10773A')),
            ('TOPPADDING', (0, 0), (-1, -1), 12),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ]))
        story.append(net_pay_table)
        story.append(Spacer(1, 0.4*inch))

        # Footer
        footer_text = "This is a computer-generated payslip and does not require a signature."
        story.append(Paragraph(footer_text, self.styles['Normal']))

        doc.build(story)
        output.seek(0)
        return output
