import { prisma } from '@/lib/db'

export const RECRUITMENT_TAG_TYPES = ['SKILL', 'LANGUAGE', 'CERTIFICATION'] as const

export type RecruitmentTagTypeValue = (typeof RECRUITMENT_TAG_TYPES)[number]

const STARTER_TAGS: Record<RecruitmentTagTypeValue, string[]> = {
  SKILL: [
    'Project Management',
    'Monitoring & Evaluation',
    'Report Writing',
    'Microsoft Office',
    'Excel',
    'Field Survey',
    'Beneficiary Management',
    'Microfinance',
    'Loan Processing',
    'Community Mobilization',
    'Bengali Typing',
    'Bicycle Riding',
    'First Aid',
    'Counseling',
    'Donor Reporting',
    'Budget Management',
    'Procurement',
  ],
  LANGUAGE: ['Bengali', 'English', 'Hindi', 'Arabic', 'Urdu'],
  CERTIFICATION: ['PMP', 'ACCA', 'CA', 'CMA', 'NGOAB Compliance', 'IFRS', 'IPSAS'],
}

export function normalizeRecruitmentTagName(name: string): string {
  return name.trim().replace(/\s+/g, ' ')
}

export function isRecruitmentTagType(value: string | null): value is RecruitmentTagTypeValue {
  return Boolean(value && RECRUITMENT_TAG_TYPES.includes(value as RecruitmentTagTypeValue))
}

export async function ensureStarterRecruitmentTags(
  organizationId: string,
  type?: RecruitmentTagTypeValue
) {
  const types = type ? [type] : RECRUITMENT_TAG_TYPES

  for (const tagType of types) {
    const existing = await prisma.recruitmentTag.count({
      where: { organizationId, type: tagType },
    })
    if (existing > 0) continue

    await Promise.all(
      STARTER_TAGS[tagType].map((name) =>
        upsertRecruitmentTag(organizationId, tagType, name, { incrementUsage: false })
      )
    )
  }
}

export async function upsertRecruitmentTag(
  organizationId: string,
  type: RecruitmentTagTypeValue,
  rawName: string,
  options: { incrementUsage?: boolean } = {}
) {
  const name = normalizeRecruitmentTagName(rawName)
  if (!name) return null

  const incrementUsage = options.incrementUsage ?? true

  return prisma.recruitmentTag.upsert({
    where: {
      organizationId_type_nameLower: {
        organizationId,
        type,
        nameLower: name.toLowerCase(),
      },
    },
    create: {
      organizationId,
      type,
      name,
      nameLower: name.toLowerCase(),
      usageCount: incrementUsage ? 1 : 0,
    },
    update: {
      name,
      usageCount: incrementUsage ? { increment: 1 } : undefined,
    },
  })
}

export async function upsertRecruitmentTags(
  organizationId: string,
  type: RecruitmentTagTypeValue,
  names: string[]
) {
  await Promise.all(names.map((name) => upsertRecruitmentTag(organizationId, type, name)))
}
