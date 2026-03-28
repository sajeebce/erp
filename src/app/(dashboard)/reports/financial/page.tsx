'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/page-header'

export default function FinancialReportsPage() {
  const t = useTranslations('reports')
  const router = useRouter()

  const reports = [
    { title: t('financial.trialBalance'), description: t('financial.trialBalanceDesc'), type: 'trial-balance' },
    { title: t('financial.incomeStatement'), description: t('financial.incomeStatementDesc'), type: 'income-statement' },
    { title: t('financial.balanceSheet'), description: t('financial.balanceSheetDesc'), type: 'balance-sheet' },
    { title: t('financial.cashFlow'), description: t('financial.cashFlowDesc'), type: 'cash-flow' },
    { title: t('financial.fundPosition'), description: t('financial.fundPositionDesc'), type: 'fund-position' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('financial.title')}
        description={t('financial.description')}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => (
          <Card
            key={report.type}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push(`/reports/financial/${report.type}`)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
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
    </div>
  )
}
