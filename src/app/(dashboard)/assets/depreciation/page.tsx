import { getTranslations, getLocale } from 'next-intl/server';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Calculator } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";

interface DepreciationEntry {
  assetId: string;
  name: string;
  category: string;
  purchaseDate: string;
  originalCost: number;
  accumulatedDepreciation: number;
  netBookValue: number;
  annualDepreciation: number;
  monthlyDepreciation: number;
}

const depreciationSchedule: DepreciationEntry[] = [
  {
    assetId: "AST-001",
    name: "Toyota Hilux Pickup - Dhaka",
    category: "Vehicle",
    purchaseDate: "2022-03-15",
    originalCost: 4500000,
    accumulatedDepreciation: 1350000,
    netBookValue: 3150000,
    annualDepreciation: 450000,
    monthlyDepreciation: 37500,
  },
  {
    assetId: "AST-002",
    name: "Dell OptiPlex Desktop (x10)",
    category: "IT Equipment",
    purchaseDate: "2023-06-01",
    originalCost: 800000,
    accumulatedDepreciation: 240000,
    netBookValue: 560000,
    annualDepreciation: 200000,
    monthlyDepreciation: 16667,
  },
  {
    assetId: "AST-003",
    name: "Honda CRF 150 Motorcycle",
    category: "Vehicle",
    purchaseDate: "2023-01-20",
    originalCost: 350000,
    accumulatedDepreciation: 87500,
    netBookValue: 262500,
    annualDepreciation: 35000,
    monthlyDepreciation: 2917,
  },
  {
    assetId: "AST-004",
    name: "Canon ImageRunner Photocopier",
    category: "Office Equipment",
    purchaseDate: "2021-11-10",
    originalCost: 250000,
    accumulatedDepreciation: 125000,
    netBookValue: 125000,
    annualDepreciation: 50000,
    monthlyDepreciation: 4167,
  },
  {
    assetId: "AST-005",
    name: "Samsung Split AC 2 Ton (x5)",
    category: "Office Equipment",
    purchaseDate: "2023-04-15",
    originalCost: 450000,
    accumulatedDepreciation: 112500,
    netBookValue: 337500,
    annualDepreciation: 90000,
    monthlyDepreciation: 7500,
  },
  {
    assetId: "AST-006",
    name: "Water Quality Testing Lab Kit",
    category: "Program Equipment",
    purchaseDate: "2024-02-01",
    originalCost: 1200000,
    accumulatedDepreciation: 120000,
    netBookValue: 1080000,
    annualDepreciation: 240000,
    monthlyDepreciation: 20000,
  },
  {
    assetId: "AST-007",
    name: "Toyota Noah Microbus",
    category: "Vehicle",
    purchaseDate: "2020-08-20",
    originalCost: 5500000,
    accumulatedDepreciation: 2750000,
    netBookValue: 2750000,
    annualDepreciation: 550000,
    monthlyDepreciation: 45833,
  },
  {
    assetId: "AST-008",
    name: "HP ProBook Laptop (x15)",
    category: "IT Equipment",
    purchaseDate: "2024-01-10",
    originalCost: 2250000,
    accumulatedDepreciation: 225000,
    netBookValue: 2025000,
    annualDepreciation: 562500,
    monthlyDepreciation: 46875,
  },
  {
    assetId: "AST-009",
    name: "Diesel Generator 10KVA",
    category: "Office Equipment",
    purchaseDate: "2022-09-05",
    originalCost: 380000,
    accumulatedDepreciation: 152000,
    netBookValue: 228000,
    annualDepreciation: 76000,
    monthlyDepreciation: 6333,
  },
  {
    assetId: "AST-010",
    name: "Conference Room Furniture Set",
    category: "Furniture",
    purchaseDate: "2021-05-12",
    originalCost: 320000,
    accumulatedDepreciation: 160000,
    netBookValue: 160000,
    annualDepreciation: 40000,
    monthlyDepreciation: 3333,
  },
];

export default async function DepreciationPage() {
  const t = await getTranslations('assets');
  const tc = await getTranslations('common');
  const locale = await getLocale();

  const totalOriginalCost = depreciationSchedule.reduce((sum, d) => sum + d.originalCost, 0);
  const totalAccumulated = depreciationSchedule.reduce((sum, d) => sum + d.accumulatedDepreciation, 0);
  const totalNetBook = depreciationSchedule.reduce((sum, d) => sum + d.netBookValue, 0);
  const currentYearDepreciation = depreciationSchedule.reduce((sum, d) => sum + d.annualDepreciation, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('depreciation.title')}
        description={t('depreciation.description')}
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          {tc('buttons.export')}
        </Button>
        <Button size="sm">
          <Calculator className="h-4 w-4 mr-2" />
          {t('depreciation.runDepreciation')}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('depreciation.totalOriginalCost')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalOriginalCost, locale)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('depreciation.totalAccumulatedDep')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalAccumulated, locale)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('depreciation.totalNetBookValue')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalNetBook, locale)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('depreciation.currentYearDep')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(currentYearDepreciation, locale)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('depreciation.depreciationRegister')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('depreciation.assetId')}</TableHead>
                <TableHead>{t('depreciation.assetName')}</TableHead>
                <TableHead>{t('depreciation.category')}</TableHead>
                <TableHead>{t('depreciation.purchaseDate')}</TableHead>
                <TableHead className="text-right">{t('depreciation.originalCost')}</TableHead>
                <TableHead className="text-right">{t('depreciation.accumDepreciation')}</TableHead>
                <TableHead className="text-right">{t('depreciation.netBookValue')}</TableHead>
                <TableHead className="text-right">{t('depreciation.annualDepreciation')}</TableHead>
                <TableHead className="text-right">{t('depreciation.monthlyDepreciation')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {depreciationSchedule.map((entry) => (
                <TableRow key={entry.assetId}>
                  <TableCell className="font-mono text-sm">{entry.assetId}</TableCell>
                  <TableCell className="font-medium">{entry.name}</TableCell>
                  <TableCell>{entry.category}</TableCell>
                  <TableCell>{formatDate(entry.purchaseDate, locale)}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(entry.originalCost, locale)}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(entry.accumulatedDepreciation, locale)}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(entry.netBookValue, locale)}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(entry.annualDepreciation, locale)}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(entry.monthlyDepreciation, locale)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
