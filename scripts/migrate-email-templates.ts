import 'dotenv/config'
import { prisma } from '../src/lib/db'
import { HR_TEMPLATE_DEFAULTS } from '../src/lib/email-templates'

async function main() {
  const org = await prisma.organization.findFirst({ select: { id: true, name: true } })
  if (!org) { console.error('No organization found'); process.exit(1) }

  console.log(`\nMigrating email templates for: ${org.name}\n`)

  for (const [key, tpl] of Object.entries(HR_TEMPLATE_DEFAULTS)) {
    await prisma.systemConfig.upsert({
      where: { organizationId_key: { organizationId: org.id, key: `hrNotificationTemplate.${key}.subject` } },
      create: { organizationId: org.id, key: `hrNotificationTemplate.${key}.subject`, value: tpl.subject, type: 'string' },
      update: { value: tpl.subject },
    })
    await prisma.systemConfig.upsert({
      where: { organizationId_key: { organizationId: org.id, key: `hrNotificationTemplate.${key}.body` } },
      create: { organizationId: org.id, key: `hrNotificationTemplate.${key}.body`, value: tpl.body, type: 'string' },
      update: { value: tpl.body },
    })
    console.log(`  ✅ ${key}`)
  }

  console.log(`\nDone — ${Object.keys(HR_TEMPLATE_DEFAULTS).length} templates updated.\n`)
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
