'use client'

/**
 * ReportFilterBar — shared concern-wise dimension filter bar for /reports/* pages.
 *
 * Renders only the dropdowns the parent declares via `supports`. State is mirrored
 * to URL search params (replaceHistory=true so the browser back button still works
 * across pages). Reuses the cached lookups from `@/components/finance/dimension-selector`
 * so opening any report page after the first one is one round-trip cheaper.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Filter, RotateCcw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SearchableSelect } from '@/components/shared/searchable-select'
import { useDimensionLookups } from '@/components/finance/dimension-selector'

export type ReportFilterDimension =
  | 'sectorId'
  | 'businessUnitId'
  | 'costCenterId'
  | 'fundClassId'
  | 'projectId'
  | 'grantId'
  | 'startDate'
  | 'endDate'

export interface ReportFilters {
  sectorId?: string
  businessUnitId?: string
  costCenterId?: string
  fundClassId?: string
  projectId?: string
  grantId?: string
  startDate?: string
  endDate?: string
}

interface ReportFilterBarProps {
  /** Which filter inputs to render. Use only the ones the parent report's API actually applies. */
  supports: ReportFilterDimension[]
  /** Current filter state — typically read once from URL on mount. */
  value: ReportFilters
  /** Called whenever the user changes a filter. The parent should re-fetch its data. */
  onChange: (next: ReportFilters) => void
  /** Show only filter inputs that are at least partially populated (for read-only summary). */
  readOnly?: boolean
}

const ALL_DIMENSION_KEYS: ReportFilterDimension[] = [
  'sectorId',
  'businessUnitId',
  'costCenterId',
  'fundClassId',
  'projectId',
  'grantId',
  'startDate',
  'endDate',
]

export function readReportFiltersFromSearchParams(
  searchParams: URLSearchParams,
  supports?: ReportFilterDimension[],
): ReportFilters {
  const allowed = supports ? new Set(supports) : new Set(ALL_DIMENSION_KEYS)
  const out: ReportFilters = {}
  for (const key of ALL_DIMENSION_KEYS) {
    if (!allowed.has(key)) continue
    const v = searchParams.get(key)
    if (v) out[key] = v
  }
  return out
}

export function buildReportFiltersQuery(filters: ReportFilters): string {
  const params = new URLSearchParams()
  for (const key of ALL_DIMENSION_KEYS) {
    const v = filters[key]
    if (v) params.set(key, v)
  }
  return params.toString()
}

export function ReportFilterBar({ supports, value, onChange, readOnly }: ReportFilterBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const t = useTranslations('reports.filters')
  const tc = useTranslations('common')
  const lookups = useDimensionLookups()

  const showSector = supports.includes('sectorId')
  const showBu = supports.includes('businessUnitId')
  const showCc = supports.includes('costCenterId')
  const showFc = supports.includes('fundClassId')
  const showProject = supports.includes('projectId')
  const showGrant = supports.includes('grantId')
  const showDateRange = supports.includes('startDate') || supports.includes('endDate')

  const [local, setLocal] = useState<ReportFilters>(value)

  // Stay in sync when parent changes filter values externally (e.g. URL nav).
  useEffect(() => {
    setLocal(value)
  }, [value])

  // Mirror filter state to URL search params so a filtered report is shareable.
  const writeUrl = useCallback(
    (next: ReportFilters) => {
      const merged = new URLSearchParams(searchParams?.toString() ?? '')
      // Preserve any non-dimension search params (e.g. `?accountId=xxx` for ledger).
      for (const key of ALL_DIMENSION_KEYS) {
        if (next[key]) merged.set(key, next[key]!)
        else merged.delete(key)
      }
      const qs = merged.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  const update = useCallback(
    (patch: Partial<ReportFilters>) => {
      const next: ReportFilters = { ...local, ...patch }
      // Auto-clear cost center when business unit changes
      if ('businessUnitId' in patch) {
        const buId = patch.businessUnitId ?? null
        if (buId !== local.businessUnitId) {
          if (!buId) next.costCenterId = undefined
          else if (
            local.costCenterId &&
            lookups?.costCenters.find((cc) => cc.id === local.costCenterId)?.businessUnitId !== buId
          ) {
            next.costCenterId = undefined
          }
        }
      }
      // Auto-clear grant when project changes if grant doesn't match new project's donor.
      if ('projectId' in patch && patch.projectId !== local.projectId) {
        const newProject = lookups?.projects.find((p) => p.id === patch.projectId)
        const currentGrant = lookups?.grants.find((g) => g.id === local.grantId)
        if (newProject?.donorId && currentGrant?.donorId && currentGrant.donorId !== newProject.donorId) {
          next.grantId = undefined
        }
      }
      // Auto-clear BU/CC if sector changes and BU doesn't belong.
      if ('sectorId' in patch && patch.sectorId !== local.sectorId) {
        const newSectorId = patch.sectorId
        if (newSectorId && local.businessUnitId) {
          const bu = lookups?.businessUnits.find((b) => b.id === local.businessUnitId)
          if (bu && bu.sectorId && bu.sectorId !== newSectorId) {
            next.businessUnitId = undefined
            next.costCenterId = undefined
          }
        }
      }
      // Date sanity: if endDate is before startDate, drop endDate so the user re-picks.
      if (next.startDate && next.endDate && next.endDate < next.startDate) {
        if ('startDate' in patch) next.endDate = undefined
        else next.startDate = undefined
      }
      setLocal(next)
      onChange(next)
      writeUrl(next)
    },
    [local, lookups, onChange, writeUrl],
  )

  const filteredCostCenters = useMemo(
    () =>
      local.businessUnitId
        ? lookups?.costCenters.filter((cc) => cc.businessUnitId === local.businessUnitId) ?? []
        : [],
    [lookups, local.businessUnitId],
  )

  const filteredBusinessUnits = useMemo(
    () =>
      local.sectorId
        ? lookups?.businessUnits.filter((bu) => !bu.sectorId || bu.sectorId === local.sectorId) ?? []
        : lookups?.businessUnits ?? [],
    [lookups, local.sectorId],
  )

  const filteredGrants = useMemo(() => {
    if (!lookups?.grants) return []
    if (!local.projectId) return lookups.grants
    const project = lookups.projects.find((p) => p.id === local.projectId)
    if (!project?.donorId) return lookups.grants
    return lookups.grants.filter((g) => !g.donorId || g.donorId === project.donorId)
  }, [lookups, local.projectId])

  const handleClear = () => {
    const cleared: ReportFilters = {}
    setLocal(cleared)
    onChange(cleared)
    writeUrl(cleared)
  }

  const hasAnyFilter = ALL_DIMENSION_KEYS.some((k) => Boolean(local[k]))

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {t('title')}
          </div>
          {!readOnly && hasAnyFilter && (
            <Button variant="ghost" size="sm" onClick={handleClear}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              {t('clear')}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {showSector && (
            <div className="space-y-1.5">
              <Label htmlFor="rfb-sector" className="text-xs">{t('sector')}</Label>
              <SearchableSelect
                id="rfb-sector"
                options={[
                  { value: '', label: t('allSectors') },
                  ...(lookups?.sectors ?? []).map((s) => ({ value: s.id, label: `${s.code} · ${s.name}` })),
                ]}
                value={local.sectorId ?? ''}
                onValueChange={(v) => update({ sectorId: v || undefined })}
                placeholder={t('allSectors')}
                searchPlaceholder={tc('combobox.search')}
                disabled={readOnly}
              />
            </div>
          )}

          {showBu && (
            <div className="space-y-1.5">
              <Label htmlFor="rfb-bu" className="text-xs">{t('businessUnit')}</Label>
              <SearchableSelect
                id="rfb-bu"
                options={[
                  { value: '', label: t('allBusinessUnits') },
                  ...filteredBusinessUnits.map((bu) => ({
                    value: bu.id,
                    label: `${bu.code} · ${bu.shortName ?? bu.name}`,
                  })),
                ]}
                value={local.businessUnitId ?? ''}
                onValueChange={(v) => update({ businessUnitId: v || undefined })}
                placeholder={t('allBusinessUnits')}
                searchPlaceholder={tc('combobox.search')}
                disabled={readOnly}
              />
            </div>
          )}

          {showCc && (
            <div className="space-y-1.5">
              <Label htmlFor="rfb-cc" className="text-xs">{t('costCenter')}</Label>
              <SearchableSelect
                id="rfb-cc"
                options={[
                  { value: '', label: t('allCostCenters') },
                  ...filteredCostCenters.map((cc) => ({ value: cc.id, label: `${cc.code} · ${cc.name}` })),
                ]}
                value={local.costCenterId ?? ''}
                onValueChange={(v) => update({ costCenterId: v || undefined })}
                placeholder={local.businessUnitId ? t('allCostCenters') : t('pickBuFirst')}
                searchPlaceholder={tc('combobox.search')}
                disabled={readOnly || !local.businessUnitId}
              />
            </div>
          )}

          {showFc && (
            <div className="space-y-1.5">
              <Label htmlFor="rfb-fc" className="text-xs">{t('fundClass')}</Label>
              <SearchableSelect
                id="rfb-fc"
                options={[
                  { value: '', label: t('allFundClasses') },
                  ...(lookups?.fundClasses ?? []).map((fc) => ({ value: fc.id, label: `${fc.code} · ${fc.name}` })),
                ]}
                value={local.fundClassId ?? ''}
                onValueChange={(v) => update({ fundClassId: v || undefined })}
                placeholder={t('allFundClasses')}
                searchPlaceholder={tc('combobox.search')}
                disabled={readOnly}
              />
            </div>
          )}

          {showProject && (
            <div className="space-y-1.5">
              <Label htmlFor="rfb-project" className="text-xs">{t('project')}</Label>
              <SearchableSelect
                id="rfb-project"
                options={[
                  { value: '', label: t('allProjects') },
                  ...(lookups?.projects ?? []).map((p) => ({
                    value: p.id,
                    label: p.projectNo ? `${p.projectNo} · ${p.name}` : p.name,
                  })),
                ]}
                value={local.projectId ?? ''}
                onValueChange={(v) => update({ projectId: v || undefined })}
                placeholder={t('allProjects')}
                searchPlaceholder={tc('combobox.search')}
                disabled={readOnly}
              />
            </div>
          )}

          {showGrant && (
            <div className="space-y-1.5">
              <Label htmlFor="rfb-grant" className="text-xs">{t('grant')}</Label>
              <SearchableSelect
                id="rfb-grant"
                options={[
                  { value: '', label: t('allGrants') },
                  ...filteredGrants.map((g) => ({
                    value: g.id,
                    label: g.grantNo ? `${g.grantNo} · ${g.title ?? g.name ?? ''}` : g.title ?? g.name ?? '',
                  })),
                ]}
                value={local.grantId ?? ''}
                onValueChange={(v) => update({ grantId: v || undefined })}
                placeholder={t('allGrants')}
                searchPlaceholder={tc('combobox.search')}
                disabled={readOnly}
              />
            </div>
          )}

          {showDateRange && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="rfb-start" className="text-xs">{t('dateFrom')}</Label>
                <Input
                  id="rfb-start"
                  type="date"
                  value={local.startDate ?? ''}
                  onChange={(e) => update({ startDate: e.target.value || undefined })}
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rfb-end" className="text-xs">{t('dateTo')}</Label>
                <Input
                  id="rfb-end"
                  type="date"
                  value={local.endDate ?? ''}
                  min={local.startDate}
                  onChange={(e) => update({ endDate: e.target.value || undefined })}
                  disabled={readOnly}
                />
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
