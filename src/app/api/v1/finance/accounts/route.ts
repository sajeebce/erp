import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiCreated,
  apiPaginated,
  apiBadRequest,
  apiConflict,
  handleRouteError,
  parsePaginationParams,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const url = new URL(request.url)
    const { page, limit, skip, search, sort, order } = parsePaginationParams(url)

    const where: Record<string, unknown> = {
      organizationId: auth.organizationId,
      deletedAt: null,
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ]
    }

    const type = url.searchParams.get('type')
    if (type) {
      where.type = type
    }

    const isActive = url.searchParams.get('isActive')
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const isGroup = url.searchParams.get('isGroup')
    if (isGroup !== null) {
      where.isGroup = isGroup === 'true'
    }

    const [accounts, total] = await Promise.all([
      prisma.account.findMany({
        where,
        select: {
          id: true,
          code: true,
          name: true,
          nameInBangla: true,
          type: true,
          nature: true,
          parentId: true,
          level: true,
          isGroup: true,
          description: true,
          isActive: true,
          isBankAccount: true,
          fundCode: true,
          projectId: true,
          createdAt: true,
          updatedAt: true,
          parent: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
      prisma.account.count({ where }),
    ])

    return apiPaginated(accounts, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const body = await request.json()
    const {
      code,
      name,
      type,
      nature,
      parentId,
      level,
      isGroup,
      description,
      fundCode,
      projectId,
    } = body

    if (!code || !name || !type || !nature) {
      return apiBadRequest('code, name, type, and nature are required')
    }

    const validTypes = ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE']
    if (!validTypes.includes(type)) {
      return apiBadRequest(`type must be one of: ${validTypes.join(', ')}`)
    }

    const validNatures = ['DEBIT', 'CREDIT']
    if (!validNatures.includes(nature)) {
      return apiBadRequest(`nature must be one of: ${validNatures.join(', ')}`)
    }

    // Check code uniqueness within org
    const existingAccount = await prisma.account.findUnique({
      where: {
        organizationId_code: {
          organizationId: auth.organizationId,
          code: code.trim(),
        },
      },
    })

    if (existingAccount) {
      return apiConflict(`An account with code "${code}" already exists in this organization`)
    }

    let computedLevel = level || 1

    // Validate parent if provided
    if (parentId) {
      const parent = await prisma.account.findFirst({
        where: {
          id: parentId,
          organizationId: auth.organizationId,
          deletedAt: null,
        },
      })

      if (!parent) {
        return apiBadRequest('Parent account not found in this organization')
      }

      if (!parent.isGroup) {
        return apiBadRequest('Parent account must be a group account (isGroup = true)')
      }

      computedLevel = parent.level + 1
    }

    // Validate projectId belongs to this org if provided
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          organizationId: auth.organizationId,
        },
      })

      if (!project) {
        return apiBadRequest('Invalid project ID')
      }
    }

    const account = await prisma.account.create({
      data: {
        organizationId: auth.organizationId,
        code: code.trim(),
        name: name.trim(),
        type,
        nature,
        parentId: parentId || null,
        level: computedLevel,
        isGroup: isGroup ?? false,
        description: description || null,
        fundCode: fundCode || null,
        projectId: projectId || null,
      },
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
        nature: true,
        parentId: true,
        level: true,
        isGroup: true,
        description: true,
        isActive: true,
        fundCode: true,
        projectId: true,
        createdAt: true,
        updatedAt: true,
        parent: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    })

    return apiCreated(account)
  } catch (error) {
    return handleRouteError(error)
  }
}
