'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Plus, Download, Loader2, Eye, Play, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

interface PayrollRunDetail extends PayrollRun {
  entries: Array<{
    id: string
    grossSalary: number | string
    pfDeduction?: number | string | null
    tdsDeduction?: number | string | null
    otherDeductions?: number | string | null
    absentDeduction?: number | string | null
    netSalary: number | string
    isPaid: boolean
    employee: {
      id: string
      employeeNo: string
      fullName: string
      designation?: { title: string } | null
    }
  }>
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
  const [actionId, setActionId] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [userRole, setUserRole] = useState<string>('')
  const [createMonth, setCreateMonth] = useState('6')
  const [createYear, setCreateYear] = useState('2026')
  const [error, setError] = useState('')
  const registerRef = useRef<HTMLDivElement | null>(null)

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  async function refreshRuns() {
    const json = await fetch('/api/v1/hr/payroll/runs')
      .then(res => res.json())
    if (json.success) setRuns(json.data)
  }

  useEffect(() => {
    refreshRuns()
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetch('/api/v1/auth/me')
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setUserRole(json.data.role?.name || '')
        }
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (!selectedRun) return
    requestAnimationFrame(() => {
      registerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [selectedRun?.id])

  function loadRunEntries(run: PayrollRun) {
    setSelectedRun(run)
    setEntriesLoading(true)
    fetch(`/api/v1/hr/payroll/runs/${run.id}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          const detail = json.data as PayrollRunDetail
          setSelectedRun(detail)
          setEntries((detail.entries || []).map(entry => ({
            id: entry.id,
            employeeId: entry.employee.employeeNo,
            employeeName: entry.employee.fullName,
            designation: entry.employee.designation?.title || '—',
            grossPay: Number(entry.grossSalary),
            totalDeductions:
              Number(entry.pfDeduction || 0) +
              Number(entry.tdsDeduction || 0) +
              Number(entry.otherDeductions || 0) +
              Number(entry.absentDeduction || 0),
            netPay: Number(entry.netSalary),
            status: entry.isPaid ? 'PAID' : 'UNPAID',
          })))
        }
      })
      .catch(console.error)
      .finally(() => setEntriesLoading(false))
  }

  async function createRun() {
    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/v1/hr/payroll/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: Number(createMonth),
          year: Number(createYear),
        }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        setRuns(prev => [json.data, ...prev])
        setShowCreateDialog(false)
        loadRunEntries(json.data)
      } else {
        setError(json.error?.message || 'Failed to create payroll run')
      }
    } catch (e) {
      console.error(e)
      setError('Failed to create payroll run')
    } finally {
      setCreating(false)
    }
  }

  async function runAction(run: PayrollRun, action: 'process' | 'approve') {
    setActionId(`${action}:${run.id}`)
    setError('')
    try {
      const res = await fetch(`/api/v1/hr/payroll/runs/${run.id}/${action}`, { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        await refreshRuns()
        loadRunEntries({ ...run, status: action === 'process' ? 'PROCESSED' : 'APPROVED' })
      } else {
        setError(json.error?.message || `Failed to ${action} payroll`)
      }
    } catch (e) {
      console.error(e)
      setError(`Failed to ${action} payroll`)
    } finally {
      setActionId(null)
    }
  }

  const latestRun = runs[0]
  const canApprovePayroll = ['ADMIN', 'FINANCE_MANAGER'].includes(userRole)

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
        <Button size="sm" onClick={() => setShowCreateDialog(true)} disabled={creating}>
          <Plus className="h-4 w-4 mr-2" />
          {t('payroll.runPayroll')}
        </Button>
      </PageHeader>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Payroll Run</DialogTitle>
            <DialogDescription>Select the payroll period to create as a draft run.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Month</Label>
              <Select value={createMonth} onValueChange={setCreateMonth}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {monthNames.map((month, index) => (
                    <SelectItem key={month} value={String(index + 1)}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Input value={createYear} onChange={e => setCreateYear(e.target.value)} inputMode="numeric" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={creating}>
              {tc('buttons.cancel')}
            </Button>
            <Button onClick={createRun} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Create Run
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {error && (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

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
                    <TableCell><StatusBadge status={run.status === 'PROCESSED' ? 'REQUESTED' : run.status} /></TableCell>
                    <TableCell className="text-center">{run.employeeCount}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatCurrency(run.totalGross)}</TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold">{formatCurrency(run.totalNet)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                      {run.status === 'DRAFT' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); runAction(run, 'process') }}
                          disabled={actionId === `process:${run.id}`}
                        >
                          {actionId === `process:${run.id}` ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Play className="h-4 w-4 mr-1" />}
                          Process
                        </Button>
                      )}
                      {run.status === 'PROCESSED' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); runAction(run, 'process') }}
                            disabled={actionId === `process:${run.id}`}
                          >
                            {actionId === `process:${run.id}` ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Play className="h-4 w-4 mr-1" />}
                            Reprocess
                          </Button>
                          {canApprovePayroll ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); runAction(run, 'approve') }}
                              disabled={actionId === `approve:${run.id}`}
                            >
                              {actionId === `approve:${run.id}` ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                              Approve
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled
                              title="This payroll run is waiting for admin approval."
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Requested to Admin
                            </Button>
                          )}
                        </>
                      )}
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); loadRunEntries(run) }}>
                        <Eye className="h-4 w-4 mr-1" />
                        View Register
                      </Button>
                      </div>
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
        <div ref={registerRef} className="scroll-mt-24">
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
        </div>
      )}
    </div>
  )
}
