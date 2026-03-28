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

export default async function MRAReportsPage() {
  const t = await getTranslations('microfinance');
  const tc = await getTranslations('common');
  const locale = await getLocale();
  const totalReports = mraReports.length;
  const dueThisMonth = mraReports.filter((r) => r.dueDate.startsWith("2026-02")).length;
  const submitted = mraReports.filter((r) => r.status === "Submitted" || r.status === "Accepted").length;
  const pending = mraReports.filter((r) => r.status === "Draft" || r.status === "Ready" || r.status === "Revision Required").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('mraReports.title')}
        description={t('mraReports.description')}
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          {t('mraReports.exportAll')}
        </Button>
        <Button size="sm">
          <FileText className="h-4 w-4 mr-2" />
          {t('mraReports.generateReport')}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('mraReports.totalReports')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(totalReports, locale)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('mraReports.dueThisMonth')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(dueThisMonth, locale)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('mraReports.submitted')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(submitted, locale)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('mraReports.pending')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(pending, locale)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('mraReports.regulatoryReports')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('mraReports.reportCode')}</TableHead>
                <TableHead>{t('mraReports.reportName')}</TableHead>
                <TableHead>{t('mraReports.frequency')}</TableHead>
                <TableHead>{t('mraReports.period')}</TableHead>
                <TableHead>{t('mraReports.dueDate')}</TableHead>
                <TableHead>{t('mraReports.submittedDate')}</TableHead>
                <TableHead>{t('mraReports.status')}</TableHead>
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
                  <TableCell>{formatDate(report.dueDate, locale)}</TableCell>
                  <TableCell>
                    {report.submittedDate ? formatDate(report.submittedDate, locale) : <span className="text-muted-foreground">—</span>}
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
