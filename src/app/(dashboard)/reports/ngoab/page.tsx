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
import { Download, FileText, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { formatDate } from "@/lib/formatters";

interface NGOABForm {
  formNo: string;
  formName: string;
  frequency: string;
  applicablePeriod: string;
  dueDate: string;
  status: "Submitted" | "Draft" | "Overdue" | "Not Started";
  lastSubmitted: string;
}

const forms: NGOABForm[] = [
  {
    formNo: "FD-1",
    formName: "Project Proposal",
    frequency: "Per Project",
    applicablePeriod: "FY 2025-26",
    dueDate: "2026-03-31",
    status: "Submitted",
    lastSubmitted: "2025-11-15",
  },
  {
    formNo: "FD-2",
    formName: "Fund Release",
    frequency: "Per Release",
    applicablePeriod: "Q3 FY 2025-26",
    dueDate: "2026-01-31",
    status: "Submitted",
    lastSubmitted: "2026-01-28",
  },
  {
    formNo: "FD-3",
    formName: "Quarterly Progress Report",
    frequency: "Quarterly",
    applicablePeriod: "Oct-Dec 2025",
    dueDate: "2026-01-15",
    status: "Submitted",
    lastSubmitted: "2026-01-12",
  },
  {
    formNo: "FD-4",
    formName: "Personnel Details",
    frequency: "Annual",
    applicablePeriod: "FY 2025-26",
    dueDate: "2026-06-30",
    status: "Draft",
    lastSubmitted: "2025-06-28",
  },
  {
    formNo: "FD-5",
    formName: "Assets Details",
    frequency: "Annual",
    applicablePeriod: "FY 2025-26",
    dueDate: "2026-06-30",
    status: "Not Started",
    lastSubmitted: "2025-06-28",
  },
  {
    formNo: "FD-6",
    formName: "Annual Audit Report",
    frequency: "Annual",
    applicablePeriod: "FY 2024-25",
    dueDate: "2025-12-31",
    status: "Overdue",
    lastSubmitted: "2024-12-20",
  },
  {
    formNo: "FD-7",
    formName: "Fund Receipt Permission",
    frequency: "Per Receipt",
    applicablePeriod: "Q4 FY 2025-26",
    dueDate: "2026-03-15",
    status: "Draft",
    lastSubmitted: "2025-12-10",
  },
  {
    formNo: "FD-8",
    formName: "Project Amendment",
    frequency: "As Required",
    applicablePeriod: "FY 2025-26",
    dueDate: "2026-02-28",
    status: "Not Started",
    lastSubmitted: "2025-08-20",
  },
  {
    formNo: "FD-9",
    formName: "NGO Registration Renewal",
    frequency: "Every 5 Years",
    applicablePeriod: "2026-2031",
    dueDate: "2026-06-30",
    status: "Draft",
    lastSubmitted: "2021-05-15",
  },
  {
    formNo: "FC-1",
    formName: "Foreign Contribution Report",
    frequency: "Annual",
    applicablePeriod: "FY 2025-26",
    dueDate: "2026-09-30",
    status: "Not Started",
    lastSubmitted: "2025-09-25",
  },
  {
    formNo: "AR",
    formName: "Annual Return",
    frequency: "Annual",
    applicablePeriod: "FY 2024-25",
    dueDate: "2025-12-31",
    status: "Overdue",
    lastSubmitted: "2024-12-28",
  },
];

function getStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "Submitted": return "default";
    case "Draft": return "secondary";
    case "Overdue": return "destructive";
    case "Not Started": return "outline";
    default: return "secondary";
  }
}

export default function NGOABReportsPage() {
  const totalForms = forms.length;
  const submitted = forms.filter((f) => f.status === "Submitted").length;
  const overdue = forms.filter((f) => f.status === "Overdue").length;
  const dueThisQuarter = forms.filter(
    (f) => f.dueDate >= "2026-01-01" && f.dueDate <= "2026-03-31"
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="NGOAB Compliance Reports"
        description="NGO Affairs Bureau regulatory forms and compliance submissions"
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Forms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{totalForms}</p>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Due This Quarter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <p className="text-2xl font-bold">{dueThisQuarter}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>NGOAB Forms & Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Form No</TableHead>
                <TableHead>Form Name</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Applicable Period</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {forms.map((form) => (
                <TableRow key={form.formNo}>
                  <TableCell className="font-mono font-medium">{form.formNo}</TableCell>
                  <TableCell className="font-medium">{form.formName}</TableCell>
                  <TableCell className="text-sm">{form.frequency}</TableCell>
                  <TableCell className="text-sm">{form.applicablePeriod}</TableCell>
                  <TableCell className="text-sm">{formatDate(form.dueDate)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(form.status)}>{form.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(form.lastSubmitted)}
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
