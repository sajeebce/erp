import { prisma } from '@/lib/db'

const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen']
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

function numberToWords(num: number): string {
  if (num === 0) return 'Zero Taka Only'

  const isNegative = num < 0
  num = Math.abs(Math.floor(num))
  const paisa = Math.round((Math.abs(num) - Math.floor(Math.abs(num))) * 100)

  function convertGroup(n: number): string {
    if (n === 0) return ''
    if (n < 20) return ones[n]
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '')
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertGroup(n % 100) : '')
  }

  const crore = Math.floor(num / 10000000)
  const lakh = Math.floor((num % 10000000) / 100000)
  const thousand = Math.floor((num % 100000) / 1000)
  const remainder = num % 1000
  const parts: string[] = []
  if (crore > 0) parts.push(convertGroup(crore) + ' Crore')
  if (lakh > 0) parts.push(convertGroup(lakh) + ' Lakh')
  if (thousand > 0) parts.push(convertGroup(thousand) + ' Thousand')
  if (remainder > 0) parts.push(convertGroup(remainder))

  let result = (isNegative ? 'Minus ' : '') + parts.join(' ') + ' Taka'
  if (paisa > 0) result += ' and ' + convertGroup(paisa) + ' Paisa'
  return result + ' Only'
}

export async function buildPayslipData(entryId: string, organizationId: string) {
  const entry = await prisma.payrollEntry.findUnique({
    where: { id: entryId },
    include: {
      payrollRun: { select: { runNo: true, month: true, year: true, status: true } },
      employee: {
        include: {
          department: { select: { name: true } },
          designation: { select: { title: true } },
          salaryGrade: { select: { code: true, name: true } },
          pfEnrollment: { select: { id: true } },
        },
      },
      lines: { orderBy: { sortOrder: 'asc' } },
    },
  })

  if (!entry || entry.employee.organizationId !== organizationId) return null

  const emp = entry.employee
  const run = entry.payrollRun
  const payslipRef = `PS-${run.year}-${String(run.month).padStart(2, '0')}-${emp.employeeNo}`
  const earnings: { component: string; code: string; amount: number; ytd: number }[] = []
  const deductions: { component: string; code: string; amount: number; ytd: number }[] = []
  const employerContributions: { component: string; code: string; amount: number }[] = []

  if (entry.lines.length > 0) {
    for (const line of entry.lines) {
      const item = {
        component: line.componentName,
        code: line.componentCode,
        amount: Number(line.amount),
        ytd: Number(line.ytdAmount),
      }
      if (line.lineType === 'EARNING') earnings.push(item)
      else if (line.lineType === 'DEDUCTION') deductions.push(item)
      else if (line.lineType === 'EMPLOYER_CONTRIBUTION') {
        employerContributions.push({ component: item.component, code: item.code, amount: item.amount })
      }
    }
  } else {
    if (Number(entry.basicSalary) > 0) earnings.push({ component: 'Basic Salary', code: 'BASIC', amount: Number(entry.basicSalary), ytd: 0 })
    if (Number(entry.houseRent) > 0) earnings.push({ component: 'House Rent', code: 'HOUSE_RENT', amount: Number(entry.houseRent), ytd: 0 })
    if (Number(entry.medicalAllowance) > 0) earnings.push({ component: 'Medical Allowance', code: 'MEDICAL', amount: Number(entry.medicalAllowance), ytd: 0 })
    if (Number(entry.transportAllowance) > 0) earnings.push({ component: 'Transport Allowance', code: 'TRANSPORT', amount: Number(entry.transportAllowance), ytd: 0 })
    if (Number(entry.otherEarnings) > 0) earnings.push({ component: 'Other Earnings', code: 'OTHER', amount: Number(entry.otherEarnings), ytd: 0 })
    if (Number(entry.pfDeduction) > 0) deductions.push({ component: 'Provident Fund', code: 'PF', amount: Number(entry.pfDeduction), ytd: 0 })
    if (Number(entry.tdsDeduction) > 0) deductions.push({ component: 'Tax Deducted at Source', code: 'TDS', amount: Number(entry.tdsDeduction), ytd: 0 })
    if (Number(entry.otherDeductions) > 0) deductions.push({ component: 'Other Deductions', code: 'OTHER_DED', amount: Number(entry.otherDeductions), ytd: 0 })
  }

  const absentDed = Number(entry.absentDeduction)
  if (absentDed > 0 && entry.lines.length === 0) {
    deductions.push({ component: 'Absent Deduction', code: 'ABSENT', amount: absentDed, ytd: 0 })
  }

  const grossPay = Number(entry.grossSalary)
  const netPay = Number(entry.netSalary)

  return {
    payslipRef,
    payPeriod: { month: run.month, year: run.year },
    employee: {
      id: emp.id,
      fullName: emp.fullName,
      employeeNo: emp.employeeNo,
      department: emp.department?.name ?? null,
      designation: emp.designation?.title ?? null,
      grade: emp.salaryGrade?.code ?? null,
      step: emp.salaryStepNo ?? null,
      bankLast4: emp.bankAccountNo ? emp.bankAccountNo.slice(-4) : null,
      tinNumber: emp.tinNumber ?? null,
      pfNo: emp.pfEnrollment?.id ?? null,
    },
    earnings,
    deductions,
    employerContributions,
    summary: {
      grossPay,
      totalDeductions: Math.round((grossPay - netPay) * 100) / 100,
      netPay,
      netPayInWords: numberToWords(netPay),
    },
    attendance: {
      workingDays: entry.workingDays,
      presentDays: entry.presentDays,
      absentDays: entry.absentDays,
      otHours: Number(entry.otHours),
    },
  }
}
