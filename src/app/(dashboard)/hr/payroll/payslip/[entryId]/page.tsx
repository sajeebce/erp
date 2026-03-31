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
        if (json.success) setPayslip(json.data)
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
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
      </div>

      {/* Payslip Content */}
      <Card className="max-w-3xl mx-auto print:shadow-none print:border-0">
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
          [data-slot="card"] { visibility: visible; position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border: none !important; }
          [data-slot="card"] * { visibility: visible; }
          .print\\:block { display: block !important; }
          nav, header, aside, [data-sidebar] { display: none !important; }
        }
      `}</style>
    </div>
  )
}
