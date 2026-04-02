'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

interface Holiday {
  id: string
  date: string
  name: string
  localizedName?: string | Record<string, string> | null
  type: string
  description?: string | null
  isRecurring?: boolean
}

function getLocalizedName(localizedName: string | Record<string, string> | null | undefined): string | null {
  if (!localizedName) return null
  if (typeof localizedName === 'string') {
    try {
      const parsed = JSON.parse(localizedName)
      return parsed.bn || parsed.en || Object.values(parsed)[0] as string || null
    } catch {
      return localizedName
    }
  }
  return localizedName.bn || localizedName.en || Object.values(localizedName)[0] || null
}

interface HolidayCalendar {
  id: string
  name: string
  year: number
  isDefault?: boolean
  holidays?: Holiday[]
}

export default function HolidaysPage() {
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const router = useRouter()
  const { formatDate } = useFormatters()

  const [calendars, setCalendars] = useState<HolidayCalendar[]>([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())

  useEffect(() => {
    setLoading(true)
    fetch(`/api/v1/hr/holiday-calendars?year=${year}`)
      .then(res => res.json())
      .then(json => { if (json.success) setCalendars(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [year])

  const activeCalendar = calendars.find(c => c.isDefault) || calendars[0]
  const holidays = activeCalendar?.holidays || []

  // Group holidays by month
  const holidaysByMonth = holidays.reduce((acc, h) => {
    const month = new Date(h.date).toLocaleString('default', { month: 'long' })
    if (!acc[month]) acc[month] = []
    acc[month].push(h)
    return acc
  }, {} as Record<string, Holiday[]>)

  function getTypeBadgeVariant(type: string): 'default' | 'secondary' | 'outline' | 'destructive' {
    switch (type) {
      case 'PUBLIC': return 'default'
      case 'ORGANIZATIONAL': return 'secondary'
      case 'RESTRICTED': return 'outline'
      case 'OPTIONAL': return 'outline'
      default: return 'secondary'
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('holidays.title')} description={t('holidays.description')}>
        <Button size="sm" onClick={() => { if (activeCalendar) router.push(`/hr/holidays/${activeCalendar.id}`) }}>
          <Plus className="h-4 w-4 mr-2" />{t('holidays.newCalendar')}
        </Button>
      </PageHeader>

      {/* Year Selector */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" size="sm" onClick={() => setYear(y => y - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xl font-bold">{year}</span>
        <Button variant="outline" size="sm" onClick={() => setYear(y => y + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('holidays.totalHolidays')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{holidays.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('holidays.publicHolidays')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{holidays.filter(h => h.type === 'PUBLIC').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('holidays.upcomingHolidays')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{holidays.filter(h => new Date(h.date) >= new Date()).length}</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {tc('labels.loading')}
          </CardContent>
        </Card>
      ) : holidays.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {tc('labels.noData')}
          </CardContent>
        </Card>
      ) : (
        Object.entries(holidaysByMonth).map(([month, monthHolidays]) => (
          <Card key={month}>
            <CardHeader>
              <CardTitle className="text-lg">{month}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {monthHolidays.map(holiday => (
                  <div key={holiday.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="w-16 text-center">
                      <span className="text-2xl font-bold">{new Date(holiday.date).getDate()}</span>
                      <p className="text-xs text-muted-foreground">
                        {new Date(holiday.date).toLocaleString('default', { weekday: 'short' })}
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{holiday.name}</p>
                      {getLocalizedName(holiday.localizedName) && <p className="text-xs text-muted-foreground">{getLocalizedName(holiday.localizedName)}</p>}
                      {holiday.description && <p className="text-xs text-muted-foreground mt-1">{holiday.description}</p>}
                    </div>
                    <Badge variant={getTypeBadgeVariant(holiday.type)}>{t(`holidays.types.${holiday.type}`)}</Badge>
                    {holiday.isRecurring && <Badge variant="outline">{t('holidays.fields.isRecurring')}</Badge>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Calendar List */}
      {calendars.length > 1 && (
        <Card>
          <CardHeader><CardTitle>All Calendars</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {calendars.map(cal => (
                <button
                  key={cal.id}
                  onClick={() => router.push(`/hr/holidays/${cal.id}`)}
                  className="flex items-center justify-between w-full p-3 border rounded-lg hover:bg-muted/50 transition-colors text-left"
                >
                  <div>
                    <p className="font-medium text-sm">{cal.name}</p>
                    <p className="text-xs text-muted-foreground">{cal.year} - {(cal.holidays || []).length} holidays</p>
                  </div>
                  {cal.isDefault && <StatusBadge status="ACTIVE" />}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
