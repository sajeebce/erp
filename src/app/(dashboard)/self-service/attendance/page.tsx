'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface SelfAttendanceData {
  employee: {
    id: string
    employeeNo: string
    fullName: string
    department: { id: string; name: string } | null
  }
  attendance: {
    id: string
    status: string
    checkIn: string | null
    checkOut: string | null
  } | null
  openMovement: {
    id: string
    movementType: string
    destinationName: string
    purpose: string
    checkOutTime: string
    expectedReturnTime: string | null
    status: string
  } | null
  today: string
}

const MOVEMENT_TYPES = ['OFFICIAL_DUTY', 'BANK_VISIT', 'GOVT_OFFICE', 'FIELD_VISIT', 'CLIENT_VISIT', 'OTHER'] as const

function formatDateTime(value: string | null, locale: string): string {
  if (!value) return '-'
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default function SelfServiceAttendancePage() {
  const t = useTranslations('hr')
  const locale = useLocale()

  const [data, setData] = useState<SelfAttendanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [movementType, setMovementType] = useState<string>('OFFICIAL_DUTY')
  const [destinationName, setDestinationName] = useState('')
  const [purpose, setPurpose] = useState('')
  const [destinationAddress, setDestinationAddress] = useState('')
  const [expectedReturnTime, setExpectedReturnTime] = useState('')

  async function loadSelfStatus() {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/hr/attendance/self')
      const json = await res.json()
      if (json.success) {
        setData(json.data)
      } else {
        setMessage(json.error?.message || 'Failed to load self attendance')
      }
    } catch (error) {
      console.error(error)
      setMessage('Failed to load self attendance')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSelfStatus()
  }, [])

  const todayDate = useMemo(() => {
    if (!data?.today) return new Date().toISOString().slice(0, 10)
    return data.today.slice(0, 10)
  }, [data?.today])

  async function handleCheckIn() {
    if (!data) return
    setSubmitting(true)
    setMessage(null)
    try {
      const now = new Date().toISOString()
      const response = await fetch('/api/v1/hr/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: data.employee.id,
          date: todayDate,
          status: 'PRESENT',
          checkIn: now,
          attendanceMode: 'OFFICE',
          attendanceSource: 'WEB',
        }),
      })
      const json = await response.json()
      if (!json.success) throw new Error(json.error?.message || 'Check-in failed')
      setMessage(t('attendance.checkedIn'))
      await loadSelfStatus()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Check-in failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCheckOut() {
    if (!data?.attendance) return
    setSubmitting(true)
    setMessage(null)
    try {
      const response = await fetch(`/api/v1/hr/attendance/${data.attendance.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkOut: new Date().toISOString(),
          status: 'PRESENT',
        }),
      })
      const json = await response.json()
      if (!json.success) throw new Error(json.error?.message || 'Check-out failed')
      setMessage(t('attendance.checkedOut'))
      await loadSelfStatus()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Check-out failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleStartMovement() {
    if (!data) return
    setSubmitting(true)
    setMessage(null)
    try {
      const response = await fetch('/api/v1/hr/attendance/movements/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: data.employee.id,
          movementType,
          purpose,
          destinationName,
          destinationAddress: destinationAddress || null,
          checkOutTime: new Date().toISOString(),
          expectedReturnTime: expectedReturnTime || null,
        }),
      })
      const json = await response.json()
      if (!json.success) throw new Error(json.error?.message || 'Movement start failed')
      setMessage(t('attendance.movementOpen'))
      setDestinationName('')
      setPurpose('')
      setDestinationAddress('')
      setExpectedReturnTime('')
      await loadSelfStatus()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Movement start failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEndMovement() {
    if (!data?.openMovement) return
    setSubmitting(true)
    setMessage(null)
    try {
      const response = await fetch(`/api/v1/hr/attendance/movements/${data.openMovement.id}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actualReturnTime: new Date().toISOString() }),
      })
      const json = await response.json()
      if (!json.success) throw new Error(json.error?.message || 'Movement return failed')
      setMessage(t('attendance.endMovement'))
      await loadSelfStatus()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Movement return failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-[320px] w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('attendance.title')}
        description={t('attendance.selfServiceDescription')}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t('attendance.todayStatus')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <p className="text-sm text-muted-foreground">{t('attendance.employeeName')}</p>
            <p className="font-medium">{data?.employee.fullName || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('attendance.status')}</p>
            <p className="font-medium">{data?.attendance?.status || t('attendance.notCheckedIn')}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('attendance.checkIn')}</p>
            <p className="font-medium">{formatDateTime(data?.attendance?.checkIn || null, locale)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('attendance.checkOut')}</p>
            <p className="font-medium">{formatDateTime(data?.attendance?.checkOut || null, locale)}</p>
          </div>
          {data?.openMovement && (
            <div className="md:col-span-4">
              <Badge variant="secondary">{t('attendance.movementOpen')}</Badge>
              <p className="mt-2 text-sm text-muted-foreground">
                {t(`movementTypes.${data.openMovement.movementType}`)} • {data.openMovement.destinationName} • {data.openMovement.purpose}
              </p>
            </div>
          )}
          {message && (
            <div className="md:col-span-4">
              <p className="text-sm text-primary">{message}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('attendance.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={handleCheckIn} disabled={submitting || !!data?.attendance}>
              {t('attendance.checkIn')}
            </Button>
            <Button
              variant="outline"
              onClick={handleCheckOut}
              disabled={submitting || !data?.attendance || !!data?.attendance.checkOut}
            >
              {t('attendance.checkOut')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('attendance.startMovement')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('attendance.movementType')}</Label>
              <Select value={movementType} onValueChange={setMovementType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOVEMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{t(`movementTypes.${type}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('attendance.destination')}</Label>
              <Input value={destinationName} onChange={(event) => setDestinationName(event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>{t('attendance.purpose')}</Label>
              <Input value={purpose} onChange={(event) => setPurpose(event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Destination Address</Label>
              <Input value={destinationAddress} onChange={(event) => setDestinationAddress(event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>{t('attendance.expectedReturnTime')}</Label>
              <Input type="datetime-local" value={expectedReturnTime} onChange={(event) => setExpectedReturnTime(event.target.value)} />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleStartMovement}
                disabled={submitting || !data?.attendance || !!data?.openMovement || !destinationName.trim() || !purpose.trim()}
              >
                {t('attendance.startMovement')}
              </Button>
              <Button
                variant="outline"
                onClick={handleEndMovement}
                disabled={submitting || !data?.openMovement}
              >
                {t('attendance.endMovement')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
