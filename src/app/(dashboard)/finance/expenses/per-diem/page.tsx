'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, Plus, Pencil, Calculator } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { SearchableSelect } from '@/components/shared/searchable-select'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

// ─── Types ───

interface PerDiemRate {
  id: string
  location: string
  type: string
  fullDayRate: number
  halfDayRate: number
  overnightRate: number
  mealsOnlyRate: number
  effectiveFrom: string
  effectiveTo: string | null
  donorId: string | null
  donorName: string | null
  isActive: boolean
  notes: string | null
}

interface CalculationResult {
  totalDays: number
  fullDays: number
  halfDays: number
  ratePerDay: number
  totalAmount: number
  breakdown: string
}

interface LocationOption {
  value: string
  label: string
}

interface DonorOption {
  value: string
  label: string
}

// ─── Main Page ───

export default function PerDiemRatesPage() {
  const t = useTranslations('finance.expenses.perDiem')
  const tc = useTranslations('common')
  const { formatCurrency, formatDate } = useFormatters()

  const [rates, setRates] = useState<PerDiemRate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  // Lookups
  const [locations, setLocations] = useState<LocationOption[]>([])
  const [donors, setDonors] = useState<DonorOption[]>([])

  // Form state
  const [fLocation, setFLocation] = useState('')
  const [fType, setFType] = useState('')
  const [fFullDay, setFFullDay] = useState('')
  const [fHalfDay, setFHalfDay] = useState('')
  const [fOvernight, setFOvernight] = useState('')
  const [fMealsOnly, setFMealsOnly] = useState('')
  const [fEffFrom, setFEffFrom] = useState('')
  const [fEffTo, setFEffTo] = useState('')
  const [fDonorId, setFDonorId] = useState('')
  const [fNotes, setFNotes] = useState('')
  const [fIsActive, setFIsActive] = useState(true)

  // Calculator state
  const [calcStartDate, setCalcStartDate] = useState('')
  const [calcEndDate, setCalcEndDate] = useState('')
  const [calcLocation, setCalcLocation] = useState('')
  const [calcDonorId, setCalcDonorId] = useState('')
  const [calcLoading, setCalcLoading] = useState(false)
  const [calcResult, setCalcResult] = useState<CalculationResult | null>(null)
  const [calcError, setCalcError] = useState('')

  const RATE_TYPES = [
    { value: 'DOMESTIC', label: t('typeDomestic') },
    { value: 'INTERNATIONAL', label: t('typeInternational') },
    { value: 'FIELD', label: t('typeField') },
  ]

  // ─── Fetch ───

  const fetchRates = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/v1/finance/per-diem-rates')
      if (!res.ok) throw new Error()
      const data = await res.json()
      const items = data.data ?? data ?? []
      setRates(items)

      // Build unique location options from existing rates
      const uniqueLocations = [...new Set(items.map((r: PerDiemRate) => r.location))].filter(Boolean)
      setLocations(uniqueLocations.map((loc) => ({ value: loc as string, label: loc as string })))
    } catch {
      setError(t('failedToLoad'))
    } finally {
      setLoading(false)
    }
  }, [t])

  const fetchDonors = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/grants/donors?limit=200')
      if (res.ok) {
        const d = await res.json()
        setDonors((d.data ?? d ?? []).map((dn: Record<string, string>) => ({
          value: dn.id, label: dn.name ?? dn.organizationName ?? dn.id,
        })))
      }
    } catch {
      // Non-critical
    }
  }, [])

  useEffect(() => { fetchRates(); fetchDonors() }, [fetchRates, fetchDonors])

  // ─── Form helpers ───

  const resetForm = () => {
    setFLocation(''); setFType(''); setFFullDay(''); setFHalfDay('');
    setFOvernight(''); setFMealsOnly(''); setFEffFrom(''); setFEffTo('');
    setFDonorId(''); setFNotes(''); setFIsActive(true); setEditId(null)
  }

  const openCreate = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEdit = (rate: PerDiemRate) => {
    setEditId(rate.id)
    setFLocation(rate.location)
    setFType(rate.type)
    setFFullDay(String(rate.fullDayRate))
    setFHalfDay(String(rate.halfDayRate))
    setFOvernight(String(rate.overnightRate))
    setFMealsOnly(String(rate.mealsOnlyRate))
    setFEffFrom(rate.effectiveFrom?.slice(0, 10) ?? '')
    setFEffTo(rate.effectiveTo?.slice(0, 10) ?? '')
    setFDonorId(rate.donorId ?? '')
    setFNotes(rate.notes ?? '')
    setFIsActive(rate.isActive)
    setDialogOpen(true)
  }

  // ─── Save ───

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const body = {
        location: fLocation,
        type: fType,
        fullDayRate: parseFloat(fFullDay) || 0,
        halfDayRate: parseFloat(fHalfDay) || 0,
        overnightRate: parseFloat(fOvernight) || 0,
        mealsOnlyRate: parseFloat(fMealsOnly) || 0,
        effectiveFrom: fEffFrom,
        effectiveTo: fEffTo || null,
        donorId: fDonorId || null,
        notes: fNotes || null,
        isActive: fIsActive,
      }

      const url = editId
        ? `/api/v1/finance/per-diem-rates/${editId}`
        : '/api/v1/finance/per-diem-rates'

      const res = await fetch(url, {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      setDialogOpen(false)
      resetForm()
      fetchRates()
    } catch {
      setError(editId ? t('failedToUpdate') : t('failedToCreate'))
    } finally {
      setSaving(false)
    }
  }

  // ─── Calculator ───

  const handleCalculate = async () => {
    setCalcLoading(true)
    setCalcError('')
    setCalcResult(null)
    try {
      const res = await fetch('/api/v1/finance/per-diem-rates/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: calcStartDate,
          endDate: calcEndDate,
          location: calcLocation,
          donorId: calcDonorId || null,
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      const raw = data.data ?? data
      // API returns { rate, calculation } — flatten to CalculationResult
      const calc = raw.calculation ?? raw
      setCalcResult({
        totalDays: calc.totalDays,
        fullDays: calc.fullDays,
        halfDays: calc.halfDays,
        ratePerDay: calc.ratePerDay,
        totalAmount: calc.totalAmount,
        breakdown: `${calc.fullDays} full day(s) × ${raw.rate?.fullDayRate ?? calc.ratePerDay} + ${calc.halfDays} half day(s) × ${calc.halfDayRateUsed ?? calc.ratePerDay / 2}`,
      })
    } catch {
      setCalcError(t('calculationFailed'))
    } finally {
      setCalcLoading(false)
    }
  }

  // ─── Render ───

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')}>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t('addRate')}
        </Button>
      </PageHeader>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Per Diem Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            {t('calculator')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="grid gap-2">
              <Label htmlFor="calc-start">{t('startDate')}</Label>
              <Input id="calc-start" type="date" value={calcStartDate} onChange={(e) => setCalcStartDate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="calc-end">{t('endDate')}</Label>
              <Input id="calc-end" type="date" value={calcEndDate} onChange={(e) => setCalcEndDate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>{t('locationLabel')}</Label>
              <SearchableSelect
                options={locations}
                value={calcLocation}
                onValueChange={setCalcLocation}
                placeholder={t('selectLocation')}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t('donor')}</Label>
              <SearchableSelect
                options={donors}
                value={calcDonorId}
                onValueChange={setCalcDonorId}
                placeholder={t('selectDonorOptional')}
              />
            </div>
          </div>
          <Button
            onClick={handleCalculate}
            disabled={calcLoading || !calcStartDate || !calcEndDate || !calcLocation}
          >
            {calcLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Calculator className="mr-2 h-4 w-4" />
            {t('calculate')}
          </Button>

          {calcError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {calcError}
            </div>
          )}

          {calcResult && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <h4 className="mb-3 font-semibold">{t('calculationResult')}</h4>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <p className="text-sm text-muted-foreground">{t('totalDays')}</p>
                  <p className="text-xl font-bold">{calcResult.totalDays}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('fullDays')}</p>
                  <p className="text-xl font-bold">{calcResult.fullDays}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('halfDays')}</p>
                  <p className="text-xl font-bold">{calcResult.halfDays}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('ratePerDay')}</p>
                  <p className="text-xl font-bold">{formatCurrency(calcResult.ratePerDay)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('totalAmount')}</p>
                  <p className="text-2xl font-bold text-emerald-600">{formatCurrency(calcResult.totalAmount)}</p>
                </div>
              </div>
              {calcResult.breakdown && (
                <p className="mt-3 text-sm text-muted-foreground">{calcResult.breakdown}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rates Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('ratesTable')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {rates.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">{t('noRates')}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('locationLabel')}</TableHead>
                    <TableHead>{t('type')}</TableHead>
                    <TableHead className="text-right">{t('fullDayRate')}</TableHead>
                    <TableHead className="text-right">{t('halfDayRate')}</TableHead>
                    <TableHead className="text-right">{t('overnightRate')}</TableHead>
                    <TableHead className="text-right">{t('mealsOnlyRate')}</TableHead>
                    <TableHead>{t('effectiveFrom')}</TableHead>
                    <TableHead>{t('effectiveTo')}</TableHead>
                    <TableHead>{t('donor')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                    <TableHead className="text-right">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rates.map((rate) => (
                    <TableRow key={rate.id} className={!rate.isActive ? 'opacity-50' : ''}>
                      <TableCell className="font-medium">{rate.location}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{rate.type}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(rate.fullDayRate)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(rate.halfDayRate)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(rate.overnightRate)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(rate.mealsOnlyRate)}</TableCell>
                      <TableCell className="text-sm">{formatDate(rate.effectiveFrom)}</TableCell>
                      <TableCell className="text-sm">
                        {rate.effectiveTo ? formatDate(rate.effectiveTo) : '—'}
                      </TableCell>
                      <TableCell className="text-sm">{rate.donorName ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant={rate.isActive ? 'default' : 'secondary'}>
                          {rate.isActive ? t('active') : t('inactive')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(rate)} aria-label={t('edit')}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Add / Edit Dialog ─── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? t('editRate') : t('addRate')}</DialogTitle>
            <DialogDescription>
              {editId ? t('editRateDescription') : t('addRateDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="f-location">{t('locationLabel')}</Label>
                <Input id="f-location" value={fLocation} onChange={(e) => setFLocation(e.target.value)} placeholder={t('locationPlaceholder')} />
              </div>
              <div className="grid gap-2">
                <Label>{t('type')}</Label>
                <SearchableSelect
                  options={RATE_TYPES}
                  value={fType}
                  onValueChange={setFType}
                  placeholder={t('selectType')}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="f-fullday">{t('fullDayRate')}</Label>
                <Input id="f-fullday" type="number" value={fFullDay} onChange={(e) => setFFullDay(e.target.value)} placeholder="0.00" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="f-halfday">{t('halfDayRate')}</Label>
                <Input id="f-halfday" type="number" value={fHalfDay} onChange={(e) => setFHalfDay(e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="f-overnight">{t('overnightRate')}</Label>
                <Input id="f-overnight" type="number" value={fOvernight} onChange={(e) => setFOvernight(e.target.value)} placeholder="0.00" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="f-meals">{t('mealsOnlyRate')}</Label>
                <Input id="f-meals" type="number" value={fMealsOnly} onChange={(e) => setFMealsOnly(e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="f-eff-from">{t('effectiveFrom')}</Label>
                <Input id="f-eff-from" type="date" value={fEffFrom} onChange={(e) => setFEffFrom(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="f-eff-to">{t('effectiveTo')}</Label>
                <Input id="f-eff-to" type="date" value={fEffTo} onChange={(e) => setFEffTo(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>{t('donor')}</Label>
              <SearchableSelect
                options={donors}
                value={fDonorId}
                onValueChange={setFDonorId}
                placeholder={t('selectDonorOptional')}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="f-notes">{t('notes')}</Label>
              <Textarea id="f-notes" value={fNotes} onChange={(e) => setFNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{tc('cancel')}</Button>
            <Button onClick={handleSave} disabled={saving || !fLocation || !fType || !fFullDay || !fEffFrom}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editId ? t('updateRate') : t('addRate')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
