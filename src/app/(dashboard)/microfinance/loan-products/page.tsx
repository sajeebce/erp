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
import { formatCurrency, formatPercent, formatNumber } from "@/lib/formatters";

interface LoanProduct {
  productCode: string;
  name: string;
  category: string;
  minAmount: number;
  maxAmount: number;
  interestRate: number;
  duration: number;
  repaymentFrequency: string;
  gracePeriod: number;
  serviceCharge: number;
  activeLoans: number;
  status: "Active" | "Inactive" | "Pilot";
}

const loanProducts: LoanProduct[] = [
  {
    productCode: "LP-001",
    name: "Jagoron",
    category: "Income Generating",
    minAmount: 10000,
    maxAmount: 50000,
    interestRate: 24.0,
    duration: 12,
    repaymentFrequency: "Weekly",
    gracePeriod: 0,
    serviceCharge: 1.0,
    activeLoans: 1245,
    status: "Active",
  },
  {
    productCode: "LP-002",
    name: "Krishi",
    category: "Agriculture",
    minAmount: 15000,
    maxAmount: 100000,
    interestRate: 20.0,
    duration: 12,
    repaymentFrequency: "Monthly",
    gracePeriod: 3,
    serviceCharge: 1.0,
    activeLoans: 892,
    status: "Active",
  },
  {
    productCode: "LP-003",
    name: "Shiksha",
    category: "Education",
    minAmount: 5000,
    maxAmount: 30000,
    interestRate: 15.0,
    duration: 18,
    repaymentFrequency: "Monthly",
    gracePeriod: 6,
    serviceCharge: 0.5,
    activeLoans: 456,
    status: "Active",
  },
  {
    productCode: "LP-004",
    name: "Griha",
    category: "Housing",
    minAmount: 50000,
    maxAmount: 300000,
    interestRate: 22.0,
    duration: 36,
    repaymentFrequency: "Monthly",
    gracePeriod: 1,
    serviceCharge: 1.5,
    activeLoans: 234,
    status: "Active",
  },
  {
    productCode: "LP-005",
    name: "Apatkalin",
    category: "Emergency",
    minAmount: 2000,
    maxAmount: 15000,
    interestRate: 12.0,
    duration: 6,
    repaymentFrequency: "Weekly",
    gracePeriod: 0,
    serviceCharge: 0.5,
    activeLoans: 178,
    status: "Active",
  },
  {
    productCode: "LP-006",
    name: "Mousumi",
    category: "Seasonal Crop",
    minAmount: 20000,
    maxAmount: 80000,
    interestRate: 18.0,
    duration: 9,
    repaymentFrequency: "Monthly",
    gracePeriod: 4,
    serviceCharge: 1.0,
    activeLoans: 315,
    status: "Active",
  },
];

function getStatusVariant(status: string): "default" | "secondary" | "outline" {
  switch (status) {
    case "Active": return "default";
    case "Pilot": return "secondary";
    case "Inactive": return "outline";
    default: return "outline";
  }
}

function getCategoryColor(category: string): "default" | "secondary" | "outline" | "destructive" {
  switch (category) {
    case "Income Generating": return "default";
    case "Agriculture": return "secondary";
    case "Education": return "outline";
    case "Housing": return "secondary";
    case "Emergency": return "destructive";
    case "Seasonal Crop": return "outline";
    default: return "outline";
  }
}

export default async function LoanProductsPage() {
  const t = await getTranslations('microfinance');
  const tc = await getTranslations('common');
  const locale = await getLocale();
  const totalProducts = loanProducts.length;
  const totalActiveLoans = loanProducts.reduce((sum, p) => sum + p.activeLoans, 0);
  const totalPortfolio = loanProducts.reduce((sum, p) => sum + p.activeLoans * ((p.minAmount + p.maxAmount) / 2), 0);
  const avgInterestRate = loanProducts.reduce((sum, p) => sum + p.interestRate, 0) / loanProducts.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('loanProducts.title')}
        description={t('loanProducts.description')}
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          {tc('buttons.export')}
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {t('loanProducts.newProduct')}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('loanProducts.totalProducts')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(totalProducts, locale)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('loanProducts.activeLoans')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(totalActiveLoans, locale)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('loanProducts.totalPortfolio')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalPortfolio, locale)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('loanProducts.avgInterestRate')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPercent(avgInterestRate, locale)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('loanProducts.catalog')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('loanProducts.productCode')}</TableHead>
                <TableHead>{t('loanProducts.name')}</TableHead>
                <TableHead>{t('loanProducts.category')}</TableHead>
                <TableHead className="text-right">{t('loanProducts.minAmount')}</TableHead>
                <TableHead className="text-right">{t('loanProducts.maxAmount')}</TableHead>
                <TableHead className="text-right">{t('loanProducts.interestRate')}</TableHead>
                <TableHead className="text-right">{t('loanProducts.duration')}</TableHead>
                <TableHead>{t('loanProducts.repayment')}</TableHead>
                <TableHead className="text-right">{t('loanProducts.gracePeriod')}</TableHead>
                <TableHead className="text-right">{t('loanProducts.serviceCharge')}</TableHead>
                <TableHead className="text-right">{t('loanProducts.activeLoans')}</TableHead>
                <TableHead>{t('loanProducts.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loanProducts.map((product) => (
                <TableRow key={product.productCode}>
                  <TableCell className="font-mono text-sm">{product.productCode}</TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <Badge variant={getCategoryColor(product.category)}>{product.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(product.minAmount, locale)}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(product.maxAmount, locale)}</TableCell>
                  <TableCell className="text-right">{formatPercent(product.interestRate, locale)}</TableCell>
                  <TableCell className="text-right">{product.duration} {t('loanProducts.months')}</TableCell>
                  <TableCell>{product.repaymentFrequency}</TableCell>
                  <TableCell className="text-right">{product.gracePeriod > 0 ? `${product.gracePeriod} ${t('loanProducts.months')}` : t('loanProducts.none')}</TableCell>
                  <TableCell className="text-right">{formatPercent(product.serviceCharge, locale)}</TableCell>
                  <TableCell className="text-right">{formatNumber(product.activeLoans, locale)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(product.status)}>{product.status}</Badge>
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
