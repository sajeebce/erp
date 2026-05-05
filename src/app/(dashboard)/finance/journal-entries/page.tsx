'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Plus } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { HelpButton } from '@/components/shared/help-modal'
import { SearchableSelect } from '@/components/shared/searchable-select'
import {
  DimensionSummary,
  useDimensionLookups,
  type DimensionValue,
} from '@/components/finance/dimension-selector'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useFormatters } from '@/hooks/use-formatters'

interface JournalEntry {
  id: string
  entryNo: string
  date: string
  description: string
  totalDebit: string | number
  totalCredit: string | number
  status: string
  createdAt: string
  businessUnitId?: string | null
  projectId?: string | null
  grantId?: string | null
}

export default function JournalEntriesPage() {
  const router = useRouter()
  const t = useTranslations('finance.journalEntries')
  const th = useTranslations('finance.help.journalEntries')
  const tc = useTranslations('common')
  const { formatCurrency } = useFormatters()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)

  const [filterBu, setFilterBu] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterProject, setFilterProject] = useState('')
  const [filterGrant, setFilterGrant] = useState('')

  const lookups = useDimensionLookups()

  const buOptions = useMemo(
    () => [
      { value: '', label: 'All business units' },
      ...(lookups?.businessUnits ?? []).map((bu) => ({
        value: bu.id,
        label: `${bu.code} · ${bu.shortName ?? bu.name}`,
      })),
    ],
    [lookups],
  )
  const projectOptions = useMemo(
    () => [
      { value: '', label: 'All projects' },
      ...(lookups?.projects ?? []).map((p) => ({
        value: p.id,
        label: p.projectNo ? `${p.projectNo} · ${p.name}` : p.name,
      })),
    ],
    [lookups],
  )
  const grantOptions = useMemo(
    () => [
      { value: '', label: 'All grants' },
      ...(lookups?.grants ?? []).map((g) => ({
        value: g.id,
        label: g.grantNo ? `${g.grantNo} · ${g.title ?? g.name ?? '(grant)'}` : g.title ?? g.name ?? '(grant)',
      })),
    ],
    [lookups],
  )
  const statusOptions = [
    { value: '', label: 'All statuses' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ]

  const columns: ColumnDef<JournalEntry>[] = [
    { accessorKey: 'entryNo', header: t('entryNo'), cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.getValue('entryNo')}</span> },
    { accessorKey: 'date', header: t('date'), cell: ({ row }) => new Date(row.getValue('date') as string).toLocaleDateString() },
    { accessorKey: 'description', header: t('description'), cell: ({ row }) => <span className="max-w-[300px] truncate block">{row.getValue('description')}</span> },
    {
      id: 'dimensions',
      header: 'Dimensions',
      cell: ({ row }) => {
        const e = row.original
        const value: DimensionValue = {
          businessUnitId: e.businessUnitId ?? null,
          projectId: e.projectId ?? null,
          grantId: e.grantId ?? null,
        }
        return <DimensionSummary value={value} lookups={lookups} />
      },
    },
    { accessorKey: 'totalDebit', header: t('debit'), cell: ({ row }) => <span className="font-mono text-sm">{formatCurrency(Number(row.getValue('totalDebit')))}</span> },
    { accessorKey: 'totalCredit', header: t('credit'), cell: ({ row }) => <span className="font-mono text-sm">{formatCurrency(Number(row.getValue('totalCredit')))}</span> },
    { accessorKey: 'status', header: t('status'), cell: ({ row }) => <StatusBadge status={row.getValue('status')} /> },
  ]

  useEffect(() => {
    let cancelled = false
    const params = new URLSearchParams({ limit: '100' })
    if (filterBu) params.set('businessUnitId', filterBu)
    if (filterStatus) params.set('status', filterStatus)
    if (filterProject) params.set('projectId', filterProject)
    if (filterGrant) params.set('grantId', filterGrant)

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    fetch(`/api/v1/finance/journal-entries?${params.toString()}`)
      .then(res => res.json())
      .then(json => {
        if (cancelled) return
        if (json.success) setEntries(json.data)
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [filterBu, filterStatus, filterProject, filterGrant])

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')}>
        <HelpButton
          title={th('title')}
          description={th('description')}
          steps={[
            { title: th('step1Title'), description: th('step1Desc') },
            { title: th('step2Title'), description: th('step2Desc') },
            { title: th('step3Title'), description: th('step3Desc') },
            { title: th('step4Title'), description: th('step4Desc') },
            { title: th('step5Title'), description: th('step5Desc') },
          ]}
          tips={[th('tip1'), th('tip2'), th('tip3')]}
        />
        <Button size="sm" onClick={() => router.push('/finance/journal-entries/new')}>
          <Plus className="h-4 w-4 mr-2" />{t('newEntry')}
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="je-filter-bu" className="text-xs">Business Unit</Label>
            <SearchableSelect
              id="je-filter-bu"
              options={buOptions}
              value={filterBu}
              onValueChange={setFilterBu}
              placeholder="All business units"
              searchPlaceholder="Search…"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="je-filter-project" className="text-xs">Project</Label>
            <SearchableSelect
              id="je-filter-project"
              options={projectOptions}
              value={filterProject}
              onValueChange={setFilterProject}
              placeholder="All projects"
              searchPlaceholder="Search…"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="je-filter-grant" className="text-xs">Grant</Label>
            <SearchableSelect
              id="je-filter-grant"
              options={grantOptions}
              value={filterGrant}
              onValueChange={setFilterGrant}
              placeholder="All grants"
              searchPlaceholder="Search…"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="je-filter-status" className="text-xs">{tc('labels.status')}</Label>
            <SearchableSelect
              id="je-filter-status"
              options={statusOptions}
              value={filterStatus}
              onValueChange={setFilterStatus}
              placeholder="All statuses"
            />
          </div>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={entries}
        searchKey="description"
        searchPlaceholder={t('searchEntries')}
        isLoading={loading}
        onRowClick={(row) => router.push(`/finance/journal-entries/${row.id}`)}
      />
    </div>
  )
}
