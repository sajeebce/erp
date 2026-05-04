/**
 * Master seed: runs every phase in dependency order.
 *
 * Usage:  pnpm db:seed:all
 *         (resolves to: pnpm tsx --env-file=.env prisma/seed-all.ts)
 *
 * Each phase is a child tsx process so existing seeds run unchanged.
 * Idempotency: most seeds upsert or skip-on-exist; the chain is safe to
 * re-run after a partial failure.
 *
 * Order matches docs/local.md, with seed-css-operating-structure inserted
 * after bootstrap so all subsequent phases can reference BU/CC/FC.
 */

import { spawn } from 'node:child_process'
import path from 'node:path'

interface Phase {
  name: string
  file: string
  optional?: boolean
}

const PHASES: Phase[] = [
  { name: 'Bootstrap (org, admin, role, fiscal year)', file: 'seed-bootstrap.ts' },
  { name: 'Base (super admin, currencies, plans, permissions)', file: 'seed.ts' },
  { name: 'Role permissions', file: 'seed-role-permissions.ts' },
  { name: 'Operating structure (sectors, BU, CC, fund classes)', file: 'seed-css-operating-structure.ts' },
  { name: 'Chart of accounts', file: 'seed-accounts.ts' },
  { name: 'Donors, grants, projects', file: 'seed-phase3.ts' },
  { name: 'Activities, milestones, beneficiaries', file: 'seed-phase4.ts' },
  { name: 'Procurement, assets, HR, microfinance', file: 'seed-phase5.ts' },
  { name: 'Finance (banks, JEs, vouchers, sequences)', file: 'seed-finance.ts' },
  { name: 'Bank reconciliation test data', file: 'seed-reconciliation.ts' },
  { name: 'Daily expenses', file: 'seed-expenses.ts' },
  { name: 'Budget module', file: 'seed-budget.ts' },
  { name: 'HR upgrade (recruitment, contracts, holidays)', file: 'seed-phase8-hr.ts' },
  { name: 'Pension & onboarding', file: 'seed-phase8b.ts' },
  { name: 'HR profile (emergency contacts, education, work history)', file: 'seed-phase12-hr-profile.ts' },
  { name: 'HR employee detail tabs', file: 'seed-phase12b-employee-tabs.ts' },
  { name: 'Salary grades, OKR, payslip, calendar, dashboard KPIs', file: 'seed-phase8c.ts' },
  { name: 'Leave balances', file: 'seed-leave-balances.ts' },
  { name: 'Budget revisions & cost allocation', file: 'seed-budget-extras.ts' },
  { name: 'User-employee link', file: 'seed-user-employee-link.ts', optional: true },
]

function runPhase(phase: Phase): Promise<{ ok: boolean; durationMs: number }> {
  return new Promise((resolve) => {
    const start = Date.now()
    const seedPath = path.join('prisma', phase.file)
    const child = spawn('pnpm', ['tsx', '--env-file=.env', seedPath], {
      stdio: 'inherit',
      shell: true,
    })
    child.on('exit', (code) => {
      const durationMs = Date.now() - start
      resolve({ ok: code === 0, durationMs })
    })
    child.on('error', () => {
      resolve({ ok: false, durationMs: Date.now() - start })
    })
  })
}

async function main() {
  console.log('================================================================')
  console.log('  MASTER SEED — running every phase in order')
  console.log('================================================================')
  const start = Date.now()
  const results: Array<{ phase: Phase; ok: boolean; durationMs: number }> = []

  for (const phase of PHASES) {
    console.log(`\n>>> [${PHASES.indexOf(phase) + 1}/${PHASES.length}] ${phase.name}  (${phase.file})`)
    const result = await runPhase(phase)
    results.push({ phase, ...result })
    if (!result.ok && !phase.optional) {
      console.error(`✗ FAILED on required phase: ${phase.file}`)
      console.error('  Continuing to next phase. Re-run seed-all to retry; most seeds are idempotent.')
    }
  }

  const totalMs = Date.now() - start
  const okCount = results.filter((r) => r.ok).length
  const failCount = results.length - okCount

  console.log('\n================================================================')
  console.log(`  SUMMARY: ${okCount}/${results.length} phases succeeded in ${(totalMs / 1000).toFixed(1)}s`)
  console.log('================================================================')
  for (const r of results) {
    const icon = r.ok ? '✓' : r.phase.optional ? '○' : '✗'
    const durationStr = `${(r.durationMs / 1000).toFixed(1)}s`.padStart(6)
    console.log(`  ${icon}  ${durationStr}  ${r.phase.file}`)
  }

  if (failCount > 0) process.exitCode = 1
}

main().catch((e) => {
  console.error('Master seed crashed:', e)
  process.exitCode = 1
})
