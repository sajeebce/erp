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
import { Plus, Download, FileText, CreditCard, Receipt, Clock } from "lucide-react";
import { formatBDT, formatDate } from "@/lib/formatters";

interface Voucher {
  voucherNo: string;
  type: "Debit" | "Credit" | "Cash" | "Bank" | "Journal";
  date: string;
  description: string;
  amount: number;
  preparedBy: string;
  approvedBy: string;
  status: "Approved" | "Pending" | "Draft";
}

const vouchers: Voucher[] = [
  {
    voucherNo: "DV-2026-001",
    type: "Debit",
    date: "2026-01-05",
    description: "Office Supplies Purchase - Mohakhali HQ",
    amount: 45000,
    preparedBy: "Rahim Uddin",
    approvedBy: "Fatima Begum",
    status: "Approved",
  },
  {
    voucherNo: "RV-2026-001",
    type: "Credit",
    date: "2026-01-08",
    description: "USAID Grant Receipt - Q1 2026",
    amount: 15000000,
    preparedBy: "Kamal Hossain",
    approvedBy: "Dr. Nasreen Ahmed",
    status: "Approved",
  },
  {
    voucherNo: "CV-2026-001",
    type: "Cash",
    date: "2026-01-10",
    description: "Petty Cash Replenishment - Sylhet Office",
    amount: 50000,
    preparedBy: "Mizanur Rahman",
    approvedBy: "Fatima Begum",
    status: "Approved",
  },
  {
    voucherNo: "BV-2026-001",
    type: "Bank",
    date: "2026-01-12",
    description: "Salary Transfer - January 2026",
    amount: 3250000,
    preparedBy: "Kamal Hossain",
    approvedBy: "Dr. Nasreen Ahmed",
    status: "Approved",
  },
  {
    voucherNo: "JV-2026-001",
    type: "Journal",
    date: "2026-01-15",
    description: "Depreciation Adjustment - Q4 2025",
    amount: 875000,
    preparedBy: "Rahim Uddin",
    approvedBy: "",
    status: "Pending",
  },
  {
    voucherNo: "DV-2026-002",
    type: "Debit",
    date: "2026-01-18",
    description: "Vehicle Maintenance - Toyota Hilux (Dhaka-1234)",
    amount: 35000,
    preparedBy: "Mizanur Rahman",
    approvedBy: "Fatima Begum",
    status: "Approved",
  },
  {
    voucherNo: "BV-2026-002",
    type: "Bank",
    date: "2026-01-20",
    description: "Training Venue Advance - Chattogram Workshop",
    amount: 120000,
    preparedBy: "Kamal Hossain",
    approvedBy: "",
    status: "Pending",
  },
  {
    voucherNo: "RV-2026-002",
    type: "Credit",
    date: "2026-01-22",
    description: "World Bank Fund Transfer - Climate Resilience",
    amount: 8500000,
    preparedBy: "Kamal Hossain",
    approvedBy: "Dr. Nasreen Ahmed",
    status: "Approved",
  },
  {
    voucherNo: "DV-2026-003",
    type: "Debit",
    date: "2026-01-25",
    description: "Internet & Utility Bills - All Offices",
    amount: 85000,
    preparedBy: "Rahim Uddin",
    approvedBy: "",
    status: "Draft",
  },
  {
    voucherNo: "CV-2026-002",
    type: "Cash",
    date: "2026-01-28",
    description: "Beneficiary Cash Support - Rangpur Field",
    amount: 200000,
    preparedBy: "Mizanur Rahman",
    approvedBy: "Fatima Begum",
    status: "Approved",
  },
];

function getStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "Approved": return "default";
    case "Pending": return "outline";
    case "Draft": return "secondary";
    default: return "secondary";
  }
}

function getTypeVariant(type: string): "default" | "secondary" | "outline" | "destructive" {
  switch (type) {
    case "Debit": return "destructive";
    case "Credit": return "default";
    case "Cash": return "secondary";
    case "Bank": return "outline";
    case "Journal": return "secondary";
    default: return "outline";
  }
}

export default function VouchersPage() {
  const totalVouchers = vouchers.length;
  const debitVouchers = vouchers.filter((v) => v.type === "Debit").length;
  const receiptVouchers = vouchers.filter((v) => v.type === "Credit").length;
  const pendingApproval = vouchers.filter((v) => v.status === "Pending").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vouchers"
        description="Manage payment, receipt, and contra vouchers"
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Voucher
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Vouchers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{totalVouchers}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Debit Vouchers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{debitVouchers}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receipt Vouchers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{receiptVouchers}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <p className="text-2xl font-bold">{pendingApproval}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Voucher Register</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[130px]">Voucher No</TableHead>
                <TableHead className="w-[90px]">Type</TableHead>
                <TableHead className="w-[100px]">Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Prepared By</TableHead>
                <TableHead>Approved By</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vouchers.map((voucher) => (
                <TableRow key={voucher.voucherNo}>
                  <TableCell className="font-mono text-sm">{voucher.voucherNo}</TableCell>
                  <TableCell>
                    <Badge variant={getTypeVariant(voucher.type)}>{voucher.type}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(voucher.date)}</TableCell>
                  <TableCell className="text-sm">{voucher.description}</TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatBDT(voucher.amount)}
                  </TableCell>
                  <TableCell className="text-sm">{voucher.preparedBy}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {voucher.approvedBy || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(voucher.status)}>{voucher.status}</Badge>
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
