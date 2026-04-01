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

interface PFSettlement {
  id: string
  settlementNo: string
  employee?: { fullName: string; employeeNo: string }
  status: string
  createdAt: string
  processedAt?: string
  breakdown: {
    employeeContribution: number
    employerContribution: number
    interestEarned: number
    vestedPercent: number
    vestedEmployerAmount: number
    forfeitedAmount: number
    loanDeduction: number
    netPayable: number
  }
}

export default function PFSettlementDetailPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const { formatCurrency, formatDate } = useFormatters()

  const [data, setData] = useState<PFSettlement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!params.id) return
    fetch(`/api/v1/hr/pf/settlements/${params.id}`)
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
        <PageHeader title="Settlement Detail" description="">
          <Button variant="outline" size="sm" onClick={() => router.push('/hr/pension/provident-fund/settlements')}>
            <ArrowLeft className="h-4 w-4 mr-2" />{tc('buttons.back')}
          </Button>
        </PageHeader>
        <Card><CardContent className="py-10 text-center text-muted-foreground">{error || tc('errors.notFound')}</CardContent></Card>
      </div>
    )
  }

  const b = data.breakdown || {
    employeeContribution: 0, employerContribution: 0, interestEarned: 0,
    vestedPercent: 0, vestedEmployerAmount: 0, forfeitedAmount: 0,
    loanDeduction: 0, netPayable: 0,
  }

  return (
    <div className="space-y-6">
      <PageHeader title={`Settlement: ${data.settlementNo}`} description={data.employee?.fullName || ''}>
        <Button variant="outline" size="sm" onClick={() => router.push('/hr/pension/provident-fund/settlements')}>
          <ArrowLeft className="h-4 w-4 mr-2" />{tc('buttons.back')}
        </Button>
      </PageHeader>

      {error && <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Settlement Info</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><span className="text-muted-foreground">Settlement No:</span> <span className="font-mono font-medium">{data.settlementNo}</span></div>
            <div><span className="text-muted-foreground">Employee:</span> <span className="font-medium">{data.employee?.fullName} ({data.employee?.employeeNo})</span></div>
            <div><span className="text-muted-foreground">Status:</span> <StatusBadge status={data.status} /></div>
            <div><span className="text-muted-foreground">Created:</span> {formatDate(data.createdAt)}</div>
            {data.processedAt && <div><span className="text-muted-foreground">Processed:</span> {formatDate(data.processedAt)}</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Settlement Breakdown</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Employee Contribution</span>
              <span className="font-mono font-medium">{formatCurrency(b.employeeContribution)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Employer Contribution</span>
              <span className="font-mono font-medium">{formatCurrency(b.employerContribution)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Interest Earned</span>
              <span className="font-mono font-medium text-green-600">{formatCurrency(b.interestEarned)}</span>
            </div>
            <hr />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vesting: {b.vestedPercent}%</span>
              <span className="font-mono font-medium">{formatCurrency(b.vestedEmployerAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Forfeited (unvested employer)</span>
              <span className="font-mono font-medium text-red-600">-{formatCurrency(b.forfeitedAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Loan Deduction</span>
              <span className="font-mono font-medium text-red-600">-{formatCurrency(b.loanDeduction)}</span>
            </div>
            <hr />
            <div className="flex justify-between font-medium text-base">
              <span>Net Payable</span>
              <span className="font-mono text-xl font-bold">{formatCurrency(b.netPayable)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
