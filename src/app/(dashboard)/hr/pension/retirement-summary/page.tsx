'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatCurrency } from '@/lib/formatters'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface RetirementSummaryRow {
  employeeId: string
  employeeName: string
  department: string
  serviceYears: number
  pfBalance: number
  gratuityBalance: number
  totalBenefits: number
  vestingStatus: string
}

export default function RetirementSummaryPage() {
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const router = useRouter()

  const [data, setData] = useState<RetirementSummaryRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/hr/pension/retirement-summary')
      .then(res => res.json())
      .then(json => {
        if (json.success) setData(json.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleRowClick = useCallback(
    (employeeId: string) => {
      router.push(`/hr/${employeeId}`)
    },
    [router]
  )

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
        title={t('pension.retirementSummary')}
        description={t('pension.retirementSummaryDesc')}
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('fields.fullName')}</TableHead>
                <TableHead>{t('fields.department')}</TableHead>
                <TableHead className="text-right">{t('pension.serviceYears')}</TableHead>
                <TableHead className="text-right">{t('pension.pfBalance')}</TableHead>
                <TableHead className="text-right">{t('pension.gratuityLiability')}</TableHead>
                <TableHead className="text-right">{t('pension.totalBenefits')}</TableHead>
                <TableHead>{t('pension.vestingStatus')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {tc('labels.noData') || 'No data available'}
                  </TableCell>
                </TableRow>
              ) : (
                data.map(row => (
                  <TableRow
                    key={row.employeeId}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(row.employeeId)}
                  >
                    <TableCell className="font-medium">{row.employeeName}</TableCell>
                    <TableCell>{row.department}</TableCell>
                    <TableCell className="text-right">{row.serviceYears.toFixed(1)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.pfBalance)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.gratuityBalance)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(row.totalBenefits)}</TableCell>
                    <TableCell>
                      <StatusBadge status={row.vestingStatus} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
