

import dotenv from "dotenv"
import { PrismaClient, ProjectDocumentType } from "@prisma/client"
import { generateDocumentNumber, DOCUMENT_TYPE_CODES } from "../lib/document-numbering"

// Load environment variables
dotenv.config()

const prisma = new PrismaClient()

async function populateDocumentNumbers() {
  console.log('Starting document number population...')
  
  try {
    // Get all projects first
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        projectNumber: true,
      },
    })
    
    const projectMap = new Map(projects.map(p => [p.id, p.projectNumber]))

    // Get all documents without document numbers
    const documentsWithoutNumbers = await prisma.projectDocument.findMany({
      where: {
        documentNumber: ""
      },
      select: {
        id: true,
        projectId: true,
        documentType: true,
        title: true,
        createdAt: true,
      },
      orderBy: [
        { projectId: 'asc' },
        { documentType: 'asc' },
        { createdAt: 'asc' },
      ],
    })

    console.log(`Found ${documentsWithoutNumbers.length} documents without numbers`)

    // Group documents by project and document type to generate sequential numbers
    const projectTypeMap = new Map<string, Map<ProjectDocumentType, number>>()

    for (const document of documentsWithoutNumbers) {
      const projectNumber = projectMap.get(document.projectId)
      
      if (!projectNumber) {
        console.warn(`Document ${document.id} has no project number, skipping`)
        continue
      }

      const projectId = document.projectId
      const documentType = document.documentType

      // Initialize project map if not exists
      if (!projectTypeMap.has(projectId)) {
        projectTypeMap.set(projectId, new Map())
      }

      const typeMap = projectTypeMap.get(projectId)!

      // Get current sequence for this document type
      let currentSequence = typeMap.get(documentType) || 0

      // Check existing documents with numbers to find the highest sequence
      if (currentSequence === 0) {
        const existingDocs = await prisma.projectDocument.findMany({
          where: {
            projectId,
            documentType,
            documentNumber: {
              not: "",
            },
          },
          select: {
            documentNumber: true,
          },
        })

        const typeCode = DOCUMENT_TYPE_CODES[documentType]
        const prefix = `${projectNumber}/${typeCode}/`

        let maxSequence = 0
        for (const doc of existingDocs) {
          if (doc.documentNumber && doc.documentNumber.startsWith(prefix)) {
            const parts = doc.documentNumber.split('/')
            if (parts.length === 3) {
              const sequence = parseInt(parts[2], 10)
              if (!isNaN(sequence) && sequence > maxSequence) {
                maxSequence = sequence
              }
            }
          }
        }
        currentSequence = maxSequence
      }

      // Increment sequence for this document
      currentSequence++
      typeMap.set(documentType, currentSequence)

      // Generate document number
      const documentNumber = generateDocumentNumber(projectNumber, documentType, currentSequence)

      // Update the document
      await prisma.projectDocument.update({
        where: { id: document.id },
        data: { documentNumber },
      })

      console.log(`Updated document ${document.id}: ${document.title} -> ${documentNumber}`)
    }

    console.log('Document number population completed successfully!')
  } catch (error) {
    console.error('Error populating document numbers:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
if (require.main === module) {
  populateDocumentNumbers()
    .then(() => {
      console.log('Script execution completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Script execution failed:', error)
      process.exit(1)
    })
}

export { populateDocumentNumbers }

