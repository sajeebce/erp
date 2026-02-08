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
import { formatBDT, formatDate } from "@/lib/formatters";

interface FundRequisition {
  requisitionNo: string;
  date: string;
  project: string;
  grant: string;
  amountRequested: number;
  purpose: string;
  requestedBy: string;
  status: "Draft" | "Submitted" | "Approved" | "Disbursed" | "Rejected";
}

const requisitions: FundRequisition[] = [
  {
    requisitionNo: "FRQ-2026-001",
    date: "2026-01-08",
    project: "WASH Phase-3 - Sylhet",
    grant: "GRT-001",
    amountRequested: 5200000,
    purpose: "Q1 field operations - tube well installation & hygiene kits",
    requestedBy: "Md. Rashidul Islam",
    status: "Disbursed",
  },
  {
    requisitionNo: "FRQ-2026-002",
    date: "2026-01-15",
    project: "Primary Education Enhancement",
    grant: "GRT-002",
    amountRequested: 3800000,
    purpose: "Teacher training workshops & learning material procurement",
    requestedBy: "Fatema Akhter",
    status: "Disbursed",
  },
  {
    requisitionNo: "FRQ-2026-003",
    date: "2026-01-22",
    project: "Maternal & Child Health",
    grant: "GRT-003",
    amountRequested: 2750000,
    purpose: "Community health worker stipends & medical supplies",
    requestedBy: "Dr. Nasreen Sultana",
    status: "Approved",
  },
  {
    requisitionNo: "FRQ-2026-004",
    date: "2026-01-28",
    project: "Climate Adaptation Fund",
    grant: "GRT-004",
    amountRequested: 6100000,
    purpose: "Flood-resilient housing pilot & embankment repair",
    requestedBy: "Kamal Hossain",
    status: "Approved",
  },
  {
    requisitionNo: "FRQ-2026-005",
    date: "2026-02-01",
    project: "Youth Employment Initiative",
    grant: "GRT-005",
    amountRequested: 4500000,
    purpose: "Vocational training center setup & equipment",
    requestedBy: "Sharmin Akter",
    status: "Submitted",
  },
  {
    requisitionNo: "FRQ-2026-006",
    date: "2026-02-03",
    project: "WASH Phase-3 - Sylhet",
    grant: "GRT-001",
    amountRequested: 3200000,
    purpose: "Sanitation facility construction - 12 schools",
    requestedBy: "Md. Rashidul Islam",
    status: "Submitted",
  },
  {
    requisitionNo: "FRQ-2026-007",
    date: "2026-02-05",
    project: "Microfinance Capacity Building",
    grant: "GRT-006",
    amountRequested: 1800000,
    purpose: "MIS system upgrade & staff capacity building",
    requestedBy: "Aminul Haque",
    status: "Draft",
  },
  {
    requisitionNo: "FRQ-2026-008",
    date: "2026-02-07",
    project: "Primary Education Enhancement",
    grant: "GRT-002",
    amountRequested: 2100000,
    purpose: "Classroom renovation & furniture for 8 schools",
    requestedBy: "Fatema Akhter",
    status: "Rejected",
  },
];

function getStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "Disbursed": return "default";
    case "Approved": return "secondary";
    case "Submitted": return "outline";
    case "Draft": return "outline";
    case "Rejected": return "destructive";
    default: return "outline";
  }
}

export default function FundRequisitionsPage() {
  const totalRequested = requisitions.reduce((sum, r) => sum + r.amountRequested, 0);
  const approved = requisitions
    .filter((r) => r.status === "Approved")
    .reduce((sum, r) => sum + r.amountRequested, 0);
  const pending = requisitions.filter((r) => r.status === "Submitted" || r.status === "Draft").length;
  const disbursed = requisitions
    .filter((r) => r.status === "Disbursed")
    .reduce((sum, r) => sum + r.amountRequested, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fund Requisitions"
        description="Submit and track fund requisitions to donors"
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Requisition
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Requested</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBDT(totalRequested)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBDT(approved)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Disbursed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBDT(disbursed)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fund Requisitions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Requisition No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Grant</TableHead>
                <TableHead className="text-right">Amount Requested</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requisitions.map((req) => (
                <TableRow key={req.requisitionNo}>
                  <TableCell className="font-mono text-sm">{req.requisitionNo}</TableCell>
                  <TableCell>{formatDate(req.date)}</TableCell>
                  <TableCell className="font-medium">{req.project}</TableCell>
                  <TableCell className="font-mono text-sm">{req.grant}</TableCell>
                  <TableCell className="text-right font-mono">{formatBDT(req.amountRequested)}</TableCell>
                  <TableCell className="max-w-[250px] truncate text-sm">{req.purpose}</TableCell>
                  <TableCell>{req.requestedBy}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(req.status)}>{req.status}</Badge>
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
