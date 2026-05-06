import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

const EDUCATION_LEVELS: Record<string, number> = {
  'phd': 5,
  'doctorate': 5,
  'masters': 4,
  'master': 4,
  'bachelors': 3,
  'bachelor': 3,
  'diploma': 2,
  'hsc': 1,
  'ssc': 0,
}

function scoreEducation(parsed: Array<{ degree?: string }> | null, minEducation: string | null): number {
  if (!minEducation) return 100
  if (!parsed || parsed.length === 0) return 0

  const requiredLevel = EDUCATION_LEVELS[minEducation.toLowerCase()] ?? 0
  let highestLevel = 0

  for (const edu of parsed) {
    if (edu.degree) {
      const normalized = edu.degree.toLowerCase()
      for (const [key, level] of Object.entries(EDUCATION_LEVELS)) {
        if (normalized.includes(key) && level > highestLevel) {
          highestLevel = level
        }
      }
    }
  }

  if (highestLevel >= requiredLevel) return 100
  if (highestLevel === requiredLevel - 1) return 60
  return 20
}

function scoreExperience(totalYears: number | null, minExperience: number | null): number {
  if (!minExperience || minExperience === 0) return 100
  if (!totalYears || totalYears === 0) return 0

  const ratio = totalYears / minExperience
  if (ratio >= 1) return 100
  if (ratio >= 0.75) return 73
  if (ratio >= 0.5) return 50
  return 17
}

function scoreSkills(parsedSkills: string[] | null, requiredSkills: string[] | null): number {
  if (!requiredSkills || requiredSkills.length === 0) return 100
  if (!parsedSkills || parsedSkills.length === 0) return 0

  const normalizedParsed = parsedSkills.map(s => s.toLowerCase().trim())
  let matched = 0

  for (const req of requiredSkills) {
    const normalized = req.toLowerCase().trim()
    if (normalizedParsed.some(s => s.includes(normalized) || normalized.includes(s))) {
      matched++
    }
  }

  return Math.round((matched / requiredSkills.length) * 100)
}

function scoreLanguages(
  parsedLanguages: Array<{ language?: string; level?: string }> | null,
  requiredLanguages: Array<{ language?: string; level?: string }> | null
): number {
  if (!requiredLanguages || requiredLanguages.length === 0) return 100
  if (!parsedLanguages || parsedLanguages.length === 0) return 0

  const parsedMap = new Map<string, string>()
  for (const lang of parsedLanguages) {
    if (lang.language) {
      parsedMap.set(lang.language.toLowerCase(), (lang.level || '').toLowerCase())
    }
  }

  let matched = 0
  for (const req of requiredLanguages) {
    if (req.language && parsedMap.has(req.language.toLowerCase())) {
      matched++
    }
  }

  return Math.round((matched / requiredLanguages.length) * 100)
}

function scoreCertifications(parsedCerts: string[] | null, requiredCerts: string[] | null): number {
  if (!requiredCerts || requiredCerts.length === 0) return 100
  if (!parsedCerts || parsedCerts.length === 0) return 0

  const normalizedParsed = parsedCerts.map(c => c.toLowerCase().trim())
  let matched = 0

  for (const req of requiredCerts) {
    const normalized = req.toLowerCase().trim()
    if (normalizedParsed.some(c => c.includes(normalized) || normalized.includes(c))) {
      matched++
    }
  }

  return Math.round((matched / requiredCerts.length) * 100)
}

/**
 * Auto-score a job application based on the associated job posting's
 * requirements and customizable scoring weights.
 *
 * Designed to be called fire-and-forget after application creation.
 */
export async function autoScoreApplication(applicationId: string): Promise<void> {
  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: {
      jobPosting: {
        select: {
          minEducation: true,
          minExperience: true,
          requiredSkills: true,
          requiredLanguages: true,
          requiredCertifications: true,
        },
      },
    },
  })

  if (!application) return

  const job = application.jobPosting

  const educationScore = scoreEducation(
    application.parsedEducation as Array<{ degree?: string }> | null,
    job.minEducation
  )
  const experienceScore = scoreExperience(
    application.totalExperienceYears ? Number(application.totalExperienceYears) : null,
    job.minExperience
  )
  const skillsScore = scoreSkills(
    application.parsedSkills as string[] | null,
    job.requiredSkills as string[] | null
  )
  const languagesScore = scoreLanguages(
    application.parsedLanguages as Array<{ language?: string; level?: string }> | null,
    job.requiredLanguages as Array<{ language?: string; level?: string }> | null
  )
  const certificationsScore = scoreCertifications(
    application.parsedCertifications as string[] | null,
    job.requiredCertifications as string[] | null
  )

  const totalScore = Math.round(
    (educationScore + experienceScore + skillsScore + languagesScore + certificationsScore) / 5
  )

  const scoreBreakdown = {
    education: educationScore,
    experience: experienceScore,
    skills: skillsScore,
    languages: languagesScore,
    certifications: certificationsScore,
    total: totalScore,
  }

  await prisma.jobApplication.update({
    where: { id: applicationId },
    data: {
      autoScore: new Prisma.Decimal(totalScore),
      scoreBreakdown,
    },
  })
}
