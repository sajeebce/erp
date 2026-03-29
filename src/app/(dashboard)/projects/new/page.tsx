'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchableSelect } from '@/components/shared/searchable-select'
import { PageHeader } from '@/components/shared/page-header'

const PROJECT_STATUSES = ['PIPELINE', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CLOSED', 'CANCELLED'] as const
const PROJECT_TYPES = ['HUMANITARIAN', 'DEVELOPMENT', 'ADVOCACY', 'CAPACITY_BUILDING', 'RESEARCH', 'EMERGENCY_RESPONSE', 'CORE_OPERATIONS', 'MULTI_COUNTRY'] as const
const PROJECT_SECTORS = ['WASH', 'EDUCATION', 'HEALTH', 'LIVELIHOODS', 'FOOD_SECURITY', 'PROTECTION', 'SHELTER', 'NUTRITION', 'AGRICULTURE', 'CLIMATE_ADAPTATION', 'GOVERNANCE', 'GENDER_EQUALITY', 'DISASTER_RISK_REDUCTION', 'MULTI_SECTOR', 'OTHER'] as const
const CURRENCIES = ['USD', 'EUR', 'GBP', 'CHF', 'CAD', 'AUD', 'JPY', 'SEK', 'NOK', 'DKK', 'BDT', 'INR', 'KES', 'NGN', 'ZAR', 'ETB', 'UGX', 'TZS', 'NPR', 'PKR', 'MMK', 'THB', 'PHP', 'IDR'] as const

interface Donor { id: string; name: string }
interface Employee { id: string; fullName: string }

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

export default function NewProjectPage() {
  const router = useRouter()
  const t = useTranslations('projects')
  const tc = useTranslations('common')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [projectType, setProjectType] = useState('DEVELOPMENT')
  const [sector, setSector] = useState('OTHER')
  const [donorId, setDonorId] = useState('')
  const [startDate, setStartDate] = useState(todayISO())
  const [endDate, setEndDate] = useState('')
  const [totalBudget, setTotalBudget] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [country, setCountry] = useState('')
  const [region, setRegion] = useState('')
  const [location, setLocation] = useState('')
  const [implementingPartner, setImplementingPartner] = useState('')
  const [status, setStatus] = useState<string>('PIPELINE')
  const [managerId, setManagerId] = useState('')

  const [donors, setDonors] = useState<Donor[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])

  useEffect(() => {
    fetch('/api/v1/donors?limit=100')
      .then(res => res.json())
      .then(json => { if (json.success) setDonors(json.data) })
      .catch(() => {})
    fetch('/api/v1/hr/employees?limit=100')
      .then(res => res.json())
      .then(json => { if (json.success) setEmployees(json.data) })
      .catch(() => {})
  }, [])

  function validate(): boolean {
    if (!name.trim()) { setError(t('form.nameRequired')); return false }
    if (endDate && startDate && endDate < startDate) { setError(t('form.endDateAfterStart')); return false }
    if (totalBudget && (isNaN(Number(totalBudget)) || Number(totalBudget) < 0)) { setError(t('form.budgetPositive')); return false }
    setError('')
    return true
  }

  async function handleSubmit() {
    if (!validate()) return
    setSaving(true)
    setError('')

    const payload: Record<string, unknown> = {
      name: name.trim(),
      status,
      projectType,
      sector,
      currency,
    }
    if (description.trim()) payload.description = description.trim()
    if (donorId) payload.donorId = donorId
    if (startDate) payload.startDate = startDate
    if (endDate) payload.endDate = endDate
    if (totalBudget) payload.totalBudget = Number(totalBudget)
    if (country.trim()) payload.country = country.trim()
    if (region.trim()) payload.region = region.trim()
    if (location.trim()) payload.location = location.trim()
    if (implementingPartner.trim()) payload.implementingPartner = implementingPartner.trim()
    if (managerId) payload.managerId = managerId

    try {
      const res = await fetch('/api/v1/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        router.push(`/projects/${json.data.id}`)
      } else {
        setError(json.error || t('form.failedToCreate'))
      }
    } catch {
      setError(t('form.failedToCreate'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('form.createTitle')} description={t('form.createDescription')}>
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tc('buttons.back')}
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>{t('form.projectInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Row 1: Name + Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">{t('fields.name')} *</Label>
              <Input id="project-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('form.namePlaceholder')} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-status">{t('fields.status')}</Label>
              <SearchableSelect id="project-status" options={PROJECT_STATUSES.map((s) => ({ value: s, label: tc(`status.${s}`) }))} value={status} onValueChange={setStatus} placeholder={t('form.selectStatus')} />
            </div>
          </div>

          {/* Row 2: Description */}
          <div className="space-y-2">
            <Label htmlFor="project-description">{t('fields.description')}</Label>
            <Textarea id="project-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder={t('form.descriptionPlaceholder')} />
          </div>

          {/* Classification Section */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">{t('form.classification')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t('fields.projectType')}</Label>
                <SearchableSelect options={PROJECT_TYPES.map((pt) => ({ value: pt, label: t(`types.${pt}`) }))} value={projectType} onValueChange={setProjectType} placeholder={t('form.selectType')} />
              </div>
              <div className="space-y-2">
                <Label>{t('fields.sector')}</Label>
                <SearchableSelect options={PROJECT_SECTORS.map((s) => ({ value: s, label: t(`sectors.${s}`) }))} value={sector} onValueChange={setSector} placeholder={t('form.selectSector')} />
              </div>
              <div className="space-y-2">
                <Label>{t('fields.donor')}</Label>
                <SearchableSelect options={donors.map((d) => ({ value: d.id, label: d.name }))} value={donorId} onValueChange={setDonorId} placeholder={t('form.selectDonor')} />
              </div>
            </div>
          </div>

          {/* Dates + Budget */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project-start-date">{t('fields.startDate')}</Label>
              <Input id="project-start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-end-date">{t('fields.endDate')}</Label>
              <Input id="project-end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-budget">{t('fields.totalBudget')}</Label>
              <Input id="project-budget" type="number" min="0" step="0.01" value={totalBudget} onChange={(e) => setTotalBudget(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>{t('fields.currency')}</Label>
              <SearchableSelect options={CURRENCIES.map((c) => ({ value: c, label: c }))} value={currency} onValueChange={setCurrency} placeholder={t('form.selectCurrency')} />
            </div>
          </div>

          {/* Geographic Scope */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">{t('form.geography')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project-country">{t('fields.country')}</Label>
                <Input id="project-country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder={t('form.countryPlaceholder')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-region">{t('fields.region')}</Label>
                <Input id="project-region" value={region} onChange={(e) => setRegion(e.target.value)} placeholder={t('form.regionPlaceholder')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-location">{t('fields.location')}</Label>
                <Input id="project-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t('form.locationPlaceholder')} />
              </div>
            </div>
          </div>

          {/* Partner + Manager */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project-partner">{t('fields.implementingPartner')}</Label>
              <Input id="project-partner" value={implementingPartner} onChange={(e) => setImplementingPartner(e.target.value)} placeholder={t('form.partnerPlaceholder')} />
            </div>
            <div className="space-y-2">
              <Label>{t('fields.manager')}</Label>
              <SearchableSelect options={employees.map((e) => ({ value: e.id, label: e.fullName }))} value={managerId} onValueChange={setManagerId} placeholder={t('form.selectManager')} />
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.back()} disabled={saving}>
            {tc('buttons.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('form.saving')}
              </>
            ) : (
              t('form.createProject')
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
