
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Adding numbers to existing clients and vendors...')

  // Get all existing clients without clientNumber
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: 'asc' },
  })

  console.log(`Found ${clients.length} clients to update`)

  // Update each client with a sequential number
  for (let i = 0; i < clients.length; i++) {
    const clientNumber = `AE-C-${(i + 1).toString().padStart(3, '0')}`
    await prisma.client.update({
      where: { id: clients[i].id },
      data: { clientNumber },
    })
    console.log(`✅ Updated client "${clients[i].name}" with number: ${clientNumber}`)
  }

  // Get all existing vendors without vendorNumber
  const vendors = await prisma.vendor.findMany({
    orderBy: { createdAt: 'asc' },
  })

  console.log(`Found ${vendors.length} vendors to update`)

  // Update each vendor with a sequential number
  for (let i = 0; i < vendors.length; i++) {
    const vendorNumber = `AE-V-${(i + 1).toString().padStart(3, '0')}`
    await prisma.vendor.update({
      where: { id: vendors[i].id },
      data: { vendorNumber },
    })
    console.log(`✅ Updated vendor "${vendors[i].name}" with number: ${vendorNumber}`)
  }

  console.log('✨ Migration completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
