/**
 * Seed: NGO Chart of Accounts
 * Creates a comprehensive chart of accounts for NGO accounting.
 * Idempotent — safe to run multiple times (uses upsert).
 *
 * Run: npx tsx prisma/seed-accounts.ts
 * Requires an existing org (shapla-foundation)
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ngo_erp?schema=public',
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE'
type AccountNature = 'DEBIT' | 'CREDIT'

interface AccountDef {
  code: string
  name: string
  bn: string
  type: AccountType
  nature: AccountNature
  level: number
  isGroup: boolean
  parentCode?: string
  isBankAccount?: boolean
  description?: string
}

// ──────────────────────────────────────────────
// Chart of Accounts definitions
// ──────────────────────────────────────────────

const accounts: AccountDef[] = [
  // ═══════════════════════════════════════════
  // ASSETS (1000–1999)
  // ═══════════════════════════════════════════
  { code: '1000', name: 'Assets', bn: 'সম্পদ', type: 'ASSET', nature: 'DEBIT', level: 1, isGroup: true },

  // -- Current Assets --
  { code: '1100', name: 'Current Assets', bn: 'চলতি সম্পদ', type: 'ASSET', nature: 'DEBIT', level: 2, isGroup: true, parentCode: '1000' },
  { code: '1101', name: 'Cash in Hand', bn: 'নগদ', type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '1100' },
  { code: '1102', name: 'Petty Cash', bn: 'খুচরা নগদ', type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '1100' },
  { code: '1110', name: 'Bank Accounts', bn: 'ব্যাংক হিসাব', type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: true, parentCode: '1100', isBankAccount: true },
  { code: '1111', name: 'NGOAB Mother Account', bn: 'এনজিওএবি মাদার অ্যাকাউন্ট', type: 'ASSET', nature: 'DEBIT', level: 4, isGroup: false, parentCode: '1110', isBankAccount: true },
  { code: '1112', name: 'Project Bank Account - USAID', bn: 'প্রকল্প ব্যাংক হিসাব - ইউএসএআইডি', type: 'ASSET', nature: 'DEBIT', level: 4, isGroup: false, parentCode: '1110', isBankAccount: true },
  { code: '1113', name: 'Project Bank Account - EU', bn: 'প্রকল্প ব্যাংক হিসাব - ইইউ', type: 'ASSET', nature: 'DEBIT', level: 4, isGroup: false, parentCode: '1110', isBankAccount: true },
  { code: '1114', name: 'FDR/Term Deposit', bn: 'এফডিআর/মেয়াদী আমানত', type: 'ASSET', nature: 'DEBIT', level: 4, isGroup: false, parentCode: '1110', isBankAccount: true },
  { code: '1120', name: 'Accounts Receivable', bn: 'প্রাপ্য হিসাব', type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '1100' },
  { code: '1130', name: 'Advances to Staff', bn: 'কর্মচারী অগ্রিম', type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '1100' },
  { code: '1140', name: 'Advances to Vendors', bn: 'সরবরাহকারী অগ্রিম', type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '1100' },
  { code: '1150', name: 'Prepaid Expenses', bn: 'অগ্রিম প্রদত্ত ব্যয়', type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '1100' },
  { code: '1160', name: 'Tax Deducted at Source', bn: 'উৎসে কর কর্তন', type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '1100' },

  // -- Fixed Assets --
  { code: '1200', name: 'Fixed Assets', bn: 'স্থায়ী সম্পদ', type: 'ASSET', nature: 'DEBIT', level: 2, isGroup: true, parentCode: '1000' },
  { code: '1201', name: 'Land & Building', bn: 'জমি ও ভবন', type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '1200' },
  { code: '1202', name: 'Furniture & Fixtures', bn: 'আসবাবপত্র ও ফিক্সচার', type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '1200' },
  { code: '1203', name: 'Office Equipment', bn: 'অফিস সরঞ্জাম', type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '1200' },
  { code: '1204', name: 'IT Equipment & Computers', bn: 'আইটি সরঞ্জাম ও কম্পিউটার', type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '1200' },
  { code: '1205', name: 'Vehicles', bn: 'যানবাহন', type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '1200' },
  { code: '1206', name: 'Field Equipment', bn: 'মাঠ সরঞ্জাম', type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '1200' },
  { code: '1209', name: 'Accumulated Depreciation', bn: 'সঞ্চিত অবচয়', type: 'ASSET', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '1200' },

  // ═══════════════════════════════════════════
  // LIABILITIES (2000–2999)
  // ═══════════════════════════════════════════
  { code: '2000', name: 'Liabilities', bn: 'দায়', type: 'LIABILITY', nature: 'CREDIT', level: 1, isGroup: true },

  // -- Current Liabilities --
  { code: '2100', name: 'Current Liabilities', bn: 'চলতি দায়', type: 'LIABILITY', nature: 'CREDIT', level: 2, isGroup: true, parentCode: '2000' },
  { code: '2101', name: 'Accounts Payable', bn: 'প্রদেয় হিসাব', type: 'LIABILITY', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '2100' },
  { code: '2102', name: 'Salary Payable', bn: 'প্রদেয় বেতন', type: 'LIABILITY', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '2100' },
  { code: '2103', name: 'Tax Payable', bn: 'প্রদেয় কর', type: 'LIABILITY', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '2100' },
  { code: '2104', name: 'VAT Payable', bn: 'প্রদেয় ভ্যাট', type: 'LIABILITY', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '2100' },
  { code: '2105', name: 'Provident Fund Payable', bn: 'প্রদেয় ভবিষ্য তহবিল', type: 'LIABILITY', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '2100' },
  { code: '2106', name: 'Gratuity Payable', bn: 'প্রদেয় আনুতোষিক', type: 'LIABILITY', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '2100' },
  { code: '2110', name: 'Advances from Donors', bn: 'দাতা অগ্রিম', type: 'LIABILITY', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '2100' },
  { code: '2120', name: 'Accrued Expenses', bn: 'জমাকৃত ব্যয়', type: 'LIABILITY', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '2100' },

  // ═══════════════════════════════════════════
  // EQUITY / FUND BALANCE (3000–3999)
  // ═══════════════════════════════════════════
  { code: '3000', name: 'Fund Balance', bn: 'তহবিল উদ্বৃত্ত', type: 'EQUITY', nature: 'CREDIT', level: 1, isGroup: true },
  { code: '3100', name: 'Unrestricted Fund', bn: 'অনিয়ন্ত্রিত তহবিল', type: 'EQUITY', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '3000' },
  { code: '3200', name: 'Restricted Fund - Donor', bn: 'নিয়ন্ত্রিত তহবিল - দাতা', type: 'EQUITY', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '3000' },
  { code: '3300', name: 'Designated Fund', bn: 'নির্ধারিত তহবিল', type: 'EQUITY', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '3000' },
  { code: '3400', name: 'Retained Surplus', bn: 'সংরক্ষিত উদ্বৃত্ত', type: 'EQUITY', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '3000' },

  // ═══════════════════════════════════════════
  // INCOME (4000–4999)
  // ═══════════════════════════════════════════
  { code: '4000', name: 'Income', bn: 'আয়', type: 'INCOME', nature: 'CREDIT', level: 1, isGroup: true },

  // -- Grant Income --
  { code: '4100', name: 'Grant Income', bn: 'অনুদান আয়', type: 'INCOME', nature: 'CREDIT', level: 2, isGroup: true, parentCode: '4000' },
  { code: '4101', name: 'USAID Grant Income', bn: 'ইউএসএআইডি অনুদান আয়', type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '4100' },
  { code: '4102', name: 'World Bank Grant Income', bn: 'বিশ্বব্যাংক অনুদান আয়', type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '4100' },
  { code: '4103', name: 'EU Grant Income', bn: 'ইইউ অনুদান আয়', type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '4100' },
  { code: '4104', name: 'UNICEF Grant Income', bn: 'ইউনিসেফ অনুদান আয়', type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '4100' },
  { code: '4105', name: 'DFID/FCDO Grant Income', bn: 'ডিএফআইডি/এফসিডিও অনুদান আয়', type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '4100' },
  { code: '4109', name: 'Other Grant Income', bn: 'অন্যান্য অনুদান আয়', type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '4100' },

  // -- Other Income categories --
  { code: '4200', name: 'Service Income', bn: 'সেবা আয়', type: 'INCOME', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '4000' },

  { code: '4300', name: 'Microfinance Income', bn: 'ক্ষুদ্রঋণ আয়', type: 'INCOME', nature: 'CREDIT', level: 2, isGroup: true, parentCode: '4000' },
  { code: '4301', name: 'Loan Interest Income', bn: 'ঋণ সুদ আয়', type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '4300' },
  { code: '4302', name: 'Service Charge Income', bn: 'সেবা চার্জ আয়', type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '4300' },

  { code: '4400', name: 'Investment Income', bn: 'বিনিয়োগ আয়', type: 'INCOME', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '4000' },
  { code: '4500', name: 'Donation Income', bn: 'দান আয়', type: 'INCOME', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '4000' },
  { code: '4600', name: 'Other Income', bn: 'অন্যান্য আয়', type: 'INCOME', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '4000' },

  // ═══════════════════════════════════════════
  // EXPENSES (5000–5999)
  // ═══════════════════════════════════════════
  { code: '5000', name: 'Expenses', bn: 'ব্যয়', type: 'EXPENSE', nature: 'DEBIT', level: 1, isGroup: true },

  // -- Personnel Costs --
  { code: '5100', name: 'Personnel Costs', bn: 'কর্মচারী ব্যয়', type: 'EXPENSE', nature: 'DEBIT', level: 2, isGroup: true, parentCode: '5000' },
  { code: '5101', name: 'Salary Expense - National Staff', bn: 'বেতন ব্যয় - জাতীয় কর্মচারী', type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '5100' },
  { code: '5102', name: 'Salary Expense - International Staff', bn: 'বেতন ব্যয় - আন্তর্জাতিক কর্মচারী', type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '5100' },
  { code: '5103', name: 'Consultancy Fees', bn: 'পরামর্শ ফি', type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '5100' },
  { code: '5104', name: 'Fringe Benefits & Allowances', bn: 'সুবিধা ও ভাতা', type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '5100' },
  { code: '5105', name: 'Staff Insurance', bn: 'কর্মচারী বীমা', type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '5100' },
  { code: '5106', name: 'Provident Fund Contribution', bn: 'ভবিষ্য তহবিল চাঁদা', type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '5100' },
  { code: '5107', name: 'Gratuity Expense', bn: 'আনুতোষিক ব্যয়', type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '5100' },
  { code: '5108', name: 'Volunteer Stipend', bn: 'স্বেচ্ছাসেবক ভাতা', type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '5100' },

  // -- Travel & Transport --
  { code: '5200', name: 'Travel & Transport', bn: 'ভ্রমণ ও পরিবহন', type: 'EXPENSE', nature: 'DEBIT', level: 2, isGroup: true, parentCode: '5000' },
  { code: '5201', name: 'International Travel', bn: 'আন্তর্জাতিক ভ্রমণ', type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '5200' },
  { code: '5202', name: 'Domestic Travel', bn: 'অভ্যন্তরীণ ভ্রমণ', type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '5200' },
  { code: '5203', name: 'Per Diem & DSA', bn: 'দৈনিক ভাতা ও ডিএসএ', type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '5200' },
  { code: '5204', name: 'Vehicle Fuel & Maintenance', bn: 'যানবাহন জ্বালানি ও রক্ষণাবেক্ষণ', type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '5200' },
  { code: '5205', name: 'Ground Transport', bn: 'স্থল পরিবহন', type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '5200' },

  // -- Training & Capacity Building --
  { code: '5300', name: 'Training & Capacity Building', bn: 'প্রশিক্ষণ ও সক্ষমতা বৃদ্ধি', type: 'EXPENSE', nature: 'DEBIT', level: 2, isGroup: true, parentCode: '5000' },
  { code: '5301', name: 'Workshop & Seminar', bn: 'কর্মশালা ও সেমিনার', type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '5300' },
  { code: '5302', name: 'Training Materials', bn: 'প্রশিক্ষণ উপকরণ', type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '5300' },
  { code: '5303', name: 'Venue & Catering', bn: 'স্থান ও খাবার', type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '5300' },
  { code: '5304', name: 'Facilitator Fees', bn: 'সহায়তাকারী ফি', type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '5300' },

  // -- Equipment & Supplies --
  { code: '5400', name: 'Equipment & Supplies', bn: 'সরঞ্জাম ও সরবরাহ', type: 'EXPENSE', nature: 'DEBIT', level: 2, isGroup: true, parentCode: '5000' },
  { code: '5401', name: 'IT Equipment Purchase', bn: 'আইটি সরঞ্জাম ক্রয়', type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '5400' },
  { code: '5402', name: 'Field Equipment Purchase', bn: 'মাঠ সরঞ্জাম ক্রয়', type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '5400' },
  { code: '5403', name: 'Office Supplies', bn: 'অফিস সরবরাহ', type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '5400' },
  { code: '5404', name: 'Program Supplies', bn: 'কর্মসূচি সরবরাহ', type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '5400' },

  // -- Administrative Expenses --
  { code: '5500', name: 'Administrative Expenses', bn: 'প্রশাসনিক ব্যয়', type: 'EXPENSE', nature: 'DEBIT', level: 2, isGroup: true, parentCode: '5000' },
  { code: '5501', name: 'Office Rent', bn: 'অফিস ভাড়া', type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '5500' },
  { code: '5502', name: 'Utilities', bn: 'ইউটিলিটি', type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '5500' },
  { code: '5503', name: 'Communications & Internet', bn: 'যোগাযোগ ও ইন্টারনেট', type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '5500' },
  { code: '5504', name: 'Bank Charges', bn: 'ব্যাংক চার্জ', type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '5500' },
  { code: '5505', name: 'Insurance', bn: 'বীমা', type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '5500' },
  { code: '5506', name: 'Audit Fees', bn: 'নিরীক্ষা ফি', type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '5500' },
  { code: '5507', name: 'Legal Services', bn: 'আইন সেবা', type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '5500' },
  { code: '5508', name: 'Printing & Publication', bn: 'মুদ্রণ ও প্রকাশনা', type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '5500' },

  // -- Program Activities --
  { code: '5600', name: 'Program Activities', bn: 'কর্মসূচি কার্যক্রম', type: 'EXPENSE', nature: 'DEBIT', level: 2, isGroup: true, parentCode: '5000' },
  { code: '5601', name: 'Community Mobilization', bn: 'সম্প্রদায় সংগঠন', type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '5600' },
  { code: '5602', name: 'Research & Survey', bn: 'গবেষণা ও জরিপ', type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '5600' },
  { code: '5603', name: 'Advocacy & Campaigns', bn: 'অ্যাডভোকেসি ও প্রচারাভিযান', type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '5600' },
  { code: '5604', name: 'Service Delivery', bn: 'সেবা প্রদান', type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '5600' },

  // -- Monitoring & Evaluation --
  { code: '5700', name: 'Monitoring & Evaluation', bn: 'পরিবীক্ষণ ও মূল্যায়ন', type: 'EXPENSE', nature: 'DEBIT', level: 2, isGroup: true, parentCode: '5000' },
  { code: '5701', name: 'M&E Staff Costs', bn: 'এমঅ্যান্ডই কর্মচারী ব্যয়', type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '5700' },
  { code: '5702', name: 'Data Collection & Surveys', bn: 'তথ্য সংগ্রহ ও জরিপ', type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '5700' },
  { code: '5703', name: 'Evaluation Studies', bn: 'মূল্যায়ন গবেষণা', type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '5700' },
  { code: '5704', name: 'Reporting & Documentation', bn: 'প্রতিবেদন ও নথিপত্র', type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '5700' },

  // -- Depreciation & Contingency --
  { code: '5800', name: 'Depreciation Expense', bn: 'অবচয় ব্যয়', type: 'EXPENSE', nature: 'DEBIT', level: 2, isGroup: false, parentCode: '5000' },
  { code: '5900', name: 'Contingency', bn: 'আকস্মিক ব্যয়', type: 'EXPENSE', nature: 'DEBIT', level: 2, isGroup: false, parentCode: '5000' },
]

// ──────────────────────────────────────────────
// Main seed function
// ──────────────────────────────────────────────

async function main() {
  console.log('=== NGO Chart of Accounts Seed ===\n')

  // Get existing organization
  const org = await prisma.organization.findUnique({ where: { slug: 'shapla-foundation' } })
  if (!org) {
    throw new Error('Organization "shapla-foundation" not found. Run the main seed first.')
  }
  console.log(`Organization: ${org.name} (${org.id})\n`)

  // Build a map of code -> created account id, so children can reference parents
  const codeToId: Record<string, string> = {}

  // Sort accounts by level to ensure parents are created before children
  const sorted = [...accounts].sort((a, b) => a.level - b.level)

  let created = 0
  let updated = 0

  for (const acct of sorted) {
    const parentId = acct.parentCode ? codeToId[acct.parentCode] : null

    if (acct.parentCode && !parentId) {
      throw new Error(`Parent code "${acct.parentCode}" not found for account "${acct.code} ${acct.name}". Check ordering.`)
    }

    const data = {
      name: acct.name,
      localizedName: { en: acct.name, bn: acct.bn },
      type: acct.type,
      nature: acct.nature,
      level: acct.level,
      isGroup: acct.isGroup,
      isActive: true,
      isBankAccount: acct.isBankAccount ?? false,
      parentId,
      description: acct.description ?? null,
    }

    const result = await prisma.account.upsert({
      where: {
        organizationId_code: {
          organizationId: org.id,
          code: acct.code,
        },
      },
      create: {
        organizationId: org.id,
        code: acct.code,
        ...data,
      },
      update: data,
    })

    codeToId[acct.code] = result.id

    // Check if this was a create or update based on timestamps
    const isNew = result.createdAt.getTime() === result.updatedAt.getTime()
    if (isNew) {
      created++
    } else {
      updated++
    }

    const indent = '  '.repeat(acct.level - 1)
    const tag = acct.isGroup ? '[GROUP]' : '[LEAF] '
    console.log(`  ${indent}${tag} ${acct.code} ${acct.name} (${acct.bn})`)
  }

  // Print summary by type
  console.log('\n--- Summary ---')
  const byType: Record<string, number> = {}
  for (const acct of accounts) {
    byType[acct.type] = (byType[acct.type] || 0) + 1
  }
  for (const [type, count] of Object.entries(byType)) {
    console.log(`  ${type}: ${count} accounts`)
  }
  console.log(`  TOTAL: ${accounts.length} accounts (${created} created, ${updated} updated)`)
  console.log('\nChart of Accounts seed complete.')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
