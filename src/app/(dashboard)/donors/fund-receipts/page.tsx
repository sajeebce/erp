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
import { formatBDT, formatDate, formatNumber } from "@/lib/formatters";

interface FundReceipt {
  receiptNo: string;
  date: string;
  donor: string;
  grant: string;
  amount: number;
  currency: "BDT" | "USD";
  exchangeRate: number;
  bdtEquivalent: number;
  bankAccount: string;
  status: "Received" | "Pending" | "Confirmed";
}

const fundReceipts: FundReceipt[] = [
  {
    receiptNo: "FR-2026-001",
    date: "2026-01-05",
    donor: "USAID",
    grant: "WASH Phase-3",
    amount: 120000,
    currency: "USD",
    exchangeRate: 119.50,
    bdtEquivalent: 14340000,
    bankAccount: "BRAC Bank - Project A/C",
    status: "Confirmed",
  },
  {
    receiptNo: "FR-2026-002",
    date: "2026-01-12",
    donor: "World Bank",
    grant: "Primary Education Enhancement",
    amount: 85000,
    currency: "USD",
    exchangeRate: 119.75,
    bdtEquivalent: 10178750,
    bankAccount: "Sonali Bank - Current A/C",
    status: "Confirmed",
  },
  {
    receiptNo: "FR-2026-003",
    date: "2026-01-18",
    donor: "UNICEF",
    grant: "Maternal & Child Health",
    amount: 4500000,
    currency: "BDT",
    exchangeRate: 1.00,
    bdtEquivalent: 4500000,
    bankAccount: "BRAC Bank - Project A/C",
    status: "Received",
  },
  {
    receiptNo: "FR-2026-004",
    date: "2026-01-25",
    donor: "DFID/FCDO",
    grant: "Climate Adaptation Fund",
    amount: 150000,
    currency: "USD",
    exchangeRate: 119.85,
    bdtEquivalent: 17977500,
    bankAccount: "Standard Chartered - USD A/C",
    status: "Confirmed",
  },
  {
    receiptNo: "FR-2026-005",
    date: "2026-02-01",
    donor: "EU",
    grant: "Youth Employment Initiative",
    amount: 65000,
    currency: "USD",
    exchangeRate: 120.10,
    bdtEquivalent: 7806500,
    bankAccount: "BRAC Bank - Project A/C",
    status: "Received",
  },
  {
    receiptNo: "FR-2026-006",
    date: "2026-02-03",
    donor: "SDC",
    grant: "Microfinance Capacity Building",
    amount: 3200000,
    currency: "BDT",
    exchangeRate: 1.00,
    bdtEquivalent: 3200000,
    bankAccount: "Sonali Bank - Current A/C",
    status: "Pending",
  },
  {
    receiptNo: "FR-2026-007",
    date: "2026-02-05",
    donor: "JICA",
    grant: "Food Security & Nutrition",
    amount: 45000,
    currency: "USD",
    exchangeRate: 120.25,
    bdtEquivalent: 5411250,
    bankAccount: "Standard Chartered - USD A/C",
    status: "Pending",
  },
  {
    receiptNo: "FR-2026-008",
    date: "2026-02-06",
    donor: "USAID",
    grant: "WASH Phase-3",
    amount: 95000,
    currency: "USD",
    exchangeRate: 120.30,
    bdtEquivalent: 11428500,
    bankAccount: "BRAC Bank - Project A/C",
    status: "Pending",
  },
  {
    receiptNo: "FR-2026-009",
    date: "2026-01-20",
    donor: "World Bank",
    grant: "Urban Slum Improvement",
    amount: 6750000,
    currency: "BDT",
    exchangeRate: 1.00,
    bdtEquivalent: 6750000,
    bankAccount: "Sonali Bank - Current A/C",
    status: "Confirmed",
  },
  {
    receiptNo: "FR-2026-010",
    date: "2026-02-07",
    donor: "DFID/FCDO",
    grant: "Disaster Risk Reduction",
    amount: 2800000,
    currency: "BDT",
    exchangeRate: 1.00,
    bdtEquivalent: 2800000,
    bankAccount: "BRAC Bank - Project A/C",
    status: "Received",
  },
];

function getStatusVariant(status: string): "default" | "secondary" | "outline" {
  switch (status) {
    case "Confirmed": return "default";
    case "Received": return "secondary";
    case "Pending": return "outline";
    default: return "outline";
  }
}

export default function FundReceiptsPage() {
  const totalReceiptsThisYear = fundReceipts.reduce((sum, r) => sum + r.bdtEquivalent, 0);
  const thisMonthReceipts = fundReceipts
    .filter((r) => r.date.startsWith("2026-02"))
    .reduce((sum, r) => sum + r.bdtEquivalent, 0);
  const pendingConfirmation = fundReceipts.filter((r) => r.status === "Pending").length;
  const usdReceipts = fundReceipts.filter((r) => r.currency === "USD").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fund Receipts"
        description="Track incoming funds and donor disbursements"
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Receipt
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Receipts This Year</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBDT(totalReceiptsThisYear)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBDT(thisMonthReceipts)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Confirmation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pendingConfirmation}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">USD Receipts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{usdReceipts}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fund Receipt Vouchers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[130px]">Receipt No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Donor</TableHead>
                <TableHead>Grant</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead className="text-right">Exchange Rate</TableHead>
                <TableHead className="text-right">BDT Equivalent</TableHead>
                <TableHead>Bank Account</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fundReceipts.map((receipt) => (
                <TableRow key={receipt.receiptNo}>
                  <TableCell className="font-mono text-sm">{receipt.receiptNo}</TableCell>
                  <TableCell>{formatDate(receipt.date)}</TableCell>
                  <TableCell>{receipt.donor}</TableCell>
                  <TableCell>{receipt.grant}</TableCell>
                  <TableCell className="text-right font-mono">
                    {receipt.currency === "USD" ? `$${formatNumber(receipt.amount)}` : formatBDT(receipt.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={receipt.currency === "USD" ? "secondary" : "outline"}>
                      {receipt.currency}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">{receipt.exchangeRate.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono">{formatBDT(receipt.bdtEquivalent)}</TableCell>
                  <TableCell className="text-sm">{receipt.bankAccount}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(receipt.status)}>{receipt.status}</Badge>
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
