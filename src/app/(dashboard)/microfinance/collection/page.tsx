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
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { formatCurrency, formatDate, formatPercent, formatNumber } from "@/lib/formatters";

interface Collection {
  collectionId: string;
  samity: string;
  collectionDate: string;
  membersPresent: number;
  totalCollectible: number;
  amountCollected: number;
  shortfall: number;
  onTimePercent: number;
  collectedBy: string;
  status: "Completed" | "Partial" | "Missed";
}

const collections: Collection[] = [
  {
    collectionId: "COL-2026-W06-001",
    samity: "Shapla Mohila Samity",
    collectionDate: "2026-02-03",
    membersPresent: 34,
    totalCollectible: 52500,
    amountCollected: 52500,
    shortfall: 0,
    onTimePercent: 100,
    collectedBy: "Md. Rafiqul Islam",
    status: "Completed",
  },
  {
    collectionId: "COL-2026-W06-002",
    samity: "Padma Unnayan Samity",
    collectionDate: "2026-02-03",
    membersPresent: 40,
    totalCollectible: 68400,
    amountCollected: 65800,
    shortfall: 2600,
    onTimePercent: 96.2,
    collectedBy: "Kamrul Hasan",
    status: "Partial",
  },
  {
    collectionId: "COL-2026-W06-003",
    samity: "Surjomukhi Samity",
    collectionDate: "2026-02-04",
    membersPresent: 30,
    totalCollectible: 45000,
    amountCollected: 45000,
    shortfall: 0,
    onTimePercent: 100,
    collectedBy: "Nasima Begum",
    status: "Completed",
  },
  {
    collectionId: "COL-2026-W06-004",
    samity: "Meghna Sanchay Samity",
    collectionDate: "2026-02-04",
    membersPresent: 25,
    totalCollectible: 38000,
    amountCollected: 35900,
    shortfall: 2100,
    onTimePercent: 94.5,
    collectedBy: "Abdul Karim",
    status: "Partial",
  },
  {
    collectionId: "COL-2026-W06-005",
    samity: "Jamuna Mohila Dal",
    collectionDate: "2026-02-05",
    membersPresent: 37,
    totalCollectible: 57600,
    amountCollected: 56300,
    shortfall: 1300,
    onTimePercent: 97.7,
    collectedBy: "Md. Rafiqul Islam",
    status: "Partial",
  },
  {
    collectionId: "COL-2026-W06-006",
    samity: "Karnaphuli Samity",
    collectionDate: "2026-02-05",
    membersPresent: 22,
    totalCollectible: 31500,
    amountCollected: 27800,
    shortfall: 3700,
    onTimePercent: 88.3,
    collectedBy: "Faruk Ahmed",
    status: "Partial",
  },
  {
    collectionId: "COL-2026-W06-007",
    samity: "Teesta Unnayan Dal",
    collectionDate: "2026-02-06",
    membersPresent: 38,
    totalCollectible: 63000,
    amountCollected: 60200,
    shortfall: 2800,
    onTimePercent: 95.6,
    collectedBy: "Kamrul Hasan",
    status: "Partial",
  },
  {
    collectionId: "COL-2026-W06-008",
    samity: "Sundarbans Samity",
    collectionDate: "2026-02-06",
    membersPresent: 0,
    totalCollectible: 18000,
    amountCollected: 0,
    shortfall: 18000,
    onTimePercent: 0,
    collectedBy: "Taslima Akter",
    status: "Missed",
  },
];

function getStatusVariant(status: string): "default" | "secondary" | "destructive" {
  switch (status) {
    case "Completed": return "default";
    case "Partial": return "secondary";
    case "Missed": return "destructive";
    default: return "secondary";
  }
}

function getOnTimeColor(rate: number): string {
  if (rate >= 97) return "text-green-600";
  if (rate >= 92) return "text-primary";
  if (rate >= 85) return "text-orange-500";
  return "text-destructive";
}

export default async function CollectionPage() {
  const t = await getTranslations('microfinance');
  const tc = await getTranslations('common');
  const locale = await getLocale();
  const totalCollected = collections.reduce((sum, c) => sum + c.amountCollected, 0);
  const totalCollectible = collections.reduce((sum, c) => sum + c.totalCollectible, 0);
  const totalShortfall = collections.reduce((sum, c) => sum + c.shortfall, 0);
  const collectionRate = totalCollectible > 0 ? (totalCollected / totalCollectible) * 100 : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('collection.title')}
        description={t('collection.description')}
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          {tc('buttons.export')}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('collection.totalCollectedThisWeek')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalCollected, locale)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('collection.collectionRate')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPercent(collectionRate, locale)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('collection.totalCollectible')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalCollectible, locale)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('collection.shortfallAmount')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{formatCurrency(totalShortfall, locale)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('collection.weeklyCollection')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('collection.collectionId')}</TableHead>
                <TableHead>{t('collection.samity')}</TableHead>
                <TableHead>{t('collection.collectionDate')}</TableHead>
                <TableHead className="text-right">{t('collection.membersPresent')}</TableHead>
                <TableHead className="text-right">{t('collection.totalCollectible')}</TableHead>
                <TableHead className="text-right">{t('collection.amountCollected')}</TableHead>
                <TableHead className="text-right">{t('collection.shortfall')}</TableHead>
                <TableHead className="w-[160px]">{t('collection.onTimePercent')}</TableHead>
                <TableHead>{t('collection.collectedBy')}</TableHead>
                <TableHead>{t('collection.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {collections.map((col) => (
                <TableRow key={col.collectionId}>
                  <TableCell className="font-mono text-sm">{col.collectionId}</TableCell>
                  <TableCell className="font-medium">{col.samity}</TableCell>
                  <TableCell>{formatDate(col.collectionDate, locale)}</TableCell>
                  <TableCell className="text-right">{col.membersPresent}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(col.totalCollectible, locale)}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(col.amountCollected, locale)}</TableCell>
                  <TableCell className="text-right font-mono text-destructive">
                    {col.shortfall > 0 ? formatCurrency(col.shortfall, locale) : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={col.onTimePercent} className="flex-1" />
                      <span className={`text-sm font-medium w-14 text-right ${getOnTimeColor(col.onTimePercent)}`}>
                        {formatPercent(col.onTimePercent, locale)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{col.collectedBy}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(col.status)}>{col.status}</Badge>
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
