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
import { Download, Settings, FolderTree, BarChart3, Percent } from "lucide-react";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/formatters";

interface ProjectAllocation {
  projectName: string;
  amount: number;
  percent: number;
}

interface CostAllocationItem {
  id: string;
  costItem: string;
  totalAmount: number;
  allocations: ProjectAllocation[];
  allocationMethod: "Headcount" | "Floor Space" | "Direct Usage" | "Equal Split" | "Budget Ratio";
}

const projects = [
  "WASH - Sylhet",
  "Education",
  "Maternal Health",
  "Climate Resilience",
  "Microfinance",
];

const costAllocations: CostAllocationItem[] = [
  {
    id: "CA-001",
    costItem: "Office Rent - Head Office (Mohakhali)",
    totalAmount: 1800000,
    allocations: [
      { projectName: "WASH - Sylhet", amount: 450000, percent: 25.0 },
      { projectName: "Education", amount: 360000, percent: 20.0 },
      { projectName: "Maternal Health", amount: 270000, percent: 15.0 },
      { projectName: "Climate Resilience", amount: 360000, percent: 20.0 },
      { projectName: "Microfinance", amount: 360000, percent: 20.0 },
    ],
    allocationMethod: "Floor Space",
  },
  {
    id: "CA-002",
    costItem: "Utilities (Electricity, Water, Gas)",
    totalAmount: 360000,
    allocations: [
      { projectName: "WASH - Sylhet", amount: 90000, percent: 25.0 },
      { projectName: "Education", amount: 72000, percent: 20.0 },
      { projectName: "Maternal Health", amount: 54000, percent: 15.0 },
      { projectName: "Climate Resilience", amount: 72000, percent: 20.0 },
      { projectName: "Microfinance", amount: 72000, percent: 20.0 },
    ],
    allocationMethod: "Floor Space",
  },
  {
    id: "CA-003",
    costItem: "Admin Staff (Finance, HR, IT)",
    totalAmount: 4200000,
    allocations: [
      { projectName: "WASH - Sylhet", amount: 1050000, percent: 25.0 },
      { projectName: "Education", amount: 1260000, percent: 30.0 },
      { projectName: "Maternal Health", amount: 630000, percent: 15.0 },
      { projectName: "Climate Resilience", amount: 630000, percent: 15.0 },
      { projectName: "Microfinance", amount: 630000, percent: 15.0 },
    ],
    allocationMethod: "Budget Ratio",
  },
  {
    id: "CA-004",
    costItem: "Vehicle Costs (Fuel, Maintenance, Insurance)",
    totalAmount: 960000,
    allocations: [
      { projectName: "WASH - Sylhet", amount: 288000, percent: 30.0 },
      { projectName: "Education", amount: 192000, percent: 20.0 },
      { projectName: "Maternal Health", amount: 192000, percent: 20.0 },
      { projectName: "Climate Resilience", amount: 192000, percent: 20.0 },
      { projectName: "Microfinance", amount: 96000, percent: 10.0 },
    ],
    allocationMethod: "Direct Usage",
  },
  {
    id: "CA-005",
    costItem: "IT Infrastructure (Internet, Server, Licenses)",
    totalAmount: 600000,
    allocations: [
      { projectName: "WASH - Sylhet", amount: 120000, percent: 20.0 },
      { projectName: "Education", amount: 120000, percent: 20.0 },
      { projectName: "Maternal Health", amount: 120000, percent: 20.0 },
      { projectName: "Climate Resilience", amount: 120000, percent: 20.0 },
      { projectName: "Microfinance", amount: 120000, percent: 20.0 },
    ],
    allocationMethod: "Equal Split",
  },
  {
    id: "CA-006",
    costItem: "Office Supplies & Stationery",
    totalAmount: 240000,
    allocations: [
      { projectName: "WASH - Sylhet", amount: 72000, percent: 30.0 },
      { projectName: "Education", amount: 48000, percent: 20.0 },
      { projectName: "Maternal Health", amount: 36000, percent: 15.0 },
      { projectName: "Climate Resilience", amount: 48000, percent: 20.0 },
      { projectName: "Microfinance", amount: 36000, percent: 15.0 },
    ],
    allocationMethod: "Headcount",
  },
  {
    id: "CA-007",
    costItem: "Security & Cleaning Services",
    totalAmount: 480000,
    allocations: [
      { projectName: "WASH - Sylhet", amount: 120000, percent: 25.0 },
      { projectName: "Education", amount: 96000, percent: 20.0 },
      { projectName: "Maternal Health", amount: 72000, percent: 15.0 },
      { projectName: "Climate Resilience", amount: 96000, percent: 20.0 },
      { projectName: "Microfinance", amount: 96000, percent: 20.0 },
    ],
    allocationMethod: "Floor Space",
  },
];

function getMethodVariant(method: string): "default" | "secondary" | "outline" | "destructive" {
  switch (method) {
    case "Headcount": return "default";
    case "Floor Space": return "secondary";
    case "Direct Usage": return "outline";
    case "Equal Split": return "default";
    case "Budget Ratio": return "secondary";
    default: return "outline";
  }
}

export default async function CostAllocationPage() {
  const t = await getTranslations('budget.costAllocation');
  const tc = await getTranslations('common');
  const locale = await getLocale();
  const totalSharedCosts = costAllocations.reduce((sum, item) => sum + item.totalAmount, 0);
  const projectsCovered = projects.length;

  // Calculate total per project
  const projectTotals = projects.map((projectName) => {
    const total = costAllocations.reduce((sum, item) => {
      const allocation = item.allocations.find((a) => a.projectName === projectName);
      return sum + (allocation?.amount ?? 0);
    }, 0);
    return { projectName, total };
  });

  const avgAdminRatio = projectTotals.reduce((sum, p) => {
    // Approximate project budget from context (using allocated admin cost as ratio indicator)
    return sum + (p.total / totalSharedCosts) * 100;
  }, 0) / projectsCovered;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          {tc('buttons.export')}
        </Button>
        <Button size="sm">
          <Settings className="h-4 w-4 mr-2" />
          {t('allocationRules')}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('totalSharedCosts')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{formatCurrency(totalSharedCosts, locale)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('projectsCovered')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FolderTree className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{projectsCovered}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('costItems')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{costAllocations.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('avgAllocation')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{formatCurrency(Math.round(totalSharedCosts / projectsCovered), locale)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('matrix')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[220px]">{t('costItem')}</TableHead>
                  <TableHead className="text-right min-w-[120px]">{t('totalAmount')}</TableHead>
                  {projects.map((project) => (
                    <TableHead key={project} className="text-center min-w-[140px]">
                      {project}
                    </TableHead>
                  ))}
                  <TableHead className="min-w-[110px]">{t('method')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costAllocations.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-sm font-medium">{item.costItem}</TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(item.totalAmount, locale)}
                    </TableCell>
                    {projects.map((projectName) => {
                      const allocation = item.allocations.find(
                        (a) => a.projectName === projectName
                      );
                      return (
                        <TableCell key={projectName} className="text-center">
                          <div className="space-y-0.5">
                            <p className="font-mono text-sm">
                              {allocation ? formatCurrency(allocation.amount, locale) : "-"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {allocation ? formatPercent(allocation.percent, locale) : "-"}
                            </p>
                          </div>
                        </TableCell>
                      );
                    })}
                    <TableCell>
                      <Badge variant={getMethodVariant(item.allocationMethod)}>
                        {item.allocationMethod}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell className="font-semibold">{t('totalPerProject')}</TableCell>
                  <TableCell className="text-right font-mono font-semibold">
                    {formatCurrency(totalSharedCosts, locale)}
                  </TableCell>
                  {projectTotals.map((pt) => (
                    <TableCell key={pt.projectName} className="text-center">
                      <div className="space-y-0.5">
                        <p className="font-mono font-semibold">{formatCurrency(pt.total, locale)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatPercent((pt.total / totalSharedCosts) * 100, locale)}
                        </p>
                      </div>
                    </TableCell>
                  ))}
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
