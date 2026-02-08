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

interface Grant {
  id: string;
  title: string;
  donor: string;
  awardAmount: number;
  disbursed: number;
  remaining: number;
  startDate: string;
  endDate: string;
  status: "Active" | "Closed" | "Pipeline" | "Suspended";
}

const grants: Grant[] = [
  {
    id: "GRT-001",
    title: "WASH Phase-3 - Safe Water & Sanitation",
    donor: "USAID",
    awardAmount: 25000000,
    disbursed: 18750000,
    remaining: 6250000,
    startDate: "2024-01-15",
    endDate: "2026-12-31",
    status: "Active",
  },
  {
    id: "GRT-002",
    title: "Primary Education Enhancement Grant",
    donor: "World Bank",
    awardAmount: 42000000,
    disbursed: 38640000,
    remaining: 3360000,
    startDate: "2023-07-01",
    endDate: "2026-06-30",
    status: "Active",
  },
  {
    id: "GRT-003",
    title: "Maternal & Child Health Support",
    donor: "UNICEF",
    awardAmount: 18000000,
    disbursed: 8100000,
    remaining: 9900000,
    startDate: "2024-04-01",
    endDate: "2027-03-31",
    status: "Active",
  },
  {
    id: "GRT-004",
    title: "Climate Adaptation Fund - Coastal Resilience",
    donor: "DFID/FCDO",
    awardAmount: 35000000,
    disbursed: 10500000,
    remaining: 24500000,
    startDate: "2024-10-01",
    endDate: "2028-09-30",
    status: "Active",
  },
  {
    id: "GRT-005",
    title: "Youth Employment Initiative",
    donor: "EU",
    awardAmount: 22000000,
    disbursed: 7700000,
    remaining: 14300000,
    startDate: "2024-06-01",
    endDate: "2027-05-31",
    status: "Active",
  },
  {
    id: "GRT-006",
    title: "Microfinance Capacity Building",
    donor: "SDC",
    awardAmount: 15000000,
    disbursed: 12750000,
    remaining: 2250000,
    startDate: "2023-01-01",
    endDate: "2025-12-31",
    status: "Active",
  },
  {
    id: "GRT-007",
    title: "Food Security & Nutrition Program",
    donor: "JICA",
    awardAmount: 28000000,
    disbursed: 28000000,
    remaining: 0,
    startDate: "2022-03-01",
    endDate: "2025-02-28",
    status: "Closed",
  },
  {
    id: "GRT-008",
    title: "Women Empowerment & Livelihood Program",
    donor: "USAID",
    awardAmount: 32000000,
    disbursed: 0,
    remaining: 32000000,
    startDate: "2026-07-01",
    endDate: "2029-06-30",
    status: "Pipeline",
  },
  {
    id: "GRT-009",
    title: "Urban Slum Improvement Initiative",
    donor: "World Bank",
    awardAmount: 19500000,
    disbursed: 4875000,
    remaining: 14625000,
    startDate: "2025-01-01",
    endDate: "2027-12-31",
    status: "Suspended",
  },
  {
    id: "GRT-010",
    title: "Disaster Risk Reduction - Haor Region",
    donor: "DFID/FCDO",
    awardAmount: 14000000,
    disbursed: 14000000,
    remaining: 0,
    startDate: "2021-06-01",
    endDate: "2024-05-31",
    status: "Closed",
  },
];

function getStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "Active": return "default";
    case "Closed": return "secondary";
    case "Pipeline": return "outline";
    case "Suspended": return "destructive";
    default: return "outline";
  }
}

export default function GrantsPage() {
  const activeGrants = grants.filter((g) => g.status === "Active");
  const totalAwardValue = grants.reduce((sum, g) => sum + g.awardAmount, 0);
  const totalDisbursed = grants.reduce((sum, g) => sum + g.disbursed, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Grant Management"
        description="Track and manage active grants from all donors"
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Grant
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Grants</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{grants.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Grants</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeGrants.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Award Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBDT(totalAwardValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Disbursed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBDT(totalDisbursed)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Grant Registry</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Grant ID</TableHead>
                <TableHead>Grant Title</TableHead>
                <TableHead>Donor</TableHead>
                <TableHead className="text-right">Award Amount</TableHead>
                <TableHead className="text-right">Disbursed</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grants.map((grant) => (
                <TableRow key={grant.id}>
                  <TableCell className="font-mono text-sm">{grant.id}</TableCell>
                  <TableCell className="font-medium">{grant.title}</TableCell>
                  <TableCell>{grant.donor}</TableCell>
                  <TableCell className="text-right font-mono">{formatBDT(grant.awardAmount)}</TableCell>
                  <TableCell className="text-right font-mono">{formatBDT(grant.disbursed)}</TableCell>
                  <TableCell className="text-right font-mono">{formatBDT(grant.remaining)}</TableCell>
                  <TableCell>{formatDate(grant.startDate)}</TableCell>
                  <TableCell>{formatDate(grant.endDate)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(grant.status)}>{grant.status}</Badge>
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
