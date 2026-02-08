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
import { Download, FileText, AlertTriangle, CheckCircle, Clock, Send } from "lucide-react";
import { formatDate } from "@/lib/formatters";

interface DonorReport {
  reportType: string;
  donor: string;
  grant: string;
  period: string;
  dueDate: string;
  status: "Submitted" | "Draft" | "Overdue" | "Upcoming";
  format: string;
}

const reports: DonorReport[] = [
  {
    reportType: "Financial Report",
    donor: "USAID",
    grant: "Community Health Improvement Program",
    period: "Oct-Dec 2025",
    dueDate: "2026-01-31",
    status: "Submitted",
    format: "SF-425",
  },
  {
    reportType: "Narrative Report",
    donor: "USAID",
    grant: "Community Health Improvement Program",
    period: "Oct-Dec 2025",
    dueDate: "2026-01-31",
    status: "Submitted",
    format: "USAID Template",
  },
  {
    reportType: "Progress Report",
    donor: "World Bank",
    grant: "Climate Resilience & Livelihoods",
    period: "Jul-Dec 2025",
    dueDate: "2026-02-15",
    status: "Draft",
    format: "WB ISR Format",
  },
  {
    reportType: "Financial Report",
    donor: "World Bank",
    grant: "Climate Resilience & Livelihoods",
    period: "Jul-Dec 2025",
    dueDate: "2026-02-15",
    status: "Draft",
    format: "IFR Template",
  },
  {
    reportType: "Audit Report",
    donor: "DFID",
    grant: "Girls Education & Empowerment",
    period: "FY 2024-25",
    dueDate: "2025-12-31",
    status: "Overdue",
    format: "DFID Audit Template",
  },
  {
    reportType: "Fund Utilization Certificate",
    donor: "DFID",
    grant: "Girls Education & Empowerment",
    period: "Apr-Sep 2025",
    dueDate: "2025-11-30",
    status: "Submitted",
    format: "FUC Standard",
  },
  {
    reportType: "Expenditure Statement",
    donor: "UNICEF",
    grant: "Child Protection & WASH",
    period: "Oct-Dec 2025",
    dueDate: "2026-02-28",
    status: "Upcoming",
    format: "FACE Form",
  },
  {
    reportType: "Progress Report",
    donor: "UNICEF",
    grant: "Child Protection & WASH",
    period: "Oct-Dec 2025",
    dueDate: "2026-02-28",
    status: "Upcoming",
    format: "UNICEF QPR",
  },
  {
    reportType: "Financial Report",
    donor: "EU",
    grant: "Sustainable Agriculture & Food Security",
    period: "Jul-Dec 2025",
    dueDate: "2026-03-31",
    status: "Upcoming",
    format: "EU Annex VI",
  },
  {
    reportType: "Narrative Report",
    donor: "EU",
    grant: "Sustainable Agriculture & Food Security",
    period: "Jul-Dec 2025",
    dueDate: "2026-03-31",
    status: "Upcoming",
    format: "EU Annex V",
  },
  {
    reportType: "Audit Report",
    donor: "USAID",
    grant: "Community Health Improvement Program",
    period: "FY 2024-25",
    dueDate: "2026-03-31",
    status: "Draft",
    format: "A-133 Format",
  },
  {
    reportType: "Fund Utilization Certificate",
    donor: "World Bank",
    grant: "Climate Resilience & Livelihoods",
    period: "FY 2025-26 (H1)",
    dueDate: "2026-01-31",
    status: "Submitted",
    format: "SOE Format",
  },
];

function getStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "Submitted": return "default";
    case "Draft": return "secondary";
    case "Overdue": return "destructive";
    case "Upcoming": return "outline";
    default: return "secondary";
  }
}

export default function DonorReportsCenterPage() {
  const totalDue = reports.length;
  const submitted = reports.filter((r) => r.status === "Submitted").length;
  const overdue = reports.filter((r) => r.status === "Overdue").length;
  const upcoming = reports.filter((r) => r.status === "Upcoming").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Donor Reports"
        description="Generate donor-specific financial and narrative reports"
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{totalDue}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Submitted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <p className="text-2xl font-bold">{submitted}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <p className="text-2xl font-bold">{overdue}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <p className="text-2xl font-bold">{upcoming}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Donor Report Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Type</TableHead>
                <TableHead>Donor</TableHead>
                <TableHead>Grant</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Format</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report, index) => (
                <TableRow key={`${report.donor}-${report.reportType}-${index}`}>
                  <TableCell className="font-medium">{report.reportType}</TableCell>
                  <TableCell className="text-sm">
                    <Badge variant="outline">{report.donor}</Badge>
                  </TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">
                    {report.grant}
                  </TableCell>
                  <TableCell className="text-sm">{report.period}</TableCell>
                  <TableCell className="text-sm">{formatDate(report.dueDate)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(report.status)}>{report.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{report.format}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <Send className="h-3 w-3 mr-1" />
                      {report.status === "Submitted" ? "View" : "Prepare"}
                    </Button>
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
