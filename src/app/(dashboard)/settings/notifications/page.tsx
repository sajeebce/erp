import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Mail, MessageSquare, Smartphone, CheckCircle, XCircle } from "lucide-react";

interface NotificationCategory {
  name: string;
  description: string;
  icon: string;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  smsEnabled: boolean;
  frequency: string;
  triggers: string[];
}

const categories: NotificationCategory[] = [
  {
    name: "Approvals",
    description: "Notifications for pending voucher, leave, and procurement approvals",
    icon: "approvals",
    emailEnabled: true,
    inAppEnabled: true,
    smsEnabled: false,
    frequency: "Immediate",
    triggers: [
      "Voucher pending approval",
      "Purchase requisition submitted",
      "Leave request submitted",
      "Budget revision request",
    ],
  },
  {
    name: "Deadlines",
    description: "Reminders for report submissions, donor deadlines, and compliance dates",
    icon: "deadlines",
    emailEnabled: true,
    inAppEnabled: true,
    smsEnabled: true,
    frequency: "Daily digest + 3 days before",
    triggers: [
      "NGOAB form due date approaching",
      "Donor report submission deadline",
      "Project milestone due",
      "Contract expiry reminder",
    ],
  },
  {
    name: "Budget Alerts",
    description: "Warnings when budget thresholds are reached or exceeded",
    icon: "budget",
    emailEnabled: true,
    inAppEnabled: true,
    smsEnabled: false,
    frequency: "Immediate",
    triggers: [
      "Budget utilization > 80%",
      "Budget utilization > 95%",
      "Budget line overspent",
      "Unauthorized expenditure detected",
    ],
  },
  {
    name: "System",
    description: "System maintenance, backup status, and security alerts",
    icon: "system",
    emailEnabled: true,
    inAppEnabled: true,
    smsEnabled: false,
    frequency: "Immediate for critical, daily for others",
    triggers: [
      "Backup completed/failed",
      "System maintenance scheduled",
      "Failed login attempts detected",
      "Password expiry reminder",
    ],
  },
  {
    name: "HR",
    description: "Staff-related notifications including attendance, leave, and payroll",
    icon: "hr",
    emailEnabled: true,
    inAppEnabled: true,
    smsEnabled: true,
    frequency: "Immediate",
    triggers: [
      "Payroll processed",
      "Leave approved/rejected",
      "Performance review due",
      "New employee onboarded",
    ],
  },
  {
    name: "Reports",
    description: "Notifications when scheduled reports are generated or ready",
    icon: "reports",
    emailEnabled: true,
    inAppEnabled: true,
    smsEnabled: false,
    frequency: "Per schedule",
    triggers: [
      "Scheduled report generated",
      "Custom report completed",
      "Export download ready",
      "Report generation failed",
    ],
  },
];

function StatusIndicator({ enabled }: { enabled: boolean }) {
  if (enabled) {
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  }
  return <XCircle className="h-4 w-4 text-muted-foreground" />;
}

export default function NotificationsSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Configure email and in-app notification preferences"
      >
        <Button variant="outline" size="sm">
          Save Changes
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((category) => (
          <Card key={category.name}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{category.name}</CardTitle>
                <Badge variant="outline">{category.frequency}</Badge>
              </div>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>Email</span>
                    <StatusIndicator enabled={category.emailEnabled} />
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <span>In-App</span>
                    <StatusIndicator enabled={category.inAppEnabled} />
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <span>SMS</span>
                    <StatusIndicator enabled={category.smsEnabled} />
                  </div>
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Triggers
                </p>
                <div className="space-y-1">
                  {category.triggers.map((trigger) => (
                    <div key={trigger} className="flex items-center gap-2 text-sm">
                      <MessageSquare className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">{trigger}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
