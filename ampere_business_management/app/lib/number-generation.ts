
import { prisma } from './db'

export async function generateClientNumber(): Promise<string> {
  const lastClient = await prisma.client.findFirst({
    where: {
      clientNumber: {
        startsWith: 'AE-C-',
      },
    },
    orderBy: {
      clientNumber: 'desc',
    },
  })

  if (!lastClient) {
    return 'AE-C-001'
  }

  // Extract the number part from the last client number (e.g., "AE-C-123" -> 123)
  const lastNumber = parseInt(lastClient.clientNumber?.split('-')[2] || '0')
  const nextNumber = lastNumber + 1

  // Format with leading zeros (e.g., 1 -> "001", 12 -> "012", 123 -> "123")
  return `AE-C-${nextNumber.toString().padStart(3, '0')}`
}

export async function generateVendorNumber(): Promise<string> {
  const lastVendor = await prisma.vendor.findFirst({
    where: {
      vendorNumber: {
        startsWith: 'AE-V-',
      },
    },
    orderBy: {
      vendorNumber: 'desc',
    },
  })

  if (!lastVendor) {
    return 'AE-V-001'
  }

  // Extract the number part from the last vendor number (e.g., "AE-V-123" -> 123)
  const lastNumber = parseInt(lastVendor.vendorNumber?.split('-')[2] || '0')
  const nextNumber = lastNumber + 1

  // Format with leading zeros (e.g., 1 -> "001", 12 -> "012", 123 -> "123")
  return `AE-V-${nextNumber.toString().padStart(3, '0')}`
}
