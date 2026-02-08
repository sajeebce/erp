import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Download, Building2, Globe, MapPin, Users } from "lucide-react";
import { formatBDT } from "@/lib/formatters";

interface Donor {
  id: string;
  name: string;
  type: "Bilateral" | "Multilateral" | "Local" | "Corporate";
  totalContributed: number;
  activeGrants: number;
  status: "Active" | "Inactive" | "Pipeline";
  country: string;
}

const donors: Donor[] = [
  {
    id: "DNR-001",
    name: "USAID",
    type: "Bilateral",
    totalContributed: 55000000,
    activeGrants: 3,
    status: "Active",
    country: "United States",
  },
  {
    id: "DNR-002",
    name: "World Bank",
    type: "Multilateral",
    totalContributed: 42000000,
    activeGrants: 2,
    status: "Active",
    country: "International",
  },
  {
    id: "DNR-003",
    name: "DFID / FCDO",
    type: "Bilateral",
    totalContributed: 35000000,
    activeGrants: 2,
    status: "Active",
    country: "United Kingdom",
  },
  {
    id: "DNR-004",
    name: "UNICEF",
    type: "Multilateral",
    totalContributed: 18000000,
    activeGrants: 1,
    status: "Active",
    country: "International",
  },
  {
    id: "DNR-005",
    name: "European Union",
    type: "Multilateral",
    totalContributed: 22000000,
    activeGrants: 2,
    status: "Active",
    country: "Belgium",
  },
  {
    id: "DNR-006",
    name: "SDC (Swiss Agency)",
    type: "Bilateral",
    totalContributed: 15000000,
    activeGrants: 1,
    status: "Active",
    country: "Switzerland",
  },
  {
    id: "DNR-007",
    name: "JICA",
    type: "Bilateral",
    totalContributed: 28000000,
    activeGrants: 1,
    status: "Active",
    country: "Japan",
  },
  {
    id: "DNR-008",
    name: "Local Donations",
    type: "Local",
    totalContributed: 8500000,
    activeGrants: 0,
    status: "Active",
    country: "Bangladesh",
  },
];

function getTypeIcon(type: string) {
  switch (type) {
    case "Bilateral": return <Globe className="h-4 w-4" />;
    case "Multilateral": return <Building2 className="h-4 w-4" />;
    case "Local": return <MapPin className="h-4 w-4" />;
    default: return <Building2 className="h-4 w-4" />;
  }
}

function getTypeBadgeVariant(type: string): "default" | "secondary" | "outline" {
  switch (type) {
    case "Bilateral": return "default";
    case "Multilateral": return "secondary";
    case "Local": return "outline";
    default: return "outline";
  }
}

function getStatusVariant(status: string): "default" | "secondary" | "outline" {
  switch (status) {
    case "Active": return "default";
    case "Inactive": return "outline";
    case "Pipeline": return "secondary";
    default: return "outline";
  }
}

export default function DonorsPage() {
  const totalContributed = donors.reduce((sum, d) => sum + d.totalContributed, 0);
  const totalActiveGrants = donors.reduce((sum, d) => sum + d.activeGrants, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Donor Management"
        description="Manage donor relationships, grants, and funding sources"
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Donor
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Donors</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{donors.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Contributed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBDT(totalContributed)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Grants</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalActiveGrants}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {donors.map((donor) => (
          <Card key={donor.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    {getTypeIcon(donor.type)}
                  </div>
                  <div>
                    <CardTitle className="text-base">{donor.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{donor.country}</p>
                  </div>
                </div>
                <Badge variant={getStatusVariant(donor.status)} className="text-[10px]">
                  {donor.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant={getTypeBadgeVariant(donor.type)} className="text-[10px]">
                  {donor.type}
                </Badge>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Contributed</span>
                </div>
                <p className="text-lg font-semibold">{formatBDT(donor.totalContributed)}</p>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span>{donor.activeGrants} Active Grant{donor.activeGrants !== 1 ? "s" : ""}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
