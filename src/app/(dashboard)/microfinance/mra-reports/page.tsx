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
import { Download, FileText } from "lucide-react";
import { formatDate, formatNumber } from "@/lib/formatters";

interface MRAReport {
  reportName: string;
  reportCode: string;
  frequency: "Monthly" | "Quarterly" | "Annually";
  period: string;
  dueDate: string;
  submittedDate: string | null;
  status: "Draft" | "Ready" | "Submitted" | "Accepted" | "Revision Required";
}

const mraReports: MRAReport[] = [
  {
    reportName: "MRA Monthly Return",
    reportCode: "CDF-1",
    frequency: "Monthly",
    period: "January 2026",
    dueDate: "2026-02-15",
    submittedDate: "2026-02-08",
    status: "Submitted",
  },
  {
    reportName: "Quarterly Financial Statement",
    reportCode: "QFS-01",
    frequency: "Quarterly",
    period: "Q3 FY2025-26 (Jan-Mar)",
    dueDate: "2026-04-15",
    submittedDate: null,
    status: "Draft",
  },
  {
    reportName: "Annual Audited Report",
    reportCode: "AAR-01",
    frequency: "Annually",
    period: "FY 2024-25",
    dueDate: "2025-12-31",
    submittedDate: "2025-12-28",
    status: "Accepted",
  },
  {
    reportName: "Portfolio Quality Report",
    reportCode: "PQR-01",
    frequency: "Monthly",
    period: "January 2026",
    dueDate: "2026-02-15",
    submittedDate: "2026-02-07",
    status: "Submitted",
  },
  {
    reportName: "Interest Rate Compliance",
    reportCode: "IRC-01",
    frequency: "Quarterly",
    period: "Q2 FY2025-26 (Oct-Dec)",
    dueDate: "2026-01-31",
    submittedDate: "2026-01-28",
    status: "Revision Required",
  },
  {
    reportName: "Client Protection Report",
    reportCode: "CPR-01",
    frequency: "Annually",
    period: "FY 2024-25",
    dueDate: "2025-12-31",
    submittedDate: "2025-12-30",
    status: "Accepted",
  },
  {
    reportName: "Savings Mobilization Report",
    reportCode: "SMR-01",
    frequency: "Monthly",
    period: "January 2026",
    dueDate: "2026-02-15",
    submittedDate: null,
    status: "Ready",
  },
  {
    reportName: "Governance Report",
    reportCode: "GOV-01",
    frequency: "Annually",
    period: "FY 2024-25",
    dueDate: "2025-12-31",
    submittedDate: "2025-12-29",
    status: "Accepted",
  },
];

function getStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "Accepted": return "default";
    case "Submitted": return "default";
    case "Ready": return "secondary";
    case "Draft": return "outline";
    case "Revision Required": return "destructive";
    default: return "outline";
  }
}

function getFrequencyVariant(frequency: string): "default" | "secondary" | "outline" {
  switch (frequency) {
    case "Monthly": return "outline";
    case "Quarterly": return "secondary";
    case "Annually": return "default";
    default: return "outline";
  }
}

export default function MRAReportsPage() {
  const totalReports = mraReports.length;
  const dueThisMonth = mraReports.filter((r) => r.dueDate.startsWith("2026-02")).length;
  const submitted = mraReports.filter((r) => r.status === "Submitted" || r.status === "Accepted").length;
  const pending = mraReports.filter((r) => r.status === "Draft" || r.status === "Ready" || r.status === "Revision Required").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="MRA Reports"
        description="Generate Microcredit Regulatory Authority (MRA) compliance reports"
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export All
        </Button>
        <Button size="sm">
          <FileText className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(totalReports)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Due This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(dueThisMonth)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Submitted</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(submitted)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(pending)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>MRA Regulatory Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Code</TableHead>
                <TableHead>Report Name</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Submitted Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mraReports.map((report) => (
                <TableRow key={report.reportCode}>
                  <TableCell className="font-mono text-sm">{report.reportCode}</TableCell>
                  <TableCell className="font-medium">{report.reportName}</TableCell>
                  <TableCell>
                    <Badge variant={getFrequencyVariant(report.frequency)}>{report.frequency}</Badge>
                  </TableCell>
                  <TableCell>{report.period}</TableCell>
                  <TableCell>{formatDate(report.dueDate)}</TableCell>
                  <TableCell>
                    {report.submittedDate ? formatDate(report.submittedDate) : <span className="text-muted-foreground">—</span>}
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
