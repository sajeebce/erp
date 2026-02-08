import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Users,
  Shield,
  GitBranch,
  Bell,
  Settings,
  Database,
} from "lucide-react";

interface SettingsCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

const settingsCards: SettingsCard[] = [
  {
    id: "organization",
    title: "Organization Setup",
    description: "Configure organization profile, offices, departments, fiscal year, and currency settings",
    icon: <Building2 className="h-6 w-6" />,
    href: "/settings/organization",
  },
  {
    id: "users",
    title: "User Management",
    description: "Manage user accounts, reset passwords, enable/disable access, and assign roles",
    icon: <Users className="h-6 w-6" />,
    href: "/settings/users",
  },
  {
    id: "roles",
    title: "Roles & Permissions",
    description: "Define roles with granular module-level and action-level permissions",
    icon: <Shield className="h-6 w-6" />,
    href: "/settings/roles",
  },
  {
    id: "workflows",
    title: "Approval Workflows",
    description: "Configure multi-level approval workflows for vouchers, requisitions, and other transactions",
    icon: <GitBranch className="h-6 w-6" />,
    href: "/settings/workflows",
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "Configure email and in-app notifications for approvals, deadlines, and system alerts",
    icon: <Bell className="h-6 w-6" />,
    href: "/settings/notifications",
  },
  {
    id: "configuration",
    title: "System Configuration",
    description: "Manage system-wide settings, number sequences, tax rates, and default values",
    icon: <Settings className="h-6 w-6" />,
    href: "/settings/system",
  },
  {
    id: "backup",
    title: "Backup & Logs",
    description: "Schedule database backups, view system logs, and manage data retention policies",
    icon: <Database className="h-6 w-6" />,
    href: "/settings/backup-logs",
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configure system settings, users, roles, and workflows"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {settingsCards.map((card) => (
          <Link key={card.id} href={card.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer group h-full">
              <CardHeader className="pb-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {card.icon}
                </div>
                <CardTitle className="text-base mt-2">{card.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {card.description}
                </p>
                <Button variant="link" className="px-0 mt-2 text-sm">
                  Configure
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
