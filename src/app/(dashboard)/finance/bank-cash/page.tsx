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
import { Plus, Download, Wallet, Landmark, Smartphone, Banknote } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface CashBankAccount {
  accountCode: string;
  accountName: string;
  type: "Cash" | "Bank" | "Mobile Banking";
  bankName: string;
  accountNumber: string;
  currentBalance: number;
  currency: string;
  status: "Active" | "Inactive" | "Dormant";
}

const accounts: CashBankAccount[] = [
  {
    accountCode: "1101",
    accountName: "Petty Cash - Head Office (Mohakhali)",
    type: "Cash",
    bankName: "-",
    accountNumber: "-",
    currentBalance: 150000,
    currency: "BDT",
    status: "Active",
  },
  {
    accountCode: "1102",
    accountName: "Petty Cash - Sylhet Field Office",
    type: "Cash",
    bankName: "-",
    accountNumber: "-",
    currentBalance: 75000,
    currency: "BDT",
    status: "Active",
  },
  {
    accountCode: "1103",
    accountName: "Petty Cash - Chattogram Field Office",
    type: "Cash",
    bankName: "-",
    accountNumber: "-",
    currentBalance: 60000,
    currency: "BDT",
    status: "Active",
  },
  {
    accountCode: "1201",
    accountName: "Sonali Bank - Current Account",
    type: "Bank",
    bankName: "Sonali Bank Ltd.",
    accountNumber: "****-****-4521",
    currentBalance: 8500000,
    currency: "BDT",
    status: "Active",
  },
  {
    accountCode: "1202",
    accountName: "BRAC Bank - Project Account (USAID)",
    type: "Bank",
    bankName: "BRAC Bank Ltd.",
    accountNumber: "****-****-7832",
    currentBalance: 3850000,
    currency: "BDT",
    status: "Active",
  },
  {
    accountCode: "1203",
    accountName: "Dutch-Bangla Bank - Savings Account",
    type: "Bank",
    bankName: "Dutch-Bangla Bank Ltd.",
    accountNumber: "****-****-6190",
    currentBalance: 12400000,
    currency: "BDT",
    status: "Active",
  },
  {
    accountCode: "1204",
    accountName: "Standard Chartered - Donor Fund (USD)",
    type: "Bank",
    bankName: "Standard Chartered Bank",
    accountNumber: "****-****-3045",
    currentBalance: 22500000,
    currency: "BDT",
    status: "Active",
  },
  {
    accountCode: "1205",
    accountName: "Sonali Bank - Microfinance Operations",
    type: "Bank",
    bankName: "Sonali Bank Ltd.",
    accountNumber: "****-****-8877",
    currentBalance: 5600000,
    currency: "BDT",
    status: "Active",
  },
  {
    accountCode: "1301",
    accountName: "bKash Organization Account",
    type: "Mobile Banking",
    bankName: "bKash",
    accountNumber: "****-****-9012",
    currentBalance: 320000,
    currency: "BDT",
    status: "Active",
  },
  {
    accountCode: "1302",
    accountName: "Nagad Organization Account",
    type: "Mobile Banking",
    bankName: "Nagad",
    accountNumber: "****-****-5567",
    currentBalance: 185000,
    currency: "BDT",
    status: "Active",
  },
];

function getTypeVariant(type: string): "default" | "secondary" | "outline" | "destructive" {
  switch (type) {
    case "Cash": return "secondary";
    case "Bank": return "default";
    case "Mobile Banking": return "outline";
    default: return "secondary";
  }
}

function getStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "Active": return "default";
    case "Inactive": return "outline";
    case "Dormant": return "destructive";
    default: return "secondary";
  }
}

export default async function BankCashPage() {
  const t = await getTranslations('finance.bankCash');
  const tc = await getTranslations('common');
  const locale = await getLocale();
  const totalCash = accounts
    .filter((a) => a.type === "Cash")
    .reduce((sum, a) => sum + a.currentBalance, 0);
  const totalBank = accounts
    .filter((a) => a.type === "Bank")
    .reduce((sum, a) => sum + a.currentBalance, 0);
  const totalMobile = accounts
    .filter((a) => a.type === "Mobile Banking")
    .reduce((sum, a) => sum + a.currentBalance, 0);
  const grandTotal = totalCash + totalBank + totalMobile;

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
          {t('addAccount')}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('totalCash')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{formatCurrency(totalCash, locale)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('totalBank')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Landmark className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{formatCurrency(totalBank, locale)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('totalMobileBanking')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{formatCurrency(totalMobile, locale)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('grandTotal')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{formatCurrency(grandTotal, locale)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('cashBankAccounts')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[90px]">{t('code')}</TableHead>
                <TableHead>{t('accountName')}</TableHead>
                <TableHead>{t('type')}</TableHead>
                <TableHead>{t('bankName')}</TableHead>
                <TableHead>{t('accountNumber')}</TableHead>
                <TableHead className="text-right">{t('currentBalance')}</TableHead>
                <TableHead className="w-[80px]">{t('currency')}</TableHead>
                <TableHead>{t('status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.accountCode}>
                  <TableCell className="font-mono text-sm">{account.accountCode}</TableCell>
                  <TableCell className="text-sm font-medium">{account.accountName}</TableCell>
                  <TableCell>
                    <Badge variant={getTypeVariant(account.type)}>{account.type}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{account.bankName}</TableCell>
                  <TableCell className="font-mono text-sm">{account.accountNumber}</TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(account.currentBalance, locale)}
                  </TableCell>
                  <TableCell className="text-sm">{account.currency}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(account.status)}>{account.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell colSpan={5} className="text-right font-semibold">
                  {t('grandTotal')}
                </TableCell>
                <TableCell className="text-right font-mono font-semibold">
                  {formatCurrency(grandTotal, locale)}
                </TableCell>
                <TableCell colSpan={2} />
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
