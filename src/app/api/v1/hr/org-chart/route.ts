import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  handleRouteError,
} from '@/lib/api-response'

interface OrgNode {
  id: string
  name: string
  code: string
  headId: string | null
  headName?: string | null
  employees: {
    id: string
    employeeNo: string
    fullName: string
    designationTitle: string | null
    reportingToId: string | null
  }[]
  children: OrgNode[]
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    // Get all departments
    const departments = await prisma.department.findMany({
      where: { organizationId: auth.organizationId, isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
        headId: true,
        parentId: true,
      },
      orderBy: { name: 'asc' },
    })

    // Get all active employees
    const employees = await prisma.employee.findMany({
      where: {
        organizationId: auth.organizationId,
        status: 'ACTIVE',
        deletedAt: null,
      },
      select: {
        id: true,
        employeeNo: true,
        fullName: true,
        departmentId: true,
        reportingToId: true,
        designation: { select: { title: true } },
      },
      orderBy: { fullName: 'asc' },
    })

    // Build head name map
    const employeeMap = new Map(employees.map((e) => [e.id, e]))

    // Build department tree
    function buildTree(parentId: string | null): OrgNode[] {
      return departments
        .filter((d) => d.parentId === parentId)
        .map((dept) => {
          const deptEmployees = employees
            .filter((e) => e.departmentId === dept.id)
            .map((e) => ({
              id: e.id,
              employeeNo: e.employeeNo,
              fullName: e.fullName,
              designationTitle: e.designation?.title || null,
              reportingToId: e.reportingToId,
            }))

          const head = dept.headId ? employeeMap.get(dept.headId) : null

          return {
            id: dept.id,
            name: dept.name,
            code: dept.code,
            headId: dept.headId,
            headName: head?.fullName || null,
            employees: deptEmployees,
            children: buildTree(dept.id),
          }
        })
    }

    const tree = buildTree(null)

    return apiSuccess(tree)
  } catch (error) {
    return handleRouteError(error)
  }
}
