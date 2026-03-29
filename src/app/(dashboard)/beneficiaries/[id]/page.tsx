'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2, Pencil, Trash2, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchableSelect } from '@/components/shared/searchable-select'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

const GENDERS = ['MALE', 'FEMALE', 'OTHER'] as const

interface Enrollment {
  id: string
  enrollmentNo: string
  programName: string
  enrollmentDate: string | null
  graduationDate: string | null
  status: string
  project: {
    id: string
    name: string
  } | null
}

interface Beneficiary {
  id: string
  beneficiaryNo: string
  name: string
  fatherSpouseName: string | null
  dateOfBirth: string | null
  age: number | null
  gender: string | null
  nidNumber: string | null
  phone: string | null
  division: string | null
  district: string | null
  upazila: string | null
  union: string | null
  village: string | null
  address: string | null
  photo: string | null
  status: string
  notes: string | null
  createdAt: string
  updatedAt: string
  enrollments: Enrollment[]
  _count: {
    serviceDeliveries: number
    grievances: number
  }
}

function toDateInput(val: string | null): string {
  if (!val) return ''
  return new Date(val).toISOString().split('T')[0]
}

export default function BeneficiaryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const t = useTranslations('beneficiaries')
  const tc = useTranslations('common')
  const { formatDate } = useFormatters()

  const [beneficiary, setBeneficiary] = useState<Beneficiary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Edit form state
  const [editName, setEditName] = useState('')
  const [editFatherSpouse, setEditFatherSpouse] = useState('')
  const [editDob, setEditDob] = useState('')
  const [editAge, setEditAge] = useState('')
  const [editGender, setEditGender] = useState('')
  const [editNid, setEditNid] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editDivision, setEditDivision] = useState('')
  const [editDistrict, setEditDistrict] = useState('')
  const [editUpazila, setEditUpazila] = useState('')
  const [editUnion, setEditUnion] = useState('')
  const [editVillage, setEditVillage] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editStatus, setEditStatus] = useState('')

  useEffect(() => {
    fetchBeneficiary()
  }, [id])

  async function fetchBeneficiary() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/v1/beneficiaries/${id}`)
      const json = await res.json()
      if (res.ok && json.success) {
        setBeneficiary(json.data)
      } else {
        setError(json.error || tc('errors.loadFailed'))
      }
    } catch {
      setError(tc('errors.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  function startEditing() {
    if (!beneficiary) return
    setEditName(beneficiary.name)
    setEditFatherSpouse(beneficiary.fatherSpouseName || '')
    setEditDob(toDateInput(beneficiary.dateOfBirth))
    setEditAge(beneficiary.age !== null ? String(beneficiary.age) : '')
    setEditGender(beneficiary.gender || '')
    setEditNid(beneficiary.nidNumber || '')
    setEditPhone(beneficiary.phone || '')
    setEditDivision(beneficiary.division || '')
    setEditDistrict(beneficiary.district || '')
    setEditUpazila(beneficiary.upazila || '')
    setEditUnion(beneficiary.union || '')
    setEditVillage(beneficiary.village || '')
    setEditAddress(beneficiary.address || '')
    setEditNotes(beneficiary.notes || '')
    setEditStatus(beneficiary.status)
    setEditing(true)
  }

  function cancelEditing() {
    setEditing(false)
    setError('')
  }

  async function handleSave() {
    if (!editName.trim()) {
      setError(t('form.nameRequired'))
      return
    }

    setSaving(true)
    setError('')

    const payload: Record<string, unknown> = {
      name: editName.trim(),
      fatherSpouseName: editFatherSpouse.trim() || null,
      dateOfBirth: editDob || null,
      age: editAge ? Number(editAge) : null,
      gender: editGender || null,
      nidNumber: editNid.trim() || null,
      phone: editPhone.trim() || null,
      division: editDivision.trim() || null,
      district: editDistrict.trim() || null,
      upazila: editUpazila.trim() || null,
      union: editUnion.trim() || null,
      village: editVillage.trim() || null,
      address: editAddress.trim() || null,
      notes: editNotes.trim() || null,
      status: editStatus,
    }

    try {
      const res = await fetch(`/api/v1/beneficiaries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setEditing(false)
        fetchBeneficiary()
      } else {
        setError(json.error || t('form.failedToUpdate'))
      }
    } catch {
      setError(t('form.failedToUpdate'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm(t('form.confirmDelete'))) return

    setDeleting(true)
    setError('')

    try {
      const res = await fetch(`/api/v1/beneficiaries/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        router.push('/beneficiaries')
      } else {
        const json = await res.json()
        setError(json.error || t('form.failedToDelete'))
      }
    } catch {
      setError(t('form.failedToDelete'))
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!beneficiary) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('detail.title')}>
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tc('buttons.back')}
          </Button>
        </PageHeader>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {error || tc('errors.notFound')}
          </CardContent>
        </Card>
      </div>
    )
  }

  const canEdit = beneficiary.status === 'ACTIVE'
  const canDelete = beneficiary.enrollments.length === 0

  return (
    <div className="space-y-6">
      <PageHeader title={beneficiary.name} description={beneficiary.beneficiaryNo}>
        <div className="flex items-center gap-2">
          {!editing && canEdit && (
            <Button variant="outline" size="sm" onClick={startEditing}>
              <Pencil className="h-4 w-4 mr-2" />
              {tc('buttons.edit')}
            </Button>
          )}
          {!editing && canDelete && (
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              {tc('buttons.delete')}
            </Button>
          )}
          {editing && (
            <>
              <Button variant="outline" size="sm" onClick={cancelEditing} disabled={saving}>
                <X className="h-4 w-4 mr-2" />
                {tc('buttons.cancel')}
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                {tc('buttons.save')}
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tc('buttons.back')}
          </Button>
        </div>
      </PageHeader>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Personal Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {t('form.personalInfo')}
            <StatusBadge status={beneficiary.status} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">{t('fields.name')} *</Label>
                  <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-father">{t('form.fatherSpouseName')}</Label>
                  <Input id="edit-father" value={editFatherSpouse} onChange={(e) => setEditFatherSpouse(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-gender">{t('fields.gender')}</Label>
                  <SearchableSelect
                    id="edit-gender"
                    options={GENDERS.map((g) => ({ value: g, label: t(`genders.${g}`) }))}
                    value={editGender}
                    onValueChange={setEditGender}
                    placeholder={t('form.selectGender')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-dob">{t('fields.dateOfBirth')}</Label>
                  <Input id="edit-dob" type="date" value={editDob} onChange={(e) => setEditDob(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-age">{t('form.age')}</Label>
                  <Input id="edit-age" type="number" min="0" max="150" value={editAge} onChange={(e) => setEditAge(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-nid">{t('fields.nidNumber')}</Label>
                  <Input id="edit-nid" value={editNid} onChange={(e) => setEditNid(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">{t('fields.phone')}</Label>
                  <Input id="edit-phone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">{tc('labels.status')}</Label>
                <SearchableSelect
                  id="edit-status"
                  options={[
                    { value: 'ACTIVE', label: tc('status.ACTIVE') },
                    { value: 'INACTIVE', label: tc('status.INACTIVE') },
                    { value: 'GRADUATED', label: tc('status.GRADUATED') },
                    { value: 'DROPPED_OUT', label: tc('status.DROPPED_OUT') },
                  ]}
                  value={editStatus}
                  onValueChange={setEditStatus}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">{t('fields.name')}</p>
                <p className="font-medium">{beneficiary.name}</p>
              </div>
              {beneficiary.fatherSpouseName && (
                <div>
                  <p className="text-sm text-muted-foreground">{t('form.fatherSpouseName')}</p>
                  <p className="font-medium">{beneficiary.fatherSpouseName}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">{t('fields.gender')}</p>
                <p className="font-medium">{beneficiary.gender ? t(`genders.${beneficiary.gender}`) : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('fields.dateOfBirth')}</p>
                <p className="font-medium">{beneficiary.dateOfBirth ? formatDate(beneficiary.dateOfBirth) : '-'}</p>
              </div>
              {beneficiary.age !== null && (
                <div>
                  <p className="text-sm text-muted-foreground">{t('form.age')}</p>
                  <p className="font-medium">{beneficiary.age}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">{t('fields.nidNumber')}</p>
                <p className="font-medium font-mono">{beneficiary.nidNumber || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('fields.phone')}</p>
                <p className="font-medium">{beneficiary.phone || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{tc('labels.createdAt')}</p>
                <p className="font-medium">{formatDate(beneficiary.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{tc('labels.updatedAt')}</p>
                <p className="font-medium">{formatDate(beneficiary.updatedAt)}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Address Card */}
      {!editing && (
        <Card>
          <CardHeader>
            <CardTitle>{t('form.addressInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">{t('form.division')}</p>
                <p className="font-medium">{beneficiary.division || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('fields.district')}</p>
                <p className="font-medium">{beneficiary.district || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('fields.upazila')}</p>
                <p className="font-medium">{beneficiary.upazila || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('fields.union')}</p>
                <p className="font-medium">{beneficiary.union || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('fields.village')}</p>
                <p className="font-medium">{beneficiary.village || '-'}</p>
              </div>
              {beneficiary.address && (
                <div className="col-span-full">
                  <p className="text-sm text-muted-foreground">{t('form.fullAddress')}</p>
                  <p className="font-medium">{beneficiary.address}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Address editing within edit mode */}
      {editing && (
        <Card>
          <CardHeader>
            <CardTitle>{t('form.addressInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-division">{t('form.division')}</Label>
                <Input id="edit-division" value={editDivision} onChange={(e) => setEditDivision(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-district">{t('fields.district')}</Label>
                <Input id="edit-district" value={editDistrict} onChange={(e) => setEditDistrict(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-upazila">{t('fields.upazila')}</Label>
                <Input id="edit-upazila" value={editUpazila} onChange={(e) => setEditUpazila(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-union">{t('fields.union')}</Label>
                <Input id="edit-union" value={editUnion} onChange={(e) => setEditUnion(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-village">{t('fields.village')}</Label>
                <Input id="edit-village" value={editVillage} onChange={(e) => setEditVillage(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">{t('form.fullAddress')}</Label>
              <Textarea id="edit-address" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} rows={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">{tc('labels.notes')}</Label>
              <Textarea id="edit-notes" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={3} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes (view mode) */}
      {!editing && beneficiary.notes && (
        <Card>
          <CardHeader>
            <CardTitle>{tc('labels.notes')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{beneficiary.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{t('fields.enrollments')}</p>
            <p className="text-2xl font-bold">{beneficiary.enrollments.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{t('detail.servicesReceived')}</p>
            <p className="text-2xl font-bold">{beneficiary._count.serviceDeliveries}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{t('detail.grievancesFiled')}</p>
            <p className="text-2xl font-bold">{beneficiary._count.grievances}</p>
          </CardContent>
        </Card>
      </div>

      {/* Enrollments Table */}
      {beneficiary.enrollments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('detail.enrollmentHistory')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 pr-4">{t('enrollment.enrollmentId')}</th>
                    <th className="text-left py-2 pr-4">{t('enrollment.program')}</th>
                    <th className="text-left py-2 pr-4">{t('enrollment.project')}</th>
                    <th className="text-left py-2 pr-4">{t('enrollment.enrollDate')}</th>
                    <th className="text-left py-2 pr-4">{t('detail.graduationDate')}</th>
                    <th className="text-left py-2">{tc('labels.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {beneficiary.enrollments.map((enrollment) => (
                    <tr key={enrollment.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-mono text-xs">{enrollment.enrollmentNo}</td>
                      <td className="py-2 pr-4">{enrollment.programName}</td>
                      <td className="py-2 pr-4">{enrollment.project?.name || '-'}</td>
                      <td className="py-2 pr-4">{enrollment.enrollmentDate ? formatDate(enrollment.enrollmentDate) : '-'}</td>
                      <td className="py-2 pr-4">{enrollment.graduationDate ? formatDate(enrollment.graduationDate) : '-'}</td>
                      <td className="py-2"><StatusBadge status={enrollment.status} /></td>
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
