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
import { formatCurrency, formatDate } from "@/lib/formatters";

interface MaintenanceEntry {
  maintenanceId: string;
  asset: string;
  type: "Preventive" | "Corrective" | "Emergency";
  description: string;
  scheduledDate: string;
  completionDate: string;
  cost: number;
  vendor: string;
  status: "Scheduled" | "In Progress" | "Completed" | "Overdue";
}

const maintenanceLogs: MaintenanceEntry[] = [
  {
    maintenanceId: "MNT-001",
    asset: "Toyota Hilux Pickup - Dhaka",
    type: "Preventive",
    description: "Annual engine servicing and oil change",
    scheduledDate: "2026-01-10",
    completionDate: "2026-01-10",
    cost: 25000,
    vendor: "Toyota Dhaka Motors",
    status: "Completed",
  },
  {
    maintenanceId: "MNT-002",
    asset: "Canon ImageRunner Photocopier",
    type: "Corrective",
    description: "Paper jam mechanism repair and drum replacement",
    scheduledDate: "2026-01-15",
    completionDate: "2026-01-18",
    cost: 15000,
    vendor: "Canon Authorized Service",
    status: "Completed",
  },
  {
    maintenanceId: "MNT-003",
    asset: "Diesel Generator 10KVA",
    type: "Emergency",
    description: "Alternator failure and electrical wiring repair",
    scheduledDate: "2026-01-20",
    completionDate: "2026-01-22",
    cost: 45000,
    vendor: "Rangpur Electrical Works",
    status: "Completed",
  },
  {
    maintenanceId: "MNT-004",
    asset: "Samsung Split AC 2 Ton (x5)",
    type: "Preventive",
    description: "Quarterly cleaning, gas refill, and filter replacement",
    scheduledDate: "2026-02-01",
    completionDate: "2026-02-02",
    cost: 18000,
    vendor: "CoolAir Services BD",
    status: "Completed",
  },
  {
    maintenanceId: "MNT-005",
    asset: "Toyota Noah Microbus",
    type: "Preventive",
    description: "Brake pad replacement and suspension check",
    scheduledDate: "2026-02-10",
    completionDate: "",
    cost: 35000,
    vendor: "Toyota Dhaka Motors",
    status: "Scheduled",
  },
  {
    maintenanceId: "MNT-006",
    asset: "Dell OptiPlex Desktop (x10)",
    type: "Preventive",
    description: "System cleaning, OS updates, and antivirus renewal",
    scheduledDate: "2026-02-05",
    completionDate: "",
    cost: 12000,
    vendor: "Tanvir Ahmed Khan (In-house)",
    status: "In Progress",
  },
  {
    maintenanceId: "MNT-007",
    asset: "Water Quality Testing Lab Kit",
    type: "Preventive",
    description: "Annual calibration and sensor replacement",
    scheduledDate: "2026-01-25",
    completionDate: "",
    cost: 85000,
    vendor: "Lab Equipment Solutions BD",
    status: "Overdue",
  },
  {
    maintenanceId: "MNT-008",
    asset: "HP ProBook Laptop (x15)",
    type: "Corrective",
    description: "Battery replacement for 5 units with degraded performance",
    scheduledDate: "2026-02-15",
    completionDate: "",
    cost: 50000,
    vendor: "HP Bangladesh Service Center",
    status: "Scheduled",
  },
];

function getStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "Completed": return "default";
    case "In Progress": return "secondary";
    case "Scheduled": return "outline";
    case "Overdue": return "destructive";
    default: return "outline";
  }
}

function getTypeVariant(type: string): "default" | "secondary" | "destructive" {
  switch (type) {
    case "Preventive": return "default";
    case "Corrective": return "secondary";
    case "Emergency": return "destructive";
    default: return "default";
  }
}

export default async function AssetMaintenancePage() {
  const t = await getTranslations('assets');
  const tc = await getTranslations('common');
  const locale = await getLocale();

  const totalMaintenance = maintenanceLogs.length;
  const scheduled = maintenanceLogs.filter((m) => m.status === "Scheduled" || m.status === "In Progress").length;
  const completed = maintenanceLogs.filter((m) => m.status === "Completed").length;
  const totalCost = maintenanceLogs.reduce((sum, m) => sum + m.cost, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('maintenance.title')}
        description={t('maintenance.description')}
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          {tc('buttons.export')}
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {t('maintenance.scheduleMaintenance')}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('maintenance.totalMaintenance')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalMaintenance}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('maintenance.scheduledInProgress')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{scheduled}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('maintenance.completed')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{completed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('maintenance.totalCost')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalCost, locale)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('maintenance.maintenanceLog')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('maintenance.maintenanceId')}</TableHead>
                <TableHead>{t('maintenance.asset')}</TableHead>
                <TableHead>{t('maintenance.type')}</TableHead>
                <TableHead>{t('maintenance.description2')}</TableHead>
                <TableHead>{t('maintenance.scheduledDate')}</TableHead>
                <TableHead>{t('maintenance.completionDate')}</TableHead>
                <TableHead className="text-right">{t('maintenance.cost')}</TableHead>
                <TableHead>{t('maintenance.vendorTechnician')}</TableHead>
                <TableHead>{tc('labels.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {maintenanceLogs.map((entry) => (
                <TableRow key={entry.maintenanceId}>
                  <TableCell className="font-mono text-sm">{entry.maintenanceId}</TableCell>
                  <TableCell className="font-medium">{entry.asset}</TableCell>
                  <TableCell>
                    <Badge variant={getTypeVariant(entry.type)}>{entry.type}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[250px] truncate">{entry.description}</TableCell>
                  <TableCell>{formatDate(entry.scheduledDate, locale)}</TableCell>
                  <TableCell>{entry.completionDate ? formatDate(entry.completionDate, locale) : <span className="text-muted-foreground">--</span>}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(entry.cost, locale)}</TableCell>
                  <TableCell>{entry.vendor}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(entry.status)}>{entry.status}</Badge>
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
