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
import { Plus, Download } from "lucide-react";
import { formatCurrency, formatDate, formatPercent } from "@/lib/formatters";

interface AssetDisposal {
  disposalId: string;
  asset: string;
  category: string;
  originalValue: number;
  bookValueAtDisposal: number;
  disposalMethod: "Sale" | "Auction" | "Scrap" | "Donation";
  recoveryAmount: number;
  disposalDate: string;
  approvedBy: string;
  status: "Pending Approval" | "Approved" | "Disposed";
}

const disposals: AssetDisposal[] = [
  {
    disposalId: "DSP-001",
    asset: "Dell Inspiron Laptop (x5) - Obsolete",
    category: "IT Equipment",
    originalValue: 500000,
    bookValueAtDisposal: 25000,
    disposalMethod: "Auction",
    recoveryAmount: 45000,
    disposalDate: "2025-11-15",
    approvedBy: "Dr. Aminul Haque",
    status: "Disposed",
  },
  {
    disposalId: "DSP-002",
    asset: "Suzuki Mehran - Accident Damaged",
    category: "Vehicle",
    originalValue: 1800000,
    bookValueAtDisposal: 350000,
    disposalMethod: "Sale",
    recoveryAmount: 280000,
    disposalDate: "2025-12-10",
    approvedBy: "Nasreen Sultana",
    status: "Disposed",
  },
  {
    disposalId: "DSP-003",
    asset: "Office Furniture Set - Worn Out",
    category: "Furniture",
    originalValue: 180000,
    bookValueAtDisposal: 12000,
    disposalMethod: "Donation",
    recoveryAmount: 0,
    disposalDate: "2026-01-05",
    approvedBy: "Dr. Aminul Haque",
    status: "Disposed",
  },
  {
    disposalId: "DSP-004",
    asset: "Epson L3150 Printer (x3)",
    category: "Office Equipment",
    originalValue: 75000,
    bookValueAtDisposal: 8000,
    disposalMethod: "Scrap",
    recoveryAmount: 3500,
    disposalDate: "2026-01-20",
    approvedBy: "Fatima Akter Ruma",
    status: "Approved",
  },
  {
    disposalId: "DSP-005",
    asset: "UPS 2KVA (x4) - Non-functional",
    category: "IT Equipment",
    originalValue: 120000,
    bookValueAtDisposal: 15000,
    disposalMethod: "Scrap",
    recoveryAmount: 8000,
    disposalDate: "2026-02-01",
    approvedBy: "",
    status: "Pending Approval",
  },
  {
    disposalId: "DSP-006",
    asset: "Nokia Feature Phones (x20)",
    category: "Communication Equipment",
    originalValue: 60000,
    bookValueAtDisposal: 0,
    disposalMethod: "Donation",
    recoveryAmount: 0,
    disposalDate: "2026-02-05",
    approvedBy: "",
    status: "Pending Approval",
  },
];

function getStatusVariant(status: string): "default" | "secondary" | "outline" {
  switch (status) {
    case "Disposed": return "default";
    case "Approved": return "secondary";
    case "Pending Approval": return "outline";
    default: return "outline";
  }
}

function getMethodVariant(method: string): "default" | "secondary" | "outline" | "destructive" {
  switch (method) {
    case "Sale": return "default";
    case "Auction": return "secondary";
    case "Scrap": return "destructive";
    case "Donation": return "outline";
    default: return "outline";
  }
}

export default async function AssetDisposalPage() {
  const t = await getTranslations('assets');
  const tc = await getTranslations('common');
  const locale = await getLocale();

  const totalDisposals = disposals.length;
  const totalBookValue = disposals.reduce((sum, d) => sum + d.bookValueAtDisposal, 0);
  const totalRecovery = disposals.reduce((sum, d) => sum + d.recoveryAmount, 0);
  const totalOriginal = disposals.reduce((sum, d) => sum + d.originalValue, 0);
  const recoveryRate = totalOriginal > 0 ? (totalRecovery / totalOriginal) * 100 : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('disposal.title')}
        description={t('disposal.description')}
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          {tc('buttons.export')}
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {t('disposal.newDisposal')}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('disposal.totalDisposals')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalDisposals}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('disposal.totalBookValue')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalBookValue, locale)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('disposal.totalRecovery')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalRecovery, locale)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('disposal.recoveryRate')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPercent(recoveryRate, locale)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('disposal.disposalRegister')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('disposal.disposalId')}</TableHead>
                <TableHead>{t('disposal.asset')}</TableHead>
                <TableHead>{t('disposal.category')}</TableHead>
                <TableHead className="text-right">{t('disposal.originalValue')}</TableHead>
                <TableHead className="text-right">{t('disposal.bookValue')}</TableHead>
                <TableHead>{t('disposal.disposalMethod')}</TableHead>
                <TableHead className="text-right">{t('disposal.recoveryAmount')}</TableHead>
                <TableHead>{t('disposal.disposalDate')}</TableHead>
                <TableHead>{t('disposal.approvedBy')}</TableHead>
                <TableHead>{tc('labels.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disposals.map((disposal) => (
                <TableRow key={disposal.disposalId}>
                  <TableCell className="font-mono text-sm">{disposal.disposalId}</TableCell>
                  <TableCell className="font-medium">{disposal.asset}</TableCell>
                  <TableCell>{disposal.category}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(disposal.originalValue, locale)}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(disposal.bookValueAtDisposal, locale)}</TableCell>
                  <TableCell>
                    <Badge variant={getMethodVariant(disposal.disposalMethod)}>{disposal.disposalMethod}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(disposal.recoveryAmount, locale)}</TableCell>
                  <TableCell>{formatDate(disposal.disposalDate, locale)}</TableCell>
                  <TableCell>{disposal.approvedBy || <span className="text-muted-foreground">--</span>}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(disposal.status)}>{disposal.status}</Badge>
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
