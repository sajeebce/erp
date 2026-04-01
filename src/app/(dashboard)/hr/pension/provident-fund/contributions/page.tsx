'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Loader2, Play, Eye } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/shared/data-table'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

interface ContributionRun {
  id: string
  month: number
  year: number
  totalEmployee: number
  totalEmployer: number
  totalAmount: number
  employeeCount: number
  status: string
  createdAt: string
}

interface PreviewItem {
  employeeName: string
  employeeAmount: number
  employerAmount: number
  total: number
}

export default function PFContributionsPage() {
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const router = useRouter()
  const { formatCurrency } = useFormatters()

  const [runs, setRuns] = useState<ContributionRun[]>([])
  const [loading, setLoading] = useState(true)
  const [runLoading, setRunLoading] = useState(false)
  const [previewData, setPreviewData] = useState<PreviewItem[] | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [error, setError] = useState('')

  const now = new Date()
  const [month, setMonth] = useState(String(now.getMonth() + 1))
  const [year, setYear] = useState(String(now.getFullYear()))

  const columns: ColumnDef<ContributionRun>[] = [
    { id: 'period', header: 'Period', accessorFn: (row) => `${row.month}/${row.year}`, cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span> },
    { accessorKey: 'totalEmployee', header: 'Employee Total', cell: ({ row }) => <span className="font-mono text-sm">{formatCurrency(row.getValue('totalEmployee'))}</span> },
    { accessorKey: 'totalEmployer', header: 'Employer Total', cell: ({ row }) => <span className="font-mono text-sm">{formatCurrency(row.getValue('totalEmployer'))}</span> },
    { accessorKey: 'totalAmount', header: 'Grand Total', cell: ({ row }) => <span className="font-mono text-sm font-medium">{formatCurrency(row.getValue('totalAmount'))}</span> },
    { accessorKey: 'employeeCount', header: 'Members', cell: ({ row }) => <span className="font-mono text-sm">{row.getValue('employeeCount')}</span> },
  ]

  useEffect(() => {
    fetch('/api/v1/hr/pf/contributions/runs?limit=50')
      .then(res => res.json())
      .then(json => { if (json.success) setRuns(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handlePreview() {
    setPreviewLoading(true)
    setError('')
    setPreviewData(null)
    try {
      const res = await fetch(`/api/v1/hr/pf/contributions/preview?month=${month}&year=${year}`)
      const json = await res.json()
      if (json.success) setPreviewData(json.data)
      else setError(json.error || 'Failed to load preview')
    } catch {
      setError('Failed to load preview')
    } finally {
      setPreviewLoading(false)
    }
  }

  async function handleRunContributions() {
    setRunLoading(true)
    setError('')
    try {
      const res = await fetch('/api/v1/hr/pf/contributions/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: parseInt(month), year: parseInt(year) }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setRuns(prev => [json.data, ...prev])
        setPreviewData(null)
      } else {
        setError(json.error || 'Failed to run contributions')
      }
    } catch {
      setError('Failed to run contributions')
    } finally {
      setRunLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Monthly Contributions" description="Run and manage monthly PF contribution processing" />

      <Card>
        <CardHeader><CardTitle>Run Contributions</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">{error}</div>}

          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label>Month</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={month} onChange={(e) => setMonth(e.target.value)}>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={String(i + 1)}>{new Date(2000, i).toLocaleString('en', { month: 'long' })}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Input type="number" min="2020" max="2030" value={year} onChange={(e) => setYear(e.target.value)} className="w-24" />
            </div>
            <Button variant="outline" onClick={handlePreview} disabled={previewLoading}>
              {previewLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
              Preview
            </Button>
            <Button onClick={handleRunContributions} disabled={runLoading}>
              {runLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
              Run Monthly Contributions
            </Button>
          </div>
        </CardContent>
      </Card>

      {previewData && (
        <Card>
          <CardHeader><CardTitle>Preview - {month}/{year} ({previewData.length} members)</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium">Employee</th>
                    <th className="pb-2 font-medium text-right">Employee</th>
                    <th className="pb-2 font-medium text-right">Employer</th>
                    <th className="pb-2 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((item, idx) => (
                    <tr key={idx} className="border-b last:border-0">
                      <td className="py-2 font-medium">{item.employeeName}</td>
                      <td className="py-2 text-right font-mono">{formatCurrency(item.employeeAmount)}</td>
                      <td className="py-2 text-right font-mono">{formatCurrency(item.employerAmount)}</td>
                      <td className="py-2 text-right font-mono font-medium">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Contribution History</CardTitle></CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={runs}
            searchKey="period"
            searchPlaceholder="Search by period..."
            isLoading={loading}
          />
        </CardContent>
      </Card>
    </div>
  )
}
