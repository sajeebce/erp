'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface EmployeeOption {
  id: string
  fullName: string
}

interface MovementRecord {
  id: string
  movementType: string
  purpose: string
  destinationName: string
  checkOutTime: string
  expectedReturnTime: string | null
  actualReturnTime: string | null
  status: string
  employee: {
    id: string
    fullName: string
    employeeNo: string
    department: { id: string; name: string } | null
  }
}

function formatDateTime(value: string | null, locale: string): string {
  if (!value) return '-'
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatDuration(start: string, end: string | null): string {
  if (!end) return 'In progress'
  const diffMs = new Date(end).getTime() - new Date(start).getTime()
  if (diffMs <= 0) return '0m'
  const totalMinutes = Math.floor(diffMs / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes}m`
  return `${hours}h ${minutes}m`
}

function getDefaultMonthValue(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export default function AttendanceMovementsPage() {
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const locale = useLocale()

  const [monthValue, setMonthValue] = useState(getDefaultMonthValue)
  const [status, setStatus] = useState<string>('ALL')
  const [employeeId, setEmployeeId] = useState<string>('ALL')
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [movements, setMovements] = useState<MovementRecord[]>([])
  const [openMovements, setOpenMovements] = useState<MovementRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [bootstrapping, setBootstrapping] = useState(true)

  useEffect(() => {
    async function fetchLookups() {
      try {
        const employeeRes = await fetch('/api/v1/hr/employees?status=ACTIVE&limit=100')
        const employeeJson = await employeeRes.json()
        if (employeeJson.success) {
          setEmployees(employeeJson.data.map((employee: { id: string; fullName: string }) => ({
            id: employee.id,
            fullName: employee.fullName,
          })))
        }
      } catch (error) {
        console.error(error)
      } finally {
        setBootstrapping(false)
      }
    }

    fetchLookups()
  }, [])

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (monthValue) params.set('month', monthValue)
        if (status !== 'ALL') params.set('status', status)
        if (employeeId !== 'ALL') params.set('employeeId', employeeId)

        const openParams = new URLSearchParams()
        if (employeeId !== 'ALL') openParams.set('employeeId', employeeId)

        const [movementRes, openRes] = await Promise.all([
          fetch(`/api/v1/hr/attendance/movements?${params.toString()}`),
          fetch(`/api/v1/hr/attendance/movements/open?${openParams.toString()}`),
        ])

        const movementJson = await movementRes.json()
        const openJson = await openRes.json()

        setMovements(movementJson.success ? movementJson.data : [])
        setOpenMovements(openJson.success ? openJson.data : [])
      } catch (error) {
        console.error(error)
        setMovements([])
        setOpenMovements([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [monthValue, status, employeeId])

  const openCount = openMovements.length
  const returnedCount = useMemo(() => movements.filter((movement) => movement.status === 'RETURNED').length, [movements])

  if (bootstrapping) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-60" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-[380px] w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('attendance.movementRegister')}
        description={t('attendance.supervisorVisibility')}
      >
        <Button variant="outline" size="sm" disabled>{tc('buttons.export')}</Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('attendance.openMovements')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{openCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Returned This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{returnedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Selected Month</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{monthValue}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('attendance.supervisorVisibility')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {openMovements.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('attendance.noMovements')}</p>
          ) : (
            openMovements.map((movement) => (
              <div key={movement.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">{movement.employee.fullName}</p>
                  <p className="text-sm text-muted-foreground">
                    {t(`movementTypes.${movement.movementType}`)} • {movement.destinationName}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <Badge>{movement.status}</Badge>
                  <p className="mt-1 text-muted-foreground">{formatDateTime(movement.checkOutTime, locale)}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Input type="month" value={monthValue} onChange={(event) => setMonthValue(event.target.value)} />

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue placeholder={tc('labels.status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{tc('labels.all')} {tc('labels.status')}</SelectItem>
            <SelectItem value="OPEN">OPEN</SelectItem>
            <SelectItem value="RETURNED">RETURNED</SelectItem>
            <SelectItem value="CANCELLED">CANCELLED</SelectItem>
          </SelectContent>
        </Select>

        <Select value={employeeId} onValueChange={setEmployeeId}>
          <SelectTrigger>
            <SelectValue placeholder={t('attendance.employeeName')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{tc('labels.all')} {t('attendance.employeeName')}</SelectItem>
            {employees.map((employee) => (
              <SelectItem key={employee.id} value={employee.id}>{employee.fullName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('attendance.movementRegister')}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[320px] w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('attendance.employeeName')}</TableHead>
                  <TableHead>{t('attendance.movementType')}</TableHead>
                  <TableHead>{t('attendance.destination')}</TableHead>
                  <TableHead>{t('attendance.checkOut')}</TableHead>
                  <TableHead>{t('attendance.returnTime')}</TableHead>
                  <TableHead>{t('attendance.duration')}</TableHead>
                  <TableHead>{tc('labels.status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      {t('attendance.noMovements')}
                    </TableCell>
                  </TableRow>
                ) : (
                  movements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell className="font-medium">{movement.employee.fullName}</TableCell>
                      <TableCell>{t(`movementTypes.${movement.movementType}`)}</TableCell>
                      <TableCell>
                        <div>
                          <p>{movement.destinationName}</p>
                          <p className="text-xs text-muted-foreground">{movement.purpose}</p>
                        </div>
                      </TableCell>
                      <TableCell>{formatDateTime(movement.checkOutTime, locale)}</TableCell>
                      <TableCell>{formatDateTime(movement.actualReturnTime, locale)}</TableCell>
                      <TableCell>{formatDuration(movement.checkOutTime, movement.actualReturnTime)}</TableCell>
                      <TableCell><Badge variant={movement.status === 'OPEN' ? 'secondary' : 'default'}>{movement.status}</Badge></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
