'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Pencil, Save, X, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LocalizedNameInput } from '@/components/shared/localized-name-input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchableSelect } from '@/components/shared/searchable-select'
import { Checkbox } from '@/components/ui/checkbox'
import { PageHeader } from '@/components/shared/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { allLocales, type LocaleCode } from '@/i18n/config'

// ─── Types ───

interface Organization {
  id: string
  name: string
  localizedName: Record<string, string> | null
  slug: string
  registrationNo: string | null
  ngoabLicenseNo: string | null
  mraLicenseNo: string | null
  vatRegistrationNo: string | null
  tin: string | null
  address: string | null
  district: string | null
  phone: string | null
  email: string | null
  website: string | null
  logo: string | null
  baseCurrency: string
  fiscalYearStartMonth: number
  dateFormat: string
  numberFormat: string
  timezone: string
  defaultLanguage: string
  supportedLanguages: string[]
  customDomain: string | null
  domainVerified: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

type SectionId = 'profile' | 'compliance' | 'contact' | 'regional'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const CURRENCIES = ['BDT', 'USD', 'EUR', 'GBP']
const DATE_FORMATS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']
const TIMEZONES = ['Asia/Dhaka', 'UTC', 'America/New_York', 'Europe/London', 'Asia/Kolkata']

// ─── Reusable Components ───

function FieldRow({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b last:border-0 gap-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium sm:text-right sm:max-w-[60%]">{value || '—'}</span>
    </div>
  )
}

function EditRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function SectionHeader({
  title,
  editing,
  saving,
  onEdit,
  onSave,
  onCancel,
  savedLabel,
  saveLabel,
  cancelLabel,
}: {
  title: string
  editing: boolean
  saving: boolean
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  savedLabel?: string | null
  saveLabel: string
  cancelLabel: string
}) {
  return (
    <CardHeader className="flex flex-row items-center justify-between space-y-0">
      <div className="flex items-center gap-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        {savedLabel && (
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs">
            <Check className="h-3 w-3 mr-1" />{savedLabel}
          </Badge>
        )}
      </div>
      {editing ? (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={onCancel} disabled={saving}>
            <X className="h-4 w-4 mr-1" />{cancelLabel}
          </Button>
          <Button size="sm" onClick={onSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            {saveLabel}
          </Button>
        </div>
      ) : (
        <Button size="sm" variant="ghost" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
        </Button>
      )}
    </CardHeader>
  )
}

// ─── Main Page ───

export default function OrganizationSettingsPage() {
  const t = useTranslations('settings.organization')
  const tc = useTranslations('common')

  const [org, setOrg] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)

  // Section-level edit state
  const [editingSection, setEditingSection] = useState<SectionId | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedSection, setSavedSection] = useState<SectionId | null>(null)
  const [error, setError] = useState('')

  // Form state (only for the section being edited)
  const [formFields, setFormFields] = useState<Record<string, unknown>>({})
  const [localizedNameValues, setLocalizedNameValues] = useState<Record<string, string>>({})

  const fetchOrg = useCallback(() => {
    setLoading(true)
    fetch('/api/v1/settings/organization')
      .then(res => res.json())
      .then(json => { if (json.success) setOrg(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchOrg() }, [fetchOrg])

  function startEditing(section: SectionId) {
    if (!org) return
    setEditingSection(section)
    setError('')
    setSavedSection(null)

    switch (section) {
      case 'profile':
        setLocalizedNameValues(org.localizedName || { en: org.name })
        setFormFields({})
        break
      case 'compliance':
        setFormFields({
          registrationNo: org.registrationNo || '',
          ngoabLicenseNo: org.ngoabLicenseNo || '',
          mraLicenseNo: org.mraLicenseNo || '',
          vatRegistrationNo: org.vatRegistrationNo || '',
          tin: org.tin || '',
        })
        break
      case 'contact':
        setFormFields({
          address: org.address || '',
          district: org.district || '',
          phone: org.phone || '',
          email: org.email || '',
          website: org.website || '',
        })
        break
      case 'regional':
        setFormFields({
          baseCurrency: org.baseCurrency,
          fiscalYearStartMonth: org.fiscalYearStartMonth,
          dateFormat: org.dateFormat,
          numberFormat: org.numberFormat,
          timezone: org.timezone,
          defaultLanguage: org.defaultLanguage,
          supportedLanguages: [...org.supportedLanguages],
        })
        break
    }
  }

  function cancelEditing() {
    setEditingSection(null)
    setFormFields({})
    setError('')
  }

  async function handleSave() {
    if (!org) return
    setSaving(true)
    setError('')

    let payload: Record<string, unknown> = {}

    if (editingSection === 'profile') {
      const primaryLocale = org.supportedLanguages[0] || 'en'
      payload = {
        name: localizedNameValues[primaryLocale] || org.name,
        localizedName: localizedNameValues,
      }
    } else {
      payload = { ...formFields }
    }

    try {
      const res = await fetch('/api/v1/settings/organization', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!data.success) {
        setError(data.error?.message || t('saveFailed'))
        return
      }

      setOrg(data.data)
      const saved = editingSection
      setEditingSection(null)
      setSavedSection(saved)
      setTimeout(() => setSavedSection(null), 3000)
    } catch {
      setError(t('saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  function setField(key: string, value: unknown) {
    setFormFields(prev => ({ ...prev, [key]: value }))
  }

  const monthLabel = (m: number) => MONTHS[m - 1] || String(m)
  const langLabel = (code: string) => allLocales[code as LocaleCode]?.nativeName || code.toUpperCase()

  // ─── Loading ───
  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('title')} description={t('description')} />
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3].map(j => (
                <div key={j} className="flex justify-between"><Skeleton className="h-4 w-32" /><Skeleton className="h-4 w-48" /></div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!org) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('title')} description={t('description')} />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{t('noDataFound')}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isEditing = (s: SectionId) => editingSection === s
  const isSaved = (s: SectionId) => savedSection === s

  // ─── Render ───
  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')} />

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* ─── Section 1: Organization Profile ─── */}
      <Card>
        <SectionHeader
          title={t('profileSection')}
          editing={isEditing('profile')}
          saving={saving}
          onEdit={() => startEditing('profile')}
          onSave={handleSave}
          onCancel={cancelEditing}
          savedLabel={isSaved('profile') ? t('saved') : null}
          saveLabel={tc('buttons.save')}
          cancelLabel={tc('buttons.cancel')}
        />
        <CardContent>
          {isEditing('profile') ? (
            <LocalizedNameInput
              label={t('orgName')}
              locales={org.supportedLanguages}
              values={localizedNameValues}
              onChange={(locale, value) => {
                setLocalizedNameValues(prev => ({ ...prev, [locale]: value }))
              }}
              required
            />
          ) : (
            <div>
              <FieldRow label={t('orgName')} value={org.name} />
              {org.supportedLanguages
                .filter(locale => locale !== org.supportedLanguages[0])
                .map(locale => {
                  const value = (org.localizedName as Record<string, string>)?.[locale]
                  return (
                    <FieldRow
                      key={locale}
                      label={<span>{tc('labels.name')} <Badge variant="outline" className="text-[10px] px-1 py-0 font-mono ml-1">{locale.toUpperCase()}</Badge></span>}
                      value={value || '—'}
                    />
                  )
                })}
              <FieldRow label={t('slug')} value={<code className="text-xs bg-muted px-1.5 py-0.5 rounded">{org.slug}</code>} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Section 2: Registration & Compliance ─── */}
      <Card>
        <SectionHeader
          title={t('complianceSection')}
          editing={isEditing('compliance')}
          saving={saving}
          onEdit={() => startEditing('compliance')}
          onSave={handleSave}
          onCancel={cancelEditing}
          savedLabel={isSaved('compliance') ? t('saved') : null}
          saveLabel={tc('buttons.save')}
          cancelLabel={tc('buttons.cancel')}
        />
        <CardContent>
          {isEditing('compliance') ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EditRow label={t('registrationNo')}>
                <Input value={formFields.registrationNo as string} onChange={e => setField('registrationNo', e.target.value)} />
              </EditRow>
              <EditRow label={t('ngoabLicenseNo')}>
                <Input value={formFields.ngoabLicenseNo as string} onChange={e => setField('ngoabLicenseNo', e.target.value)} />
              </EditRow>
              <EditRow label={t('mraLicenseNo')}>
                <Input value={formFields.mraLicenseNo as string} onChange={e => setField('mraLicenseNo', e.target.value)} />
              </EditRow>
              <EditRow label={t('vatNo')}>
                <Input value={formFields.vatRegistrationNo as string} onChange={e => setField('vatRegistrationNo', e.target.value)} />
              </EditRow>
              <EditRow label={t('tin')}>
                <Input value={formFields.tin as string} onChange={e => setField('tin', e.target.value)} />
              </EditRow>
            </div>
          ) : (
            <div>
              <FieldRow label={t('registrationNo')} value={org.registrationNo} />
              <FieldRow label={t('ngoabLicenseNo')} value={org.ngoabLicenseNo} />
              <FieldRow label={t('mraLicenseNo')} value={org.mraLicenseNo} />
              <FieldRow label={t('vatNo')} value={org.vatRegistrationNo} />
              <FieldRow label={t('tin')} value={org.tin} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Section 3: Contact Information ─── */}
      <Card>
        <SectionHeader
          title={t('contactSection')}
          editing={isEditing('contact')}
          saving={saving}
          onEdit={() => startEditing('contact')}
          onSave={handleSave}
          onCancel={cancelEditing}
          savedLabel={isSaved('contact') ? t('saved') : null}
          saveLabel={tc('buttons.save')}
          cancelLabel={tc('buttons.cancel')}
        />
        <CardContent>
          {isEditing('contact') ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EditRow label={t('address')}>
                <Input value={formFields.address as string} onChange={e => setField('address', e.target.value)} />
              </EditRow>
              <EditRow label={t('district')}>
                <Input value={formFields.district as string} onChange={e => setField('district', e.target.value)} />
              </EditRow>
              <EditRow label={t('phone')}>
                <Input value={formFields.phone as string} onChange={e => setField('phone', e.target.value)} type="tel" />
              </EditRow>
              <EditRow label={t('email')}>
                <Input value={formFields.email as string} onChange={e => setField('email', e.target.value)} type="email" />
              </EditRow>
              <EditRow label={t('website')}>
                <Input value={formFields.website as string} onChange={e => setField('website', e.target.value)} type="url" placeholder="https://" />
              </EditRow>
            </div>
          ) : (
            <div>
              <FieldRow label={t('address')} value={org.address} />
              <FieldRow label={t('district')} value={org.district} />
              <FieldRow label={t('phone')} value={org.phone} />
              <FieldRow label={t('email')} value={org.email} />
              <FieldRow label={t('website')} value={org.website ? <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{org.website}</a> : null} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Section 4: Regional Settings ─── */}
      <Card>
        <SectionHeader
          title={t('regionalSection')}
          editing={isEditing('regional')}
          saving={saving}
          onEdit={() => startEditing('regional')}
          onSave={handleSave}
          onCancel={cancelEditing}
          savedLabel={isSaved('regional') ? t('saved') : null}
          saveLabel={tc('buttons.save')}
          cancelLabel={tc('buttons.cancel')}
        />
        <CardContent>
          {isEditing('regional') ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EditRow label={t('baseCurrency')}>
                <SearchableSelect
                  id="regional-base-currency"
                  options={CURRENCIES.map(c => ({ value: c, label: c }))}
                  value={formFields.baseCurrency as string}
                  onValueChange={v => setField('baseCurrency', v)}
                />
              </EditRow>
              <EditRow label={t('fiscalYearStartMonth')}>
                <SearchableSelect
                  id="regional-fiscal-year-start"
                  options={MONTHS.map((m, i) => ({ value: String(i + 1), label: m }))}
                  value={String(formFields.fiscalYearStartMonth)}
                  onValueChange={v => setField('fiscalYearStartMonth', Number(v))}
                />
              </EditRow>
              <EditRow label={t('dateFormat')}>
                <SearchableSelect
                  id="regional-date-format"
                  options={DATE_FORMATS.map(f => ({ value: f, label: f }))}
                  value={formFields.dateFormat as string}
                  onValueChange={v => setField('dateFormat', v)}
                />
              </EditRow>
              <EditRow label={t('numberFormat')}>
                <SearchableSelect
                  id="regional-number-format"
                  options={[
                    { value: 'BD', label: 'BD (1,00,000)' },
                    { value: 'US', label: 'US (100,000)' },
                    { value: 'EU', label: 'EU (100.000)' },
                  ]}
                  value={formFields.numberFormat as string}
                  onValueChange={v => setField('numberFormat', v)}
                />
              </EditRow>
              <EditRow label={t('timezone')}>
                <SearchableSelect
                  id="regional-timezone"
                  options={TIMEZONES.map(tz => ({ value: tz, label: tz }))}
                  value={formFields.timezone as string}
                  onValueChange={v => setField('timezone', v)}
                />
              </EditRow>
              <EditRow label={t('defaultLanguage')}>
                <SearchableSelect
                  id="regional-default-language"
                  options={((formFields.supportedLanguages as string[]) || org.supportedLanguages).map(code => ({ value: code, label: langLabel(code) }))}
                  value={formFields.defaultLanguage as string}
                  onValueChange={v => setField('defaultLanguage', v)}
                />
              </EditRow>
              <div className="md:col-span-2">
                <EditRow label={t('supportedLanguages')}>
                  <div className="flex flex-wrap gap-3 pt-1">
                    {Object.entries(allLocales).map(([code, meta]) => {
                      const checked = ((formFields.supportedLanguages as string[]) || []).includes(code)
                      return (
                        <label key={code} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                          <Checkbox
                            checked={checked}
                            disabled={code === 'en'}
                            onCheckedChange={(val: boolean) => {
                              const current = (formFields.supportedLanguages as string[]) || []
                              const updated = val ? [...current, code] : current.filter(l => l !== code)
                              if (updated.length > 0) setField('supportedLanguages', updated)
                            }}
                          />
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">{code.toUpperCase()}</Badge>
                          <span>{meta.nativeName}</span>
                        </label>
                      )
                    })}
                  </div>
                </EditRow>
              </div>
            </div>
          ) : (
            <div>
              <FieldRow label={t('baseCurrency')} value={org.baseCurrency} />
              <FieldRow label={t('fiscalYearStartMonth')} value={monthLabel(org.fiscalYearStartMonth)} />
              <FieldRow label={t('dateFormat')} value={org.dateFormat} />
              <FieldRow label={t('numberFormat')} value={org.numberFormat} />
              <FieldRow label={t('timezone')} value={org.timezone} />
              <FieldRow label={t('defaultLanguage')} value={langLabel(org.defaultLanguage)} />
              <FieldRow label={t('supportedLanguages')} value={
                <div className="flex gap-1.5 flex-wrap">
                  {org.supportedLanguages.map(l => (
                    <Badge key={l} variant="outline" className="font-mono text-xs">{l.toUpperCase()}</Badge>
                  ))}
                </div>
              } />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Section 5: Custom Domain (read-only) ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('domainSection')}</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldRow label={t('customDomain')} value={org.customDomain} />
          <FieldRow label={t('domainVerified')} value={
            org.domainVerified
              ? <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">{tc('status.CONFIRMED')}</Badge>
              : <Badge variant="secondary" className="bg-amber-100 text-amber-700">{tc('status.PENDING')}</Badge>
          } />
        </CardContent>
      </Card>
    </div>
  )
}
