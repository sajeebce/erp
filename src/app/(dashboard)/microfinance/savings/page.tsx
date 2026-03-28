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
import { formatCurrency, formatDate, formatNumber } from "@/lib/formatters";

interface SavingsAccount {
  accountId: string;
  memberName: string;
  samity: string;
  savingsType: "Compulsory" | "Voluntary" | "Fixed Deposit" | "DPS";
  balance: number;
  monthlyDeposit: number;
  totalDeposited: number;
  interestEarned: number;
  lastTransaction: string;
  status: "Active" | "Dormant" | "Matured" | "Closed";
}

const savingsAccounts: SavingsAccount[] = [
  {
    accountId: "SAV-001",
    memberName: "Fatema Begum",
    samity: "Shapla Mohila Samity",
    savingsType: "Compulsory",
    balance: 18500,
    monthlyDeposit: 200,
    totalDeposited: 17200,
    interestEarned: 1300,
    lastTransaction: "2026-02-03",
    status: "Active",
  },
  {
    accountId: "SAV-002",
    memberName: "Rina Akter",
    samity: "Padma Unnayan Samity",
    savingsType: "Voluntary",
    balance: 45000,
    monthlyDeposit: 1000,
    totalDeposited: 42000,
    interestEarned: 3000,
    lastTransaction: "2026-02-03",
    status: "Active",
  },
  {
    accountId: "SAV-003",
    memberName: "Halima Khatun",
    samity: "Surjomukhi Samity",
    savingsType: "Compulsory",
    balance: 12800,
    monthlyDeposit: 200,
    totalDeposited: 12000,
    interestEarned: 800,
    lastTransaction: "2026-02-04",
    status: "Active",
  },
  {
    accountId: "SAV-004",
    memberName: "Monowara Begum",
    samity: "Meghna Sanchay Samity",
    savingsType: "Fixed Deposit",
    balance: 100000,
    monthlyDeposit: 0,
    totalDeposited: 100000,
    interestEarned: 0,
    lastTransaction: "2025-11-15",
    status: "Active",
  },
  {
    accountId: "SAV-005",
    memberName: "Shahida Parveen",
    samity: "Jamuna Mohila Dal",
    savingsType: "DPS",
    balance: 36500,
    monthlyDeposit: 500,
    totalDeposited: 34000,
    interestEarned: 2500,
    lastTransaction: "2026-02-05",
    status: "Active",
  },
  {
    accountId: "SAV-006",
    memberName: "Nasreen Sultana",
    samity: "Karnaphuli Samity",
    savingsType: "Compulsory",
    balance: 8200,
    monthlyDeposit: 200,
    totalDeposited: 7800,
    interestEarned: 400,
    lastTransaction: "2026-01-15",
    status: "Dormant",
  },
  {
    accountId: "SAV-007",
    memberName: "Amena Khatun",
    samity: "Teesta Unnayan Dal",
    savingsType: "Voluntary",
    balance: 28000,
    monthlyDeposit: 500,
    totalDeposited: 26000,
    interestEarned: 2000,
    lastTransaction: "2026-02-06",
    status: "Active",
  },
  {
    accountId: "SAV-008",
    memberName: "Rekha Rani Das",
    samity: "Shapla Mohila Samity",
    savingsType: "Compulsory",
    balance: 15600,
    monthlyDeposit: 200,
    totalDeposited: 14800,
    interestEarned: 800,
    lastTransaction: "2026-02-03",
    status: "Active",
  },
  {
    accountId: "SAV-009",
    memberName: "Bilkis Begum",
    samity: "Padma Unnayan Samity",
    savingsType: "DPS",
    balance: 62000,
    monthlyDeposit: 1000,
    totalDeposited: 58000,
    interestEarned: 4000,
    lastTransaction: "2026-02-03",
    status: "Active",
  },
  {
    accountId: "SAV-010",
    memberName: "Jorina Begum",
    samity: "Sundarbans Samity",
    savingsType: "Compulsory",
    balance: 5400,
    monthlyDeposit: 200,
    totalDeposited: 5200,
    interestEarned: 200,
    lastTransaction: "2025-10-20",
    status: "Dormant",
  },
];

function getStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "Active": return "default";
    case "Matured": return "secondary";
    case "Dormant": return "outline";
    case "Closed": return "destructive";
    default: return "outline";
  }
}

function getSavingsTypeVariant(type: string): "default" | "secondary" | "outline" {
  switch (type) {
    case "Compulsory": return "default";
    case "Voluntary": return "secondary";
    case "Fixed Deposit": return "outline";
    case "DPS": return "secondary";
    default: return "outline";
  }
}

export default async function SavingsPage() {
  const t = await getTranslations('microfinance');
  const tc = await getTranslations('common');
  const locale = await getLocale();
  const totalSavingsPortfolio = savingsAccounts.reduce((sum, a) => sum + a.balance, 0);
  const compulsorySavings = savingsAccounts
    .filter((a) => a.savingsType === "Compulsory")
    .reduce((sum, a) => sum + a.balance, 0);
  const voluntarySavings = savingsAccounts
    .filter((a) => a.savingsType === "Voluntary" || a.savingsType === "Fixed Deposit" || a.savingsType === "DPS")
    .reduce((sum, a) => sum + a.balance, 0);
  const totalMembers = savingsAccounts.filter((a) => a.status === "Active").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('savings.title')}
        description={t('savings.description')}
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          {tc('buttons.export')}
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {t('savings.newAccount')}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('savings.totalSavingsPortfolio')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalSavingsPortfolio, locale)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('savings.compulsorySavings')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(compulsorySavings, locale)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('savings.voluntarySavings')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(voluntarySavings, locale)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('savings.activeMembers')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(totalMembers, locale)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('savings.savingsAccounts')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('savings.accountId')}</TableHead>
                <TableHead>{t('savings.memberName')}</TableHead>
                <TableHead>{t('savings.samity')}</TableHead>
                <TableHead>{t('savings.savingsType')}</TableHead>
                <TableHead className="text-right">{t('savings.balance')}</TableHead>
                <TableHead className="text-right">{t('savings.monthlyDeposit')}</TableHead>
                <TableHead className="text-right">{t('savings.totalDeposited')}</TableHead>
                <TableHead className="text-right">{t('savings.interestEarned')}</TableHead>
                <TableHead>{t('savings.lastTransaction')}</TableHead>
                <TableHead>{t('savings.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {savingsAccounts.map((account) => (
                <TableRow key={account.accountId}>
                  <TableCell className="font-mono text-sm">{account.accountId}</TableCell>
                  <TableCell className="font-medium">{account.memberName}</TableCell>
                  <TableCell>{account.samity}</TableCell>
                  <TableCell>
                    <Badge variant={getSavingsTypeVariant(account.savingsType)}>{account.savingsType}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(account.balance, locale)}</TableCell>
                  <TableCell className="text-right font-mono">
                    {account.monthlyDeposit > 0 ? formatCurrency(account.monthlyDeposit, locale) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(account.totalDeposited, locale)}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(account.interestEarned, locale)}</TableCell>
                  <TableCell>{formatDate(account.lastTransaction, locale)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(account.status)}>{account.status}</Badge>
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
