import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiCreated,
  apiPaginated,
  apiBadRequest,
  handleRouteError,
  parsePaginationParams,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const url = new URL(request.url)
    const { page, limit, skip } = parsePaginationParams(url)

    const where = { organizationId: auth.organizationId }

    const [templates, total] = await Promise.all([
      prisma.payslipTemplate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payslipTemplate.count({ where }),
    ])

    return apiPaginated(templates, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const { name } = body
    if (!name || typeof name !== 'string' || !name.trim()) {
      return apiBadRequest('name is required')
    }

    // If this is being set as default, unset other defaults
    if (body.isDefault) {
      await prisma.payslipTemplate.updateMany({
        where: { organizationId: auth.organizationId, isDefault: true },
        data: { isDefault: false },
      })
    }

    const template = await prisma.payslipTemplate.create({
      data: {
        organizationId: auth.organizationId,
        name: name.trim(),
        headerText: body.headerText ?? null,
        footerText: body.footerText ?? null,
        logoPath: body.logoPath ?? null,
        showYTD: body.showYTD ?? true,
        showEmployerContributions: body.showEmployerContributions ?? false,
        showAttendanceSummary: body.showAttendanceSummary ?? true,
        showNetPayInWords: body.showNetPayInWords ?? true,
        paperSize: body.paperSize ?? 'A4',
        isDefault: body.isDefault ?? false,
        isActive: body.isActive ?? true,
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'payslip_template',
      resourceId: template.id,
      description: `Created payslip template "${name}"`,
      newValues: { name },
      ...auditCtx,
    })

    return apiCreated(template)
  } catch (error) {
    return handleRouteError(error)
  }
}
