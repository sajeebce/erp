import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  FileText,
  Globe,
  FolderOpen,
  Users,
  ShoppingCart,
  Settings,
  Shield,
} from "lucide-react";

interface ReportCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  reportCount: number;
  href: string;
}

const reportCategories: ReportCategory[] = [
  {
    id: "financial",
    title: "Financial Reports",
    description: "Trial Balance, Income Statement, Balance Sheet, Cash Flow, and Fund Position reports",
    icon: <DollarSign className="h-6 w-6" />,
    reportCount: 12,
    href: "/reports/financial",
  },
  {
    id: "ngoab",
    title: "NGOAB / FD Forms",
    description: "FD-1 to FD-12 forms, NGOAB compliance reports, and annual returns for regulatory submission",
    icon: <FileText className="h-6 w-6" />,
    reportCount: 15,
    href: "/reports/ngoab",
  },
  {
    id: "donor",
    title: "Donor Reports",
    description: "Donor-specific financial reports, fund utilization certificates, and grant expenditure statements",
    icon: <Globe className="h-6 w-6" />,
    reportCount: 8,
    href: "/reports/donor",
  },
  {
    id: "project",
    title: "Project Reports",
    description: "Project progress, budget vs actual, activity completion, and outcome indicators",
    icon: <FolderOpen className="h-6 w-6" />,
    reportCount: 10,
    href: "/reports/project",
  },
  {
    id: "hr",
    title: "HR Reports",
    description: "Staff list, attendance summaries, leave balances, payroll register, and tax reports",
    icon: <Users className="h-6 w-6" />,
    reportCount: 9,
    href: "/reports/hr",
  },
  {
    id: "procurement",
    title: "Procurement Reports",
    description: "Purchase orders, vendor analysis, inventory status, and procurement summary reports",
    icon: <ShoppingCart className="h-6 w-6" />,
    reportCount: 7,
    href: "/reports/procurement",
  },
  {
    id: "custom",
    title: "Custom Reports",
    description: "Build custom reports with flexible filters, grouping, and export options",
    icon: <Settings className="h-6 w-6" />,
    reportCount: 3,
    href: "/reports/custom",
  },
  {
    id: "audit-trail",
    title: "Audit Trail",
    description: "Track all system activities, user actions, data changes, and login history for compliance",
    icon: <Shield className="h-6 w-6" />,
    reportCount: 5,
    href: "/reports/audit-trail",
  },
];

export default function ReportsPage() {
  const totalReports = reportCategories.reduce((sum, c) => sum + c.reportCount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Generate and export reports across all modules"
      >
        <Badge variant="secondary" className="text-sm">
          {totalReports} Reports Available
        </Badge>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportCategories.map((category) => (
          <Card
            key={category.id}
            className="hover:shadow-md transition-shadow cursor-pointer group"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {category.icon}
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {category.reportCount} Reports
                </Badge>
              </div>
              <CardTitle className="text-base mt-2">{category.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {category.description}
              </p>
              <Button variant="link" className="px-0 mt-2 text-sm">
                View Reports
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
