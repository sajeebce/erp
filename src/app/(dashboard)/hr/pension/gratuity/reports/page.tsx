'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2, FileText, User } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/shared/data-table'
import { SearchableSelect } from '@/components/shared/searchable-select'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

interface DepartmentLiability {
  department: string
  employeeCount: number
  vestedCount: number
  unvestedCount: number
  totalLiability: number
  vestedLiability: number
  unvestedLiability: number
}

interface LiabilityReport {
  totalLiability: number
  vestedLiability: number
  unvestedLiability: number
  departments: DepartmentLiability[]
}

interface EmployeeStatement {
  employeeId: string
  employeeName: string
  employeeNo: string
  department: string
  joiningDate: string
  serviceYears: number
  policyName: string
  totalAccrued: number
  totalPaid: number
  currentBalance: number
  isVested: boolean
  accruals: {
    month: number
    year: number
    basicSalary: number
    accrualAmount: number
    runningBalance: number
  }[]
}

interface EmployeeOption {
  employeeId: string
  employeeName: string
  employeeNo: string
}

export default function GratuityReportsPage() {
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const router = useRouter()
  const { formatCurrency, formatDate } = useFormatters()

  const [liabilityReport, setLiabilityReport] = useState<LiabilityReport | null>(null)
  const [loadingLiability, setLoadingLiability] = useState(true)

  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [statement, setStatement] = useState<EmployeeStatement | null>(null)
  const [loadingStatement, setLoadingStatement] = useState(false)

  useEffect(() => {
    fetch('/api/v1/hr/gratuity/reports/liability')
      .then(res => res.json())
      .then(json => { if (json.success) setLiabilityReport(json.data) })
      .catch(console.error)
      .finally(() => setLoadingLiability(false))

    fetch('/api/v1/hr/gratuity/ledgers')
      .then(res => res.json())
      .then(json => { if (json.success) setEmployees(json.data) })
      .catch(() => {})
  }, [])

  async function fetchStatement(empId: string) {
    if (!empId) return
    setLoadingStatement(true)
    setStatement(null)

    try {
      const res = await fetch(`/api/v1/hr/gratuity/ledgers/${empId}`)
      const json = await res.json()
      if (json.success) {
        setStatement(json.data)
      }
    } catch {
      // ignore
    } finally {
      setLoadingStatement(false)
    }
  }

  function handleEmployeeChange(value: string) {
    setSelectedEmployeeId(value)
    fetchStatement(value)
  }

  const deptColumns: ColumnDef<DepartmentLiability>[] = [
    { accessorKey: 'department', header: 'Department', cell: ({ row }) => <span className="font-medium">{row.getValue('department')}</span> },
    { accessorKey: 'employeeCount', header: 'Employees' },
    { accessorKey: 'vestedCount', header: 'Vested' },
    { accessorKey: 'unvestedCount', header: 'Unvested' },
    { accessorKey: 'totalLiability', header: 'Total Liability', cell: ({ row }) => <span className="font-mono text-sm font-medium">{formatCurrency(row.getValue('totalLiability'))}</span> },
    { accessorKey: 'vestedLiability', header: 'Vested Liability', cell: ({ row }) => <span className="font-mono text-sm text-green-600">{formatCurrency(row.getValue('vestedLiability'))}</span> },
    { accessorKey: 'unvestedLiability', header: 'Unvested Liability', cell: ({ row }) => <span className="font-mono text-sm text-orange-600">{formatCurrency(row.getValue('unvestedLiability'))}</span> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Gratuity Reports" description="View liability analysis and employee gratuity statements">
        <Button variant="outline" size="sm" onClick={() => router.push('/hr/pension/gratuity')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tc('buttons.back')}
        </Button>
      </PageHeader>

      {/* Liability Report */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Liability Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-md border p-4">
              <p className="text-sm text-muted-foreground">Total Liability</p>
              <p className="text-2xl font-bold">{liabilityReport ? formatCurrency(liabilityReport.totalLiability) : '\u2014'}</p>
            </div>
            <div className="rounded-md border p-4">
              <p className="text-sm text-muted-foreground">Vested Liability</p>
              <p className="text-2xl font-bold text-green-600">{liabilityReport ? formatCurrency(liabilityReport.vestedLiability) : '\u2014'}</p>
            </div>
            <div className="rounded-md border p-4">
              <p className="text-sm text-muted-foreground">Unvested Liability</p>
              <p className="text-2xl font-bold text-orange-600">{liabilityReport ? formatCurrency(liabilityReport.unvestedLiability) : '\u2014'}</p>
            </div>
          </div>

          {/* Department Breakdown */}
          <DataTable
            columns={deptColumns}
            data={liabilityReport?.departments || []}
            searchKey="department"
            searchPlaceholder="Search departments..."
            isLoading={loadingLiability}
          />
        </CardContent>
      </Card>

      {/* Employee Statement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Employee Statement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="max-w-md space-y-2">
            <Label htmlFor="report-employee">Select Employee</Label>
            <SearchableSelect
              id="report-employee"
              options={employees.map((e) => ({ value: e.employeeId, label: `${e.employeeName} (${e.employeeNo})` }))}
              value={selectedEmployeeId}
              onValueChange={handleEmployeeChange}
              placeholder="Select employee..."
            />
          </div>

          {loadingStatement && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {statement && (
            <div className="space-y-4 border-t pt-4">
              {/* Statement Header */}
              <div className="text-center border-b pb-4">
                <h3 className="text-lg font-bold">Gratuity Statement</h3>
                <p className="text-sm text-muted-foreground">{statement.employeeName} ({statement.employeeNo})</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><span className="text-muted-foreground">Department:</span> <span className="font-medium">{statement.department}</span></div>
                <div><span className="text-muted-foreground">Joining Date:</span> <span className="font-medium">{formatDate(statement.joiningDate)}</span></div>
                <div><span className="text-muted-foreground">Service:</span> <span className="font-medium">{statement.serviceYears.toFixed(1)} years</span></div>
                <div><span className="text-muted-foreground">Policy:</span> <span className="font-medium">{statement.policyName}</span></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Total Accrued</p>
                  <p className="text-lg font-bold">{formatCurrency(statement.totalAccrued)}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Total Paid</p>
                  <p className="text-lg font-bold text-orange-600">{formatCurrency(statement.totalPaid)}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Current Balance</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(statement.currentBalance)}</p>
                </div>
              </div>

              {/* Accrual Details */}
              {statement.accruals.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Accrual History</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="border px-3 py-2 text-left">Month</th>
                          <th className="border px-3 py-2 text-left">Year</th>
                          <th className="border px-3 py-2 text-right">Basic Salary</th>
                          <th className="border px-3 py-2 text-right">Accrual</th>
                          <th className="border px-3 py-2 text-right">Running Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statement.accruals.map((a, i) => (
                          <tr key={i} className="hover:bg-muted/30">
                            <td className="border px-3 py-2">{a.month}</td>
                            <td className="border px-3 py-2">{a.year}</td>
                            <td className="border px-3 py-2 text-right font-mono">{formatCurrency(a.basicSalary)}</td>
                            <td className="border px-3 py-2 text-right font-mono">{formatCurrency(a.accrualAmount)}</td>
                            <td className="border px-3 py-2 text-right font-mono font-medium">{formatCurrency(a.runningBalance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
