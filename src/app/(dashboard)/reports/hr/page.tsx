import { getTranslations, getLocale } from 'next-intl/server';
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
import { Download, FileText, Calendar, Play, FileSpreadsheet } from "lucide-react";
import { formatDate } from "@/lib/formatters";

interface HRReport {
  name: string;
  category: string;
  period: string;
  lastGenerated: string;
  format: "PDF" | "Excel" | "Both";
}

const reports: HRReport[] = [
  {
    name: "Staff List & Directory",
    category: "Personnel",
    period: "As at Feb 2026",
    lastGenerated: "2026-02-01",
    format: "Both",
  },
  {
    name: "Attendance Summary",
    category: "Attendance",
    period: "January 2026",
    lastGenerated: "2026-02-01",
    format: "Excel",
  },
  {
    name: "Leave Balance Report",
    category: "Leave",
    period: "FY 2025-26 (YTD)",
    lastGenerated: "2026-01-31",
    format: "Excel",
  },
  {
    name: "Payroll Register",
    category: "Payroll",
    period: "January 2026",
    lastGenerated: "2026-01-28",
    format: "Both",
  },
  {
    name: "Tax Report (TDS)",
    category: "Tax & Compliance",
    period: "FY 2025-26 (YTD)",
    lastGenerated: "2026-01-31",
    format: "PDF",
  },
  {
    name: "Provident Fund Statement",
    category: "Benefits",
    period: "FY 2025-26 (YTD)",
    lastGenerated: "2026-01-31",
    format: "Both",
  },
  {
    name: "Training Report",
    category: "Development",
    period: "FY 2025-26 (YTD)",
    lastGenerated: "2026-01-25",
    format: "PDF",
  },
  {
    name: "Performance Summary",
    category: "Performance",
    period: "H1 FY 2025-26",
    lastGenerated: "2026-01-20",
    format: "PDF",
  },
  {
    name: "Staff Turnover Analysis",
    category: "Analytics",
    period: "FY 2025-26 (YTD)",
    lastGenerated: "2026-01-15",
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

export default async function HRReportsPage() {
  const t = await getTranslations('reports');
  const tc = await getTranslations('common');
  const locale = await getLocale();
  const totalReports = reports.length;
  const generatedThisMonth = reports.filter(
    (r) => r.lastGenerated >= "2026-01-01"
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('hr.title')}
        description={t('hr.description')}
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          {t('hr.exportAll')}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('hr.availableReports')}</CardTitle>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('hr.generatedThisMonth')}</CardTitle>
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
          <CardTitle>{t('hr.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('hr.reportName')}</TableHead>
                <TableHead>{t('hr.category')}</TableHead>
                <TableHead>{t('hr.period')}</TableHead>
                <TableHead>{t('hr.lastGenerated')}</TableHead>
                <TableHead>{t('hr.format')}</TableHead>
                <TableHead className="text-right">{t('hr.actions')}</TableHead>
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
                  <TableCell className="text-sm">{formatDate(report.lastGenerated, locale)}</TableCell>
                  <TableCell>
                    <Badge variant={getFormatVariant(report.format)}>{report.format}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm">
                        <Play className="h-3 w-3 mr-1" />
                        {t('hr.generate')}
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
