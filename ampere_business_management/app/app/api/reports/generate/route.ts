
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import * as XLSX from 'xlsx'
import { generateReportPDF } from "@/lib/pdf-generator"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { reportId, filters = {}, format = 'excel' } = body

    let reportData: any[] = []
    let reportName = "Report"
    let headers: string[] = []

    // Parse date range if provided
    const dateRange = filters.dateRange ? {
      from: new Date(filters.dateRange.from),
      to: new Date(filters.dateRange.to)
    } : {
      from: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
      to: new Date()
    }

    switch (reportId) {
      case 'revenue-analysis':
        reportName = "Revenue Analysis"
        headers = ["Date", "Client", "Project", "Invoice Number", "Amount", "Status", "Payment Date"]
        
        const revenueData = await prisma.clientInvoice.findMany({
          where: {
            issueDate: {
              gte: dateRange.from,
              lte: dateRange.to
            },
            ...(filters.clientFilter && filters.clientFilter !== 'all' ? {
              Client: {
                clientType: filters.clientFilter === 'enterprise' ? 'ENTERPRISE' : 
                           filters.clientFilter === 'government' ? 'GOVERNMENT' : undefined
              }
            } : {})
          },
          include: {
            Client: {
              select: { name: true }
            },
            Project: {
              select: { name: true }
            }
          },
          orderBy: {
            issueDate: 'desc'
          }
        })

        reportData = revenueData.map(invoice => ({
          Date: invoice.issueDate.toLocaleDateString(),
          Client: invoice.Client?.name || 'N/A',
          Project: invoice.Project?.name || 'N/A',
          "Invoice Number": invoice.invoiceNumber,
          Amount: Number(invoice.totalAmount),
          Status: invoice.status,
          "Payment Date": invoice.paidDate?.toLocaleDateString() || 'N/A'
        }))
        break

      case 'invoice-aging':
        reportName = "Invoice Aging Report"
        headers = ["Invoice Number", "Client", "Issue Date", "Due Date", "Amount", "Days Outstanding", "Status", "Age Group"]
        
        const invoiceData = await prisma.clientInvoice.findMany({
          where: {
            issueDate: {
              gte: dateRange.from,
              lte: dateRange.to
            },
            ...(filters.statusFilter && filters.statusFilter !== 'all' ? {
              status: filters.statusFilter.toUpperCase() as any
            } : {})
          },
          include: {
            Client: {
              select: { name: true }
            }
          },
          orderBy: {
            dueDate: 'asc'
          }
        })

        reportData = invoiceData.map(invoice => {
          const today = new Date()
          const daysOutstanding = Math.floor((today.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24))
          let ageGroup = "Current"
          
          if (daysOutstanding > 0) {
            if (daysOutstanding <= 30) ageGroup = "1-30 days"
            else if (daysOutstanding <= 60) ageGroup = "31-60 days"
            else if (daysOutstanding <= 90) ageGroup = "61-90 days"
            else ageGroup = "90+ days"
          }

          return {
            "Invoice Number": invoice.invoiceNumber,
            Client: invoice.Client?.name || 'N/A',
            "Issue Date": invoice.issueDate.toLocaleDateString(),
            "Due Date": invoice.dueDate.toLocaleDateString(),
            Amount: Number(invoice.totalAmount),
            "Days Outstanding": daysOutstanding,
            Status: invoice.status,
            "Age Group": ageGroup
          }
        })
        break

      case 'project-progress':
        reportName = "Project Progress Summary"
        headers = ["Project Number", "Project Name", "Client", "Manager", "Status", "Priority", "Progress %", "Start Date", "End Date", "Budget", "Type"]
        
        const projectData = await prisma.project.findMany({
          where: {
            isActive: true,
            ...(filters.projectStatus && filters.projectStatus !== 'all' ? {
              status: filters.projectStatus.toUpperCase()
            } : {}),
            ...(filters.projectType && filters.projectType !== 'all' ? {
              projectType: filters.projectType.toUpperCase()
            } : {})
          },
          include: {
            Client: {
              select: { name: true }
            },
            User_Project_managerIdToUser: {
              select: { name: true, firstName: true, lastName: true }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        })

        reportData = projectData.map(project => ({
          "Project Number": project.projectNumber,
          "Project Name": project.name,
          Client: project.Client?.name || 'N/A',
          Manager: project.User_Project_managerIdToUser?.firstName && project.User_Project_managerIdToUser?.lastName 
            ? `${project.User_Project_managerIdToUser.firstName} ${project.User_Project_managerIdToUser.lastName}`
            : project.User_Project_managerIdToUser?.name || 'Unassigned',
          Status: project.status,
          Priority: project.priority,
          "Progress %": project.progress,
          "Start Date": project.startDate?.toLocaleDateString() || 'N/A',
          "End Date": project.endDate?.toLocaleDateString() || 'N/A',
          Budget: project.estimatedBudget ? Number(project.estimatedBudget) : 'N/A',
          Type: project.projectType
        }))
        break

      case 'client-revenue':
        reportName = "Client Revenue Analysis"
        headers = ["Client Name", "Contact Person", "Total Revenue", "Project Count", "Average Project Value", "Last Invoice Date", "Status"]
        
        const clientRevenueData = await prisma.client.findMany({
          where: {
            isActive: filters.includeInactive !== 'true' ? true : undefined
          },
          include: {
            ClientInvoice: {
              where: {
                status: 'PAID',
                paidDate: {
                  gte: dateRange.from,
                  lte: dateRange.to
                }
              }
            },
            Project: {
              where: {
                isActive: true
              }
            }
          }
        })

        reportData = clientRevenueData
          .map(client => {
            const totalRevenue = client.ClientInvoice.reduce((sum: number, inv: any) => sum + Number(inv.totalAmount), 0)
            const projectCount = client.Project.length
            const avgProjectValue = projectCount > 0 ? totalRevenue / projectCount : 0
            const lastInvoiceDate = client.ClientInvoice.length > 0 
              ? client.ClientInvoice.sort((a: any, b: any) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())[0].issueDate
              : null

            return {
              "Client Name": client.name,
              "Contact Person": client.contactPerson || 'N/A',
              "Total Revenue": totalRevenue,
              "Project Count": projectCount,
              "Average Project Value": avgProjectValue,
              "Last Invoice Date": lastInvoiceDate?.toLocaleDateString() || 'N/A',
              Status: client.isActive ? 'Active' : 'Inactive'
            }
          })
          .sort((a: any, b: any) => b["Total Revenue"] - a["Total Revenue"])
          .slice(0, filters.topN || 10)
        break

      case 'quotation-conversion':
        reportName = "Quotation Conversion Report"
        headers = ["Quotation Number", "Client", "Date Created", "Total Amount", "Status", "Converted to Project", "Conversion Date", "Days to Convert"]
        
        const quotationData = await prisma.quotation.findMany({
          where: {
            createdAt: {
              gte: dateRange.from,
              lte: dateRange.to
            }
          },
          include: {
            Client: {
              select: { name: true }
            },
            Project: {
              select: {
                name: true,
                createdAt: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        })

        reportData = quotationData.map(quotation => {
          const hasProject = !!quotation.Project
          const conversionDate = hasProject ? quotation.Project?.createdAt : null
          const daysToConvert = hasProject && conversionDate 
            ? Math.floor((conversionDate.getTime() - quotation.createdAt.getTime()) / (1000 * 60 * 60 * 24))
            : null

          return {
            "Quotation Number": quotation.quotationNumber,
            Client: quotation.Client?.name || 'N/A',
            "Date Created": quotation.createdAt.toLocaleDateString(),
            "Total Amount": Number(quotation.totalAmount),
            Status: quotation.status,
            "Converted to Project": hasProject ? 'Yes' : 'No',
            "Conversion Date": conversionDate?.toLocaleDateString() || 'N/A',
            "Days to Convert": daysToConvert || 'N/A'
          }
        })
        break

      default:
        return NextResponse.json({ error: "Invalid report ID" }, { status: 400 })
    }

    // Generate report based on format
    if (format === 'pdf') {
      // Generate PDF
      const pdfBuffer = await generateReportPDF(
        reportName,
        {
          data: reportData,
          headers,
          dateRange,
          generatedBy: session.user?.email || session.user?.name || 'Unknown',
          filters
        },
        'System Report'
      )

      return new Response(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf"`
        }
      })
    } else {
      // Generate Excel (default)
      const wb = XLSX.utils.book_new()
      
      // Add metadata sheet
      const metadataSheet = XLSX.utils.json_to_sheet([
        { Property: "Report Name", Value: reportName },
        { Property: "Generated Date", Value: new Date().toLocaleString() },
        { Property: "Generated By", Value: session.user?.email || session.user?.name || 'Unknown' },
        { Property: "Date Range", Value: `${dateRange.from.toLocaleDateString()} to ${dateRange.to.toLocaleDateString()}` },
        { Property: "Total Records", Value: reportData.length },
        { Property: "Filters Applied", Value: JSON.stringify(filters) }
      ])
      XLSX.utils.book_append_sheet(wb, metadataSheet, "Report Info")

      // Add main data sheet
      const dataSheet = XLSX.utils.json_to_sheet(reportData)
      XLSX.utils.book_append_sheet(wb, dataSheet, "Data")

      // Add summary sheet for applicable reports
      if (['revenue-analysis', 'client-revenue', 'project-progress'].includes(reportId)) {
        let summaryData: any[] = []
        
        if (reportId === 'revenue-analysis') {
          const totalAmount = reportData.reduce((sum, row) => sum + (row.Amount || 0), 0)
          const paidCount = reportData.filter(row => row.Status === 'PAID').length
          const unpaidCount = reportData.length - paidCount
          
          summaryData = [
            { Metric: "Total Records", Value: reportData.length },
            { Metric: "Total Revenue", Value: totalAmount },
            { Metric: "Paid Invoices", Value: paidCount },
            { Metric: "Unpaid Invoices", Value: unpaidCount },
            { Metric: "Average Invoice Value", Value: reportData.length > 0 ? totalAmount / reportData.length : 0 }
          ]
        } else if (reportId === 'client-revenue') {
          const totalRevenue = reportData.reduce((sum, row) => sum + (row["Total Revenue"] || 0), 0)
          const totalProjects = reportData.reduce((sum, row) => sum + (row["Project Count"] || 0), 0)
          
          summaryData = [
            { Metric: "Total Clients", Value: reportData.length },
            { Metric: "Total Revenue", Value: totalRevenue },
            { Metric: "Total Projects", Value: totalProjects },
            { Metric: "Average Revenue per Client", Value: reportData.length > 0 ? totalRevenue / reportData.length : 0 }
          ]
        } else if (reportId === 'project-progress') {
          const completedProjects = reportData.filter(row => row.Status === 'COMPLETED').length
          const inProgressProjects = reportData.filter(row => row.Status === 'IN_PROGRESS').length
          const averageProgress = reportData.reduce((sum, row) => sum + (row["Progress %"] || 0), 0) / reportData.length
          
          summaryData = [
            { Metric: "Total Projects", Value: reportData.length },
            { Metric: "Completed Projects", Value: completedProjects },
            { Metric: "In Progress Projects", Value: inProgressProjects },
            { Metric: "Average Progress", Value: `${averageProgress.toFixed(1)}%` }
          ]
        }
        
        if (summaryData.length > 0) {
          const summarySheet = XLSX.utils.json_to_sheet(summaryData)
          XLSX.utils.book_append_sheet(wb, summarySheet, "Summary")
        }
      }

      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' })

      // Return as downloadable file
      return new Response(excelBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx"`
        }
      })
    }

  } catch (error) {
    console.error("POST /api/reports/generate error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export const dynamic = "force-dynamic"
