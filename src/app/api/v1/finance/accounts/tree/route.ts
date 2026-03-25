import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  handleRouteError,
} from '@/lib/api-response'

interface AccountTreeNode {
  id: string
  code: string
  name: string
  type: string
  nature: string
  level: number
  isGroup: boolean
  isActive: boolean
  children: AccountTreeNode[]
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const accounts = await prisma.account.findMany({
      where: {
        organizationId: auth.organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
        nature: true,
        parentId: true,
        level: true,
        isGroup: true,
        isActive: true,
      },
      orderBy: { code: 'asc' },
    })

    // Build a lookup map by id
    const nodeMap = new Map<string, AccountTreeNode>()
    for (const account of accounts) {
      nodeMap.set(account.id, {
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        nature: account.nature,
        level: account.level,
        isGroup: account.isGroup,
        isActive: account.isActive,
        children: [],
      })
    }

    // Build tree: attach children to parents, collect roots
    const roots: AccountTreeNode[] = []
    for (const account of accounts) {
      const node = nodeMap.get(account.id)!
      if (account.parentId && nodeMap.has(account.parentId)) {
        nodeMap.get(account.parentId)!.children.push(node)
      } else {
        roots.push(node)
      }
    }

    return apiSuccess(roots)
  } catch (error) {
    return handleRouteError(error)
  }
}
