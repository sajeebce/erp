/**
 * Seed: Bank Reconciliation test data
 * Creates vouchers + JEs for March 2026 linked to SB-MOTHER bank account
 * Run: pnpm tsx prisma/seed-reconciliation.ts
 */
import { PrismaClient, Prisma } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ngo_erp?schema=public',
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const org = await prisma.organization.findUnique({ where: { slug: 'css' } })
  if (!org) throw new Error('Organization "css" not found.')

  const adminUser = await prisma.user.findFirst({ where: { organizationId: org.id, role: { name: 'ADMIN' } } })
  if (!adminUser) throw new Error('Admin user not found')

  const fy = await prisma.fiscalYear.findFirst({ where: { organizationId: org.id, isCurrent: true } })
  if (!fy) throw new Error('Fiscal year not found')

  // Find SB-MOTHER bank account
  const bankAccount = await prisma.bankAccount.findFirst({
    where: { organizationId: org.id, accountCode: 'SB-MOTHER' },
  })
  if (!bankAccount) {
    console.log('SB-MOTHER bank account not found. Looking for BA-001...')
    const ba001 = await prisma.bankAccount.findFirst({
      where: { organizationId: org.id, accountCode: 'BA-001' },
    })
    if (!ba001) throw new Error('No bank account found. Run seed-finance.ts first.')
    console.log(`Using ${ba001.accountCode}: ${ba001.accountName}`)
  }

  const bankAcctId = bankAccount?.id || (await prisma.bankAccount.findFirst({
    where: { organizationId: org.id, isMotherAccount: true },
  }))?.id

  if (!bankAcctId) throw new Error('No mother bank account found')

  // Find chart of accounts
  let cashAccount = await prisma.account.findFirst({
    where: { organizationId: org.id, isBankAccount: true, isGroup: false, deletedAt: null },
  })
  if (!cashAccount) {
    cashAccount = await prisma.account.findFirst({
      where: { organizationId: org.id, type: 'ASSET', isGroup: false, deletedAt: null },
    })
  }
  const expenseAccount = await prisma.account.findFirst({
    where: { organizationId: org.id, type: 'EXPENSE', isGroup: false, deletedAt: null },
  })
  const incomeAccount = await prisma.account.findFirst({
    where: { organizationId: org.id, type: 'INCOME', isGroup: false, deletedAt: null },
  })

  if (!cashAccount || !expenseAccount || !incomeAccount) {
    throw new Error('Chart of Accounts missing required accounts (asset, expense, income)')
  }

  // Link bank account to GL account (1101 Sonali Bank)
  if (cashAccount) {
    await prisma.bankAccount.updateMany({
      where: { id: bankAcctId },
      data: { glAccountId: cashAccount.id },
    })
    console.log(`Linked bank account to GL account: ${cashAccount.name} (${cashAccount.code})`)
  }

  console.log(`Bank Account: ${bankAccount?.accountName || 'Mother Account'} (${bankAcctId})`)
  console.log(`Cash/Bank GL: ${cashAccount.name} (${cashAccount.code})`)
  console.log(`Expense GL: ${expenseAccount.name} (${expenseAccount.code})`)
  console.log(`Income GL: ${incomeAccount.name} (${incomeAccount.code})`)

  // ─── March 2026 Transactions ───
  // These match the sample-bank-statement.csv entries
  // Some CSV entries WON'T have matching ERP records (bank charge, interest) → unmatched items

  const transactions = [
    {
      voucherNo: 'RV-2026-101',
      type: 'RECEIPT',
      date: '2026-03-05',
      description: 'Fund Transfer from USAID - Q2 Disbursement',
      amount: 500000,
      isPayment: false,
    },
    {
      voucherNo: 'BV-2026-101',
      type: 'BANK',
      date: '2026-03-08',
      description: 'Cheque Payment - Office Supplies CHQ-4521',
      amount: 25000,
      isPayment: true,
    },
    {
      voucherNo: 'BV-2026-102',
      type: 'BANK',
      date: '2026-03-10',
      description: 'Vendor Payment - IT Equipment',
      amount: 185000,
      isPayment: true,
    },
    {
      voucherNo: 'CV-2026-101',
      type: 'CASH',
      date: '2026-03-12',
      description: 'Petty Cash Replenishment',
      amount: 50000,
      isPayment: true,
    },
    {
      voucherNo: 'DV-2026-101',
      type: 'DEBIT',
      date: '2026-03-20',
      description: 'Staff Salary Advance',
      amount: 200000,
      isPayment: true,
    },
    {
      voucherNo: 'BV-2026-103',
      type: 'BANK',
      date: '2026-03-22',
      description: 'Internet and Phone Bill',
      amount: 15000,
      isPayment: true,
    },
  ]

  // NOTE: These CSV entries will NOT have ERP matches (for testing unmatched):
  // - March 15: Bank Service Charge (2,500) → user creates JE manually
  // - March 25: Interest Earned (8,500) → user creates JE manually

  console.log('\n--- Creating March 2026 Vouchers + Journal Entries ---')

  for (const txn of transactions) {
    // Check if already exists
    const existing = await prisma.voucher.findFirst({
      where: { organizationId: org.id, voucherNo: txn.voucherNo },
    })
    if (existing) {
      console.log(`  - ${txn.voucherNo}: Already exists, skipping`)
      continue
    }

    const date = new Date(txn.date)
    const amount = new Prisma.Decimal(txn.amount)

    // Create JE first
    const jeNo = `JE-RECON-${txn.voucherNo}`
    const debitAccountId = txn.isPayment ? expenseAccount.id : cashAccount.id
    const creditAccountId = txn.isPayment ? cashAccount.id : incomeAccount.id

    const je = await prisma.journalEntry.create({
      data: {
        entryNo: jeNo,
        date,
        description: txn.description,
        fiscalYearId: fy.id,
        totalDebit: amount,
        totalCredit: amount,
        status: 'APPROVED',
        isAutoGenerated: true,
        sourceModule: 'voucher',
        createdById: adminUser.id,
        approvedById: adminUser.id,
        approvedAt: date,
        postedAt: date,
        lines: {
          create: [
            { accountId: debitAccountId, description: txn.description, debit: amount, credit: new Prisma.Decimal(0) },
            { accountId: creditAccountId, description: txn.description, debit: new Prisma.Decimal(0), credit: amount },
          ],
        },
      },
    })

    // Create voucher linked to JE and bank account
    await prisma.voucher.create({
      data: {
        organizationId: org.id,
        voucherNo: txn.voucherNo,
        type: txn.type as any,
        date,
        description: txn.description,
        amount,
        status: 'APPROVED',
        preparedById: adminUser.id,
        approvedById: adminUser.id,
        approvedAt: date,
        bankAccountId: ['BANK', 'RECEIPT'].includes(txn.type) ? bankAcctId : null,
        journalEntryId: je.id,
      },
    })

    console.log(`  ✓ ${txn.voucherNo}: ${txn.description} (${txn.isPayment ? '-' : '+'}${txn.amount.toLocaleString()}) → JE: ${jeNo}`)
  }

  // ─── Summary ───
  const totalPayments = transactions.filter(t => t.isPayment).reduce((s, t) => s + t.amount, 0)
  const totalReceipts = transactions.filter(t => !t.isPayment).reduce((s, t) => s + t.amount, 0)
  const netChange = totalReceipts - totalPayments

  console.log('\n--- Summary ---')
  console.log(`  Payments (ERP): ${totalPayments.toLocaleString()} BDT`)
  console.log(`  Receipts (ERP): ${totalReceipts.toLocaleString()} BDT`)
  console.log(`  Net change (ERP): ${netChange.toLocaleString()} BDT`)
  console.log('')
  console.log('  Bank-only items (NOT in ERP — will be unmatched):')
  console.log('    - March 15: Bank Service Charge: -2,500 BDT')
  console.log('    - March 25: Interest Earned: +8,500 BDT')
  console.log('    - Net bank-only: +6,000 BDT')
  console.log('')
  console.log(`  📋 For reconciliation test:`)
  console.log(`     1. Start reconciliation for the Mother Account, March 1-31, 2026`)
  console.log(`     2. Bank Statement Balance = Book Balance + 6,000`)
  console.log(`        (The 6,000 difference = interest earned 8,500 - bank charge 2,500)`)
  console.log(`     3. Import the sample CSV: /sample-bank-statement.csv`)
  console.log(`     4. Click Auto-Match → 6 items should match`)
  console.log(`     5. 2 items remain unmatched (bank charge + interest)`)
  console.log(`     6. Create JEs for those 2 → difference becomes 0 → Finalize!`)
  console.log('')
  console.log('✅ Reconciliation test data seeded!')
}

main()
  .then(() => { process.exit(0) })
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => pool.end())
