'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  FileSpreadsheet, BarChart3, PieChart, TrendingUp, Wallet, Receipt,
  BookOpen, Calendar, Landmark, FileText, Shield, DollarSign,
  ClipboardList, Clock, Coins, Utensils, FileCheck, Calculator, Globe,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/page-header'
import { HelpButton } from '@/components/shared/help-modal'

interface ReportDef {
  type: string
  icon: React.ElementType
  category: 'core' | 'subsidiary' | 'ngo' | 'expense'
}

const REPORTS: ReportDef[] = [
  { type: 'trial-balance', icon: FileSpreadsheet, category: 'core' },
  { type: 'income-statement', icon: BarChart3, category: 'core' },
  { type: 'balance-sheet', icon: PieChart, category: 'core' },
  { type: 'cash-flow', icon: TrendingUp, category: 'core' },
  { type: 'receipts-payments', icon: Receipt, category: 'core' },
  { type: 'ledger', icon: BookOpen, category: 'subsidiary' },
  { type: 'day-book', icon: Calendar, category: 'subsidiary' },
  { type: 'bank-book', icon: Landmark, category: 'subsidiary' },
  { type: 'cash-book', icon: FileText, category: 'subsidiary' },
  { type: 'fund-position', icon: Wallet, category: 'ngo' },
  { type: 'fund-balance-changes', icon: DollarSign, category: 'ngo' },
  { type: 'grant-financial', icon: Shield, category: 'ngo' },
  { type: 'bank-reconciliation-statement', icon: Landmark, category: 'ngo' },
  { type: 'expense-summary', icon: ClipboardList, category: 'expense' },
  { type: 'advance-aging', icon: Clock, category: 'expense' },
  { type: 'petty-cash-statement', icon: Coins, category: 'expense' },
  { type: 'per-diem-utilization', icon: Utensils, category: 'expense' },
  { type: 'receipt-compliance', icon: FileCheck, category: 'expense' },
  { type: 'tds-vds-register', icon: Calculator, category: 'expense' },
  { type: 'donor-expense-report', icon: Globe, category: 'expense' },
]

const CATEGORY_COLORS: Record<string, string> = {
  core: 'text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400',
  subsidiary: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400',
  ngo: 'text-purple-600 bg-purple-50 dark:bg-purple-950 dark:text-purple-400',
  expense: 'text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400',
}

const CATEGORY_LABELS: Record<string, string> = {
  core: 'Core',
  subsidiary: 'Subsidiary',
  ngo: 'NGO',
  expense: 'Expense',
}

function ReportSection({ title, category, reports, t, onOpen }: {
  title: string
  category: string
  reports: ReportDef[]
  t: (key: string) => string
  onOpen: (type: string) => void
}) {
  return (
    <div>
      <h3 className="text-sm font-medium text-muted-foreground mb-3">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map(report => {
          const Icon = report.icon
          return (
            <Card
              key={report.type}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onOpen(report.type)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${CATEGORY_COLORS[category]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{t(`types.${report.type}.title`)}</CardTitle>
                    <Badge variant="outline" className="text-[10px] mt-1">{CATEGORY_LABELS[category]}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{t(`types.${report.type}.desc`)}</CardDescription>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default function FinancialReportsPage() {
  const t = useTranslations('finance.financialReports')
  const router = useRouter()

  function openReport(type: string) {
    router.push(`/finance/financial-reports/${type}`)
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')}>
        <HelpButton
          title={t('title')}
          description={t('description')}
          steps={[
            { title: t('helpStep1Title'), description: t('helpStep1Desc') },
            { title: t('helpStep2Title'), description: t('helpStep2Desc') },
            { title: t('helpStep3Title'), description: t('helpStep3Desc') },
          ]}
          tips={[t('helpTip1'), t('helpTip2'), t('helpTip3')]}
        />
      </PageHeader>

      <ReportSection title={t('coreStatements')} category="core" reports={REPORTS.filter(r => r.category === 'core')} t={t} onOpen={openReport} />
      <ReportSection title={t('subsidiaryBooks')} category="subsidiary" reports={REPORTS.filter(r => r.category === 'subsidiary')} t={t} onOpen={openReport} />
      <ReportSection title={t('ngoReports')} category="ngo" reports={REPORTS.filter(r => r.category === 'ngo')} t={t} onOpen={openReport} />
      <ReportSection title={t('expenseCompliance')} category="expense" reports={REPORTS.filter(r => r.category === 'expense')} t={t} onOpen={openReport} />
    </div>
  )
}
