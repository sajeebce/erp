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
import { Download, FileText, Play, FileSpreadsheet } from "lucide-react";
import { formatDate } from "@/lib/formatters";

interface ProcurementReport {
  name: string;
  category: string;
  period: string;
  lastGenerated: string;
  format: "PDF" | "Excel" | "Both";
}

const reports: ProcurementReport[] = [
  {
    name: "Purchase Order Summary",
    category: "Orders",
    period: "January 2026",
    lastGenerated: "2026-01-31",
    format: "Both",
  },
  {
    name: "Vendor Performance Analysis",
    category: "Vendor",
    period: "FY 2025-26 (YTD)",
    lastGenerated: "2026-01-28",
    format: "Both",
  },
  {
    name: "Contract Status Report",
    category: "Contracts",
    period: "As at Feb 2026",
    lastGenerated: "2026-02-01",
    format: "PDF",
  },
  {
    name: "Inventory Valuation",
    category: "Inventory",
    period: "As at 31 Jan 2026",
    lastGenerated: "2026-01-31",
    format: "Both",
  },
  {
    name: "Stock Movement Report",
    category: "Inventory",
    period: "January 2026",
    lastGenerated: "2026-01-31",
    format: "Excel",
  },
  {
    name: "Procurement Pipeline",
    category: "Planning",
    period: "Q4 FY 2025-26",
    lastGenerated: "2026-01-25",
    format: "PDF",
  },
  {
    name: "Tender Analysis",
    category: "Tendering",
    period: "FY 2025-26 (YTD)",
    lastGenerated: "2026-01-20",
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

export default function ProcurementReportsPage() {
  const totalReports = reports.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Procurement Reports"
        description="Generate purchase orders, vendor analysis, and inventory reports"
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              <p className="text-2xl font-bold">
                {new Set(reports.map((r) => r.category)).size}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Procurement Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Name</TableHead>
                <TableHead>Category</TableHead>
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
                  <TableCell className="text-sm">
                    <Badge variant="outline">{report.category}</Badge>
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
