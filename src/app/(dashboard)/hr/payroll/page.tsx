'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Plus, Download, Loader2, Eye } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { useFormatters } from '@/hooks/use-formatters'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface PayrollRun {
  id: string
  runNo: string
  month: number
  year: number
  status: string
  employeeCount: number
  totalGross: number
  totalDeductions: number
  totalNet: number
  createdAt: string
}

interface PayrollEntry {
  id: string
  employeeId: string
  employeeName: string
  designation: string
  grossPay: number
  totalDeductions: number
  netPay: number
  status: string
}

export default function PayrollPage() {
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const router = useRouter()
  const { formatCurrency } = useFormatters()

  const [runs, setRuns] = useState<PayrollRun[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null)
  const [entries, setEntries] = useState<PayrollEntry[]>([])
  const [entriesLoading, setEntriesLoading] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetch('/api/v1/hr/payroll/runs')
      .then(res => res.json())
      .then(json => { if (json.success) setRuns(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function loadRunEntries(run: PayrollRun) {
    setSelectedRun(run)
    setEntriesLoading(true)
    fetch(`/api/v1/hr/payroll/runs/${run.id}/entries`)
      .then(res => res.json())
      .then(json => { if (json.success) setEntries(json.data) })
      .catch(console.error)
      .finally(() => setEntriesLoading(false))
  }

  async function createRun() {
    setCreating(true)
    try {
      const res = await fetch('/api/v1/hr/payroll/runs', { method: 'POST' })
      const json = await res.json()
      if (json.success && json.data) {
        setRuns(prev => [json.data, ...prev])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setCreating(false)
    }
  }

  const latestRun = runs[0]

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-20" /></CardContent></Card>
          ))}
        </div>
        <Skeleton className="h-75" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('payroll.title')} description={t('payroll.description')}>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          {t('payroll.exportPayslips')}
        </Button>
        <Button size="sm" onClick={createRun} disabled={creating}>
          {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
          {t('payroll.runPayroll')}
        </Button>
      </PageHeader>

      {/* KPI Cards from latest run */}
      {latestRun && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('payroll.totalGrossSalary')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(latestRun.totalGross)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('payroll.totalDeductions')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(latestRun.totalDeductions)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('payroll.totalNetSalary')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(latestRun.totalNet)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('payroll.payPeriod')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{monthNames[latestRun.month - 1]} {latestRun.year}</p>
              <p className="text-xs text-muted-foreground">{latestRun.employeeCount} {t('payroll.employees')}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payroll Runs Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('payroll.title')} Runs</CardTitle>
        </CardHeader>
        <CardContent>
          {runs.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No payroll runs found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Run No</TableHead>
                  <TableHead>{t('payroll.payPeriod')}</TableHead>
                  <TableHead>{tc('labels.status')}</TableHead>
                  <TableHead className="text-center">{t('payroll.employees')}</TableHead>
                  <TableHead className="text-right">{t('payroll.gross')}</TableHead>
                  <TableHead className="text-right">{t('payroll.netSalary')}</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map(run => (
                  <TableRow
                    key={run.id}
                    className={`cursor-pointer transition-colors ${selectedRun?.id === run.id ? 'bg-muted/50' : ''}`}
                    onClick={() => loadRunEntries(run)}
                  >
                    <TableCell className="font-mono text-sm font-medium">{run.runNo}</TableCell>
                    <TableCell>{monthNames[run.month - 1]} {run.year}</TableCell>
                    <TableCell><StatusBadge status={run.status} /></TableCell>
                    <TableCell className="text-center">{run.employeeCount}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatCurrency(run.totalGross)}</TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold">{formatCurrency(run.totalNet)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); loadRunEntries(run) }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Run Detail — Employee Entries */}
      {selectedRun && (
        <Card>
          <CardHeader>
            <CardTitle>
              {t('payroll.payrollRegister')} — {monthNames[selectedRun.month - 1]} {selectedRun.year}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {entriesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : entries.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No entries in this run</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('payroll.employeeId')}</TableHead>
                    <TableHead>{t('payroll.employeeName')}</TableHead>
                    <TableHead>{t('payroll.designation')}</TableHead>
                    <TableHead className="text-right">{t('payroll.gross')}</TableHead>
                    <TableHead className="text-right">{t('payroll.totalDeductions')}</TableHead>
                    <TableHead className="text-right">{t('payroll.netSalary')}</TableHead>
                    <TableHead>{tc('labels.status')}</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map(entry => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-mono text-sm">{entry.employeeId}</TableCell>
                      <TableCell className="font-medium">{entry.employeeName}</TableCell>
                      <TableCell>{entry.designation}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(entry.grossPay)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(entry.totalDeductions)}</TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold">{formatCurrency(entry.netPay)}</TableCell>
                      <TableCell><StatusBadge status={entry.status} /></TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/hr/payroll/payslip/${entry.id}`)}
                        >
                          {t('payslip.viewPayslip')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
