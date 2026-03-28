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
import { formatCurrency, formatDate } from "@/lib/formatters";

interface Tender {
  id: string;
  title: string;
  category: string;
  publicationDate: string;
  closingDate: string;
  estimatedValue: number;
  bidsReceived: number;
  status: "Open" | "Evaluation" | "Awarded" | "Cancelled";
}

const tenders: Tender[] = [
  {
    id: "TNR-2026-001",
    title: "Supply of IT Equipment for Head Office",
    category: "IT Equipment",
    publicationDate: "2026-01-02",
    closingDate: "2026-01-30",
    estimatedValue: 1500000,
    bidsReceived: 5,
    status: "Evaluation",
  },
  {
    id: "TNR-2026-002",
    title: "Construction of Tube Wells - Sylhet Division",
    category: "Civil Works",
    publicationDate: "2026-01-05",
    closingDate: "2026-02-05",
    estimatedValue: 3200000,
    bidsReceived: 4,
    status: "Open",
  },
  {
    id: "TNR-2026-003",
    title: "Annual Office Stationery Supply Contract",
    category: "Office Supplies",
    publicationDate: "2025-12-15",
    closingDate: "2026-01-15",
    estimatedValue: 450000,
    bidsReceived: 7,
    status: "Awarded",
  },
  {
    id: "TNR-2026-004",
    title: "Medical Supplies for Health Camps - Chattogram",
    category: "Medical Supplies",
    publicationDate: "2026-01-10",
    closingDate: "2026-02-10",
    estimatedValue: 850000,
    bidsReceived: 3,
    status: "Open",
  },
  {
    id: "TNR-2026-005",
    title: "Vehicle Hiring for Field Operations (12 months)",
    category: "Transport Services",
    publicationDate: "2026-01-12",
    closingDate: "2026-02-12",
    estimatedValue: 2400000,
    bidsReceived: 6,
    status: "Evaluation",
  },
  {
    id: "TNR-2026-006",
    title: "Solar Panel Installation - Rangpur Field Offices",
    category: "Renewable Energy",
    publicationDate: "2026-01-15",
    closingDate: "2026-02-15",
    estimatedValue: 1800000,
    bidsReceived: 0,
    status: "Open",
  },
  {
    id: "TNR-2026-007",
    title: "Consultancy for M&E Framework Development",
    category: "Consultancy",
    publicationDate: "2025-12-20",
    closingDate: "2026-01-20",
    estimatedValue: 600000,
    bidsReceived: 4,
    status: "Awarded",
  },
  {
    id: "TNR-2026-008",
    title: "Agricultural Input Supply - Mymensingh Region",
    category: "Agricultural Inputs",
    publicationDate: "2025-11-30",
    closingDate: "2025-12-30",
    estimatedValue: 950000,
    bidsReceived: 2,
    status: "Cancelled",
  },
];

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "Open": return "secondary";
    case "Evaluation": return "outline";
    case "Awarded": return "default";
    case "Cancelled": return "destructive";
    default: return "outline";
  }
}

export default async function ETenderingPage() {
  const t = await getTranslations('procurement');
  const tc = await getTranslations('common');
  const locale = await getLocale();

  const openTenders = tenders.filter((t) => t.status === "Open").length;
  const underEvaluation = tenders.filter((t) => t.status === "Evaluation").length;
  const totalValue = tenders
    .filter((t) => t.status !== "Cancelled")
    .reduce((sum, t) => sum + t.estimatedValue, 0);
  const tendersWithBids = tenders.filter((t) => t.bidsReceived > 0);
  const avgBidsPerTender =
    tendersWithBids.length > 0
      ? (tendersWithBids.reduce((sum, t) => sum + t.bidsReceived, 0) / tendersWithBids.length).toFixed(1)
      : "0";

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('eTendering.title')}
        description={t('eTendering.description')}
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          {tc('buttons.export')}
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {t('eTendering.newTender')}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('eTendering.openTenders')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{openTenders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('eTendering.underEvaluation')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{underEvaluation}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('eTendering.totalValue')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalValue, locale)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('eTendering.avgBidsPerTender')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{avgBidsPerTender}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('eTendering.tenderRegister')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">{t('eTendering.tenderNo')}</TableHead>
                <TableHead>{t('eTendering.title2')}</TableHead>
                <TableHead>{t('eTendering.category')}</TableHead>
                <TableHead>{t('eTendering.publicationDate')}</TableHead>
                <TableHead>{t('eTendering.closingDate')}</TableHead>
                <TableHead className="text-right">{t('eTendering.estimatedValue')}</TableHead>
                <TableHead className="text-center">{t('eTendering.bidsReceived')}</TableHead>
                <TableHead>{tc('labels.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenders.map((tender) => (
                <TableRow key={tender.id}>
                  <TableCell className="font-mono text-sm">{tender.id}</TableCell>
                  <TableCell className="font-medium max-w-[250px] truncate">{tender.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {tender.category}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(tender.publicationDate, locale)}</TableCell>
                  <TableCell>{formatDate(tender.closingDate, locale)}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(tender.estimatedValue, locale)}</TableCell>
                  <TableCell className="text-center">{tender.bidsReceived}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(tender.status)}>
                      {tender.status}
                    </Badge>
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
