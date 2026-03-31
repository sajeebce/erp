import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiSuccess,
  apiCreated,
  apiBadRequest,
  handleRouteError,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const url = new URL(request.url)
    const departmentId = url.searchParams.get('departmentId')
    const projectId = url.searchParams.get('projectId')

    // Get active employees for this org (optionally filtered by department)
    const employeeWhere: Record<string, unknown> = {
      organizationId: auth.organizationId,
      status: 'ACTIVE',
      deletedAt: null,
    }
    if (departmentId) {
      employeeWhere.departmentId = departmentId
    }

    const employees = await prisma.employee.findMany({
      where: employeeWhere,
      select: {
        id: true,
        employeeNo: true,
        fullName: true,
        department: { select: { id: true, name: true } },
        projectAllocations: {
          where: {
            isActive: true,
            ...(projectId && { projectId }),
          },
          include: {
            project: { select: { id: true, projectNo: true, name: true } },
          },
        },
      },
      orderBy: { fullName: 'asc' },
    })

    // Get all projects (for column headers)
    const projectWhere: Record<string, unknown> = {
      organizationId: auth.organizationId,
    }
    // If filtering by project, only include that project
    if (projectId) {
      projectWhere.id = projectId
    }

    const projects = await prisma.project.findMany({
      where: projectWhere,
      select: { id: true, projectNo: true, name: true },
      orderBy: { name: 'asc' },
    })

    // Collect project IDs that have at least one allocation
    const activeProjectIds = new Set<string>()
    for (const emp of employees) {
      for (const alloc of emp.projectAllocations) {
        activeProjectIds.add(alloc.projectId)
      }
    }

    // Only include projects that have allocations (unless specifically filtered)
    const relevantProjects = projectId
      ? projects
      : projects.filter((p) => activeProjectIds.has(p.id))

    // Build matrix
    const matrix = employees
      .filter((emp) => emp.projectAllocations.length > 0 || !projectId)
      .map((emp) => {
        const allocMap: Record<string, number> = {}
        let totalPct = 0

        for (const alloc of emp.projectAllocations) {
          const pct = Number(alloc.percentage)
          allocMap[alloc.projectId] = pct
          totalPct += pct
        }

        return {
          employee: {
            id: emp.id,
            employeeNo: emp.employeeNo,
            fullName: emp.fullName,
            department: emp.department?.name ?? null,
          },
          allocations: allocMap,
          totalPct: Math.round(totalPct * 100) / 100,
          unallocatedPct: Math.round((100 - totalPct) * 100) / 100,
        }
      })

    // If filtering by project, only include employees that have allocation to that project
    const filteredMatrix = projectId
      ? matrix.filter((row) => row.allocations[projectId] != null)
      : matrix

    return apiSuccess({
      projects: relevantProjects,
      employees: filteredMatrix,
      summary: {
        totalEmployees: filteredMatrix.length,
        totalProjects: relevantProjects.length,
        fullyAllocated: filteredMatrix.filter((e) => e.totalPct >= 100).length,
        partiallyAllocated: filteredMatrix.filter((e) => e.totalPct > 0 && e.totalPct < 100).length,
        unallocated: filteredMatrix.filter((e) => e.totalPct === 0).length,
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const { employeeId, projectId, percentage, startDate, endDate } = body

    if (!employeeId || !projectId || percentage == null || !startDate) {
      return apiBadRequest('employeeId, projectId, percentage, and startDate are required')
    }

    if (percentage <= 0 || percentage > 100) {
      return apiBadRequest('percentage must be between 1 and 100')
    }

    // Verify employee belongs to this organization
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: auth.organizationId },
      select: { id: true, fullName: true },
    })

    if (!employee) {
      return apiBadRequest('Employee not found')
    }

    // Verify project belongs to this organization
    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId: auth.organizationId },
      select: { id: true, name: true },
    })

    if (!project) {
      return apiBadRequest('Project not found')
    }

    const allocation = await prisma.employeeProjectAllocation.create({
      data: {
        employeeId,
        projectId,
        percentage,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        isActive: true,
      },
      include: {
        employee: { select: { id: true, fullName: true, employeeNo: true } },
        project: { select: { id: true, name: true, projectNo: true } },
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'project_allocation',
      resourceId: allocation.id,
      description: `Allocated ${employee.fullName} ${percentage}% to ${project.name}`,
      newValues: { employeeId, projectId, percentage },
      ...auditCtx,
    })

    return apiCreated(allocation)
  } catch (error) {
    return handleRouteError(error)
  }
}
