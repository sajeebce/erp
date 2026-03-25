import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest, requireRoleFromRequest, hashPassword, validatePassword } from '@/lib/auth'
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
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const status = url.searchParams.get('status')
    if (status) {
      where.status = status
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          avatar: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          role: {
            select: {
              id: true,
              name: true,
            },
          },
          department: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    return apiPaginated(users, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRoleFromRequest(request, 'ADMIN')

    const body = await request.json()
    const { email, password, fullName, phone, roleId, departmentId } = body

    if (!email || !password || !fullName || !roleId) {
      return apiBadRequest('Email, password, fullName, and roleId are required')
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (typeof email !== 'string' || !emailRegex.test(email)) {
      return apiBadRequest('Invalid email format')
    }

    if (typeof password !== 'string') {
      return apiBadRequest('Password must be a string')
    }

    const passwordCheck = validatePassword(password)
    if (!passwordCheck.valid) {
      return apiBadRequest('Password does not meet requirements', { password: passwordCheck.errors })
    }

    if (typeof fullName !== 'string' || fullName.trim().length < 2) {
      return apiBadRequest('Full name must be at least 2 characters')
    }

    // Check email uniqueness within org
    const existingUser = await prisma.user.findUnique({
      where: {
        organizationId_email: {
          organizationId: auth.organizationId,
          email: email.toLowerCase(),
        },
      },
    })

    if (existingUser) {
      return apiConflict('A user with this email already exists in this organization')
    }

    // Verify role belongs to this org
    const role = await prisma.role.findFirst({
      where: {
        id: roleId,
        organizationId: auth.organizationId,
      },
    })

    if (!role) {
      return apiBadRequest('Invalid role ID')
    }

    // Verify department belongs to this org if provided
    if (departmentId) {
      const department = await prisma.department.findFirst({
        where: {
          id: departmentId,
          organizationId: auth.organizationId,
        },
      })

      if (!department) {
        return apiBadRequest('Invalid department ID')
      }
    }

    const passwordHash = hashPassword(password)

    const user = await prisma.user.create({
      data: {
        organizationId: auth.organizationId,
        email: email.toLowerCase(),
        passwordHash,
        fullName: fullName.trim(),
        phone: phone || null,
        roleId,
        departmentId: departmentId || null,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        status: true,
        createdAt: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return apiCreated(user)
  } catch (error) {
    return handleRouteError(error)
  }
}
