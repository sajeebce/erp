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

interface Training {
  trainingId: string;
  title: string;
  type: "Internal" | "External" | "Online";
  facilitator: string;
  date: string;
  duration: string;
  participants: number;
  budget: number;
  status: "Completed" | "Upcoming" | "In Progress" | "Cancelled";
}

const trainings: Training[] = [
  {
    trainingId: "TRN-001",
    title: "Financial Management for NGOs",
    type: "External",
    facilitator: "BRAC Learning Division",
    date: "2026-01-10",
    duration: "3 days",
    participants: 8,
    budget: 120000,
    status: "Completed",
  },
  {
    trainingId: "TRN-002",
    title: "Gender Mainstreaming in Programs",
    type: "Internal",
    facilitator: "Rubina Yasmin",
    date: "2026-01-18",
    duration: "1 day",
    participants: 25,
    budget: 35000,
    status: "Completed",
  },
  {
    trainingId: "TRN-003",
    title: "Advanced Excel & Data Analysis",
    type: "Online",
    facilitator: "Coursera / Google",
    date: "2026-01-20",
    duration: "4 weeks",
    participants: 12,
    budget: 60000,
    status: "Completed",
  },
  {
    trainingId: "TRN-004",
    title: "Safeguarding & PSEA Policy",
    type: "Internal",
    facilitator: "Fatima Akter Ruma",
    date: "2026-02-05",
    duration: "1 day",
    participants: 40,
    budget: 25000,
    status: "Completed",
  },
  {
    trainingId: "TRN-005",
    title: "Project Cycle Management (PCM)",
    type: "External",
    facilitator: "PNGO / NGOAB Trainer",
    date: "2026-02-15",
    duration: "5 days",
    participants: 10,
    budget: 200000,
    status: "Upcoming",
  },
  {
    trainingId: "TRN-006",
    title: "First Aid & Emergency Response",
    type: "External",
    facilitator: "Bangladesh Red Crescent",
    date: "2026-02-20",
    duration: "2 days",
    participants: 15,
    budget: 80000,
    status: "Upcoming",
  },
  {
    trainingId: "TRN-007",
    title: "WASH Sector Technical Training",
    type: "External",
    facilitator: "WaterAid Bangladesh",
    date: "2026-02-08",
    duration: "3 days",
    participants: 6,
    budget: 150000,
    status: "In Progress",
  },
  {
    trainingId: "TRN-008",
    title: "Leadership & Team Management",
    type: "Online",
    facilitator: "LinkedIn Learning",
    date: "2026-03-01",
    duration: "6 weeks",
    participants: 8,
    budget: 45000,
    status: "Upcoming",
  },
  {
    trainingId: "TRN-009",
    title: "Monitoring & Evaluation Framework",
    type: "Internal",
    facilitator: "Tahmina Khanam",
    date: "2026-01-25",
    duration: "2 days",
    participants: 20,
    budget: 40000,
    status: "Completed",
  },
  {
    trainingId: "TRN-010",
    title: "Donor Compliance & Reporting",
    type: "External",
    facilitator: "Deloitte Bangladesh",
    date: "2026-01-05",
    duration: "2 days",
    participants: 5,
    budget: 180000,
    status: "Cancelled",
  },
];

function getStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "Completed": return "default";
    case "In Progress": return "secondary";
    case "Upcoming": return "outline";
    case "Cancelled": return "destructive";
    default: return "outline";
  }
}

function getTypeVariant(type: string): "default" | "secondary" | "outline" {
  switch (type) {
    case "Internal": return "default";
    case "External": return "secondary";
    case "Online": return "outline";
    default: return "outline";
  }
}

export default function TrainingPage() {
  const totalTrainings = trainings.filter((t) => t.status !== "Cancelled").length;
  const totalParticipants = trainings
    .filter((t) => t.status === "Completed" || t.status === "In Progress")
    .reduce((sum, t) => sum + t.participants, 0);
  const budgetUtilized = trainings
    .filter((t) => t.status === "Completed" || t.status === "In Progress")
    .reduce((sum, t) => sum + t.budget, 0);
  const upcoming = trainings.filter((t) => t.status === "Upcoming").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Training & Development"
        description="Manage employee training programs and capacity building"
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Schedule Training
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Trainings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalTrainings}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Participants Trained</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(totalParticipants)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Budget Utilized</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBDT(budgetUtilized)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{upcoming}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Training Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Training ID</TableHead>
                <TableHead>Training Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Facilitator</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Participants</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trainings.map((training) => (
                <TableRow key={training.trainingId}>
                  <TableCell className="font-mono text-sm">{training.trainingId}</TableCell>
                  <TableCell className="font-medium">{training.title}</TableCell>
                  <TableCell>
                    <Badge variant={getTypeVariant(training.type)}>{training.type}</Badge>
                  </TableCell>
                  <TableCell>{training.facilitator}</TableCell>
                  <TableCell>{formatDate(training.date)}</TableCell>
                  <TableCell>{training.duration}</TableCell>
                  <TableCell className="text-right">{training.participants}</TableCell>
                  <TableCell className="text-right font-mono">{formatBDT(training.budget)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(training.status)}>{training.status}</Badge>
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
