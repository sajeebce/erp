'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2, Plus, Pencil, Trash2 } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/shared/data-table'
import { SearchableSelect } from '@/components/shared/searchable-select'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

const HOLIDAY_TYPES = ['PUBLIC', 'ORGANIZATIONAL', 'RESTRICTED', 'OPTIONAL'] as const

interface Holiday {
  id: string
  date: string
  endDate?: string | null
  name: string
  localizedName?: string | null
  type: string
  description?: string | null
  isRecurring?: boolean
}

interface HolidayCalendar {
  id: string
  name: string
  year: number
  isDefault?: boolean
  holidays?: Holiday[]
}

export default function HolidayCalendarDetailPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const { formatDate } = useFormatters()

  const [calendar, setCalendar] = useState<HolidayCalendar | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingHolidayId, setEditingHolidayId] = useState<string | null>(null)

  // Holiday form
  const [holidayName, setHolidayName] = useState('')
  const [holidayDate, setHolidayDate] = useState('')
  const [holidayEndDate, setHolidayEndDate] = useState('')
  const [holidayType, setHolidayType] = useState('PUBLIC')
  const [localizedName, setLocalizedName] = useState('')
  const [description, setDescription] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)

  useEffect(() => {
    if (!params.id) return

    fetch(`/api/v1/hr/holiday-calendars/${params.id}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setCalendar(json.data)
        } else {
          setError(tc('errors.notFound'))
        }
      })
      .catch(() => setError(tc('errors.loadFailed')))
      .finally(() => setLoading(false))
  }, [params.id, tc])

  function resetForm() {
    setHolidayName('')
    setHolidayDate('')
    setHolidayEndDate('')
    setHolidayType('PUBLIC')
    setLocalizedName('')
    setDescription('')
    setIsRecurring(false)
    setEditingHolidayId(null)
    setShowForm(false)
  }

  function startEdit(holiday: Holiday) {
    setEditingHolidayId(holiday.id)
    setHolidayName(holiday.name)
    setHolidayDate(holiday.date?.split('T')[0] || '')
    setHolidayEndDate(holiday.endDate?.split('T')[0] || '')
    setHolidayType(holiday.type)
    setLocalizedName(holiday.localizedName || '')
    setDescription(holiday.description || '')
    setIsRecurring(holiday.isRecurring || false)
    setShowForm(true)
  }

  async function handleSaveHoliday() {
    if (!holidayName.trim() || !holidayDate) {
      setError(t('form.requiredFields'))
      return
    }

    setSaving(true)
    setError('')

    const payload: Record<string, unknown> = {
      name: holidayName.trim(),
      date: holidayDate,
      type: holidayType,
      isRecurring,
    }
    if (holidayEndDate) payload.endDate = holidayEndDate
    if (localizedName.trim()) payload.localizedName = localizedName.trim()
    if (description.trim()) payload.description = description.trim()

    try {
      const url = editingHolidayId
        ? `/api/v1/hr/holiday-calendars/${params.id}/holidays/${editingHolidayId}`
        : `/api/v1/hr/holiday-calendars/${params.id}/holidays`
      const method = editingHolidayId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        const refreshRes = await fetch(`/api/v1/hr/holiday-calendars/${params.id}`)
        const refreshJson = await refreshRes.json()
        if (refreshJson.success) setCalendar(refreshJson.data)
        resetForm()
      } else {
        setError(json.error || t('holidays.form.failedToCreate'))
      }
    } catch {
      setError(t('holidays.form.failedToCreate'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteHoliday(holidayId: string) {
    try {
      const res = await fetch(`/api/v1/hr/holiday-calendars/${params.id}/holidays/${holidayId}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setCalendar(prev => {
          if (!prev) return prev
          return { ...prev, holidays: (prev.holidays || []).filter(h => h.id !== holidayId) }
        })
      } else {
        setError(json.error || tc('errors.somethingWentWrong'))
      }
    } catch {
      setError(tc('errors.somethingWentWrong'))
    }
  }

  const holidays = calendar?.holidays || []

  const columns: ColumnDef<Holiday>[] = [
    { accessorKey: 'date', header: t('holidays.fields.date'), cell: ({ row }) => formatDate(row.getValue('date')) },
    { accessorKey: 'name', header: t('holidays.fields.name'), cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span> },
    { accessorKey: 'localizedName', header: t('holidays.fields.localizedName'), cell: ({ row }) => row.getValue('localizedName') || '\u2014' },
    { accessorKey: 'type', header: tc('labels.type'), cell: ({ row }) => <Badge variant="outline">{t(`holidays.types.${row.getValue('type')}`)}</Badge> },
    { accessorKey: 'isRecurring', header: t('holidays.fields.isRecurring'), cell: ({ row }) => row.getValue('isRecurring') ? tc('labels.yes') : tc('labels.no') },
    {
      id: 'actions',
      header: tc('labels.actions'),
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); startEdit(row.original) }}>
            <Pencil className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteHoliday(row.original.id) }}>
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!calendar) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('holidays.title')} description="">
          <Button variant="outline" size="sm" onClick={() => router.push('/hr/holidays')}>
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
        title={calendar.name}
        description={`${calendar.year} - ${holidays.length} holidays`}
      >
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/hr/holidays')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tc('buttons.back')}
          </Button>
          <Button size="sm" onClick={() => { resetForm(); setShowForm(true) }}>
            <Plus className="h-4 w-4 mr-2" />{t('holidays.addHoliday')}
          </Button>
        </div>
      </PageHeader>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingHolidayId ? tc('buttons.edit') : t('holidays.addHoliday')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="holiday-name">{t('holidays.fields.name')} *</Label>
                <Input id="holiday-name" value={holidayName} onChange={(e) => setHolidayName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="holiday-localized">{t('holidays.fields.localizedName')}</Label>
                <Input id="holiday-localized" value={localizedName} onChange={(e) => setLocalizedName(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="holiday-date">{t('holidays.fields.date')} *</Label>
                <Input id="holiday-date" type="date" value={holidayDate} onChange={(e) => setHolidayDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="holiday-end-date">{t('holidays.fields.endDate')}</Label>
                <Input id="holiday-end-date" type="date" value={holidayEndDate} onChange={(e) => setHolidayEndDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="holiday-type">{tc('labels.type')} *</Label>
                <SearchableSelect
                  id="holiday-type"
                  options={HOLIDAY_TYPES.map((ht) => ({ value: ht, label: t(`holidays.types.${ht}`) }))}
                  value={holidayType}
                  onValueChange={setHolidayType}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="holiday-description">{tc('labels.description')}</Label>
              <Textarea id="holiday-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>

            <div className="flex items-center gap-2">
              <input id="holiday-recurring" type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
              <Label htmlFor="holiday-recurring">{t('holidays.fields.isRecurring')}</Label>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            <Button variant="outline" onClick={resetForm} disabled={saving}>{tc('buttons.cancel')}</Button>
            <Button onClick={handleSaveHoliday} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {tc('buttons.save')}
            </Button>
          </CardFooter>
        </Card>
      )}

      <DataTable
        columns={columns}
        data={holidays}
        searchKey="name"
        searchPlaceholder={t('holidays.searchHolidays')}
        isLoading={false}
      />
    </div>
  )
}
