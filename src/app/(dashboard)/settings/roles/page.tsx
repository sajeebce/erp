import { getTranslations } from 'next-intl/server';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Shield, Users, Eye, PenLine, Trash2 } from "lucide-react";

interface Permission {
  module: string;
  access: "Full" | "Read/Write" | "Read Only" | "No Access";
}

interface Role {
  name: string;
  description: string;
  usersAssigned: number;
  permissions: Permission[];
}

const roles: Role[] = [
  {
    name: "Super Admin",
    description: "Full system access with all administrative capabilities",
    usersAssigned: 1,
    permissions: [
      { module: "Finance", access: "Full" },
      { module: "Budget", access: "Full" },
      { module: "Projects", access: "Full" },
      { module: "HR", access: "Full" },
      { module: "Procurement", access: "Full" },
      { module: "Settings", access: "Full" },
      { module: "Reports", access: "Full" },
    ],
  },
  {
    name: "Finance Admin",
    description: "Manage all financial operations, vouchers, and fund tracking",
    usersAssigned: 2,
    permissions: [
      { module: "Finance", access: "Full" },
      { module: "Budget", access: "Full" },
      { module: "Projects", access: "Read Only" },
      { module: "HR", access: "No Access" },
      { module: "Procurement", access: "Read/Write" },
      { module: "Settings", access: "No Access" },
      { module: "Reports", access: "Full" },
    ],
  },
  {
    name: "Program Manager",
    description: "Oversee project implementation, beneficiaries, and M&E activities",
    usersAssigned: 1,
    permissions: [
      { module: "Finance", access: "Read Only" },
      { module: "Budget", access: "Read/Write" },
      { module: "Projects", access: "Full" },
      { module: "HR", access: "Read Only" },
      { module: "Procurement", access: "Read/Write" },
      { module: "Settings", access: "No Access" },
      { module: "Reports", access: "Read/Write" },
    ],
  },
  {
    name: "HR Manager",
    description: "Manage staff records, attendance, payroll, and performance",
    usersAssigned: 1,
    permissions: [
      { module: "Finance", access: "Read Only" },
      { module: "Budget", access: "Read Only" },
      { module: "Projects", access: "Read Only" },
      { module: "HR", access: "Full" },
      { module: "Procurement", access: "No Access" },
      { module: "Settings", access: "No Access" },
      { module: "Reports", access: "Read/Write" },
    ],
  },
  {
    name: "Field Officer",
    description: "Record field data, beneficiary enrollment, and activity progress",
    usersAssigned: 3,
    permissions: [
      { module: "Finance", access: "No Access" },
      { module: "Budget", access: "Read Only" },
      { module: "Projects", access: "Read/Write" },
      { module: "HR", access: "Read Only" },
      { module: "Procurement", access: "Read Only" },
      { module: "Settings", access: "No Access" },
      { module: "Reports", access: "Read Only" },
    ],
  },
  {
    name: "Data Entry Operator",
    description: "Enter transactional data for finance, procurement, and HR modules",
    usersAssigned: 2,
    permissions: [
      { module: "Finance", access: "Read/Write" },
      { module: "Budget", access: "Read Only" },
      { module: "Projects", access: "Read Only" },
      { module: "HR", access: "Read/Write" },
      { module: "Procurement", access: "Read/Write" },
      { module: "Settings", access: "No Access" },
      { module: "Reports", access: "Read Only" },
    ],
  },
  {
    name: "Auditor (Read Only)",
    description: "Review all modules for audit and compliance without modification rights",
    usersAssigned: 1,
    permissions: [
      { module: "Finance", access: "Read Only" },
      { module: "Budget", access: "Read Only" },
      { module: "Projects", access: "Read Only" },
      { module: "HR", access: "Read Only" },
      { module: "Procurement", access: "Read Only" },
      { module: "Settings", access: "Read Only" },
      { module: "Reports", access: "Read Only" },
    ],
  },
  {
    name: "Branch Manager",
    description: "Manage operations for a specific regional office or branch",
    usersAssigned: 1,
    permissions: [
      { module: "Finance", access: "Read/Write" },
      { module: "Budget", access: "Read Only" },
      { module: "Projects", access: "Read/Write" },
      { module: "HR", access: "Read/Write" },
      { module: "Procurement", access: "Read/Write" },
      { module: "Settings", access: "No Access" },
      { module: "Reports", access: "Read/Write" },
    ],
  },
];

function getAccessVariant(access: string): "default" | "secondary" | "outline" | "destructive" {
  switch (access) {
    case "Full": return "default";
    case "Read/Write": return "secondary";
    case "Read Only": return "outline";
    case "No Access": return "destructive";
    default: return "outline";
  }
}

function getAccessIcon(access: string) {
  switch (access) {
    case "Full": return <Shield className="h-3 w-3" />;
    case "Read/Write": return <PenLine className="h-3 w-3" />;
    case "Read Only": return <Eye className="h-3 w-3" />;
    case "No Access": return <Trash2 className="h-3 w-3" />;
    default: return null;
  }
}

export default async function RolesPage() {
  const t = await getTranslations('settings');

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('roles.title')}
        description={t('roles.description')}
      >
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {t('roles.createRole')}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => (
          <Card key={role.name}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{role.name}</CardTitle>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>{role.usersAssigned}</span>
                </div>
              </div>
              <CardDescription>{role.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('roles.modulePermissions')}
                </p>
                <div className="space-y-1.5">
                  {role.permissions.map((perm) => (
                    <div
                      key={perm.module}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>{perm.module}</span>
                      <Badge variant={getAccessVariant(perm.access)} className="text-xs">
                        {getAccessIcon(perm.access)}
                        <span className="ml-1">{perm.access}</span>
                      </Badge>
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
