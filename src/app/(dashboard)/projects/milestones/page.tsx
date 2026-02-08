import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { formatDate } from "@/lib/formatters";

interface Milestone {
  id: string;
  milestone: string;
  project: string;
  targetDate: string;
  actualDate: string | null;
  deliverable: string;
  status: "Achieved" | "On Track" | "At Risk" | "Overdue";
}

const milestones: Milestone[] = [
  {
    id: "MS-001",
    milestone: "Baseline survey completed",
    project: "WASH Phase-3 - Sylhet",
    targetDate: "2024-06-30",
    actualDate: "2024-06-15",
    deliverable: "Baseline survey report with WASH coverage data",
    status: "Achieved",
  },
  {
    id: "MS-002",
    milestone: "100 tube wells installed",
    project: "WASH Phase-3 - Sylhet",
    targetDate: "2026-03-31",
    actualDate: null,
    deliverable: "Installation completion certificates & GPS mapping",
    status: "On Track",
  },
  {
    id: "MS-003",
    milestone: "Teacher training Phase 1 complete",
    project: "Primary Education Enhancement",
    targetDate: "2025-12-31",
    actualDate: "2025-12-28",
    deliverable: "Training completion report for 500 teachers",
    status: "Achieved",
  },
  {
    id: "MS-004",
    milestone: "Learning outcome assessment - midline",
    project: "Primary Education Enhancement",
    targetDate: "2026-06-30",
    actualDate: null,
    deliverable: "Midline assessment report with student scores",
    status: "On Track",
  },
  {
    id: "MS-005",
    milestone: "Community health worker recruitment",
    project: "Maternal & Child Health",
    targetDate: "2025-09-30",
    actualDate: "2025-10-15",
    deliverable: "150 CHWs recruited & onboarded across 5 upazilas",
    status: "Achieved",
  },
  {
    id: "MS-006",
    milestone: "ANC service coverage - 60%",
    project: "Maternal & Child Health",
    targetDate: "2026-03-31",
    actualDate: null,
    deliverable: "Coverage report showing 60% ANC in target areas",
    status: "At Risk",
  },
  {
    id: "MS-007",
    milestone: "Climate vulnerability assessment",
    project: "Climate Adaptation Fund",
    targetDate: "2025-06-30",
    actualDate: "2025-07-10",
    deliverable: "Vulnerability assessment for 3 coastal districts",
    status: "Achieved",
  },
  {
    id: "MS-008",
    milestone: "Vocational center operational - Gazipur",
    project: "Youth Employment Initiative",
    targetDate: "2026-01-31",
    actualDate: null,
    deliverable: "Center inauguration & first batch enrollment",
    status: "Overdue",
  },
  {
    id: "MS-009",
    milestone: "Flood-resilient housing - 20 units",
    project: "Climate Adaptation Fund",
    targetDate: "2026-03-15",
    actualDate: null,
    deliverable: "Construction completion & beneficiary handover",
    status: "At Risk",
  },
  {
    id: "MS-010",
    milestone: "MIS platform deployment",
    project: "Microfinance Capacity Building",
    targetDate: "2026-02-28",
    actualDate: null,
    deliverable: "Go-live of integrated MIS for all branch offices",
    status: "Overdue",
  },
];

function getStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "Achieved": return "default";
    case "On Track": return "secondary";
    case "At Risk": return "outline";
    case "Overdue": return "destructive";
    default: return "outline";
  }
}

export default function ProjectMilestonesPage() {
  const totalMilestones = milestones.length;
  const achieved = milestones.filter((m) => m.status === "Achieved").length;
  const onTrack = milestones.filter((m) => m.status === "On Track").length;
  const atRisk = milestones.filter((m) => m.status === "At Risk" || m.status === "Overdue").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Milestones"
        description="Track key milestones and deliverables for each project"
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Milestone
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalMilestones}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Achieved</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{achieved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">On Track</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{onTrack}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">At Risk / Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{atRisk}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Milestone Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead>Milestone</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Target Date</TableHead>
                <TableHead>Actual Date</TableHead>
                <TableHead>Deliverable</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {milestones.map((ms) => (
                <TableRow key={ms.id}>
                  <TableCell className="font-mono text-sm">{ms.id}</TableCell>
                  <TableCell className="font-medium">{ms.milestone}</TableCell>
                  <TableCell className="text-sm">{ms.project}</TableCell>
                  <TableCell>{formatDate(ms.targetDate)}</TableCell>
                  <TableCell>
                    {ms.actualDate ? formatDate(ms.actualDate) : (
                      <span className="text-muted-foreground">--</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[250px] text-sm">{ms.deliverable}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(ms.status)}>{ms.status}</Badge>
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
