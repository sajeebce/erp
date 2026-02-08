import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Building2, Calendar, Hash, Receipt, Settings } from "lucide-react";

interface ConfigItem {
  label: string;
  value: string;
}

const orgProfile: ConfigItem[] = [
  { label: "Organization Name", value: "Bangladesh Development Foundation (BDF)" },
  { label: "Registration No", value: "S-12345/2005 (Dept. of Social Services)" },
  { label: "NGOAB License No", value: "FD/NGO-2345/2010" },
  { label: "TIN", value: "123456789012" },
  { label: "BIN (VAT)", value: "001234567-0201" },
  { label: "Registered Address", value: "House 42, Road 7, Block D, Banani, Dhaka-1213" },
  { label: "Head Office", value: "Mohakhali DOHS, Dhaka-1206" },
  { label: "Phone", value: "+880-2-8876543" },
  { label: "Email", value: "info@bdf.org.bd" },
  { label: "Website", value: "www.bdf.org.bd" },
];

const fiscalSettings: ConfigItem[] = [
  { label: "Fiscal Year Start", value: "July (July - June)" },
  { label: "Current Fiscal Year", value: "FY 2025-26" },
  { label: "Base Currency", value: "BDT (Bangladeshi Taka)" },
  { label: "Number Format", value: "Indian (12,34,567.89)" },
  { label: "Date Format", value: "DD/MM/YYYY" },
  { label: "Reporting Currency", value: "BDT, USD" },
];

const numberSequences: ConfigItem[] = [
  { label: "Debit Voucher", value: "DV-{YYYY}-{SEQ:3}" },
  { label: "Credit Voucher", value: "RV-{YYYY}-{SEQ:3}" },
  { label: "Bank Voucher", value: "BV-{YYYY}-{SEQ:3}" },
  { label: "Cash Voucher", value: "CV-{YYYY}-{SEQ:3}" },
  { label: "Journal Voucher", value: "JV-{YYYY}-{SEQ:3}" },
  { label: "Purchase Order", value: "PO-{YYYY}-{SEQ:3}" },
  { label: "Purchase Requisition", value: "PR-{YYYY}-{SEQ:3}" },
  { label: "Employee ID", value: "EMP-{YYYY}-{SEQ:3}" },
  { label: "Beneficiary ID", value: "BEN-{YYYY}-{SEQ:4}" },
];

const taxConfig: ConfigItem[] = [
  { label: "VAT Rate", value: "15%" },
  { label: "TDS on Salary", value: "As per income slab" },
  { label: "TDS on Consultancy", value: "10%" },
  { label: "TDS on Suppliers", value: "3% - 7% (category-wise)" },
  { label: "AIT (Advance Income Tax)", value: "5% on imports" },
  { label: "Stamp Duty", value: "BDT 150 per agreement" },
];

const defaultValues: ConfigItem[] = [
  { label: "Default Bank Account", value: "Dutch Bangla Bank - Mohakhali (A/C: 123-456-7890)" },
  { label: "Default Cash Book", value: "HQ Petty Cash - Dhaka" },
  { label: "Default Cost Center", value: "Head Office Administration" },
  { label: "Approval Threshold", value: "BDT 50,000 (auto-approve below)" },
  { label: "Session Timeout", value: "30 minutes" },
  { label: "Password Policy", value: "Min 8 chars, 1 uppercase, 1 number, 1 special" },
];

export default function SystemConfigurationPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="System Configuration"
        description="Manage organization profile and system-wide settings"
      >
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Edit Settings
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">Organization Profile</CardTitle>
                <CardDescription>Legal registration and contact details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {orgProfile.map((item) => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium text-right max-w-[60%]">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">Fiscal Year Settings</CardTitle>
                <CardDescription>Financial year and currency configuration</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {fiscalSettings.map((item) => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">Tax Configuration</CardTitle>
                <CardDescription>VAT, TDS, AIT, and other tax rates</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {taxConfig.map((item) => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <Badge variant="outline">{item.value}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">Default Values</CardTitle>
                <CardDescription>System defaults for common operations</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {defaultValues.map((item) => (
                <div key={item.label} className="flex justify-between text-sm gap-4">
                  <span className="text-muted-foreground shrink-0">{item.label}</span>
                  <span className="font-medium text-right">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">Number Sequences</CardTitle>
              <CardDescription>Auto-numbering format for vouchers, orders, and IDs</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document Type</TableHead>
                <TableHead>Format Pattern</TableHead>
                <TableHead>Example</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {numberSequences.map((seq) => (
                <TableRow key={seq.label}>
                  <TableCell className="font-medium">{seq.label}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">{seq.value}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {seq.value.replace("{YYYY}", "2026").replace("{SEQ:3}", "001").replace("{SEQ:4}", "0001")}
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
