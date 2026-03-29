'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2, Pencil, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchableSelect } from '@/components/shared/searchable-select'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { useFormatters } from '@/hooks/use-formatters'
import { FileUpload } from '@/components/shared/file-upload'

const VENDOR_CATEGORIES = ['SUPPLIER', 'CONTRACTOR', 'CONSULTANT', 'SERVICE_PROVIDER'] as const

interface VendorData {
  id: string
  vendorNo: string
  companyName: string
  category: string | null
  contactPerson: string | null
  phone: string | null
  email: string | null
  address: string | null
  tin: string | null
  tradeLicense: string | null
  rating: number
  totalOrders: number
  isApproved: boolean
  isActive: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
  _count?: { purchaseOrders: number }
}

export default function VendorDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const t = useTranslations('procurement.vendors')
  const tc = useTranslations('common')
  const { formatDate } = useFormatters()

  const [vendor, setVendor] = useState<VendorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // Edit form state
  const [formCompanyName, setFormCompanyName] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formContactPerson, setFormContactPerson] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formAddress, setFormAddress] = useState('')
  const [formTin, setFormTin] = useState('')
  const [formTradeLicense, setFormTradeLicense] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [formIsApproved, setFormIsApproved] = useState(false)
  const [formIsActive, setFormIsActive] = useState(true)

  const fetchVendor = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/procurement/vendors/${id}`)
      const json = await res.json()
      if (res.ok && json.success) {
        setVendor(json.data)
      } else {
        setError(json.error || t('failedToLoad'))
      }
    } catch {
      setError(t('failedToLoad'))
    } finally {
      setLoading(false)
    }
  }, [id, t])

  useEffect(() => {
    fetchVendor()
  }, [fetchVendor])

  function startEditing() {
    if (!vendor) return
    setFormCompanyName(vendor.companyName)
    setFormCategory(vendor.category || '')
    setFormContactPerson(vendor.contactPerson || '')
    setFormPhone(vendor.phone || '')
    setFormEmail(vendor.email || '')
    setFormAddress(vendor.address || '')
    setFormTin(vendor.tin || '')
    setFormTradeLicense(vendor.tradeLicense || '')
    setFormNotes(vendor.notes || '')
    setFormIsApproved(vendor.isApproved)
    setFormIsActive(vendor.isActive)
    setEditing(true)
    setError('')
  }

  function cancelEditing() {
    setEditing(false)
    setError('')
  }

  function validate(): boolean {
    if (!formCompanyName.trim()) {
      setError(t('companyNameRequired'))
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
      companyName: formCompanyName.trim(),
      category: formCategory || null,
      contactPerson: formContactPerson.trim() || null,
      phone: formPhone.trim() || null,
      email: formEmail.trim() || null,
      address: formAddress.trim() || null,
      tin: formTin.trim() || null,
      tradeLicense: formTradeLicense.trim() || null,
      notes: formNotes.trim() || null,
      isApproved: formIsApproved,
      isActive: formIsActive,
    }

    try {
      const res = await fetch(`/api/v1/procurement/vendors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setEditing(false)
        await fetchVendor()
      } else {
        setError(json.error || t('failedToUpdate'))
      }
    } catch {
      setError(t('failedToUpdate'))
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

  // Error state
  if (error && !vendor) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('vendorDetail')}>
          <Button variant="outline" size="sm" onClick={() => router.push('/procurement/vendors')}>
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

  if (!vendor) return null

  // VIEW MODE
  if (!editing) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={`${t('vendorNo')}: ${vendor.vendorNo}`}
          description={t('vendorDetail')}
        >
          <Button variant="outline" size="sm" onClick={() => router.push('/procurement/vendors')}>
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
                {vendor.companyName}
                {vendor.category && <StatusBadge status={vendor.category} />}
                <Badge variant={vendor.isApproved ? 'default' : 'outline'} className="text-[11px]">
                  {vendor.isApproved ? tc('status.APPROVED') : tc('status.PENDING')}
                </Badge>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <DetailItem label={t('vendorNo')} value={vendor.vendorNo} />
              <DetailItem label={t('companyName')} value={vendor.companyName} />
              <DetailItem label={t('category')}>
                {vendor.category ? <StatusBadge status={vendor.category} /> : '\u2014'}
              </DetailItem>
              <DetailItem label={t('contactPerson')} value={vendor.contactPerson || ''} />
              <DetailItem label={t('phone')} value={vendor.phone || ''} />
              <DetailItem label={t('email')} value={vendor.email || ''} />
              <DetailItem label={t('tin')} value={vendor.tin || ''} />
              <DetailItem label={t('tradeLicense')} value={vendor.tradeLicense || ''} />
              <DetailItem label={t('rating')}>
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-mono">{vendor.rating?.toFixed(1) ?? '0.0'}</span>
                </div>
              </DetailItem>
              <DetailItem label={t('totalOrders')} value={String(vendor.totalOrders ?? 0)} />
              {vendor._count && (
                <DetailItem label={t('purchaseOrders')} value={String(vendor._count.purchaseOrders)} />
              )}
              <DetailItem label={t('activeStatus')}>
                <Badge variant={vendor.isActive ? 'default' : 'secondary'} className="text-[11px]">
                  {vendor.isActive ? tc('status.ACTIVE') : tc('status.INACTIVE')}
                </Badge>
              </DetailItem>
            </div>

            {vendor.address && (
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">{t('address')}</span>
                <p className="text-sm">{vendor.address}</p>
              </div>
            )}

            {vendor.notes && (
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">{tc('labels.notes')}</span>
                <p className="text-sm">{vendor.notes}</p>
              </div>
            )}

            {/* Metadata */}
            <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <DetailItem label={tc('labels.createdAt')} value={formatDate(vendor.createdAt)} />
              <DetailItem label={tc('labels.updatedAt')} value={formatDate(vendor.updatedAt)} />
            </div>
          </CardContent>
        </Card>

        {/* File Attachments */}
        <Card>
          <CardContent className="pt-6">
            <FileUpload entityType="vendor" entityId={id} module="procurement" readOnly={!vendor.isActive} />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card>
          <CardContent className="flex flex-wrap gap-3 pt-6">
            <Button onClick={startEditing}>
              <Pencil className="h-4 w-4 mr-2" />
              {tc('buttons.edit')}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // EDIT MODE
  return (
    <div className="space-y-6">
      <PageHeader
        title={t('editVendor')}
        description={`${t('vendorNo')}: ${vendor.vendorNo}`}
      >
        <Button variant="outline" size="sm" onClick={cancelEditing}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tc('buttons.cancel')}
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>{t('editVendor')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Row 1: Company Name + Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-vendor-company-name">{t('companyName')} *</Label>
              <Input
                id="edit-vendor-company-name"
                value={formCompanyName}
                onChange={(e) => setFormCompanyName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-vendor-category">{t('category')}</Label>
              <SearchableSelect
                id="edit-vendor-category"
                options={VENDOR_CATEGORIES.map((cat) => ({ value: cat, label: t(`categories.${cat}`) }))}
                value={formCategory}
                onValueChange={setFormCategory}
                placeholder={t('selectCategory')}
              />
            </div>
          </div>

          {/* Row 2: Contact Person + Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-vendor-contact">{t('contactPerson')}</Label>
              <Input
                id="edit-vendor-contact"
                value={formContactPerson}
                onChange={(e) => setFormContactPerson(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-vendor-phone">{t('phone')}</Label>
              <Input
                id="edit-vendor-phone"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Row 3: Email + TIN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-vendor-email">{t('email')}</Label>
              <Input
                id="edit-vendor-email"
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-vendor-tin">{t('tin')}</Label>
              <Input
                id="edit-vendor-tin"
                value={formTin}
                onChange={(e) => setFormTin(e.target.value)}
              />
            </div>
          </div>

          {/* Row 4: Trade License + Approved/Active */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-vendor-trade-license">{t('tradeLicense')}</Label>
              <Input
                id="edit-vendor-trade-license"
                value={formTradeLicense}
                onChange={(e) => setFormTradeLicense(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-vendor-approved">{t('approved')}</Label>
              <SearchableSelect
                id="edit-vendor-approved"
                options={[
                  { value: 'true', label: tc('labels.yes') },
                  { value: 'false', label: tc('labels.no') },
                ]}
                value={formIsApproved ? 'true' : 'false'}
                onValueChange={(v) => setFormIsApproved(v === 'true')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-vendor-active">{t('activeStatus')}</Label>
              <SearchableSelect
                id="edit-vendor-active"
                options={[
                  { value: 'true', label: tc('status.ACTIVE') },
                  { value: 'false', label: tc('status.INACTIVE') },
                ]}
                value={formIsActive ? 'true' : 'false'}
                onValueChange={(v) => setFormIsActive(v === 'true')}
              />
            </div>
          </div>

          {/* Row 5: Address */}
          <div className="space-y-2">
            <Label htmlFor="edit-vendor-address">{t('address')}</Label>
            <Textarea
              id="edit-vendor-address"
              value={formAddress}
              onChange={(e) => setFormAddress(e.target.value)}
              rows={2}
            />
          </div>

          {/* Row 6: Notes */}
          <div className="space-y-2">
            <Label htmlFor="edit-vendor-notes">{tc('labels.notes')}</Label>
            <Textarea
              id="edit-vendor-notes"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              rows={3}
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
                {t('saving')}
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
          <FileUpload entityType="vendor" entityId={id} module="procurement" readOnly={false} />
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
  value?: string
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
