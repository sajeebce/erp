'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { useFormatters } from '@/hooks/use-formatters'
import { FileUpload } from '@/components/shared/file-upload'

const DONOR_TYPES = [
  'BILATERAL',
  'MULTILATERAL',
  'FOUNDATION',
  'CORPORATE',
  'INDIVIDUAL',
  'GOVERNMENT',
  'INGO',
] as const

interface DonorGrant {
  id: string
  grantNo: string
  title: string
  awardAmount: number | string
  disbursedAmount: number | string
  currencyCode: string
  status: string
  startDate: string | null
  endDate: string | null
}

interface DonorContact {
  id: string
  name: string
  designation: string | null
  email: string | null
  phone: string | null
  isPrimary: boolean
}

interface DonorData {
  id: string
  name: string
  type: string
  country: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  description: string | null
  relationshipStatus: string
  totalFunded: number | string
  isActive: boolean
  notes: string | null
  contacts: DonorContact[]
  grants: DonorGrant[]
  createdAt: string
  updatedAt: string
}

export default function DonorDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const t = useTranslations('donors')
  const tc = useTranslations('common')
  const { formatCurrency, formatDate } = useFormatters()

  const [donor, setDonor] = useState<DonorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // Edit form state
  const [formName, setFormName] = useState('')
  const [formType, setFormType] = useState('')
  const [formCountry, setFormCountry] = useState('')
  const [formAddress, setFormAddress] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formWebsite, setFormWebsite] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [formRelationshipStatus, setFormRelationshipStatus] = useState('')

  const fetchDonor = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/donors/${id}`)
      const json = await res.json()
      if (res.ok && json.success) {
        setDonor(json.data)
      } else {
        setError(json.error || t('form.failedToLoad'))
      }
    } catch {
      setError(t('form.failedToLoad'))
    } finally {
      setLoading(false)
    }
  }, [id, t])

  useEffect(() => {
    fetchDonor()
  }, [fetchDonor])

  function startEditing() {
    if (!donor) return
    setFormName(donor.name)
    setFormType(donor.type)
    setFormCountry(donor.country || '')
    setFormAddress(donor.address || '')
    setFormPhone(donor.phone || '')
    setFormEmail(donor.email || '')
    setFormWebsite(donor.website || '')
    setFormDescription(donor.description || '')
    setFormNotes(donor.notes || '')
    setFormRelationshipStatus(donor.relationshipStatus || '')
    setEditing(true)
    setError('')
  }

  function cancelEditing() {
    setEditing(false)
    setError('')
  }

  function validate(): boolean {
    if (!formName.trim() || !formType) {
      setError(t('form.requiredFields'))
      return false
    }
    if (formEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail)) {
      setError(t('form.invalidEmail'))
      return false
    }
    setError('')
    return true
  }

  async function handleUpdate() {
    if (!validate()) return

    setSaving(true)
    setError('')

    const payload: Record<string, unknown> = {
      name: formName.trim(),
      type: formType,
      country: formCountry.trim() || null,
      address: formAddress.trim() || null,
      phone: formPhone.trim() || null,
      email: formEmail.trim() || null,
      website: formWebsite.trim() || null,
      description: formDescription.trim() || null,
      notes: formNotes.trim() || null,
      relationshipStatus: formRelationshipStatus || undefined,
    }

    try {
      const res = await fetch(`/api/v1/donors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setEditing(false)
        await fetchDonor()
      } else {
        setError(json.error || t('form.failedToUpdate'))
      }
    } catch {
      setError(t('form.failedToUpdate'))
    } finally {
      setSaving(false)
    }
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <Card>
          <CardContent className="space-y-4 pt-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state (no data)
  if (error && !donor) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('form.donorDetail')}>
          <Button variant="outline" size="sm" onClick={() => router.push('/donors')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tc('buttons.back')}
          </Button>
        </PageHeader>
        <Card>
          <CardContent className="pt-6">
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!donor) return null

  // VIEW MODE
  if (!editing) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={donor.name}
          description={t('form.donorDetail')}
        >
          <Button variant="outline" size="sm" onClick={() => router.push('/donors')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tc('buttons.back')}
          </Button>
        </PageHeader>

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                {donor.name}
                <StatusBadge status={donor.type} />
                <StatusBadge status={donor.relationshipStatus} />
              </CardTitle>
              <Button size="sm" onClick={startEditing}>
                <Pencil className="h-4 w-4 mr-2" />
                {tc('buttons.edit')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <DetailItem label={t('fields.type')} value={t(`donorTypes.${donor.type}`)} />
              <DetailItem label={t('fields.country')} value={donor.country} />
              <DetailItem label={t('fields.totalFunded')} value={formatCurrency(Number(donor.totalFunded))} />
              <DetailItem label={t('fields.email')} value={donor.email} />
              <DetailItem label={t('fields.phone')} value={donor.phone} />
              <DetailItem label={t('fields.website')} value={donor.website} />
              <DetailItem label={t('form.createdAt')} value={formatDate(donor.createdAt)} />
              <DetailItem label={t('form.updatedAt')} value={formatDate(donor.updatedAt)} />
              <DetailItem label={t('form.active')} value={donor.isActive ? tc('status.ACTIVE') : tc('status.INACTIVE')} />
            </div>

            {donor.address && (
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">{t('form.address')}</span>
                <p className="text-sm">{donor.address}</p>
              </div>
            )}

            {donor.description && (
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">{t('form.description')}</span>
                <p className="text-sm">{donor.description}</p>
              </div>
            )}

            {donor.notes && (
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">{t('form.notes')}</span>
                <p className="text-sm">{donor.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contacts Section */}
        {donor.contacts && donor.contacts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('form.contacts')} ({donor.contacts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium">{t('form.contactName')}</th>
                      <th className="text-left py-2 px-3 font-medium">{t('form.designation')}</th>
                      <th className="text-left py-2 px-3 font-medium">{t('fields.email')}</th>
                      <th className="text-left py-2 px-3 font-medium">{t('fields.phone')}</th>
                      <th className="text-left py-2 px-3 font-medium">{t('form.primary')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donor.contacts.map((contact) => (
                      <tr key={contact.id} className="border-b last:border-0">
                        <td className="py-2 px-3 font-medium">{contact.name}</td>
                        <td className="py-2 px-3">{contact.designation || '\u2014'}</td>
                        <td className="py-2 px-3">{contact.email || '\u2014'}</td>
                        <td className="py-2 px-3">{contact.phone || '\u2014'}</td>
                        <td className="py-2 px-3">
                          {contact.isPrimary && <StatusBadge status="ACTIVE" />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* File Attachments */}
        <Card>
          <CardContent className="pt-6">
            <FileUpload entityType="donor" entityId={id} module="donors" readOnly={!donor.isActive} />
          </CardContent>
        </Card>

        {/* Grants Section */}
        {donor.grants && donor.grants.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('fields.grants')} ({donor.grants.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium">{t('grants.grantNo')}</th>
                      <th className="text-left py-2 px-3 font-medium">{t('grants.grantTitle')}</th>
                      <th className="text-right py-2 px-3 font-medium">{t('grants.awardAmount')}</th>
                      <th className="text-left py-2 px-3 font-medium">{t('grants.startDate')}</th>
                      <th className="text-left py-2 px-3 font-medium">{t('grants.endDate')}</th>
                      <th className="text-left py-2 px-3 font-medium">{t('grants.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donor.grants.map((grant) => (
                      <tr
                        key={grant.id}
                        className="border-b last:border-0 cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/donors/grants/${grant.id}`)}
                      >
                        <td className="py-2 px-3 font-mono text-sm">{grant.grantNo}</td>
                        <td className="py-2 px-3">{grant.title}</td>
                        <td className="py-2 px-3 text-right font-mono">{formatCurrency(Number(grant.awardAmount))}</td>
                        <td className="py-2 px-3">{grant.startDate ? formatDate(grant.startDate) : '\u2014'}</td>
                        <td className="py-2 px-3">{grant.endDate ? formatDate(grant.endDate) : '\u2014'}</td>
                        <td className="py-2 px-3"><StatusBadge status={grant.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // EDIT MODE
  return (
    <div className="space-y-6">
      <PageHeader
        title={t('form.editTitle')}
        description={donor.name}
      >
        <Button variant="outline" size="sm" onClick={cancelEditing}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tc('buttons.cancel')}
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>{t('form.donorDetails')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Row 1: Name + Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-donor-name">{t('fields.donorName')} *</Label>
              <Input
                id="edit-donor-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-donor-type">{t('fields.type')} *</Label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger id="edit-donor-type" className="w-full">
                  <SelectValue placeholder={t('form.selectType')} />
                </SelectTrigger>
                <SelectContent>
                  {DONOR_TYPES.map((dt) => (
                    <SelectItem key={dt} value={dt}>
                      {t(`donorTypes.${dt}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Country + Relationship Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-donor-country">{t('fields.country')}</Label>
              <Input
                id="edit-donor-country"
                value={formCountry}
                onChange={(e) => setFormCountry(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-donor-rel-status">{t('form.relationshipStatus')}</Label>
              <Select value={formRelationshipStatus} onValueChange={setFormRelationshipStatus}>
                <SelectTrigger id="edit-donor-rel-status" className="w-full">
                  <SelectValue placeholder={t('form.selectStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PROSPECT">{t('form.statusOptions.PROSPECT')}</SelectItem>
                  <SelectItem value="ACTIVE">{tc('status.ACTIVE')}</SelectItem>
                  <SelectItem value="INACTIVE">{tc('status.INACTIVE')}</SelectItem>
                  <SelectItem value="LAPSED">{t('form.statusOptions.LAPSED')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3: Phone + Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-donor-phone">{t('fields.phone')}</Label>
              <Input
                id="edit-donor-phone"
                type="tel"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-donor-email">{t('fields.email')}</Label>
              <Input
                id="edit-donor-email"
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="edit-donor-website">{t('fields.website')}</Label>
            <Input
              id="edit-donor-website"
              type="url"
              value={formWebsite}
              onChange={(e) => setFormWebsite(e.target.value)}
              placeholder="https://"
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="edit-donor-address">{t('form.address')}</Label>
            <Textarea
              id="edit-donor-address"
              value={formAddress}
              onChange={(e) => setFormAddress(e.target.value)}
              rows={2}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-donor-description">{t('form.description')}</Label>
            <Textarea
              id="edit-donor-description"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="edit-donor-notes">{t('form.notes')}</Label>
            <Textarea
              id="edit-donor-notes"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-3">
          <Button variant="outline" onClick={cancelEditing} disabled={saving}>
            {tc('buttons.cancel')}
          </Button>
          <Button onClick={handleUpdate} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('form.saving')}
              </>
            ) : (
              tc('buttons.save')
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* File Attachments */}
      <Card>
        <CardContent className="pt-6">
          <FileUpload entityType="donor" entityId={id} module="donors" readOnly={false} />
        </CardContent>
      </Card>
    </div>
  )
}

function DetailItem({
  label,
  value,
  children,
}: {
  label: string
  value?: string | null
  children?: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      {children ? (
        <div>{children}</div>
      ) : (
        <p className="text-sm font-medium">{value || '\u2014'}</p>
      )}
    </div>
  )
}
