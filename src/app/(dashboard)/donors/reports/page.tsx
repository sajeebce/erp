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

interface DonorReport {
  id: string;
  reportType: "Financial" | "Narrative" | "Progress" | "Audit";
  donor: string;
  grant: string;
  period: string;
  dueDate: string;
  submittedDate: string | null;
  status: "Draft" | "Under Review" | "Submitted" | "Accepted" | "Revision Required";
}

const donorReports: DonorReport[] = [
  {
    id: "RPT-001",
    reportType: "Financial",
    donor: "USAID",
    grant: "WASH Phase-3",
    period: "Oct - Dec 2025",
    dueDate: "2026-01-31",
    submittedDate: "2026-01-28",
    status: "Accepted",
  },
  {
    id: "RPT-002",
    reportType: "Narrative",
    donor: "USAID",
    grant: "WASH Phase-3",
    period: "Oct - Dec 2025",
    dueDate: "2026-01-31",
    submittedDate: "2026-01-30",
    status: "Accepted",
  },
  {
    id: "RPT-003",
    reportType: "Progress",
    donor: "World Bank",
    grant: "Primary Education Enhancement",
    period: "Jul - Dec 2025",
    dueDate: "2026-02-15",
    submittedDate: "2026-02-05",
    status: "Under Review",
  },
  {
    id: "RPT-004",
    reportType: "Financial",
    donor: "UNICEF",
    grant: "Maternal & Child Health",
    period: "Oct - Dec 2025",
    dueDate: "2026-02-28",
    submittedDate: null,
    status: "Draft",
  },
  {
    id: "RPT-005",
    reportType: "Audit",
    donor: "DFID/FCDO",
    grant: "Climate Adaptation Fund",
    period: "FY 2025",
    dueDate: "2026-03-31",
    submittedDate: null,
    status: "Draft",
  },
  {
    id: "RPT-006",
    reportType: "Narrative",
    donor: "EU",
    grant: "Youth Employment Initiative",
    period: "Jun - Dec 2025",
    dueDate: "2026-02-10",
    submittedDate: "2026-02-08",
    status: "Submitted",
  },
  {
    id: "RPT-007",
    reportType: "Financial",
    donor: "SDC",
    grant: "Microfinance Capacity Building",
    period: "Jul - Dec 2025",
    dueDate: "2026-01-20",
    submittedDate: "2026-01-22",
    status: "Revision Required",
  },
  {
    id: "RPT-008",
    reportType: "Progress",
    donor: "JICA",
    grant: "Food Security & Nutrition",
    period: "Oct - Dec 2025",
    dueDate: "2026-02-15",
    submittedDate: "2026-02-10",
    status: "Submitted",
  },
  {
    id: "RPT-009",
    reportType: "Financial",
    donor: "World Bank",
    grant: "Primary Education Enhancement",
    period: "Jul - Dec 2025",
    dueDate: "2026-02-15",
    submittedDate: "2026-02-04",
    status: "Under Review",
  },
  {
    id: "RPT-010",
    reportType: "Narrative",
    donor: "DFID/FCDO",
    grant: "Climate Adaptation Fund",
    period: "Oct - Dec 2025",
    dueDate: "2026-01-15",
    submittedDate: "2026-01-18",
    status: "Revision Required",
  },
];

function getStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "Accepted": return "default";
    case "Submitted": return "secondary";
    case "Under Review": return "secondary";
    case "Draft": return "outline";
    case "Revision Required": return "destructive";
    default: return "outline";
  }
}

function getReportTypeBadgeVariant(type: string): "default" | "secondary" | "outline" {
  switch (type) {
    case "Financial": return "default";
    case "Narrative": return "secondary";
    case "Progress": return "outline";
    case "Audit": return "default";
    default: return "outline";
  }
}

export default function DonorReportsPage() {
  const totalReports = donorReports.length;
  const dueThisMonth = donorReports.filter(
    (r) => r.dueDate.startsWith("2026-02") && !["Accepted", "Submitted"].includes(r.status)
  ).length;
  const overdue = donorReports.filter(
    (r) => new Date(r.dueDate) < new Date("2026-02-08") && !["Accepted", "Submitted"].includes(r.status)
  ).length;
  const submitted = donorReports.filter(
    (r) => ["Submitted", "Under Review", "Accepted"].includes(r.status)
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Donor Reports"
        description="Generate financial and narrative reports for donors"
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Report
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalReports}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Due This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{dueThisMonth}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{overdue}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Submitted</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{submitted}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Donor Report Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Report ID</TableHead>
                <TableHead>Report Type</TableHead>
                <TableHead>Donor</TableHead>
                <TableHead>Grant</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Submitted Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {donorReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-mono text-sm">{report.id}</TableCell>
                  <TableCell>
                    <Badge variant={getReportTypeBadgeVariant(report.reportType)}>
                      {report.reportType}
                    </Badge>
                  </TableCell>
                  <TableCell>{report.donor}</TableCell>
                  <TableCell>{report.grant}</TableCell>
                  <TableCell className="text-sm">{report.period}</TableCell>
                  <TableCell>{formatDate(report.dueDate)}</TableCell>
                  <TableCell>
                    {report.submittedDate ? formatDate(report.submittedDate) : (
                      <span className="text-muted-foreground">--</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(report.status)}>{report.status}</Badge>
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
