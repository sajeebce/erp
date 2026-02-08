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
import { Switch } from "@/components/ui/switch";
import {
  Settings,
  Shield,
  Mail,
  Hash,
  Receipt,
  Database,
  Globe,
  Clock,
  Lock,
  Key,
  Server,
  HardDrive,
} from "lucide-react";

interface ConfigItem {
  label: string;
  value: string;
}

interface NumberSequence {
  documentType: string;
  pattern: string;
  currentNumber: number;
  prefix: string;
}

const securitySettings = [
  { label: "Minimum Password Length", value: "8 characters" },
  { label: "Password Complexity", value: "Uppercase + Number + Special character" },
  { label: "Password Expiry", value: "90 days" },
  { label: "Maximum Login Attempts", value: "5 (then 30 min lockout)" },
  { label: "Session Timeout", value: "30 minutes" },
  { label: "Two-Factor Authentication", value: "Optional (Email OTP)" },
  { label: "IP Whitelist", value: "Disabled" },
  { label: "Audit Log Retention", value: "365 days" },
];

const emailSettings = [
  { label: "SMTP Server", value: "smtp.bdf.org.bd" },
  { label: "SMTP Port", value: "587 (STARTTLS)" },
  { label: "From Address", value: "noreply@bdf.org.bd" },
  { label: "From Name", value: "BDF ERP System" },
  { label: "Daily Send Limit", value: "500 emails/day" },
  { label: "Email Template Engine", value: "MJML + Handlebars" },
];

const taxConfig: ConfigItem[] = [
  { label: "VAT Rate", value: "15%" },
  { label: "TDS on Salary", value: "As per income slab" },
  { label: "TDS on Consultancy", value: "10%" },
  { label: "TDS on Suppliers", value: "3% - 7% (category-wise)" },
  { label: "AIT (Advance Income Tax)", value: "5% on imports" },
  { label: "Stamp Duty", value: "BDT 150 per agreement" },
];

const numberSequences: NumberSequence[] = [
  { documentType: "Debit Voucher", pattern: "DV-{YYYY}-{SEQ:3}", currentNumber: 487, prefix: "DV" },
  { documentType: "Credit Voucher", pattern: "RV-{YYYY}-{SEQ:3}", currentNumber: 312, prefix: "RV" },
  { documentType: "Bank Voucher", pattern: "BV-{YYYY}-{SEQ:3}", currentNumber: 156, prefix: "BV" },
  { documentType: "Cash Voucher", pattern: "CV-{YYYY}-{SEQ:3}", currentNumber: 89, prefix: "CV" },
  { documentType: "Journal Voucher", pattern: "JV-{YYYY}-{SEQ:3}", currentNumber: 234, prefix: "JV" },
  { documentType: "Purchase Order", pattern: "PO-{YYYY}-{SEQ:3}", currentNumber: 78, prefix: "PO" },
  { documentType: "Purchase Requisition", pattern: "PR-{YYYY}-{SEQ:3}", currentNumber: 145, prefix: "PR" },
  { documentType: "Employee ID", pattern: "EMP-{YYYY}-{SEQ:3}", currentNumber: 285, prefix: "EMP" },
  { documentType: "Beneficiary ID", pattern: "BEN-{YYYY}-{SEQ:4}", currentNumber: 4523, prefix: "BEN" },
];

const defaultValues = [
  { label: "Default Bank Account", value: "Dutch Bangla Bank - Mohakhali (A/C: 123-456-7890)" },
  { label: "Default Cash Book", value: "HQ Petty Cash - Dhaka" },
  { label: "Default Cost Center", value: "Head Office Administration" },
  { label: "Approval Threshold", value: "BDT 50,000 (auto-approve below)" },
  { label: "Default Currency", value: "BDT (Bangladeshi Taka)" },
  { label: "Decimal Places", value: "2" },
];

const systemModules = [
  { name: "Finance & Accounting", enabled: true, version: "3.2.1" },
  { name: "Budget Management", enabled: true, version: "2.1.0" },
  { name: "Donor & Grant Management", enabled: true, version: "2.5.3" },
  { name: "Project Management", enabled: true, version: "3.0.2" },
  { name: "Beneficiary Management", enabled: true, version: "2.3.1" },
  { name: "Procurement & Supply Chain", enabled: true, version: "2.8.0" },
  { name: "Human Resources", enabled: true, version: "3.1.4" },
  { name: "Fixed Asset Management", enabled: true, version: "1.9.2" },
  { name: "Microfinance (MFI)", enabled: true, version: "2.6.0" },
  { name: "Reports & Analytics", enabled: true, version: "3.4.1" },
  { name: "API Integration Layer", enabled: false, version: "1.0.0-beta" },
  { name: "Mobile App Backend", enabled: false, version: "0.9.5" },
];

export default function SystemConfigurationPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="System Configuration"
        description="Manage system-wide settings, security, number sequences, and integrations"
      >
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Edit Settings
        </Button>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">System Version</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-blue-500" />
              <p className="text-2xl font-bold">v3.4.1</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Last updated: 01 Feb 2026</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Modules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-500" />
              <p className="text-2xl font-bold">{systemModules.filter(m => m.enabled).length}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">of {systemModules.length} total modules</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Security Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-500" />
              <p className="text-2xl font-bold">87/100</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Enable 2FA to reach 95</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Storage Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-orange-500" />
              <p className="text-2xl font-bold">24.8 GB</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">of 100 GB allocated</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">Security & Authentication</CardTitle>
                <CardDescription>Password policy, session, and access controls</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {securitySettings.map((item) => (
                <div key={item.label} className="flex justify-between text-sm gap-4">
                  <span className="text-muted-foreground shrink-0">{item.label}</span>
                  <span className="font-medium text-right">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Email Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">Email / SMTP Configuration</CardTitle>
                <CardDescription>Outbound email server settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {emailSettings.map((item) => (
                <div key={item.label} className="flex justify-between text-sm gap-4">
                  <span className="text-muted-foreground shrink-0">{item.label}</span>
                  <span className="font-medium text-right">{item.value}</span>
                </div>
              ))}
              <div className="pt-2 border-t">
                <Button variant="outline" size="sm" className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Test Email
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tax Configuration */}
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

        {/* Default Values */}
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

      {/* Number Sequences */}
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
                <TableHead>Example (Next)</TableHead>
                <TableHead className="text-center">Current #</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {numberSequences.map((seq) => (
                <TableRow key={seq.documentType}>
                  <TableCell className="font-medium">{seq.documentType}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">{seq.pattern}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {seq.prefix}-2026-{String(seq.currentNumber + 1).padStart(seq.documentType === "Beneficiary ID" ? 4 : 3, "0")}
                  </TableCell>
                  <TableCell className="text-center text-sm">{seq.currentNumber}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* System Modules */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">System Modules</CardTitle>
              <CardDescription>Enable or disable ERP modules</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Module Name</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Enabled</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {systemModules.map((mod) => (
                <TableRow key={mod.name}>
                  <TableCell className="font-medium">{mod.name}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">{mod.version}</TableCell>
                  <TableCell>
                    <Badge variant={mod.enabled ? "default" : "secondary"}>
                      {mod.enabled ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Switch checked={mod.enabled} />
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
