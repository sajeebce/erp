import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiSuccess,
  apiCreated,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    // Verify project belongs to org
    const project = await prisma.project.findFirst({
      where: {
        id,
        organizationId: auth.organizationId,
        deletedAt: null,
      },
      select: { id: true },
    })

    if (!project) {
      return apiNotFound('Project not found')
    }

    const teamMembers = await prisma.projectTeamMember.findMany({
      where: {
        projectId: id,
        isActive: true,
      },
      select: {
        id: true,
        role: true,
        startDate: true,
        endDate: true,
        allocation: true,
        isActive: true,
        employee: {
          select: {
            id: true,
            employeeNo: true,
            fullName: true,
            designation: {
              select: { id: true, title: true },
            },
            department: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { startDate: 'asc' },
    })

    return apiSuccess(teamMembers)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    // Verify project belongs to org
    const project = await prisma.project.findFirst({
      where: {
        id,
        organizationId: auth.organizationId,
        deletedAt: null,
      },
      select: { id: true, name: true },
    })

    if (!project) {
      return apiNotFound('Project not found')
    }

    const body = await request.json()
    const { employeeId, role, startDate, allocation } = body

    if (!employeeId || !startDate) {
      return apiBadRequest('employeeId and startDate are required')
    }

    // Validate employee belongs to org
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        organizationId: auth.organizationId,
        deletedAt: null,
      },
      select: { id: true, fullName: true },
    })

    if (!employee) {
      return apiBadRequest('Employee not found in this organization')
    }

    // Check if employee is already an active team member on this project
    const existingMember = await prisma.projectTeamMember.findFirst({
      where: {
        projectId: id,
        employeeId,
        isActive: true,
      },
    })

    if (existingMember) {
      return apiBadRequest('Employee is already an active team member on this project')
    }

    const teamMember = await prisma.projectTeamMember.create({
      data: {
        projectId: id,
        employeeId,
        role: role || null,
        startDate: new Date(startDate),
        allocation: allocation ?? 100,
      },
      select: {
        id: true,
        role: true,
        startDate: true,
        endDate: true,
        allocation: true,
        isActive: true,
        employee: {
          select: {
            id: true,
            employeeNo: true,
            fullName: true,
            designation: {
              select: { id: true, title: true },
            },
            department: {
              select: { id: true, name: true },
            },
          },
        },
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'project',
      resource: 'project_team_member',
      resourceId: teamMember.id,
      description: `Added ${employee.fullName} to project "${project.name}"`,
      newValues: { employeeId, role, allocation },
      ...auditCtx,
    })

    return apiCreated(teamMember)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    // Verify project belongs to org
    const project = await prisma.project.findFirst({
      where: {
        id,
        organizationId: auth.organizationId,
        deletedAt: null,
      },
      select: { id: true, name: true },
    })

    if (!project) {
      return apiNotFound('Project not found')
    }

    const body = await request.json()
    const { teamMemberId } = body

    if (!teamMemberId) {
      return apiBadRequest('teamMemberId is required')
    }

    const teamMember = await prisma.projectTeamMember.findFirst({
      where: {
        id: teamMemberId,
        projectId: id,
        isActive: true,
      },
      select: {
        id: true,
        employee: { select: { fullName: true } },
      },
    })

    if (!teamMember) {
      return apiNotFound('Team member not found or already inactive')
    }

    await prisma.projectTeamMember.update({
      where: { id: teamMemberId },
      data: { isActive: false, endDate: new Date() },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'project',
      resource: 'project_team_member',
      resourceId: teamMemberId,
      description: `Removed ${teamMember.employee.fullName} from project "${project.name}"`,
      oldValues: { isActive: true },
      newValues: { isActive: false },
      ...auditCtx,
    })

    return apiSuccess({ message: 'Team member removed successfully' })
  } catch (error) {
    return handleRouteError(error)
  }
}
