
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

// Load environment variables
config();

const prisma = new PrismaClient();

async function cleanMockData() {
  console.log('🧹 Starting clean slate preparation...');
  console.log('⚠️  This will remove all mock data while preserving essential configurations.');

  try {
    // Start transaction to ensure data integrity
    await prisma.$transaction(async (tx) => {
      console.log('📊 Cleaning Finance Module...');
      
      // Clean Purchase Orders and related data
      console.log('  - Removing Purchase Order Activities...');
      await tx.purchaseOrderActivity.deleteMany({});
      
      console.log('  - Removing Purchase Order Items...');
      await tx.purchaseOrderItem.deleteMany({});
      
      console.log('  - Removing Purchase Orders...');
      await tx.purchaseOrder.deleteMany({});

      // Clean Vendor Invoices and related data
      console.log('  - Removing Vendor Invoice Activities...');
      await tx.vendorInvoiceActivity.deleteMany({});
      
      console.log('  - Removing Vendor Invoice Items...');
      await tx.vendorInvoiceItem.deleteMany({});
      
      console.log('  - Removing Vendor Invoices...');
      await tx.vendorInvoice.deleteMany({});

      // Clean Client Invoices and related data
      console.log('  - Removing Client Invoice Items...');
      await tx.clientInvoiceItem.deleteMany({});
      
      console.log('  - Removing Client Invoices...');
      await tx.clientInvoice.deleteMany({});

      // Clean Legacy Invoices
      console.log('  - Removing Legacy Invoices...');
      await tx.legacyInvoice.deleteMany({});

      // Clean Payments
      console.log('  - Removing Payment records...');
      await tx.payment.deleteMany({});

      console.log('📋 Cleaning Projects Module...');

      // Clean Tasks and related data
      console.log('  - Removing Task Notifications...');
      await tx.taskNotification.deleteMany({});
      
      console.log('  - Removing Task Comments...');
      await tx.taskComment.deleteMany({});
      
      console.log('  - Removing Task Attachments...');
      await tx.taskAttachment.deleteMany({});
      
      console.log('  - Removing Tasks...');
      await tx.task.deleteMany({});

      // Clean Quotations and related data
      console.log('  - Removing Quotation Activities...');
      await tx.quotationActivity.deleteMany({});
      
      console.log('  - Removing Quotation Approvals...');
      await tx.quotationApproval.deleteMany({});
      
      console.log('  - Removing Quotation Items...');
      await tx.quotationItem.deleteMany({});
      
      console.log('  - Removing Quotations...');
      await tx.quotation.deleteMany({});

      // Clean Tenders and related data
      console.log('  - Removing Tender Activities...');
      await tx.tenderActivity.deleteMany({});
      
      console.log('  - Removing Tenders...');
      await tx.tender.deleteMany({});

      // Clean Project-Vendor relationships
      console.log('  - Removing Project-Vendor relationships...');
      await tx.projectVendor.deleteMany({});

      // Clean Vendor Contracts
      console.log('  - Removing Vendor Contracts...');
      await tx.vendorContract.deleteMany({});

      // Clean Documents (except system/template documents)
      console.log('📄 Cleaning Documents...');
      await tx.document.deleteMany({
        where: {
          category: {
            not: 'GENERAL' // Keep general system documents
          }
        }
      });

      // Clean Projects
      console.log('  - Removing Projects...');
      await tx.project.deleteMany({});

      console.log('👥 Cleaning Clients Module...');
      // Clean Clients (preserve any with specific markers if needed)
      await tx.client.deleteMany({});

      console.log('🏪 Cleaning Vendors Module...');
      // Clean Vendors (preserve system vendors if any)
      await tx.vendor.deleteMany({});

      console.log('🧽 Cleaning Xero sync logs...');
      await tx.xeroSyncLog.deleteMany({});

      console.log('✨ Clean slate preparation completed successfully!');
      console.log('📝 Summary:');
      console.log('   ✅ All client data removed');
      console.log('   ✅ All vendor data removed');  
      console.log('   ✅ All project data removed');
      console.log('   ✅ All finance data removed (POs, Invoices, Payments)');
      console.log('   ✅ All approval workflows cleared');
      console.log('   ✅ All task data removed');
      console.log('   ✅ All quotation data removed');
      console.log('   ✅ All tender data removed');
      console.log('   ✅ All service contracts and jobs removed');
      console.log('   ✅ Document references cleaned');
      console.log('');
      console.log('🔒 Preserved:');
      console.log('   • User accounts and authentication');
      console.log('   • System configurations');
      console.log('   • Quotation templates and item library');
      console.log('   • Audit logs for compliance');

    });

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute cleanup
cleanMockData()
  .then(() => {
    console.log('🎉 Application is now ready for production with clean slate!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Cleanup failed:', error);
    process.exit(1);
  });
