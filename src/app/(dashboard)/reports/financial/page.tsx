'use client'

import { useRouter } from 'next/navigation'
import { FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/page-header'

const reports = [
  { title: 'Trial Balance', description: 'All accounts with debit/credit balances', type: 'trial-balance' },
  { title: 'Income Statement', description: 'Revenue minus expenses', type: 'income-statement' },
  { title: 'Balance Sheet', description: 'Assets, liabilities, and equity', type: 'balance-sheet' },
  { title: 'Cash Flow Statement', description: 'Cash inflows and outflows', type: 'cash-flow' },
  { title: 'Fund Position', description: 'Fund balances by grant/donor', type: 'fund-position' },
]

export default function FinancialReportsPage() {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial Reports"
        description="Generate Trial Balance, Income Statement, Balance Sheet, and Cash Flow reports"
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
