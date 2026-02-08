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

interface Contract {
  id: string;
  title: string;
  vendor: string;
  type: "Supply" | "Service" | "Works" | "Consultancy";
  startDate: string;
  endDate: string;
  value: number;
  status: "Active" | "Expired" | "Under Renewal" | "Terminated";
}

const contracts: Contract[] = [
  {
    id: "CON-2025-001",
    title: "Annual IT Equipment Supply Agreement",
    vendor: "Dhaka IT Hub",
    type: "Supply",
    startDate: "2025-04-01",
    endDate: "2026-03-31",
    value: 3500000,
    status: "Active",
  },
  {
    id: "CON-2025-002",
    title: "Tube Well Construction - Sylhet Phase II",
    vendor: "Meghna Construction Co.",
    type: "Works",
    startDate: "2025-06-01",
    endDate: "2026-05-31",
    value: 8500000,
    status: "Active",
  },
  {
    id: "CON-2025-003",
    title: "Medical Supplies Framework Agreement",
    vendor: "Padma Medical Supplies",
    type: "Supply",
    startDate: "2025-01-01",
    endDate: "2025-12-31",
    value: 2200000,
    status: "Under Renewal",
  },
  {
    id: "CON-2025-004",
    title: "Vehicle Rental - Field Operations",
    vendor: "Chittagong Transport Services",
    type: "Service",
    startDate: "2025-03-01",
    endDate: "2025-08-31",
    value: 720000,
    status: "Expired",
  },
  {
    id: "CON-2025-005",
    title: "M&E Framework Development Consultancy",
    vendor: "Delta Consulting Group",
    type: "Consultancy",
    startDate: "2025-09-01",
    endDate: "2026-02-28",
    value: 600000,
    status: "Active",
  },
  {
    id: "CON-2025-006",
    title: "Solar Panel Installation - Rangpur",
    vendor: "Sundarbans Solar Energy",
    type: "Works",
    startDate: "2025-10-01",
    endDate: "2026-03-31",
    value: 4200000,
    status: "Active",
  },
  {
    id: "CON-2025-007",
    title: "Office Stationery Annual Contract",
    vendor: "Jamuna Stationery House",
    type: "Supply",
    startDate: "2025-01-01",
    endDate: "2025-12-31",
    value: 450000,
    status: "Under Renewal",
  },
  {
    id: "CON-2025-008",
    title: "Agricultural Input Supply - Mymensingh",
    vendor: "Green Agro Bangladesh",
    type: "Supply",
    startDate: "2025-02-01",
    endDate: "2025-07-31",
    value: 1200000,
    status: "Terminated",
  },
];

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "Active": return "default";
    case "Expired": return "outline";
    case "Under Renewal": return "secondary";
    case "Terminated": return "destructive";
    default: return "outline";
  }
}

function getTypeVariant(type: string): "default" | "secondary" | "outline" {
  switch (type) {
    case "Supply": return "default";
    case "Service": return "secondary";
    case "Works": return "outline";
    case "Consultancy": return "secondary";
    default: return "outline";
  }
}

export default function ContractsPage() {
  const activeContracts = contracts.filter((c) => c.status === "Active").length;
  const totalValue = contracts.reduce((sum, c) => sum + c.value, 0);
  const expiringSoon = contracts.filter((c) => {
    const endDate = new Date(c.endDate);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    return c.status === "Active" && endDate <= threeMonthsFromNow;
  }).length;
  const underRenewal = contracts.filter((c) => c.status === "Under Renewal").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contracts"
        description="Manage procurement contracts and agreements"
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Contract
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Contracts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeContracts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBDT(totalValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expiring Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{expiringSoon}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Under Renewal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{underRenewal}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contract Register</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[130px]">Contract No</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-mono text-sm">{contract.id}</TableCell>
                  <TableCell className="font-medium max-w-[250px] truncate">{contract.title}</TableCell>
                  <TableCell>{contract.vendor}</TableCell>
                  <TableCell>
                    <Badge variant={getTypeVariant(contract.type)} className="text-[10px]">
                      {contract.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(contract.startDate)}</TableCell>
                  <TableCell>{formatDate(contract.endDate)}</TableCell>
                  <TableCell className="text-right font-mono">{formatBDT(contract.value)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(contract.status)}>
                      {contract.status}
                    </Badge>
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
