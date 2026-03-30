import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ employeeId: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { employeeId } = await params

    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        organizationId: auth.organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
        employeeNo: true,
        fullName: true,
        joiningDate: true,
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, title: true } },
      },
    })

    if (!employee) {
      return apiNotFound('Employee not found')
    }

    const progress = await prisma.onboardingProgress.findMany({
      where: { employeeId },
      include: {
        checklist: {
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
            isRequired: true,
            requiresDocument: true,
            documentType: true,
            sortOrder: true,
          },
        },
      },
      orderBy: { checklist: { sortOrder: 'asc' } },
    })

    const tasks = progress.map((p) => ({
      progressId: p.id,
      checklistId: p.checklistId,
      name: p.checklist.name,
      description: p.checklist.description,
      category: p.checklist.category,
      isRequired: p.checklist.isRequired,
      requiresDocument: p.checklist.requiresDocument,
      documentType: p.checklist.documentType,
      sortOrder: p.checklist.sortOrder,
      isCompleted: p.isCompleted,
      completedAt: p.completedAt,
      completedById: p.completedById,
      notes: p.notes,
      documentId: p.documentId,
    }))

    const totalTasks = tasks.length
    const completedTasks = tasks.filter((t) => t.isCompleted).length
    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    return apiSuccess({
      employee,
      totalTasks,
      completedTasks,
      percentage,
      tasks,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
