import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/db';
import { getOrganizationId } from '@/lib/auth';
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
import { Plus, GitBranch, CheckCircle, XCircle } from "lucide-react";

export default async function WorkflowsPage() {
  const t = await getTranslations('settings');
  const organizationId = await getOrganizationId();
  const workflowDefs = await prisma.approvalWorkflowDef.findMany({
    where: { organizationId },
    include: {
      steps: {
        orderBy: { stepNumber: 'asc' },
      },
    },
    orderBy: [{ module: 'asc' }, { name: 'asc' }],
  });
  const roles = await prisma.role.findMany({
    where: {
      organizationId,
      id: { in: workflowDefs.flatMap((workflow) => workflow.steps.map((step) => step.roleId)) },
    },
    select: { id: true, name: true },
  });
  const roleNameById = new Map(roles.map((role) => [role.id, role.name]));
  const workflows = workflowDefs.map((workflow) => ({
    id: workflow.id,
    name: workflow.name,
    module: workflow.module,
    trigger: workflow.entityType,
    approvalSteps: workflow.steps.map((step) => roleNameById.get(step.roleId) || step.name),
    status: workflow.isActive ? "Active" : "Inactive",
  }));
  const totalWorkflows = workflows.length;
  const activeWorkflows = workflows.filter((w) => w.status === "Active").length;
  const inactiveWorkflows = workflows.filter((w) => w.status === "Inactive").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('workflows.title')}
        description={t('workflows.description')}
      >
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {t('workflows.createWorkflow')}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('workflows.totalWorkflows')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{totalWorkflows}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('workflows.active')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <p className="text-2xl font-bold">{activeWorkflows}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('workflows.inactive')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <p className="text-2xl font-bold">{inactiveWorkflows}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('workflows.workflowConfig')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('workflows.workflowName')}</TableHead>
                <TableHead>{t('workflows.module')}</TableHead>
                <TableHead>{t('workflows.trigger')}</TableHead>
                <TableHead>{t('workflows.approvalSteps')}</TableHead>
                <TableHead>{t('workflows.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workflows.map((workflow) => (
                <TableRow key={workflow.id}>
                  <TableCell className="font-medium">{workflow.name}</TableCell>
                  <TableCell className="text-sm">
                    <Badge variant="outline">{workflow.module}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px]">
                    {workflow.trigger}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {workflow.approvalSteps.map((step, index) => (
                        <Badge key={step} variant="secondary" className="text-xs">
                          {index + 1}. {step}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={workflow.status === "Active" ? "default" : "secondary"}>
                      {workflow.status}
                    </Badge>
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
