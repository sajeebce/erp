'use client'

import { useEffect, useState } from 'react'
import { Edit, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/page-header'
import { Skeleton } from '@/components/ui/skeleton'

interface Organization {
  id: string
  name: string
  slug: string
  address: string
  district: string
  phone: string
  email: string
  currency: string
  timezone: string
  fiscalYearStartMonth: number
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
  fiscalYearStartMonth: 'Fiscal Year Start Month',
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default function OrganizationSettingsPage() {
  const [org, setOrg] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    fetch('/api/v1/settings/organization')
      .then(res => res.json())
      .then(json => { if (json.success) setOrg(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function formatValue(key: string, value: unknown): string {
    if (key === 'fiscalYearStartMonth' && typeof value === 'number') {
      return monthNames[value - 1] || String(value)
    }
    return String(value ?? '\u2014')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Organization Settings" description="Configure organization profile and preferences" />
        <Card>
          <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 9 }).map((_, i) => (
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

  const displayFields = ['name', 'slug', 'address', 'district', 'phone', 'email', 'currency', 'timezone', 'fiscalYearStartMonth'] as const

  return (
    <div className="space-y-6">
      <PageHeader title="Organization Settings" description="Configure organization profile and preferences">
        {editing ? (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
              <X className="h-4 w-4 mr-2" />Cancel
            </Button>
            <Button size="sm" onClick={() => setEditing(false)}>
              <Save className="h-4 w-4 mr-2" />Save
            </Button>
          </div>
        ) : (
          <Button size="sm" onClick={() => setEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />Edit Organization
          </Button>
        )}
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Organization Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {org ? (
            <div className="space-y-4">
              {displayFields.map((field) => (
                <div key={field} className="flex justify-between items-center py-2 border-b last:border-0">
                  <span className="text-sm text-muted-foreground">{fieldLabels[field]}</span>
                  <span className="text-sm font-medium text-right max-w-[60%]">
                    {formatValue(field, org[field])}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No organization data found. Please configure your organization settings.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
