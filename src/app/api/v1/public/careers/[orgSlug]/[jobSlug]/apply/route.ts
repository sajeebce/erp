import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { apiCreated, apiBadRequest, apiNotFound, handleRouteError } from '@/lib/api-response'
import { autoScoreApplication } from '@/lib/recruitment-scoring'

function generateApplicationNo(): string {
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2)
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `APP-${year}${month}-${random}`
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; jobSlug: string }> }
) {
  try {
    const { orgSlug, jobSlug } = await params
    const body = await request.json()

    // Validate required fields
    if (!body.applicantName?.trim()) {
      return apiBadRequest('Applicant name is required')
    }
    if (!body.applicantEmail?.trim()) {
      return apiBadRequest('Applicant email is required')
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.applicantEmail)) {
      return apiBadRequest('Invalid email address')
    }

    // Find organization
    const org = await prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true },
    })
    if (!org) return apiNotFound('Organization not found')

    // Find job posting
    const job = await prisma.jobPosting.findFirst({
      where: {
        slug: jobSlug,
        organizationId: org.id,
        status: 'PUBLISHED',
      },
      select: { id: true, applicationDeadline: true },
    })
    if (!job) return apiNotFound('Job posting not found')

    // Check deadline
    if (new Date(job.applicationDeadline) < new Date()) {
      return apiBadRequest('The application deadline has passed')
    }

    // Check for duplicate application
    const existing = await prisma.jobApplication.findFirst({
      where: {
        jobPostingId: job.id,
        applicantEmail: body.applicantEmail.trim(),
      },
    })
    if (existing) {
      return apiBadRequest('You have already applied for this position')
    }

    // Create application
    const application = await prisma.jobApplication.create({
      data: {
        applicationNo: generateApplicationNo(),
        jobPostingId: job.id,
        organizationId: org.id,
        applicantName: body.applicantName.trim(),
        applicantEmail: body.applicantEmail.trim(),
        applicantPhone: body.applicantPhone?.trim() || null,
        applicantAddress: body.applicantAddress?.trim() || null,
        cvFilePath: body.cvFileName || null,
        coverLetterPath: body.coverLetterFileName || null,
        customResponses: body.customResponses || null,
        status: 'APPLIED',
      },
      select: {
        id: true,
        applicationNo: true,
        applicantName: true,
        applicantEmail: true,
        status: true,
        appliedAt: true,
      },
    })

    // Auto-trigger scoring immediately after creation
    autoScoreApplication(application.id).catch((err) => {
      console.error('Auto-score failed for public application', application.id, err)
    })

    return apiCreated(application)
  } catch (error) {
    return handleRouteError(error)
  }
}
