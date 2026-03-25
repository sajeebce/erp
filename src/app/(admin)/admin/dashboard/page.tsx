'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/shared/status-badge'
import { Building2, Users, CreditCard, Activity, TrendingUp, ShieldCheck } from 'lucide-react'

function getAdminToken(): string {
  return document.cookie
    .split('; ')
    .find(c => c.startsWith('superAdminToken='))
    ?.split('=')[1] || ''
}

function adminFetch(url: string) {
  return fetch(url, {
    headers: { Authorization: `Bearer ${getAdminToken()}` },
  }).then(r => {
    if (r.status === 401) {
      window.location.href = '/admin/login'
      throw new Error('Unauthorized')
    }
    return r.json()
  })
}

interface OrgSummary {
  id: string
  name: string
  slug: string
  isActive: boolean
  createdAt: string
  _count?: { users: number }
}

interface SubscriptionSummary {
  status: string
  count: number
}

interface DashboardStats {
  totalOrganizations: number
  activeOrganizations: number
  totalUsers: number
  totalRevenue: number
  trialOrgs: number
  activeSubscriptions: number
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentOrgs, setRecentOrgs] = useState<OrgSummary[]>([])
  const [subBreakdown, setSubBreakdown] = useState<SubscriptionSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [meRes, orgsRes, subsRes] = await Promise.all([
          adminFetch('/api/v1/admin/auth/me'),
          adminFetch('/api/v1/admin/organizations?limit=10&sort=createdAt:desc'),
          adminFetch('/api/v1/admin/subscriptions?limit=100'),
        ])

        // Derive stats from responses
        const orgs: OrgSummary[] = orgsRes.data || []
        const subs = subsRes.data || []

        const activeOrgs = orgs.filter((o: OrgSummary) => o.isActive).length
        const totalUsers = orgs.reduce((sum: number, o: OrgSummary) => sum + (o._count?.users || 0), 0)

        // Build subscription breakdown
        const statusMap: Record<string, number> = {}
        for (const sub of subs) {
          const s = sub.status || 'UNKNOWN'
          statusMap[s] = (statusMap[s] || 0) + 1
        }
        const breakdown = Object.entries(statusMap).map(([status, count]) => ({ status, count }))

        setStats({
          totalOrganizations: meRes.data?.totalOrganizations ?? orgs.length,
          activeOrganizations: meRes.data?.activeOrganizations ?? activeOrgs,
          totalUsers: meRes.data?.totalUsers ?? totalUsers,
          totalRevenue: meRes.data?.totalRevenue ?? 0,
          trialOrgs: statusMap['TRIAL'] || 0,
          activeSubscriptions: statusMap['ACTIVE'] || 0,
        })
        setRecentOrgs(orgs)
        setSubBreakdown(breakdown)
      } catch (err) {
        console.error('Failed to load admin dashboard', err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-20" /></CardContent></Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-64" /></CardContent></Card>
          ))}
        </div>
      </div>
    )
  }

  if (!stats) {
    return <div className="text-center py-10 text-muted-foreground">Failed to load dashboard</div>
  }

  const kpiCards = [
    { title: 'Total Organizations', value: String(stats.totalOrganizations), icon: Building2, color: 'text-blue-600' },
    { title: 'Active Organizations', value: String(stats.activeOrganizations), icon: ShieldCheck, color: 'text-emerald-600' },
    { title: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: Users, color: 'text-violet-600' },
    { title: 'Active Subscriptions', value: String(stats.activeSubscriptions), icon: CreditCard, color: 'text-teal-600' },
    { title: 'Trial Organizations', value: String(stats.trialOrgs), icon: Activity, color: 'text-amber-600' },
    { title: 'Total Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-indigo-600' },
  ]

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{kpi.title}</p>
                  <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                </div>
                <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center ${kpi.color}`}>
                  <kpi.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Organizations */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Organizations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrgs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No organizations yet</p>
              ) : recentOrgs.map((org) => (
                <div
                  key={org.id}
                  className="flex items-center justify-between border-b pb-2 last:border-0 cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2"
                  onClick={() => router.push(`/admin/organizations/${org.id}`)}
                >
                  <div>
                    <p className="text-sm font-medium">{org.name}</p>
                    <p className="text-xs text-muted-foreground">{org.slug} &bull; {org._count?.users || 0} users</p>
                  </div>
                  <StatusBadge status={org.isActive ? 'ACTIVE' : 'INACTIVE'} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Subscription Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Subscription Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No subscriptions yet</p>
              ) : subBreakdown.map((item) => (
                <div key={item.status} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <StatusBadge status={item.status} />
                  <span className="text-sm font-mono font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
