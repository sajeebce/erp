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
import { formatPercent, formatDate } from "@/lib/formatters";

interface ImpactIndicator {
  id: string;
  name: string;
  baseline: number;
  target: number;
  currentValue: number;
  achievement: number;
  dataSource: string;
  lastUpdated: string;
}

const indicators: ImpactIndicator[] = [
  {
    id: "IND-001",
    name: "Access to Safe Water",
    baseline: 42,
    target: 85,
    currentValue: 71,
    achievement: 83.5,
    dataSource: "Household Survey",
    lastUpdated: "2026-01-15",
  },
  {
    id: "IND-002",
    name: "School Enrollment Rate",
    baseline: 68,
    target: 95,
    currentValue: 89,
    achievement: 93.7,
    dataSource: "Education MIS",
    lastUpdated: "2026-01-20",
  },
  {
    id: "IND-003",
    name: "Maternal Health Visits",
    baseline: 35,
    target: 80,
    currentValue: 62,
    achievement: 77.5,
    dataSource: "Health Facility Records",
    lastUpdated: "2026-01-10",
  },
  {
    id: "IND-004",
    name: "Income Increase",
    baseline: 15,
    target: 45,
    currentValue: 38,
    achievement: 84.4,
    dataSource: "Beneficiary Survey",
    lastUpdated: "2025-12-28",
  },
  {
    id: "IND-005",
    name: "Loan Repayment Rate",
    baseline: 78,
    target: 95,
    currentValue: 91,
    achievement: 95.8,
    dataSource: "MFI Portfolio Data",
    lastUpdated: "2026-01-25",
  },
  {
    id: "IND-006",
    name: "Agricultural Yield",
    baseline: 22,
    target: 50,
    currentValue: 41,
    achievement: 82.0,
    dataSource: "Field Assessment",
    lastUpdated: "2025-12-15",
  },
  {
    id: "IND-007",
    name: "Training Completion Rate",
    baseline: 55,
    target: 90,
    currentValue: 82,
    achievement: 91.1,
    dataSource: "Training Register",
    lastUpdated: "2026-01-18",
  },
  {
    id: "IND-008",
    name: "Sanitation Coverage",
    baseline: 30,
    target: 75,
    currentValue: 58,
    achievement: 77.3,
    dataSource: "WASH Monitoring",
    lastUpdated: "2026-01-05",
  },
];

function getAchievementVariant(achievement: number): "default" | "secondary" | "destructive" | "outline" {
  if (achievement >= 90) return "default";
  if (achievement >= 75) return "secondary";
  if (achievement >= 50) return "outline";
  return "destructive";
}

function getProgressColor(achievement: number): string {
  if (achievement >= 90) return "[&>div]:bg-emerald-500";
  if (achievement >= 75) return "[&>div]:bg-amber-500";
  return "[&>div]:bg-red-500";
}

export default async function ImpactAssessmentPage() {
  const t = await getTranslations('beneficiaries');
  const tc = await getTranslations('common');
  const locale = await getLocale();

  const totalIndicators = indicators.length;
  const onTarget = indicators.filter((i) => i.achievement >= 80).length;
  const belowTarget = indicators.filter((i) => i.achievement < 80).length;
  const latestUpdate = indicators
    .map((i) => i.lastUpdated)
    .sort()
    .reverse()[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('impactAssessment.title')}
        description={t('impactAssessment.description')}
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          {t('impactAssessment.exportReport')}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('impactAssessment.indicatorsTracked')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalIndicators}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('impactAssessment.onTarget')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{onTarget}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('impactAssessment.belowTarget')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{belowTarget}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('impactAssessment.dataFreshness')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatDate(latestUpdate, locale)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('impactAssessment.impactIndicators')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('impactAssessment.indicatorName')}</TableHead>
                <TableHead className="text-right">{t('impactAssessment.baseline')} (%)</TableHead>
                <TableHead className="text-right">{t('impactAssessment.target')} (%)</TableHead>
                <TableHead className="text-right">{t('impactAssessment.current')} (%)</TableHead>
                <TableHead className="w-[200px]">{t('impactAssessment.achievement')}</TableHead>
                <TableHead>{t('impactAssessment.dataSource')}</TableHead>
                <TableHead>{t('impactAssessment.lastUpdated')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {indicators.map((indicator) => (
                <TableRow key={indicator.id}>
                  <TableCell className="font-medium">{indicator.name}</TableCell>
                  <TableCell className="text-right font-mono">{formatPercent(indicator.baseline, locale)}</TableCell>
                  <TableCell className="text-right font-mono">{formatPercent(indicator.target, locale)}</TableCell>
                  <TableCell className="text-right font-mono">{formatPercent(indicator.currentValue, locale)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={Math.min(indicator.achievement, 100)}
                        className={`flex-1 h-2 ${getProgressColor(indicator.achievement)}`}
                      />
                      <Badge variant={getAchievementVariant(indicator.achievement)} className="text-[10px] w-14 justify-center">
                        {formatPercent(indicator.achievement, locale)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{indicator.dataSource}</TableCell>
                  <TableCell>{formatDate(indicator.lastUpdated, locale)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
