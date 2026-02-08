import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Plus, Download, Calendar, Users, MapPin } from "lucide-react";
import { formatBDT, formatDate } from "@/lib/formatters";

interface Project {
  id: string;
  name: string;
  donor: string;
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  progress: number;
  status: "Active" | "Completed" | "Pipeline" | "On Hold";
  teamCount: number;
  location: string;
}

const projects: Project[] = [
  {
    id: "PRJ-001",
    name: "WASH Program - Safe Water for Sylhet",
    donor: "USAID",
    startDate: "2024-01-15",
    endDate: "2026-12-31",
    budget: 25000000,
    spent: 18750000,
    progress: 65,
    status: "Active",
    teamCount: 18,
    location: "Sylhet Division",
  },
  {
    id: "PRJ-002",
    name: "Shiksha Unnayan - Primary Education Enhancement",
    donor: "World Bank",
    startDate: "2023-07-01",
    endDate: "2026-06-30",
    budget: 42000000,
    spent: 38640000,
    progress: 82,
    status: "Active",
    teamCount: 24,
    location: "Dhaka & Rajshahi",
  },
  {
    id: "PRJ-003",
    name: "Ma O Shishu - Maternal Health Initiative",
    donor: "UNICEF",
    startDate: "2024-04-01",
    endDate: "2027-03-31",
    budget: 18000000,
    spent: 8100000,
    progress: 35,
    status: "Active",
    teamCount: 12,
    location: "Chattogram Division",
  },
  {
    id: "PRJ-004",
    name: "Jalbayu Sahishnuta - Climate Resilience",
    donor: "DFID/FCDO",
    startDate: "2024-10-01",
    endDate: "2028-09-30",
    budget: 35000000,
    spent: 10500000,
    progress: 20,
    status: "Active",
    teamCount: 15,
    location: "Barishal & Khulna",
  },
  {
    id: "PRJ-005",
    name: "Rin Bistar - Microfinance Expansion",
    donor: "SDC",
    startDate: "2023-01-01",
    endDate: "2025-12-31",
    budget: 15000000,
    spent: 12750000,
    progress: 90,
    status: "Active",
    teamCount: 8,
    location: "Rangpur Division",
  },
  {
    id: "PRJ-006",
    name: "Jubo Dakhata - Youth Skills Development",
    donor: "EU",
    startDate: "2024-06-01",
    endDate: "2027-05-31",
    budget: 22000000,
    spent: 7700000,
    progress: 28,
    status: "Active",
    teamCount: 14,
    location: "Nationwide",
  },
  {
    id: "PRJ-007",
    name: "Khaddo Nirapotta - Food Security Program",
    donor: "JICA",
    startDate: "2024-03-01",
    endDate: "2027-02-28",
    budget: 28000000,
    spent: 16800000,
    progress: 50,
    status: "Active",
    teamCount: 20,
    location: "Mymensingh & Rangpur",
  },
  {
    id: "PRJ-008",
    name: "Nari Shakti - Women Empowerment Program",
    donor: "USAID",
    startDate: "2025-01-01",
    endDate: "2028-12-31",
    budget: 32000000,
    spent: 0,
    progress: 0,
    status: "Pipeline",
    teamCount: 0,
    location: "Rajshahi & Khulna",
  },
];

function getStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "Active": return "default";
    case "Completed": return "secondary";
    case "Pipeline": return "outline";
    case "On Hold": return "destructive";
    default: return "outline";
  }
}

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Management"
        description="Manage all development projects across programs"
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {projects.map((project) => (
          <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-sm font-semibold leading-tight">{project.name}</CardTitle>
                <Badge variant={getStatusVariant(project.status)} className="text-[10px] shrink-0">
                  {project.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{project.donor}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>{formatDate(project.startDate)} - {formatDate(project.endDate)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                <span>{project.location}</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Budget</span>
                  <span className="font-medium">{formatBDT(project.budget)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Spent</span>
                  <span className="font-medium">{formatBDT(project.spent)}</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{project.progress}%</span>
                </div>
                <Progress value={project.progress} />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span>{project.teamCount} Team Member{project.teamCount !== 1 ? "s" : ""}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
