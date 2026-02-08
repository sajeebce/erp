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

interface PurchaseRequisition {
  prNo: string;
  date: string;
  description: string;
  project: string;
  amount: number;
  requestedBy: string;
  status: "Draft" | "Pending Approval" | "Approved" | "Rejected" | "Ordered" | "Completed";
}

const requisitions: PurchaseRequisition[] = [
  {
    prNo: "PR-2025-001",
    date: "2025-01-15",
    description: "Office Furniture for Sylhet Regional Office",
    project: "WASH Program",
    amount: 450000,
    requestedBy: "Md. Tanvir Ahmed",
    status: "Approved",
  },
  {
    prNo: "PR-2025-002",
    date: "2025-01-18",
    description: "Laptops & Printers for Field Staff",
    project: "Primary Education",
    amount: 1200000,
    requestedBy: "Nusrat Jahan",
    status: "Pending Approval",
  },
  {
    prNo: "PR-2025-003",
    date: "2025-01-22",
    description: "Water Testing Kits & Equipment",
    project: "WASH Program",
    amount: 850000,
    requestedBy: "Rezaul Karim",
    status: "Ordered",
  },
  {
    prNo: "PR-2025-004",
    date: "2025-01-25",
    description: "Training Materials & Stationery",
    project: "Youth Skills",
    amount: 180000,
    requestedBy: "Shahana Begum",
    status: "Completed",
  },
  {
    prNo: "PR-2025-005",
    date: "2025-02-01",
    description: "Solar Panels for Barishal Field Office",
    project: "Climate Resilience",
    amount: 2500000,
    requestedBy: "Kamal Hossain",
    status: "Pending Approval",
  },
  {
    prNo: "PR-2025-006",
    date: "2025-02-03",
    description: "Medical Supplies & First Aid Kits",
    project: "Maternal Health",
    amount: 650000,
    requestedBy: "Dr. Farzana Rahman",
    status: "Approved",
  },
  {
    prNo: "PR-2025-007",
    date: "2025-02-05",
    description: "Vehicle Maintenance & Spare Parts",
    project: "Admin & Operations",
    amount: 380000,
    requestedBy: "Anwar Hossain",
    status: "Draft",
  },
  {
    prNo: "PR-2025-008",
    date: "2025-02-07",
    description: "Seeds & Agricultural Inputs",
    project: "Food Security",
    amount: 1800000,
    requestedBy: "Md. Sohel Rana",
    status: "Pending Approval",
  },
];

function getStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "Approved": return "default";
    case "Pending Approval": return "secondary";
    case "Ordered": return "default";
    case "Completed": return "secondary";
    case "Draft": return "outline";
    case "Rejected": return "destructive";
    default: return "outline";
  }
}

export default function ProcurementPage() {
  const totalAmount = requisitions.reduce((sum, r) => sum + r.amount, 0);
  const pendingCount = requisitions.filter((r) => r.status === "Pending Approval").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Procurement"
        description="Manage purchase requisitions and procurement processes"
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Requisitions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{requisitions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBDT(totalAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{requisitions.filter((r) => r.status === "Completed").length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase Requisitions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PR No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Project</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requisitions.map((req) => (
                <TableRow key={req.prNo}>
                  <TableCell className="font-mono text-sm">{req.prNo}</TableCell>
                  <TableCell>{formatDate(req.date)}</TableCell>
                  <TableCell className="font-medium max-w-[250px] truncate">{req.description}</TableCell>
                  <TableCell>{req.project}</TableCell>
                  <TableCell className="text-right font-mono">{formatBDT(req.amount)}</TableCell>
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
