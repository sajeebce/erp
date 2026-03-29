import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'
import { Prisma } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const interview = await prisma.interview.findFirst({
      where: {
        id,
        application: { organizationId: auth.organizationId },
      },
      include: {
        application: {
          select: {
            id: true,
            applicationNo: true,
            applicantName: true,
            applicantEmail: true,
            jobPosting: { select: { id: true, title: true, postingNo: true } },
          },
        },
        panelMembers: {
          select: {
            id: true,
            interviewerId: true,
            role: true,
            score: true,
            feedback: true,
            submittedAt: true,
          },
        },
      },
    })

    if (!interview) {
      return apiNotFound('Interview not found')
    }

    return apiSuccess(interview)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.interview.findFirst({
      where: {
        id,
        application: { organizationId: auth.organizationId },
      },
      include: {
        application: { select: { applicationNo: true, applicantName: true } },
      },
    })
    if (!existing) {
      return apiNotFound('Interview not found')
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}

    if (body.interviewType !== undefined) data.interviewType = body.interviewType
    if (body.scheduledAt !== undefined) data.scheduledAt = new Date(body.scheduledAt)
    if (body.durationMinutes !== undefined) data.durationMinutes = body.durationMinutes
    if (body.location !== undefined) data.location = body.location || null
    if (body.isVirtual !== undefined) data.isVirtual = body.isVirtual
    if (body.meetingLink !== undefined) data.meetingLink = body.meetingLink || null
    if (body.status !== undefined) {
      data.status = body.status
      if (body.status === 'COMPLETED') {
        data.completedAt = new Date()
      }
    }
    if (body.interviewerNotes !== undefined) data.interviewerNotes = body.interviewerNotes || null
    if (body.overallRating !== undefined) data.overallRating = body.overallRating ? new Prisma.Decimal(body.overallRating) : null
    if (body.recommendation !== undefined) data.recommendation = body.recommendation || null

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    const updated = await prisma.interview.update({ where: { id }, data })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'interview',
      resourceId: id,
      description: `Updated interview for "${existing.application.applicantName}" (${existing.application.applicationNo})`,
      oldValues: { status: existing.status },
      newValues: data,
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
