'use client'

import { useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';
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
import { Plus, Download, ChevronRight, ChevronDown } from "lucide-react";
import { useFormatters } from '@/hooks/use-formatters'

interface Account {
  code: string;
  name: string;
  type: string;
  balance: number;
  level: number;
  isGroup: boolean;
}

const chartOfAccounts: Account[] = [
  // Assets
  { code: "1000", name: "Assets", type: "Asset", balance: 45850000, level: 0, isGroup: true },
  { code: "1100", name: "Cash & Bank", type: "Asset", balance: 12500000, level: 1, isGroup: true },
  { code: "1101", name: "Petty Cash - Head Office", type: "Asset", balance: 150000, level: 2, isGroup: false },
  { code: "1102", name: "Sonali Bank - Current A/C", type: "Asset", balance: 8500000, level: 2, isGroup: false },
  { code: "1103", name: "BRAC Bank - Project A/C", type: "Asset", balance: 3850000, level: 2, isGroup: false },
  { code: "1200", name: "Accounts Receivable", type: "Asset", balance: 5200000, level: 1, isGroup: false },
  { code: "1300", name: "Fixed Assets", type: "Asset", balance: 28150000, level: 1, isGroup: false },
  // Liabilities
  { code: "2000", name: "Liabilities", type: "Liability", balance: 8750000, level: 0, isGroup: true },
  { code: "2100", name: "Accounts Payable", type: "Liability", balance: 3200000, level: 1, isGroup: false },
  { code: "2200", name: "Accrued Expenses", type: "Liability", balance: 1550000, level: 1, isGroup: false },
  { code: "2300", name: "Tax Payable", type: "Liability", balance: 4000000, level: 1, isGroup: false },
  // Income
  { code: "3000", name: "Income", type: "Income", balance: 125000000, level: 0, isGroup: true },
  { code: "3100", name: "Grant Income - USAID", type: "Income", balance: 55000000, level: 1, isGroup: false },
  { code: "3200", name: "Grant Income - World Bank", type: "Income", balance: 42000000, level: 1, isGroup: false },
  { code: "3300", name: "Local Donations", type: "Income", balance: 18000000, level: 1, isGroup: false },
  { code: "3400", name: "Service Fee Income", type: "Income", balance: 10000000, level: 1, isGroup: false },
  // Expenses
  { code: "4000", name: "Expenses", type: "Expense", balance: 98500000, level: 0, isGroup: true },
  { code: "4100", name: "Program Expenses", type: "Expense", balance: 62000000, level: 1, isGroup: false },
  { code: "4200", name: "Staff Salaries & Benefits", type: "Expense", balance: 24500000, level: 1, isGroup: false },
  { code: "4300", name: "Office & Admin Expenses", type: "Expense", balance: 8000000, level: 1, isGroup: false },
  { code: "4400", name: "Travel & Transportation", type: "Expense", balance: 4000000, level: 1, isGroup: false },
  // Equity
  { code: "5000", name: "Equity / Fund Balance", type: "Equity", balance: 62600000, level: 0, isGroup: true },
  { code: "5100", name: "Unrestricted Fund", type: "Equity", balance: 22600000, level: 1, isGroup: false },
  { code: "5200", name: "Restricted Fund - Donor", type: "Equity", balance: 40000000, level: 1, isGroup: false },
];

function getTypeBadgeVariant(type: string): "default" | "secondary" | "outline" | "destructive" {
  switch (type) {
    case "Asset": return "default";
    case "Liability": return "destructive";
    case "Income": return "secondary";
    case "Expense": return "outline";
    case "Equity": return "default";
    default: return "outline";
  }
}

export default function FinancePage() {
  const router = useRouter()
  const t = useTranslations('finance')
  const tc = useTranslations('common')
  const { formatCurrency } = useFormatters()

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
        <Button size="sm" onClick={() => router.push('/finance/chart-of-accounts')}>
          <Plus className="h-4 w-4 mr-2" />
          {t('chartOfAccounts.addAccount')}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('summary.totalAssets')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(45850000)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('summary.totalLiabilities')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(8750000)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('summary.totalIncome')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(125000000)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('summary.totalExpenses')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(98500000)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('chartOfAccounts.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">{t('chartOfAccounts.code')}</TableHead>
                <TableHead>{t('chartOfAccounts.accountName')}</TableHead>
                <TableHead>{t('chartOfAccounts.type')}</TableHead>
                <TableHead className="text-right">{t('common.balance')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chartOfAccounts.map((account) => (
                <TableRow
                  key={account.code}
                  className={account.level === 0 ? "bg-muted/50 font-semibold" : ""}
                >
                  <TableCell className="font-mono text-sm">{account.code}</TableCell>
                  <TableCell>
                    <div className="flex items-center" style={{ paddingLeft: `${account.level * 24}px` }}>
                      {account.isGroup ? (
                        <ChevronDown className="h-4 w-4 mr-2 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 mr-2 opacity-0" />
                      )}
                      <span className={account.level === 0 ? "font-semibold" : ""}>
                        {account.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getTypeBadgeVariant(account.type)}>{account.type}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(account.balance)}
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
