'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

interface EmployeeContribution {
  id: string
  month: number
  year: number
  employeeAmount: number
  employerAmount: number
  total: number
  createdAt: string
}

interface EmployeeInfo {
  fullName: string
  employeeNo: string
  department?: { name: string }
}

export default function EmployeeContributionHistoryPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const { formatCurrency } = useFormatters()

  const [employee, setEmployee] = useState<EmployeeInfo | null>(null)
  const [contributions, setContributions] = useState<EmployeeContribution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!params.employeeId) return
    fetch(`/api/v1/hr/pf/contributions/employee/${params.employeeId}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setEmployee(json.data.employee)
          setContributions(json.data.contributions)
        } else {
          setError('Failed to load contribution history')
        }
      })
      .catch(() => setError('Failed to load contribution history'))
      .finally(() => setLoading(false))
  }, [params.employeeId])

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  const totalEmployee = contributions.reduce((sum, c) => sum + c.employeeAmount, 0)
  const totalEmployer = contributions.reduce((sum, c) => sum + c.employerAmount, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title={employee?.fullName || 'Employee Contributions'}
        description={employee ? `${employee.employeeNo} | ${employee.department?.name || ''}` : 'Monthly PF contribution history'}
      >
        <Button variant="outline" size="sm" onClick={() => router.push('/hr/pension/provident-fund/contributions')}>
          <ArrowLeft className="h-4 w-4 mr-2" />{tc('buttons.back')}
        </Button>
      </PageHeader>

      {error && <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Employee Contribution</p>
            <p className="text-2xl font-bold font-mono">{formatCurrency(totalEmployee)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Employer Contribution</p>
            <p className="text-2xl font-bold font-mono">{formatCurrency(totalEmployer)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Contributions</p>
            <p className="text-2xl font-bold font-mono">{formatCurrency(totalEmployee + totalEmployer)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Monthly Contributions</CardTitle></CardHeader>
        <CardContent>
          {contributions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No contributions found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium">Period</th>
                    <th className="pb-2 font-medium text-right">Employee</th>
                    <th className="pb-2 font-medium text-right">Employer</th>
                    <th className="pb-2 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {contributions.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-2 font-medium">{c.month}/{c.year}</td>
                      <td className="py-2 text-right font-mono">{formatCurrency(c.employeeAmount)}</td>
                      <td className="py-2 text-right font-mono">{formatCurrency(c.employerAmount)}</td>
                      <td className="py-2 text-right font-mono font-medium">{formatCurrency(c.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
