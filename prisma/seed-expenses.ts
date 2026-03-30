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

  // Check for employees
  const employees = await prisma.employee.findMany({
    where: { organizationId: org.id },
    take: 5,
    orderBy: { createdAt: 'asc' },
  })
  const employeeId = employees.length > 0 ? employees[0].id : adminUser.id
  const secondEmployeeId = employees.length > 1 ? employees[1].id : adminUser.id

  console.log(`Organization: ${org.name} (${org.id})`)
  console.log(`Admin user: ${adminUser.fullName} (${adminUser.id})`)
  console.log(`Fiscal year: ${fy.name} (${fy.id})`)
  console.log(`Employees found: ${employees.length}`)

  // ──────────────────────────────────────────────
  // 1. Expense Categories (with GL Account mapping)
  // ──────────────────────────────────────────────
  console.log('\n--- Creating Expense Categories ---')

  const glAccountMappings: Record<string, string> = {
    '5205': 'Transport',
    '5303': 'Meals & Refreshments',
    '5403': 'Office Supplies',
    '5503': 'Communication',
    '5204': 'Fuel',
    '5508': 'Stationery',
    '5504': 'Courier',
    '5201': 'Accommodation',
    '5404': 'Program Supplies',
    '5900': 'Miscellaneous',
  }

  // Fetch GL accounts
  const glAccounts = await prisma.account.findMany({
    where: {
      organizationId: org.id,
      code: { in: Object.keys(glAccountMappings) },
    },
  })
  const glAccountMap = new Map(glAccounts.map(a => [a.code, a.id]))

  const categories = [
    { code: 'EXP-TRANSPORT', name: 'Transport', glCode: '5205', budgetCategory: 'Travel', requiresReceipt: true, sortOrder: 1 },
    { code: 'EXP-MEALS', name: 'Meals & Refreshments', glCode: '5303', budgetCategory: 'Venue & Catering', requiresReceipt: true, sortOrder: 2 },
    { code: 'EXP-OFFICE', name: 'Office Supplies', glCode: '5403', budgetCategory: 'Office Supplies', requiresReceipt: true, sortOrder: 3 },
    { code: 'EXP-COMM', name: 'Communication', glCode: '5503', budgetCategory: 'Communications', requiresReceipt: false, sortOrder: 4 },
    { code: 'EXP-FUEL', name: 'Fuel', glCode: '5204', budgetCategory: 'Vehicle Maintenance', requiresReceipt: true, sortOrder: 5 },
    { code: 'EXP-STATIONERY', name: 'Stationery', glCode: '5508', budgetCategory: 'Printing', requiresReceipt: true, sortOrder: 6 },
    { code: 'EXP-COURIER', name: 'Courier', glCode: '5504', budgetCategory: 'Communications', requiresReceipt: true, sortOrder: 7 },
    { code: 'EXP-ACCOMM', name: 'Accommodation', glCode: '5201', budgetCategory: 'Travel', requiresReceipt: true, sortOrder: 8 },
    { code: 'EXP-PROGSUP', name: 'Program Supplies', glCode: '5404', budgetCategory: 'Program Supplies', requiresReceipt: true, sortOrder: 9 },
    { code: 'EXP-MISC', name: 'Miscellaneous', glCode: '5900', budgetCategory: 'Contingency', requiresReceipt: false, sortOrder: 10 },
  ]

  for (const cat of categories) {
    await prisma.expenseCategory.upsert({
      where: {
        organizationId_code: {
          organizationId: org.id,
          code: cat.code,
        },
      },
      create: {
        organizationId: org.id,
        code: cat.code,
        name: cat.name,
        glAccountId: glAccountMap.get(cat.glCode) ?? null,
        budgetCategory: cat.budgetCategory,
        requiresReceipt: cat.requiresReceipt,
        sortOrder: cat.sortOrder,
      },
      update: {
        name: cat.name,
        glAccountId: glAccountMap.get(cat.glCode) ?? null,
        budgetCategory: cat.budgetCategory,
        requiresReceipt: cat.requiresReceipt,
        sortOrder: cat.sortOrder,
      },
    })
    console.log(`  ✓ ${cat.code}: ${cat.name} → GL ${cat.glCode} (${glAccountMap.has(cat.glCode) ? 'linked' : 'no GL match'})`)
  }

  // ──────────────────────────────────────────────
  // 2. Per Diem Rates (8 Bangladesh locations)
  // ──────────────────────────────────────────────
  console.log('\n--- Creating Per Diem Rates ---')

  const perDiemRates = [
    { name: 'Dhaka City', location: 'Dhaka', locationType: 'CAPITAL', fullDayRate: 5500, halfDayRate: 3300, overnightRate: 2500, mealsOnlyRate: 1800 },
    { name: 'Chittagong City', location: 'Chittagong', locationType: 'DIVISION', fullDayRate: 4500, halfDayRate: 2700, overnightRate: 2000, mealsOnlyRate: 1500 },
    { name: 'Sylhet City', location: 'Sylhet', locationType: 'DIVISION', fullDayRate: 4000, halfDayRate: 2400, overnightRate: 1800, mealsOnlyRate: 1200 },
    { name: 'Rajshahi City', location: 'Rajshahi', locationType: 'DIVISION', fullDayRate: 3800, halfDayRate: 2300, overnightRate: 1700, mealsOnlyRate: 1100 },
    { name: 'Khulna City', location: 'Khulna', locationType: 'DIVISION', fullDayRate: 3800, halfDayRate: 2300, overnightRate: 1700, mealsOnlyRate: 1100 },
    { name: 'District HQ', location: 'District HQ', locationType: 'DISTRICT', fullDayRate: 3500, halfDayRate: 2100, overnightRate: 1500, mealsOnlyRate: 1000 },
    { name: 'Upazila Level', location: 'Upazila', locationType: 'UPAZILA', fullDayRate: 2800, halfDayRate: 1700, overnightRate: 1200, mealsOnlyRate: 800 },
    { name: 'Rural Area', location: 'Rural', locationType: 'RURAL', fullDayRate: 2000, halfDayRate: 1200, overnightRate: 800, mealsOnlyRate: 600 },
  ]

  // Delete existing per diem rates to re-create cleanly (no unique constraint on location)
  await prisma.perDiemRate.deleteMany({ where: { organizationId: org.id } })

  for (const rate of perDiemRates) {
    await prisma.perDiemRate.create({
      data: {
        organizationId: org.id,
        name: rate.name,
        location: rate.location,
        locationType: rate.locationType,
        fullDayRate: rate.fullDayRate,
        halfDayRate: rate.halfDayRate,
        overnightRate: rate.overnightRate,
        mealsOnlyRate: rate.mealsOnlyRate,
        effectiveFrom: new Date('2025-07-01'),
        isActive: true,
      },
    })
    console.log(`  ✓ ${rate.location}: Full=${rate.fullDayRate}, Half=${rate.halfDayRate}, Overnight=${rate.overnightRate}, Meals=${rate.mealsOnlyRate} BDT`)
  }

  // ──────────────────────────────────────────────
  // 3. Petty Cash Funds (3 funds with BankAccount)
  // ──────────────────────────────────────────────
  console.log('\n--- Creating Petty Cash Funds ---')

  const pettyCashFunds = [
    { code: 'PCF-HQ', name: 'HQ Dhaka Petty Cash', location: 'Dhaka HQ', imprest: 50000, bankCode: 'CASH-HQ', bankName: 'HQ Dhaka Cash Box' },
    { code: 'PCF-SYL', name: 'Sylhet Field Office Petty Cash', location: 'Sylhet Field Office', imprest: 30000, bankCode: 'CASH-SYL', bankName: 'Sylhet Field Cash Box' },
    { code: 'PCF-CXB', name: "Cox's Bazar Field Office Petty Cash", location: "Cox's Bazar Field Office", imprest: 20000, bankCode: 'CASH-CXB', bankName: "Cox's Bazar Field Cash Box" },
  ]

  const fundIds: string[] = []

  for (const fund of pettyCashFunds) {
    // Create or upsert CASH bank account for each fund
    const bankAccount = await prisma.bankAccount.upsert({
      where: {
        organizationId_accountCode: {
          organizationId: org.id,
          accountCode: fund.bankCode,
        },
      },
      create: {
        organizationId: org.id,
        accountCode: fund.bankCode,
        accountName: fund.bankName,
        type: 'CASH' as any,
        currencyCode: 'BDT' as any,
        currentBalance: fund.imprest,
        isActive: true,
        description: `Cash account for ${fund.name}`,
      },
      update: {
        accountName: fund.bankName,
        currentBalance: fund.imprest,
      },
    })

    const pettyCash = await prisma.pettyCashFund.upsert({
      where: {
        organizationId_code: {
          organizationId: org.id,
          code: fund.code,
        },
      },
      create: {
        organizationId: org.id,
        code: fund.code,
        name: fund.name,
        imprestAmount: fund.imprest,
        currentBalance: fund.imprest,
        custodianId: adminUser.id,
        bankAccountId: bankAccount.id,
        location: fund.location,
        isActive: true,
      },
      update: {
        name: fund.name,
        imprestAmount: fund.imprest,
        currentBalance: fund.imprest,
        bankAccountId: bankAccount.id,
        location: fund.location,
      },
    })

    fundIds.push(pettyCash.id)
    console.log(`  ✓ ${fund.code}: ${fund.name} (Imprest: BDT ${fund.imprest}) → Bank: ${fund.bankCode}`)
  }

  // ──────────────────────────────────────────────
  // 4. Petty Cash Transactions (15 across 3 funds)
  // ──────────────────────────────────────────────
  console.log('\n--- Creating Petty Cash Transactions ---')

  // Delete existing transactions for these funds to re-create
  for (const fundId of fundIds) {
    await prisma.pettyCashTransaction.deleteMany({ where: { fundId } })
  }

  const transactions = [
    // Fund 0 (HQ Dhaka) — 6 transactions
    { fundIdx: 0, no: 'PCT-2526-001', date: '2026-01-05', action: 'OPENING_BALANCE', amount: 50000, balanceAfter: 50000, description: 'Opening balance - HQ petty cash', category: null },
    { fundIdx: 0, no: 'PCT-2526-002', date: '2026-01-10', action: 'EXPENSE', amount: 2500, balanceAfter: 47500, description: 'Office stationery purchase', category: 'Stationery' },
    { fundIdx: 0, no: 'PCT-2526-003', date: '2026-01-18', action: 'EXPENSE', amount: 1800, balanceAfter: 45700, description: 'Courier charges - Sylhet documents', category: 'Courier' },
    { fundIdx: 0, no: 'PCT-2526-004', date: '2026-02-02', action: 'EXPENSE', amount: 3200, balanceAfter: 42500, description: 'Staff lunch for donor meeting', category: 'Meals & Refreshments' },
    { fundIdx: 0, no: 'PCT-2526-005', date: '2026-02-15', action: 'EXPENSE', amount: 1500, balanceAfter: 41000, description: 'Auto-rickshaw for field visit', category: 'Transport' },
    { fundIdx: 0, no: 'PCT-2526-006', date: '2026-03-01', action: 'REPLENISHMENT', amount: 9000, balanceAfter: 50000, description: 'Replenishment - March 2026', category: null },

    // Fund 1 (Sylhet) — 5 transactions
    { fundIdx: 1, no: 'PCT-2526-007', date: '2026-01-05', action: 'OPENING_BALANCE', amount: 30000, balanceAfter: 30000, description: 'Opening balance - Sylhet field office', category: null },
    { fundIdx: 1, no: 'PCT-2526-008', date: '2026-01-22', action: 'EXPENSE', amount: 4000, balanceAfter: 26000, description: 'Fuel for project vehicle', category: 'Fuel' },
    { fundIdx: 1, no: 'PCT-2526-009', date: '2026-02-05', action: 'EXPENSE', amount: 1200, balanceAfter: 24800, description: 'Mobile recharge for field staff', category: 'Communication' },
    { fundIdx: 1, no: 'PCT-2526-010', date: '2026-02-20', action: 'EXPENSE', amount: 2800, balanceAfter: 22000, description: 'Training materials printing', category: 'Stationery' },
    { fundIdx: 1, no: 'PCT-2526-011', date: '2026-03-10', action: 'REPLENISHMENT', amount: 8000, balanceAfter: 30000, description: 'Replenishment - March 2026', category: null },

    // Fund 2 (Cox's Bazar) — 4 transactions
    { fundIdx: 2, no: 'PCT-2526-012', date: '2026-01-05', action: 'OPENING_BALANCE', amount: 20000, balanceAfter: 20000, description: "Opening balance - Cox's Bazar field office", category: null },
    { fundIdx: 2, no: 'PCT-2526-013', date: '2026-01-28', action: 'EXPENSE', amount: 3500, balanceAfter: 16500, description: 'Community meeting refreshments', category: 'Meals & Refreshments' },
    { fundIdx: 2, no: 'PCT-2526-014', date: '2026-02-12', action: 'EXPENSE', amount: 2000, balanceAfter: 14500, description: 'Program supplies for beneficiaries', category: 'Program Supplies' },
    { fundIdx: 2, no: 'PCT-2526-015', date: '2026-03-05', action: 'REPLENISHMENT', amount: 5500, balanceAfter: 20000, description: 'Replenishment - March 2026', category: null },
  ]

  for (const tx of transactions) {
    await prisma.pettyCashTransaction.create({
      data: {
        fundId: fundIds[tx.fundIdx],
        transactionNo: tx.no,
        date: new Date(tx.date),
        action: tx.action as any,
        amount: tx.amount,
        balanceAfter: tx.balanceAfter,
        description: tx.description,
        category: tx.category,
        recordedById: adminUser.id,
      },
    })
    console.log(`  ✓ ${tx.no}: ${tx.action} ${tx.amount} BDT — ${tx.description}`)
  }

  // ──────────────────────────────────────────────
  // 5. Expense Claims (5 claims with items)
  // ──────────────────────────────────────────────
  console.log('\n--- Creating Expense Claims ---')

  // Delete existing claims for idempotency
  const existingClaims = await prisma.expenseClaim.findMany({
    where: { organizationId: org.id, claimNo: { in: ['EC-2526-0001', 'EC-2526-0002', 'EC-2526-0003', 'EC-2526-0004', 'EC-2526-0005'] } },
  })
  for (const c of existingClaims) {
    await prisma.expenseClaimItem.deleteMany({ where: { claimId: c.id } })
    await prisma.expenseClaim.delete({ where: { id: c.id } })
  }

  const claimsData = [
    {
      claimNo: 'EC-2526-0001',
      purpose: 'Travel to Sylhet field visit',
      status: 'PAID',
      totalAmount: 12500,
      approvedAmount: 12500,
      employeeId: employeeId,
      claimDate: '2026-01-15',
      travelStartDate: '2026-01-12',
      travelEndDate: '2026-01-14',
      paidAt: '2026-01-25',
      items: [
        { date: '2026-01-12', category: 'Transport', description: 'Bus ticket Dhaka to Sylhet', amount: 3500, hasReceipt: true },
        { date: '2026-01-13', category: 'Accommodation', description: 'Hotel for 2 nights', amount: 5000, hasReceipt: true },
        { date: '2026-01-14', category: 'Meals & Refreshments', description: 'Meals during travel', amount: 4000, hasReceipt: false, noReceiptReason: 'Small roadside eateries' },
      ],
    },
    {
      claimNo: 'EC-2526-0002',
      purpose: 'Workshop materials procurement',
      status: 'FINANCE_APPROVED',
      totalAmount: 8200,
      approvedAmount: 8200,
      employeeId: secondEmployeeId,
      claimDate: '2026-02-10',
      items: [
        { date: '2026-02-08', category: 'Office Supplies', description: 'Flipcharts, markers, and notebooks', amount: 4800, hasReceipt: true },
        { date: '2026-02-09', category: 'Stationery', description: 'Printing of training handouts', amount: 3400, hasReceipt: true },
      ],
    },
    {
      claimNo: 'EC-2526-0003',
      purpose: 'Office supplies purchase - monthly',
      status: 'SUBMITTED',
      totalAmount: 5800,
      employeeId: employeeId,
      claimDate: '2026-03-05',
      items: [
        { date: '2026-03-01', category: 'Office Supplies', description: 'Printer cartridges', amount: 2200, hasReceipt: true },
        { date: '2026-03-02', category: 'Stationery', description: 'A4 paper (10 reams)', amount: 1500, hasReceipt: true },
        { date: '2026-03-03', category: 'Communication', description: 'Postage stamps and envelopes', amount: 800, hasReceipt: true },
        { date: '2026-03-04', category: 'Office Supplies', description: 'Filing folders and binders', amount: 1300, hasReceipt: true },
      ],
    },
    {
      claimNo: 'EC-2526-0004',
      purpose: 'Field visit transport expenses',
      status: 'DRAFT',
      totalAmount: 3500,
      employeeId: secondEmployeeId,
      claimDate: '2026-03-20',
      items: [
        { date: '2026-03-18', category: 'Transport', description: 'CNG auto to project site', amount: 1500, hasReceipt: false, noReceiptReason: 'CNG auto - no receipt issued' },
        { date: '2026-03-19', category: 'Fuel', description: 'Fuel for motorbike', amount: 2000, hasReceipt: true },
      ],
    },
    {
      claimNo: 'EC-2526-0005',
      purpose: 'Training venue booking',
      status: 'REJECTED',
      totalAmount: 15000,
      employeeId: employeeId,
      claimDate: '2026-02-20',
      rejectionReason: 'Venue cost exceeds approved budget. Please use community center instead.',
      items: [
        { date: '2026-02-18', category: 'Accommodation', description: 'Conference room rental for 2-day training', amount: 15000, hasReceipt: true },
      ],
    },
  ]

  for (const claim of claimsData) {
    const created = await prisma.expenseClaim.create({
      data: {
        organizationId: org.id,
        claimNo: claim.claimNo,
        employeeId: claim.employeeId,
        claimDate: new Date(claim.claimDate),
        totalAmount: claim.totalAmount,
        approvedAmount: claim.approvedAmount ?? null,
        purpose: claim.purpose,
        status: claim.status as any,
        travelStartDate: claim.travelStartDate ? new Date(claim.travelStartDate) : null,
        travelEndDate: claim.travelEndDate ? new Date(claim.travelEndDate) : null,
        paidAt: claim.paidAt ? new Date(claim.paidAt) : null,
        rejectionReason: claim.rejectionReason ?? null,
        netPayable: claim.approvedAmount ?? null,
        items: {
          create: claim.items.map((item, idx) => ({
            date: new Date(item.date),
            category: item.category,
            description: item.description,
            amount: item.amount,
            approvedAmount: claim.approvedAmount ? item.amount : null,
            hasReceipt: item.hasReceipt,
            noReceiptReason: (item as any).noReceiptReason ?? null,
            sortOrder: idx + 1,
          })),
        },
      },
    })
    console.log(`  ✓ ${claim.claimNo}: ${claim.purpose} (${claim.status}) — BDT ${claim.totalAmount}`)
  }

  // ──────────────────────────────────────────────
  // 6. Employee Advances (3 advances)
  // ──────────────────────────────────────────────
  console.log('\n--- Creating Employee Advances ---')

  // Delete existing advances for idempotency
  await prisma.employeeAdvance.deleteMany({
    where: { organizationId: org.id, advanceNo: { in: ['ADV-2526-0001', 'ADV-2526-0002', 'ADV-2526-0003'] } },
  })

  const advances = [
    {
      advanceNo: 'ADV-2526-0001',
      employeeId: employeeId,
      purpose: 'Travel to Rangpur field offices',
      advanceType: 'TRAVEL',
      estimatedAmount: 15000,
      approvedAmount: 15000,
      disbursedAmount: 15000,
      settledAmount: 13200,
      refundAmount: 1800,
      status: 'SETTLED',
      requestDate: '2026-01-10',
      travelStartDate: '2026-01-15',
      travelEndDate: '2026-01-17',
      expectedSettlementDate: '2026-01-24',
      disbursedAt: '2026-01-14',
      settledAt: '2026-01-22',
      approvedAt: '2026-01-12',
    },
    {
      advanceNo: 'ADV-2526-0002',
      employeeId: secondEmployeeId,
      purpose: "Workshop in Cox's Bazar",
      advanceType: 'ACTIVITY',
      estimatedAmount: 25000,
      approvedAmount: 25000,
      disbursedAmount: 25000,
      status: 'DISBURSED',
      requestDate: '2026-03-01',
      travelStartDate: '2026-03-20',
      travelEndDate: '2026-03-23',
      expectedSettlementDate: '2026-03-30',
      disbursedAt: '2026-03-18',
      approvedAt: '2026-03-05',
    },
    {
      advanceNo: 'ADV-2526-0003',
      employeeId: employeeId,
      purpose: 'Field survey in Sylhet division',
      advanceType: 'TRAVEL',
      estimatedAmount: 10000,
      status: 'REQUESTED',
      requestDate: '2026-03-25',
      travelStartDate: '2026-04-05',
      travelEndDate: '2026-04-08',
      expectedSettlementDate: '2026-04-15',
    },
  ]

  for (const adv of advances) {
    await prisma.employeeAdvance.create({
      data: {
        organizationId: org.id,
        advanceNo: adv.advanceNo,
        employeeId: adv.employeeId,
        requestDate: new Date(adv.requestDate),
        purpose: adv.purpose,
        advanceType: adv.advanceType as any,
        estimatedAmount: adv.estimatedAmount,
        approvedAmount: adv.approvedAmount ?? null,
        disbursedAmount: adv.disbursedAmount ?? null,
        settledAmount: adv.settledAmount ?? null,
        refundAmount: adv.refundAmount ?? null,
        status: adv.status as any,
        travelStartDate: adv.travelStartDate ? new Date(adv.travelStartDate) : null,
        travelEndDate: adv.travelEndDate ? new Date(adv.travelEndDate) : null,
        expectedSettlementDate: adv.expectedSettlementDate ? new Date(adv.expectedSettlementDate) : null,
        disbursedAt: adv.disbursedAt ? new Date(adv.disbursedAt) : null,
        settledAt: adv.settledAt ? new Date(adv.settledAt) : null,
        approvedById: adv.approvedAt ? adminUser.id : null,
        approvedAt: adv.approvedAt ? new Date(adv.approvedAt) : null,
      },
    })
    console.log(`  ✓ ${adv.advanceNo}: ${adv.purpose} (${adv.status}) — BDT ${adv.estimatedAmount}`)
  }

  // ──────────────────────────────────────────────
  // 7. Number Sequences
  // ──────────────────────────────────────────────
  console.log('\n--- Setting up Number Sequences ---')

  const sequences = [
    { entity: 'expense_claim', prefix: 'EC', currentValue: 5 },
    { entity: 'employee_advance', prefix: 'ADV', currentValue: 3 },
    { entity: 'petty_cash_txn', prefix: 'PCT', currentValue: 15 },
    { entity: 'petty_cash_fund', prefix: 'PCF', currentValue: 3 },
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
    console.log(`  ✓ ${seq.entity}: ${seq.prefix}-*** (current: ${seq.currentValue})`)
  }

  console.log('\n✅ Daily Expense Management demo data seeded successfully!')
}

main()
  .then(async () => {
    console.log('Done!')
    await pool.end()
    process.exit(0)
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e)
    await pool.end()
    process.exit(1)
  })
