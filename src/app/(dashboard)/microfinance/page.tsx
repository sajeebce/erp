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
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
import { formatBDT, formatPercent, formatNumber } from "@/lib/formatters";

interface Samity {
  samityId: string;
  name: string;
  branch: string;
  members: number;
  activeLoans: number;
  totalOutstanding: number;
  collectionRate: number;
  status: "Active" | "Inactive" | "Suspended";
}

const samities: Samity[] = [
  {
    samityId: "SMT-001",
    name: "Shapla Mohila Samity",
    branch: "Dhanmondi, Dhaka",
    members: 35,
    activeLoans: 28,
    totalOutstanding: 4200000,
    collectionRate: 98.5,
    status: "Active",
  },
  {
    samityId: "SMT-002",
    name: "Padma Unnayan Samity",
    branch: "Rajshahi Sadar",
    members: 42,
    activeLoans: 38,
    totalOutstanding: 5700000,
    collectionRate: 96.2,
    status: "Active",
  },
  {
    samityId: "SMT-003",
    name: "Surjomukhi Samity",
    branch: "Sylhet Sadar",
    members: 30,
    activeLoans: 25,
    totalOutstanding: 3750000,
    collectionRate: 99.1,
    status: "Active",
  },
  {
    samityId: "SMT-004",
    name: "Meghna Sanchay Samity",
    branch: "Comilla Sadar",
    members: 28,
    activeLoans: 20,
    totalOutstanding: 2800000,
    collectionRate: 94.5,
    status: "Active",
  },
  {
    samityId: "SMT-005",
    name: "Jamuna Mohila Dal",
    branch: "Bogra Sadar",
    members: 38,
    activeLoans: 32,
    totalOutstanding: 4800000,
    collectionRate: 97.8,
    status: "Active",
  },
  {
    samityId: "SMT-006",
    name: "Karnaphuli Samity",
    branch: "Chattogram Sadar",
    members: 25,
    activeLoans: 18,
    totalOutstanding: 2250000,
    collectionRate: 88.3,
    status: "Active",
  },
  {
    samityId: "SMT-007",
    name: "Teesta Unnayan Dal",
    branch: "Rangpur Sadar",
    members: 40,
    activeLoans: 35,
    totalOutstanding: 5250000,
    collectionRate: 95.6,
    status: "Active",
  },
  {
    samityId: "SMT-008",
    name: "Sundarbans Samity",
    branch: "Khulna Sadar",
    members: 20,
    activeLoans: 10,
    totalOutstanding: 1200000,
    collectionRate: 82.0,
    status: "Suspended",
  },
];

function getStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "Active": return "default";
    case "Inactive": return "outline";
    case "Suspended": return "destructive";
    default: return "outline";
  }
}

function getCollectionRateColor(rate: number): string {
  if (rate >= 97) return "text-green-600";
  if (rate >= 92) return "text-primary";
  if (rate >= 85) return "text-orange-500";
  return "text-destructive";
}

export default function MicrofinancePage() {
  const totalMembers = samities.reduce((sum, s) => sum + s.members, 0);
  const totalActiveLoans = samities.reduce((sum, s) => sum + s.activeLoans, 0);
  const totalOutstanding = samities.reduce((sum, s) => sum + s.totalOutstanding, 0);
  const avgCollectionRate = samities.reduce((sum, s) => sum + s.collectionRate, 0) / samities.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Microfinance"
        description="Manage Samity/Group based microfinance operations"
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Samity
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(totalMembers)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(totalActiveLoans)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBDT(totalOutstanding)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Collection Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPercent(avgCollectionRate)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Samity / Group Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Samity ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead className="text-right">Members</TableHead>
                <TableHead className="text-right">Active Loans</TableHead>
                <TableHead className="text-right">Total Outstanding</TableHead>
                <TableHead className="w-[180px]">Collection Rate</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {samities.map((samity) => (
                <TableRow key={samity.samityId}>
                  <TableCell className="font-mono text-sm">{samity.samityId}</TableCell>
                  <TableCell className="font-medium">{samity.name}</TableCell>
                  <TableCell>{samity.branch}</TableCell>
                  <TableCell className="text-right">{samity.members}</TableCell>
                  <TableCell className="text-right">{samity.activeLoans}</TableCell>
                  <TableCell className="text-right font-mono">{formatBDT(samity.totalOutstanding)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={samity.collectionRate} className="flex-1" />
                      <span className={`text-sm font-medium w-14 text-right ${getCollectionRateColor(samity.collectionRate)}`}>
                        {formatPercent(samity.collectionRate)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(samity.status)}>{samity.status}</Badge>
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
