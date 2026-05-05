'use client'

/**
 * DimensionSelector — shared multi-concern accounting dimension picker.
 *
 * Two render modes:
 *   - level="header": shows BU + Fund Class + Project + Grant (no Cost Center)
 *   - level="line"  : shows BU + Cost Center + Fund Class + Project + Grant
 *
 * Auto-clears Cost Center when Business Unit changes.
 * Auto-clears Grant when Project changes (since grant is project-scoped).
 *
 * Lookups are loaded lazily and cached at module scope, so a JE form with
 * 10 lines fires each lookup endpoint exactly once per page load.
 */

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { Label } from '@/components/ui/label'
import { SearchableSelect } from '@/components/shared/searchable-select'
import { cn } from '@/lib/utils'

export interface DimensionValue {
  businessUnitId?: string | null
  costCenterId?: string | null
  fundClassId?: string | null
  projectId?: string | null
  grantId?: string | null
}

export interface DimensionLookups {
  businessUnits: BusinessUnit[]
  costCenters: CostCenter[]
  fundClasses: FundClass[]
  projects: Project[]
  grants: Grant[]
  sectors: Sector[]
}

interface Sector {
  id: string
  code: string
  name: string
}

interface BusinessUnit {
  id: string
  code: string
  name: string
  shortName?: string | null
  sectorId?: string | null
}
interface CostCenter {
  id: string
  code: string
  name: string
  businessUnitId: string
}
interface FundClass {
  id: string
  code: string
  name: string
}
interface Project {
  id: string
  projectNo?: string | null
  code?: string | null
  name: string
  donorId?: string | null
}
interface Grant {
  id: string
  grantNo?: string | null
  code?: string | null
  title?: string | null
  name?: string | null
  donorId?: string | null
}

interface CacheEntry {
  data: DimensionLookups | null
  fetchedAt: number
  pending: Promise<DimensionLookups> | null
}

const CACHE_TTL_MS = 5 * 60 * 1000
let cache: CacheEntry = { data: null, fetchedAt: 0, pending: null }
const subscribers = new Set<() => void>()

function notifySubscribers() {
  for (const cb of subscribers) cb()
}

function subscribe(cb: () => void) {
  subscribers.add(cb)
  return () => {
    subscribers.delete(cb)
  }
}

function getSnapshot(): CacheEntry {
  return cache
}

function getServerSnapshot(): CacheEntry {
  return { data: null, fetchedAt: 0, pending: null }
}

async function fetchLookups(): Promise<DimensionLookups> {
  const [buRes, ccRes, fcRes, projRes, grantsRes, sectorsRes] = await Promise.all([
    fetch('/api/v1/settings/business-units?limit=200&isActive=true').then((r) => r.json()).catch(() => ({ success: false, data: [] })),
    fetch('/api/v1/settings/cost-centers?limit=500&isActive=true').then((r) => r.json()).catch(() => ({ success: false, data: [] })),
    fetch('/api/v1/settings/fund-classes?limit=100&isActive=true').then((r) => r.json()).catch(() => ({ success: false, data: [] })),
    fetch('/api/v1/projects?limit=200').then((r) => r.json()).catch(() => ({ success: false, data: [] })),
    fetch('/api/v1/donors/grants?limit=200').then((r) => r.json()).catch(() => ({ success: false, data: [] })),
    fetch('/api/v1/settings/sectors?limit=100&isActive=true').then((r) => r.json()).catch(() => ({ success: false, data: [] })),
  ])
  return {
    businessUnits: buRes.success ? buRes.data : [],
    costCenters: ccRes.success ? ccRes.data : [],
    fundClasses: fcRes.success ? fcRes.data : [],
    projects: projRes.success ? projRes.data : [],
    grants: grantsRes.success ? grantsRes.data : [],
    sectors: sectorsRes.success ? sectorsRes.data : [],
  }
}

function ensureLookups(): Promise<DimensionLookups> | null {
  const fresh = cache.data && Date.now() - cache.fetchedAt < CACHE_TTL_MS
  if (fresh) return null
  if (cache.pending) return cache.pending
  const pending = fetchLookups().then((data) => {
    cache = { data, fetchedAt: Date.now(), pending: null }
    notifySubscribers()
    return data
  })
  cache = { ...cache, pending }
  return pending
}

/**
 * Force a refresh of the cached lookups (e.g. after creating a new BU).
 */
export function invalidateDimensionLookups() {
  cache = { data: null, fetchedAt: 0, pending: null }
  notifySubscribers()
}

interface DimensionSelectorProps {
  level: 'header' | 'line'
  value: DimensionValue
  onChange: (next: DimensionValue) => void
  disabled?: boolean
  /** When true, header label highlights BU + Fund Class as recommended */
  emphasizeRequired?: boolean
  /** Optional id prefix so labels stay unique on a page with many lines */
  idPrefix?: string
  /** Override layout: 'grid' (default 2/3-col) or 'inline' (5-col flex) */
  layout?: 'grid' | 'inline'
  /** Hide labels (useful when used inside a table row) */
  hideLabels?: boolean
}

export function DimensionSelector({
  level,
  value,
  onChange,
  disabled,
  emphasizeRequired,
  idPrefix = 'dim',
  layout = 'grid',
  hideLabels = false,
}: DimensionSelectorProps) {
  const cacheState = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const [, forceRender] = useState(0)

  useEffect(() => {
    const promise = ensureLookups()
    if (promise) {
      promise.finally(() => forceRender((x) => x + 1))
    }
  }, [])

  const lookups = cacheState.data

  // Reference-stable arrays so memos don't churn on every render when cache is empty.
  const businessUnits = useMemo(() => lookups?.businessUnits ?? [], [lookups])
  const costCenters = useMemo(() => lookups?.costCenters ?? [], [lookups])
  const fundClasses = useMemo(() => lookups?.fundClasses ?? [], [lookups])
  const projects = useMemo(() => lookups?.projects ?? [], [lookups])
  const grants = useMemo(() => lookups?.grants ?? [], [lookups])

  // Filter cost centers by selected BU. If no BU selected, show none.
  const filteredCostCenters = useMemo(
    () => (value.businessUnitId ? costCenters.filter((cc) => cc.businessUnitId === value.businessUnitId) : []),
    [costCenters, value.businessUnitId],
  )

  // Filter grants: if a project is picked AND the project has a donor, narrow to grants
  // from that donor; otherwise show all grants. (A grant may also be project-independent.)
  const selectedProject = useMemo(
    () => projects.find((p) => p.id === value.projectId),
    [projects, value.projectId],
  )
  const filteredGrants = useMemo(() => {
    if (!selectedProject?.donorId) return grants
    return grants.filter((g) => !g.donorId || g.donorId === selectedProject.donorId)
  }, [grants, selectedProject])

  const buOptions = useMemo(
    () =>
      businessUnits.map((bu) => ({
        value: bu.id,
        label: `${bu.code} · ${bu.shortName ?? bu.name}`,
      })),
    [businessUnits],
  )

  const ccOptions = useMemo(
    () =>
      filteredCostCenters.map((cc) => ({
        value: cc.id,
        label: `${cc.code} · ${cc.name}`,
      })),
    [filteredCostCenters],
  )

  const fcOptions = useMemo(
    () =>
      fundClasses.map((fc) => ({
        value: fc.id,
        label: `${fc.code} · ${fc.name}`,
      })),
    [fundClasses],
  )

  const projectOptions = useMemo(
    () =>
      projects.map((p) => {
        const code = p.projectNo ?? p.code ?? ''
        return {
          value: p.id,
          label: code ? `${code} · ${p.name}` : p.name,
        }
      }),
    [projects],
  )

  const grantOptions = useMemo(
    () =>
      filteredGrants.map((g) => {
        const code = g.grantNo ?? g.code ?? ''
        const title = g.title ?? g.name ?? '(grant)'
        return {
          value: g.id,
          label: code ? `${code} · ${title}` : title,
        }
      }),
    [filteredGrants],
  )

  const handleBuChange = (next: string) => {
    const buId = next || null
    onChange({
      ...value,
      businessUnitId: buId,
      // Clear cost center if it doesn't belong to the new BU.
      costCenterId: buId && value.costCenterId && costCenters.find((cc) => cc.id === value.costCenterId)?.businessUnitId === buId
        ? value.costCenterId
        : null,
    })
  }

  const handleCcChange = (next: string) => {
    onChange({ ...value, costCenterId: next || null })
  }

  const handleFcChange = (next: string) => {
    onChange({ ...value, fundClassId: next || null })
  }

  const handleProjectChange = (next: string) => {
    const projId = next || null
    const project = projects.find((p) => p.id === projId)
    // If grant is set but doesn't match the new project's donor, clear it.
    let nextGrantId = value.grantId ?? null
    if (project?.donorId && nextGrantId) {
      const currentGrant = grants.find((g) => g.id === nextGrantId)
      if (currentGrant?.donorId && currentGrant.donorId !== project.donorId) {
        nextGrantId = null
      }
    }
    onChange({ ...value, projectId: projId, grantId: nextGrantId })
  }

  const handleGrantChange = (next: string) => {
    onChange({ ...value, grantId: next || null })
  }

  const wrapperClass =
    layout === 'inline'
      ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3'
      : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'

  return (
    <div className={wrapperClass}>
      <div className="space-y-1.5">
        {!hideLabels && (
          <Label htmlFor={`${idPrefix}-bu`} className={cn(emphasizeRequired && 'after:content-["*"] after:ml-0.5 after:text-destructive')}>
            Business Unit
          </Label>
        )}
        <SearchableSelect
          id={`${idPrefix}-bu`}
          options={buOptions}
          value={value.businessUnitId ?? ''}
          onValueChange={handleBuChange}
          placeholder="Select business unit"
          searchPlaceholder="Search business units…"
          disabled={disabled}
          emptyMessage="No business units"
        />
      </div>

      {level === 'line' && (
        <div className="space-y-1.5">
          {!hideLabels && (
            <Label htmlFor={`${idPrefix}-cc`}>Cost Center</Label>
          )}
          <SearchableSelect
            id={`${idPrefix}-cc`}
            options={ccOptions}
            value={value.costCenterId ?? ''}
            onValueChange={handleCcChange}
            placeholder={value.businessUnitId ? 'Select cost center' : 'Pick BU first'}
            searchPlaceholder="Search cost centers…"
            disabled={disabled || !value.businessUnitId}
            emptyMessage={value.businessUnitId ? 'No cost centers under this BU' : 'Pick a BU first'}
          />
        </div>
      )}

      <div className="space-y-1.5">
        {!hideLabels && (
          <Label htmlFor={`${idPrefix}-fc`} className={cn(emphasizeRequired && 'after:content-["*"] after:ml-0.5 after:text-destructive')}>
            Fund Class
          </Label>
        )}
        <SearchableSelect
          id={`${idPrefix}-fc`}
          options={fcOptions}
          value={value.fundClassId ?? ''}
          onValueChange={handleFcChange}
          placeholder="Select fund class"
          searchPlaceholder="Search fund classes…"
          disabled={disabled}
          emptyMessage="No fund classes"
        />
      </div>

      <div className="space-y-1.5">
        {!hideLabels && <Label htmlFor={`${idPrefix}-project`}>Project</Label>}
        <SearchableSelect
          id={`${idPrefix}-project`}
          options={projectOptions}
          value={value.projectId ?? ''}
          onValueChange={handleProjectChange}
          placeholder="Select project (optional)"
          searchPlaceholder="Search projects…"
          disabled={disabled}
          emptyMessage="No projects"
        />
      </div>

      <div className="space-y-1.5">
        {!hideLabels && <Label htmlFor={`${idPrefix}-grant`}>Grant</Label>}
        <SearchableSelect
          id={`${idPrefix}-grant`}
          options={grantOptions}
          value={value.grantId ?? ''}
          onValueChange={handleGrantChange}
          placeholder={value.projectId && grantOptions.length === 0 ? 'No matching grant' : 'Select grant (optional)'}
          searchPlaceholder="Search grants…"
          disabled={disabled}
          emptyMessage="No grants"
        />
      </div>
    </div>
  )
}

/**
 * Compact summary for read-only display, e.g. on JE detail or audit row.
 * Shows the codes only when the value is set; falls back to "—".
 */
interface DimensionSummaryProps {
  value: DimensionValue
  lookups?: DimensionLookups | null
  className?: string
}

export function DimensionSummary({ value, lookups, className }: DimensionSummaryProps) {
  const cacheState = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const [, forceRender] = useState(0)

  useEffect(() => {
    if (lookups) return
    const promise = ensureLookups()
    if (promise) promise.finally(() => forceRender((x) => x + 1))
  }, [lookups])

  const data = lookups ?? cacheState.data
  if (!data) return <span className={cn('text-xs text-muted-foreground', className)}>—</span>

  const bu = value.businessUnitId ? data.businessUnits.find((b) => b.id === value.businessUnitId) : null
  const cc = value.costCenterId ? data.costCenters.find((c) => c.id === value.costCenterId) : null
  const fc = value.fundClassId ? data.fundClasses.find((f) => f.id === value.fundClassId) : null
  const project = value.projectId ? data.projects.find((p) => p.id === value.projectId) : null
  const grant = value.grantId ? data.grants.find((g) => g.id === value.grantId) : null

  const tags = [
    bu ? { key: 'BU', label: bu.code } : null,
    cc ? { key: 'CC', label: cc.code } : null,
    fc ? { key: 'FC', label: fc.code } : null,
    project ? { key: 'PR', label: project.projectNo ?? project.code ?? project.name } : null,
    grant ? { key: 'GR', label: grant.grantNo ?? grant.code ?? grant.title ?? grant.name ?? '(grant)' } : null,
  ].filter((tag): tag is { key: string; label: string } => Boolean(tag))

  if (tags.length === 0) return <span className={cn('text-xs text-muted-foreground', className)}>Unassigned</span>

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {tags.map((tag) => (
        <span
          key={tag.key}
          className="inline-flex items-center gap-1 rounded bg-muted/60 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground"
        >
          <span className="text-[9px] font-semibold uppercase tracking-wide">{tag.key}</span>
          {tag.label}
        </span>
      ))}
    </div>
  )
}

/**
 * Hook variant — returns the cached lookups without rendering anything.
 */
export function useDimensionLookups(): DimensionLookups | null {
  const cacheState = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const [, forceRender] = useState(0)

  useEffect(() => {
    const promise = ensureLookups()
    if (promise) promise.finally(() => forceRender((x) => x + 1))
  }, [])

  return cacheState.data
}
