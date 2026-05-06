import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { apiBadRequest, apiCreated, apiSuccess, handleRouteError } from '@/lib/api-response'
import {
  ensureStarterRecruitmentTags,
  isRecruitmentTagType,
  normalizeRecruitmentTagName,
  upsertRecruitmentTag,
} from '@/lib/recruitment-tags'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const url = new URL(request.url)
    const type = url.searchParams.get('type')
    const q = normalizeRecruitmentTagName(url.searchParams.get('q') || '')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10) || 50, 100)

    if (!isRecruitmentTagType(type)) {
      return apiBadRequest('Valid type is required')
    }

    await ensureStarterRecruitmentTags(auth.organizationId, type)

    const tags = await prisma.recruitmentTag.findMany({
      where: {
        organizationId: auth.organizationId,
        type,
        ...(q
          ? {
              name: {
                contains: q,
                mode: 'insensitive',
              },
            }
          : {}),
      },
      orderBy: [{ usageCount: 'desc' }, { name: 'asc' }],
      take: limit,
      select: {
        id: true,
        type: true,
        name: true,
        usageCount: true,
      },
    })

    return apiSuccess(tags)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()
    const type = typeof body.type === 'string' ? body.type : null
    const name = normalizeRecruitmentTagName(typeof body.name === 'string' ? body.name : '')

    if (!isRecruitmentTagType(type)) {
      return apiBadRequest('Valid type is required')
    }
    if (!name) {
      return apiBadRequest('Tag name is required')
    }

    const tag = await upsertRecruitmentTag(auth.organizationId, type, name)

    return apiCreated(tag)
  } catch (error) {
    return handleRouteError(error)
  }
}
