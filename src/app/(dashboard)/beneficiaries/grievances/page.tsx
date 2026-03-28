import { getTranslations, getLocale } from 'next-intl/server';
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

interface Grievance {
  id: string;
  date: string;
  complainant: string;
  category: "Service Quality" | "Staff Behavior" | "Eligibility" | "Delay" | "Corruption";
  description: string;
  severity: "High" | "Medium" | "Low";
  assignedTo: string;
  resolutionDate: string | null;
  status: "Open" | "Under Investigation" | "Resolved" | "Closed";
}

const grievances: Grievance[] = [
  {
    id: "GRV-001",
    date: "2026-01-05",
    complainant: "Abdur Rahim",
    category: "Service Quality",
    description: "Water filter provided is not functioning properly after 2 weeks of installation",
    severity: "High",
    assignedTo: "Kamrul Hasan",
    resolutionDate: "2026-01-12",
    status: "Resolved",
  },
  {
    id: "GRV-002",
    date: "2026-01-08",
    complainant: "Halima Khatun",
    category: "Delay",
    description: "Cash transfer for December 2025 not yet received despite approval",
    severity: "High",
    assignedTo: "Mizanur Rahman",
    resolutionDate: null,
    status: "Under Investigation",
  },
  {
    id: "GRV-003",
    date: "2026-01-10",
    complainant: "Shafiqul Islam",
    category: "Eligibility",
    description: "Family excluded from food security program despite meeting all criteria",
    severity: "Medium",
    assignedTo: "Rezaul Karim",
    resolutionDate: "2026-01-18",
    status: "Resolved",
  },
  {
    id: "GRV-004",
    date: "2026-01-12",
    complainant: "Nazma Begum",
    category: "Staff Behavior",
    description: "Field officer was rude during household visit and refused to answer questions",
    severity: "Medium",
    assignedTo: "Shahidul Islam",
    resolutionDate: null,
    status: "Under Investigation",
  },
  {
    id: "GRV-005",
    date: "2026-01-15",
    complainant: "Jahangir Alam",
    category: "Corruption",
    description: "Alleged collection of unauthorized fees during training registration",
    severity: "High",
    assignedTo: "Faruk Ahmed",
    resolutionDate: null,
    status: "Open",
  },
  {
    id: "GRV-006",
    date: "2026-01-18",
    complainant: "Sufia Begum",
    category: "Service Quality",
    description: "Training materials distributed were incomplete and outdated",
    severity: "Low",
    assignedTo: "Anwar Hossain",
    resolutionDate: "2026-01-22",
    status: "Closed",
  },
  {
    id: "GRV-007",
    date: "2026-01-20",
    complainant: "Kamal Uddin",
    category: "Delay",
    description: "Agricultural input distribution delayed by 3 weeks, missing planting season",
    severity: "High",
    assignedTo: "Kamrul Hasan",
    resolutionDate: null,
    status: "Open",
  },
  {
    id: "GRV-008",
    date: "2026-01-25",
    complainant: "Rokeya Sultana",
    category: "Eligibility",
    description: "Removed from maternal health program prematurely before completing postnatal care",
    severity: "Medium",
    assignedTo: "Dr. Nasreen Jahan",
    resolutionDate: null,
    status: "Open",
  },
];

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "Open": return "destructive";
    case "Under Investigation": return "outline";
    case "Resolved": return "default";
    case "Closed": return "secondary";
    default: return "outline";
  }
}

function getSeverityVariant(severity: string): "default" | "secondary" | "destructive" | "outline" {
  switch (severity) {
    case "High": return "destructive";
    case "Medium": return "outline";
    case "Low": return "secondary";
    default: return "outline";
  }
}

export default async function GrievancesPage() {
  const t = await getTranslations('beneficiaries');
  const tc = await getTranslations('common');
  const locale = await getLocale();

  const totalGrievances = grievances.length;
  const openCount = grievances.filter((g) => g.status === "Open" || g.status === "Under Investigation").length;
  const resolvedCount = grievances.filter((g) => g.status === "Resolved" || g.status === "Closed").length;

  const resolvedGrievances = grievances.filter((g) => g.resolutionDate !== null);
  const avgResolutionDays =
    resolvedGrievances.length > 0
      ? Math.round(
          resolvedGrievances.reduce((sum, g) => {
            const start = new Date(g.date).getTime();
            const end = new Date(g.resolutionDate!).getTime();
            return sum + (end - start) / (1000 * 60 * 60 * 24);
          }, 0) / resolvedGrievances.length
        )
      : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('grievances.title')}
        description={t('grievances.description')}
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          {tc('buttons.export')}
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {t('grievances.addGrievance')}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('grievances.totalGrievances')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalGrievances}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('grievances.open')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{openCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('grievances.resolved')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{resolvedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('grievances.avgResolutionDays')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{avgResolutionDays} {t('grievances.days')}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('grievances.grievanceLog')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">{t('grievances.grievanceId')}</TableHead>
                <TableHead>{t('grievances.date')}</TableHead>
                <TableHead>{t('grievances.complainant')}</TableHead>
                <TableHead>{t('grievances.category')}</TableHead>
                <TableHead className="max-w-[250px]">{t('grievances.description')}</TableHead>
                <TableHead>{t('grievances.severity')}</TableHead>
                <TableHead>{t('grievances.assignedTo')}</TableHead>
                <TableHead>{t('grievances.resolutionDate')}</TableHead>
                <TableHead>{tc('labels.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grievances.map((grievance) => (
                <TableRow key={grievance.id}>
                  <TableCell className="font-mono text-sm">{grievance.id}</TableCell>
                  <TableCell>{formatDate(grievance.date, locale)}</TableCell>
                  <TableCell className="font-medium">{grievance.complainant}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {grievance.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[250px] truncate text-sm text-muted-foreground">
                    {grievance.description}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getSeverityVariant(grievance.severity)}>
                      {grievance.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>{grievance.assignedTo}</TableCell>
                  <TableCell>
                    {grievance.resolutionDate
                      ? formatDate(grievance.resolutionDate, locale)
                      : <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(grievance.status)}>
                      {grievance.status}
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
