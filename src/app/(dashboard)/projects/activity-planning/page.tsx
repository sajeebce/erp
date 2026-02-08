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
import { Plus, Download } from "lucide-react";
import { formatBDT, formatDate, formatPercent } from "@/lib/formatters";

interface Activity {
  id: string;
  name: string;
  project: string;
  responsible: string;
  startDate: string;
  endDate: string;
  budget: number;
  status: "Planned" | "In Progress" | "Completed" | "Delayed";
  percentComplete: number;
}

const activities: Activity[] = [
  {
    id: "ACT-001",
    name: "Tube well installation - Sunamganj",
    project: "WASH Phase-3 - Sylhet",
    responsible: "Md. Rashidul Islam",
    startDate: "2026-01-15",
    endDate: "2026-04-30",
    budget: 3500000,
    status: "In Progress",
    percentComplete: 45,
  },
  {
    id: "ACT-002",
    name: "Teacher training workshop - Batch 5",
    project: "Primary Education Enhancement",
    responsible: "Fatema Akhter",
    startDate: "2026-02-01",
    endDate: "2026-02-28",
    budget: 1200000,
    status: "In Progress",
    percentComplete: 30,
  },
  {
    id: "ACT-003",
    name: "Community health camp - Chattogram",
    project: "Maternal & Child Health",
    responsible: "Dr. Nasreen Sultana",
    startDate: "2025-12-01",
    endDate: "2026-01-31",
    budget: 800000,
    status: "Completed",
    percentComplete: 100,
  },
  {
    id: "ACT-004",
    name: "Embankment repair - Barishal coast",
    project: "Climate Adaptation Fund",
    responsible: "Kamal Hossain",
    startDate: "2026-01-10",
    endDate: "2026-06-30",
    budget: 8500000,
    status: "In Progress",
    percentComplete: 20,
  },
  {
    id: "ACT-005",
    name: "Vocational training center setup - Gazipur",
    project: "Youth Employment Initiative",
    responsible: "Sharmin Akter",
    startDate: "2026-01-01",
    endDate: "2026-03-31",
    budget: 4200000,
    status: "Delayed",
    percentComplete: 15,
  },
  {
    id: "ACT-006",
    name: "School WASH facility construction",
    project: "WASH Phase-3 - Sylhet",
    responsible: "Md. Rashidul Islam",
    startDate: "2026-03-01",
    endDate: "2026-07-31",
    budget: 5600000,
    status: "Planned",
    percentComplete: 0,
  },
  {
    id: "ACT-007",
    name: "Hygiene awareness campaign - 50 villages",
    project: "WASH Phase-3 - Sylhet",
    responsible: "Rehana Begum",
    startDate: "2025-11-01",
    endDate: "2026-02-15",
    budget: 950000,
    status: "In Progress",
    percentComplete: 80,
  },
  {
    id: "ACT-008",
    name: "Micro-enterprise seed fund distribution",
    project: "Youth Employment Initiative",
    responsible: "Sharmin Akter",
    startDate: "2026-04-01",
    endDate: "2026-06-30",
    budget: 6000000,
    status: "Planned",
    percentComplete: 0,
  },
  {
    id: "ACT-009",
    name: "Flood-resilient housing pilot - 20 units",
    project: "Climate Adaptation Fund",
    responsible: "Kamal Hossain",
    startDate: "2025-10-15",
    endDate: "2026-03-15",
    budget: 12000000,
    status: "In Progress",
    percentComplete: 55,
  },
  {
    id: "ACT-010",
    name: "Learning material distribution - 200 schools",
    project: "Primary Education Enhancement",
    responsible: "Fatema Akhter",
    startDate: "2025-12-15",
    endDate: "2026-01-15",
    budget: 2800000,
    status: "Completed",
    percentComplete: 100,
  },
  {
    id: "ACT-011",
    name: "Antenatal care training - community workers",
    project: "Maternal & Child Health",
    responsible: "Dr. Nasreen Sultana",
    startDate: "2026-02-10",
    endDate: "2026-04-10",
    budget: 1500000,
    status: "Planned",
    percentComplete: 0,
  },
  {
    id: "ACT-012",
    name: "MIS software development & deployment",
    project: "Microfinance Capacity Building",
    responsible: "Aminul Haque",
    startDate: "2025-09-01",
    endDate: "2026-02-28",
    budget: 3200000,
    status: "Delayed",
    percentComplete: 60,
  },
];

function getStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "Completed": return "default";
    case "In Progress": return "secondary";
    case "Planned": return "outline";
    case "Delayed": return "destructive";
    default: return "outline";
  }
}

export default function ActivityPlanningPage() {
  const totalActivities = activities.length;
  const inProgress = activities.filter((a) => a.status === "In Progress").length;
  const completed = activities.filter((a) => a.status === "Completed").length;
  const delayed = activities.filter((a) => a.status === "Delayed").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity Planning"
        description="Plan and track project activities and work plans"
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Activity
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalActivities}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{inProgress}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{completed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Delayed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{delayed}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Planning</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[90px]">Activity ID</TableHead>
                <TableHead>Activity Name</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Responsible</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[140px]">% Complete</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell className="font-mono text-sm">{activity.id}</TableCell>
                  <TableCell className="font-medium">{activity.name}</TableCell>
                  <TableCell className="text-sm">{activity.project}</TableCell>
                  <TableCell>{activity.responsible}</TableCell>
                  <TableCell>{formatDate(activity.startDate)}</TableCell>
                  <TableCell>{formatDate(activity.endDate)}</TableCell>
                  <TableCell className="text-right font-mono">{formatBDT(activity.budget)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(activity.status)}>{activity.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={activity.percentComplete} className="flex-1" />
                      <span className="text-xs font-mono w-10 text-right">
                        {formatPercent(activity.percentComplete)}
                      </span>
                    </div>
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
