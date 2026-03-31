'use client'

import { useEffect, useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface LeaveEntry {
  employeeId: string
  employeeName: string
  department: string
  leaveType: string
  startDate: string
  endDate: string
  status: string
}

interface CalendarData {
  employees: {
    id: string
    name: string
    department: string
    leaves: LeaveEntry[]
  }[]
  holidays: { date: string; name: string }[]
  departments: string[]
  coverage: { date: string; presencePercent: number }[]
}

const LEAVE_TYPE_COLORS: Record<string, string> = {
  ANNUAL: 'bg-blue-400',
  SICK: 'bg-red-400',
  CASUAL: 'bg-amber-400',
  MATERNITY: 'bg-pink-400',
  PATERNITY: 'bg-indigo-400',
  COMPENSATORY: 'bg-teal-400',
  UNPAID: 'bg-gray-400',
  STUDY: 'bg-purple-400',
  SPECIAL: 'bg-orange-400',
  EARNED: 'bg-emerald-400',
}

function getLeaveColor(leaveType: string): string {
  return LEAVE_TYPE_COLORS[leaveType] || 'bg-violet-400'
}

function getCoverageColor(percent: number): string {
  if (percent > 80) return 'bg-emerald-500'
  if (percent >= 50) return 'bg-amber-500'
  return 'bg-red-500'
}

function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate()
}

function isWeekend(year: number, month: number, day: number): boolean {
  const dow = new Date(year, month - 1, day).getDay()
  return dow === 0 || dow === 6
}

export default function LeaveCalendarPage() {
  const t = useTranslations('hr')
  const tc = useTranslations('common')

  const now = new Date()
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1)
  const [currentYear, setCurrentYear] = useState(now.getFullYear())
  const [data, setData] = useState<CalendarData | null>(null)
  const [loading, setLoading] = useState(true)
  const [department, setDepartment] = useState<string>('ALL')
  const [teamFilter, setTeamFilter] = useState<'MY_TEAM' | 'ALL'>('ALL')

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({
      month: String(currentMonth),
      year: String(currentYear),
    })
    if (department !== 'ALL') params.set('department', department)
    if (teamFilter === 'MY_TEAM') params.set('scope', 'my-team')

    fetch(`/api/v1/hr/leave/calendar?${params}`)
      .then(res => res.json())
      .then(json => { if (json.success) setData(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [currentMonth, currentYear, department, teamFilter])

  const daysInMonth = getDaysInMonth(currentMonth, currentYear)
  const dayNumbers = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  const holidayDates = useMemo(() => {
    if (!data?.holidays) return new Set<number>()
    return new Set(
      data.holidays
        .map(h => {
          const d = new Date(h.date)
          if (d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear) return d.getDate()
          return null
        })
        .filter(Boolean) as number[]
    )
  }, [data?.holidays, currentMonth, currentYear])

  const coverageMap = useMemo(() => {
    const map: Record<number, number> = {}
    data?.coverage?.forEach(c => {
      const d = new Date(c.date)
      if (d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear) {
        map[d.getDate()] = c.presencePercent
      }
    })
    return map
  }, [data?.coverage, currentMonth, currentYear])

  function prevMonth() {
    if (currentMonth === 1) {
      setCurrentMonth(12)
      setCurrentYear(y => y - 1)
    } else {
      setCurrentMonth(m => m - 1)
    }
  }

  function nextMonth() {
    if (currentMonth === 12) {
      setCurrentMonth(1)
      setCurrentYear(y => y + 1)
    } else {
      setCurrentMonth(m => m + 1)
    }
  }

  const monthName = new Date(currentYear, currentMonth - 1).toLocaleString('en', { month: 'long' })

  function getEmployeeLeaveForDay(leaves: LeaveEntry[], day: number): LeaveEntry | null {
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return leaves.find(l => {
      const start = l.startDate.slice(0, 10)
      const end = l.endDate.slice(0, 10)
      return dateStr >= start && dateStr <= end
    }) || null
  }

  function isLeaveStart(leaves: LeaveEntry[], day: number): boolean {
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return leaves.some(l => l.startDate.slice(0, 10) === dateStr)
  }

  function isLeaveEnd(leaves: LeaveEntry[], day: number): boolean {
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return leaves.some(l => l.endDate.slice(0, 10) === dateStr)
  }

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[400px]" />
      </div>
    )
  }

  const employees = data?.employees || []

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('leaveCalendar.title')}
        description={t('leaveCalendar.description')}
      />

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold min-w-[140px] text-center">
            {monthName} {currentYear}
          </span>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Select value={department} onValueChange={setDepartment}>
          <SelectTrigger className="w-[180px]" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{tc('labels.all')} Departments</SelectItem>
            {(data?.departments || []).map(d => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex rounded-md border overflow-hidden">
          <button
            onClick={() => setTeamFilter('MY_TEAM')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              teamFilter === 'MY_TEAM'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background hover:bg-muted'
            }`}
          >
            {t('leaveCalendar.myTeam')}
          </button>
          <button
            onClick={() => setTeamFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              teamFilter === 'ALL'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background hover:bg-muted'
            }`}
          >
            {t('leaveCalendar.allTeams')}
          </button>
        </div>

        {loading && <span className="text-xs text-muted-foreground animate-pulse">Loading...</span>}
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs border-collapse min-w-[900px]">
            <thead>
              <tr>
                <th className="sticky left-0 bg-card z-10 text-left px-3 py-2 border-b border-r font-semibold min-w-[180px]">
                  Employee
                </th>
                {dayNumbers.map(day => {
                  const we = isWeekend(currentYear, currentMonth, day)
                  const hol = holidayDates.has(day)
                  return (
                    <th
                      key={day}
                      className={`px-0 py-2 border-b text-center font-medium w-[28px] min-w-[28px] ${
                        hol ? 'bg-sky-50 dark:bg-sky-950/30' : we ? 'bg-gray-100 dark:bg-gray-800/40' : ''
                      }`}
                    >
                      {day}
                    </th>
                  )
                })}
              </tr>

              {/* Coverage row */}
              <tr>
                <td className="sticky left-0 bg-card z-10 px-3 py-1.5 border-b border-r font-semibold text-muted-foreground">
                  {t('leaveCalendar.coverage')}
                </td>
                {dayNumbers.map(day => {
                  const pct = coverageMap[day]
                  const we = isWeekend(currentYear, currentMonth, day)
                  const hol = holidayDates.has(day)
                  if (we || hol) {
                    return (
                      <td key={day} className={`border-b text-center ${hol ? 'bg-sky-50 dark:bg-sky-950/30' : 'bg-gray-100 dark:bg-gray-800/40'}`}>
                        <div className="w-full h-4" />
                      </td>
                    )
                  }
                  return (
                    <td key={day} className="border-b px-0" title={pct != null ? `${pct}% present` : undefined}>
                      <div className="flex justify-center">
                        <div className={`w-4 h-4 rounded-sm ${pct != null ? getCoverageColor(pct) : 'bg-muted'}`} />
                      </div>
                    </td>
                  )
                })}
              </tr>
            </thead>

            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={daysInMonth + 1} className="text-center py-8 text-muted-foreground">
                    {t('leaveCalendar.noLeaves')}
                  </td>
                </tr>
              ) : (
                employees.map(emp => (
                  <tr key={emp.id} className="hover:bg-muted/30 transition-colors">
                    <td className="sticky left-0 bg-card z-10 px-3 py-1.5 border-b border-r">
                      <div className="font-medium truncate max-w-[160px]">{emp.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{emp.department}</div>
                    </td>
                    {dayNumbers.map(day => {
                      const we = isWeekend(currentYear, currentMonth, day)
                      const hol = holidayDates.has(day)
                      const leave = getEmployeeLeaveForDay(emp.leaves, day)
                      const start = leave ? isLeaveStart(emp.leaves, day) : false
                      const end = leave ? isLeaveEnd(emp.leaves, day) : false

                      let cellBg = ''
                      if (hol) cellBg = 'bg-sky-50 dark:bg-sky-950/30'
                      else if (we) cellBg = 'bg-gray-100 dark:bg-gray-800/40'

                      return (
                        <td key={day} className={`border-b px-0 ${cellBg}`}>
                          {leave ? (
                            <div
                              className={`h-5 mx-0 ${getLeaveColor(leave.leaveType)} ${
                                leave.status === 'PENDING' ? 'opacity-50 border border-dashed border-current' : 'opacity-85'
                              } ${start ? 'rounded-l-sm ml-0.5' : ''} ${end ? 'rounded-r-sm mr-0.5' : ''}`}
                              title={`${leave.leaveType} | ${new Date(leave.startDate).toLocaleDateString()} - ${new Date(leave.endDate).toLocaleDateString()} | ${leave.status}`}
                            />
                          ) : (
                            <div className="h-5" />
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t('leaveCalendar.legend')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-xs">
            {Object.entries(LEAVE_TYPE_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div className={`w-4 h-3 rounded-sm ${color}`} />
                <span>{type.charAt(0) + type.slice(1).toLowerCase()}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-3 rounded-sm bg-gray-200 dark:bg-gray-700" />
              <span>{t('leaveCalendar.weekend')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-3 rounded-sm bg-sky-200 dark:bg-sky-900" />
              <span>{t('leaveCalendar.holiday')}</span>
            </div>
            <div className="flex items-center gap-1.5 ml-4 border-l pl-4">
              <div className="w-4 h-3 rounded-sm bg-emerald-500" />
              <span>&gt;80%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-3 rounded-sm bg-amber-500" />
              <span>50-80%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-3 rounded-sm bg-red-500" />
              <span>&lt;50%</span>
            </div>
            <div className="flex items-center gap-1.5 ml-4 border-l pl-4">
              <div className="w-4 h-3 rounded-sm bg-blue-400 opacity-50 border border-dashed" />
              <span>{t('leaveCalendar.pending')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-3 rounded-sm bg-blue-400 opacity-85" />
              <span>{t('leaveCalendar.approved')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
