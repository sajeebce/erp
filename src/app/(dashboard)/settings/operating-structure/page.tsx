'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Search, Pencil, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/shared/page-header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ─── API Types ───────────────────────────────────────────────────────────────

interface Sector {
  id: string
  code: string
  name: string
  localizedName: { en: string; bn: string } | null
  isActive: boolean
  businessUnitCount?: number
}

interface BusinessUnit {
  id: string
  code: string
  name: string
  shortName: string | null
  localizedName: { en: string; bn: string } | null
  isActive: boolean
  sectorId: string
  sector?: { id: string; code: string; name: string }
  costCenterCount?: number
}

interface CostCenter {
  id: string
  code: string
  name: string
  localizedName: { en: string; bn: string } | null
  description: string | null
  isActive: boolean
  businessUnitId: string
  businessUnit?: { id: string; code: string; name: string; shortName: string | null }
}

interface FundClass {
  id: string
  code: string
  name: string
  localizedName: { en: string; bn: string } | null
  restriction: string
  isActive: boolean
}

interface OperatingLocation {
  id: string
  code: string
  name: string
  localizedName: { en: string; bn: string } | null
  address: string | null
  isActive: boolean
  businessUnitId: string | null
  businessUnit?: { id: string; code: string; name: string; shortName: string | null } | null
}

// ─── Shared Helpers ──────────────────────────────────────────────────────────

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  const json = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? 'API error')
  return json.data as T
}

function ActiveBadge({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 dark:bg-emerald-950 dark:text-emerald-400">
        Active
      </Badge>
    )
  }
  return <Badge variant="secondary">Inactive</Badge>
}

function TabToolbar({
  searchValue,
  onSearch,
  searchPlaceholder,
  onAdd,
  addLabel,
}: {
  searchValue: string
  onSearch: (v: string) => void
  searchPlaceholder: string
  onAdd: () => void
  addLabel: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={e => onSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <Button size="sm" onClick={onAdd}>
        <Plus className="h-4 w-4 mr-1.5" />
        {addLabel}
      </Button>
    </div>
  )
}

function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="text-center text-muted-foreground py-10">
        {message}
      </TableCell>
    </TableRow>
  )
}

function LoadingRow({ colSpan }: { colSpan: number }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="text-center py-10">
        <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
      </TableCell>
    </TableRow>
  )
}

// ─── Sectors Tab ─────────────────────────────────────────────────────────────

function SectorsTab() {
  const t = useTranslations('settings.operatingStructure')
  const tc = useTranslations('common')
  const [sectors, setSectors] = useState<Sector[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Sector | null>(null)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [isActive, setIsActive] = useState(true)

  const loadSectors = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch<Sector[]>('/api/v1/settings/sectors')
      setSectors(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadSectors() }, [loadSectors])

  const filtered = useMemo(
    () => sectors.filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase())
    ),
    [sectors, search],
  )

  function openAdd() {
    setEditing(null)
    setCode('')
    setName('')
    setIsActive(true)
    setOpen(true)
  }

  function openEdit(row: Sector) {
    setEditing(row)
    setCode(row.code)
    setName(row.name)
    setIsActive(row.isActive)
    setOpen(true)
  }

  async function handleSave() {
    if (!code.trim() || !name.trim()) return
    setSaving(true)
    try {
      if (editing) {
        await apiFetch(`/api/v1/settings/sectors/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, isActive }),
        })
      } else {
        await apiFetch('/api/v1/settings/sectors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, name }),
        })
      }
      setOpen(false)
      await loadSectors()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <TabToolbar
        searchValue={search}
        onSearch={setSearch}
        searchPlaceholder={t('searchSectors')}
        onAdd={openAdd}
        addLabel={t('addSector')}
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">{t('code')}</TableHead>
                <TableHead>{t('name')}</TableHead>
                <TableHead className="hidden md:table-cell w-24">{t('businessUnits')}</TableHead>
                <TableHead className="w-24">{t('isActive')}</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <LoadingRow colSpan={5} />
              ) : filtered.length === 0 ? (
                <EmptyRow colSpan={5} message={t('noSectors')} />
              ) : (
                filtered.map(row => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{row.code}</TableCell>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{row.businessUnitCount ?? '—'}</TableCell>
                    <TableCell><ActiveBadge isActive={row.isActive} /></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(row)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? t('editSector') : t('addSector')}</DialogTitle>
            <DialogDescription>{t('description')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t('code')}</Label>
              <Input
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder={t('codePlaceholder')}
                disabled={!!editing}
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('name')}</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder={t('namePlaceholder')} />
            </div>
            {editing && (
              <div className="flex items-center justify-between">
                <Label>{t('isActive')}</Label>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{tc('buttons.cancel')}</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('saveChanges')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Business Units Tab ───────────────────────────────────────────────────────

function BusinessUnitsTab() {
  const t = useTranslations('settings.operatingStructure')
  const tc = useTranslations('common')
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([])
  const [sectors, setSectors] = useState<Sector[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<BusinessUnit | null>(null)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [shortName, setShortName] = useState('')
  const [sectorId, setSectorId] = useState('')
  const [isActive, setIsActive] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [buData, secData] = await Promise.all([
        apiFetch<BusinessUnit[]>('/api/v1/settings/business-units'),
        apiFetch<Sector[]>('/api/v1/settings/sectors'),
      ])
      setBusinessUnits(buData)
      setSectors(secData)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const filtered = useMemo(
    () => businessUnits.filter(r =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.code.toLowerCase().includes(search.toLowerCase()) ||
      (r.sector?.name ?? '').toLowerCase().includes(search.toLowerCase())
    ),
    [businessUnits, search],
  )

  function openAdd() {
    setEditing(null); setCode(''); setName(''); setShortName(''); setSectorId(''); setIsActive(true); setOpen(true)
  }

  function openEdit(row: BusinessUnit) {
    setEditing(row); setCode(row.code); setName(row.name); setShortName(row.shortName ?? '')
    setSectorId(row.sectorId); setIsActive(row.isActive); setOpen(true)
  }

  async function handleSave() {
    if (!name.trim() || !sectorId) return
    setSaving(true)
    try {
      if (editing) {
        await apiFetch(`/api/v1/settings/business-units/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, shortName: shortName || null, sectorId, isActive }),
        })
      } else {
        await apiFetch('/api/v1/settings/business-units', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, name, shortName: shortName || null, sectorId }),
        })
      }
      setOpen(false)
      await loadData()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <TabToolbar
        searchValue={search}
        onSearch={setSearch}
        searchPlaceholder={t('searchBusinessUnits')}
        onAdd={openAdd}
        addLabel={t('addBusinessUnit')}
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">{t('code')}</TableHead>
                <TableHead>{t('name')}</TableHead>
                <TableHead className="hidden lg:table-cell w-28">{t('shortName')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('sector')}</TableHead>
                <TableHead className="w-24">{t('isActive')}</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <LoadingRow colSpan={6} />
              ) : filtered.length === 0 ? (
                <EmptyRow colSpan={6} message={t('noBusinessUnits')} />
              ) : (
                filtered.map(row => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{row.code}</TableCell>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{row.shortName}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className="text-xs">{row.sector?.name}</Badge>
                    </TableCell>
                    <TableCell><ActiveBadge isActive={row.isActive} /></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(row)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? t('editBusinessUnit') : t('addBusinessUnit')}</DialogTitle>
            <DialogDescription>{t('description')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t('code')}</Label>
                <Input value={code} onChange={e => setCode(e.target.value)} placeholder={t('codePlaceholder')} disabled={!!editing} className="font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label>{t('shortName')}</Label>
                <Input value={shortName} onChange={e => setShortName(e.target.value)} placeholder={t('shortNamePlaceholder')} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t('name')}</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder={t('namePlaceholder')} />
            </div>
            <div className="space-y-1.5">
              <Label>{t('sector')}</Label>
              <Select value={sectorId} onValueChange={setSectorId}>
                <SelectTrigger><SelectValue placeholder={t('selectSector')} /></SelectTrigger>
                <SelectContent>
                  {sectors.filter(s => s.isActive).map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editing && (
              <div className="flex items-center justify-between">
                <Label>{t('isActive')}</Label>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{tc('buttons.cancel')}</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('saveChanges')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Cost Centers Tab ─────────────────────────────────────────────────────────

function CostCentersTab() {
  const t = useTranslations('settings.operatingStructure')
  const tc = useTranslations('common')
  const [costCenters, setCostCenters] = useState<CostCenter[]>([])
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<CostCenter | null>(null)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [businessUnitId, setBusinessUnitId] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [ccData, buData] = await Promise.all([
        apiFetch<CostCenter[]>('/api/v1/settings/cost-centers'),
        apiFetch<BusinessUnit[]>('/api/v1/settings/business-units'),
      ])
      setCostCenters(ccData)
      setBusinessUnits(buData)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const filtered = useMemo(
    () => costCenters.filter(r =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.code.toLowerCase().includes(search.toLowerCase()) ||
      (r.businessUnit?.name ?? '').toLowerCase().includes(search.toLowerCase())
    ),
    [costCenters, search],
  )

  function openAdd() {
    setEditing(null); setCode(''); setName(''); setBusinessUnitId(''); setDescription(''); setIsActive(true); setOpen(true)
  }

  function openEdit(row: CostCenter) {
    setEditing(row); setCode(row.code); setName(row.name); setBusinessUnitId(row.businessUnitId)
    setDescription(row.description ?? ''); setIsActive(row.isActive); setOpen(true)
  }

  async function handleSave() {
    if (!name.trim() || !businessUnitId) return
    setSaving(true)
    try {
      if (editing) {
        await apiFetch(`/api/v1/settings/cost-centers/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, businessUnitId, description: description || null, isActive }),
        })
      } else {
        await apiFetch('/api/v1/settings/cost-centers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, name, businessUnitId, description: description || null }),
        })
      }
      setOpen(false)
      await loadData()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <TabToolbar
        searchValue={search}
        onSearch={setSearch}
        searchPlaceholder={t('searchCostCenters')}
        onAdd={openAdd}
        addLabel={t('addCostCenter')}
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">{t('code')}</TableHead>
                <TableHead>{t('name')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('businessUnit')}</TableHead>
                <TableHead className="hidden lg:table-cell">{t('description')}</TableHead>
                <TableHead className="w-24">{t('isActive')}</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <LoadingRow colSpan={6} />
              ) : filtered.length === 0 ? (
                <EmptyRow colSpan={6} message={t('noCostCenters')} />
              ) : (
                filtered.map(row => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{row.code}</TableCell>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className="text-xs">{row.businessUnit?.shortName ?? row.businessUnit?.name}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground truncate max-w-xs">{row.description}</TableCell>
                    <TableCell><ActiveBadge isActive={row.isActive} /></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(row)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? t('editCostCenter') : t('addCostCenter')}</DialogTitle>
            <DialogDescription>{t('description')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t('code')}</Label>
              <Input value={code} onChange={e => setCode(e.target.value)} placeholder={t('codePlaceholder')} disabled={!!editing} className="font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label>{t('name')}</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder={t('namePlaceholder')} />
            </div>
            <div className="space-y-1.5">
              <Label>{t('businessUnit')}</Label>
              <Select value={businessUnitId} onValueChange={setBusinessUnitId}>
                <SelectTrigger><SelectValue placeholder={t('selectBusinessUnit')} /></SelectTrigger>
                <SelectContent>
                  {businessUnits.filter(b => b.isActive).map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.shortName ? `${b.shortName} — ${b.name}` : b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t('description')}</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={t('descriptionPlaceholder')} rows={2} />
            </div>
            {editing && (
              <div className="flex items-center justify-between">
                <Label>{t('isActive')}</Label>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{tc('buttons.cancel')}</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('saveChanges')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Locations Tab ────────────────────────────────────────────────────────────

function LocationsTab() {
  const t = useTranslations('settings.operatingStructure')
  const tc = useTranslations('common')
  const [locations, setLocations] = useState<OperatingLocation[]>([])
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<OperatingLocation | null>(null)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [businessUnitId, setBusinessUnitId] = useState<string>('')
  const [address, setAddress] = useState('')
  const [isActive, setIsActive] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [locData, buData] = await Promise.all([
        apiFetch<OperatingLocation[]>('/api/v1/settings/operating-locations'),
        apiFetch<BusinessUnit[]>('/api/v1/settings/business-units'),
      ])
      setLocations(locData)
      setBusinessUnits(buData)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const filtered = useMemo(
    () => locations.filter(r =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.code.toLowerCase().includes(search.toLowerCase()) ||
      (r.address ?? '').toLowerCase().includes(search.toLowerCase())
    ),
    [locations, search],
  )

  function openAdd() {
    setEditing(null); setCode(''); setName(''); setBusinessUnitId(''); setAddress(''); setIsActive(true); setOpen(true)
  }

  function openEdit(row: OperatingLocation) {
    setEditing(row); setCode(row.code); setName(row.name); setBusinessUnitId(row.businessUnitId ?? '')
    setAddress(row.address ?? ''); setIsActive(row.isActive); setOpen(true)
  }

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    try {
      const payload = { name, businessUnitId: businessUnitId || null, address: address || null, isActive }
      if (editing) {
        await apiFetch(`/api/v1/settings/operating-locations/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        await apiFetch('/api/v1/settings/operating-locations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, ...payload }),
        })
      }
      setOpen(false)
      await loadData()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <TabToolbar
        searchValue={search}
        onSearch={setSearch}
        searchPlaceholder={t('searchLocations')}
        onAdd={openAdd}
        addLabel={t('addLocation')}
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">{t('code')}</TableHead>
                <TableHead>{t('name')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('businessUnit')}</TableHead>
                <TableHead className="hidden lg:table-cell">{t('address')}</TableHead>
                <TableHead className="w-24">{t('isActive')}</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <LoadingRow colSpan={6} />
              ) : filtered.length === 0 ? (
                <EmptyRow colSpan={6} message={t('noLocations')} />
              ) : (
                filtered.map(row => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{row.code}</TableCell>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {row.businessUnit ? (
                        <Badge variant="outline" className="text-xs">{row.businessUnit.shortName ?? row.businessUnit.name}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{row.address}</TableCell>
                    <TableCell><ActiveBadge isActive={row.isActive} /></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(row)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? t('editLocation') : t('addLocation')}</DialogTitle>
            <DialogDescription>{t('description')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t('code')}</Label>
              <Input value={code} onChange={e => setCode(e.target.value)} placeholder={t('codePlaceholder')} disabled={!!editing} className="font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label>{t('name')}</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder={t('namePlaceholder')} />
            </div>
            <div className="space-y-1.5">
              <Label>{t('businessUnit')} <span className="text-muted-foreground text-xs ml-1">(optional)</span></Label>
              <Select value={businessUnitId} onValueChange={setBusinessUnitId}>
                <SelectTrigger><SelectValue placeholder={t('selectBusinessUnit')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— None —</SelectItem>
                  {businessUnits.filter(b => b.isActive).map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.shortName ? `${b.shortName} — ${b.name}` : b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t('address')}</Label>
              <Textarea value={address} onChange={e => setAddress(e.target.value)} placeholder={t('addressPlaceholder')} rows={2} />
            </div>
            {editing && (
              <div className="flex items-center justify-between">
                <Label>{t('isActive')}</Label>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{tc('buttons.cancel')}</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('saveChanges')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Fund Classes Tab ─────────────────────────────────────────────────────────

const FUND_RESTRICTIONS = [
  { value: 'UNRESTRICTED', label: 'Unrestricted' },
  { value: 'RESTRICTED', label: 'Restricted' },
  { value: 'TEMPORARILY_RESTRICTED', label: 'Temporarily Restricted' },
  { value: 'ENDOWMENT', label: 'Endowment' },
]

function FundClassesTab() {
  const t = useTranslations('settings.operatingStructure')
  const tc = useTranslations('common')
  const [fundClasses, setFundClasses] = useState<FundClass[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<FundClass | null>(null)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [restriction, setRestriction] = useState('UNRESTRICTED')
  const [isActive, setIsActive] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch<FundClass[]>('/api/v1/settings/fund-classes')
      setFundClasses(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const filtered = useMemo(
    () => fundClasses.filter(r =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.code.toLowerCase().includes(search.toLowerCase())
    ),
    [fundClasses, search],
  )

  function openAdd() {
    setEditing(null); setCode(''); setName(''); setRestriction('UNRESTRICTED'); setIsActive(true); setOpen(true)
  }

  function openEdit(row: FundClass) {
    setEditing(row); setCode(row.code); setName(row.name); setRestriction(row.restriction); setIsActive(row.isActive); setOpen(true)
  }

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    try {
      if (editing) {
        await apiFetch(`/api/v1/settings/fund-classes/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, restriction, isActive }),
        })
      } else {
        await apiFetch('/api/v1/settings/fund-classes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, name, restriction }),
        })
      }
      setOpen(false)
      await loadData()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <TabToolbar
        searchValue={search}
        onSearch={setSearch}
        searchPlaceholder={t('searchFundClasses')}
        onAdd={openAdd}
        addLabel={t('addFundClass')}
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">{t('code')}</TableHead>
                <TableHead>{t('name')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('restriction')}</TableHead>
                <TableHead className="w-24">{t('isActive')}</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <LoadingRow colSpan={5} />
              ) : filtered.length === 0 ? (
                <EmptyRow colSpan={5} message={t('noFundClasses')} />
              ) : (
                filtered.map(row => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{row.code}</TableCell>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className="text-xs">{FUND_RESTRICTIONS.find(r => r.value === row.restriction)?.label ?? row.restriction}</Badge>
                    </TableCell>
                    <TableCell><ActiveBadge isActive={row.isActive} /></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(row)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? t('editFundClass') : t('addFundClass')}</DialogTitle>
            <DialogDescription>{t('description')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t('code')}</Label>
              <Input value={code} onChange={e => setCode(e.target.value)} placeholder={t('codePlaceholder')} disabled={!!editing} className="font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label>{t('name')}</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder={t('namePlaceholder')} />
            </div>
            <div className="space-y-1.5">
              <Label>{t('restriction')}</Label>
              <Select value={restriction} onValueChange={setRestriction}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FUND_RESTRICTIONS.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editing && (
              <div className="flex items-center justify-between">
                <Label>{t('isActive')}</Label>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{tc('buttons.cancel')}</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('saveChanges')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OperatingStructurePage() {
  const t = useTranslations('settings.operatingStructure')

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
      />

      <Tabs defaultValue="sectors">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="sectors">{t('tabs.sectors')}</TabsTrigger>
          <TabsTrigger value="business-units">{t('tabs.businessUnits')}</TabsTrigger>
          <TabsTrigger value="cost-centers">{t('tabs.costCenters')}</TabsTrigger>
          <TabsTrigger value="locations">{t('tabs.locations')}</TabsTrigger>
          <TabsTrigger value="fund-classes">{t('tabs.fundClasses')}</TabsTrigger>
        </TabsList>

        <TabsContent value="sectors" className="mt-4">
          <SectorsTab />
        </TabsContent>
        <TabsContent value="business-units" className="mt-4">
          <BusinessUnitsTab />
        </TabsContent>
        <TabsContent value="cost-centers" className="mt-4">
          <CostCentersTab />
        </TabsContent>
        <TabsContent value="locations" className="mt-4">
          <LocationsTab />
        </TabsContent>
        <TabsContent value="fund-classes" className="mt-4">
          <FundClassesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
