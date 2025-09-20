
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { DocumentTemplate } from './document-templates'

// Company letterhead configuration
const COMPANY_INFO = {
  name: 'Ampere Engineering Pte Ltd',
  address: '101 Upper Cross Street #04-05',
  address2: "People's Park Centre Singapore 058357",
  email: 'projects@ampere.com.sg',
  logos: {
    company: '/branding/ampere-logo.png',
    iso45001: '/branding/iso-45001-new.jpg',
    bizsafe: '/branding/bizsafe-star-new.jpg'
  }
}

// Helper function to load image as base64
async function loadImageAsBase64(imagePath: string): Promise<string | null> {
  try {
    const fs = require('fs').promises
    const path = require('path')
    const fullPath = path.join(process.cwd(), 'public', imagePath)
    const imageBuffer = await fs.readFile(fullPath)
    const base64 = imageBuffer.toString('base64')
    const ext = path.extname(imagePath).toLowerCase()
    const mimeType = ext === '.png' ? 'png' : ext === '.jpg' || ext === '.jpeg' ? 'jpeg' : 'png'
    return `data:image/${mimeType};base64,${base64}`
  } catch (error) {
    console.warn(`Could not load image: ${imagePath}`, error)
    return null
  }
}

// Helper function to add company letterhead
async function addCompanyLetterhead(doc: jsPDF): Promise<number> {
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  let yPosition = margin

  try {
    // Load and add company logo at the top
    const companyLogoData = await loadImageAsBase64(COMPANY_INFO.logos.company)
    
    if (companyLogoData) {
      // Add company logo (top left)
      doc.addImage(companyLogoData, 'PNG', margin, yPosition, 40, 20)
      
      // Move to position below logo
      yPosition += 25
      
      // Address and email directly below logo with smaller fonts
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      
      doc.text(COMPANY_INFO.address, margin, yPosition)
      yPosition += 4
      doc.text(COMPANY_INFO.address2, margin, yPosition)
      yPosition += 4
      doc.text(COMPANY_INFO.email, margin, yPosition)
      
      yPosition += 15
    } else {
      // Fallback to text-based header
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 51, 102)
      doc.text(COMPANY_INFO.name.toUpperCase(), margin, yPosition)
      yPosition += 15
      
      // Address and email with smaller fonts
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      
      doc.text(COMPANY_INFO.address, margin, yPosition)
      yPosition += 4
      doc.text(COMPANY_INFO.address2, margin, yPosition)
      yPosition += 4
      doc.text(COMPANY_INFO.email, margin, yPosition)
      yPosition += 15
    }
    
    // Add a professional separator line
    doc.setDrawColor(0, 51, 102)
    doc.setLineWidth(0.5)
    doc.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 10
    
  } catch (error) {
    console.warn('Could not load company logos, using text-based header')
    // Fallback to simple text header
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 51, 102)
    doc.text(COMPANY_INFO.name.toUpperCase(), margin, yPosition)
    yPosition += 15
    
    // Address and email with smaller fonts
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    
    doc.text(COMPANY_INFO.address, margin, yPosition)
    yPosition += 4
    doc.text(COMPANY_INFO.address2, margin, yPosition)
    yPosition += 4
    doc.text(COMPANY_INFO.email, margin, yPosition)
    yPosition += 10
  }
  
  return yPosition
}

// Helper function to add company footer
async function addCompanyFooter(doc: jsPDF, pageNumber: number, totalPages: number): Promise<void> {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  
  // Footer line
  doc.setDrawColor(0, 51, 102)
  doc.setLineWidth(0.3)
  doc.line(margin, pageHeight - 35, pageWidth - margin, pageHeight - 35)
  
  try {
    // Load accreditation logos
    const iso45001LogoData = await loadImageAsBase64(COMPANY_INFO.logos.iso45001)
    const bizsafeLogoData = await loadImageAsBase64(COMPANY_INFO.logos.bizsafe)
    
    // Add accreditation logos at bottom left
    let logoXPosition = margin
    
    if (iso45001LogoData) {
      doc.addImage(iso45001LogoData, 'JPEG', logoXPosition, pageHeight - 32, 15, 12)
      logoXPosition += 18
    }
    
    if (bizsafeLogoData) {
      doc.addImage(bizsafeLogoData, 'JPEG', logoXPosition, pageHeight - 32, 15, 12)
      logoXPosition += 18
    }
    
    // Footer information
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    
    // Company name (next to logos)
    doc.text(COMPANY_INFO.name, logoXPosition + 5, pageHeight - 25)
    
  } catch (error) {
    console.warn('Could not load accreditation logos')
    // Footer information without logos
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(COMPANY_INFO.name, margin, pageHeight - 25)
  }
  
  // Center - Page number
  doc.setFontSize(8)
  doc.text(
    `Page ${pageNumber} of ${totalPages}`,
    pageWidth / 2,
    pageHeight - 25,
    { align: 'center' }
  )
  
  // Right side - Generation date
  doc.text(
    `Generated: ${new Date().toLocaleDateString()}`,
    pageWidth - margin,
    pageHeight - 25,
    { align: 'right' }
  )
  
  // Bottom line - Confidential notice
  doc.setFontSize(7)
  doc.text(
    'CONFIDENTIAL DOCUMENT - This document contains proprietary information and is intended solely for the use of the addressee.',
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' }
  )
}

interface ProjectInfo {
  projectName: string
  projectNumber: string
  clientName: string
  location?: string
  startDate?: string
  endDate?: string
}

export async function generatePDFFromTemplate(
  template: DocumentTemplate,
  templateData: Record<string, any>,
  projectInfo: ProjectInfo,
  documentTitle: string
): Promise<Buffer> {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20

  // Add standardized company letterhead
  let yPosition = await addCompanyLetterhead(doc)

  // Document Title
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 51, 102) // Professional blue
  doc.text(documentTitle, pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 15

  // Project Information Box
  doc.setDrawColor(0, 51, 102)
  doc.setFillColor(245, 248, 252)
  doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 40, 3, 3, 'FD')
  
  yPosition += 8
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 51, 102)
  doc.text('PROJECT INFORMATION', margin + 5, yPosition)
  yPosition += 6

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  const projectInfoLines = [
    `Project: ${projectInfo.projectName} (${projectInfo.projectNumber})`,
    `Client: ${projectInfo.clientName}`,
    `Date: ${new Date().toLocaleDateString()}`,
  ]

  projectInfoLines.forEach(line => {
    doc.text(line, margin + 5, yPosition)
    yPosition += 5
  })

  yPosition += 15

  // Template Content
  if (template.sections) {
    template.sections.forEach((section, sectionIndex) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 50) {
        doc.addPage()
        yPosition = margin
      }

      // Section Header
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text(section.title, margin, yPosition)
      yPosition += 10

      // Section Fields
      section.fields.forEach(fieldId => {
        const field = template.fields.find(f => f.id === fieldId)
        if (!field) return

        const value = templateData[fieldId] || ''

        // Check if we need a new page
        if (yPosition > pageHeight - 30) {
          doc.addPage()
          yPosition = margin
        }

        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text(`${field.label}:`, margin, yPosition)
        yPosition += 6

        doc.setFont('helvetica', 'normal')
        
        if (field.type === 'textarea' && value) {
          // Handle multi-line text
          const lines = doc.splitTextToSize(value, pageWidth - 2 * margin)
          doc.text(lines, margin, yPosition)
          yPosition += lines.length * 5 + 5
        } else {
          doc.text(value.toString(), margin, yPosition)
          yPosition += 8
        }
      })

      yPosition += 10
    })
  } else {
    // No sections, just display all fields
    template.fields.forEach(field => {
      const value = templateData[field.id] || ''

      // Check if we need a new page
      if (yPosition > pageHeight - 30) {
        doc.addPage()
        yPosition = margin
      }

      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(`${field.label}:`, margin, yPosition)
      yPosition += 6

      doc.setFont('helvetica', 'normal')
      
      if (field.type === 'textarea' && value) {
        const lines = doc.splitTextToSize(value, pageWidth - 2 * margin)
        doc.text(lines, margin, yPosition)
        yPosition += lines.length * 5 + 5
      } else {
        doc.text(value.toString(), margin, yPosition)
        yPosition += 8
      }
    })
  }

  // Add standardized footer to all pages
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    await addCompanyFooter(doc, i, totalPages)
  }

  return Buffer.from(doc.output('arraybuffer'))
}

export async function generateSimpleDocumentPDF(
  title: string,
  content: string,
  projectInfo: ProjectInfo
): Promise<Buffer> {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20

  // Add standardized company letterhead
  let yPosition = await addCompanyLetterhead(doc)

  // Document Title
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 51, 102) // Professional blue
  doc.text(title, pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 15

  // Project Information Box
  doc.setDrawColor(0, 51, 102)
  doc.setFillColor(245, 248, 252)
  doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 30, 3, 3, 'FD')
  
  yPosition += 8
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 51, 102)
  doc.text('PROJECT INFORMATION', margin + 5, yPosition)
  yPosition += 6

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text(`Project: ${projectInfo.projectName} (${projectInfo.projectNumber})`, margin + 5, yPosition)
  yPosition += 5
  doc.text(`Client: ${projectInfo.clientName}`, margin + 5, yPosition)
  yPosition += 5
  doc.text(`Date: ${new Date().toLocaleDateString()}`, margin + 5, yPosition)
  yPosition += 20

  // Content
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  const lines = doc.splitTextToSize(content, pageWidth - 2 * margin)
  doc.text(lines, margin, yPosition)

  // Add standardized footer to all pages
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    await addCompanyFooter(doc, i, totalPages)
  }

  return Buffer.from(doc.output('arraybuffer'))
}

export async function generateReportPDF(
  title: string,
  data: any,
  reportType: string
): Promise<Buffer> {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20

  // Add standardized company letterhead
  let yPosition = await addCompanyLetterhead(doc)

  // Report Title
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 51, 102) // Professional blue
  doc.text(title, pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 15

  // Report Information Box
  doc.setDrawColor(0, 51, 102)
  doc.setFillColor(245, 248, 252)
  doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 25, 3, 3, 'FD')
  
  yPosition += 8
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 51, 102)
  doc.text('REPORT INFORMATION', margin + 5, yPosition)
  yPosition += 6

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text(`Report Type: ${reportType}`, margin + 5, yPosition)
  yPosition += 5
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin + 5, yPosition)
  yPosition += 20

  // Report Content (basic implementation)
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text('Report data:', margin, yPosition)
  yPosition += 10
  
  const dataStr = JSON.stringify(data, null, 2)
  const lines = doc.splitTextToSize(dataStr, pageWidth - 2 * margin)
  doc.text(lines, margin, yPosition)

  // Add standardized footer
  await addCompanyFooter(doc, 1, 1)

  return Buffer.from(doc.output('arraybuffer'))
}
