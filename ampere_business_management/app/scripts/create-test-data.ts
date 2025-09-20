
import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

async function main() {
  console.log('🎯 Creating test data for PO testing...')

  // Get the first user as createdBy
  const user = await prisma.user.findFirst()
  if (!user) {
    console.error('No users found! Please run the seed script first.')
    process.exit(1)
  }

  // Create test clients
  const client1 = await prisma.client.create({
    data: {
      id: uuidv4(),
      name: 'ABC Construction Pte Ltd',
      contactPerson: 'John Doe',
      email: 'john.doe@abcconstruction.com',
      phone: '+65 6123 4567',
      address: '123 Marina Bay',
      city: 'Singapore',
      state: 'Singapore',
      country: 'Singapore',
      postalCode: '018956',
      createdById: user.id,
      updatedAt: new Date()
    }
  })

  const client2 = await prisma.client.create({
    data: {
      id: uuidv4(),
      name: 'XYZ Development Ltd',
      contactPerson: 'Jane Smith',
      email: 'jane.smith@xyzdevelopment.com',
      phone: '+65 6987 6543',
      address: '456 Orchard Road',
      city: 'Singapore',
      state: 'Singapore',
      country: 'Singapore',
      postalCode: '238882',
      createdById: user.id,
      updatedAt: new Date()
    }
  })

  console.log('👥 Created test clients')

  // Create test vendors
  const vendor1 = await prisma.vendor.create({
    data: {
      id: uuidv4(),
      name: 'ElectroSupply Singapore',
      vendorNumber: 'VEN001',
      email: 'sales@electrosupply.com.sg',
      phone: '+65 6234 5678',
      address: '789 Industrial Ave',
      city: 'Singapore',
      state: 'Singapore',
      country: 'Singapore',
      postalCode: '123456',
      contactPerson: 'Mike Johnson',
      vendorType: 'SUPPLIER',
      paymentTerms: 'NET_30',
      createdById: user.id,
      updatedAt: new Date()
    }
  })

  const vendor2 = await prisma.vendor.create({
    data: {
      id: uuidv4(),
      name: 'MechParts Trading',
      vendorNumber: 'VEN002',
      email: 'orders@mechparts.com.sg',
      phone: '+65 6345 6789',
      address: '321 Tech Park Drive',
      city: 'Singapore',
      state: 'Singapore',
      country: 'Singapore',
      postalCode: '654321',
      contactPerson: 'Sarah Lee',
      vendorType: 'SUPPLIER',
      paymentTerms: 'NET_15',
      createdById: user.id,
      updatedAt: new Date()
    }
  })

  console.log('🏪 Created test vendors')

  // Create test projects
  const project1 = await prisma.project.create({
    data: {
      id: uuidv4(),
      projectNumber: 'PRJ-2025-001',
      name: 'Marina Bay Office Tower MEP',
      description: 'Mechanical, Electrical & Plumbing works for 30-storey office building',
      projectType: 'REGULAR',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      startDate: new Date('2025-01-15'),
      endDate: new Date('2025-08-15'),
      estimatedBudget: 2500000,
      progress: 15,
      clientId: client1.id,
      managerId: user.id,
      createdById: user.id,
      updatedAt: new Date()
    }
  })

  const project2 = await prisma.project.create({
    data: {
      id: uuidv4(),
      projectNumber: 'PRJ-2025-002',
      name: 'Residential Complex Phase 2',
      description: 'Electrical installation for 200-unit residential complex',
      projectType: 'REGULAR',
      status: 'PLANNING',
      priority: 'MEDIUM',
      startDate: new Date('2025-03-01'),
      endDate: new Date('2025-12-31'),
      estimatedBudget: 1800000,
      progress: 5,
      clientId: client2.id,
      managerId: user.id,
      createdById: user.id,
      updatedAt: new Date()
    }
  })

  console.log('📋 Created test projects')

  console.log('\n✅ Test data created successfully!')
  console.log('📊 Summary:')
  console.log(`• ${2} Clients created`)
  console.log(`• ${2} Vendors created`)
  console.log(`• ${2} Projects created`)
  console.log('\n🎯 Ready to test Purchase Order creation!')
}

main()
  .catch((e) => {
    console.error('❌ Error creating test data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
