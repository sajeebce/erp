'use client'

/**
 * Shared report-page shell for concern-wise reports.
 *
 * Responsibilities:
 *   - Load fiscal years + organisation name once on mount
 *   - Mount <ReportFilterBar> (configurable via `supports`)
 *   - Re-fetch the report whenever fiscal year, period, or any active dimension changes
 *   - Render via <ReportViewer> (which already handles CSV export + print)
 *
 * Each report page passes its own:
 *   - `endpoint`            : the API path (e.g. /api/v1/reports/inter-concern-transactions)
 *   - `supports`            : which filter inputs to expose
 *   - `extractRows`         : maps the API response into ReportViewer rows + totals
 *   - `columns`             : ReportViewer column descriptors
 *   - `title` / `description`
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { SearchableSelect } from '@/components/shared/searchable-select'
import { PageHeader } from '@/components/shared/page-header'
import { ReportViewer } from '@/components/shared/report-viewer'
import {
  ReportFilterBar,
  readReportFiltersFromSearchParams,
  type ReportFilterDimension,
  type ReportFilters,
} from '@/components/reports/concern-filter-bar'

interface FiscalYear {
  id: string
  name: string
  isCurrent: boolean
  startDate: string
  endDate: string
}

export interface ReportColumn {
  key: string
  label: string
  align?: 'left' | 'right' | 'center'
  format?: 'text' | 'currency' | 'date'
  bold?: boolean
}

interface ExtractedReport {
  rows: Record<string, unknown>[]
  totals?: Record<string, unknown>
  emptyMessage?: string
}

export interface DimensionalReportPageProps {
  title: string
  description?: string
  endpoint: string
  supports: ReportFilterDimension[]
  columns: ReportColumn[]
  extractRows: (data: Record<string, unknown>) => ExtractedReport
  /** Optional fixed back link */
  backHref?: string
  /** Extra static query params to always send (e.g. groupBy=businessUnit) */
  extraQuery?: Record<string, string>
}

export function DimensionalReportPage({
  title,
  description,
  endpoint,
  supports,
  columns,
  extractRows,
  backHref = '/reports/financial',
  extraQuery,
}: DimensionalReportPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([])
  const [fiscalYearId, setFiscalYearId] = useState('')
  const [orgName, setOrgName] = useState('')
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<Record<string, unknown> | null>(null)

  const showDate = supports.includes('startDate') || supports.includes('endDate')
  const dimensionSupports = useMemo(
    () => supports.filter((k) => k !== 'startDate' && k !== 'endDate'),
    [supports],
  )
  // Always include date inputs so users can narrow the period even when the parent
  // didn't list them in `supports`. Most concern reports want them.
  const filterSupports: ReportFilterDimension[] = useMemo(
    () => [...new Set<ReportFilterDimension>([...dimensionSupports, 'startDate', 'endDate'])],
    [dimensionSupports],
  )

  const [filters, setFilters] = useState<ReportFilters>(() =>
    readReportFiltersFromSearchParams(new URLSearchParams(searchParams?.toString() ?? ''), filterSupports),
  )

  useEffect(() => {
    const init = async () => {
      try {
        const [fyRes, orgRes] = await Promise.all([
          fetch('/api/v1/settings/fiscal-years').then((r) => r.json()),
          fetch('/api/v1/settings/organization').then((r) => r.json()),
        ])
        if (fyRes.success) {
          setFiscalYears(fyRes.data)
          const current = fyRes.data.find((fy: FiscalYear) => fy.isCurrent)
          if (current) {
            setFiscalYearId(current.id)
          }
        }
        if (orgRes.success) setOrgName(orgRes.data.name)
      } catch {
        /* ignore lookup failures */
      }
    }
    init()
  }, [])

  const generate = useCallback(async () => {
    if (!fiscalYearId) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('fiscalYearId', fiscalYearId)
      if (filters.startDate) params.set('startDate', filters.startDate)
      if (filters.endDate) params.set('endDate', filters.endDate)
      for (const key of dimensionSupports) {
        const v = filters[key]
        if (v) params.set(key, v)
      }
      if (extraQuery) {
        for (const [k, v] of Object.entries(extraQuery)) params.set(k, v)
      }
      const res = await fetch(`${endpoint}?${params.toString()}`)
      const json = await res.json()
      if (json.success) setReportData(json.data)
      else setReportData(null)
    } catch {
      setReportData(null)
    } finally {
      setLoading(false)
    }
  }, [fiscalYearId, filters, dimensionSupports, endpoint, extraQuery])

  useEffect(() => {
    if (fiscalYearId) generate()
  }, [generate, fiscalYearId])

  const periodStr = useMemo(() => {
    const fy = fiscalYears.find((f) => f.id === fiscalYearId)
    const start = filters.startDate ?? fy?.startDate
    const end = filters.endDate ?? fy?.endDate
    if (!start || !end) return ''
    return `${new Date(start).toLocaleDateString()} — ${new Date(end).toLocaleDateString()}`
  }, [fiscalYears, fiscalYearId, filters.startDate, filters.endDate])

  const extracted = useMemo<ExtractedReport>(
    () => (reportData ? extractRows(reportData) : { rows: [] }),
    [reportData, extractRows],
  )

  return (
    <div className="space-y-6 print:space-y-2">
      <div className="print:hidden">
        <PageHeader title={title} description={description}>
          <Button variant="outline" size="sm" onClick={() => router.push(backHref)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        </PageHeader>
      </div>

      {filterSupports.length > 0 && (
        <div className="print:hidden">
          <ReportFilterBar supports={filterSupports} value={filters} onChange={setFilters} />
        </div>
      )}

      <Card className="print:hidden">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="rep-fy">Fiscal Year</Label>
              <SearchableSelect
                id="rep-fy"
                options={fiscalYears.map((fy) => ({
                  value: fy.id,
                  label: `${fy.name}${fy.isCurrent ? ' (Current)' : ''}`,
                }))}
                value={fiscalYearId}
                onValueChange={setFiscalYearId}
                placeholder="Select fiscal year"
              />
            </div>
            {showDate && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs" htmlFor="rep-start">From</Label>
                  <Input
                    id="rep-start"
                    type="date"
                    value={filters.startDate ?? ''}
                    onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value || undefined }))}
                    className="w-40"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs" htmlFor="rep-end">To</Label>
                  <Input
                    id="rep-end"
                    type="date"
                    value={filters.endDate ?? ''}
                    min={filters.startDate}
                    onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value || undefined }))}
                    className="w-40"
                  />
                </div>
              </>
            )}
            <Button size="sm" onClick={generate} disabled={loading || !fiscalYearId}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12 print:hidden">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ReportViewer
          title={title}
          orgName={orgName}
          period={periodStr}
          columns={columns}
          rows={extracted.rows}
          totals={extracted.totals}
          emptyMessage={extracted.emptyMessage ?? 'No data for the selected filters.'}
        />
      )}
    </div>
  )
}
