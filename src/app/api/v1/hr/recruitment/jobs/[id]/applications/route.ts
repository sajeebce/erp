import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiPaginated,
  apiNotFound,
  handleRouteError,
  parsePaginationParams,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const url = new URL(request.url)
    const pagination = parsePaginationParams(url)
    const page = pagination.page
    const limit = Math.min(500, Math.max(1, parseInt(url.searchParams.get('limit') || String(pagination.limit), 10)))
    const skip = (page - 1) * limit
    const q = url.searchParams.get('q')?.trim()
    const minScore = url.searchParams.get('minScore')
    const skills = url.searchParams
      .getAll('skills')
      .flatMap((value) => value.split(','))
      .map((skill) => skill.trim())
      .filter(Boolean)

    // Verify job posting belongs to org
    const jobPosting = await prisma.jobPosting.findFirst({
      where: { id, organizationId: auth.organizationId },
      select: { id: true },
    })

    if (!jobPosting) {
      return apiNotFound('Job posting not found')
    }

    const where: Record<string, unknown> = {
      jobPostingId: id,
      organizationId: auth.organizationId,
    }

    const status = url.searchParams.get('status')
    if (status) where.status = status
    if (q) {
      where.OR = [
        { applicantName: { contains: q, mode: 'insensitive' } },
        { applicantEmail: { contains: q, mode: 'insensitive' } },
      ]
    }
    if (minScore) {
      const score = Number(minScore)
      if (Number.isFinite(score)) {
        where.autoScore = { gte: score }
      }
    }

    const select = {
      id: true,
      applicationNo: true,
      applicantName: true,
      applicantEmail: true,
      applicantPhone: true,
      isInternal: true,
      autoScore: true,
      manualScore: true,
      finalScore: true,
      status: true,
      parsedSkills: true,
      appliedAt: true,
      totalExperienceYears: true,
      _count: { select: { interviews: true } },
    }

    if (skills.length > 0) {
      const normalizedSkills = skills.map((skill) => skill.toLowerCase())
      const matched = await prisma.jobApplication.findMany({
        where,
        select,
        orderBy: { autoScore: 'desc' },
      })
      const filtered = matched.filter((application) => {
        const applicationSkills = Array.isArray(application.parsedSkills)
          ? application.parsedSkills.map((skill) => String(skill).toLowerCase().trim())
          : []
        return normalizedSkills.every((skill) => applicationSkills.includes(skill))
      })

      return apiPaginated(filtered.slice(skip, skip + limit), filtered.length, page, limit)
    }

    const [applications, total] = await Promise.all([
      prisma.jobApplication.findMany({
        where,
        select,
        orderBy: { autoScore: 'desc' },
        skip,
        take: limit,
      }),
      prisma.jobApplication.count({ where }),
    ])

    return apiPaginated(applications, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}
