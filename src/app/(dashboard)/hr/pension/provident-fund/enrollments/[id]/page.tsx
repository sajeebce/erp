'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

interface Nominee {
  id: string
  name: string
  relationship: string
  percentage: number
}

interface Contribution {
  id: string
  month: number
  year: number
  employeeAmount: number
  employerAmount: number
  total: number
}

interface EnrollmentDetail {
  id: string
  employee?: { id: string; fullName: string; employeeNo: string; department?: { name: string } }
  policy?: { name: string }
  enrollmentDate: string
  effectiveDate: string
  employeeContribRate?: number
  employerContribRate?: number
  employeeRate?: number
  employerRate?: number
  status: string
  balanceBreakdown: {
    employeeContrib: number
    employerContrib: number
    interestEarned: number
    withdrawals: number
    loanOutstanding: number
    netBalance: number
  }
  nominees: Nominee[]
  contributions: Contribution[]
}

export default function PFEnrollmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const { formatCurrency, formatDate } = useFormatters()

  const [data, setData] = useState<EnrollmentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!params.id) return
    fetch(`/api/v1/hr/pf/enrollments/${params.id}`)
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
        <PageHeader title="Member Detail" description="">
          <Button variant="outline" size="sm" onClick={() => router.push('/hr/pension/provident-fund/enrollments')}>
            <ArrowLeft className="h-4 w-4 mr-2" />{tc('buttons.back')}
          </Button>
        </PageHeader>
        <Card><CardContent className="py-10 text-center text-muted-foreground">{error || tc('errors.notFound')}</CardContent></Card>
      </div>
    )
  }

  const bal = data.balanceBreakdown || { employeeContrib: 0, employerContrib: 0, interestEarned: 0, withdrawals: 0, loanOutstanding: 0, netBalance: 0 }
  const employeeRate = data.employeeContribRate ?? data.employeeRate ?? 0
  const employerRate = data.employerContribRate ?? data.employerRate ?? 0

  return (
    <div className="space-y-6">
      <PageHeader
        title={data.employee?.fullName || 'PF Member'}
        description={`${data.employee?.employeeNo || ''} | ${data.policy?.name || 'PF Policy'}`}
      >
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/hr/pension/provident-fund/enrollments')}>
            <ArrowLeft className="h-4 w-4 mr-2" />{tc('buttons.back')}
          </Button>
          <Button size="sm" onClick={() => router.push(`/hr/pension/provident-fund/enrollments/${params.id}/nominees`)}>
            <UserPlus className="h-4 w-4 mr-2" />Manage Nominees
          </Button>
        </div>
      </PageHeader>

      {error && <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Member Info</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><span className="text-muted-foreground">Employee:</span> <span className="font-medium">{data.employee?.fullName}</span></div>
            <div><span className="text-muted-foreground">Department:</span> {data.employee?.department?.name || '\u2014'}</div>
            <div><span className="text-muted-foreground">Enrollment Date:</span> {formatDate(data.enrollmentDate)}</div>
            <div><span className="text-muted-foreground">Effective Date:</span> {formatDate(data.effectiveDate)}</div>
            <div><span className="text-muted-foreground">Employee Rate:</span> <span className="font-mono">{employeeRate}%</span></div>
            <div><span className="text-muted-foreground">Employer Rate:</span> <span className="font-mono">{employerRate}%</span></div>
            <div><span className="text-muted-foreground">Status:</span> <StatusBadge status={data.status} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Balance Breakdown</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Employee Contributions</span><span className="font-mono font-medium">{formatCurrency(bal.employeeContrib)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Employer Contributions</span><span className="font-mono font-medium">{formatCurrency(bal.employerContrib)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Interest Earned</span><span className="font-mono font-medium text-green-600">{formatCurrency(bal.interestEarned)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Withdrawals</span><span className="font-mono font-medium text-red-600">-{formatCurrency(bal.withdrawals)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Loan Outstanding</span><span className="font-mono font-medium text-orange-600">-{formatCurrency(bal.loanOutstanding)}</span></div>
            <hr />
            <div className="flex justify-between font-medium"><span>Net Balance</span><span className="font-mono text-lg">{formatCurrency(bal.netBalance)}</span></div>
          </CardContent>
        </Card>
      </div>

      {data.nominees && data.nominees.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Nominees</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium">Name</th>
                    <th className="pb-2 font-medium">Relationship</th>
                    <th className="pb-2 font-medium text-right">Share (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.nominees.map((n) => (
                    <tr key={n.id} className="border-b last:border-0">
                      <td className="py-2 font-medium">{n.name}</td>
                      <td className="py-2">{n.relationship}</td>
                      <td className="py-2 text-right font-mono">{n.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Contribution History</CardTitle></CardHeader>
        <CardContent>
          {(!data.contributions || data.contributions.length === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-6">No contributions found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium">Period</th>
                    <th className="pb-2 font-medium text-right">Employee</th>
                    <th className="pb-2 font-medium text-right">Employer</th>
                    <th className="pb-2 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.contributions.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-2">{c.month}/{c.year}</td>
                      <td className="py-2 text-right font-mono">{formatCurrency(c.employeeAmount)}</td>
                      <td className="py-2 text-right font-mono">{formatCurrency(c.employerAmount)}</td>
                      <td className="py-2 text-right font-mono font-medium">{formatCurrency(c.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
