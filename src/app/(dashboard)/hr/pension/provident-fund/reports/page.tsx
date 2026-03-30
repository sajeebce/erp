'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { FileText, Users, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/page-header'

export default function PFReportsPage() {
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const router = useRouter()

  const reports = [
    {
      title: 'PF Register',
      description: 'Comprehensive register of all PF members with current balances, contributions, and status',
      icon: Users,
      href: '/hr/pension/provident-fund/reports/register',
    },
    {
      title: 'Employee Statement',
      description: 'Individual employee PF statement with contribution history, interest, and balance details',
      icon: FileText,
      href: '/hr/pension/provident-fund/contributions',
    },
    {
      title: 'Trust Balance Sheet',
      description: 'Trust fund financial summary including assets, liabilities, investments, and member balances',
      icon: BarChart3,
      href: '/hr/pension/provident-fund/trust',
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="PF Reports" description="Generate and view provident fund reports" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reports.map((report) => (
          <Card key={report.title} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(report.href)}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <report.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{report.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
              <Button variant="outline" size="sm" className="w-full">View Report</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
