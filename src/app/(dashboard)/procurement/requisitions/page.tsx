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

interface PurchaseRequisition {
  id: string;
  date: string;
  requestedBy: string;
  department: string;
  project: string;
  itemsDescription: string;
  estimatedCost: number;
  priority: "Urgent" | "High" | "Normal" | "Low";
  approvalStatus: "Draft" | "Submitted" | "Reviewed" | "Approved" | "Rejected" | "PO Created";
  poReference: string | null;
}

const requisitions: PurchaseRequisition[] = [
  {
    id: "PR-2026-001",
    date: "2026-01-05",
    requestedBy: "Md. Rashidul Islam",
    department: "Programs - WASH",
    project: "WASH Phase-3 - Sylhet",
    itemsDescription: "PVC pipes, fittings, and tube well installation materials for 15 sites",
    estimatedCost: 2800000,
    priority: "High",
    approvalStatus: "PO Created",
    poReference: "PO-2026-001",
  },
  {
    id: "PR-2026-002",
    date: "2026-01-10",
    requestedBy: "Fatema Akhter",
    department: "Programs - Education",
    project: "Primary Education Enhancement",
    itemsDescription: "Textbooks, notebooks, and stationery for 200 schools",
    estimatedCost: 1500000,
    priority: "Normal",
    approvalStatus: "PO Created",
    poReference: "PO-2026-003",
  },
  {
    id: "PR-2026-003",
    date: "2026-01-15",
    requestedBy: "Shahidul Islam",
    department: "IT",
    project: "HQ Operations",
    itemsDescription: "5 laptops (ThinkPad T14s), 2 laser printers, networking cables",
    estimatedCost: 650000,
    priority: "Normal",
    approvalStatus: "Approved",
    poReference: null,
  },
  {
    id: "PR-2026-004",
    date: "2026-01-20",
    requestedBy: "Dr. Nasreen Sultana",
    department: "Programs - Health",
    project: "Maternal & Child Health",
    itemsDescription: "Blood pressure monitors, weighing scales, first aid kits for 8 health camps",
    estimatedCost: 420000,
    priority: "Urgent",
    approvalStatus: "Approved",
    poReference: null,
  },
  {
    id: "PR-2026-005",
    date: "2026-01-25",
    requestedBy: "Aminul Haque",
    department: "Admin",
    project: "HQ Operations",
    itemsDescription: "Office furniture - 10 desks, 15 ergonomic chairs, 3 filing cabinets",
    estimatedCost: 380000,
    priority: "Low",
    approvalStatus: "Reviewed",
    poReference: null,
  },
  {
    id: "PR-2026-006",
    date: "2026-01-28",
    requestedBy: "Kamal Hossain",
    department: "Programs - Climate",
    project: "Climate Adaptation Fund",
    itemsDescription: "Construction materials for flood-resilient housing pilot (cement, steel, bricks)",
    estimatedCost: 5200000,
    priority: "High",
    approvalStatus: "Submitted",
    poReference: null,
  },
  {
    id: "PR-2026-007",
    date: "2026-02-01",
    requestedBy: "Sharmin Akter",
    department: "Programs - Youth",
    project: "Youth Employment Initiative",
    itemsDescription: "Sewing machines (20), welding equipment (10), computer sets (15)",
    estimatedCost: 3500000,
    priority: "High",
    approvalStatus: "Submitted",
    poReference: null,
  },
  {
    id: "PR-2026-008",
    date: "2026-02-03",
    requestedBy: "Rehana Begum",
    department: "Programs - WASH",
    project: "WASH Phase-3 - Sylhet",
    itemsDescription: "Hygiene kits (500 sets) - soap, sanitizer, menstrual hygiene products",
    estimatedCost: 750000,
    priority: "Normal",
    approvalStatus: "Draft",
    poReference: null,
  },
  {
    id: "PR-2026-009",
    date: "2026-02-05",
    requestedBy: "Tahmina Rahman",
    department: "M&E",
    project: "Cross-cutting",
    itemsDescription: "Tablets (10) for field data collection with ODK/KoboToolbox",
    estimatedCost: 350000,
    priority: "Normal",
    approvalStatus: "Rejected",
    poReference: null,
  },
  {
    id: "PR-2026-010",
    date: "2026-02-07",
    requestedBy: "Kamrul Hasan",
    department: "Field Operations",
    project: "Multiple Projects",
    itemsDescription: "Vehicle maintenance parts, tires (8), and annual servicing for 4 project vehicles",
    estimatedCost: 280000,
    priority: "Urgent",
    approvalStatus: "Approved",
    poReference: null,
  },
];

function getStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "PO Created": return "default";
    case "Approved": return "default";
    case "Reviewed": return "secondary";
    case "Submitted": return "outline";
    case "Draft": return "outline";
    case "Rejected": return "destructive";
    default: return "outline";
  }
}

function getPriorityVariant(priority: string): "default" | "secondary" | "outline" | "destructive" {
  switch (priority) {
    case "Urgent": return "destructive";
    case "High": return "default";
    case "Normal": return "secondary";
    case "Low": return "outline";
    default: return "outline";
  }
}

export default async function PurchaseRequisitionsPage() {
  const t = await getTranslations('procurement');
  const tc = await getTranslations('common');
  const locale = await getLocale();

  const totalRequisitions = requisitions.length;
  const totalValue = requisitions.reduce((sum, r) => sum + r.estimatedCost, 0);
  const pendingApproval = requisitions.filter((r) =>
    ["Submitted", "Reviewed"].includes(r.approvalStatus)
  ).length;
  const poCreated = requisitions.filter((r) => r.approvalStatus === "PO Created").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('requisitions.title')}
        description={t('requisitions.description')}
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          {tc('buttons.export')}
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {t('requisitions.newRequisition')}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('requisitions.totalRequisitions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalRequisitions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('requisitions.totalValue')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalValue, locale)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('requisitions.pendingApproval')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{pendingApproval}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('requisitions.poCreated')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{poCreated}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('requisitions.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">{t('requisitions.prNo')}</TableHead>
                <TableHead>{t('requisitions.date')}</TableHead>
                <TableHead>{t('requisitions.requestedBy')}</TableHead>
                <TableHead>{t('requisitions.department')}</TableHead>
                <TableHead>{t('requisitions.itemsDescription')}</TableHead>
                <TableHead className="text-right">{t('requisitions.estimatedCost')}</TableHead>
                <TableHead>{t('requisitions.priority')}</TableHead>
                <TableHead>{tc('labels.status')}</TableHead>
                <TableHead>{t('requisitions.poRef')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requisitions.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-mono text-sm">{req.id}</TableCell>
                  <TableCell>{formatDate(req.date, locale)}</TableCell>
                  <TableCell className="font-medium">{req.requestedBy}</TableCell>
                  <TableCell className="text-sm">{req.department}</TableCell>
                  <TableCell className="max-w-[280px] truncate text-sm">{req.itemsDescription}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(req.estimatedCost, locale)}</TableCell>
                  <TableCell>
                    <Badge variant={getPriorityVariant(req.priority)} className="text-[10px]">
                      {req.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(req.approvalStatus)}>
                      {req.approvalStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {req.poReference || <span className="text-muted-foreground">-</span>}
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
