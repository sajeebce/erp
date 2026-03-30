'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

interface RepaymentSchedule {
  month: number
  emiAmount: number
  principalPortion: number
  interestPortion: number
  balance: number
}

interface PaymentHistory {
  id: string
  date: string
  amount: number
  principalPaid: number
  interestPaid: number
}

interface PFLoan {
  id: string
  loanNo: string
  employee?: { fullName: string; employeeNo: string }
  principalAmount: number
  interestRate: number
  repaymentMonths: number
  monthlyInstallment: number
  totalInterest: number
  totalRepayable: number
  outstandingBalance: number
  paidAmount: number
  status: string
  disbursedAt?: string
  createdAt: string
  repaymentSchedule: RepaymentSchedule[]
  paymentHistory: PaymentHistory[]
}

export default function PFLoanDetailPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const { formatCurrency, formatDate } = useFormatters()

  const [data, setData] = useState<PFLoan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!params.id) return
    fetch(`/api/v1/hr/provident-fund/loans/${params.id}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) setData(json.data)
        else setError(tc('errors.notFound'))
      })
      .catch(() => setError(tc('errors.loadFailed')))
      .finally(() => setLoading(false))
  }, [params.id, tc])

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Loan Detail" description="">
          <Button variant="outline" size="sm" onClick={() => router.push('/hr/pension/provident-fund/loans')}>
            <ArrowLeft className="h-4 w-4 mr-2" />{tc('buttons.back')}
          </Button>
        </PageHeader>
        <Card><CardContent className="py-10 text-center text-muted-foreground">{error || tc('errors.notFound')}</CardContent></Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={`Loan: ${data.loanNo}`} description={data.employee?.fullName || ''}>
        <Button variant="outline" size="sm" onClick={() => router.push('/hr/pension/provident-fund/loans')}>
          <ArrowLeft className="h-4 w-4 mr-2" />{tc('buttons.back')}
        </Button>
      </PageHeader>

      {error && <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Loan Summary</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><span className="text-muted-foreground">Loan No:</span> <span className="font-mono font-medium">{data.loanNo}</span></div>
            <div><span className="text-muted-foreground">Employee:</span> <span className="font-medium">{data.employee?.fullName} ({data.employee?.employeeNo})</span></div>
            <div><span className="text-muted-foreground">Status:</span> <StatusBadge status={data.status} /></div>
            <div><span className="text-muted-foreground">Applied:</span> {formatDate(data.createdAt)}</div>
            {data.disbursedAt && <div><span className="text-muted-foreground">Disbursed:</span> {formatDate(data.disbursedAt)}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Financial Details</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><span className="text-muted-foreground">Principal:</span> <span className="font-mono font-medium">{formatCurrency(data.principalAmount)}</span></div>
            <div><span className="text-muted-foreground">Interest Rate:</span> <span className="font-mono">{data.interestRate}%</span></div>
            <div><span className="text-muted-foreground">Tenure:</span> <span className="font-mono">{data.repaymentMonths} months</span></div>
            <div><span className="text-muted-foreground">Monthly EMI:</span> <span className="font-mono font-medium">{formatCurrency(data.monthlyInstallment)}</span></div>
            <div><span className="text-muted-foreground">Total Interest:</span> <span className="font-mono text-orange-600">{formatCurrency(data.totalInterest)}</span></div>
            <div><span className="text-muted-foreground">Total Repayable:</span> <span className="font-mono font-medium">{formatCurrency(data.totalRepayable)}</span></div>
            <hr />
            <div><span className="text-muted-foreground">Paid:</span> <span className="font-mono text-green-600">{formatCurrency(data.paidAmount)}</span></div>
            <div><span className="text-muted-foreground">Outstanding:</span> <span className="font-mono text-lg font-bold">{formatCurrency(data.outstandingBalance)}</span></div>
          </CardContent>
        </Card>
      </div>

      {data.repaymentSchedule && data.repaymentSchedule.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Repayment Schedule</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium">Month</th>
                    <th className="pb-2 font-medium text-right">EMI</th>
                    <th className="pb-2 font-medium text-right">Principal</th>
                    <th className="pb-2 font-medium text-right">Interest</th>
                    <th className="pb-2 font-medium text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {data.repaymentSchedule.map((s, idx) => (
                    <tr key={idx} className="border-b last:border-0">
                      <td className="py-2 font-medium">{s.month}</td>
                      <td className="py-2 text-right font-mono">{formatCurrency(s.emiAmount)}</td>
                      <td className="py-2 text-right font-mono">{formatCurrency(s.principalPortion)}</td>
                      <td className="py-2 text-right font-mono">{formatCurrency(s.interestPortion)}</td>
                      <td className="py-2 text-right font-mono font-medium">{formatCurrency(s.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {data.paymentHistory && data.paymentHistory.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Payment History</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium text-right">Amount</th>
                    <th className="pb-2 font-medium text-right">Principal</th>
                    <th className="pb-2 font-medium text-right">Interest</th>
                  </tr>
                </thead>
                <tbody>
                  {data.paymentHistory.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-2">{formatDate(p.date)}</td>
                      <td className="py-2 text-right font-mono font-medium">{formatCurrency(p.amount)}</td>
                      <td className="py-2 text-right font-mono">{formatCurrency(p.principalPaid)}</td>
                      <td className="py-2 text-right font-mono">{formatCurrency(p.interestPaid)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
