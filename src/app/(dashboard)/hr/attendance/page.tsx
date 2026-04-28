'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Download } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
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
import { formatPercent } from '@/lib/formatters'

interface DepartmentOption {
  id: string
  name: string
}

interface EmployeeOption {
  id: string
  fullName: string
  departmentId: string
}

interface OperatingLocationOption {
  id: string
  code: string
  name: string
}

interface AttendanceSummaryRow {
  employeeId: string
  employeeNo: string
  fullName: string
  departmentId: string
  departmentName: string
  workingDays: number
  present: number
  absent: number
  late: number
  onLeave: number
  halfDay: number
  totalOtHours: number
  totalRecords: number
  attendancePercent: number
}

interface AttendanceLogRow {
  id: string
  date: string
  status: string
  checkIn: string | null
  checkOut: string | null
  attendanceMode: string | null
  validationStatus: string | null
  geoAddress: string | null
  employee: {
    id: string
    fullName: string
    department: { id: string; name: string } | null
  }
  operatingLocation: { id: string; code: string; name: string } | null
}

const ATTENDANCE_MODES = ['ALL', 'OFFICE', 'FIELD', 'BRANCH_VISIT'] as const
const VALIDATION_STATUSES = ['ALL', 'VALID', 'PENDING', 'OUT_OF_GEOFENCE', 'MANUAL_OVERRIDE'] as const

function getAttendanceBadge(percent: number): 'default' | 'secondary' | 'destructive' {
  if (percent >= 95) return 'default'
  if (percent >= 85) return 'secondary'
  return 'destructive'
}

function getDefaultMonthValue(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function formatDateTime(value: string | null, locale: string): string {
  if (!value) return '-'
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default function AttendancePage() {
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const locale = useLocale()

  const [monthValue, setMonthValue] = useState(getDefaultMonthValue)
  const [departmentId, setDepartmentId] = useState<string>('ALL')
  const [employeeId, setEmployeeId] = useState<string>('ALL')
  const [attendanceMode, setAttendanceMode] = useState<string>('ALL')
  const [validationStatus, setValidationStatus] = useState<string>('ALL')
  const [operatingLocationId, setOperatingLocationId] = useState<string>('ALL')
  const [departments, setDepartments] = useState<DepartmentOption[]>([])
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [locations, setLocations] = useState<OperatingLocationOption[]>([])
  const [summary, setSummary] = useState<AttendanceSummaryRow[]>([])
  const [logs, setLogs] = useState<AttendanceLogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [bootstrapping, setBootstrapping] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const filteredEmployees = useMemo(() => (
    departmentId === 'ALL'
      ? employees
      : employees.filter((employee) => employee.departmentId === departmentId)
  ), [departmentId, employees])

  useEffect(() => {
    async function fetchLookups() {
      try {
        const [departmentsRes, employeesRes, locationsRes] = await Promise.all([
          fetch('/api/v1/hr/departments'),
          fetch('/api/v1/hr/employees?status=ACTIVE&limit=100'),
          fetch('/api/v1/settings/operating-locations?isActive=true'),
        ])

        const departmentsJson = await departmentsRes.json()
        const employeesJson = await employeesRes.json()
        const locationsJson = await locationsRes.json()

        if (departmentsJson.success) {
          setDepartments(departmentsJson.data.map((department: { id: string; name: string }) => ({
            id: department.id,
            name: department.name,
          })))
        }

        if (employeesJson.success) {
          setEmployees(employeesJson.data.map((employee: { id: string; fullName: string; departmentId: string }) => ({
            id: employee.id,
            fullName: employee.fullName,
            departmentId: employee.departmentId,
          })))
        }

        if (locationsJson.success) {
          setLocations(locationsJson.data.map((location: { id: string; code: string; name: string }) => ({
            id: location.id,
            code: location.code,
            name: location.name,
          })))
        }
      } catch (lookupError) {
        console.error(lookupError)
        setError('Failed to load attendance filters')
      } finally {
        setBootstrapping(false)
      }
    }

    fetchLookups()
  }, [])

  useEffect(() => {
    if (departmentId !== 'ALL' && employeeId !== 'ALL') {
      const employeeStillVisible = filteredEmployees.some((employee) => employee.id === employeeId)
      if (!employeeStillVisible) setEmployeeId('ALL')
    }
  }, [departmentId, employeeId, filteredEmployees])

  useEffect(() => {
    if (!monthValue) return

    async function fetchData() {
      setLoading(true)
      setError(null)

      try {
        const [year, month] = monthValue.split('-')
        const summaryParams = new URLSearchParams({ month, year })
        const logParams = new URLSearchParams({ month, year, limit: '200' })

        if (departmentId !== 'ALL') {
          summaryParams.set('departmentId', departmentId)
          logParams.set('departmentId', departmentId)
        }
        if (employeeId !== 'ALL') {
          summaryParams.set('employeeId', employeeId)
          logParams.set('employeeId', employeeId)
        }
        if (attendanceMode !== 'ALL') logParams.set('attendanceMode', attendanceMode)
        if (validationStatus !== 'ALL') logParams.set('validationStatus', validationStatus)
        if (operatingLocationId !== 'ALL') logParams.set('operatingLocationId', operatingLocationId)

        const [summaryRes, logsRes] = await Promise.all([
          fetch(`/api/v1/hr/attendance/summary?${summaryParams.toString()}`),
          fetch(`/api/v1/hr/attendance?${logParams.toString()}`),
        ])

        const summaryJson = await summaryRes.json()
        const logsJson = await logsRes.json()

        if (!summaryJson.success) {
          throw new Error(summaryJson.error?.message || 'Failed to load attendance summary')
        }
        if (!logsJson.success) {
          throw new Error(logsJson.error?.message || 'Failed to load attendance logs')
        }

        setSummary(summaryJson.data.summary)
        setLogs(logsJson.data)
      } catch (fetchError) {
        console.error(fetchError)
        setSummary([])
        setLogs([])
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load attendance data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [monthValue, departmentId, employeeId, attendanceMode, validationStatus, operatingLocationId])

  const totalEmployees = summary.length
  const avgAttendance = totalEmployees > 0
    ? summary.reduce((sum, row) => sum + row.attendancePercent, 0) / totalEmployees
    : 0
  const branchVisitCount = logs.filter((log) => log.attendanceMode === 'BRANCH_VISIT').length
  const fieldLogCount = logs.filter((log) => log.attendanceMode === 'FIELD').length

  if (bootstrapping) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-[420px] w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('attendance.title')}
        description={t('attendance.description')}
      >
        <Button variant="outline" size="sm" disabled>
          <Download className="mr-2 h-4 w-4" />
          {tc('buttons.export')}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Input type="month" value={monthValue} onChange={(event) => setMonthValue(event.target.value)} />

        <Select value={departmentId} onValueChange={setDepartmentId}>
          <SelectTrigger><SelectValue placeholder={t('attendance.department')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{tc('labels.all')} {t('attendance.department')}</SelectItem>
            {departments.map((department) => (
              <SelectItem key={department.id} value={department.id}>{department.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={employeeId} onValueChange={setEmployeeId}>
          <SelectTrigger><SelectValue placeholder={t('attendance.employeeName')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{tc('labels.all')} {t('attendance.employeeName')}</SelectItem>
            {filteredEmployees.map((employee) => (
              <SelectItem key={employee.id} value={employee.id}>{employee.fullName}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={attendanceMode} onValueChange={setAttendanceMode}>
          <SelectTrigger><SelectValue placeholder={t('attendance.mode')} /></SelectTrigger>
          <SelectContent>
            {ATTENDANCE_MODES.map((mode) => (
              <SelectItem key={mode} value={mode}>
                {mode === 'ALL' ? `${tc('labels.all')} ${t('attendance.mode')}` : mode}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={validationStatus} onValueChange={setValidationStatus}>
          <SelectTrigger><SelectValue placeholder="Validation" /></SelectTrigger>
          <SelectContent>
            {VALIDATION_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status === 'ALL' ? `${tc('labels.all')} Validation` : status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={operatingLocationId} onValueChange={setOperatingLocationId}>
          <SelectTrigger><SelectValue placeholder={t('attendance.location')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{tc('labels.all')} {t('attendance.location')}</SelectItem>
            {locations.map((location) => (
              <SelectItem key={location.id} value={location.id}>{location.code} - {location.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t('attendance.totalEmployees')}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{totalEmployees}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t('attendance.avgAttendance')}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{formatPercent(avgAttendance, locale)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Field Logs</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{fieldLogCount}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Branch Visit Logs</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{branchVisitCount}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>{t('attendance.monthlyAttendanceRegister')}</CardTitle></CardHeader>
        <CardContent>
          {error ? <p className="text-sm text-destructive">{error}</p> : loading ? <Skeleton className="h-[320px] w-full" /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('attendance.employeeName')}</TableHead>
                  <TableHead>{t('attendance.department')}</TableHead>
                  <TableHead className="text-right">{t('attendance.workingDays')}</TableHead>
                  <TableHead className="text-right">{t('attendance.present')}</TableHead>
                  <TableHead className="text-right">{t('attendance.absent')}</TableHead>
                  <TableHead className="text-right">{t('attendance.late')}</TableHead>
                  <TableHead className="text-right">{t('attendance.leave')}</TableHead>
                  <TableHead className="text-right">{t('attendance.otHours')}</TableHead>
                  <TableHead className="text-right">{t('attendance.attendancePercent')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">No attendance summary found for the selected filters.</TableCell></TableRow>
                ) : summary.map((record) => (
                  <TableRow key={record.employeeId}>
                    <TableCell className="font-medium">{record.fullName}</TableCell>
                    <TableCell>{record.departmentName}</TableCell>
                    <TableCell className="text-right">{record.workingDays}</TableCell>
                    <TableCell className="text-right">{record.present}</TableCell>
                    <TableCell className="text-right">{record.absent > 0 ? <span className="font-medium text-destructive">{record.absent}</span> : record.absent}</TableCell>
                    <TableCell className="text-right">{record.late > 0 ? <span className="font-medium text-orange-600">{record.late}</span> : record.late}</TableCell>
                    <TableCell className="text-right">{record.onLeave}</TableCell>
                    <TableCell className="text-right font-mono">{record.totalOtHours}</TableCell>
                    <TableCell className="text-right"><Badge variant={getAttendanceBadge(record.attendancePercent)}>{formatPercent(record.attendancePercent, locale)}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Attendance Detail Log</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-[320px] w-full" /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('attendance.date')}</TableHead>
                  <TableHead>{t('attendance.employeeName')}</TableHead>
                  <TableHead>{t('attendance.mode')}</TableHead>
                  <TableHead>{t('attendance.location')}</TableHead>
                  <TableHead>{t('attendance.checkIn')}</TableHead>
                  <TableHead>{t('attendance.checkOut')}</TableHead>
                  <TableHead>Validation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No attendance logs found for the selected filters.</TableCell></TableRow>
                ) : logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{formatDateTime(log.date, locale)}</TableCell>
                    <TableCell className="font-medium">{log.employee.fullName}</TableCell>
                    <TableCell><Badge variant="outline">{log.attendanceMode || 'OFFICE'}</Badge></TableCell>
                    <TableCell>
                      <div>
                        <p>{log.operatingLocation ? `${log.operatingLocation.code} - ${log.operatingLocation.name}` : log.geoAddress || '-'}</p>
                        {log.operatingLocation && log.geoAddress && <p className="text-xs text-muted-foreground">{log.geoAddress}</p>}
                      </div>
                    </TableCell>
                    <TableCell>{formatDateTime(log.checkIn, locale)}</TableCell>
                    <TableCell>{formatDateTime(log.checkOut, locale)}</TableCell>
                    <TableCell><Badge variant={log.validationStatus === 'VALID' ? 'default' : 'secondary'}>{log.validationStatus || 'PENDING'}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
