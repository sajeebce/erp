'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2, Play, Eye } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

interface AccrualRun {
  id: string
  month: number
  year: number
  employeesProcessed: number
  totalAmount: number
  status: string
  runAt: string
  runBy: string
}

interface PreviewEntry {
  employeeId: string
  employeeName: string
  basicSalary: number
  accrualAmount: number
  currentBalance: number
}

export default function GratuityAccrualsPage() {
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const router = useRouter()
  const { formatCurrency, formatDate } = useFormatters()

  const now = new Date()
  const [month, setMonth] = useState(String(now.getMonth() + 1))
  const [year, setYear] = useState(String(now.getFullYear()))
  const [runs, setRuns] = useState<AccrualRun[]>([])
  const [preview, setPreview] = useState<PreviewEntry[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [previewing, setPreviewing] = useState(false)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetch('/api/v1/hr/gratuity/accruals/run')
      .then(res => res.json())
      .then(json => { if (json.success) setRuns(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handlePreview() {
    setPreviewing(true)
    setError('')
    setPreview(null)

    try {
      const res = await fetch(`/api/v1/hr/gratuity/accruals/preview?month=${month}&year=${year}`)
      const json = await res.json()
      if (json.success) {
        setPreview(json.data)
      } else {
        setError(json.error || 'Failed to generate preview.')
      }
    } catch {
      setError('Failed to generate preview.')
    } finally {
      setPreviewing(false)
    }
  }

  async function handleRun() {
    setRunning(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/v1/hr/gratuity/accruals/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: parseInt(month), year: parseInt(year) }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setSuccess(`Accrual run completed. ${json.data.employeesProcessed} employees processed, total: ${formatCurrency(json.data.totalAmount)}`)
        setPreview(null)
        // Refresh runs list
        const runsRes = await fetch('/api/v1/hr/gratuity/accruals/run')
        const runsJson = await runsRes.json()
        if (runsJson.success) setRuns(runsJson.data)
      } else {
        setError(json.error || 'Failed to run accrual.')
      }
    } catch {
      setError('Failed to run accrual.')
    } finally {
      setRunning(false)
    }
  }

  const runColumns: ColumnDef<AccrualRun>[] = [
    { accessorKey: 'year', header: 'Year' },
    { accessorKey: 'month', header: 'Month' },
    { accessorKey: 'employeesProcessed', header: 'Employees' },
    { accessorKey: 'totalAmount', header: 'Total Amount', cell: ({ row }) => <span className="font-mono text-sm">{formatCurrency(row.getValue('totalAmount'))}</span> },
    { accessorKey: 'status', header: tc('labels.status'), cell: ({ row }) => <StatusBadge status={row.getValue('status')} /> },
    { accessorKey: 'runAt', header: 'Run Date', cell: ({ row }) => formatDate(row.getValue('runAt')) },
    { accessorKey: 'runBy', header: 'Run By' },
  ]

  const previewColumns: ColumnDef<PreviewEntry>[] = [
    { accessorKey: 'employeeName', header: 'Employee', cell: ({ row }) => <span className="font-medium">{row.getValue('employeeName')}</span> },
    { accessorKey: 'basicSalary', header: 'Basic Salary', cell: ({ row }) => <span className="font-mono text-sm">{formatCurrency(row.getValue('basicSalary'))}</span> },
    { accessorKey: 'accrualAmount', header: 'Accrual Amount', cell: ({ row }) => <span className="font-mono text-sm">{formatCurrency(row.getValue('accrualAmount'))}</span> },
    { accessorKey: 'currentBalance', header: 'Current Balance', cell: ({ row }) => <span className="font-mono text-sm">{formatCurrency(row.getValue('currentBalance'))}</span> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Gratuity Accruals" description="Run monthly gratuity accruals and view processing history">
        <Button variant="outline" size="sm" onClick={() => router.push('/hr/pension/gratuity')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tc('buttons.back')}
        </Button>
      </PageHeader>

      {/* Run Accrual Card */}
      <Card>
        <CardHeader>
          <CardTitle>Run Monthly Accrual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-3 text-sm text-green-800 dark:text-green-200">
              {success}
            </div>
          )}

          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="accrual-month">Month</Label>
              <Input
                id="accrual-month"
                type="number"
                min="1"
                max="12"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-24"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accrual-year">Year</Label>
              <Input
                id="accrual-year"
                type="number"
                min="2020"
                max="2030"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-28"
              />
            </div>
            <Button variant="outline" onClick={handlePreview} disabled={previewing}>
              {previewing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
              Preview
            </Button>
            <Button onClick={handleRun} disabled={running}>
              {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
              Run Accrual
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Results */}
      {preview && (
        <Card>
          <CardHeader>
            <CardTitle>Preview: {month}/{year} ({preview.length} employees)</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={previewColumns}
              data={preview}
              searchKey="employeeName"
              searchPlaceholder="Search employees..."
            />
          </CardContent>
        </Card>
      )}

      {/* Past Accrual Runs */}
      <Card>
        <CardHeader>
          <CardTitle>Accrual Run History</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={runColumns}
            data={runs}
            searchKey="year"
            searchPlaceholder="Search by year..."
            isLoading={loading}
          />
        </CardContent>
      </Card>
    </div>
  )
}
