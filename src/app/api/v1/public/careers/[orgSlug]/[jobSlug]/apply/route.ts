import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { apiCreated, apiBadRequest, apiNotFound, handleRouteError } from '@/lib/api-response'
import { autoScoreApplication } from '@/lib/recruitment-scoring'
import { getStorageAdapter } from '@/lib/storage/storage-factory'
import { Prisma } from '@prisma/client'
import { randomUUID } from 'crypto'

interface DeclaredLanguage {
  language: string
  level: string
}

interface RawLanguage {
  language?: string
  level?: string
}

interface AddressFields {
  village?: string
  postOffice?: string
  union?: string
  thana?: string
  district?: string
}

interface EducationRecord {
  examName?: string
  passingYear?: string
  gradeGpa?: string
  institution?: string
  board?: string
}

interface EmploymentRecord {
  orgName?: string
  designation?: string
  period?: string
  lastSalary?: string
  reasonForLeaving?: string
}

interface ReferenceRecord {
  name?: string
  relationship?: string
  address?: string
  mobile?: string
}

interface EmergencyContactRecord {
  name?: string
  relationship?: string
  mobile?: string
}

interface ApplyBody {
  [key: string]: unknown
}

const ALLOWED_DOCUMENT_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024

function generateApplicationNo(): string {
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2)
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `APP-${year}${month}-${random}`
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function parseJsonField(value: FormDataEntryValue | null): unknown {
  if (typeof value !== 'string' || value.trim() === '') return undefined
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function normalizeEmail(value: unknown): string {
  return normalizeText(value).toLowerCase()
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return false

  const [localPart, domain] = email.split('@')
  if (!localPart || !domain) return false
  if (localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..')) return false
  if (domain.startsWith('.') || domain.endsWith('.') || domain.includes('..')) return false

  return true
}

function normalizeArray(value: unknown): string[] {
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return normalizeArray(parsed)
    } catch {
      return value.split(',').map((item) => item.trim()).filter(Boolean)
    }
  }
  if (!Array.isArray(value)) return []
  return value
    .map((item) => normalizeText(item))
    .filter(Boolean)
}

function normalizeLanguages(value: unknown): DeclaredLanguage[] {
  if (typeof value === 'string') {
    try {
      return normalizeLanguages(JSON.parse(value))
    } catch {
      return []
    }
  }
  if (!Array.isArray(value)) return []
  const languages: DeclaredLanguage[] = []
  for (const item of value) {
    if (!item || typeof item !== 'object') continue
    const language = normalizeText((item as RawLanguage).language)
    const level = normalizeText((item as RawLanguage).level)
    if (language) languages.push({ language, level: level || '' })
  }
  return languages
}

function assertStringSubset(
  declared: string[],
  allowed: string[] | null,
  fieldName: string
): string | null {
  const allowedSet = new Set((allowed || []).map((item) => item.toLowerCase().trim()))
  for (const item of declared) {
    if (!allowedSet.has(item.toLowerCase().trim())) {
      return `${fieldName} contains an option that is not required for this posting`
    }
  }
  return null
}

async function readApplyRequest(request: NextRequest) {
  const contentType = request.headers.get('content-type') || ''
  if (!contentType.includes('multipart/form-data')) {
    return {
      body: await request.json() as ApplyBody,
      cvFile: null,
      coverLetterFile: null,
    }
  }

  const formData = await request.formData()
  return {
    body: {
      applicantName: formData.get('applicantName'),
      applicantEmail: formData.get('applicantEmail'),
      applicantPhone: formData.get('applicantPhone'),
      applicantAddress: formData.get('applicantAddress'),
      declaredEducation: formData.get('declaredEducation'),
      declaredExperienceYears: formData.get('declaredExperienceYears'),
      declaredSkills: parseJsonField(formData.get('declaredSkills')),
      declaredLanguages: parseJsonField(formData.get('declaredLanguages')),
      declaredCertifications: parseJsonField(formData.get('declaredCertifications')),
      customResponses: parseJsonField(formData.get('customResponses')),
      // CSS Personal Info fields
      applicantNameBn: formData.get('applicantNameBn'),
      parNo: formData.get('parNo'),
      motherName: formData.get('motherName'),
      fatherSpouseName: formData.get('fatherSpouseName'),
      presentAddress: parseJsonField(formData.get('presentAddress')),
      permanentAddress: parseJsonField(formData.get('permanentAddress')),
      phoneAlt: formData.get('phoneAlt'),
      dateOfBirth: formData.get('dateOfBirth'),
      gender: formData.get('gender'),
      nationality: formData.get('nationality'),
      nidNumber: formData.get('nidNumber'),
      religion: formData.get('religion'),
      bloodGroup: formData.get('bloodGroup'),
      maritalStatus: formData.get('maritalStatus'),
      hasRelativeInOrg: formData.get('hasRelativeInOrg'),
      trainingDetails: formData.get('trainingDetails'),
      educationRecords: parseJsonField(formData.get('educationRecords')),
      previousEmployments: parseJsonField(formData.get('previousEmployments')),
      hasProfessionalLicense: formData.get('hasProfessionalLicense'),
      professionName: formData.get('professionName'),
      hasLegalCase: formData.get('hasLegalCase'),
      references: parseJsonField(formData.get('references')),
      emergencyContacts: parseJsonField(formData.get('emergencyContacts')),
    } as ApplyBody,
    cvFile: formData.get('cvFile') instanceof File ? formData.get('cvFile') as File : null,
    coverLetterFile: formData.get('coverLetterFile') instanceof File
      ? formData.get('coverLetterFile') as File
      : null,
  }
}

async function uploadApplicationDocument(
  organizationId: string,
  applicationId: string,
  file: File | null,
  label: string
) {
  if (!file || file.size === 0) return null
  if (file.size > MAX_DOCUMENT_SIZE) {
    throw new Error(`${label} file size exceeds 10MB`)
  }
  if (!ALLOWED_DOCUMENT_TYPES.has(file.type)) {
    throw new Error(`${label} must be a PDF, DOC, or DOCX file`)
  }

  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storageKey = `${organizationId}/hr/recruitment/${year}/${month}/${applicationId}/${randomUUID()}-${safeName}`
  const adapter = await getStorageAdapter()
  await adapter.upload({
    key: storageKey,
    body: Buffer.from(await file.arrayBuffer()),
    contentType: file.type || 'application/octet-stream',
  })

  return storageKey
}

function assertLanguageSubset(
  declared: DeclaredLanguage[],
  allowed: unknown
): string | null {
  const allowedItems = Array.isArray(allowed) ? allowed : []
  const allowedSet = new Set(
    allowedItems
      .map((item) => {
        if (typeof item === 'string') return normalizeText(item).toLowerCase()
        if (item && typeof item === 'object') return normalizeText((item as RawLanguage).language).toLowerCase()
        return ''
      })
      .filter(Boolean)
  )
  for (const item of declared) {
    if (!allowedSet.has(normalizeText(item.language).toLowerCase())) {
      return 'Declared languages contain an option that is not required for this posting'
    }
  }
  return null
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; jobSlug: string }> }
) {
  try {
    const { orgSlug, jobSlug } = await params
    const { body, cvFile, coverLetterFile } = await readApplyRequest(request)
    const applicantName = normalizeText(body.applicantName)
    const applicantPhone = normalizeText(body.applicantPhone)
    const applicantAddress = normalizeText(body.applicantAddress)

    // CSS Personal Info fields
    const applicantNameBn = normalizeText(body.applicantNameBn)
    const parNo = normalizeText(body.parNo)
    const motherName = normalizeText(body.motherName)
    const fatherSpouseName = normalizeText(body.fatherSpouseName)
    const presentAddress = body.presentAddress && typeof body.presentAddress === 'object'
      ? body.presentAddress as AddressFields
      : null
    const permanentAddress = body.permanentAddress && typeof body.permanentAddress === 'object'
      ? body.permanentAddress as AddressFields
      : null
    const phoneAlt = normalizeText(body.phoneAlt)
    const dateOfBirth = typeof body.dateOfBirth === 'string' && body.dateOfBirth.trim()
      ? new Date(body.dateOfBirth)
      : null
    const gender = normalizeText(body.gender)
    const nationality = normalizeText(body.nationality)
    const nidNumber = normalizeText(body.nidNumber)
    const religion = normalizeText(body.religion)
    const bloodGroup = normalizeText(body.bloodGroup)
    const maritalStatus = normalizeText(body.maritalStatus)
    const hasRelativeInOrg = body.hasRelativeInOrg === 'true' || body.hasRelativeInOrg === true
      ? true
      : body.hasRelativeInOrg === 'false' || body.hasRelativeInOrg === false
        ? false
        : null
    const trainingDetails = normalizeText(body.trainingDetails)
    const educationRecords = Array.isArray(body.educationRecords)
      ? (body.educationRecords as EducationRecord[]).filter(r => Object.values(r).some(v => v))
      : null
    const previousEmployments = Array.isArray(body.previousEmployments)
      ? (body.previousEmployments as EmploymentRecord[]).filter(r => Object.values(r).some(v => v))
      : null
    const hasProfessionalLicense = body.hasProfessionalLicense === 'true' || body.hasProfessionalLicense === true
      ? true
      : body.hasProfessionalLicense === 'false' || body.hasProfessionalLicense === false
        ? false
        : null
    const professionName = normalizeText(body.professionName)
    const hasLegalCase = body.hasLegalCase === 'true' || body.hasLegalCase === true
      ? true
      : body.hasLegalCase === 'false' || body.hasLegalCase === false
        ? false
        : null
    const references = Array.isArray(body.references)
      ? (body.references as ReferenceRecord[]).filter(r => r.name || r.mobile)
      : null
    const emergencyContacts = Array.isArray(body.emergencyContacts)
      ? (body.emergencyContacts as EmergencyContactRecord[]).filter(r => r.name || r.mobile)
      : null

    // Validate required fields
    if (!applicantName) {
      return apiBadRequest('Applicant name is required')
    }
    if (!normalizeText(body.applicantEmail)) {
      return apiBadRequest('Applicant email is required')
    }
    const applicantEmail = normalizeEmail(body.applicantEmail)

    // Validate email format
    if (!isValidEmail(applicantEmail)) {
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
      select: {
        id: true,
        applicationDeadline: true,
        minEducation: true,
        minExperience: true,
        requiredSkills: true,
        requiredLanguages: true,
        requiredCertifications: true,
      },
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
        applicantEmail: { equals: applicantEmail, mode: 'insensitive' },
      },
    })
    if (existing) {
      return apiBadRequest('You have already applied for this position')
    }

    const declaredEducation = normalizeText(body.declaredEducation)
    const declaredExperienceYears =
      body.declaredExperienceYears === null || body.declaredExperienceYears === undefined || body.declaredExperienceYears === ''
        ? null
        : Number(body.declaredExperienceYears)
    const declaredSkills = normalizeArray(body.declaredSkills)
    const declaredLanguages = normalizeLanguages(body.declaredLanguages)
    const declaredCertifications = normalizeArray(body.declaredCertifications)

    if (job.minEducation && !declaredEducation) {
      return apiBadRequest('Education declaration is required')
    }
    if (declaredExperienceYears !== null && (!Number.isFinite(declaredExperienceYears) || declaredExperienceYears < 0)) {
      return apiBadRequest('Experience years must be a valid non-negative number')
    }
    if (job.minExperience !== null && job.minExperience !== undefined && declaredExperienceYears === null) {
      return apiBadRequest('Experience declaration is required')
    }

    const skillsError = assertStringSubset(declaredSkills, job.requiredSkills as string[] | null, 'Declared skills')
    if (skillsError) return apiBadRequest(skillsError)

    const languagesError = assertLanguageSubset(
      declaredLanguages,
      job.requiredLanguages
    )
    if (languagesError) return apiBadRequest(languagesError)

    const certificationsError = assertStringSubset(
      declaredCertifications,
      job.requiredCertifications as string[] | null,
      'Declared certifications'
    )
    if (certificationsError) return apiBadRequest(certificationsError)

    // Create application
    const application = await prisma.jobApplication.create({
      data: {
        applicationNo: generateApplicationNo(),
        jobPostingId: job.id,
        organizationId: org.id,
        applicantName,
        applicantEmail,
        applicantPhone: applicantPhone || null,
        applicantAddress: applicantAddress || null,
        applicantNameBn: applicantNameBn || null,
        parNo: parNo || null,
        motherName: motherName || null,
        fatherSpouseName: fatherSpouseName || null,
        presentAddress: presentAddress ? presentAddress as Prisma.InputJsonValue : Prisma.JsonNull,
        permanentAddress: permanentAddress ? permanentAddress as Prisma.InputJsonValue : Prisma.JsonNull,
        phoneAlt: phoneAlt || null,
        dateOfBirth: dateOfBirth,
        gender: gender || null,
        nationality: nationality || null,
        nidNumber: nidNumber || null,
        religion: religion || null,
        bloodGroup: bloodGroup || null,
        maritalStatus: maritalStatus || null,
        hasRelativeInOrg: hasRelativeInOrg,
        trainingDetails: trainingDetails || null,
        educationRecords: educationRecords && educationRecords.length > 0 ? educationRecords as unknown as Prisma.InputJsonValue : Prisma.JsonNull,
        previousEmployments: previousEmployments && previousEmployments.length > 0 ? previousEmployments as unknown as Prisma.InputJsonValue : Prisma.JsonNull,
        hasProfessionalLicense: hasProfessionalLicense,
        professionName: professionName || null,
        hasLegalCase: hasLegalCase,
        references: references && references.length > 0 ? references as unknown as Prisma.InputJsonValue : Prisma.JsonNull,
        emergencyContacts: emergencyContacts && emergencyContacts.length > 0 ? emergencyContacts as unknown as Prisma.InputJsonValue : Prisma.JsonNull,
        parsedEducation: declaredEducation ? [{ degree: declaredEducation }] : Prisma.JsonNull,
        totalExperienceYears: declaredExperienceYears,
        parsedSkills: declaredSkills.length > 0 ? declaredSkills : Prisma.JsonNull,
        parsedLanguages: declaredLanguages.length > 0 ? declaredLanguages as unknown as Prisma.InputJsonValue : Prisma.JsonNull,
        parsedCertifications: declaredCertifications.length > 0 ? declaredCertifications : Prisma.JsonNull,
        customResponses: Array.isArray(body.customResponses)
          ? body.customResponses as Prisma.InputJsonValue
          : Prisma.JsonNull,
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

    const [cvFilePath, coverLetterPath] = await Promise.all([
      uploadApplicationDocument(org.id, application.id, cvFile, 'CV'),
      uploadApplicationDocument(org.id, application.id, coverLetterFile, 'Cover letter'),
    ])

    if (cvFilePath || coverLetterPath) {
      await prisma.jobApplication.update({
        where: { id: application.id },
        data: {
          cvFilePath,
          coverLetterPath,
        },
      })
    }

    // Auto-trigger scoring immediately after creation
    autoScoreApplication(application.id).catch((err) => {
      console.error('Auto-score failed for public application', application.id, err)
    })

    return apiCreated(application)
  } catch (error) {
    return handleRouteError(error)
  }
}
