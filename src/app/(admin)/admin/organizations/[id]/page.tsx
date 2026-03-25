'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { Skeleton } from '@/components/ui/skeleton'

function getAdminToken(): string {
  return document.cookie
    .split('; ')
    .find(c => c.startsWith('superAdminToken='))
    ?.split('=')[1] || ''
}

function adminFetch(url: string, options?: RequestInit) {
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${getAdminToken()}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  }).then(r => {
    if (r.status === 401) {
      window.location.href = '/admin/login'
      throw new Error('Unauthorized')
    }
    return r.json()
  })
}

interface OrgDetail {
  id: string
  name: string
  slug: string
  address: string
  district: string
  phone: string
  email: string
  currency: string
  timezone: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: { users: number; projects: number }
  subscription?: {
    id: string
    status: string
    plan: { name: string; priceMonthly: number }
    billingCycle: string
    currentPeriodStart: string
    currentPeriodEnd: string
  }
}

const fieldLabels: Record<string, string> = {
  name: 'Organization Name',
  slug: 'Slug',
  address: 'Address',
  district: 'District',
  phone: 'Phone',
  email: 'Email',
  currency: 'Currency',
  timezone: 'Timezone',
  createdAt: 'Created',
  updatedAt: 'Last Updated',
}

export default function AdminOrganizationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [org, setOrg] = useState<OrgDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const orgId = params.id as string

  useEffect(() => {
    adminFetch(`/api/v1/admin/organizations/${orgId}`)
      .then(json => { if (json.success) setOrg(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [orgId])

  async function handleToggleActive() {
    if (!org) return
    setActionLoading(true)
    try {
      const res = await adminFetch(`/api/v1/admin/organizations/${orgId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !org.isActive }),
      })
      if (res.success) {
        setOrg(prev => prev ? { ...prev, isActive: !prev.isActive } : prev)
      }
    } catch (err) {
      console.error('Failed to toggle organization status', err)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Organization Detail" description="Loading..." />
        <Card>
          <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!org) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => router.push('/admin/organizations')}>
          <ArrowLeft className="h-4 w-4 mr-2" />Back to Organizations
        </Button>
        <div className="text-center py-10 text-muted-foreground">Organization not found</div>
      </div>
    )
  }

  function formatDate(val: string) {
    return new Date(val).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const displayFields = ['name', 'slug', 'address', 'district', 'phone', 'email', 'currency', 'timezone', 'createdAt', 'updatedAt'] as const

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.push('/admin/organizations')}>
          <ArrowLeft className="h-4 w-4 mr-2" />Back
        </Button>
      </div>

      <PageHeader title={org.name} description={`${org.slug} &bull; ${org._count?.users || 0} users &bull; ${org._count?.projects || 0} projects`}>
        <div className="flex items-center gap-2">
          <StatusBadge status={org.isActive ? 'ACTIVE' : 'INACTIVE'} />
          <Button
            size="sm"
            variant={org.isActive ? 'destructive' : 'default'}
            onClick={handleToggleActive}
            disabled={actionLoading}
          >
            {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {org.isActive ? 'Suspend' : 'Activate'}
          </Button>
        </div>
      </PageHeader>

      {/* Organization Info */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {displayFields.map((field) => (
              <div key={field} className="flex justify-between items-center py-2 border-b last:border-0">
                <span className="text-sm text-muted-foreground">{fieldLabels[field]}</span>
                <span className="text-sm font-medium text-right max-w-[60%]">
                  {field === 'createdAt' || field === 'updatedAt'
                    ? formatDate(org[field])
                    : String(org[field] ?? '\u2014')}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Subscription Info */}
      {org.subscription && (
        <Card>
          <CardHeader>
            <CardTitle>Subscription Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">Plan</span>
                <span className="text-sm font-medium">{org.subscription.plan.name}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">Status</span>
                <StatusBadge status={org.subscription.status} />
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">Billing Cycle</span>
                <span className="text-sm font-medium capitalize">{org.subscription.billingCycle?.toLowerCase()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">Monthly Price</span>
                <span className="text-sm font-mono font-medium">${org.subscription.plan.priceMonthly}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">Current Period Start</span>
                <span className="text-sm font-medium">{formatDate(org.subscription.currentPeriodStart)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Current Period End</span>
                <span className="text-sm font-medium">{formatDate(org.subscription.currentPeriodEnd)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
