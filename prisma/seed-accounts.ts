/**
 * Seed: CSS Bangladesh Chart of Accounts
 * Source: docs/data/CSS_COA.docx + docs/data/For Sub-Sub Code.xlsx
 *
 * Structure:
 *   101000  Capital Fund                (EQUITY)
 *   201000  Current Liabilities         (LIABILITY)
 *   300000  Current Assets              (ASSET) — synthetic root
 *     303000  Cash in Hand
 *     304000  Cash at Bank              (program-wise)
 *     305000  Investment
 *     306000  Loan & Advances
 *     307000  Micro Credit Loan
 *     308000  Inter Project Loan
 *     309000  Closing Stock
 *   401000  Fixed Assets                (ASSET)
 *   500000  Income                      (INCOME) — synthetic root
 *     501000  General Income
 *     502000  Income From Microcredit
 *     503000  Income from Health
 *     504000  Income from Education Home, HTI & HPI
 *     505000  Income from Fish & Agri
 *     506000  Income from Training
 *     507000  Income from CSS Ava Center
 *     508000  Income from CSS Printing Press
 *     509000  Income from Nursing Institute
 *   600000  Expenses                    (EXPENSE) — synthetic root
 *     601000  Personal Cost
 *     602000  Vehicle Cost
 *     603000  Utilities & Maintenance
 *     604000  Office Running Cost
 *     605000  CSS Ava Center Expenses
 *     606000  Credit Expense
 *     607000  Education Expenses
 *     608000  Health Expenses
 *     609000  Agri & Fish Expenses
 *     610000  Other Expenses
 *     611000  Admin Overhead
 *     612000  Water Plant Expenses
 *     613000  HRM Expenses
 *     614000  Printing Press Expenses
 *   701000  Accumulated Depreciation    (ASSET, CREDIT nature)
 *
 * Run: npx tsx prisma/seed-accounts.ts
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

// Org resolved via CSS_ORG_SLUG env var, falls back to 'shapla-foundation' for dev.
const CSS_ORG_SLUG = process.env.CSS_ORG_SLUG || 'shapla-foundation'

const pool = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/ngo_erp?schema=public',
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

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

const accounts: AccountDef[] = [

  // ═══════════════════════════════════════════════════════
  // EQUITY — CAPITAL FUND (10)
  // ═══════════════════════════════════════════════════════
  { code: '101000', name: 'Capital Fund',        bn: 'মূলধন তহবিল',         type: 'EQUITY', nature: 'CREDIT', level: 1, isGroup: true },
  { code: '101001', name: 'Fund',                bn: 'তহবিল',                type: 'EQUITY', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '101000' },
  { code: '101002', name: 'Foreign Donation',    bn: 'বৈদেশিক অনুদান',       type: 'EQUITY', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '101000' },
  { code: '101003', name: 'Local Donation',      bn: 'স্থানীয় অনুদান',       type: 'EQUITY', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '101000' },
  { code: '101004', name: 'Reserve Fund',        bn: 'সংরক্ষিত তহবিল',       type: 'EQUITY', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '101000' },
  { code: '101005', name: 'Grant',               bn: 'অনুদান',               type: 'EQUITY', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '101000' },

  // ═══════════════════════════════════════════════════════
  // LIABILITIES — CURRENT LIABILITIES (20)
  // ═══════════════════════════════════════════════════════
  { code: '201000', name: 'Current Liabilities',                      bn: 'চলতি দায়',                        type: 'LIABILITY', nature: 'CREDIT', level: 1, isGroup: true },
  { code: '201001', name: 'Staff Security',                           bn: 'কর্মচারী জামানত',                  type: 'LIABILITY', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '201000' },
  { code: '201002', name: 'Bills Payable',                            bn: 'প্রদেয় বিল',                       type: 'LIABILITY', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '201000' },
  { code: '201003', name: 'Salary Deduction',                         bn: 'বেতন কর্তন',                       type: 'LIABILITY', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '201000' },
  { code: '201004', name: 'Deposit from Suppliers',                   bn: 'সরবরাহকারী জমা',                   type: 'LIABILITY', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '201000' },
  { code: '201005', name: 'Members Welfare Fund',                     bn: 'সদস্য কল্যাণ তহবিল',              type: 'LIABILITY', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '201000' },
  { code: '201006', name: 'Security Deposit',                         bn: 'নিরাপত্তা জমা',                    type: 'LIABILITY', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '201000' },
  { code: '201007', name: 'Advance for Spectacle Sale',               bn: 'চশমা বিক্রয় অগ্রিম',              type: 'LIABILITY', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '201000' },
  { code: '201008', name: 'Advance Collection (Income Tax)',          bn: 'আয়কর অগ্রিম সংগ্রহ',              type: 'LIABILITY', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '201000' },
  { code: '201009', name: 'Provision for Security Fund (Member)',     bn: 'সদস্য নিরাপত্তা তহবিল সংস্থান',   type: 'LIABILITY', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '201000' },
  { code: '201010', name: 'Collection Against VAT',                   bn: 'ভ্যাট বাবদ সংগ্রহ',                type: 'LIABILITY', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '201000' },
  { code: '201011', name: 'Fund Against Orphan',                      bn: 'এতিম তহবিল',                       type: 'LIABILITY', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '201000' },
  { code: '201012', name: 'Savings',                                  bn: 'সঞ্চয়',                            type: 'LIABILITY', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '201000' },
  { code: '201013', name: 'Loan with CSS Head Office',                bn: 'CSS প্রধান অফিস ঋণ',               type: 'LIABILITY', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '201000' },
  { code: '201014', name: 'Loan Loss Provision',                      bn: 'ঋণ ক্ষতি সংস্থান',                 type: 'LIABILITY', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '201000' },
  { code: '201015', name: 'Loan with Shanti Trust',                   bn: 'শান্তি ট্রাস্ট ঋণ',                type: 'LIABILITY', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '201000' },
  { code: '201016', name: 'Sundry Creditor',                          bn: 'বিবিধ পাওনাদার',                   type: 'LIABILITY', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '201000' },
  { code: '201017', name: 'Provision for Social Welfare',             bn: 'সামাজিক কল্যাণ সংস্থান',          type: 'LIABILITY', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '201000' },
  { code: '201018', name: 'Security Money (MED & W/B)',               bn: 'নিরাপত্তা অর্থ (MED & W/B)',       type: 'LIABILITY', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '201000' },
  { code: '201019', name: 'Suspense A/C',                             bn: 'সাসপেন্স হিসাব',                   type: 'LIABILITY', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '201000' },
  { code: '201020', name: 'Bank Loan',                                bn: 'ব্যাংক ঋণ',                         type: 'LIABILITY', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '201000' },
  { code: '201036', name: 'EFSF',                                     bn: 'ইএফএসএফ',                          type: 'LIABILITY', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '201000' },
  { code: '201037', name: 'Provision for Expense',                    bn: 'ব্যয় সংস্থান',                     type: 'LIABILITY', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '201000' },
  { code: '201038', name: 'Advance from Client',                      bn: 'ক্লায়েন্ট অগ্রিম',                 type: 'LIABILITY', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '201000' },
  { code: '201039', name: 'Fund from LTP-Alumni Association',         bn: 'এলটিপি অ্যালামনাই তহবিল',         type: 'LIABILITY', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '201000' },
  { code: '201040', name: 'Unearned Income',                          bn: 'অর্জিত হয়নি এমন আয়',              type: 'LIABILITY', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '201000' },
  { code: '201041', name: 'Red Crescent Society Fund',                bn: 'রেড ক্রিসেন্ট তহবিল',              type: 'LIABILITY', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '201000' },
  { code: '201042', name: 'Loan from KarmyKallyanSomity',             bn: 'কর্মকল্যাণ সমিতি ঋণ',              type: 'LIABILITY', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '201000' },
  { code: '201043', name: 'Loan from Education Fund',                 bn: 'শিক্ষা তহবিল ঋণ',                  type: 'LIABILITY', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '201000' },

  // ═══════════════════════════════════════════════════════
  // CURRENT ASSETS (30) — synthetic root 300000
  // ═══════════════════════════════════════════════════════
  { code: '300000', name: 'Current Assets', bn: 'চলতি সম্পদ', type: 'ASSET', nature: 'DEBIT', level: 1, isGroup: true },

  // Cash in Hand
  { code: '303000', name: 'Cash in Hand',    bn: 'হাতে নগদ',    type: 'ASSET', nature: 'DEBIT', level: 2, isGroup: true,  parentCode: '300000' },
  { code: '303001', name: 'Cash in Hand',    bn: 'হাতে নগদ',    type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '303000' },

  // Cash at Bank — program-wise
  { code: '304000', name: 'Cash at Bank',                                     bn: 'ব্যাংকে নগদ',                          type: 'ASSET', nature: 'DEBIT', level: 2, isGroup: true,  parentCode: '300000', isBankAccount: true },
  { code: '304001', name: 'Cash at Bank Head Office',                         bn: 'প্রধান অফিস ব্যাংক হিসাব',             type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '304000', isBankAccount: true },
  { code: '304002', name: 'Cash at Bank Health Program',                      bn: 'স্বাস্থ্য কার্যক্রম ব্যাংক হিসাব',     type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '304000', isBankAccount: true },
  { code: '304003', name: 'Cash at Bank Education Program (Gollamary HOB)',   bn: 'শিক্ষা কার্যক্রম ব্যাংক (গলামারি)',    type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '304000', isBankAccount: true },
  { code: '304004', name: 'Cash at Bank Education Program (Gollamary HTI)',   bn: 'এইচটিআই ব্যাংক হিসাব (গলামারি)',      type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '304000', isBankAccount: true },
  { code: '304005', name: 'Cash at Bank Education Program (Batiaghata HOB)', bn: 'শিক্ষা কার্যক্রম ব্যাংক (বাটিয়াঘাটা)', type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '304000', isBankAccount: true },
  { code: '304006', name: 'Cash at Bank Education Program (Dacop HOB)',       bn: 'শিক্ষা কার্যক্রম ব্যাংক (দাকোপ)',      type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '304000', isBankAccount: true },
  { code: '304007', name: 'Cash at Bank Education Program (Gazipur HOB)',     bn: 'শিক্ষা কার্যক্রম ব্যাংক (গাজীপুর)',    type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '304000', isBankAccount: true },
  { code: '304008', name: 'Cash at Bank CSS Ava Center',                      bn: 'CSS AVA সেন্টার ব্যাংক হিসাব',         type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '304000', isBankAccount: true },
  { code: '304009', name: 'Cash at Bank EDS',                                 bn: 'EDS ব্যাংক হিসাব',                      type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '304000', isBankAccount: true },
  { code: '304010', name: 'Cash at Bank Fish Batiaghata',                     bn: 'মৎস্য ব্যাংক হিসাব (বাটিয়াঘাটা)',     type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '304000', isBankAccount: true },
  { code: '304011', name: 'Cash at Bank ICE Plant',                           bn: 'আইস প্লান্ট ব্যাংক হিসাব',             type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '304000', isBankAccount: true },
  { code: '304012', name: 'Cash at Bank New Batiaghata',                      bn: 'নতুন বাটিয়াঘাটা ব্যাংক হিসাব',        type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '304000', isBankAccount: true },
  { code: '304013', name: 'Cash at Bank HARVEST',                             bn: 'HARVEST ব্যাংক হিসাব',                 type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '304000', isBankAccount: true },
  { code: '304014', name: 'Cash at Bank RPSC',                                bn: 'RPSC ব্যাংক হিসাব',                    type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '304000', isBankAccount: true },

  // Investment
  { code: '305000', name: 'Investment',         bn: 'বিনিয়োগ',              type: 'ASSET', nature: 'DEBIT', level: 2, isGroup: true,  parentCode: '300000' },
  { code: '305101', name: 'Investment (FDR)',   bn: 'এফডিআর বিনিয়োগ',      type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '305000' },
  { code: '305102', name: 'Double Scheme',      bn: 'ডাবল স্কিম',            type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '305000' },

  // Loan & Advances
  { code: '306000', name: 'Loan & Advances',                   bn: 'ঋণ ও অগ্রিম',                     type: 'ASSET', nature: 'DEBIT', level: 2, isGroup: true,  parentCode: '300000' },
  { code: '306001', name: 'Advance to Staff',                  bn: 'কর্মচারী অগ্রিম',                  type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '306000' },
  { code: '306002', name: 'Advance to Others',                 bn: 'অন্যদের অগ্রিম',                   type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '306000' },
  { code: '306003', name: 'Security Deposit',                  bn: 'নিরাপত্তা জমা',                     type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '306000' },
  { code: '306004', name: 'Bills Receivable',                  bn: 'প্রাপ্য বিল',                       type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '306000' },
  { code: '306005', name: 'Advance Tax',                       bn: 'অগ্রিম কর',                         type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '306000' },
  { code: '306006', name: 'Loan to Staff (Motorcycle)',        bn: 'কর্মচারী ঋণ (মোটরসাইকেল)',         type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '306000' },
  { code: '306007', name: 'Loan to Staff (Bicycle)',           bn: 'কর্মচারী ঋণ (সাইকেল)',              type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '306000' },
  { code: '306008', name: 'Loan to Staff (Mobile Loan)',       bn: 'কর্মচারী ঋণ (মোবাইল)',              type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '306000' },
  { code: '306009', name: 'Loan to Staff (Umbrella Loan)',     bn: 'কর্মচারী ঋণ (ছাতা)',                type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '306000' },
  { code: '306010', name: 'Loan to Others',                    bn: 'অন্যদের ঋণ',                        type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '306000' },
  { code: '306011', name: 'Loan with CSS HO',                  bn: 'CSS প্রধান অফিস ঋণ',                type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '306000' },
  { code: '306012', name: 'Work in Process',                   bn: 'চলমান কাজ',                         type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '306000' },
  { code: '306013', name: 'House Loan',                        bn: 'গৃহঋণ',                             type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '306000' },
  { code: '306014', name: 'Loan to Staff (Laptop)',            bn: 'কর্মচারী ঋণ (ল্যাপটপ)',             type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '306000' },
  { code: '306015', name: 'Accrued Income',                    bn: 'অর্জিত আয়',                         type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '306000' },
  { code: '306016', name: 'Pre-paid Expenses',                 bn: 'অগ্রিম প্রদত্ত ব্যয়',               type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '306000' },
  { code: '306017', name: 'Loan for Motorcycle Purchase',      bn: 'মোটরসাইকেল ক্রয় ঋণ',               type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '306000' },

  // Micro Credit Loan
  { code: '307000', name: 'Micro Credit Loan', bn: 'ক্ষুদ্রঋণ',      type: 'ASSET', nature: 'DEBIT', level: 2, isGroup: true,  parentCode: '300000' },
  { code: '307001', name: 'Micro Credit Loan', bn: 'ক্ষুদ্রঋণ',      type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '307000' },

  // Inter Project Loan
  { code: '308000', name: 'Inter Project Loan', bn: 'আন্তঃপ্রকল্প ঋণ', type: 'ASSET', nature: 'DEBIT', level: 2, isGroup: true,  parentCode: '300000' },
  { code: '308001', name: 'Inter Project Loan', bn: 'আন্তঃপ্রকল্প ঋণ', type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '308000' },

  // Closing Stock
  { code: '309000', name: 'Closing Stock',                           bn: 'সমাপনী মজুদ',                      type: 'ASSET', nature: 'DEBIT', level: 2, isGroup: true,  parentCode: '300000' },
  { code: '309001', name: 'Medicine',                                bn: 'ওষুধ',                             type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '309000' },
  { code: '309002', name: 'Medicine Supplies & Pathology Reagent',   bn: 'ওষুধ সামগ্রী ও প্যাথলজি রিএজেন্ট', type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '309000' },
  { code: '309003', name: 'Fish',                                    bn: 'মাছ',                              type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '309000' },
  { code: '309004', name: 'Fish Meal',                               bn: 'মাছের খাবার',                      type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '309000' },
  { code: '309005', name: 'Spectacle',                               bn: 'চশমা',                             type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '309000' },
  { code: '309006', name: 'Livestock',                               bn: 'গবাদি পশু',                        type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '309000' },
  { code: '309007', name: 'Stock JBS Canteen',                       bn: 'JBS ক্যান্টিন মজুদ',               type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '309000' },
  { code: '309008', name: 'Stock - Digital Print Shop',              bn: 'ডিজিটাল প্রিন্ট মজুদ',             type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '309000' },
  { code: '309009', name: 'Stock - Stationary Shop',                 bn: 'স্টেশনারি মজুদ',                   type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '309000' },
  { code: '309010', name: 'Stock (Wood) - HTI',                      bn: 'কাঠের মজুদ (HTI)',                  type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '309000' },
  { code: '309016', name: 'Subsidy For Laptop/Notebook Loan 20%',    bn: 'ল্যাপটপ ঋণ ভর্তুকি ২০%',          type: 'ASSET', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '309000' },

  // ═══════════════════════════════════════════════════════
  // FIXED ASSETS (40)
  // ═══════════════════════════════════════════════════════
  { code: '401000', name: 'Fixed Assets',                  bn: 'স্থায়ী সম্পদ',             type: 'ASSET', nature: 'DEBIT', level: 1, isGroup: true },
  { code: '401001', name: 'Land & Land Development',       bn: 'জমি ও ভূমি উন্নয়ন',        type: 'ASSET', nature: 'DEBIT', level: 2, isGroup: false, parentCode: '401000' },
  { code: '401002', name: 'Building',                      bn: 'ভবন',                       type: 'ASSET', nature: 'DEBIT', level: 2, isGroup: false, parentCode: '401000' },
  { code: '401003', name: 'Building Under Construction',   bn: 'নির্মাণাধীন ভবন',           type: 'ASSET', nature: 'DEBIT', level: 2, isGroup: false, parentCode: '401000' },
  { code: '401004', name: 'Work in Progress',              bn: 'চলমান কাজ',                  type: 'ASSET', nature: 'DEBIT', level: 2, isGroup: false, parentCode: '401000' },
  { code: '401005', name: 'Vehicle',                       bn: 'যানবাহন',                   type: 'ASSET', nature: 'DEBIT', level: 2, isGroup: false, parentCode: '401000' },
  { code: '401006', name: 'Furniture and Fixtures',        bn: 'আসবাবপত্র ও ফিক্সচার',     type: 'ASSET', nature: 'DEBIT', level: 2, isGroup: false, parentCode: '401000' },
  { code: '401007', name: 'Office Equipment',              bn: 'অফিস সরঞ্জাম',               type: 'ASSET', nature: 'DEBIT', level: 2, isGroup: false, parentCode: '401000' },
  { code: '401008', name: 'Fishing and Agri Equipment',    bn: 'মৎস্য ও কৃষি সরঞ্জাম',     type: 'ASSET', nature: 'DEBIT', level: 2, isGroup: false, parentCode: '401000' },
  { code: '401009', name: 'Medical Equipment',             bn: 'চিকিৎসা সরঞ্জাম',           type: 'ASSET', nature: 'DEBIT', level: 2, isGroup: false, parentCode: '401000' },
  { code: '401010', name: 'Books',                         bn: 'বই',                        type: 'ASSET', nature: 'DEBIT', level: 2, isGroup: false, parentCode: '401000' },
  { code: '401011', name: 'Bed & Bedding',                 bn: 'বিছানা ও বিছানার সামগ্রী',  type: 'ASSET', nature: 'DEBIT', level: 2, isGroup: false, parentCode: '401000' },
  { code: '401012', name: 'Machineries',                   bn: 'যন্ত্রপাতি',                 type: 'ASSET', nature: 'DEBIT', level: 2, isGroup: false, parentCode: '401000' },
  { code: '401013', name: 'Software',                      bn: 'সফটওয়্যার',                  type: 'ASSET', nature: 'DEBIT', level: 2, isGroup: false, parentCode: '401000' },
  { code: '401014', name: 'IT Equipment',                  bn: 'আইটি সরঞ্জাম',               type: 'ASSET', nature: 'DEBIT', level: 2, isGroup: false, parentCode: '401000' },

  // ═══════════════════════════════════════════════════════
  // INCOME (50) — synthetic root 500000
  // ═══════════════════════════════════════════════════════
  { code: '500000', name: 'Income', bn: 'আয়', type: 'INCOME', nature: 'CREDIT', level: 1, isGroup: true },

  // 501 General Income
  { code: '501000', name: 'General Income',                    bn: 'সাধারণ আয়',               type: 'INCOME', nature: 'CREDIT', level: 2, isGroup: true,  parentCode: '500000' },
  { code: '501001', name: 'Foreign Donation',                  bn: 'বৈদেশিক অনুদান',           type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '501000' },
  { code: '501002', name: 'Local Donation',                    bn: 'স্থানীয় অনুদান',           type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '501000' },
  { code: '501003', name: 'Bank Interest',                     bn: 'ব্যাংক সুদ',               type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '501000' },
  { code: '501004', name: 'Interest on FDR & Double Scheme',   bn: 'এফডিআর ও ডাবল স্কিম সুদ', type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '501000' },
  { code: '501005', name: 'House Rent & Utility Bills',        bn: 'গৃহভাড়া ও ইউটিলিটি',      type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '501000' },
  { code: '501006', name: 'Interest on Loan',                  bn: 'ঋণের সুদ',                  type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '501000' },
  { code: '501007', name: 'Income against Motorcycle',         bn: 'মোটরসাইকেল বাবদ আয়',       type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '501000' },
  { code: '501008', name: 'Miscellaneous Income',              bn: 'বিবিধ আয়',                  type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '501000' },
  { code: '501009', name: 'Admin Overhead',                    bn: 'প্রশাসনিক ওভারহেড',         type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '501000' },
  { code: '501010', name: 'Profit on Sale of Livestock',       bn: 'গবাদিপশু বিক্রয় মুনাফা',   type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '501000' },
  { code: '501011', name: 'Profit on Sale of Asset',           bn: 'সম্পদ বিক্রয় মুনাফা',       type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '501000' },
  { code: '501012', name: 'Income from Pre Adjustment',        bn: 'পূর্ব সমন্বয় থেকে আয়',     type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '501000' },

  // 502 Income From Microcredit
  { code: '502000', name: 'Income From Microcredit',        bn: 'ক্ষুদ্রঋণ থেকে আয়',       type: 'INCOME', nature: 'CREDIT', level: 2, isGroup: true,  parentCode: '500000' },
  { code: '502001', name: 'Service Charge',                 bn: 'সেবা চার্জ',               type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '502000' },
  { code: '502002', name: 'Renewal Fee',                    bn: 'নবায়ন ফি',                 type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '502000' },
  { code: '502003', name: 'Old Loan Collection',            bn: 'পুরনো ঋণ আদায়',             type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '502000' },
  { code: '502004', name: 'S/F Return Charge',              bn: 'এস/এফ রিটার্ন চার্জ',       type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '502000' },
  { code: '502005', name: 'Processing Fee',                 bn: 'প্রক্রিয়াকরণ ফি',          type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '502000' },
  { code: '502006', name: 'Pass Book Sale',                 bn: 'পাসবুক বিক্রয়',             type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '502000' },
  { code: '502007', name: 'Admission Fees',                 bn: 'ভর্তি ফি',                  type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '502000' },
  { code: '502008', name: 'Income from Capital Adjustment', bn: 'মূলধন সমন্বয় থেকে আয়',    type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '502000' },

  // 503 Income from Health
  { code: '503000', name: 'Income from Health',                                   bn: 'স্বাস্থ্য থেকে আয়',                   type: 'INCOME', nature: 'CREDIT', level: 2, isGroup: true,  parentCode: '500000' },
  { code: '503001', name: 'Medical Service Charge',                               bn: 'চিকিৎসা সেবা চার্জ',                    type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '503000' },
  { code: '503002', name: 'Pathology & Other Diagnosis Charge',                   bn: 'প্যাথলজি ও অন্যান্য পরীক্ষা চার্জ',  type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '503000' },
  { code: '503003', name: 'Spectacle Sale',                                        bn: 'চশমা বিক্রয়',                           type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '503000' },
  { code: '503004', name: 'Condom Sale',                                           bn: 'কনডম বিক্রয়',                           type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '503000' },
  { code: '503005', name: 'Health Card',                                           bn: 'স্বাস্থ্য কার্ড',                        type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '503000' },
  { code: '503006', name: 'Profit on Sale of Medicine',                            bn: 'ওষুধ বিক্রয় মুনাফা',                   type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '503000' },
  { code: '503007', name: 'Medicine Sale',                                         bn: 'ওষুধ বিক্রয়',                           type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '503000' },
  { code: '503008', name: 'Ambulance Hire Charge',                                 bn: 'অ্যাম্বুলেন্স ভাড়া',                   type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '503000' },
  { code: '503009', name: 'Profit on Sale of Medical Supplies & Pathology Charge', bn: 'মেডিকেল সামগ্রী বিক্রয় মুনাফা',     type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '503000' },
  { code: '503010', name: 'Profit on Sale of Spectacle',                           bn: 'চশমা বিক্রয় মুনাফা',                   type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '503000' },
  { code: '503011', name: 'Ambulance Hire Charge (2)',                             bn: 'অ্যাম্বুলেন্স ভাড়া (২)',               type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '503000' },

  // 504 Income from Education Home, HTI & HPI
  { code: '504000', name: 'Income from Education Home, HTI & HPI', bn: 'শিক্ষা প্রতিষ্ঠান থেকে আয়',   type: 'INCOME', nature: 'CREDIT', level: 2, isGroup: true,  parentCode: '500000' },
  { code: '504001', name: 'Tuition Fees',                          bn: 'টিউশন ফি',                      type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '504000' },
  { code: '504002', name: 'Semester Fees',                         bn: 'সেমিস্টার ফি',                   type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '504000' },
  { code: '504003', name: 'Hostel Seat Rent',                      bn: 'হোস্টেল আসন ভাড়া',               type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '504000' },
  { code: '504004', name: 'Food (Meal Charge)',                     bn: 'খাদ্য (মিল চার্জ)',               type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '504000' },
  { code: '504005', name: 'Admission Fees',                        bn: 'ভর্তি ফি',                       type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '504000' },
  { code: '504006', name: 'Examination Fees',                      bn: 'পরীক্ষা ফি',                      type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '504000' },
  { code: '504007', name: 'Orphans Boys & Girls',                  bn: 'এতিম ছেলে ও মেয়ে',               type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '504000' },
  { code: '504008', name: 'Parents Contribution',                  bn: 'অভিভাবক অবদান',                   type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '504000' },
  { code: '504009', name: 'Income from HTI Trades',                bn: 'HTI ট্রেড থেকে আয়',              type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '504000' },
  { code: '504010', name: 'Registration',                          bn: 'নিবন্ধন ফি',                      type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '504000' },
  { code: '504011', name: 'JBS Canteen Income',                    bn: 'JBS ক্যান্টিন আয়',               type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '504000' },
  { code: '504012', name: 'Fees from JBS Clients',                 bn: 'JBS ক্লায়েন্ট ফি',               type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '504000' },
  { code: '504013', name: 'Services Provided to Other Parties',    bn: 'তৃতীয় পক্ষকে সেবা আয়',          type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '504000' },
  { code: '504014', name: 'Alumni Donation',                       bn: 'অ্যালামনাই অনুদান',               type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '504000' },
  { code: '504015', name: 'Income from Stationary Shop',           bn: 'স্টেশনারি দোকান আয়',              type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '504000' },
  { code: '504016', name: 'Income from Digital Print Shop',        bn: 'ডিজিটাল প্রিন্ট দোকান আয়',       type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '504000' },

  // 505 Income from Fish & Agri
  { code: '505000', name: 'Income from Fish & Agri', bn: 'মৎস্য ও কৃষি থেকে আয়',   type: 'INCOME', nature: 'CREDIT', level: 2, isGroup: true,  parentCode: '500000' },
  { code: '505001', name: 'Fish Sale',               bn: 'মাছ বিক্রয়',               type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '505000' },
  { code: '505002', name: 'Agri. Income',            bn: 'কৃষি আয়',                  type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '505000' },
  { code: '505003', name: 'Cow & Milk Sale',         bn: 'গরু ও দুধ বিক্রয়',          type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '505000' },
  { code: '505004', name: 'Surplus of Livestock',    bn: 'গবাদিপশু উদ্বৃত্ত',          type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '505000' },

  // 506 Income from Training
  { code: '506000', name: 'Income from Training',          bn: 'প্রশিক্ষণ থেকে আয়',        type: 'INCOME', nature: 'CREDIT', level: 2, isGroup: true,  parentCode: '500000' },
  { code: '506001', name: 'Sale of Training',              bn: 'প্রশিক্ষণ বিক্রয়',          type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '506000' },
  { code: '506002', name: 'Sale of Other HRM Materials',   bn: 'এইচআরএম উপকরণ বিক্রয়',     type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '506000' },

  // 507 Income from CSS Ava Center
  { code: '507000', name: 'Income from CSS Ava Center',   bn: 'CSS AVA সেন্টার থেকে আয়',    type: 'INCOME', nature: 'CREDIT', level: 2, isGroup: true,  parentCode: '500000' },
  { code: '507001', name: 'Guest Room Rent',               bn: 'গেস্ট রুম ভাড়া',              type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '507000' },
  { code: '507002', name: 'Hall Room Rent - CSS Ava Center', bn: 'হল রুম ভাড়া - CSS AVA',   type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '507000' },
  { code: '507003', name: 'Food Charge',                   bn: 'খাদ্য চার্জ',                 type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '507000' },
  { code: '507004', name: 'Service Charge - CSS Ava Center', bn: 'সেবা চার্জ - CSS AVA',     type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '507000' },
  { code: '507005', name: 'Sale Center Income',            bn: 'বিক্রয় কেন্দ্র আয়',          type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '507000' },
  { code: '507006', name: 'Tourism Income',                bn: 'পর্যটন আয়',                  type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '507000' },
  { code: '507007', name: 'Income from Vehicle',           bn: 'যানবাহন থেকে আয়',             type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '507000' },

  // 508 Income from CSS Printing Press
  { code: '508000', name: 'Income from CSS Printing Press', bn: 'CSS প্রিন্টিং প্রেস থেকে আয়', type: 'INCOME', nature: 'CREDIT', level: 2, isGroup: true,  parentCode: '500000' },
  { code: '508001', name: 'Printing Income',                bn: 'মুদ্রণ আয়',                    type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '508000' },

  // 509 Income from Nursing Institute
  { code: '509000', name: 'Income from Nursing Institute',      bn: 'নার্সিং ইনস্টিটিউট থেকে আয়', type: 'INCOME', nature: 'CREDIT', level: 2, isGroup: true,  parentCode: '500000' },
  { code: '509001', name: 'Application Form',                   bn: 'আবেদন ফর্ম',                   type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '509000' },
  { code: '509002', name: 'Admission Fee',                      bn: 'ভর্তি ফি',                      type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '509000' },
  { code: '509003', name: 'Session Fee',                        bn: 'সেশন ফি',                       type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '509000' },
  { code: '509004', name: 'Tuition Fee',                        bn: 'টিউশন ফি',                      type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '509000' },
  { code: '509005', name: 'Examination Fee / Registration Fee', bn: 'পরীক্ষা ও নিবন্ধন ফি',         type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '509000' },
  { code: '509006', name: 'Lab Fee',                            bn: 'ল্যাব ফি',                      type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '509000' },
  { code: '509007', name: 'Library Charge',                     bn: 'লাইব্রেরি চার্জ',               type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '509000' },
  { code: '509008', name: 'Identity Card',                      bn: 'পরিচয়পত্র',                    type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '509000' },
  { code: '509009', name: 'Seat Rent / Accommodation',          bn: 'আসন ভাড়া / আবাসন',             type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '509000' },
  { code: '509010', name: 'Uniform / Apron',                    bn: 'ইউনিফর্ম / এপ্রোন',            type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '509000' },
  { code: '509011', name: 'Fooding Charge',                     bn: 'খাদ্য চার্জ',                   type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '509000' },
  { code: '509012', name: 'Medical Charge',                     bn: 'চিকিৎসা চার্জ',                 type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '509000' },
  { code: '509013', name: 'Sports & Culture',                   bn: 'খেলাধুলা ও সংস্কৃতি',           type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '509000' },
  { code: '509014', name: 'Academic Transcript / Testimonial',  bn: 'একাডেমিক ট্রান্সক্রিপ্ট',      type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '509000' },
  { code: '509015', name: 'Form Fill Up',                       bn: 'ফর্ম পূরণ',                     type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '509000' },
  { code: '509016', name: 'Clinical Practice',                  bn: 'ক্লিনিক্যাল অনুশীলন',          type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '509000' },
  { code: '509017', name: 'Income for Board Fee',               bn: 'বোর্ড ফি আয়',                  type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '509000' },
  { code: '509018', name: 'Day Celebration',                    bn: 'দিবস উদযাপন',                   type: 'INCOME', nature: 'CREDIT', level: 3, isGroup: false, parentCode: '509000' },

  // ═══════════════════════════════════════════════════════
  // EXPENSES (60) — synthetic root 600000
  // ═══════════════════════════════════════════════════════
  { code: '600000', name: 'Expenses', bn: 'ব্যয়', type: 'EXPENSE', nature: 'DEBIT', level: 1, isGroup: true },

  // 601 Personal Cost
  { code: '601000', name: 'Personal Cost',              bn: 'ব্যক্তিগত ব্যয়',         type: 'EXPENSE', nature: 'DEBIT', level: 2, isGroup: true,  parentCode: '600000' },
  { code: '601001', name: 'Salary & Other Benefits',   bn: 'বেতন ও অন্যান্য সুবিধা',  type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '601000' },
  { code: '601002', name: 'Wages',                     bn: 'মজুরি',                   type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '601000' },
  { code: '601003', name: 'Training',                  bn: 'প্রশিক্ষণ',               type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '601000' },
  { code: '601004', name: 'Remuneration',              bn: 'পারিশ্রমিক',              type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '601000' },

  // 602 Vehicle Cost
  { code: '602000', name: 'Vehicle Cost', bn: 'যানবাহন ব্যয়', type: 'EXPENSE', nature: 'DEBIT', level: 2, isGroup: true,  parentCode: '600000' },
  { code: '602001', name: 'Vehicle Cost', bn: 'যানবাহন ব্যয়', type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '602000' },

  // 603 Utilities & Maintenance
  { code: '603000', name: 'Utilities & Maintenance',           bn: 'ইউটিলিটি ও রক্ষণাবেক্ষণ',      type: 'EXPENSE', nature: 'DEBIT', level: 2, isGroup: true,  parentCode: '600000' },
  { code: '603001', name: 'Utilities / Service / Supplies',    bn: 'ইউটিলিটি / সেবা / সরবরাহ',     type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '603000' },
  { code: '603002', name: 'Repair & Maintenance',              bn: 'মেরামত ও রক্ষণাবেক্ষণ',         type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '603000' },
  { code: '603003', name: 'Building Repair and Maintenance',   bn: 'ভবন মেরামত ও রক্ষণাবেক্ষণ',    type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '603000' },
  { code: '603004', name: 'License, Audit and Prof. Fees',     bn: 'লাইসেন্স, নিরীক্ষা ও পেশাদার ফি', type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '603000' },
  { code: '603005', name: 'Land and Municipal Tax',            bn: 'ভূমি ও পৌর কর',                 type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '603000' },
  { code: '603006', name: 'Postage and Telephone',             bn: 'ডাক ও টেলিফোন',                 type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '603000' },
  { code: '603007', name: 'Printing and Stationery',           bn: 'মুদ্রণ ও স্টেশনারি',            type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '603000' },
  { code: '603008', name: 'Office Management Cost',            bn: 'অফিস ব্যবস্থাপনা ব্যয়',         type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '603000' },

  // 604 Office Running Cost
  { code: '604000', name: 'Office Running Cost',                       bn: 'অফিস পরিচালনা ব্যয়',           type: 'EXPENSE', nature: 'DEBIT', level: 2, isGroup: true,  parentCode: '600000' },
  { code: '604001', name: 'Office Rent',                               bn: 'অফিস ভাড়া',                    type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '604000' },
  { code: '604002', name: 'Traveling & Food',                          bn: 'ভ্রমণ ও খাদ্য',                type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '604000' },
  { code: '604003', name: 'Bank Charge',                               bn: 'ব্যাংক চার্জ',                  type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '604000' },
  { code: '604004', name: 'Board Meeting Exp.',                        bn: 'বোর্ড সভা ব্যয়',               type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '604000' },
  { code: '604005', name: 'Advertisement',                             bn: 'বিজ্ঞাপন',                      type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '604000' },
  { code: '604006', name: 'Entertainment and Meeting',                 bn: 'আপ্যায়ন ও সভা',                type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '604000' },
  { code: '604007', name: 'Newspaper and Publication',                 bn: 'সংবাদপত্র ও প্রকাশনা',         type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '604000' },
  { code: '604008', name: 'Interest On Security Deposit (Staff)',      bn: 'কর্মচারী জামানতের সুদ',        type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '604000' },
  { code: '604009', name: 'Base Line Survey and Evaluation',           bn: 'বেসলাইন জরিপ ও মূল্যায়ন',     type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '604000' },
  { code: '604010', name: 'Advocacy / Social Welfare',                 bn: 'অ্যাডভোকেসি / সামাজিক কল্যাণ', type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '604000' },
  { code: '604011', name: 'Charge On Loan',                            bn: 'ঋণ চার্জ',                      type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '604000' },
  { code: '604012', name: 'Income Tax',                                bn: 'আয়কর',                          type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '604000' },

  // 605 CSS Ava Center Expenses
  { code: '605000', name: 'CSS Ava Center Expenses', bn: 'CSS AVA সেন্টার ব্যয়',   type: 'EXPENSE', nature: 'DEBIT', level: 2, isGroup: true,  parentCode: '600000' },
  { code: '605001', name: 'Food Cost - ACC',          bn: 'খাদ্য ব্যয় - ACC',      type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '605000' },
  { code: '605002', name: 'Cost of Sale Center',      bn: 'বিক্রয় কেন্দ্র ব্যয়',   type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '605000' },
  { code: '605003', name: 'Cost of Tourism',          bn: 'পর্যটন ব্যয়',            type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '605000' },

  // 606 Credit Expense
  { code: '606000', name: 'Credit Expense',                     bn: 'ঋণ ব্যয়',                     type: 'EXPENSE', nature: 'DEBIT', level: 2, isGroup: true,  parentCode: '600000' },
  { code: '606001', name: 'Interest On Compulsory Savings',     bn: 'বাধ্যতামূলক সঞ্চয়ের সুদ',    type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '606000' },
  { code: '606002', name: 'Loan Loss Expense',                  bn: 'ঋণ ক্ষতি ব্যয়',               type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '606000' },
  { code: '606003', name: 'Service Charge Rebate',              bn: 'সেবা চার্জ ছাড়',               type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '606000' },
  { code: '606004', name: 'Old Loan Collection',                bn: 'পুরনো ঋণ আদায়',                type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '606000' },
  { code: '606005', name: 'Expense of HNFP School',             bn: 'HNFP স্কুল ব্যয়',              type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '606000' },
  { code: '606006', name: 'Interest on EFSF (staff)',           bn: 'EFSF সুদ (কর্মচারী)',           type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '606000' },
  { code: '606007', name: 'Interest on Term Saving',            bn: 'মেয়াদি সঞ্চয়ের সুদ',           type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '606000' },
  { code: '606008', name: 'Exp. for Reserve Fund',              bn: 'সংরক্ষিত তহবিল ব্যয়',          type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '606000' },

  // 607 Education Expenses
  { code: '607000', name: 'Education Expenses',              bn: 'শিক্ষা ব্যয়',                    type: 'EXPENSE', nature: 'DEBIT', level: 2, isGroup: true,  parentCode: '600000' },
  { code: '607001', name: 'Food and Tiffin',                 bn: 'খাদ্য ও টিফিন',                  type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '607000' },
  { code: '607002', name: 'Clothing',                        bn: 'পোশাক',                           type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '607000' },
  { code: '607003', name: 'Spiritual Expense',               bn: 'আধ্যাত্মিক ব্যয়',                type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '607000' },
  { code: '607004', name: 'Stipend',                         bn: 'বৃত্তি',                          type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '607000' },
  { code: '607005', name: 'Educational Fees',                bn: 'শিক্ষা ফি',                       type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '607000' },
  { code: '607006', name: 'Student Medical',                 bn: 'শিক্ষার্থী চিকিৎসা',             type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '607000' },
  { code: '607007', name: 'Educational Materials',           bn: 'শিক্ষা উপকরণ',                   type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '607000' },
  { code: '607008', name: 'Expenses for HTI Trades',         bn: 'HTI ট্রেড ব্যয়',                 type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '607000' },
  { code: '607009', name: 'Special Gift',                    bn: 'বিশেষ উপহার',                    type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '607000' },
  { code: '607010', name: 'Exchange Visit',                  bn: 'বিনিময় পরিদর্শন',               type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '607000' },
  { code: '607011', name: 'Parents Meeting',                 bn: 'অভিভাবক সভা',                    type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '607000' },
  { code: '607012', name: 'Bundles of Love',                 bn: 'ভালোবাসার বান্ডেল',              type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '607000' },
  { code: '607013', name: 'Materials of Tuition Program',    bn: 'টিউশন প্রোগ্রামের উপকরণ',        type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '607000' },
  { code: '607014', name: 'Conveyance for LTP',              bn: 'LTP যাতায়াত',                    type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '607000' },
  { code: '607015', name: 'Seminar Materials for LTP',       bn: 'LTP সেমিনার উপকরণ',              type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '607000' },
  { code: '607016', name: 'Cost of Alumni Association',      bn: 'অ্যালামনাই অ্যাসোসিয়েশন ব্যয়',  type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '607000' },
  { code: '607017', name: 'Networking',                      bn: 'নেটওয়ার্কিং',                    type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '607000' },
  { code: '607018', name: 'Expenses for HPI Trades',         bn: 'HPI ট্রেড ব্যয়',                 type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '607000' },
  { code: '607019', name: 'Costs of Canteen Services',       bn: 'ক্যান্টিন সেবা ব্যয়',            type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '607000' },
  { code: '607020', name: 'Materials for Hygiene / Safety',  bn: 'স্বাস্থ্যবিধি ও নিরাপত্তা উপকরণ', type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '607000' },
  { code: '607021', name: 'Cost of Stationary Shop',         bn: 'স্টেশনারি দোকান ব্যয়',           type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '607000' },
  { code: '607022', name: 'Cost of Digital Print Shop',      bn: 'ডিজিটাল প্রিন্ট ব্যয়',           type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '607000' },
  { code: '607023', name: 'Game and Sports',                 bn: 'খেলাধুলা',                        type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '607000' },

  // 608 Health Expenses
  { code: '608000', name: 'Health Expenses',                            bn: 'স্বাস্থ্য ব্যয়',                     type: 'EXPENSE', nature: 'DEBIT', level: 2, isGroup: true,  parentCode: '600000' },
  { code: '608001', name: 'Loss on Sale of Medicine',                   bn: 'ওষুধ বিক্রয়ে ক্ষতি',               type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '608000' },
  { code: '608002', name: 'Linen',                                      bn: 'লিনেন',                              type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '608000' },
  { code: '608003', name: 'Patient Food',                               bn: 'রোগীর খাদ্য',                        type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '608000' },
  { code: '608004', name: 'Vaccination to Staff',                       bn: 'কর্মচারী টিকা',                      type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '608000' },
  { code: '608005', name: 'Lens Purchase',                              bn: 'লেন্স ক্রয়',                         type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '608000' },
  { code: '608006', name: 'Spectacle Purchase',                         bn: 'চশমা ক্রয়',                          type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '608000' },
  { code: '608007', name: 'Student Allowance (Nursing Institute)',       bn: 'শিক্ষার্থী ভাতা (নার্সিং)',          type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '608000' },
  { code: '608008', name: 'Pathology and Other Diagnosis Expenses',     bn: 'প্যাথলজি ও পরীক্ষার ব্যয়',          type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '608000' },
  { code: '608009', name: 'Condom Purchase',                            bn: 'কনডম ক্রয়',                          type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '608000' },
  { code: '608010', name: 'Poor Fund Expenses',                         bn: 'দরিদ্র তহবিল ব্যয়',                 type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '608000' },
  { code: '608011', name: 'Target Group Training',                      bn: 'লক্ষ্য গোষ্ঠী প্রশিক্ষণ',           type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '608000' },
  { code: '608012', name: 'CSW Stipend',                                bn: 'CSW বৃত্তি',                          type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '608000' },
  { code: '608013', name: 'Camp Expenses',                              bn: 'ক্যাম্প ব্যয়',                       type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '608000' },
  { code: '608014', name: 'Folk and Social Activity',                   bn: 'লোকজ ও সামাজিক কার্যক্রম',          type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '608000' },
  { code: '608015', name: 'Medicine Purchases',                         bn: 'ওষুধ ক্রয়',                          type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '608000' },
  { code: '608016', name: 'Medical Supplies',                           bn: 'চিকিৎসা সামগ্রী',                    type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '608000' },
  { code: '608017', name: 'RHC Marketing',                              bn: 'RHC মার্কেটিং',                       type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '608000' },
  { code: '608018', name: 'Phaseout Exp. (RHC Closing)',                bn: 'ফেজআউট ব্যয় (RHC বন্ধ)',             type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '608000' },
  { code: '608019', name: 'RHC Hand Over Cost',                         bn: 'RHC হস্তান্তর ব্যয়',                 type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '608000' },
  { code: '608020', name: 'Medical Care',                               bn: 'চিকিৎসা সেবা',                        type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '608000' },
  { code: '608021', name: 'Nutrition Expenses',                         bn: 'পুষ্টি ব্যয়',                        type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '608000' },
  { code: '608022', name: 'Consortium Expenses',                        bn: 'কনসোর্টিয়াম ব্যয়',                  type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '608000' },
  { code: '608023', name: 'Cataract Operation Expenses',                bn: 'ছানি অপারেশন ব্যয়',                  type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '608000' },
  { code: '608024', name: 'Study Tour',                                 bn: 'স্টাডি ট্যুর',                       type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '608000' },
  { code: '608025', name: 'Clinical Practice',                          bn: 'ক্লিনিক্যাল অনুশীলন',               type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '608000' },
  { code: '608026', name: 'Expenses for Board Fee',                     bn: 'বোর্ড ফি ব্যয়',                     type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '608000' },

  // 609 Agri & Fish Expenses
  { code: '609000', name: 'Agri & Fish Expenses',      bn: 'কৃষি ও মৎস্য ব্যয়',   type: 'EXPENSE', nature: 'DEBIT', level: 2, isGroup: true,  parentCode: '600000' },
  { code: '609001', name: 'Pond Renovation',            bn: 'পুকুর সংস্কার',        type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '609000' },
  { code: '609002', name: 'Seed & Plant Purchase',      bn: 'বীজ ও চারা ক্রয়',     type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '609000' },
  { code: '609003', name: 'Fish Expenses',              bn: 'মাছ ব্যয়',             type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '609000' },
  { code: '609004', name: 'Agriculture Expenses',       bn: 'কৃষি ব্যয়',            type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '609000' },
  { code: '609005', name: 'Cow, Goat, Duck & Others',   bn: 'গরু, ছাগল, হাঁস ও অন্যান্য', type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '609000' },

  // 610 Other Expenses
  { code: '610000', name: 'Other Expenses',                     bn: 'অন্যান্য ব্যয়',                type: 'EXPENSE', nature: 'DEBIT', level: 2, isGroup: true,  parentCode: '600000' },
  { code: '610001', name: 'Gardening',                          bn: 'বাগান',                         type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '610000' },
  { code: '610002', name: 'Relief',                             bn: 'ত্রাণ',                          type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '610000' },
  { code: '610003', name: 'Contingency',                        bn: 'আকস্মিক ব্যয়',                 type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '610000' },
  { code: '610004', name: 'Fuel for Machinery',                 bn: 'যন্ত্রপাতির জ্বালানি',          type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '610000' },
  { code: '610005', name: 'Dress & Kits',                       bn: 'পোশাক ও কিট',                   type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '610000' },
  { code: '610006', name: 'Utensils',                           bn: 'বাসনপত্র',                       type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '610000' },
  { code: '610007', name: 'Conference / Seminars',              bn: 'সম্মেলন / সেমিনার',             type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '610000' },
  { code: '610008', name: 'Depreciation',                       bn: 'অবচয়',                          type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '610000' },
  { code: '610009', name: 'Embankment',                         bn: 'বাঁধ',                           type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '610000' },
  { code: '610010', name: 'Day Observation',                    bn: 'দিবস পালন',                     type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '610000' },
  { code: '610011', name: 'Miscellaneous',                      bn: 'বিবিধ',                          type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '610000' },
  { code: '610012', name: 'Land for CSW',                       bn: 'CSW জমি',                        type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '610000' },
  { code: '610013', name: 'Advocacy',                           bn: 'অ্যাডভোকেসি',                   type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '610000' },
  { code: '610014', name: 'House for CSW',                      bn: 'CSW বাড়ি',                       type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '610000' },
  { code: '610015', name: 'Local Donation',                     bn: 'স্থানীয় অনুদান',                type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '610000' },
  { code: '610016', name: 'Subsidy for Laptop / Notebook Loan', bn: 'ল্যাপটপ ঋণ ভর্তুকি',           type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '610000' },
  { code: '610017', name: 'Loss on Sale of Assets',             bn: 'সম্পদ বিক্রয়ে ক্ষতি',          type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '610000' },
  { code: '610018', name: 'Gender Mainstreaming',               bn: 'লিঙ্গ মূলধারাকরণ',              type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '610000' },
  { code: '610019', name: 'Expenses from Prev. Adjustment',     bn: 'পূর্ব সমন্বয় থেকে ব্যয়',       type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '610000' },

  // 611 Admin Overhead
  { code: '611000', name: 'Admin Overhead', bn: 'প্রশাসনিক ওভারহেড', type: 'EXPENSE', nature: 'DEBIT', level: 2, isGroup: true,  parentCode: '600000' },
  { code: '611001', name: 'Admin Overhead', bn: 'প্রশাসনিক ওভারহেড', type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '611000' },

  // 612 Water Plant Expenses
  { code: '612000', name: 'Water Plant Expenses', bn: 'পানি প্ল্যান্ট ব্যয়',  type: 'EXPENSE', nature: 'DEBIT', level: 2, isGroup: true,  parentCode: '600000' },
  { code: '612001', name: 'Social Awareness',     bn: 'সামাজিক সচেতনতা',      type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '612000' },
  { code: '612002', name: 'Water Test Charge',    bn: 'পানি পরীক্ষা চার্জ',    type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '612000' },
  { code: '612003', name: 'Filter Kits',          bn: 'ফিল্টার কিট',           type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '612000' },

  // 613 HRM Expenses
  { code: '613000', name: 'HRM Expenses',                    bn: 'এইচআরএম ব্যয়',                type: 'EXPENSE', nature: 'DEBIT', level: 2, isGroup: true,  parentCode: '600000' },
  { code: '613001', name: 'Staff Training',                  bn: 'কর্মচারী প্রশিক্ষণ',           type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '613000' },
  { code: '613002', name: 'Seminar / Workshop',              bn: 'সেমিনার / কর্মশালা',            type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '613000' },
  { code: '613003', name: 'Material Development',            bn: 'উপকরণ উন্নয়ন',                 type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '613000' },
  { code: '613004', name: 'Training Need Assessment (TNA)',  bn: 'প্রশিক্ষণ চাহিদা মূল্যায়ন',  type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '613000' },
  { code: '613005', name: 'Beneficiary Training',            bn: 'সুবিধাভোগী প্রশিক্ষণ',         type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '613000' },
  { code: '613006', name: 'Meeting',                         bn: 'সভা',                           type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '613000' },

  // 614 Printing Press Expenses
  { code: '614000', name: 'Printing Press Expenses', bn: 'প্রিন্টিং প্রেস ব্যয়',   type: 'EXPENSE', nature: 'DEBIT', level: 2, isGroup: true,  parentCode: '600000' },
  { code: '614001', name: 'Paper & Other Expenses',  bn: 'কাগজ ও অন্যান্য ব্যয়',  type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '614000' },
  { code: '614002', name: 'Ink Expenses',             bn: 'কালি ব্যয়',              type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '614000' },
  { code: '614003', name: 'Material Expenses',        bn: 'উপকরণ ব্যয়',             type: 'EXPENSE', nature: 'DEBIT', level: 3, isGroup: false, parentCode: '614000' },

  // ═══════════════════════════════════════════════════════
  // ACCUMULATED DEPRECIATION (70) — contra-asset, CREDIT nature
  // ═══════════════════════════════════════════════════════
  { code: '701000', name: 'Accumulated Depreciation',          bn: 'সঞ্চিত অবচয়',              type: 'ASSET', nature: 'CREDIT', level: 1, isGroup: true },
  { code: '701001', name: 'Acc. Dep. - Land & Land Dev.',      bn: 'অবচয় - জমি',               type: 'ASSET', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '701000' },
  { code: '701002', name: 'Acc. Dep. - Building',              bn: 'অবচয় - ভবন',               type: 'ASSET', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '701000' },
  { code: '701003', name: 'Acc. Dep. - Building Under Const.', bn: 'অবচয় - নির্মাণাধীন ভবন',   type: 'ASSET', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '701000' },
  { code: '701004', name: 'Acc. Dep. - Work in Progress',      bn: 'অবচয় - চলমান কাজ',         type: 'ASSET', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '701000' },
  { code: '701005', name: 'Acc. Dep. - Vehicle',               bn: 'অবচয় - যানবাহন',           type: 'ASSET', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '701000' },
  { code: '701006', name: 'Acc. Dep. - Furniture & Fixtures',  bn: 'অবচয় - আসবাবপত্র',         type: 'ASSET', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '701000' },
  { code: '701007', name: 'Acc. Dep. - Office Equipment',      bn: 'অবচয় - অফিস সরঞ্জাম',      type: 'ASSET', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '701000' },
  { code: '701008', name: 'Acc. Dep. - Fishing & Agri Equip.', bn: 'অবচয় - মৎস্য ও কৃষি সরঞ্জাম', type: 'ASSET', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '701000' },
  { code: '701009', name: 'Acc. Dep. - Medical Equipment',     bn: 'অবচয় - চিকিৎসা সরঞ্জাম',   type: 'ASSET', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '701000' },
  { code: '701010', name: 'Acc. Dep. - Books',                 bn: 'অবচয় - বই',                type: 'ASSET', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '701000' },
  { code: '701011', name: 'Acc. Dep. - Bed & Bedding',         bn: 'অবচয় - বিছানা',             type: 'ASSET', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '701000' },
  { code: '701012', name: 'Acc. Dep. - Machineries',           bn: 'অবচয় - যন্ত্রপাতি',         type: 'ASSET', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '701000' },
  { code: '701013', name: 'Acc. Dep. - Software',              bn: 'অবচয় - সফটওয়্যার',          type: 'ASSET', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '701000' },
  { code: '701014', name: 'Acc. Dep. - IT Equipment',          bn: 'অবচয় - আইটি সরঞ্জাম',       type: 'ASSET', nature: 'CREDIT', level: 2, isGroup: false, parentCode: '701000' },
]

// ─────────────────────────────────────────────────────────
// Main seed
// ─────────────────────────────────────────────────────────

async function main() {
  console.log('=== CSS Bangladesh Chart of Accounts Seed ===\n')
  console.log(`Total accounts to seed: ${accounts.length}\n`)

  const org = await prisma.organization.findUnique({ where: { slug: CSS_ORG_SLUG } })
  if (!org) throw new Error(`Organization "${CSS_ORG_SLUG}" not found. Run seed-bootstrap.ts first. Set CSS_ORG_SLUG env var to override.`)
  console.log(`Organization: ${org.name} (${org.id})\n`)

  const codeToId: Record<string, string> = {}
  const sorted = [...accounts].sort((a, b) => a.level - b.level)

  let created = 0
  let updated = 0

  for (const acct of sorted) {
    const parentId = acct.parentCode ? codeToId[acct.parentCode] : null
    if (acct.parentCode && !parentId) {
      throw new Error(`Parent "${acct.parentCode}" not found for "${acct.code} ${acct.name}"`)
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
      where: { organizationId_code: { organizationId: org.id, code: acct.code } },
      create: { organizationId: org.id, code: acct.code, ...data },
      update: data,
    })

    codeToId[acct.code] = result.id
    const isNew = result.createdAt.getTime() === result.updatedAt.getTime()
    isNew ? created++ : updated++

    const indent = '  '.repeat(acct.level - 1)
    const tag = acct.isGroup ? '[GRP]' : '[   ]'
    console.log(`${indent}${tag} ${acct.code}  ${acct.name}`)
  }

  console.log('\n─── Summary ───────────────────────────')
  const byType: Record<string, number> = {}
  for (const a of accounts) byType[a.type] = (byType[a.type] || 0) + 1
  for (const [type, count] of Object.entries(byType)) console.log(`  ${type}: ${count}`)
  console.log(`  TOTAL: ${accounts.length}  (${created} created, ${updated} updated)`)
  console.log('\nCSS COA seed complete.')
}

main()
  .catch(e => { console.error('Seed failed:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect(); await pool.end() })
