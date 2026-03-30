'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Loader2, Users, Wallet, TrendingUp, CreditCard, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { useFormatters } from '@/hooks/use-formatters'

interface DashboardData {
  totalFundBalance: number
  enrolledMembers: number
  monthlyContribution: number
  activeLoans: number
  investmentReturns: number
  recentContributions: {
    id: string
    employeeName: string
    month: string
    employeeAmount: number
    employerAmount: number
    total: number
  }[]
}

export default function ProvidentFundDashboardPage() {
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const router = useRouter()
  const { formatCurrency } = useFormatters()

  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/hr/provident-fund/dashboard')
      .then(res => res.json())
      .then(json => { if (json.success) setData(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const dashboard = data || {
    totalFundBalance: 0,
    enrolledMembers: 0,
    monthlyContribution: 0,
    activeLoans: 0,
    investmentReturns: 0,
    recentContributions: [],
  }

  const kpis = [
    { label: 'Total Fund Balance', value: formatCurrency(dashboard.totalFundBalance), icon: Wallet, color: 'text-blue-600' },
    { label: 'Enrolled Members', value: String(dashboard.enrolledMembers), icon: Users, color: 'text-green-600' },
    { label: 'Monthly Contribution', value: formatCurrency(dashboard.monthlyContribution), icon: BarChart3, color: 'text-purple-600' },
    { label: 'Active Loans', value: String(dashboard.activeLoans), icon: CreditCard, color: 'text-orange-600' },
    { label: 'Investment Returns', value: formatCurrency(dashboard.investmentReturns), icon: TrendingUp, color: 'text-emerald-600' },
  ]

  const quickLinks = [
    { label: 'Policies', href: '/hr/pension/provident-fund/policies' },
    { label: 'Enrollments', href: '/hr/pension/provident-fund/enrollments' },
    { label: 'Contributions', href: '/hr/pension/provident-fund/contributions' },
    { label: 'Interest Posting', href: '/hr/pension/provident-fund/interest' },
    { label: 'Withdrawals', href: '/hr/pension/provident-fund/withdrawals' },
    { label: 'Loans', href: '/hr/pension/provident-fund/loans' },
    { label: 'Settlements', href: '/hr/pension/provident-fund/settlements' },
    { label: 'Trust Fund', href: '/hr/pension/provident-fund/trust' },
    { label: 'Investments', href: '/hr/pension/provident-fund/investments' },
    { label: 'Reports', href: '/hr/pension/provident-fund/reports' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Provident Fund" description="Manage employee provident fund, contributions, loans, and investments" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <kpi.icon className={`h-8 w-8 ${kpi.color}`} />
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Quick Links</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {quickLinks.map((link) => (
              <Button key={link.href} variant="outline" className="h-auto py-3" onClick={() => router.push(link.href)}>
                {link.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent Contributions</CardTitle></CardHeader>
        <CardContent>
          {dashboard.recentContributions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No recent contributions found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium">Employee</th>
                    <th className="pb-2 font-medium">Month</th>
                    <th className="pb-2 font-medium text-right">Employee</th>
                    <th className="pb-2 font-medium text-right">Employer</th>
                    <th className="pb-2 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.recentContributions.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-2 font-medium">{c.employeeName}</td>
                      <td className="py-2">{c.month}</td>
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
