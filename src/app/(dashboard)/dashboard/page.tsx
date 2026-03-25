'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Wallet, TrendingUp, FolderOpen, Users, Clock, UserCheck, ShoppingCart, Shield,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend,
} from 'recharts'
import { formatBDT } from '@/lib/formatters'

interface DashboardData {
  kpis: {
    totalFundReceived: number
    fundUtilized: number
    utilizationRate: number
    activeProjects: number
    activeBeneficiaries: number
    pendingApprovals: number
    staffCount: number
    complianceScore: number
  }
  charts: {
    fundByProject: { name: string; totalBudget: number; amountSpent: number }[]
    monthlyIncomeExpense: { month: string; income: number; expense: number }[]
    donorContributions: { name: string; totalFunded: number }[]
    projectProgress: { name: string; progress: number; status: string }[]
    budgetVsActual: { name: string; budget: number; actual: number }[]
    beneficiaryGrowth: { month: string; count: number }[]
  }
  recentTransactions: { entryNo: string; date: string; description: string; totalDebit: number }[]
  upcomingDeadlines: { reportNo: string; type: string; dueDate: string; grantTitle: string }[]
}

const CHART_COLORS = [
  'var(--chart-1, hsl(221, 83%, 53%))',
  'var(--chart-2, hsl(160, 60%, 45%))',
  'var(--chart-3, hsl(30, 80%, 55%))',
  'var(--chart-4, hsl(280, 65%, 60%))',
  'var(--chart-5, hsl(340, 75%, 55%))',
]

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/dashboard')
      .then(res => res.json())
      .then(json => {
        if (json.success) setData(json.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-20" /></CardContent></Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-64" /></CardContent></Card>
          ))}
        </div>
      </div>
    )
  }

  if (!data) return <div className="text-center py-10 text-muted-foreground">Failed to load dashboard</div>

  const kpiCards = [
    { title: 'Total Fund Received', value: formatBDT(data.kpis.totalFundReceived), icon: Wallet, color: 'text-blue-600' },
    { title: 'Fund Utilized', value: formatBDT(data.kpis.fundUtilized), icon: TrendingUp, color: 'text-emerald-600', sub: `${data.kpis.utilizationRate.toFixed(1)}% utilization` },
    { title: 'Active Projects', value: String(data.kpis.activeProjects), icon: FolderOpen, color: 'text-violet-600' },
    { title: 'Active Beneficiaries', value: data.kpis.activeBeneficiaries.toLocaleString(), icon: Users, color: 'text-teal-600' },
    { title: 'Pending Approvals', value: String(data.kpis.pendingApprovals), icon: Clock, color: 'text-amber-600' },
    { title: 'Staff Count', value: String(data.kpis.staffCount), icon: UserCheck, color: 'text-indigo-600' },
    { title: 'Compliance Score', value: `${data.kpis.complianceScore}%`, icon: Shield, color: 'text-emerald-600' },
  ]

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{kpi.title}</p>
                  <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                  {kpi.sub && <p className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>}
                </div>
                <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center ${kpi.color}`}>
                  <kpi.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Income vs Expense */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Monthly Income vs Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data.charts.monthlyIncomeExpense}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 11 }} />
                <YAxis className="text-xs" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(value: number) => formatBDT(value)} />
                <Legend />
                <Area type="monotone" dataKey="income" stackId="1" stroke="hsl(160, 60%, 45%)" fill="hsl(160, 60%, 45%)" fillOpacity={0.3} />
                <Area type="monotone" dataKey="expense" stackId="2" stroke="hsl(0, 75%, 55%)" fill="hsl(0, 75%, 55%)" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Donor Contributions (Donut) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Donor Contributions</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={data.charts.donorContributions.filter(d => d.totalFunded > 0)} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="totalFunded" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {data.charts.donorContributions.filter(d => d.totalFunded > 0).map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatBDT(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fund by Project */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Fund by Project</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.charts.fundByProject} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => formatBDT(value)} />
                <Bar dataKey="totalBudget" fill="hsl(221, 83%, 53%)" radius={[0, 4, 4, 0]} name="Budget" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Project Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Project Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.charts.projectProgress.map((project) => (
                <div key={project.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate max-w-[200px]">{project.name}</span>
                    <span className="text-muted-foreground">{project.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions + Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentTransactions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No recent transactions</p>
              ) : data.recentTransactions.map((tx) => (
                <div key={tx.entryNo} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{tx.entryNo} &bull; {new Date(tx.date).toLocaleDateString()}</p>
                  </div>
                  <span className="text-sm font-mono font-medium">{formatBDT(Number(tx.totalDebit))}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.upcomingDeadlines.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No upcoming deadlines</p>
              ) : data.upcomingDeadlines.map((dl) => (
                <div key={dl.reportNo} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{dl.type} Report</p>
                    <p className="text-xs text-muted-foreground">{dl.grantTitle}</p>
                  </div>
                  <span className="text-xs text-amber-600 font-medium">{new Date(dl.dueDate).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
