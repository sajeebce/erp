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
import { Download, FileText, FileSpreadsheet, Calendar, Play } from "lucide-react";
import { formatDate } from "@/lib/formatters";

interface FinancialReport {
  name: string;
  description: string;
  period: string;
  lastGenerated: string;
  format: "PDF" | "Excel" | "Both";
}

const reports: FinancialReport[] = [
  {
    name: "Trial Balance",
    description: "Consolidated trial balance across all projects and funds",
    period: "January 2026",
    lastGenerated: "2026-01-31",
    format: "Both",
  },
  {
    name: "Income Statement (Receipt & Payment)",
    description: "Statement of receipts and payments for the period",
    period: "FY 2025-26 (YTD)",
    lastGenerated: "2026-01-31",
    format: "Both",
  },
  {
    name: "Balance Sheet",
    description: "Statement of assets, liabilities, and fund balances",
    period: "As at 31 Jan 2026",
    lastGenerated: "2026-01-31",
    format: "Both",
  },
  {
    name: "Cash Flow Statement",
    description: "Cash inflows and outflows by operating, investing, and financing activities",
    period: "FY 2025-26 (YTD)",
    lastGenerated: "2026-01-28",
    format: "PDF",
  },
  {
    name: "Fund Position Report",
    description: "Donor-wise fund position showing receipts, expenditure, and balance",
    period: "January 2026",
    lastGenerated: "2026-01-31",
    format: "Both",
  },
  {
    name: "General Ledger",
    description: "Detailed ledger entries for all accounts",
    period: "January 2026",
    lastGenerated: "2026-01-30",
    format: "Excel",
  },
  {
    name: "Day Book",
    description: "Daily transaction register with all voucher entries",
    period: "January 2026",
    lastGenerated: "2026-01-31",
    format: "Both",
  },
  {
    name: "Bank Book",
    description: "Bank account-wise transaction register",
    period: "January 2026",
    lastGenerated: "2026-01-31",
    format: "Both",
  },
  {
    name: "Cash Book",
    description: "Cash transaction register for all offices",
    period: "January 2026",
    lastGenerated: "2026-01-31",
    format: "Both",
  },
  {
    name: "Receipts & Payments A/C",
    description: "Summary of all receipts and payments during the period",
    period: "FY 2025-26 (YTD)",
    lastGenerated: "2026-01-25",
    format: "PDF",
  },
  {
    name: "Income & Expenditure A/C",
    description: "Accrual-based income and expenditure statement",
    period: "FY 2025-26 (YTD)",
    lastGenerated: "2026-01-25",
    format: "PDF",
  },
  {
    name: "Project-wise Expenditure",
    description: "Expenditure breakdown by project with budget comparison",
    period: "January 2026",
    lastGenerated: "2026-01-31",
    format: "Both",
  },
];

function getFormatVariant(format: string): "default" | "secondary" | "outline" {
  switch (format) {
    case "PDF": return "destructive" as "default";
    case "Excel": return "default";
    case "Both": return "secondary";
    default: return "outline";
  }
}

export default function FinancialReportsPage() {
  const totalReports = reports.length;
  const generatedThisMonth = reports.filter(
    (r) => r.lastGenerated >= "2026-01-01"
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial Reports"
        description="Generate Trial Balance, Income Statement, Balance Sheet, and Cash Flow reports"
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export All
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available Reports</CardTitle>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Generated This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <p className="text-2xl font-bold">{generatedThisMonth}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Financial Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Last Generated</TableHead>
                <TableHead>Format</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.name}>
                  <TableCell className="font-medium">{report.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[300px]">
                    {report.description}
                  </TableCell>
                  <TableCell className="text-sm">{report.period}</TableCell>
                  <TableCell className="text-sm">{formatDate(report.lastGenerated)}</TableCell>
                  <TableCell>
                    <Badge variant={getFormatVariant(report.format)}>{report.format}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm">
                        <Play className="h-3 w-3 mr-1" />
                        Generate
                      </Button>
                      <Button variant="ghost" size="sm">
                        <FileText className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <FileSpreadsheet className="h-3 w-3" />
                      </Button>
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
