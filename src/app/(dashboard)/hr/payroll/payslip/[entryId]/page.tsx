'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Printer, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useFormatters } from '@/hooks/use-formatters'

interface PayslipData {
  organizationName: string
  payPeriod: string
  paymentDate: string
  employee: {
    name: string
    employeeId: string
    department: string
    designation: string
    grade: string
    bankAccountLast4: string
  }
  earnings: { component: string; amount: number }[]
  deductions: { component: string; amount: number }[]
  employerContributions?: { component: string; amount: number }[]
  grossPay: number
  totalDeductions: number
  netPay: number
  netPayInWords: string
  attendance?: {
    workingDays: number
    presentDays: number
    absentDays: number
    otHours: number
  }
  ytd?: {
    grossPay: number
    totalDeductions: number
    netPay: number
  }
}

function formatPayPeriod(payPeriod: unknown): string {
  if (typeof payPeriod === 'string') return payPeriod
  if (
    payPeriod &&
    typeof payPeriod === 'object' &&
    'month' in payPeriod &&
    'year' in payPeriod
  ) {
    const { month, year } = payPeriod as { month: number; year: number }
    if (month && year) {
      return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    }
  }
  return ''
}

function normalizePayslipData(data: any): PayslipData {
  const employee = data.employee ?? {}
  const summary = data.summary ?? data

  return {
    organizationName: data.organizationName ?? 'CSS BD',
    payPeriod: formatPayPeriod(data.payPeriod),
    paymentDate: data.paymentDate ?? '',
    employee: {
      name: employee.name ?? employee.fullName ?? '',
      employeeId: employee.employeeId ?? employee.employeeNo ?? '',
      department: employee.department ?? '',
      designation: employee.designation ?? '',
      grade: employee.grade ?? '',
      bankAccountLast4: employee.bankAccountLast4 ?? employee.bankLast4 ?? '',
    },
    earnings: data.earnings ?? [],
    deductions: data.deductions ?? [],
    employerContributions: data.employerContributions ?? [],
    grossPay: Number(summary.grossPay ?? 0),
    totalDeductions: Number(summary.totalDeductions ?? 0),
    netPay: Number(summary.netPay ?? 0),
    netPayInWords: summary.netPayInWords ?? '',
    attendance: data.attendance,
    ytd: data.ytd,
  }
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatPrintCurrency(amount: number): string {
  return `BDT ${new Intl.NumberFormat('en-BD').format(Number(amount || 0))}`
}

function printPayslip(payslip: PayslipData) {
  const printWindow = window.open('', '_blank', 'width=900,height=700')
  if (!printWindow) {
    window.print()
    return
  }

  const earningsRows = payslip.earnings.map((earning) => `
    <tr>
      <td>${escapeHtml(earning.component)}</td>
      <td class="amount">${formatPrintCurrency(earning.amount)}</td>
    </tr>
  `).join('')

  const deductionRows = payslip.deductions.map((deduction) => `
    <tr>
      <td>${escapeHtml(deduction.component)}</td>
      <td class="amount">${formatPrintCurrency(deduction.amount)}</td>
    </tr>
  `).join('')

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Payslip - ${escapeHtml(payslip.employee.employeeId)}</title>
  <style>
    @page { size: A4; margin: 14mm; }
    body { font-family: Arial, sans-serif; color: #111827; margin: 0; }
    .payslip { max-width: 760px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 1px solid #d1d5db; padding-bottom: 14px; margin-bottom: 18px; }
    h1 { font-size: 18px; margin: 0 0 4px; text-transform: uppercase; }
    h2 { font-size: 15px; margin: 0 0 8px; text-transform: uppercase; color: #4b5563; }
    .muted { color: #6b7280; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 28px; margin-bottom: 18px; border-bottom: 1px solid #d1d5db; padding-bottom: 14px; }
    .field { display: flex; justify-content: space-between; gap: 16px; font-size: 13px; }
    .field strong { text-align: right; }
    .tables { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; margin-bottom: 18px; }
    h3 { font-size: 13px; margin: 0 0 8px; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; color: #6b7280; border-bottom: 1px solid #d1d5db; padding: 6px 0; font-weight: 600; }
    td { border-bottom: 1px dashed #d1d5db; padding: 7px 0; }
    tfoot td { border-bottom: none; font-weight: 700; padding-top: 9px; }
    .amount { text-align: right; font-family: Consolas, monospace; }
    .summary { border: 1px solid #d1d5db; background: #f9fafb; padding: 14px; margin-bottom: 18px; }
    .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; text-align: center; }
    .summary-label { color: #6b7280; font-size: 12px; margin-bottom: 4px; }
    .summary-value { font-family: Consolas, monospace; font-size: 18px; font-weight: 700; }
    .net { color: #047857; font-size: 22px; }
    .words { border-top: 1px solid #d1d5db; margin-top: 12px; padding-top: 10px; text-align: center; font-size: 12px; color: #6b7280; font-style: italic; }
    .attendance { border-top: 1px solid #d1d5db; padding-top: 12px; }
    .attendance-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; text-align: center; font-size: 13px; }
    .footer { border-top: 1px solid #d1d5db; margin-top: 22px; padding-top: 12px; text-align: center; color: #6b7280; font-size: 10px; }
  </style>
</head>
<body>
  <div class="payslip">
    <div class="header">
      <h1>${escapeHtml(payslip.organizationName)}</h1>
      <h2>Payslip</h2>
      <div class="muted">Pay Period: ${escapeHtml(payslip.payPeriod)}${payslip.paymentDate ? ` | Payment Date: ${escapeHtml(new Date(payslip.paymentDate).toLocaleDateString())}` : ''}</div>
    </div>

    <div class="grid">
      <div class="field"><span class="muted">Name:</span><strong>${escapeHtml(payslip.employee.name)}</strong></div>
      <div class="field"><span class="muted">Employee ID:</span><strong>${escapeHtml(payslip.employee.employeeId)}</strong></div>
      <div class="field"><span class="muted">Department:</span><strong>${escapeHtml(payslip.employee.department)}</strong></div>
      <div class="field"><span class="muted">Designation:</span><strong>${escapeHtml(payslip.employee.designation)}</strong></div>
      ${payslip.employee.grade ? `<div class="field"><span class="muted">Grade:</span><strong>${escapeHtml(payslip.employee.grade)}</strong></div>` : ''}
      ${payslip.employee.bankAccountLast4 ? `<div class="field"><span class="muted">Bank A/C:</span><strong>****${escapeHtml(payslip.employee.bankAccountLast4)}</strong></div>` : ''}
    </div>

    <div class="tables">
      <div>
        <h3>Earnings</h3>
        <table>
          <thead><tr><th>Component</th><th class="amount">Amount</th></tr></thead>
          <tbody>${earningsRows}</tbody>
          <tfoot><tr><td>Gross Pay</td><td class="amount">${formatPrintCurrency(payslip.grossPay)}</td></tr></tfoot>
        </table>
      </div>
      <div>
        <h3>Deductions</h3>
        <table>
          <thead><tr><th>Component</th><th class="amount">Amount</th></tr></thead>
          <tbody>${deductionRows}</tbody>
          <tfoot><tr><td>Total Deductions</td><td class="amount">${formatPrintCurrency(payslip.totalDeductions)}</td></tr></tfoot>
        </table>
      </div>
    </div>

    <div class="summary">
      <div class="summary-grid">
        <div><div class="summary-label">Gross Pay</div><div class="summary-value">${formatPrintCurrency(payslip.grossPay)}</div></div>
        <div><div class="summary-label">Total Deductions</div><div class="summary-value">${formatPrintCurrency(payslip.totalDeductions)}</div></div>
        <div><div class="summary-label">Net Pay</div><div class="summary-value net">${formatPrintCurrency(payslip.netPay)}</div></div>
      </div>
      ${payslip.netPayInWords ? `<div class="words">Net Pay In Words: ${escapeHtml(payslip.netPayInWords)}</div>` : ''}
    </div>

    ${payslip.attendance ? `
      <div class="attendance">
        <h3>Attendance Summary</h3>
        <div class="attendance-grid">
          <div><div class="muted">Working Days</div><strong>${escapeHtml(payslip.attendance.workingDays)}</strong></div>
          <div><div class="muted">Present Days</div><strong>${escapeHtml(payslip.attendance.presentDays)}</strong></div>
          <div><div class="muted">Absent Days</div><strong>${escapeHtml(payslip.attendance.absentDays)}</strong></div>
          <div><div class="muted">OT Hours</div><strong>${escapeHtml(payslip.attendance.otHours)}</strong></div>
        </div>
      </div>
    ` : ''}

    <div class="footer">This is a computer-generated payslip. No signature required.</div>
  </div>
  <script>
    window.addEventListener('load', function () {
      setTimeout(function () {
        window.focus();
        window.print();
      }, 150);
    });
  </script>
</body>
</html>`

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
}

export default function PayslipViewerPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('hr')
  const { formatCurrency } = useFormatters()

  const [payslip, setPayslip] = useState<PayslipData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const entryId = params.entryId as string

  useEffect(() => {
    fetch(`/api/v1/hr/payroll/entries/${entryId}/payslip`)
      .then(res => res.json())
      .then(json => {
        if (json.success) setPayslip(normalizePayslipData(json.data))
        else setError('Failed to load payslip')
      })
      .catch(() => setError('Failed to load payslip'))
      .finally(() => setLoading(false))
  }, [entryId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !payslip) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">{error || 'Payslip not found'}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push('/hr/payroll')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Payroll
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Action bar — hidden in print */}
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" size="sm" onClick={() => router.push('/hr/payroll')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('payroll.title')}
        </Button>
        <Button size="sm" onClick={() => printPayslip(payslip)}>
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
      </div>

      {/* Payslip Content */}
      <Card className="payslip-print-area max-w-3xl mx-auto print:shadow-none print:border-0">
        <CardContent className="p-8 print:p-4 space-y-6">
          {/* Header */}
          <div className="text-center border-b pb-4">
            <h1 className="text-lg font-bold uppercase tracking-wider">
              {payslip.organizationName}
            </h1>
            <h2 className="text-base font-semibold mt-1 text-muted-foreground uppercase tracking-wide">
              {t('payslip.title')}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {t('payslip.payPeriod')}: {payslip.payPeriod}
              {payslip.paymentDate && (
                <span className="ml-4">{t('payslip.paymentDate')}: {new Date(payslip.paymentDate).toLocaleDateString()}</span>
              )}
            </p>
          </div>

          {/* Employee Details */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm border-b pb-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name:</span>
              <span className="font-medium">{payslip.employee.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Employee ID:</span>
              <span className="font-mono font-medium">{payslip.employee.employeeId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Department:</span>
              <span className="font-medium">{payslip.employee.department}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Designation:</span>
              <span className="font-medium">{payslip.employee.designation}</span>
            </div>
            {payslip.employee.grade && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Grade:</span>
                <span className="font-medium">{payslip.employee.grade}</span>
              </div>
            )}
            {payslip.employee.bankAccountLast4 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bank A/C:</span>
                <span className="font-mono font-medium">****{payslip.employee.bankAccountLast4}</span>
              </div>
            )}
          </div>

          {/* Earnings & Deductions — Two-column layout */}
          <div className="grid grid-cols-2 gap-6">
            {/* Earnings */}
            <div>
              <h3 className="text-sm font-semibold mb-2 uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                {t('payslip.earnings')}
              </h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1 font-medium text-muted-foreground">{t('payslip.component')}</th>
                    <th className="text-right py-1 font-medium text-muted-foreground">{t('payslip.amount')}</th>
                  </tr>
                </thead>
                <tbody>
                  {payslip.earnings.map((e, i) => (
                    <tr key={i} className="border-b border-dashed">
                      <td className="py-1">{e.component}</td>
                      <td className="text-right font-mono">{formatCurrency(e.amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-semibold">
                    <td className="py-1.5">{t('payslip.grossPay')}</td>
                    <td className="text-right font-mono">{formatCurrency(payslip.grossPay)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Deductions */}
            <div>
              <h3 className="text-sm font-semibold mb-2 uppercase tracking-wide text-red-700 dark:text-red-400">
                {t('payslip.deductions')}
              </h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1 font-medium text-muted-foreground">{t('payslip.component')}</th>
                    <th className="text-right py-1 font-medium text-muted-foreground">{t('payslip.amount')}</th>
                  </tr>
                </thead>
                <tbody>
                  {payslip.deductions.map((d, i) => (
                    <tr key={i} className="border-b border-dashed">
                      <td className="py-1">{d.component}</td>
                      <td className="text-right font-mono">{formatCurrency(d.amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-semibold">
                    <td className="py-1.5">{t('payslip.totalDeductions')}</td>
                    <td className="text-right font-mono">{formatCurrency(payslip.totalDeductions)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Employer Contributions */}
          {payslip.employerContributions && payslip.employerContributions.length > 0 && (
            <div className="border-t pt-3">
              <h3 className="text-sm font-semibold mb-2 uppercase tracking-wide text-muted-foreground">
                {t('payslip.employerContributions')}
              </h3>
              <div className="grid grid-cols-2 gap-x-6 text-sm">
                {payslip.employerContributions.map((c, i) => (
                  <div key={i} className="flex justify-between py-0.5">
                    <span>{c.component}</span>
                    <span className="font-mono">{formatCurrency(c.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Net Pay Summary */}
          <div className="bg-muted/50 rounded-lg p-4 border">
            <div className="grid grid-cols-3 gap-4 text-sm mb-3">
              <div className="text-center">
                <p className="text-muted-foreground">{t('payslip.grossPay')}</p>
                <p className="text-lg font-semibold font-mono">{formatCurrency(payslip.grossPay)}</p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground">{t('payslip.totalDeductions')}</p>
                <p className="text-lg font-semibold font-mono text-red-600">{formatCurrency(payslip.totalDeductions)}</p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground">{t('payslip.netPay')}</p>
                <p className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(payslip.netPay)}
                </p>
              </div>
            </div>
            {payslip.netPayInWords && (
              <p className="text-xs text-center text-muted-foreground border-t pt-2 italic">
                {t('payslip.netPayInWords')}: {payslip.netPayInWords}
              </p>
            )}
          </div>

          {/* Attendance Summary */}
          {payslip.attendance && (
            <div className="border-t pt-3">
              <h3 className="text-sm font-semibold mb-2 uppercase tracking-wide text-muted-foreground">
                {t('payslip.attendanceSummary')}
              </h3>
              <div className="grid grid-cols-4 gap-4 text-sm text-center">
                <div>
                  <p className="text-muted-foreground">{t('payslip.workingDays')}</p>
                  <p className="text-lg font-semibold">{payslip.attendance.workingDays}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('payslip.presentDays')}</p>
                  <p className="text-lg font-semibold">{payslip.attendance.presentDays}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('payslip.absentDays')}</p>
                  <p className="text-lg font-semibold">{payslip.attendance.absentDays}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">OT Hours</p>
                  <p className="text-lg font-semibold">{payslip.attendance.otHours}</p>
                </div>
              </div>
            </div>
          )}

          {/* YTD Section */}
          {payslip.ytd && (
            <div className="border-t pt-3">
              <h3 className="text-sm font-semibold mb-2 uppercase tracking-wide text-muted-foreground">
                {t('payslip.ytd')}
              </h3>
              <div className="grid grid-cols-3 gap-4 text-sm text-center">
                <div>
                  <p className="text-muted-foreground">{t('payslip.grossPay')}</p>
                  <p className="font-semibold font-mono">{formatCurrency(payslip.ytd.grossPay)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('payslip.totalDeductions')}</p>
                  <p className="font-semibold font-mono">{formatCurrency(payslip.ytd.totalDeductions)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('payslip.netPay')}</p>
                  <p className="font-semibold font-mono">{formatCurrency(payslip.ytd.netPay)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Footer - visible in print */}
          <div className="border-t pt-4 text-[10px] text-muted-foreground text-center hidden print:block">
            This is a computer-generated payslip. No signature required.
          </div>
        </CardContent>
      </Card>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:hidden { display: none !important; }
          .payslip-print-area {
            visibility: visible !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: none !important;
            box-shadow: none !important;
            border: none !important;
          }
          .payslip-print-area * { visibility: visible !important; }
          .print\\:block { display: block !important; }
          nav, header, aside, [data-sidebar] { display: none !important; }
        }
      `}</style>
    </div>
  )
}
