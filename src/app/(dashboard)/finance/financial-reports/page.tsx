import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Download,
  FileSpreadsheet,
  BarChart3,
  PieChart,
  TrendingUp,
  Wallet,
  Receipt,
  BookOpen,
  Calendar,
  Landmark,
  FileText,
} from "lucide-react";
import { formatDate } from "@/lib/formatters";

interface FinancialReport {
  id: string;
  title: string;
  description: string;
  lastGenerated: string;
  icon: React.ReactNode;
  category: "Core" | "Subsidiary" | "Donor";
}

const reports: FinancialReport[] = [
  {
    id: "RPT-001",
    title: "Trial Balance",
    description: "Summary of all general ledger account balances for the current period showing debits and credits.",
    lastGenerated: "2026-01-31",
    icon: <FileSpreadsheet className="h-5 w-5" />,
    category: "Core",
  },
  {
    id: "RPT-002",
    title: "Income Statement",
    description: "Revenue and expenditure summary showing net income/loss for the period. Includes grant income and program expenses.",
    lastGenerated: "2026-01-31",
    icon: <BarChart3 className="h-5 w-5" />,
    category: "Core",
  },
  {
    id: "RPT-003",
    title: "Balance Sheet",
    description: "Statement of financial position showing assets, liabilities, and fund balances as of the reporting date.",
    lastGenerated: "2026-01-31",
    icon: <PieChart className="h-5 w-5" />,
    category: "Core",
  },
  {
    id: "RPT-004",
    title: "Cash Flow Statement",
    description: "Cash inflows and outflows from operating, investing, and financing activities during the period.",
    lastGenerated: "2026-01-31",
    icon: <TrendingUp className="h-5 w-5" />,
    category: "Core",
  },
  {
    id: "RPT-005",
    title: "Fund Position Report",
    description: "Current position of restricted and unrestricted funds across all donor-funded projects and core operations.",
    lastGenerated: "2026-01-28",
    icon: <Wallet className="h-5 w-5" />,
    category: "Donor",
  },
  {
    id: "RPT-006",
    title: "Receipt & Payment Statement",
    description: "Summary of all cash and bank receipts and payments during the period, categorized by funding source.",
    lastGenerated: "2026-01-31",
    icon: <Receipt className="h-5 w-5" />,
    category: "Core",
  },
  {
    id: "RPT-007",
    title: "Ledger Book",
    description: "Detailed transaction records for each general ledger account with running balances and references.",
    lastGenerated: "2026-01-30",
    icon: <BookOpen className="h-5 w-5" />,
    category: "Subsidiary",
  },
  {
    id: "RPT-008",
    title: "Day Book",
    description: "Chronological record of all financial transactions entered on each day, including voucher references.",
    lastGenerated: "2026-02-01",
    icon: <Calendar className="h-5 w-5" />,
    category: "Subsidiary",
  },
  {
    id: "RPT-009",
    title: "Bank Book",
    description: "Transaction register for all bank accounts showing deposits, withdrawals, and running balances.",
    lastGenerated: "2026-01-31",
    icon: <Landmark className="h-5 w-5" />,
    category: "Subsidiary",
  },
  {
    id: "RPT-010",
    title: "Cash Book",
    description: "Record of all cash transactions at head office and field offices with daily closing balances.",
    lastGenerated: "2026-02-01",
    icon: <FileText className="h-5 w-5" />,
    category: "Subsidiary",
  },
];

function getCategoryColor(category: string): string {
  switch (category) {
    case "Core": return "text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400";
    case "Subsidiary": return "text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400";
    case "Donor": return "text-purple-600 bg-purple-50 dark:bg-purple-950 dark:text-purple-400";
    default: return "text-muted-foreground bg-muted";
  }
}

export default function FinancialReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial Reports"
        description="Generate trial balance, income statements, and balance sheets"
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export All
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => (
          <Card key={report.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${getCategoryColor(report.category)}`}>
                    {report.icon}
                  </div>
                  <div>
                    <CardTitle className="text-base">{report.title}</CardTitle>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${getCategoryColor(report.category)}`}>
                      {report.category}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <CardDescription className="text-sm leading-relaxed">
                {report.description}
              </CardDescription>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Last generated: {formatDate(report.lastGenerated)}
                </p>
                <Button size="sm" variant="outline">
                  <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
                  Generate
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
