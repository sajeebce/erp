import {
  Wallet,
  TrendingUp,
  FolderOpen,
  Users,
  Clock,
  UserCheck,
  ShoppingCart,
  Shield,
} from "lucide-react";
import type { KPICardData } from "@/types";

export const kpiCards: KPICardData[] = [
  {
    title: "Total Fund Received",
    value: "৳15.5 Cr",
    change: "+12%",
    changeType: "positive",
    icon: Wallet,
    description: "from last year",
  },
  {
    title: "Fund Utilized",
    value: "৳12.3 Cr",
    change: "79.4%",
    changeType: "neutral",
    icon: TrendingUp,
    description: "utilization rate",
  },
  {
    title: "Active Projects",
    value: "8",
    change: "+2",
    changeType: "positive",
    icon: FolderOpen,
    description: "new this quarter",
  },
  {
    title: "Active Beneficiaries",
    value: "45,230",
    change: "+8%",
    changeType: "positive",
    icon: Users,
    description: "growth rate",
  },
  {
    title: "Pending Approvals",
    value: "12",
    change: "3 urgent",
    changeType: "negative",
    icon: Clock,
    description: "requires action",
  },
  {
    title: "Staff Count",
    value: "285",
    change: "15 offices",
    changeType: "neutral",
    icon: UserCheck,
    description: "across field offices",
  },
  {
    title: "Procurement",
    value: "5",
    change: "৳2.1 Cr",
    changeType: "neutral",
    icon: ShoppingCart,
    description: "in progress",
  },
  {
    title: "Compliance",
    value: "95%",
    change: "1 pending",
    changeType: "positive",
    icon: Shield,
    description: "report status",
  },
];

export const fundUtilizationData = [
  { project: "Clean Water - Sylhet", amount: 3500000, fill: "var(--chart-1)" },
  { project: "Education - Char Areas", amount: 2800000, fill: "var(--chart-2)" },
  { project: "Healthcare - Cox's Bazar", amount: 2200000, fill: "var(--chart-3)" },
  { project: "Women Empowerment - Rangpur", amount: 1900000, fill: "var(--chart-4)" },
  { project: "Disaster Preparedness", amount: 1900000, fill: "var(--chart-5)" },
];

export const monthlyIncomeExpenseData = [
  { month: "Jan", income: 1200000, expense: 980000 },
  { month: "Feb", income: 1350000, expense: 1100000 },
  { month: "Mar", income: 1100000, expense: 1050000 },
  { month: "Apr", income: 1500000, expense: 1200000 },
  { month: "May", income: 1400000, expense: 1150000 },
  { month: "Jun", income: 1600000, expense: 1300000 },
  { month: "Jul", income: 1250000, expense: 1100000 },
  { month: "Aug", income: 1450000, expense: 1250000 },
  { month: "Sep", income: 1700000, expense: 1400000 },
  { month: "Oct", income: 1550000, expense: 1350000 },
  { month: "Nov", income: 1800000, expense: 1500000 },
  { month: "Dec", income: 2000000, expense: 1600000 },
];

export const donorContributionData = [
  { name: "USAID", value: 4500000, fill: "var(--chart-1)" },
  { name: "World Bank", value: 3200000, fill: "var(--chart-2)" },
  { name: "DFID/FCDO", value: 2800000, fill: "var(--chart-3)" },
  { name: "UNICEF", value: 1500000, fill: "var(--chart-4)" },
  { name: "Local Donors", value: 2000000, fill: "var(--chart-5)" },
];

export const projectProgressData = [
  { name: "Clean Water - Sylhet", progress: 78, status: "on-track" },
  { name: "Education - Char Areas", progress: 92, status: "on-track" },
  { name: "Healthcare - Cox's Bazar", progress: 45, status: "at-risk" },
  { name: "Women Empowerment", progress: 65, status: "on-track" },
  { name: "Disaster Preparedness", progress: 30, status: "delayed" },
  { name: "Youth Skills Development", progress: 85, status: "on-track" },
  { name: "Agricultural Support", progress: 55, status: "at-risk" },
  { name: "Sanitation Program", progress: 70, status: "on-track" },
];

export const budgetVsActualData = [
  { category: "Personnel", budget: 4500000, actual: 4200000 },
  { category: "Operations", budget: 3200000, actual: 3400000 },
  { category: "Equipment", budget: 1800000, actual: 1600000 },
  { category: "Travel", budget: 1200000, actual: 1100000 },
  { category: "Training", budget: 900000, actual: 850000 },
  { category: "Admin", budget: 700000, actual: 750000 },
];

export const beneficiaryGrowthData = [
  { month: "Jan", total: 38000 },
  { month: "Feb", total: 39200 },
  { month: "Mar", total: 39800 },
  { month: "Apr", total: 40500 },
  { month: "May", total: 41200 },
  { month: "Jun", total: 41800 },
  { month: "Jul", total: 42300 },
  { month: "Aug", total: 42900 },
  { month: "Sep", total: 43500 },
  { month: "Oct", total: 44100 },
  { month: "Nov", total: 44700 },
  { month: "Dec", total: 45230 },
];

export const upcomingDeadlines = [
  { id: 1, title: "NGOAB FD-6 Submission", date: "2026-02-15", priority: "high", type: "compliance" },
  { id: 2, title: "Q1 Donor Report - USAID", date: "2026-02-28", priority: "high", type: "report" },
  { id: 3, title: "MRA Quarterly Return", date: "2026-03-10", priority: "medium", type: "compliance" },
  { id: 4, title: "Annual Audit Preparation", date: "2026-03-15", priority: "medium", type: "audit" },
  { id: 5, title: "Project Closeout - Education Phase 1", date: "2026-03-31", priority: "low", type: "project" },
];

export const recentTransactions = [
  { id: "TXN-001", date: "2026-02-07", description: "Salary Disbursement - January", project: "Admin", amount: 2850000, type: "debit", status: "approved" },
  { id: "TXN-002", date: "2026-02-06", description: "Fund Receipt - USAID Q1", project: "Clean Water", amount: 5000000, type: "credit", status: "approved" },
  { id: "TXN-003", date: "2026-02-05", description: "Office Rent - Dhaka HQ", project: "Admin", amount: 150000, type: "debit", status: "approved" },
  { id: "TXN-004", date: "2026-02-04", description: "Equipment Purchase - Tablets", project: "Healthcare", amount: 480000, type: "debit", status: "pending" },
  { id: "TXN-005", date: "2026-02-03", description: "Training Workshop", project: "Education", amount: 95000, type: "debit", status: "approved" },
  { id: "TXN-006", date: "2026-02-02", description: "Vehicle Maintenance", project: "Operations", amount: 35000, type: "debit", status: "approved" },
  { id: "TXN-007", date: "2026-02-01", description: "Fund Receipt - World Bank", project: "Women Empowerment", amount: 3200000, type: "credit", status: "approved" },
  { id: "TXN-008", date: "2026-01-31", description: "Field Office Supplies", project: "Disaster Prep", amount: 125000, type: "debit", status: "pending" },
];
