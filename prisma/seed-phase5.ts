/**
 * Phase 5 Seed: Procurement, Assets, HR, Microfinance
 * Run after Phase 4 seed: npx tsx prisma/seed-phase5.ts
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ngo_erp?schema=public',
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding Phase 5 data...')

  const org = await prisma.organization.findUnique({ where: { slug: 'shapla-foundation' } })
  if (!org) throw new Error('Org not found')

  const washProject = await prisma.project.findFirst({ where: { organizationId: org.id, name: { contains: 'Water' } } }) ?? await prisma.project.findFirst({ where: { organizationId: org.id } })

  // ═══ PROCUREMENT ═══

  const vendors = await Promise.all([
    prisma.vendor.create({ data: { organizationId: org.id, vendorNo: 'VND-2026-001', companyName: 'TechBD Solutions', category: 'IT', contactPerson: 'Arif Rahman', phone: '01711222333', email: 'arif@techbd.com', rating: 4.5, isApproved: true } }),
    prisma.vendor.create({ data: { organizationId: org.id, vendorNo: 'VND-2026-002', companyName: 'Bengal Scientific Supplies', category: 'Equipment', contactPerson: 'Kamal Uddin', phone: '01811333444', email: 'kamal@bengalscientific.com', rating: 4.2, isApproved: true } }),
    prisma.vendor.create({ data: { organizationId: org.id, vendorNo: 'VND-2026-003', companyName: 'Rahman Construction Ltd', category: 'Construction', contactPerson: 'Md. Rahman', phone: '01911444555', email: 'info@rahmanconstruction.com', rating: 3.8, isApproved: true } }),
  ])
  console.log(`✓ ${vendors.length} Vendors created`)

  const warehouses = await Promise.all([
    prisma.warehouse.create({ data: { organizationId: org.id, code: 'WH-DHK', name: 'Dhaka HQ Warehouse', location: 'Dhanmondi, Dhaka', capacity: 5000 } }),
    prisma.warehouse.create({ data: { organizationId: org.id, code: 'WH-SYL', name: 'Sylhet Field Store', location: 'Sylhet Sadar', capacity: 2000 } }),
  ])
  console.log(`✓ ${warehouses.length} Warehouses created`)

  // Inventory items
  await Promise.all([
    prisma.inventoryItem.create({ data: { itemCode: 'WTK-001', name: 'Water Testing Kit (H2S)', category: 'Equipment', unit: 'pcs', warehouseId: warehouses[1].id, stockInHand: 350, reorderLevel: 100, unitPrice: 1200, totalValue: 420000, status: 'IN_STOCK' } }),
    prisma.inventoryItem.create({ data: { itemCode: 'TRP-001', name: 'Tarpaulin Sheet', category: 'Relief', unit: 'pcs', warehouseId: warehouses[0].id, stockInHand: 150, reorderLevel: 500, unitPrice: 2500, totalValue: 375000, status: 'LOW_STOCK' } }),
    prisma.inventoryItem.create({ data: { itemCode: 'ORS-001', name: 'ORS Packet', category: 'Health', unit: 'pcs', warehouseId: warehouses[1].id, stockInHand: 0, reorderLevel: 1000, unitPrice: 15, totalValue: 0, status: 'OUT_OF_STOCK' } }),
  ])
  console.log('✓ 3 Inventory Items created')

  // ═══ FIXED ASSETS ═══

  const assetCategories = await Promise.all([
    prisma.assetCategory.create({ data: { organizationId: org.id, code: 'VEH', name: 'Vehicles', usefulLifeYears: 5, depreciationMethod: 'STRAIGHT_LINE', depreciationRate: 20 } }),
    prisma.assetCategory.create({ data: { organizationId: org.id, code: 'IT', name: 'IT Equipment', usefulLifeYears: 3, depreciationMethod: 'STRAIGHT_LINE', depreciationRate: 33.33 } }),
    prisma.assetCategory.create({ data: { organizationId: org.id, code: 'FUR', name: 'Furniture', usefulLifeYears: 10, depreciationMethod: 'STRAIGHT_LINE', depreciationRate: 10 } }),
  ])

  await Promise.all([
    prisma.asset.create({ data: { assetNo: 'AST-2026-001', name: 'Toyota Hilux Double Cab', categoryId: assetCategories[0].id, purchaseDate: new Date('2024-01-15'), purchasePrice: 2500000, netBookValue: 1500000, accumulatedDepreciation: 1000000, warehouseId: warehouses[0].id, projectId: washProject!.id, condition: 'GOOD' } }),
    prisma.asset.create({ data: { assetNo: 'AST-2026-002', name: 'Dell Laptop Latitude 5540', categoryId: assetCategories[1].id, purchaseDate: new Date('2025-06-01'), purchasePrice: 95000, netBookValue: 68500, accumulatedDepreciation: 26500, warehouseId: warehouses[0].id, condition: 'GOOD' } }),
    prisma.asset.create({ data: { assetNo: 'AST-2026-003', name: 'Dell Laptop Latitude 5540', categoryId: assetCategories[1].id, purchaseDate: new Date('2025-06-01'), purchasePrice: 95000, netBookValue: 68500, accumulatedDepreciation: 26500, warehouseId: warehouses[1].id, projectId: washProject!.id, condition: 'GOOD' } }),
    prisma.asset.create({ data: { assetNo: 'AST-2026-004', name: 'Conference Table (12-seat)', categoryId: assetCategories[2].id, purchaseDate: new Date('2023-03-10'), purchasePrice: 45000, netBookValue: 31500, accumulatedDepreciation: 13500, warehouseId: warehouses[0].id, condition: 'FAIR' } }),
  ])
  console.log('✓ 3 Asset Categories + 4 Assets created')

  // ═══ HUMAN RESOURCES ═══

  const departments = await Promise.all([
    prisma.department.create({ data: { organizationId: org.id, name: 'Finance & Accounts', code: 'FIN' } }),
    prisma.department.create({ data: { organizationId: org.id, name: 'Programs', code: 'PRG' } }),
    prisma.department.create({ data: { organizationId: org.id, name: 'Human Resources', code: 'HRD' } }),
    prisma.department.create({ data: { organizationId: org.id, name: 'Field Operations', code: 'FLD' } }),
    prisma.department.create({ data: { organizationId: org.id, name: 'IT & Systems', code: 'ITS' } }),
  ])

  const designations = await Promise.all([
    prisma.designation.upsert({ where: { title: 'Executive Director' }, update: {}, create: { title: 'Executive Director', level: 1 } }),
    prisma.designation.upsert({ where: { title: 'Finance Head' }, update: {}, create: { title: 'Finance Head', level: 2 } }),
    prisma.designation.upsert({ where: { title: 'Program Manager' }, update: {}, create: { title: 'Program Manager', level: 2 } }),
    prisma.designation.upsert({ where: { title: 'Field Coordinator' }, update: {}, create: { title: 'Field Coordinator', level: 3 } }),
    prisma.designation.upsert({ where: { title: 'Accountant' }, update: {}, create: { title: 'Accountant', level: 3 } }),
    prisma.designation.upsert({ where: { title: 'HR Officer' }, update: {}, create: { title: 'HR Officer', level: 3 } }),
    prisma.designation.upsert({ where: { title: 'IT Officer' }, update: {}, create: { title: 'IT Officer', level: 3 } }),
  ])

  const employees = await Promise.all([
    prisma.employee.create({ data: { organizationId: org.id, employeeNo: 'EMP-001', fullName: 'Karim Ahmed', gender: 'Male', departmentId: departments[0].id, designationId: designations[1].id, employmentType: 'FULL_TIME', joiningDate: new Date('2020-01-15'), status: 'ACTIVE', basicSalary: 85000, phone: '01712111222' } }),
    prisma.employee.create({ data: { organizationId: org.id, employeeNo: 'EMP-002', fullName: 'Nasima Akter', gender: 'Female', departmentId: departments[0].id, designationId: designations[4].id, employmentType: 'FULL_TIME', joiningDate: new Date('2021-06-01'), status: 'ACTIVE', basicSalary: 45000, phone: '01812222333' } }),
    prisma.employee.create({ data: { organizationId: org.id, employeeNo: 'EMP-003', fullName: 'Mahbub Alam', gender: 'Male', departmentId: departments[3].id, designationId: designations[3].id, employmentType: 'FULL_TIME', joiningDate: new Date('2022-03-10'), status: 'ACTIVE', basicSalary: 55000, phone: '01912333444' } }),
    prisma.employee.create({ data: { organizationId: org.id, employeeNo: 'EMP-004', fullName: 'Fatema Khatun', gender: 'Female', departmentId: departments[1].id, designationId: designations[2].id, employmentType: 'FULL_TIME', joiningDate: new Date('2019-08-01'), status: 'ACTIVE', basicSalary: 75000, phone: '01612444555' } }),
    prisma.employee.create({ data: { organizationId: org.id, employeeNo: 'EMP-005', fullName: 'Rafiqul Islam', gender: 'Male', departmentId: departments[3].id, designationId: designations[3].id, employmentType: 'CONTRACT', joiningDate: new Date('2025-07-01'), endDate: new Date('2027-06-30'), status: 'ACTIVE', basicSalary: 40000, phone: '01512555666' } }),
    prisma.employee.create({ data: { organizationId: org.id, employeeNo: 'EMP-006', fullName: 'Taslima Begum', gender: 'Female', departmentId: departments[2].id, designationId: designations[5].id, employmentType: 'FULL_TIME', joiningDate: new Date('2023-01-15'), status: 'ACTIVE', basicSalary: 50000, phone: '01312666777' } }),
  ])
  console.log(`✓ ${departments.length} Departments + ${designations.length} Designations + ${employees.length} Employees created`)

  // Leave types
  const leaveTypes = await Promise.all([
    prisma.leaveType.upsert({ where: { code: 'AL' }, update: {}, create: { name: 'Annual Leave', code: 'AL', daysPerYear: 15, isCarryForward: true, maxCarryForward: 10 } }),
    prisma.leaveType.upsert({ where: { code: 'CL' }, update: {}, create: { name: 'Casual Leave', code: 'CL', daysPerYear: 10 } }),
    prisma.leaveType.upsert({ where: { code: 'SL' }, update: {}, create: { name: 'Sick Leave', code: 'SL', daysPerYear: 14 } }),
    prisma.leaveType.upsert({ where: { code: 'ML' }, update: {}, create: { name: 'Maternity Leave', code: 'ML', daysPerYear: 112 } }),
    prisma.leaveType.upsert({ where: { code: 'WP' }, update: {}, create: { name: 'Without Pay', code: 'WP', daysPerYear: 365, isPaid: false } }),
  ])
  console.log(`✓ ${leaveTypes.length} Leave Types created`)

  // ═══ MICROFINANCE ═══

  const branches = await Promise.all([
    prisma.branch.create({ data: { organizationId: org.id, code: 'BR-SYL', name: 'Sylhet Branch', location: 'Sylhet Sadar' } }),
    prisma.branch.create({ data: { organizationId: org.id, code: 'BR-BAR', name: 'Barishal Branch', location: 'Bakerganj, Barishal' } }),
  ])

  const samities = await Promise.all([
    prisma.samity.create({ data: { samityNo: 'SMT-2026-001', name: 'Shapla Mohila Samity', branchId: branches[0].id, formationDate: new Date('2024-01-15'), meetingDay: 'Saturday', meetingTime: '09:00 AM', totalMembers: 3, status: 'ACTIVE', location: 'Khadimpara, Sylhet' } }),
    prisma.samity.create({ data: { samityNo: 'SMT-2026-002', name: 'Padma Unnayan Samity', branchId: branches[0].id, formationDate: new Date('2024-06-01'), meetingDay: 'Sunday', meetingTime: '10:00 AM', totalMembers: 2, status: 'ACTIVE', location: 'Mogalgaon, Sylhet' } }),
  ])

  // Get some beneficiaries to link as MFI members
  const bens = await prisma.beneficiary.findMany({ where: { organizationId: org.id }, take: 5, orderBy: { beneficiaryNo: 'asc' } })

  const members = await Promise.all([
    prisma.mFIMember.create({ data: { memberNo: 'MBR-001', beneficiaryId: bens[0].id, samityId: samities[0].id, admissionDate: new Date('2024-02-01') } }),
    prisma.mFIMember.create({ data: { memberNo: 'MBR-002', beneficiaryId: bens[1].id, samityId: samities[0].id, admissionDate: new Date('2024-02-01') } }),
    prisma.mFIMember.create({ data: { memberNo: 'MBR-003', beneficiaryId: bens[2].id, samityId: samities[0].id, admissionDate: new Date('2024-03-15') } }),
    prisma.mFIMember.create({ data: { memberNo: 'MBR-004', beneficiaryId: bens[3].id, samityId: samities[1].id, admissionDate: new Date('2024-07-01') } }),
    prisma.mFIMember.create({ data: { memberNo: 'MBR-005', beneficiaryId: bens[4].id, samityId: samities[1].id, admissionDate: new Date('2024-07-01') } }),
  ])

  const loanProducts = await Promise.all([
    prisma.loanProduct.create({ data: { productCode: 'IGA-01', name: 'Jagoron (IGA)', category: 'INCOME_GENERATING', minAmount: 10000, maxAmount: 100000, interestRate: 20, interestMethod: 'DECLINING_BALANCE', maxDurationMonths: 12, repaymentFrequency: 'WEEKLY', serviceCharge: 1 } }),
    prisma.loanProduct.create({ data: { productCode: 'AGR-01', name: 'Krishi Rin (Agriculture)', category: 'AGRICULTURE', minAmount: 20000, maxAmount: 200000, interestRate: 18, interestMethod: 'DECLINING_BALANCE', maxDurationMonths: 12, repaymentFrequency: 'MONTHLY', gracePeriodDays: 90, serviceCharge: 1 } }),
  ])

  // Create a loan account for member 1
  const loanAccount = await prisma.loanAccount.create({
    data: {
      accountNo: 'LN-2026-001',
      memberId: members[0].id,
      productId: loanProducts[0].id,
      principalAmount: 50000,
      interestRate: 20,
      interestMethod: 'DECLINING_BALANCE',
      durationMonths: 12,
      installmentAmount: 4635,
      totalRepayable: 55620,
      totalPaid: 9270,
      outstandingBalance: 46350,
      status: 'ACTIVE',
      disbursedAt: new Date('2026-01-15'),
      maturityDate: new Date('2027-01-15'),
      lastPaymentDate: new Date('2026-02-26'),
    },
  })

  // Savings accounts
  await Promise.all([
    prisma.savingsAccount.create({ data: { accountNo: 'SAV-001', memberId: members[0].id, type: 'COMPULSORY', balance: 12000, totalDeposited: 12000, monthlyDeposit: 200 } }),
    prisma.savingsAccount.create({ data: { accountNo: 'SAV-002', memberId: members[0].id, type: 'VOLUNTARY', balance: 8000, totalDeposited: 8500, totalWithdrawn: 500 } }),
    prisma.savingsAccount.create({ data: { accountNo: 'SAV-003', memberId: members[1].id, type: 'COMPULSORY', balance: 9600, totalDeposited: 9600, monthlyDeposit: 200 } }),
  ])

  console.log(`✓ ${branches.length} Branches + ${samities.length} Samities + ${members.length} Members + ${loanProducts.length} Loan Products + 1 Loan Account + 3 Savings Accounts created`)

  // Update sequences
  await Promise.all([
    prisma.numberSequence.update({ where: { organizationId_entity: { organizationId: org.id, entity: 'vendor' } }, data: { currentValue: 3 } }),
    prisma.numberSequence.update({ where: { organizationId_entity: { organizationId: org.id, entity: 'asset' } }, data: { currentValue: 4 } }),
    prisma.numberSequence.update({ where: { organizationId_entity: { organizationId: org.id, entity: 'employee' } }, data: { currentValue: 6 } }),
    prisma.numberSequence.update({ where: { organizationId_entity: { organizationId: org.id, entity: 'samity' } }, data: { currentValue: 2 } }),
  ])

  console.log('\n✅ Phase 5 seeding complete!')
}

main()
  .catch((e) => { console.error('❌ Phase 5 seed failed:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect(); await pool.end() })
