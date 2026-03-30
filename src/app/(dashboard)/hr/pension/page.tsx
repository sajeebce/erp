'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import {
  Loader2,
  Landmark,
  ShieldCheck,
  Users,
  TrendingUp,
  Banknote,
  PieChart,
  ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/formatters'

interface PensionOverview {
  totalRetirementLiability: number
  pfBalance: number
  gratuityLiability: number
  enrolledEmployees: number
  monthlyContribution: number
  fundAdequacyRatio: number
  pfSummary: {
    members: number
    totalBalance: number
    avgBalance: number
  }
  gratuitySummary: {
    employees: number
    totalLiability: number
    vestedCount: number
  }
}

const defaultData: PensionOverview = {
  totalRetirementLiability: 0,
  pfBalance: 0,
  gratuityLiability: 0,
  enrolledEmployees: 0,
  monthlyContribution: 0,
  fundAdequacyRatio: 0,
  pfSummary: { members: 0, totalBalance: 0, avgBalance: 0 },
  gratuitySummary: { employees: 0, totalLiability: 0, vestedCount: 0 },
}

export default function PensionManagementPage() {
  const t = useTranslations('hr')
  const tc = useTranslations('common')

  const [data, setData] = useState<PensionOverview>(defaultData)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/hr/pension/overview')
      .then(res => res.json())
      .then(json => {
        if (json.success) setData(json.data)
      })
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

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('pension.title')}
        description={t('pension.description')}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('pension.totalRetirementLiability')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(data.totalRetirementLiability)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('pension.pfBalance')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(data.pfBalance)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('pension.gratuityLiability')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(data.gratuityLiability)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('pension.enrolledEmployees')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <p className="text-2xl font-bold">{data.enrolledEmployees}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('pension.monthlyContribution')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(data.monthlyContribution)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('pension.fundAdequacy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <p className="text-2xl font-bold">{data.fundAdequacyRatio}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/hr/pension/provident-fund">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Landmark className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{t('providentFund.title')}</CardTitle>
                    <CardDescription>{t('providentFund.description')}</CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/hr/pension/gratuity">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{t('gratuity.title')}</CardTitle>
                    <CardDescription>{t('gratuity.description')}</CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Summary Cards Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PF Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-blue-600" />
              <CardTitle>{t('providentFund.title')} - {tc('labels.summary') || 'Summary'}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">{t('providentFund.enrolledMembers')}</span>
                <span className="text-sm font-semibold">{data.pfSummary.members}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">{t('providentFund.totalFundBalance')}</span>
                <span className="text-sm font-semibold">{formatCurrency(data.pfSummary.totalBalance)}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">{tc('labels.average') || 'Average Balance'}</span>
                <span className="text-sm font-semibold">{formatCurrency(data.pfSummary.avgBalance)}</span>
              </div>
            </div>
            <div className="mt-4">
              <Link href="/hr/pension/provident-fund">
                <Button variant="outline" size="sm" className="w-full">
                  {t('providentFund.title')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Gratuity Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-amber-600" />
              <CardTitle>{t('gratuity.title')} - {tc('labels.summary') || 'Summary'}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">{t('pension.enrolledEmployees')}</span>
                <span className="text-sm font-semibold">{data.gratuitySummary.employees}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">{t('gratuity.totalLiability')}</span>
                <span className="text-sm font-semibold">{formatCurrency(data.gratuitySummary.totalLiability)}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">{t('gratuity.vestedEmployees')}</span>
                <span className="text-sm font-semibold">{data.gratuitySummary.vestedCount}</span>
              </div>
            </div>
            <div className="mt-4">
              <Link href="/hr/pension/gratuity">
                <Button variant="outline" size="sm" className="w-full">
                  {t('gratuity.title')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
