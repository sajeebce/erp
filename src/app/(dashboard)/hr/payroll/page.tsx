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
import { Download } from "lucide-react";
import { formatBDT } from "@/lib/formatters";

interface PayrollEntry {
  employeeId: string;
  name: string;
  designation: string;
  basicSalary: number;
  houseRent: number;
  medical: number;
  transport: number;
  grossSalary: number;
  taxDeduction: number;
  pfDeduction: number;
  netSalary: number;
  paymentStatus: "Paid" | "Pending" | "Processing";
}

const payrollData: PayrollEntry[] = [
  {
    employeeId: "EMP-001",
    name: "Dr. Aminul Haque",
    designation: "Executive Director",
    basicSalary: 120000,
    houseRent: 60000,
    medical: 12000,
    transport: 10000,
    grossSalary: 202000,
    taxDeduction: 15150,
    pfDeduction: 12000,
    netSalary: 174850,
    paymentStatus: "Paid",
  },
  {
    employeeId: "EMP-002",
    name: "Nasreen Sultana",
    designation: "Finance Director",
    basicSalary: 95000,
    houseRent: 47500,
    medical: 10000,
    transport: 8000,
    grossSalary: 160500,
    taxDeduction: 10038,
    pfDeduction: 9500,
    netSalary: 140962,
    paymentStatus: "Paid",
  },
  {
    employeeId: "EMP-003",
    name: "Md. Rafiqul Islam",
    designation: "Program Manager",
    basicSalary: 85000,
    houseRent: 42500,
    medical: 8500,
    transport: 7000,
    grossSalary: 143000,
    taxDeduction: 7150,
    pfDeduction: 8500,
    netSalary: 127350,
    paymentStatus: "Paid",
  },
  {
    employeeId: "EMP-004",
    name: "Fatima Akter Ruma",
    designation: "HR Manager",
    basicSalary: 75000,
    houseRent: 37500,
    medical: 7500,
    transport: 6000,
    grossSalary: 126000,
    taxDeduction: 5040,
    pfDeduction: 7500,
    netSalary: 113460,
    paymentStatus: "Paid",
  },
  {
    employeeId: "EMP-005",
    name: "Shahin Ahmed",
    designation: "Regional Coordinator",
    basicSalary: 65000,
    houseRent: 32500,
    medical: 6500,
    transport: 5000,
    grossSalary: 109000,
    taxDeduction: 2725,
    pfDeduction: 6500,
    netSalary: 99775,
    paymentStatus: "Paid",
  },
  {
    employeeId: "EMP-006",
    name: "Tahmina Khanam",
    designation: "M&E Specialist",
    basicSalary: 60000,
    houseRent: 30000,
    medical: 6000,
    transport: 5000,
    grossSalary: 101000,
    taxDeduction: 2020,
    pfDeduction: 6000,
    netSalary: 92980,
    paymentStatus: "Paid",
  },
  {
    employeeId: "EMP-007",
    name: "Kamal Hossain",
    designation: "Field Officer",
    basicSalary: 45000,
    houseRent: 22500,
    medical: 4500,
    transport: 4000,
    grossSalary: 76000,
    taxDeduction: 0,
    pfDeduction: 4500,
    netSalary: 71500,
    paymentStatus: "Processing",
  },
  {
    employeeId: "EMP-008",
    name: "Nusrat Jahan",
    designation: "Accounts Officer",
    basicSalary: 50000,
    houseRent: 25000,
    medical: 5000,
    transport: 4000,
    grossSalary: 84000,
    taxDeduction: 0,
    pfDeduction: 5000,
    netSalary: 79000,
    paymentStatus: "Paid",
  },
  {
    employeeId: "EMP-009",
    name: "Md. Sohel Rana",
    designation: "Agriculture Specialist",
    basicSalary: 55000,
    houseRent: 27500,
    medical: 5500,
    transport: 4500,
    grossSalary: 92500,
    taxDeduction: 0,
    pfDeduction: 5500,
    netSalary: 87000,
    paymentStatus: "Paid",
  },
  {
    employeeId: "EMP-010",
    name: "Rubina Yasmin",
    designation: "Gender Specialist",
    basicSalary: 55000,
    houseRent: 27500,
    medical: 5500,
    transport: 4500,
    grossSalary: 92500,
    taxDeduction: 0,
    pfDeduction: 5500,
    netSalary: 87000,
    paymentStatus: "Paid",
  },
  {
    employeeId: "EMP-011",
    name: "Tanvir Ahmed Khan",
    designation: "IT Officer",
    basicSalary: 42000,
    houseRent: 21000,
    medical: 4200,
    transport: 3500,
    grossSalary: 70700,
    taxDeduction: 0,
    pfDeduction: 4200,
    netSalary: 66500,
    paymentStatus: "Pending",
  },
  {
    employeeId: "EMP-012",
    name: "Sharmin Akhter",
    designation: "Community Mobilizer",
    basicSalary: 35000,
    houseRent: 17500,
    medical: 3500,
    transport: 3000,
    grossSalary: 59000,
    taxDeduction: 0,
    pfDeduction: 3500,
    netSalary: 55500,
    paymentStatus: "Pending",
  },
];

function getPaymentStatusVariant(status: string): "default" | "secondary" | "outline" {
  switch (status) {
    case "Paid": return "default";
    case "Processing": return "secondary";
    case "Pending": return "outline";
    default: return "outline";
  }
}

export default function PayrollPage() {
  const totalGross = payrollData.reduce((sum, p) => sum + p.grossSalary, 0);
  const totalDeductions = payrollData.reduce((sum, p) => sum + p.taxDeduction + p.pfDeduction, 0);
  const totalNet = payrollData.reduce((sum, p) => sum + p.netSalary, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll - February 2026"
        description="Process monthly payroll and manage salary structures"
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export Payslips
        </Button>
        <Button size="sm">
          <Download className="h-4 w-4 mr-2" />
          Bank Transfer File
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Gross Salary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBDT(totalGross)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Deductions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBDT(totalDeductions)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Net Salary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBDT(totalNet)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pay Period</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Feb 2026</p>
            <p className="text-xs text-muted-foreground">{payrollData.length} employees</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payroll Register</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee ID</TableHead>
                <TableHead>Employee Name</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead className="text-right">Basic</TableHead>
                <TableHead className="text-right">House Rent</TableHead>
                <TableHead className="text-right">Medical</TableHead>
                <TableHead className="text-right">Transport</TableHead>
                <TableHead className="text-right">Gross</TableHead>
                <TableHead className="text-right">Tax</TableHead>
                <TableHead className="text-right">PF</TableHead>
                <TableHead className="text-right">Net Salary</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrollData.map((entry) => (
                <TableRow key={entry.employeeId}>
                  <TableCell className="font-mono text-sm">{entry.employeeId}</TableCell>
                  <TableCell className="font-medium">{entry.name}</TableCell>
                  <TableCell>{entry.designation}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatBDT(entry.basicSalary)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatBDT(entry.houseRent)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatBDT(entry.medical)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatBDT(entry.transport)}</TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold">{formatBDT(entry.grossSalary)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatBDT(entry.taxDeduction)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatBDT(entry.pfDeduction)}</TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold">{formatBDT(entry.netSalary)}</TableCell>
                  <TableCell>
                    <Badge variant={getPaymentStatusVariant(entry.paymentStatus)}>{entry.paymentStatus}</Badge>
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
