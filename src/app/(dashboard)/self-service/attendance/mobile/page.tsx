'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface OperatingLocation {
  id: string
  code: string
  name: string
}

interface SelfAttendanceData {
  employee: {
    id: string
    employeeNo: string
    fullName: string
  }
  attendance: {
    id: string
    status: string
    checkIn: string | null
    checkOut: string | null
    attendanceMode: string | null
    validationStatus: string | null
    geoAddress: string | null
  } | null
  today: string
}

interface GeoState {
  lat: number | null
  lng: number | null
  accuracy: number | null
  address: string | null
  validationStatus: 'VALID' | 'PENDING'
}

interface QueuedAttendanceEvent {
  date: string
  status: string
  checkIn?: string | null
  checkOut?: string | null
  attendanceMode: 'FIELD' | 'BRANCH_VISIT' | 'OFFICE'
  attendanceSource: 'MOBILE'
  operatingLocationId?: string | null
  geoLat?: number | null
  geoLng?: number | null
  geoAccuracyMeters?: number | null
  geoAddress?: string | null
  validationStatus: 'VALID' | 'PENDING'
  deviceId?: string | null
}

function formatDateTime(value: string | null, locale: string): string {
  if (!value) return '-'
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default function MobileAttendancePage() {
  const t = useTranslations('hr')
  const locale = useLocale()

  const [data, setData] = useState<SelfAttendanceData | null>(null)
  const [locations, setLocations] = useState<OperatingLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [attendanceMode, setAttendanceMode] = useState<'FIELD' | 'BRANCH_VISIT' | 'OFFICE'>('FIELD')
  const [operatingLocationId, setOperatingLocationId] = useState<string>('')
  const [deviceId, setDeviceId] = useState('')
  const [queueCount, setQueueCount] = useState(0)
  const [geo, setGeo] = useState<GeoState>({
    lat: null,
    lng: null,
    accuracy: null,
    address: null,
    validationStatus: 'PENDING',
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const existing = window.localStorage.getItem('attendance-device-id')
    if (existing) {
      setDeviceId(existing)
      return
    }
    const nextDeviceId = `web-${crypto.randomUUID()}`
    window.localStorage.setItem('attendance-device-id', nextDeviceId)
    setDeviceId(nextDeviceId)
  }, [])

  function getQueue(): QueuedAttendanceEvent[] {
    if (typeof window === 'undefined') return []
    try {
      return JSON.parse(window.localStorage.getItem('attendance-mobile-queue') || '[]')
    } catch {
      return []
    }
  }

  function setQueue(events: QueuedAttendanceEvent[]) {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('attendance-mobile-queue', JSON.stringify(events))
    setQueueCount(events.length)
  }

  useEffect(() => {
    setQueueCount(getQueue().length)
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [selfRes, locationRes] = await Promise.all([
        fetch('/api/v1/hr/attendance/self'),
        fetch('/api/v1/settings/operating-locations?isActive=true'),
      ])

      const selfJson = await selfRes.json()
      const locationJson = await locationRes.json()

      if (selfJson.success) setData(selfJson.data)
      if (locationJson.success) setLocations(locationJson.data)
    } catch (error) {
      console.error(error)
      setMessage('Failed to load mobile attendance data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const todayDate = useMemo(() => {
    if (!data?.today) return new Date().toISOString().slice(0, 10)
    return data.today.slice(0, 10)
  }, [data?.today])

  function captureLocation() {
    setMessage(null)
    if (!navigator.geolocation) {
      setGeo({
        lat: null,
        lng: null,
        accuracy: null,
        address: null,
        validationStatus: 'PENDING',
      })
      setMessage(t('attendance.locationPending'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeo({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          address: `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`,
          validationStatus: 'VALID',
        })
        setMessage(t('attendance.locationCaptured'))
      },
      (error) => {
        console.error(error)
        setGeo({
          lat: null,
          lng: null,
          accuracy: null,
          address: null,
          validationStatus: 'PENDING',
        })
        setMessage(t('attendance.locationPending'))
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }

  function buildEventPayload(checkType: 'IN' | 'OUT'): QueuedAttendanceEvent {
    return {
      date: todayDate,
      status: 'PRESENT',
      ...(checkType === 'IN' ? { checkIn: new Date().toISOString() } : {}),
      ...(checkType === 'OUT' ? { checkOut: new Date().toISOString() } : {}),
      attendanceMode,
      attendanceSource: 'MOBILE',
      operatingLocationId: attendanceMode === 'BRANCH_VISIT' ? operatingLocationId || null : null,
      geoLat: geo.lat,
      geoLng: geo.lng,
      geoAccuracyMeters: geo.accuracy,
      geoAddress: geo.address,
      validationStatus: geo.validationStatus,
      deviceId: deviceId || null,
    }
  }

  function enqueueEvent(event: QueuedAttendanceEvent) {
    const queue = getQueue()
    queue.push(event)
    setQueue(queue)
  }

  async function syncQueuedEvents() {
    const events = getQueue()
    if (events.length === 0) return
    setSubmitting(true)
    setMessage(null)
    try {
      const response = await fetch('/api/v1/hr/attendance/mobile-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
      })
      const json = await response.json()
      if (!json.success) throw new Error(json.error?.message || 'Sync failed')
      setQueue([])
      setMessage(`Synced ${json.data.created + json.data.updated} events`)
      await loadData()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Sync failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCheckIn() {
    if (!data) return
    setSubmitting(true)
    setMessage(null)
    try {
      const payload = buildEventPayload('IN')
      const response = await fetch('/api/v1/hr/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: data.employee.id,
          ...payload,
        }),
      })
      const json = await response.json()
      if (!json.success) throw new Error(json.error?.message || 'Check-in failed')
      setMessage(t('attendance.checkedIn'))
      await loadData()
    } catch (error) {
      enqueueEvent(buildEventPayload('IN'))
      setMessage(error instanceof Error ? `${error.message}. Queued for sync.` : 'Check-in queued for sync')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCheckOut() {
    if (!data?.attendance) return
    setSubmitting(true)
    setMessage(null)
    try {
      const payload = buildEventPayload('OUT')
      const response = await fetch(`/api/v1/hr/attendance/${data.attendance.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
        }),
      })
      const json = await response.json()
      if (!json.success) throw new Error(json.error?.message || 'Check-out failed')
      setMessage(t('attendance.checkedOut'))
      await loadData()
    } catch (error) {
      enqueueEvent(buildEventPayload('OUT'))
      setMessage(error instanceof Error ? `${error.message}. Queued for sync.` : 'Check-out queued for sync')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md space-y-4 pb-10">
      <PageHeader
        title={t('attendance.mobileTitle')}
        description={t('attendance.mobileDescription')}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t('attendance.todayStatus')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">{t('attendance.employeeName')}</p>
            <p className="font-medium">{data?.employee.fullName || '-'}</p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('attendance.status')}</p>
              <p className="font-medium">{data?.attendance?.status || t('attendance.notCheckedIn')}</p>
            </div>
            <Badge variant={geo.validationStatus === 'VALID' ? 'default' : 'secondary'}>
              {geo.validationStatus === 'VALID' ? t('attendance.locationCaptured') : t('attendance.locationPending')}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{t('attendance.queuedEvents')}</p>
            <Badge variant="outline">{queueCount}</Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('attendance.checkIn')}</p>
            <p className="font-medium">{formatDateTime(data?.attendance?.checkIn || null, locale)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('attendance.checkOut')}</p>
            <p className="font-medium">{formatDateTime(data?.attendance?.checkOut || null, locale)}</p>
          </div>
          {data?.attendance?.geoAddress && (
            <div>
              <p className="text-sm text-muted-foreground">{t('attendance.location')}</p>
              <p className="font-medium">{data.attendance.geoAddress}</p>
            </div>
          )}
          {message && <p className="text-sm text-primary">{message}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('attendance.mobileTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('attendance.mode')}</Label>
            <Select value={attendanceMode} onValueChange={(value: 'FIELD' | 'BRANCH_VISIT' | 'OFFICE') => setAttendanceMode(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FIELD">{t('attendance.field')}</SelectItem>
                <SelectItem value="BRANCH_VISIT">{t('attendance.branchVisit')}</SelectItem>
                <SelectItem value="OFFICE">{t('attendance.office')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {attendanceMode === 'BRANCH_VISIT' && (
            <div className="space-y-2">
              <Label>{t('attendance.location')}</Label>
              <Select value={operatingLocationId} onValueChange={setOperatingLocationId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('attendance.location')} />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.code} - {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button variant="outline" className="w-full" onClick={captureLocation} disabled={submitting}>
            {t('attendance.captureLocation')}
          </Button>

          <Button
            variant="secondary"
            className="w-full"
            onClick={syncQueuedEvents}
            disabled={submitting || queueCount === 0}
          >
            {t('attendance.syncQueued')}
          </Button>

          {geo.address && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <p className="font-medium">{geo.address}</p>
              {geo.accuracy != null && <p className="text-muted-foreground">Accuracy: {geo.accuracy.toFixed(0)} m</p>}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            <Button
              className="w-full"
              onClick={handleCheckIn}
              disabled={submitting || !!data?.attendance || (attendanceMode === 'BRANCH_VISIT' && !operatingLocationId)}
            >
              {t('attendance.checkIn')}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleCheckOut}
              disabled={submitting || !data?.attendance || !!data?.attendance.checkOut || (attendanceMode === 'BRANCH_VISIT' && !operatingLocationId)}
            >
              {t('attendance.checkOut')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
