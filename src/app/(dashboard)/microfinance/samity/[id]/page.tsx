'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

const MEETING_DAYS = ['SATURDAY', 'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] as const
const STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED'] as const

interface Member {
  id: string
  memberNo: string
  beneficiaryId: string
  status: string
  admissionDate: string
  beneficiary?: { id: string; name: string; phone?: string }
}

interface Samity {
  id: string
  samityNo: string
  name: string
  branchId: string
  formationDate: string
  meetingDay: string
  meetingTime?: string | null
  fieldOfficerId?: string | null
  totalMembers: number
  status: string
  location?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
  branch?: { id: string; code: string; name: string }
  members?: Member[]
  portfolioSummary?: {
    activeLoans: number
    totalOutstanding: number | string
    totalSavings: number | string
  }
}

export default function SamityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('microfinance')
  const tc = useTranslations('common')
  const { formatCurrency, formatDate } = useFormatters()

  const [samity, setSamity] = useState<Samity | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Editable fields
  const [name, setName] = useState('')
  const [meetingDay, setMeetingDay] = useState('')
  const [meetingTime, setMeetingTime] = useState('')
  const [status, setStatus] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!params.id) return

    fetch(`/api/v1/microfinance/samity/${params.id}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setSamity(json.data)
          populateForm(json.data)
        } else {
          setError(tc('errors.notFound'))
        }
      })
      .catch(() => setError(tc('errors.loadFailed')))
      .finally(() => setLoading(false))
  }, [params.id, tc])

  function populateForm(s: Samity) {
    setName(s.name)
    setMeetingDay(s.meetingDay)
    setMeetingTime(s.meetingTime || '')
    setStatus(s.status)
    setLocation(s.location || '')
    setNotes(s.notes || '')
  }

  function handleCancel() {
    if (samity) populateForm(samity)
    setEditing(false)
    setError('')
  }

  async function handleSave() {
    if (!name.trim()) {
      setError(t('samityForm.requiredFields'))
      return
    }

    setSaving(true)
    setError('')

    const payload: Record<string, unknown> = {
      name: name.trim(),
      meetingDay,
      meetingTime: meetingTime.trim() || null,
      status,
      location: location.trim() || null,
      notes: notes.trim() || null,
    }

    try {
      const res = await fetch(`/api/v1/microfinance/samity/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setSamity((prev) => prev ? { ...prev, ...json.data } : json.data)
        populateForm(json.data)
        setEditing(false)
      } else {
        setError(json.error || t('samityForm.failedToSave'))
      }
    } catch {
      setError(t('samityForm.failedToSave'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!samity) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('samityForm.samityDetails')} description="">
          <Button variant="outline" size="sm" onClick={() => router.push('/microfinance/samity')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tc('buttons.back')}
          </Button>
        </PageHeader>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {error || tc('errors.notFound')}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={editing ? t('samityForm.editSamity') : samity.name}
        description={editing ? '' : `${samity.samityNo} - ${samity.branch?.name || ''}`}
      >
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/microfinance/samity')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tc('buttons.back')}
          </Button>
          {!editing && (
            <Button size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              {tc('buttons.edit')}
            </Button>
          )}
        </div>
      </PageHeader>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* View Mode */}
      {!editing && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader><CardTitle>{t('samityForm.samityInfo')}</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div><span className="text-muted-foreground">{t('samity.samityNo')}:</span> <span className="font-mono font-medium">{samity.samityNo}</span></div>
                <div><span className="text-muted-foreground">{t('samity.name')}:</span> <span className="font-medium">{samity.name}</span></div>
                <div><span className="text-muted-foreground">{t('samity.branch')}:</span> {samity.branch?.name || '\u2014'}</div>
                <div><span className="text-muted-foreground">{t('samity.formationDate')}:</span> {formatDate(samity.formationDate)}</div>
                <div><span className="text-muted-foreground">{tc('labels.status')}:</span> <StatusBadge status={samity.status} /></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>{t('samityForm.meetingInfo')}</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div><span className="text-muted-foreground">{t('samity.meetingDay')}:</span> {t(`samityForm.days.${samity.meetingDay}`)}</div>
                {samity.meetingTime && <div><span className="text-muted-foreground">{t('samityForm.meetingTime')}:</span> {samity.meetingTime}</div>}
                {samity.location && <div><span className="text-muted-foreground">{t('samityForm.location')}:</span> {samity.location}</div>}
                <div><span className="text-muted-foreground">{t('samity.members')}:</span> <span className="font-mono font-medium">{samity.totalMembers}</span></div>
              </CardContent>
            </Card>

            {samity.portfolioSummary && (
              <Card>
                <CardHeader><CardTitle>{t('samityForm.portfolio')}</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div><span className="text-muted-foreground">{t('samity.activeLoans')}:</span> <span className="font-mono font-medium">{samity.portfolioSummary.activeLoans}</span></div>
                  <div><span className="text-muted-foreground">{t('samity.totalOutstanding')}:</span> <span className="font-mono">{formatCurrency(Number(samity.portfolioSummary.totalOutstanding))}</span></div>
                  <div><span className="text-muted-foreground">{t('samityForm.totalSavings')}:</span> <span className="font-mono">{formatCurrency(Number(samity.portfolioSummary.totalSavings))}</span></div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Members List */}
          {samity.members && samity.members.length > 0 && (
            <Card>
              <CardHeader><CardTitle>{t('samity.members')} ({samity.members.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">{t('samityForm.memberNo')}</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">{tc('labels.name')}</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">{tc('labels.phone')}</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">{t('samityForm.admissionDate')}</th>
                        <th className="text-left py-2 font-medium text-muted-foreground">{tc('labels.status')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {samity.members.map((m) => (
                        <tr key={m.id} className="border-b last:border-0">
                          <td className="py-2 pr-4 font-mono">{m.memberNo}</td>
                          <td className="py-2 pr-4 font-medium">{m.beneficiary?.name || '\u2014'}</td>
                          <td className="py-2 pr-4">{m.beneficiary?.phone || '\u2014'}</td>
                          <td className="py-2 pr-4">{formatDate(m.admissionDate)}</td>
                          <td className="py-2"><StatusBadge status={m.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {samity.notes && (
            <Card>
              <CardHeader><CardTitle>{t('samityForm.notes')}</CardTitle></CardHeader>
              <CardContent><p className="text-sm whitespace-pre-wrap">{samity.notes}</p></CardContent>
            </Card>
          )}
        </>
      )}

      {/* Edit Mode */}
      {editing && (
        <Card>
          <CardHeader><CardTitle>{t('samityForm.editSamity')}</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">{t('samity.name')} *</Label>
                <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">{tc('labels.status')}</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="edit-status" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (<SelectItem key={s} value={s}>{tc(`status.${s}`)}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-meeting-day">{t('samity.meetingDay')}</Label>
                <Select value={meetingDay} onValueChange={setMeetingDay}>
                  <SelectTrigger id="edit-meeting-day" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MEETING_DAYS.map((day) => (<SelectItem key={day} value={day}>{t(`samityForm.days.${day}`)}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-meeting-time">{t('samityForm.meetingTime')}</Label>
                <Input id="edit-meeting-time" type="time" value={meetingTime} onChange={(e) => setMeetingTime(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-location">{t('samityForm.location')}</Label>
                <Input id="edit-location" value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">{t('samityForm.notes')}</Label>
              <Textarea id="edit-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCancel} disabled={saving}>
              {tc('buttons.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('samityForm.saving')}
                </>
              ) : (
                tc('buttons.save')
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
