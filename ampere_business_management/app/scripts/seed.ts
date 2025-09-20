
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Clean existing data in development
  await prisma.auditLog.deleteMany()
  // Financial data cleanup (order is important due to foreign key constraints)
  await prisma.xeroSyncLog.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.vendorInvoiceActivity.deleteMany()
  await prisma.vendorInvoiceItem.deleteMany()
  await prisma.vendorInvoice.deleteMany()
  await prisma.clientInvoiceItem.deleteMany()
  await prisma.clientInvoice.deleteMany()
  await prisma.purchaseOrderActivity.deleteMany()
  await prisma.purchaseOrderItem.deleteMany()
  await prisma.purchaseOrder.deleteMany()
  await prisma.legacyInvoice.deleteMany()
  // Business data cleanup
  await prisma.quotationActivity.deleteMany()
  await prisma.quotationApproval.deleteMany()
  await prisma.quotationTemplate.deleteMany()
  await prisma.quotationItem.deleteMany()
  await prisma.quotation.deleteMany()
  await prisma.tenderActivity.deleteMany()
  await prisma.tender.deleteMany()
  await prisma.vendorContract.deleteMany()
  await prisma.projectVendor.deleteMany()
  // Delete dependent records first to avoid foreign key constraint violations
  await prisma.quotationItemLibrary.deleteMany()
  await prisma.document.deleteMany()
  await prisma.project.deleteMany()
  await prisma.vendor.deleteMany()
  await prisma.client.deleteMany()
  // Authentication data cleanup
  await prisma.account.deleteMany()
  await prisma.session.deleteMany()
  await prisma.user.deleteMany()

  console.log('🧹 Cleaned existing data')

  // Create Super Admin accounts
  const zackPassword = await bcrypt.hash('Czl914816', 12)
  const endyPassword = await bcrypt.hash('Endy548930', 12)
  const defaultPassword = await bcrypt.hash('password123', 12)

  // SuperAdmin User - Zack
  const superAdmin = await prisma.user.create({
    data: {
      id: uuidv4(),
      email: 'zack',
      password: zackPassword,
      firstName: 'Zack',
      lastName: 'Admin',
      name: 'Zack',
      role: 'SUPERADMIN',
      companyName: 'Ampere Engineering Pte Ltd',
      isActive: true,
      updatedAt: new Date()
    },
  })

  // SuperAdmin User - Endy
  const superAdmin2 = await prisma.user.create({
    data: {
      id: uuidv4(),
      email: 'endy',
      password: endyPassword,
      firstName: 'Endy',
      lastName: 'Admin',
      name: 'Endy',
      role: 'SUPERADMIN',
      companyName: 'Ampere Engineering Pte Ltd',
      isActive: true,
      updatedAt: new Date()
    },
  })

  // Project Manager User  
  const projectManager = await prisma.user.create({
    data: {
      id: uuidv4(),
      email: 'pm',
      password: defaultPassword,
      firstName: 'Project',
      lastName: 'Manager',
      name: 'Project Manager',
      role: 'PROJECT_MANAGER',
      companyName: 'Ampere Engineering Pte Ltd',
      isActive: true,
      updatedAt: new Date()
    },
  })

  // Finance User
  const financeUser = await prisma.user.create({
    data: {
      id: uuidv4(),
      email: 'finance',
      password: defaultPassword,
      firstName: 'Finance',
      lastName: 'Team',
      name: 'Finance Team',
      role: 'FINANCE',
      companyName: 'Ampere Engineering Pte Ltd',
      isActive: true,
      updatedAt: new Date()
    },
  })

  console.log('👥 Created test users')


  console.log('🎉 Database seeding completed successfully!')
  console.log('\n📋 Test Accounts Created:')
  console.log('┌─────────────────────────────────────────────────────────┐')
  console.log('│                    TEST ACCOUNTS                        │')
  console.log('├─────────────────────────────────────────────────────────┤')
  console.log('│ SuperAdmin:     zack                                    │')
  console.log('│ Password:       Czl914816                               │')
  console.log('│ SuperAdmin:     endy                                    │')
  console.log('│ Password:       Endy548930                              │')
  console.log('│ Project Manager: pm                                     │')
  console.log('│ Finance:        finance                                 │')
  console.log('│ Password (PM/Finance): password123                      │')
  console.log('└─────────────────────────────────────────────────────────┘')
  console.log('\n🧹 All mock/sample data removed - database is clean!')
  console.log('📋 Ready for your real business data!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:')
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
