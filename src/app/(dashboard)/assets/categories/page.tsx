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
import { formatCurrency, formatPercent } from "@/lib/formatters";

interface AssetCategory {
  code: string;
  name: string;
  usefulLife: number;
  depreciationMethod: "Straight Line" | "Declining Balance";
  depreciationRate: number;
  assetCount: number;
  totalValue: number;
  status: "Active" | "Inactive";
}

const categories: AssetCategory[] = [
  {
    code: "CAT-01",
    name: "Vehicle",
    usefulLife: 10,
    depreciationMethod: "Straight Line",
    depreciationRate: 10,
    assetCount: 8,
    totalValue: 15200000,
    status: "Active",
  },
  {
    code: "CAT-02",
    name: "IT Equipment",
    usefulLife: 4,
    depreciationMethod: "Declining Balance",
    depreciationRate: 25,
    assetCount: 42,
    totalValue: 4850000,
    status: "Active",
  },
  {
    code: "CAT-03",
    name: "Office Equipment",
    usefulLife: 5,
    depreciationMethod: "Straight Line",
    depreciationRate: 20,
    assetCount: 25,
    totalValue: 3200000,
    status: "Active",
  },
  {
    code: "CAT-04",
    name: "Furniture",
    usefulLife: 8,
    depreciationMethod: "Straight Line",
    depreciationRate: 12.5,
    assetCount: 65,
    totalValue: 2450000,
    status: "Active",
  },
  {
    code: "CAT-05",
    name: "Program Equipment",
    usefulLife: 5,
    depreciationMethod: "Straight Line",
    depreciationRate: 20,
    assetCount: 18,
    totalValue: 5600000,
    status: "Active",
  },
  {
    code: "CAT-06",
    name: "Land & Building",
    usefulLife: 40,
    depreciationMethod: "Straight Line",
    depreciationRate: 2.5,
    assetCount: 3,
    totalValue: 45000000,
    status: "Active",
  },
  {
    code: "CAT-07",
    name: "Communication Equipment",
    usefulLife: 5,
    depreciationMethod: "Declining Balance",
    depreciationRate: 20,
    assetCount: 15,
    totalValue: 1850000,
    status: "Active",
  },
];

function getStatusVariant(status: string): "default" | "outline" {
  return status === "Active" ? "default" : "outline";
}

export default async function AssetCategoriesPage() {
  const t = await getTranslations('assets');
  const tc = await getTranslations('common');
  const locale = await getLocale();

  const totalCategories = categories.length;
  const totalAssets = categories.reduce((sum, c) => sum + c.assetCount, 0);
  const totalValue = categories.reduce((sum, c) => sum + c.totalValue, 0);
  const avgDepreciationRate =
    categories.reduce((sum, c) => sum + c.depreciationRate, 0) / categories.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('categories.title')}
        description={t('categories.description')}
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          {tc('buttons.export')}
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {t('categories.addCategory')}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('categories.totalCategories')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalCategories}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('categories.totalAssets')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalAssets}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('categories.totalValue')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalValue, locale)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('categories.avgDepreciationRate')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPercent(avgDepreciationRate, locale)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('categories.categoryConfiguration')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('categories.categoryCode')}</TableHead>
                <TableHead>{t('categories.name')}</TableHead>
                <TableHead className="text-right">{t('categories.usefulLife')}</TableHead>
                <TableHead>{t('categories.depreciationMethod')}</TableHead>
                <TableHead className="text-right">{t('categories.depreciationRate')}</TableHead>
                <TableHead className="text-right">{t('categories.assetCount')}</TableHead>
                <TableHead className="text-right">{t('categories.totalValue')}</TableHead>
                <TableHead>{tc('labels.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.code}>
                  <TableCell className="font-mono text-sm">{category.code}</TableCell>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-right">{category.usefulLife}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{category.depreciationMethod}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">{formatPercent(category.depreciationRate, locale)}</TableCell>
                  <TableCell className="text-right">{category.assetCount}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(category.totalValue, locale)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(category.status)}>{category.status}</Badge>
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
