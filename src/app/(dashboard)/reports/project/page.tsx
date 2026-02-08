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
import { Download, FileText, CheckCircle, PenLine, Calendar } from "lucide-react";
import { formatDate } from "@/lib/formatters";

interface ProjectReport {
  reportName: string;
  project: string;
  type: "Progress" | "Financial" | "M&E" | "Completion";
  period: string;
  author: string;
  status: "Completed" | "In Draft" | "Under Review" | "Due";
}

const reports: ProjectReport[] = [
  {
    reportName: "Q3 Progress Report",
    project: "Community Health Improvement Program",
    type: "Progress",
    period: "Oct-Dec 2025",
    author: "Fatima Begum",
    status: "Completed",
  },
  {
    reportName: "Q3 Financial Summary",
    project: "Community Health Improvement Program",
    type: "Financial",
    period: "Oct-Dec 2025",
    author: "Kamal Hossain",
    status: "Completed",
  },
  {
    reportName: "Annual M&E Report",
    project: "Climate Resilience & Livelihoods",
    type: "M&E",
    period: "FY 2025-26 (YTD)",
    author: "Taslima Akter",
    status: "In Draft",
  },
  {
    reportName: "Semi-Annual Progress Report",
    project: "Climate Resilience & Livelihoods",
    type: "Progress",
    period: "Jul-Dec 2025",
    author: "Mizanur Rahman",
    status: "Under Review",
  },
  {
    reportName: "Quarterly Financial Report",
    project: "Girls Education & Empowerment",
    type: "Financial",
    period: "Oct-Dec 2025",
    author: "Kamal Hossain",
    status: "Completed",
  },
  {
    reportName: "Mid-Term Evaluation Report",
    project: "Girls Education & Empowerment",
    type: "M&E",
    period: "Year 1-2",
    author: "Dr. Nasreen Ahmed",
    status: "In Draft",
  },
  {
    reportName: "Project Completion Report",
    project: "Urban WASH Phase II",
    type: "Completion",
    period: "Full Project (2023-2025)",
    author: "Rahim Uddin",
    status: "Under Review",
  },
  {
    reportName: "Q3 Progress Report",
    project: "Child Protection & WASH",
    type: "Progress",
    period: "Oct-Dec 2025",
    author: "Taslima Akter",
    status: "Completed",
  },
  {
    reportName: "Monthly Progress Update",
    project: "Sustainable Agriculture & Food Security",
    type: "Progress",
    period: "January 2026",
    author: "Mizanur Rahman",
    status: "Due",
  },
  {
    reportName: "Baseline Survey Report",
    project: "Sustainable Agriculture & Food Security",
    type: "M&E",
    period: "Inception Phase",
    author: "Dr. Nasreen Ahmed",
    status: "Completed",
  },
  {
    reportName: "Budget vs Actual Report",
    project: "Community Health Improvement Program",
    type: "Financial",
    period: "January 2026",
    author: "Kamal Hossain",
    status: "Due",
  },
  {
    reportName: "Outcome Indicator Tracking",
    project: "Climate Resilience & Livelihoods",
    type: "M&E",
    period: "Q3 FY 2025-26",
    author: "Taslima Akter",
    status: "In Draft",
  },
];

function getStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "Completed": return "default";
    case "In Draft": return "secondary";
    case "Under Review": return "outline";
    case "Due": return "destructive";
    default: return "secondary";
  }
}

function getTypeVariant(type: string): "default" | "secondary" | "outline" | "destructive" {
  switch (type) {
    case "Progress": return "default";
    case "Financial": return "outline";
    case "M&E": return "secondary";
    case "Completion": return "destructive";
    default: return "outline";
  }
}

export default function ProjectReportsPage() {
  const totalReports = reports.length;
  const completed = reports.filter((r) => r.status === "Completed").length;
  const inDraft = reports.filter((r) => r.status === "In Draft").length;
  const dueThisMonth = reports.filter((r) => r.status === "Due").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Reports"
        description="Generate project progress, budget vs actual, and outcome reports"
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{totalReports}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <p className="text-2xl font-bold">{completed}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Draft</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <PenLine className="h-4 w-4 text-orange-500" />
              <p className="text-2xl font-bold">{inDraft}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Due This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-red-500" />
              <p className="text-2xl font-bold">{dueThisMonth}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Report Register</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Name</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report, index) => (
                <TableRow key={`${report.project}-${report.reportName}-${index}`}>
                  <TableCell className="font-medium">{report.reportName}</TableCell>
                  <TableCell className="text-sm max-w-[220px] truncate">
                    {report.project}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getTypeVariant(report.type)}>{report.type}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{report.period}</TableCell>
                  <TableCell className="text-sm">{report.author}</TableCell>
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
