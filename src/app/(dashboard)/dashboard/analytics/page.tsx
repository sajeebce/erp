"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
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
  RadialBarChart,
  RadialBar,
} from "recharts";
import { formatBDT } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Users,
  Wallet,
  Target,
  MapPin,
  Download,
  Calendar,
  BarChart3,
} from "lucide-react";

const CHART_COLORS = [
  "hsl(221, 83%, 53%)",
  "hsl(160, 84%, 39%)",
  "hsl(263, 70%, 50%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)",
  "hsl(190, 80%, 45%)",
];

// Fund flow data - monthly
const fundFlowData = [
  { month: "Jul '25", received: 1800000, utilized: 1200000, balance: 600000 },
  { month: "Aug", received: 1450000, utilized: 1350000, balance: 700000 },
  { month: "Sep", received: 2100000, utilized: 1500000, balance: 1300000 },
  { month: "Oct", received: 1600000, utilized: 1400000, balance: 1500000 },
  { month: "Nov", received: 1900000, utilized: 1650000, balance: 1750000 },
  { month: "Dec", received: 2200000, utilized: 1800000, balance: 2150000 },
  { month: "Jan '26", received: 1350000, utilized: 1250000, balance: 2250000 },
  { month: "Feb", received: 1500000, utilized: 980000, balance: 2770000 },
];

// Expense category breakdown
const expenseCategoryData = [
  { name: "Personnel", value: 4200000, percentage: 34 },
  { name: "Program Activities", value: 3100000, percentage: 25 },
  { name: "Equipment & Supplies", value: 1600000, percentage: 13 },
  { name: "Travel & Transport", value: 1100000, percentage: 9 },
  { name: "Training & Capacity", value: 850000, percentage: 7 },
  { name: "Office Operations", value: 750000, percentage: 6 },
  { name: "M&E", value: 400000, percentage: 3 },
  { name: "Overhead & Admin", value: 350000, percentage: 3 },
];

// Donor performance
const donorPerformanceData = [
  { donor: "USAID", committed: 5000000, received: 4500000, utilized: 3800000, receivedPct: 90, utilizedPct: 84 },
  { donor: "World Bank", committed: 3500000, received: 3200000, utilized: 2900000, receivedPct: 91, utilizedPct: 91 },
  { donor: "DFID/FCDO", committed: 3000000, received: 2800000, utilized: 2100000, receivedPct: 93, utilizedPct: 75 },
  { donor: "UNICEF", committed: 2000000, received: 1500000, utilized: 1200000, receivedPct: 75, utilizedPct: 80 },
  { donor: "Local Donors", committed: 2500000, received: 2000000, utilized: 1700000, receivedPct: 80, utilizedPct: 85 },
];

// Project performance matrix
const projectPerformanceData = [
  { name: "Clean Water - Sylhet", budgetUtilization: 78, timeProgress: 72, beneficiaryReach: 85, status: "on-track", budget: 3500000, spent: 2730000 },
  { name: "Education - Char Areas", budgetUtilization: 88, timeProgress: 92, beneficiaryReach: 95, status: "on-track", budget: 2800000, spent: 2464000 },
  { name: "Healthcare - Cox's Bazar", budgetUtilization: 52, timeProgress: 45, beneficiaryReach: 40, status: "at-risk", budget: 2200000, spent: 1144000 },
  { name: "Women Empowerment - Rangpur", budgetUtilization: 65, timeProgress: 60, beneficiaryReach: 70, status: "on-track", budget: 1900000, spent: 1235000 },
  { name: "Disaster Preparedness", budgetUtilization: 30, timeProgress: 25, beneficiaryReach: 20, status: "delayed", budget: 1900000, spent: 570000 },
  { name: "Youth Skills Development", budgetUtilization: 82, timeProgress: 85, beneficiaryReach: 88, status: "on-track", budget: 1200000, spent: 984000 },
];

// Geographic distribution
const geographicData = [
  { division: "Dhaka", beneficiaries: 12500, projects: 3, offices: 1, spend: 3200000 },
  { division: "Chattogram", beneficiaries: 9800, projects: 2, offices: 1, spend: 2800000 },
  { division: "Sylhet", beneficiaries: 7200, projects: 2, offices: 2, spend: 2100000 },
  { division: "Rangpur", beneficiaries: 6500, projects: 1, offices: 1, spend: 1500000 },
  { division: "Khulna", beneficiaries: 4200, projects: 1, offices: 1, spend: 950000 },
  { division: "Rajshahi", beneficiaries: 3100, projects: 1, offices: 0, spend: 680000 },
  { division: "Barishal", beneficiaries: 1430, projects: 1, offices: 1, spend: 420000 },
  { division: "Mymensingh", beneficiaries: 500, projects: 0, offices: 0, spend: 150000 },
];

// Year-over-year comparison
const yoyComparisonData = [
  { metric: "Total Fund Received", current: "৳15.5 Cr", previous: "৳13.8 Cr", change: "+12.3%", trend: "up" },
  { metric: "Fund Utilization Rate", current: "79.4%", previous: "74.2%", change: "+5.2%", trend: "up" },
  { metric: "Active Projects", current: "8", previous: "6", change: "+33%", trend: "up" },
  { metric: "Beneficiaries Served", current: "45,230", previous: "38,600", change: "+17.2%", trend: "up" },
  { metric: "Staff Strength", current: "285", previous: "265", change: "+7.5%", trend: "up" },
  { metric: "Office Locations", current: "10", previous: "8", change: "+25%", trend: "up" },
  { metric: "Overhead Ratio", current: "8.2%", previous: "9.1%", change: "-0.9%", trend: "down" },
  { metric: "Donor Satisfaction", current: "4.6/5", previous: "4.3/5", change: "+7%", trend: "up" },
];

// Staff distribution by department chart data
const staffDistributionData = [
  { department: "Programs", count: 42, fill: CHART_COLORS[0] },
  { department: "MFI", count: 85, fill: CHART_COLORS[1] },
  { department: "Finance", count: 18, fill: CHART_COLORS[2] },
  { department: "M&E", count: 15, fill: CHART_COLORS[3] },
  { department: "Procurement", count: 12, fill: CHART_COLORS[4] },
  { department: "Others", count: 113, fill: CHART_COLORS[5] },
];

// Compliance tracker
const complianceData = [
  { item: "NGOAB FD-6 Annual Return", deadline: "15 Feb 2026", status: "Due Soon", daysLeft: 7 },
  { item: "MRA Quarterly Return (Q2)", deadline: "10 Mar 2026", status: "Upcoming", daysLeft: 30 },
  { item: "Annual Audit Report (FY24-25)", deadline: "31 Mar 2026", status: "In Progress", daysLeft: 51 },
  { item: "USAID Quarterly Narrative", deadline: "28 Feb 2026", status: "Due Soon", daysLeft: 20 },
  { item: "Tax Return Filing", deadline: "30 Jun 2026", status: "Upcoming", daysLeft: 142 },
  { item: "NGOAB Project Completion Report", deadline: "30 Apr 2026", status: "Upcoming", daysLeft: 81 },
];

function getStatusColor(status: string): string {
  switch (status) {
    case "on-track": return "text-emerald-600";
    case "at-risk": return "text-amber-600";
    case "delayed": return "text-red-600";
    default: return "text-muted-foreground";
  }
}

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Comprehensive analytics and performance insights for FY 2025-26"
      >
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            FY 2025-26
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </PageHeader>

      {/* Year-over-Year KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {yoyComparisonData.slice(0, 4).map((item) => (
          <Card key={item.metric} className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{item.metric}</p>
                  <p className="text-2xl font-bold">{item.current}</p>
                </div>
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  item.trend === "up" ? "bg-emerald-500/10" : "bg-red-500/10"
                )}>
                  {item.trend === "up"
                    ? <TrendingUp className="h-5 w-5 text-emerald-500" />
                    : <TrendingDown className="h-5 w-5 text-red-500" />
                  }
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs">
                <ArrowUpRight className={cn("h-3 w-3", item.trend === "up" ? "text-emerald-500" : "text-red-500")} />
                <span className={cn("font-medium", item.trend === "up" ? "text-emerald-500" : "text-red-500")}>
                  {item.change}
                </span>
                <span className="text-muted-foreground">vs last year ({item.previous})</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Fund Flow + Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">Fund Flow Analysis</CardTitle>
                <CardDescription>Monthly fund received, utilized, and running balance</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={fundFlowData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} className="text-xs" />
                <Tooltip formatter={(v: number) => formatBDT(v)} />
                <Legend />
                <Bar dataKey="received" name="Received" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="utilized" name="Utilized" fill="hsl(160, 84%, 39%)" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="balance" name="Balance" stroke="hsl(38, 92%, 50%)" strokeWidth={2} dot={{ r: 3 }} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">Expense Breakdown</CardTitle>
                <CardDescription>By category (FY 2025-26 YTD)</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={expenseCategoryData.slice(0, 6)}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {expenseCategoryData.slice(0, 6).map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatBDT(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {expenseCategoryData.slice(0, 5).map((cat, i) => (
                <div key={cat.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i] }} />
                    <span className="text-muted-foreground">{cat.name}</span>
                  </div>
                  <span className="font-medium">{cat.percentage}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Donor Performance */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">Donor Performance Tracker</CardTitle>
              <CardDescription>Committed vs received vs utilized by donor</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Donor</TableHead>
                <TableHead className="text-right">Committed</TableHead>
                <TableHead className="text-right">Received</TableHead>
                <TableHead className="text-right">Utilized</TableHead>
                <TableHead>Receipt Rate</TableHead>
                <TableHead>Burn Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {donorPerformanceData.map((donor) => (
                <TableRow key={donor.donor}>
                  <TableCell className="font-medium">{donor.donor}</TableCell>
                  <TableCell className="text-right text-sm">{formatBDT(donor.committed)}</TableCell>
                  <TableCell className="text-right text-sm">{formatBDT(donor.received)}</TableCell>
                  <TableCell className="text-right text-sm">{formatBDT(donor.utilized)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={donor.receivedPct} className="h-2 w-20" />
                      <span className="text-xs font-medium">{donor.receivedPct}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={donor.utilizedPct}
                        className={cn("h-2 w-20", donor.utilizedPct < 70 && "[&>div]:bg-amber-500")}
                      />
                      <span className="text-xs font-medium">{donor.utilizedPct}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Project Performance + Staff Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Project Performance Matrix</CardTitle>
            <CardDescription>Budget utilization, timeline, and beneficiary reach</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Budget Used</TableHead>
                  <TableHead>Time Progress</TableHead>
                  <TableHead>Beneficiary Reach</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectPerformanceData.map((project) => (
                  <TableRow key={project.name}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{project.name}</p>
                        <p className="text-xs text-muted-foreground">{formatBDT(project.spent)} / {formatBDT(project.budget)}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={project.budgetUtilization} className="h-2 w-16" />
                        <span className="text-xs font-medium">{project.budgetUtilization}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={project.timeProgress} className="h-2 w-16" />
                        <span className="text-xs font-medium">{project.timeProgress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={project.beneficiaryReach}
                          className={cn("h-2 w-16", project.beneficiaryReach < 50 && "[&>div]:bg-red-500")}
                        />
                        <span className="text-xs font-medium">{project.beneficiaryReach}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={project.status === "on-track" ? "default" : project.status === "at-risk" ? "outline" : "destructive"}>
                        {project.status === "on-track" ? "On Track" : project.status === "at-risk" ? "At Risk" : "Delayed"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">Staff Distribution</CardTitle>
                <CardDescription>285 staff across departments</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={staffDistributionData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="count"
                  label={({ department, count }) => `${department}: ${count}`}
                >
                  {staffDistributionData.map((entry, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Geographic Distribution + Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">Geographic Distribution</CardTitle>
                <CardDescription>Operations across Bangladesh by division</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Division</TableHead>
                  <TableHead className="text-center">Beneficiaries</TableHead>
                  <TableHead className="text-center">Projects</TableHead>
                  <TableHead className="text-center">Offices</TableHead>
                  <TableHead className="text-right">Spend (BDT)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {geographicData.map((geo) => (
                  <TableRow key={geo.division}>
                    <TableCell className="font-medium">{geo.division}</TableCell>
                    <TableCell className="text-center text-sm">{geo.beneficiaries.toLocaleString()}</TableCell>
                    <TableCell className="text-center text-sm">{geo.projects}</TableCell>
                    <TableCell className="text-center text-sm">{geo.offices}</TableCell>
                    <TableCell className="text-right text-sm">{formatBDT(geo.spend)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Compliance & Reporting Tracker</CardTitle>
            <CardDescription>Upcoming regulatory and donor reporting deadlines</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {complianceData.map((item) => (
              <div key={item.item} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.item}</p>
                  <p className="text-xs text-muted-foreground">Due: {item.deadline}</p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <Badge variant={item.daysLeft <= 14 ? "destructive" : item.daysLeft <= 30 ? "outline" : "secondary"}>
                    {item.daysLeft}d left
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Year-over-Year Full Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Year-over-Year Comparison</CardTitle>
          <CardDescription>FY 2025-26 (current) vs FY 2024-25 (previous)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {yoyComparisonData.map((item) => (
              <div key={item.metric} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="text-xs text-muted-foreground">{item.metric}</p>
                  <p className="text-lg font-bold">{item.current}</p>
                  <p className="text-xs text-muted-foreground">prev: {item.previous}</p>
                </div>
                <Badge
                  variant={item.metric === "Overhead Ratio" ? (item.trend === "down" ? "default" : "destructive") : (item.trend === "up" ? "default" : "destructive")}
                >
                  {item.change}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
