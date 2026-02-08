"use client";

import { PageHeader } from "@/components/shared/page-header";
import { KPICard } from "@/components/dashboard/kpi-card";
import {
  kpiCards,
  fundUtilizationData,
  monthlyIncomeExpenseData,
  donorContributionData,
  projectProgressData,
  budgetVsActualData,
  beneficiaryGrowthData,
  upcomingDeadlines,
  recentTransactions,
} from "@/data/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { formatBDT, formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { CalendarDays } from "lucide-react";

const CHART_COLORS = ["hsl(221, 83%, 53%)", "hsl(160, 84%, 39%)", "hsl(263, 70%, 50%)", "hsl(38, 92%, 50%)", "hsl(0, 72%, 51%)"];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Overview of your NGO operations" />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* Row 1: Fund Utilization + Income vs Expense */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Fund Utilization */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fund Utilization by Project</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={fundUtilizationData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tickFormatter={(v) => `৳${(v / 1000000).toFixed(1)}M`} className="text-xs" />
                <YAxis dataKey="project" type="category" width={150} className="text-xs" />
                <Tooltip formatter={(v: number) => formatBDT(v)} />
                <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                  {fundUtilizationData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Income vs Expense */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Income vs Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyIncomeExpenseData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} className="text-xs" />
                <Tooltip formatter={(v: number) => formatBDT(v)} />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="hsl(221, 83%, 53%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="expense" stroke="hsl(160, 84%, 39%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Donor Contribution + Project Progress + Budget vs Actual */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Donor Contributions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Donor Contributions</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={donorContributionData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                  {donorContributionData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatBDT(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Project Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Project Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {projectProgressData.slice(0, 5).map((project) => (
              <div key={project.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate mr-2">{project.name}</span>
                  <span className="font-medium">{project.progress}%</span>
                </div>
                <Progress
                  value={project.progress}
                  className={cn(
                    "h-2",
                    project.progress >= 75 ? "[&>div]:bg-emerald-500" :
                    project.progress >= 50 ? "[&>div]:bg-amber-500" : "[&>div]:bg-red-500"
                  )}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Budget vs Actual */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Budget vs Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={budgetVsActualData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="category" className="text-xs" />
                <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} className="text-xs" />
                <Tooltip formatter={(v: number) => formatBDT(v)} />
                <Legend />
                <Bar dataKey="budget" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" fill="hsl(160, 84%, 39%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Beneficiary Growth + Upcoming Deadlines + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Beneficiary Growth */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Beneficiary Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={beneficiaryGrowthData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} className="text-xs" />
                <Tooltip formatter={(v: number) => v.toLocaleString()} />
                <defs>
                  <linearGradient id="beneficiaryGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(263, 70%, 50%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(263, 70%, 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="total" stroke="hsl(263, 70%, 50%)" fill="url(#beneficiaryGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingDeadlines.map((deadline) => (
              <div key={deadline.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <CalendarDays className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{deadline.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(deadline.date)}</p>
                </div>
                <Badge variant={deadline.priority === "high" ? "destructive" : deadline.priority === "medium" ? "default" : "secondary"} className="text-[10px]">
                  {deadline.priority}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Description</TableHead>
                  <TableHead className="text-xs text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.slice(0, 5).map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(txn.date)}</TableCell>
                    <TableCell className="text-xs truncate max-w-[150px]">{txn.description}</TableCell>
                    <TableCell className={cn("text-xs text-right font-medium whitespace-nowrap", txn.type === "credit" ? "text-emerald-600" : "text-red-600")}>
                      {txn.type === "credit" ? "+" : "-"}{formatBDT(txn.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
