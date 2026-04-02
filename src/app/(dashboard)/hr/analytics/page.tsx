'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/page-header'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#d884d8']

interface AnalyticsData {
  totalEmployees: number
  newHires: number
  exits: number
  expiringContracts: number
  pendingGrievances: number
  genderDistribution: { name: string; value: number }[]
  departmentDistribution: { name: string; value: number }[]
  employmentTypeDistribution: { name: string; value: number }[]
}

export default function HRAnalyticsPage() {
  const t = useTranslations('hr')
  const tc = useTranslations('common')

  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/hr/analytics/overview')
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          const d = json.data
          setData({
            totalEmployees: d.totalActiveEmployees ?? 0,
            newHires: d.newHiresThisMonth ?? 0,
            exits: d.exitsThisMonth ?? 0,
            expiringContracts: d.expiringContracts ?? 0,
            pendingGrievances: d.pendingGrievances ?? 0,
            genderDistribution: (d.genderDistribution ?? []).map((g: { gender: string; count: number }) => ({ name: g.gender, value: g.count })),
            departmentDistribution: (d.departmentDistribution ?? []).map((dep: { departmentName: string; count: number }) => ({ name: dep.departmentName, value: dep.count })),
            employmentTypeDistribution: (d.employmentTypeDistribution ?? []).map((e: { type: string; count: number }) => ({ name: e.type, value: e.count })),
          })
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const analytics = data || {
    totalEmployees: 0,
    newHires: 0,
    exits: 0,
    expiringContracts: 0,
    pendingGrievances: 0,
    genderDistribution: [],
    departmentDistribution: [],
    employmentTypeDistribution: [],
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('analytics.title')} description={t('analytics.description')} />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('analytics.totalEmployees')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{analytics.totalEmployees}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('analytics.newHires')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{analytics.newHires}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('analytics.exitsThisMonth')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{analytics.exits}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('analytics.expiringContracts')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{analytics.expiringContracts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('analytics.pendingGrievances')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{analytics.pendingGrievances}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gender Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.genderDistribution')}</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.genderDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.genderDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.genderDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-75 text-muted-foreground text-sm">
                {tc('labels.noData')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Employment Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.employmentTypeDistribution')}</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.employmentTypeDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.employmentTypeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.employmentTypeDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-75 text-muted-foreground text-sm">
                {tc('labels.noData')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Department Distribution */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{t('analytics.departmentDistribution')}</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.departmentDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={analytics.departmentDistribution}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0088FE" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-100 text-muted-foreground text-sm">
                {tc('labels.noData')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
