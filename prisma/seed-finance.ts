import { PrismaClient, Prisma } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ngo_erp?schema=public',
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  // Get org
  const org = await prisma.organization.findUnique({ where: { slug: 'shapla-foundation' } })
  if (!org) throw new Error('Organization "shapla-foundation" not found.')

  const adminUser = await prisma.user.findFirst({ where: { organizationId: org.id, role: { name: 'ADMIN' } } })
  if (!adminUser) throw new Error('Admin user not found')

  const fy = await prisma.fiscalYear.findFirst({ where: { organizationId: org.id, isCurrent: true } })
  if (!fy) throw new Error('Fiscal year not found.')

  console.log(`Organization: ${org.name} (${org.id})`)
  console.log(`Admin user: ${adminUser.fullName} (${adminUser.id})`)
  console.log(`Fiscal year: ${fy.name} (${fy.id})`)

  // ──────────────────────────────────────────────
  // 1. Bank Accounts
  // ──────────────────────────────────────────────
  console.log('\n--- Creating Bank Accounts ---')

  const bankAccountsData = [
    {
      accountCode: 'BA-001',
      accountName: 'NGOAB Mother Account',
      bankName: 'Dutch Bangla Bank',
      branchName: 'Motijheel Branch',
      accountNumber: '110-1501-23456',
      type: 'CURRENT',
      isMotherAccount: true,
      balance: new Prisma.Decimal('15000000'),
      currency: 'BDT',
    },
    {
      accountCode: 'BA-002',
      accountName: 'USAID Project Account',
      bankName: 'BRAC Bank',
      branchName: 'Gulshan Branch',
      accountNumber: '150-2301-78901',
      type: 'CURRENT',
      isMotherAccount: false,
      balance: new Prisma.Decimal('4500000'),
      currency: 'BDT',
    },
    {
      accountCode: 'BA-003',
      accountName: 'Operating Savings Account',
      bankName: 'Sonali Bank',
      branchName: 'Dhanmondi Branch',
      accountNumber: '200-0045-56789',
      type: 'SAVINGS',
      isMotherAccount: false,
      balance: new Prisma.Decimal('8200000'),
      currency: 'BDT',
    },
    {
      accountCode: 'BA-004',
      accountName: 'Head Office Petty Cash',
      bankName: 'Cash',
      branchName: null,
      accountNumber: null,
      type: 'CASH',
      isMotherAccount: false,
      balance: new Prisma.Decimal('150000'),
      currency: 'BDT',
    },
    {
      accountCode: 'BA-005',
      accountName: 'Field Office Cash - Sylhet',
      bankName: 'Cash',
      branchName: null,
      accountNumber: null,
      type: 'CASH',
      isMotherAccount: false,
      balance: new Prisma.Decimal('75000'),
      currency: 'BDT',
    },
    {
      accountCode: 'BA-006',
      accountName: 'bKash Disbursement Account',
      bankName: 'bKash',
      branchName: null,
      accountNumber: '01712345678',
      type: 'MOBILE_BANKING',
      isMotherAccount: false,
      balance: new Prisma.Decimal('250000'),
      currency: 'BDT',
    },
  ]

  const bankAccounts: Record<string, any> = {}

  for (const ba of bankAccountsData) {
    const created = await prisma.bankAccount.upsert({
      where: {
        organizationId_accountCode: {
          organizationId: org.id,
          accountCode: ba.accountCode,
        },
      },
      update: {
        accountName: ba.accountName,
        bankName: ba.bankName,
        branchName: ba.branchName,
        accountNumber: ba.accountNumber,
        type: ba.type as any,
        isMotherAccount: ba.isMotherAccount,
        currentBalance: ba.balance,
        currencyCode: ba.currency as any,
      },
      create: {
        organizationId: org.id,
        accountCode: ba.accountCode,
        accountName: ba.accountName,
        bankName: ba.bankName,
        branchName: ba.branchName,
        accountNumber: ba.accountNumber,
        type: ba.type as any,
        isMotherAccount: ba.isMotherAccount,
        currentBalance: ba.balance,
        currencyCode: ba.currency as any,
      },
    })
    bankAccounts[ba.accountCode] = created
    console.log(`  ✓ ${ba.accountCode}: ${ba.accountName} (${ba.bankName}) - ${ba.balance} BDT`)
  }

  // Link mother bank account to GL account 1101
  const glAccount1101 = await prisma.account.findFirst({
    where: { organizationId: org.id, code: '1101', deletedAt: null },
  })
  if (glAccount1101 && bankAccounts['BA-001']) {
    await prisma.bankAccount.update({
      where: { id: bankAccounts['BA-001'].id },
      data: { glAccountId: glAccount1101.id },
    })
    console.log(`  → Linked BA-001 to GL Account 1101 (${glAccount1101.name})`)
  }

  // ──────────────────────────────────────────────
  // 2. Journal Entries
  // ──────────────────────────────────────────────
  console.log('\n--- Creating Journal Entries ---')

  let cashAccount = await prisma.account.findFirst({
    where: { organizationId: org.id, isBankAccount: true, isGroup: false, deletedAt: null },
  })
  // Fallback: find any ASSET detail account
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
    console.warn('  ⚠ Chart of Accounts missing required accounts. Skipping journal entries.')
    console.warn(`    cashAccount: ${cashAccount ? cashAccount.name : 'NOT FOUND'}`)
    console.warn(`    expenseAccount: ${expenseAccount ? expenseAccount.name : 'NOT FOUND'}`)
    console.warn(`    incomeAccount: ${incomeAccount ? incomeAccount.name : 'NOT FOUND'}`)
  } else {
    console.log(`  Using accounts:`)
    console.log(`    Cash/Bank: ${cashAccount.name} (${cashAccount.code})`)
    console.log(`    Expense: ${expenseAccount.name} (${expenseAccount.code})`)
    console.log(`    Income: ${incomeAccount.name} (${incomeAccount.code})`)

    const journalEntriesData = [
      {
        entryNo: 'JE-2026-001',
        date: new Date('2025-08-15'),
        description: 'Office rent payment - August 2025',
        debitAccountId: expenseAccount.id,
        creditAccountId: cashAccount.id,
        amount: new Prisma.Decimal('85000'),
        status: 'APPROVED',
      },
      {
        entryNo: 'JE-2026-002',
        date: new Date('2025-09-05'),
        description: 'Utility bills - Electricity & Water September 2025',
        debitAccountId: expenseAccount.id,
        creditAccountId: cashAccount.id,
        amount: new Prisma.Decimal('12500'),
        status: 'APPROVED',
      },
      {
        entryNo: 'JE-2026-003',
        date: new Date('2025-10-01'),
        description: 'Staff salary advance - October 2025',
        debitAccountId: expenseAccount.id,
        creditAccountId: cashAccount.id,
        amount: new Prisma.Decimal('200000'),
        status: 'APPROVED',
      },
      {
        entryNo: 'JE-2026-004',
        date: new Date('2025-11-20'),
        description: 'Donor fund received - USAID Q2 disbursement',
        debitAccountId: cashAccount.id,
        creditAccountId: incomeAccount.id,
        amount: new Prisma.Decimal('500000'),
        status: 'APPROVED',
      },
      {
        entryNo: 'JE-2026-005',
        date: new Date('2025-12-10'),
        description: 'Training workshop expense - Community Health Workers',
        debitAccountId: expenseAccount.id,
        creditAccountId: cashAccount.id,
        amount: new Prisma.Decimal('45000'),
        status: 'APPROVED',
      },
      {
        entryNo: 'JE-2026-006',
        date: new Date('2026-01-18'),
        description: 'Vehicle fuel - Field visit Sylhet Division',
        debitAccountId: expenseAccount.id,
        creditAccountId: cashAccount.id,
        amount: new Prisma.Decimal('8500'),
        status: 'DRAFT',
      },
      {
        entryNo: 'JE-2026-007',
        date: new Date('2026-02-25'),
        description: 'Stationery purchase - Head Office',
        debitAccountId: expenseAccount.id,
        creditAccountId: cashAccount.id,
        amount: new Prisma.Decimal('5200'),
        status: 'DRAFT',
      },
      {
        entryNo: 'JE-2026-008',
        date: new Date('2026-03-15'),
        description: 'Internet & phone bill - March 2026',
        debitAccountId: expenseAccount.id,
        creditAccountId: cashAccount.id,
        amount: new Prisma.Decimal('15000'),
        status: 'APPROVED',
      },
    ]

    for (const je of journalEntriesData) {
      const existing = await prisma.journalEntry.findFirst({
        where: { entryNo: je.entryNo },
      })

      if (existing) {
        console.log(`  - ${je.entryNo}: Already exists, skipping`)
        continue
      }

      const isApproved = je.status === 'APPROVED'
      const approvedAt = isApproved ? je.date : null
      const postedAt = isApproved ? je.date : null

      await prisma.journalEntry.create({
        data: {
          fiscalYearId: fy.id,
          entryNo: je.entryNo,
          date: je.date,
          description: je.description,
          totalDebit: je.amount,
          totalCredit: je.amount,
          status: je.status as any,
          createdById: adminUser.id,
          approvedById: isApproved ? adminUser.id : null,
          approvedAt,
          postedAt,
          lines: {
            create: [
              {
                accountId: je.debitAccountId,
                debit: je.amount,
                credit: new Prisma.Decimal('0'),
                description: je.description,
              },
              {
                accountId: je.creditAccountId,
                debit: new Prisma.Decimal('0'),
                credit: je.amount,
                description: je.description,
              },
            ],
          },
        },
      })

      console.log(`  ✓ ${je.entryNo}: ${je.description} (${je.status}) - ${je.amount} BDT`)
    }
  }

  // ──────────────────────────────────────────────
  // 3. Vouchers
  // ──────────────────────────────────────────────
  console.log('\n--- Creating Vouchers ---')

  const motherBankAccount = bankAccounts['BA-001']

  const vouchersData = [
    {
      voucherNo: 'DV-2026-001',
      date: new Date('2025-09-12'),
      type: 'DEBIT',
      description: 'Office Supplies Payment',
      amount: new Prisma.Decimal('25000'),
      payee: 'Hatil Furniture',
      status: 'APPROVED',
      bankAccountId: null,
      chequeNo: null,
    },
    {
      voucherNo: 'RV-2026-001',
      date: new Date('2025-10-20'),
      type: 'RECEIPT',
      description: 'Training Fee Received',
      amount: new Prisma.Decimal('50000'),
      payee: null,
      status: 'APPROVED',
      bankAccountId: motherBankAccount?.id || null,
      chequeNo: null,
    },
    {
      voucherNo: 'CV-2026-001',
      date: new Date('2025-11-05'),
      type: 'CASH',
      description: 'Petty Cash Replenishment',
      amount: new Prisma.Decimal('50000'),
      payee: null,
      status: 'APPROVED',
      bankAccountId: null,
      chequeNo: null,
    },
    {
      voucherNo: 'BV-2026-001',
      date: new Date('2026-01-10'),
      type: 'BANK',
      description: 'Vendor Payment - IT Equipment',
      amount: new Prisma.Decimal('185000'),
      payee: null,
      status: 'APPROVED',
      bankAccountId: motherBankAccount?.id || null,
      chequeNo: 'CHQ-4521',
    },
    {
      voucherNo: 'DV-2026-002',
      date: new Date('2026-02-28'),
      type: 'DEBIT',
      description: 'Travel Advance - Field Visit',
      amount: new Prisma.Decimal('15000'),
      payee: 'Md. Karim',
      status: 'DRAFT',
      bankAccountId: null,
      chequeNo: null,
    },
    {
      voucherNo: 'CV-2026-002',
      date: new Date('2026-03-20'),
      type: 'CASH',
      description: 'Emergency Relief Cash',
      amount: new Prisma.Decimal('100000'),
      payee: null,
      status: 'DRAFT',
      bankAccountId: null,
      chequeNo: null,
    },
  ]

  for (const v of vouchersData) {
    const existing = await prisma.voucher.findFirst({
      where: { organizationId: org.id, voucherNo: v.voucherNo },
    })

    if (existing) {
      console.log(`  - ${v.voucherNo}: Already exists, skipping`)
      continue
    }

    const isApproved = v.status === 'APPROVED'

    await prisma.voucher.create({
      data: {
        organizationId: org.id,
        voucherNo: v.voucherNo,
        date: v.date,
        type: v.type as any,
        description: v.description,
        amount: v.amount,
        payee: v.payee,
        status: v.status as any,
        chequeNo: v.chequeNo,
        bankAccountId: v.bankAccountId,
        preparedById: adminUser.id,
        approvedById: isApproved ? adminUser.id : null,
        approvedAt: isApproved ? v.date : null,
      },
    })

    console.log(`  ✓ ${v.voucherNo}: ${v.description} (${v.type}, ${v.status}) - ${v.amount} BDT`)
  }

  // ──────────────────────────────────────────────
  // 4. Number Sequences
  // ──────────────────────────────────────────────
  console.log('\n--- Setting up Number Sequences ---')

  const sequences = [
    { entity: 'journal_entry', prefix: 'JE', currentValue: 8 },
    { entity: 'voucher_dv', prefix: 'DV', currentValue: 2 },
    { entity: 'voucher_rv', prefix: 'RV', currentValue: 1 },
    { entity: 'voucher_cv', prefix: 'CV', currentValue: 2 },
    { entity: 'voucher_bv', prefix: 'BV', currentValue: 1 },
  ]

  for (const seq of sequences) {
    await prisma.numberSequence.upsert({
      where: {
        organizationId_entity: {
          organizationId: org.id,
          entity: seq.entity,
        },
      },
      create: {
        organizationId: org.id,
        entity: seq.entity,
        prefix: seq.prefix,
        currentValue: seq.currentValue,
      },
      update: {
        currentValue: seq.currentValue,
      },
    })

    console.log(`  ✓ ${seq.entity}: ${seq.prefix}-${fy.name.slice(-4)}-*** (next: ${seq.currentValue + 1})`)
  }

  console.log('\n✅ Finance demo data seeded successfully!')
}

main()
  .then(async () => {
    console.log('Done!')
    await pool.end()
    process.exit(0)
  })
  .catch(async (e) => {
    console.error(e)
    await pool.end()
    process.exit(1)
  })
