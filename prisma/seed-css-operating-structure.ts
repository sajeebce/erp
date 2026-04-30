/**
 * Seed: CSS Bangladesh Operating Structure
 * Seeds Sector, BusinessUnit, CostCenter, FundClass, and OperatingLocation.
 *
 * Org resolved via CSS_ORG_SLUG env var, falls back to 'cssbd' for dev.
 *
 * Run: npx tsx prisma/seed-css-operating-structure.ts
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/ngo_erp?schema=public',
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const ORG_SLUG = process.env.CSS_ORG_SLUG || 'cssbd'

// ─── Sectors ────────────────────────────────────────────────────────────────

const SECTORS = [
  {
    code: 'SEC-001',
    name: 'Health',
    localizedName: { en: 'Health', bn: 'স্বাস্থ্য' },
  },
  {
    code: 'SEC-002',
    name: 'Education',
    localizedName: { en: 'Education', bn: 'শিক্ষা' },
  },
  {
    code: 'SEC-003',
    name: 'Economic Development',
    localizedName: { en: 'Economic Development', bn: 'অর্থনৈতিক উন্নয়ন' },
  },
  {
    code: 'SEC-004',
    name: 'Enterprise Development',
    localizedName: { en: 'Enterprise Development', bn: 'উদ্যোগ উন্নয়ন' },
  },
  {
    code: 'SEC-005',
    name: 'Special Development',
    localizedName: { en: 'Special Development', bn: 'বিশেষ উন্নয়ন' },
  },
]

// ─── Business Units ──────────────────────────────────────────────────────────

// sectorCode refers to SECTORS[].code
const BUSINESS_UNITS = [
  // Health
  {
    code: 'BU-001',
    sectorCode: 'SEC-001',
    name: 'Reverend Abdul Wadud Memorial Hospital',
    shortName: 'CSS Hospital',
    localizedName: { en: 'Reverend Abdul Wadud Memorial Hospital', bn: 'রেভারেন্ড আব্দুল ওয়াদুদ স্মারক হাসপাতাল' },
  },
  {
    code: 'BU-002',
    sectorCode: 'SEC-001',
    name: 'CSS Nursing Institute',
    shortName: 'CNI',
    localizedName: { en: 'CSS Nursing Institute', bn: 'সিএসএস নার্সিং ইনস্টিটিউট' },
  },
  {
    code: 'BU-003',
    sectorCode: 'SEC-001',
    name: 'HIV/AIDS Prevention Program',
    shortName: 'HIV/AIDS Prog.',
    localizedName: { en: 'HIV/AIDS Prevention Program', bn: 'এইচআইভি/এইডস প্রতিরোধ কার্যক্রম' },
  },
  {
    code: 'BU-004',
    sectorCode: 'SEC-001',
    name: 'CSS-TLMIB Project',
    shortName: 'TLMIB',
    localizedName: { en: 'CSS-TLMIB Project', bn: 'সিএসএস-টিএলএমআইবি প্রকল্প' },
  },
  {
    code: 'BU-005',
    sectorCode: 'SEC-001',
    name: "Ma'r ANCHAL Project",
    shortName: 'ANCHAL',
    localizedName: { en: "Ma'r ANCHAL Project", bn: "মা'র আঁচল প্রকল্প" },
  },
  // Education
  {
    code: 'BU-006',
    sectorCode: 'SEC-002',
    name: 'Hope Technical Institute',
    shortName: 'HTI',
    localizedName: { en: 'Hope Technical Institute', bn: 'হোপ টেকনিক্যাল ইনস্টিটিউট' },
  },
  {
    code: 'BU-007',
    sectorCode: 'SEC-002',
    name: 'Hope Polytechnic Institute',
    shortName: 'HPI',
    localizedName: { en: 'Hope Polytechnic Institute', bn: 'হোপ পলিটেকনিক ইনস্টিটিউট' },
  },
  {
    code: 'BU-008',
    sectorCode: 'SEC-002',
    name: "Reverend Paul's High School",
    shortName: 'RPHS',
    localizedName: { en: "Reverend Paul's High School", bn: 'রেভারেন্ড পলস হাই স্কুল' },
  },
  {
    code: 'BU-009',
    sectorCode: 'SEC-002',
    name: 'Hope Non-Formal Pre-Primary School',
    shortName: 'HNFPPS',
    localizedName: { en: 'Hope Non-Formal Pre-Primary School', bn: 'হোপ নন-ফর্মাল প্রি-প্রাইমারি স্কুল' },
  },
  {
    code: 'BU-010',
    sectorCode: 'SEC-002',
    name: 'Community Based Education Program',
    shortName: 'CBEP',
    localizedName: { en: 'Community Based Education Program', bn: 'কমিউনিটি ভিত্তিক শিক্ষা কার্যক্রম' },
  },
  {
    code: 'BU-011',
    sectorCode: 'SEC-002',
    name: 'Leadership Training Program',
    shortName: 'LTP',
    localizedName: { en: 'Leadership Training Program', bn: 'নেতৃত্ব প্রশিক্ষণ কার্যক্রম' },
  },
  {
    code: 'BU-012',
    sectorCode: 'SEC-002',
    name: 'Job & Business Services',
    shortName: 'JBS',
    localizedName: { en: 'Job & Business Services', bn: 'জব ও ব্যবসায়িক সেবা' },
  },
  // Economic Development
  {
    code: 'BU-013',
    sectorCode: 'SEC-003',
    name: 'Micro Finance Program',
    shortName: 'MFP',
    localizedName: { en: 'Micro Finance Program', bn: 'ক্ষুদ্রঋণ কার্যক্রম' },
  },
  // Enterprise Development
  {
    code: 'BU-014',
    sectorCode: 'SEC-004',
    name: 'CSS AVA Center',
    shortName: 'AVA',
    localizedName: { en: 'CSS AVA Center', bn: 'সিএসএস এভা সেন্টার' },
  },
  {
    code: 'BU-015',
    sectorCode: 'SEC-004',
    name: 'CSS Press',
    shortName: 'CSS Press',
    localizedName: { en: 'CSS Press', bn: 'সিএসএস প্রেস' },
  },
  // Special Development
  {
    code: 'BU-016',
    sectorCode: 'SEC-005',
    name: 'Disaster Management & Emergency Relief',
    shortName: 'DMER',
    localizedName: { en: 'Disaster Management & Emergency Relief', bn: 'দুর্যোগ ব্যবস্থাপনা ও জরুরি ত্রাণ' },
  },
  {
    code: 'BU-017',
    sectorCode: 'SEC-005',
    name: 'WASH Program',
    shortName: 'WASH',
    localizedName: { en: 'WASH Program', bn: 'ওয়াশ কার্যক্রম' },
  },
  {
    code: 'BU-018',
    sectorCode: 'SEC-005',
    name: 'Child Care Homes / Orphanages',
    shortName: 'CCH',
    localizedName: { en: 'Child Care Homes / Orphanages', bn: 'শিশু পরিচর্যা কেন্দ্র / এতিমখানা' },
  },
  {
    code: 'BU-019',
    sectorCode: 'SEC-005',
    name: 'Child Labor & Trafficking Prevention',
    shortName: 'CLTP',
    localizedName: { en: 'Child Labor & Trafficking Prevention', bn: 'শিশুশ্রম ও পাচার প্রতিরোধ' },
  },
]

// ─── Cost Centers ────────────────────────────────────────────────────────────

// businessUnitCode refers to BUSINESS_UNITS[].code
const COST_CENTERS = [
  // Reverend Abdul Wadud Memorial Hospital (BU-001)
  { code: 'CC-OPD',     businessUnitCode: 'BU-001', name: 'OPD',                     localizedName: { en: 'OPD', bn: 'বহির্বিভাগ' },                             description: 'Out-Patient Department' },
  { code: 'CC-IPD',     businessUnitCode: 'BU-001', name: 'IPD',                     localizedName: { en: 'IPD', bn: 'অন্তর্বিভাগ' },                             description: 'In-Patient Department' },
  { code: 'CC-PHR',     businessUnitCode: 'BU-001', name: 'Pharmacy',                localizedName: { en: 'Pharmacy', bn: 'ফার্মেসি' },                           description: 'Pharmacy and drug dispensary' },
  { code: 'CC-LAB',     businessUnitCode: 'BU-001', name: 'Lab',                     localizedName: { en: 'Lab', bn: 'ল্যাব' },                                   description: 'Diagnostic laboratory services' },
  { code: 'CC-ADM',     businessUnitCode: 'BU-001', name: 'Admin',                   localizedName: { en: 'Admin', bn: 'প্রশাসন' },                               description: 'General administration and management' },
  { code: 'CC-ACC',     businessUnitCode: 'BU-001', name: 'Accounts',                localizedName: { en: 'Accounts', bn: 'হিসাব' },                              description: 'Finance and accounts department' },
  { code: 'CC-RCT',     businessUnitCode: 'BU-001', name: 'Recruitment',             localizedName: { en: 'Recruitment', bn: 'নিয়োগ' },                          description: 'HR recruitment and staffing' },
  { code: 'CC-VEH',     businessUnitCode: 'BU-001', name: 'Vehicle Cost',            localizedName: { en: 'Vehicle Cost', bn: 'যানবাহন ব্যয়' },                  description: 'Vehicle maintenance, fuel and transport' },
  { code: 'CC-UTL',     businessUnitCode: 'BU-001', name: 'Utilities & Maintenance', localizedName: { en: 'Utilities & Maintenance', bn: 'ইউটিলিটি ও রক্ষণাবেক্ষণ' }, description: 'Utilities, electricity, water, repair & maintenance' },
  // CSS Nursing Institute (BU-002)
  { code: 'CC-TRN',     businessUnitCode: 'BU-002', name: 'Training',                localizedName: { en: 'Training', bn: 'প্রশিক্ষণ' },                         description: 'Nursing training and clinical education programs' },
  { code: 'CC-CNI-ADM', businessUnitCode: 'BU-002', name: 'Admin',                   localizedName: { en: 'Admin', bn: 'প্রশাসন' },                               description: 'Institute administration' },
  // HIV/AIDS Prevention Program (BU-003)
  { code: 'CC-HIV-FLD', businessUnitCode: 'BU-003', name: 'Field Operations',        localizedName: { en: 'Field Operations', bn: 'মাঠ কার্যক্রম' },              description: 'Field outreach and drop-in center operations' },
  // Hope Technical Institute (BU-006)
  { code: 'CC-HTI-TRN', businessUnitCode: 'BU-006', name: 'Training',                localizedName: { en: 'Training', bn: 'প্রশিক্ষণ' },                         description: 'Vocational and technical training programs' },
  { code: 'CC-HTI-ADM', businessUnitCode: 'BU-006', name: 'Admin',                   localizedName: { en: 'Admin', bn: 'প্রশাসন' },                               description: 'Institute administration and management' },
  // Hope Polytechnic Institute (BU-007)
  { code: 'CC-HPI-TRN', businessUnitCode: 'BU-007', name: 'Training',                localizedName: { en: 'Training', bn: 'প্রশিক্ষণ' },                         description: 'Diploma engineering and polytechnic programs' },
  { code: 'CC-HPI-ADM', businessUnitCode: 'BU-007', name: 'Admin',                   localizedName: { en: 'Admin', bn: 'প্রশাসন' },                               description: 'Institute administration and management' },
  // Micro Finance Program (BU-013)
  { code: 'CC-MFP-FOP', businessUnitCode: 'BU-013', name: 'Field Operations',        localizedName: { en: 'Field Operations', bn: 'মাঠ কার্যক্রম' },              description: 'Branch-level loan disbursement and collection' },
  { code: 'CC-MFP-CRD', businessUnitCode: 'BU-013', name: 'Credit Operations',       localizedName: { en: 'Credit Operations', bn: 'ঋণ পরিচালনা' },               description: 'Loan appraisal, approval and credit risk' },
  { code: 'CC-MFP-SAV', businessUnitCode: 'BU-013', name: 'Savings',                 localizedName: { en: 'Savings', bn: 'সঞ্চয়' },                               description: 'Member savings collection and management' },
  { code: 'CC-MFP-ADM', businessUnitCode: 'BU-013', name: 'Admin',                   localizedName: { en: 'Admin', bn: 'প্রশাসন' },                               description: 'Program administration and head office' },
  // CSS AVA Center (BU-014)
  { code: 'CC-AVA-CNF', businessUnitCode: 'BU-014', name: 'Conference Services',     localizedName: { en: 'Conference Services', bn: 'সম্মেলন সেবা' },            description: 'Conference hall and training room operations' },
  { code: 'CC-AVA-ACC', businessUnitCode: 'BU-014', name: 'Accommodation',           localizedName: { en: 'Accommodation', bn: 'আবাসন' },                         description: 'Guest house and residential services' },
  { code: 'CC-AVA-SWL', businessUnitCode: 'BU-014', name: 'Social Welfare',          localizedName: { en: 'Social Welfare', bn: 'সমাজকল্যাণ' },                   description: 'Community outreach and social welfare programs' },
  // CSS Press (BU-015)
  { code: 'CC-PRS-PRD', businessUnitCode: 'BU-015', name: 'Production',              localizedName: { en: 'Production', bn: 'উৎপাদন' },                           description: 'Printing and production operations' },
  { code: 'CC-PRS-DSG', businessUnitCode: 'BU-015', name: 'Graphic Design',          localizedName: { en: 'Graphic Design', bn: 'গ্রাফিক ডিজাইন' },              description: 'Graphic design and pre-press services' },
  // Disaster Management (BU-016)
  { code: 'CC-DIS-REL', businessUnitCode: 'BU-016', name: 'Relief & Response',       localizedName: { en: 'Relief & Response', bn: 'ত্রাণ ও সাড়া' },              description: 'Emergency response and disaster relief operations' },
  // WASH Program (BU-017)
  { code: 'CC-WSH-OPS', businessUnitCode: 'BU-017', name: 'WASH Operations',         localizedName: { en: 'WASH Operations', bn: 'ওয়াশ পরিচালনা' },              description: 'Water, sanitation and hygiene field operations' },
  // Child Care Homes (BU-018)
  { code: 'CC-CCH-OPS', businessUnitCode: 'BU-018', name: 'Care Operations',         localizedName: { en: 'Care Operations', bn: 'পরিচর্যা পরিচালনা' },           description: 'Child residential care and welfare services' },
  // Child Labor & Trafficking Prevention (BU-019)
  { code: 'CC-CLP-FLD', businessUnitCode: 'BU-019', name: 'Field Operations',        localizedName: { en: 'Field Operations', bn: 'মাঠ কার্যক্রম' },              description: 'Community-level prevention and rescue operations' },
]

// ─── Fund Classes ────────────────────────────────────────────────────────────

const FUND_CLASSES = [
  {
    code: 'FC-UNR',
    name: 'Unrestricted',
    restriction: 'UNRESTRICTED',
    localizedName: { en: 'Unrestricted', bn: 'অসীমাবদ্ধ' },
  },
  {
    code: 'FC-RES',
    name: 'Restricted',
    restriction: 'RESTRICTED',
    localizedName: { en: 'Restricted', bn: 'সীমাবদ্ধ' },
  },
  {
    code: 'FC-TMP',
    name: 'Temporarily Restricted',
    restriction: 'TEMPORARILY_RESTRICTED',
    localizedName: { en: 'Temporarily Restricted', bn: 'সাময়িকভাবে সীমাবদ্ধ' },
  },
  {
    code: 'FC-END',
    name: 'Endowment',
    restriction: 'ENDOWMENT',
    localizedName: { en: 'Endowment', bn: 'এন্ডাউমেন্ট' },
  },
]

// ─── Operating Locations ─────────────────────────────────────────────────────

// businessUnitCode is optional; null means org-level location
const OPERATING_LOCATIONS = [
  {
    code: 'LOC-001',
    name: 'Khulna Head Office',
    businessUnitCode: null,
    address: 'CSS Head Office, Khulna, Bangladesh',
    localizedName: { en: 'Khulna Head Office', bn: 'খুলনা প্রধান কার্যালয়' },
  },
  {
    code: 'LOC-002',
    name: 'Hospital Campus',
    businessUnitCode: 'BU-001',
    address: 'Hospital Road, Khulna',
    localizedName: { en: 'Hospital Campus', bn: 'হাসপাতাল ক্যাম্পাস' },
  },
  {
    code: 'LOC-003',
    name: 'MFP Branch 001',
    businessUnitCode: 'BU-013',
    address: 'Batiaghata, Khulna',
    localizedName: { en: 'MFP Branch 001', bn: 'এমএফপি শাখা ০০১' },
  },
  {
    code: 'LOC-004',
    name: 'MFP Branch 002',
    businessUnitCode: 'BU-013',
    address: 'Dakop, Khulna',
    localizedName: { en: 'MFP Branch 002', bn: 'এমএফপি শাখা ০০২' },
  },
]

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== CSS Bangladesh Operating Structure Seed ===\n')

  const org = await prisma.organization.findUnique({ where: { slug: ORG_SLUG } })
  if (!org) {
    throw new Error(`Organization "${ORG_SLUG}" not found. Run seed-bootstrap.ts first. Set CSS_ORG_SLUG env var to override.`)
  }
  console.log(`Organization: ${org.name} (${org.id})\n`)

  // 1. Sectors
  console.log('--- Sectors ---')
  const sectorMap: Record<string, string> = {}
  for (const s of SECTORS) {
    const result = await prisma.sector.upsert({
      where: { organizationId_code: { organizationId: org.id, code: s.code } },
      create: { organizationId: org.id, code: s.code, name: s.name, localizedName: s.localizedName, isActive: true },
      update: { name: s.name, localizedName: s.localizedName },
    })
    sectorMap[s.code] = result.id
    console.log(`  [SEC] ${s.code}  ${s.name}`)
  }

  // 2. Business Units
  console.log('\n--- Business Units ---')
  const buMap: Record<string, string> = {}
  for (const bu of BUSINESS_UNITS) {
    const sectorId = sectorMap[bu.sectorCode]
    if (!sectorId) throw new Error(`Sector "${bu.sectorCode}" not found for BU "${bu.code}"`)
    const result = await prisma.businessUnit.upsert({
      where: { organizationId_code: { organizationId: org.id, code: bu.code } },
      create: { organizationId: org.id, sectorId, code: bu.code, name: bu.name, shortName: bu.shortName, localizedName: bu.localizedName, isActive: true },
      update: { sectorId, name: bu.name, shortName: bu.shortName, localizedName: bu.localizedName },
    })
    buMap[bu.code] = result.id
    console.log(`  [BU]  ${bu.code}  ${bu.shortName || bu.name}`)
  }

  // 3. Cost Centers
  console.log('\n--- Cost Centers ---')
  for (const cc of COST_CENTERS) {
    const businessUnitId = buMap[cc.businessUnitCode]
    if (!businessUnitId) throw new Error(`BusinessUnit "${cc.businessUnitCode}" not found for CC "${cc.code}"`)
    await prisma.costCenter.upsert({
      where: { organizationId_code: { organizationId: org.id, code: cc.code } },
      create: { organizationId: org.id, businessUnitId, code: cc.code, name: cc.name, localizedName: cc.localizedName, description: cc.description, isActive: true },
      update: { businessUnitId, name: cc.name, localizedName: cc.localizedName, description: cc.description },
    })
    console.log(`  [CC]  ${cc.code}  ${cc.name}  (${cc.businessUnitCode})`)
  }

  // 4. Fund Classes
  console.log('\n--- Fund Classes ---')
  for (const fc of FUND_CLASSES) {
    await prisma.fundClass.upsert({
      where: { organizationId_code: { organizationId: org.id, code: fc.code } },
      create: { organizationId: org.id, code: fc.code, name: fc.name, restriction: fc.restriction, localizedName: fc.localizedName, isActive: true },
      update: { name: fc.name, restriction: fc.restriction, localizedName: fc.localizedName },
    })
    console.log(`  [FC]  ${fc.code}  ${fc.name}`)
  }

  // 5. Operating Locations
  console.log('\n--- Operating Locations ---')
  for (const loc of OPERATING_LOCATIONS) {
    const businessUnitId = loc.businessUnitCode ? buMap[loc.businessUnitCode] ?? null : null
    await prisma.operatingLocation.upsert({
      where: { organizationId_code: { organizationId: org.id, code: loc.code } },
      create: { organizationId: org.id, businessUnitId, code: loc.code, name: loc.name, address: loc.address, localizedName: loc.localizedName, isActive: true },
      update: { businessUnitId, name: loc.name, address: loc.address, localizedName: loc.localizedName },
    })
    console.log(`  [LOC] ${loc.code}  ${loc.name}`)
  }

  // Summary
  const [sCount, buCount, ccCount, fcCount, locCount] = await Promise.all([
    prisma.sector.count({ where: { organizationId: org.id } }),
    prisma.businessUnit.count({ where: { organizationId: org.id } }),
    prisma.costCenter.count({ where: { organizationId: org.id } }),
    prisma.fundClass.count({ where: { organizationId: org.id } }),
    prisma.operatingLocation.count({ where: { organizationId: org.id } }),
  ])

  console.log('\n─── Summary ───────────────────────────')
  console.log(`  Sectors:            ${sCount}`)
  console.log(`  Business Units:     ${buCount}`)
  console.log(`  Cost Centers:       ${ccCount}`)
  console.log(`  Fund Classes:       ${fcCount}`)
  console.log(`  Operating Locations: ${locCount}`)
  console.log('\nCSS operating structure seed complete.')
}

main()
  .catch(e => { console.error('Seed failed:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect(); await pool.end() })
