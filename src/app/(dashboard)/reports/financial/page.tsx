'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { FileText, Layers, Wallet } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/page-header'

export default function FinancialReportsPage() {
  const t = useTranslations('reports')
  const tConcern = useTranslations('reports.concern')
  const router = useRouter()
  const searchParams = useSearchParams()
  // Preserve any query (?businessUnitId=… deep-link) when navigating into a report.
  const qs = searchParams?.toString() ? `?${searchParams.toString()}` : ''

  const standardReports = [
    { title: t('financial.trialBalance'), description: t('financial.trialBalanceDesc'), type: 'trial-balance', icon: FileText },
    { title: t('financial.incomeStatement'), description: t('financial.incomeStatementDesc'), type: 'income-statement', icon: FileText },
    { title: t('financial.balanceSheet'), description: t('financial.balanceSheetDesc'), type: 'balance-sheet', icon: FileText },
    { title: t('financial.cashFlow'), description: t('financial.cashFlowDesc'), type: 'cash-flow', icon: FileText },
    { title: t('financial.fundPosition'), description: t('financial.fundPositionDesc'), type: 'fund-position', icon: Wallet },
  ]

  const concernReports = [
    { title: tConcern('sectorTrialBalance'), description: tConcern('sectorTrialBalanceDesc'), href: '/reports/sector-trial-balance', icon: Layers },
    { title: tConcern('concernIncomeStatement'), description: tConcern('concernIncomeStatementDesc'), href: '/reports/concern-income-statement', icon: Layers },
    { title: tConcern('concernBalanceSheet'), description: tConcern('concernBalanceSheetDesc'), href: '/reports/concern-balance-sheet', icon: Layers },
    { title: tConcern('interConcernTransactions'), description: tConcern('interConcernTransactionsDesc'), href: '/reports/inter-concern-transactions', icon: Layers },
    { title: tConcern('costCenterExpenses'), description: tConcern('costCenterExpensesDesc'), href: '/reports/cost-center-expenses', icon: Layers },
    { title: tConcern('donorProjectFinancials'), description: tConcern('donorProjectFinancialsDesc'), href: '/reports/donor-project-financials', icon: Wallet },
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('financial.title')}
        description={t('financial.description')}
      />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {t('financial.title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {standardReports.map((report) => (
            <Card
              key={report.type}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/finance/financial-reports/${report.type}${qs}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <report.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{report.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{report.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {t('title')} — Concern Reports
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {concernReports.map((report) => (
            <Card
              key={report.href}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`${report.href}${qs}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <report.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{report.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{report.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
