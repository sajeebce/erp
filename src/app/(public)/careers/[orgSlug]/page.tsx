'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Briefcase, MapPin, Clock, Users, Building2 } from 'lucide-react'

interface Organization {
  id: string
  name: string
  logo: string | null
  website: string | null
}

interface JobPosting {
  id: string
  title: string
  slug: string
  location: string
  employmentType: string
  applicationDeadline: string
  salaryMin: number | null
  salaryMax: number | null
  showSalary: boolean
  isRemote: boolean
  vacancies: number
  department: { name: string }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatEmploymentType(type: string) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatSalary(min: number | null, max: number | null) {
  if (!min && !max) return null
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(n)
  if (min && max) return `${fmt(min)} - ${fmt(max)}`
  if (min) return `From ${fmt(min)}`
  return `Up to ${fmt(max!)}`
}

export default function PublicCareerPortalPage() {
  const params = useParams<{ orgSlug: string }>()
  const router = useRouter()
  const [org, setOrg] = useState<Organization | null>(null)
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/v1/public/careers/${params.orgSlug}`)
        const json = await res.json()
        if (!json.success) {
          setError(json.error?.message || 'Organization not found')
          return
        }
        setOrg(json.data.organization)
        setJobs(json.data.jobs)
      } catch {
        setError('Failed to load career portal')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [params.orgSlug])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64 mx-auto" />
          <div className="h-4 bg-muted rounded w-48 mx-auto" />
          <div className="space-y-3 mt-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !org) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Career Portal Not Found</h1>
        <p className="text-muted-foreground">{error || 'The organization you are looking for does not exist.'}</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        {org.logo && (
          <img
            src={org.logo}
            alt={org.name}
            className="h-16 w-auto mx-auto mb-4 object-contain"
          />
        )}
        <h1 className="text-3xl font-bold">{org.name}</h1>
        <p className="text-muted-foreground mt-2">Career Opportunities</p>
        {org.website && (
          <a
            href={org.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline mt-1 inline-block"
          >
            {org.website}
          </a>
        )}
      </div>

      {/* Jobs List */}
      {jobs.length === 0 ? (
        <div className="text-center py-12">
          <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-1">No Open Positions</h2>
          <p className="text-muted-foreground">There are currently no open positions. Please check back later.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground mb-2">
            {jobs.length} open position{jobs.length !== 1 ? 's' : ''}
          </p>
          {jobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold">{job.title}</h2>
                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5" />
                        {job.department.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {job.location}
                        {job.isRemote && ' (Remote)'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5" />
                        {formatEmploymentType(job.employmentType)}
                      </span>
                      {job.vacancies > 1 && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {job.vacancies} vacancies
                        </span>
                      )}
                    </div>
                    {job.showSalary && (job.salaryMin || job.salaryMax) && (
                      <p className="text-sm font-medium mt-2">
                        {formatSalary(job.salaryMin, job.salaryMax)}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Deadline: {formatDate(job.applicationDeadline)}
                    </p>
                  </div>
                  <Button
                    onClick={() => router.push(`/careers/${params.orgSlug}/${job.slug}`)}
                    className="shrink-0"
                  >
                    View & Apply
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="text-center mt-12 pt-8 border-t">
        <p className="text-xs text-muted-foreground">
          Powered by NGO ERP
        </p>
      </div>
    </div>
  )
}
