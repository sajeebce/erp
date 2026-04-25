import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest, requireRoleFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiCreated,
  apiBadRequest,
  apiConflict,
  handleRouteError,
} from '@/lib/api-response'

const VALID_RESTRICTIONS = ['UNRESTRICTED', 'RESTRICTED', 'TEMPORARILY_RESTRICTED', 'ENDOWMENT']

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const isActiveParam = searchParams.get('isActive')

    const where: Record<string, unknown> = { organizationId: auth.organizationId }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (isActiveParam !== null) where.isActive = isActiveParam === 'true'

    const classes = await prisma.fundClass.findMany({
      where,
      include: { _count: { select: { journalLines: true } } },
      orderBy: { code: 'asc' },
    })

    return apiSuccess(
      classes.map(fc => ({
        id: fc.id,
        code: fc.code,
        name: fc.name,
        restriction: fc.restriction,
        localizedName: fc.localizedName,
        isActive: fc.isActive,
        journalLineCount: fc._count.journalLines,
        createdAt: fc.createdAt,
        updatedAt: fc.updatedAt,
      }))
    )
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRoleFromRequest(request, 'ADMIN')
    const body = await request.json()
    const { code, name, restriction, localizedName } = body

    if (!code || !name || !restriction) {
      return apiBadRequest('code, name, and restriction are required')
    }
    if (!VALID_RESTRICTIONS.includes(restriction)) {
      return apiBadRequest(`restriction must be one of: ${VALID_RESTRICTIONS.join(', ')}`)
    }

    const existing = await prisma.fundClass.findUnique({
      where: { organizationId_code: { organizationId: auth.organizationId, code: code.trim() } },
    })
    if (existing) return apiConflict(`Fund class code "${code}" already exists`)

    const fc = await prisma.fundClass.create({
      data: {
        organizationId: auth.organizationId,
        code: code.trim(),
        name: name.trim(),
        restriction,
        localizedName: localizedName ?? null,
        isActive: true,
      },
    })

    return apiCreated(fc)
  } catch (error) {
    return handleRouteError(error)
  }
}
