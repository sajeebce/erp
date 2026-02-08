import { PageHeader } from "@/components/shared/page-header";
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
import { Button } from "@/components/ui/button";
import {
  Download,
  FolderKanban,
  TrendingUp,
  DollarSign,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
} from "lucide-react";
import { formatBDT, formatPercent } from "@/lib/formatters";

interface ProjectSummary {
  id: string;
  name: string;
  donor: string;
  budget: number;
  spent: number;
  progress: number;
  status: "Active" | "Completed" | "Pipeline" | "On Hold";
  activities: number;
  completedActivities: number;
  delayedActivities: number;
  location: string;
  teamSize: number;
}

const projects: ProjectSummary[] = [
  {
    id: "PRJ-001",
    name: "WASH Program - Safe Water for Sylhet",
    donor: "USAID",
    budget: 25000000,
    spent: 18750000,
    progress: 65,
    status: "Active",
    activities: 18,
    completedActivities: 10,
    delayedActivities: 2,
    location: "Sylhet Division",
    teamSize: 18,
  },
  {
    id: "PRJ-002",
    name: "Shiksha Unnayan - Primary Education",
    donor: "World Bank",
    budget: 42000000,
    spent: 38640000,
    progress: 82,
    status: "Active",
    activities: 24,
    completedActivities: 19,
    delayedActivities: 1,
    location: "Dhaka & Rajshahi",
    teamSize: 24,
  },
  {
    id: "PRJ-003",
    name: "Ma O Shishu - Maternal Health",
    donor: "UNICEF",
    budget: 18000000,
    spent: 8100000,
    progress: 35,
    status: "Active",
    activities: 12,
    completedActivities: 3,
    delayedActivities: 1,
    location: "Chattogram Division",
    teamSize: 12,
  },
  {
    id: "PRJ-004",
    name: "Jalbayu Sahishnuta - Climate Resilience",
    donor: "DFID/FCDO",
    budget: 35000000,
    spent: 10500000,
    progress: 20,
    status: "Active",
    activities: 15,
    completedActivities: 2,
    delayedActivities: 0,
    location: "Barishal & Khulna",
    teamSize: 15,
  },
  {
    id: "PRJ-005",
    name: "Rin Bistar - Microfinance Expansion",
    donor: "SDC",
    budget: 15000000,
    spent: 12750000,
    progress: 90,
    status: "Active",
    activities: 8,
    completedActivities: 7,
    delayedActivities: 0,
    location: "Rangpur Division",
    teamSize: 8,
  },
  {
    id: "PRJ-006",
    name: "Jubo Dakhata - Youth Skills Development",
    donor: "EU",
    budget: 22000000,
    spent: 7700000,
    progress: 28,
    status: "Active",
    activities: 14,
    completedActivities: 3,
    delayedActivities: 2,
    location: "Nationwide",
    teamSize: 14,
  },
  {
    id: "PRJ-007",
    name: "Khaddo Nirapotta - Food Security",
    donor: "JICA",
    budget: 28000000,
    spent: 16800000,
    progress: 50,
    status: "Active",
    activities: 20,
    completedActivities: 9,
    delayedActivities: 1,
    location: "Mymensingh & Rangpur",
    teamSize: 20,
  },
  {
    id: "PRJ-008",
    name: "Nari Shakti - Women Empowerment",
    donor: "USAID",
    budget: 32000000,
    spent: 0,
    progress: 0,
    status: "Pipeline",
    activities: 0,
    completedActivities: 0,
    delayedActivities: 0,
    location: "Rajshahi & Khulna",
    teamSize: 0,
  },
];

function getStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "Active": return "default";
    case "Completed": return "secondary";
    case "Pipeline": return "outline";
    case "On Hold": return "destructive";
    default: return "outline";
  }
}

function getBurnRateColor(spent: number, budget: number, progress: number): string {
  if (budget === 0) return "text-muted-foreground";
  const burnRate = (spent / budget) * 100;
  const diff = burnRate - progress;
  if (diff > 15) return "text-destructive";
  if (diff > 5) return "text-amber-600";
  return "text-emerald-600";
}

export default function ProjectDashboardPage() {
  const activeProjects = projects.filter((p) => p.status === "Active");
  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = projects.reduce((sum, p) => sum + p.spent, 0);
  const totalTeamMembers = projects.reduce((sum, p) => sum + p.teamSize, 0);
  const totalActivities = projects.reduce((sum, p) => sum + p.activities, 0);
  const totalCompleted = projects.reduce((sum, p) => sum + p.completedActivities, 0);
  const totalDelayed = projects.reduce((sum, p) => sum + p.delayedActivities, 0);
  const avgProgress = activeProjects.length > 0
    ? Math.round(activeProjects.reduce((sum, p) => sum + p.progress, 0) / activeProjects.length)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Dashboard"
        description="Overview of all projects, budgets, and key performance metrics"
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{activeProjects.length}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {projects.filter((p) => p.status === "Pipeline").length} in pipeline
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{formatBDT(totalBudget)}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatBDT(totalSpent)} spent ({formatPercent((totalSpent / totalBudget) * 100)})
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{avgProgress}%</p>
            </div>
            <Progress value={avgProgress} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{totalTeamMembers}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {activeProjects.length} active projects
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <p className="text-2xl font-bold">{totalActivities}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <p className="text-2xl font-bold text-emerald-600">{totalCompleted}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalActivities > 0 ? formatPercent((totalCompleted / totalActivities) * 100) : "0%"} completion rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Delayed Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <p className="text-2xl font-bold text-amber-600">{totalDelayed}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Requires immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Project Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Project Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead>Project Name</TableHead>
                <TableHead>Donor</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead className="text-right">Spent</TableHead>
                <TableHead className="w-[140px]">Progress</TableHead>
                <TableHead className="text-center">Activities</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-mono text-sm">{project.id}</TableCell>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell className="text-sm">{project.donor}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {project.location}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatBDT(project.budget)}</TableCell>
                  <TableCell className={`text-right font-mono text-sm ${getBurnRateColor(project.spent, project.budget, project.progress)}`}>
                    {formatBDT(project.spent)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={project.progress} className="flex-1" />
                      <span className="text-xs font-mono w-10 text-right">{project.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="text-sm">
                      <span className="text-emerald-600">{project.completedActivities}</span>
                      <span className="text-muted-foreground">/{project.activities}</span>
                      {project.delayedActivities > 0 && (
                        <span className="text-destructive ml-1">({project.delayedActivities} delayed)</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(project.status)}>{project.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
