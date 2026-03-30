'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchableSelect } from '@/components/shared/searchable-select'
import { PageHeader } from '@/components/shared/page-header'

interface Employee { id: string; employeeNo: string; fullName: string }
interface Policy { id: string; name: string; employeeContribRate: number; employerContribRate: number }

export default function NewPFEnrollmentPage() {
  const router = useRouter()
  const t = useTranslations('hr')
  const tc = useTranslations('common')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [policies, setPolicies] = useState<Policy[]>([])

  const [employeeId, setEmployeeId] = useState('')
  const [policyId, setPolicyId] = useState('')
  const [enrollmentDate, setEnrollmentDate] = useState('')
  const [effectiveDate, setEffectiveDate] = useState('')
  const [employeeRate, setEmployeeRate] = useState('')
  const [employerRate, setEmployerRate] = useState('')

  useEffect(() => {
    fetch('/api/v1/hr/employees?limit=500')
      .then(res => res.json())
      .then(json => { if (json.success) setEmployees(json.data) })
      .catch(() => {})

    fetch('/api/v1/hr/provident-fund/policies?limit=100')
      .then(res => res.json())
      .then(json => { if (json.success) setPolicies(json.data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (policyId) {
      const policy = policies.find(p => p.id === policyId)
      if (policy) {
        setEmployeeRate(String(policy.employeeContribRate))
        setEmployerRate(String(policy.employerContribRate))
      }
    }
  }, [policyId, policies])

  async function handleSubmit() {
    if (!employeeId || !policyId || !enrollmentDate || !effectiveDate) {
      setError('Please fill all required fields')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/v1/hr/provident-fund/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          policyId,
          enrollmentDate,
          effectiveDate,
          employeeContribRate: parseFloat(employeeRate),
          employerContribRate: parseFloat(employerRate),
        }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        router.push(`/hr/pension/provident-fund/enrollments/${json.data.id}`)
      } else {
        setError(json.error || 'Failed to enroll employee')
      }
    } catch {
      setError('Failed to enroll employee')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Enroll Employee in PF" description="Add a new member to the provident fund">
        <Button variant="outline" size="sm" onClick={() => router.push('/hr/pension/provident-fund/enrollments')}>
          <ArrowLeft className="h-4 w-4 mr-2" />{tc('buttons.back')}
        </Button>
      </PageHeader>

      <Card>
        <CardHeader><CardTitle>Enrollment Details</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          {error && <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Employee *</Label>
              <SearchableSelect
                options={employees.map(e => ({ value: e.id, label: `${e.fullName} (${e.employeeNo})` }))}
                value={employeeId}
                onValueChange={setEmployeeId}
                placeholder="Select employee..."
              />
            </div>
            <div className="space-y-2">
              <Label>PF Policy *</Label>
              <SearchableSelect
                options={policies.map(p => ({ value: p.id, label: p.name }))}
                value={policyId}
                onValueChange={setPolicyId}
                placeholder="Select policy..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Enrollment Date *</Label>
              <Input type="date" value={enrollmentDate} onChange={(e) => setEnrollmentDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Effective Date *</Label>
              <Input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Employee Contribution Rate (%)</Label>
              <Input type="number" step="0.01" value={employeeRate} onChange={(e) => setEmployeeRate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Employer Contribution Rate (%)</Label>
              <Input type="number" step="0.01" value={employerRate} onChange={(e) => setEmployerRate(e.target.value)} />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.push('/hr/pension/provident-fund/enrollments')} disabled={saving}>{tc('buttons.cancel')}</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enrolling...</> : 'Enroll Employee'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
