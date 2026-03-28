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
import { Plus, Download, FileEdit, CheckCircle, Clock, XCircle } from "lucide-react";
import { formatCurrency, formatDate, formatPercent } from "@/lib/formatters";

interface BudgetRevision {
  revisionNo: string;
  date: string;
  project: string;
  originalBudget: number;
  revisedBudget: number;
  changeAmount: number;
  changePercent: number;
  reason: string;
  approvedBy: string;
  status: "Approved" | "Pending" | "Rejected";
}

const revisions: BudgetRevision[] = [
  {
    revisionNo: "REV-001",
    date: "2025-09-15",
    project: "WASH Program - Sylhet",
    originalBudget: 22000000,
    revisedBudget: 25000000,
    changeAmount: 3000000,
    changePercent: 13.6,
    reason: "Expanded scope to include 5 additional unions in Sylhet division per donor request",
    approvedBy: "Dr. Nasreen Ahmed",
    status: "Approved",
  },
  {
    revisionNo: "REV-002",
    date: "2025-10-22",
    project: "Primary Education Enhancement",
    originalBudget: 42000000,
    revisedBudget: 42000000,
    changeAmount: 0,
    changePercent: 0,
    reason: "Reallocation between line items - reduced travel, increased training materials",
    approvedBy: "Dr. Nasreen Ahmed",
    status: "Approved",
  },
  {
    revisionNo: "REV-003",
    date: "2025-11-10",
    project: "Maternal Health - Chattogram",
    originalBudget: 15000000,
    revisedBudget: 18000000,
    changeAmount: 3000000,
    changePercent: 20.0,
    reason: "Additional funding from UNICEF for emergency maternal care response",
    approvedBy: "Fatima Begum",
    status: "Approved",
  },
  {
    revisionNo: "REV-004",
    date: "2026-01-05",
    project: "Climate Resilience - Barishal",
    originalBudget: 35000000,
    revisedBudget: 32000000,
    changeAmount: -3000000,
    changePercent: -8.6,
    reason: "Budget reduction due to delayed project start and revised implementation timeline",
    approvedBy: "",
    status: "Pending",
  },
  {
    revisionNo: "REV-005",
    date: "2026-01-15",
    project: "Microfinance Expansion - Rangpur",
    originalBudget: 15000000,
    revisedBudget: 17500000,
    changeAmount: 2500000,
    changePercent: 16.7,
    reason: "Increased loan disbursement target based on Q3 demand assessment",
    approvedBy: "",
    status: "Pending",
  },
  {
    revisionNo: "REV-006",
    date: "2026-01-20",
    project: "Youth Skills Development",
    originalBudget: 22000000,
    revisedBudget: 24000000,
    changeAmount: 2000000,
    changePercent: 9.1,
    reason: "Additional vocational training centers in Rajshahi and Khulna",
    approvedBy: "",
    status: "Pending",
  },
  {
    revisionNo: "REV-007",
    date: "2026-01-25",
    project: "Food Security - Mymensingh",
    originalBudget: 28000000,
    revisedBudget: 25000000,
    changeAmount: -3000000,
    changePercent: -10.7,
    reason: "Reduction requested by JICA due to currency fluctuation impact on JPY grant",
    approvedBy: "Dr. Nasreen Ahmed",
    status: "Rejected",
  },
  {
    revisionNo: "REV-008",
    date: "2026-02-01",
    project: "WASH Program - Sylhet",
    originalBudget: 25000000,
    revisedBudget: 26500000,
    changeAmount: 1500000,
    changePercent: 6.0,
    reason: "Cost escalation adjustment for construction materials (steel, cement)",
    approvedBy: "",
    status: "Pending",
  },
];

function getStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "Approved": return "default";
    case "Pending": return "outline";
    case "Rejected": return "destructive";
    default: return "secondary";
  }
}

export default async function BudgetRevisionPage() {
  const t = await getTranslations('budget.revision');
  const tc = await getTranslations('common');
  const locale = await getLocale();
  const totalRevisions = revisions.length;
  const approvedCount = revisions.filter((r) => r.status === "Approved").length;
  const pendingCount = revisions.filter((r) => r.status === "Pending").length;
  const totalImpact = revisions
    .filter((r) => r.status === "Approved")
    .reduce((sum, r) => sum + r.changeAmount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          {tc('buttons.export')}
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {t('newRevision')}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('totalRevisions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileEdit className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{totalRevisions}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('approved')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <p className="text-2xl font-bold">{approvedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('pending')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <p className="text-2xl font-bold">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('totalImpact')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${totalImpact >= 0 ? "text-green-600" : "text-destructive"}`}>
              {totalImpact >= 0 ? "+" : ""}{formatCurrency(totalImpact, locale)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('revisionHistory')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">{t('revisionNo')}</TableHead>
                <TableHead className="w-[100px]">{t('date')}</TableHead>
                <TableHead>{t('project')}</TableHead>
                <TableHead className="text-right">{t('originalBudget')}</TableHead>
                <TableHead className="text-right">{t('revisedBudget')}</TableHead>
                <TableHead className="text-right">{t('change')}</TableHead>
                <TableHead className="text-right w-[80px]">{t('changePercent')}</TableHead>
                <TableHead className="w-[250px]">{t('reason')}</TableHead>
                <TableHead>{t('approvedBy')}</TableHead>
                <TableHead>{t('status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {revisions.map((revision) => (
                <TableRow key={revision.revisionNo}>
                  <TableCell className="font-mono text-sm">{revision.revisionNo}</TableCell>
                  <TableCell className="text-sm">{formatDate(revision.date, locale)}</TableCell>
                  <TableCell className="text-sm font-medium">{revision.project}</TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(revision.originalBudget, locale)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(revision.revisedBudget, locale)}
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono text-sm ${
                      revision.changeAmount > 0
                        ? "text-green-600"
                        : revision.changeAmount < 0
                        ? "text-destructive"
                        : ""
                    }`}
                  >
                    {revision.changeAmount > 0 ? "+" : ""}
                    {formatCurrency(revision.changeAmount, locale)}
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono text-sm ${
                      revision.changePercent > 0
                        ? "text-green-600"
                        : revision.changePercent < 0
                        ? "text-destructive"
                        : ""
                    }`}
                  >
                    {revision.changePercent > 0 ? "+" : ""}
                    {formatPercent(revision.changePercent, locale)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {revision.reason}
                  </TableCell>
                  <TableCell className="text-sm">
                    {revision.approvedBy || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(revision.status)}>{revision.status}</Badge>
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
