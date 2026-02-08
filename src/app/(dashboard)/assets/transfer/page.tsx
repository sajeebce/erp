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
import { formatDate } from "@/lib/formatters";

interface AssetTransfer {
  transferId: string;
  date: string;
  asset: string;
  fromLocation: string;
  toLocation: string;
  transferredBy: string;
  reason: string;
  approvedBy: string;
  status: "Completed" | "Pending Approval" | "In Transit";
}

const transfers: AssetTransfer[] = [
  {
    transferId: "TRF-001",
    date: "2026-01-15",
    asset: "HP ProBook Laptop (x3)",
    fromLocation: "Head Office, Dhaka",
    toLocation: "Sylhet Field Office",
    transferredBy: "Tanvir Ahmed Khan",
    reason: "New field staff deployment",
    approvedBy: "Fatima Akter Ruma",
    status: "Completed",
  },
  {
    transferId: "TRF-002",
    date: "2026-01-22",
    asset: "Honda CRF 150 Motorcycle",
    fromLocation: "Sylhet Field Office",
    toLocation: "Mymensingh Field Office",
    transferredBy: "Shahin Ahmed",
    reason: "Field program expansion",
    approvedBy: "Md. Rafiqul Islam",
    status: "Completed",
  },
  {
    transferId: "TRF-003",
    date: "2026-02-01",
    asset: "Canon ImageRunner Photocopier",
    fromLocation: "Head Office, Dhaka",
    toLocation: "Chattogram Regional Office",
    transferredBy: "Nusrat Jahan",
    reason: "Office equipment redistribution",
    approvedBy: "Nasreen Sultana",
    status: "Completed",
  },
  {
    transferId: "TRF-004",
    date: "2026-02-05",
    asset: "Samsung Split AC 2 Ton (x2)",
    fromLocation: "Chattogram Regional Office",
    toLocation: "Rajshahi Regional Office",
    transferredBy: "Kamal Hossain",
    reason: "New office setup requirement",
    approvedBy: "Fatima Akter Ruma",
    status: "In Transit",
  },
  {
    transferId: "TRF-005",
    date: "2026-02-06",
    asset: "Dell OptiPlex Desktop (x5)",
    fromLocation: "Head Office, Dhaka",
    toLocation: "Rangpur Field Office",
    transferredBy: "Tanvir Ahmed Khan",
    reason: "IT infrastructure upgrade",
    approvedBy: "",
    status: "Pending Approval",
  },
  {
    transferId: "TRF-006",
    date: "2026-02-07",
    asset: "Water Quality Testing Kit (Portable)",
    fromLocation: "Sylhet Field Office",
    toLocation: "Barishal Field Office",
    transferredBy: "Md. Sohel Rana",
    reason: "WASH program needs in southern region",
    approvedBy: "",
    status: "Pending Approval",
  },
  {
    transferId: "TRF-007",
    date: "2026-01-28",
    asset: "Conference Room Furniture Set",
    fromLocation: "Head Office, Dhaka",
    toLocation: "Chattogram Regional Office",
    transferredBy: "Nusrat Jahan",
    reason: "Regional office expansion",
    approvedBy: "Dr. Aminul Haque",
    status: "In Transit",
  },
];

function getStatusVariant(status: string): "default" | "secondary" | "outline" {
  switch (status) {
    case "Completed": return "default";
    case "In Transit": return "secondary";
    case "Pending Approval": return "outline";
    default: return "outline";
  }
}

export default function AssetTransferPage() {
  const totalTransfers = transfers.length;
  const completed = transfers.filter((t) => t.status === "Completed").length;
  const pending = transfers.filter((t) => t.status === "Pending Approval").length;
  const inTransit = transfers.filter((t) => t.status === "In Transit").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Asset Transfer"
        description="Track asset movements between offices and locations"
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Transfer
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Transfers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalTransfers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{completed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Transit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{inTransit}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transfer Log</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transfer ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead>From Location</TableHead>
                <TableHead>To Location</TableHead>
                <TableHead>Transferred By</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Approved By</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.map((transfer) => (
                <TableRow key={transfer.transferId}>
                  <TableCell className="font-mono text-sm">{transfer.transferId}</TableCell>
                  <TableCell>{formatDate(transfer.date)}</TableCell>
                  <TableCell className="font-medium">{transfer.asset}</TableCell>
                  <TableCell>{transfer.fromLocation}</TableCell>
                  <TableCell>{transfer.toLocation}</TableCell>
                  <TableCell>{transfer.transferredBy}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{transfer.reason}</TableCell>
                  <TableCell>{transfer.approvedBy || <span className="text-muted-foreground">--</span>}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(transfer.status)}>{transfer.status}</Badge>
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
