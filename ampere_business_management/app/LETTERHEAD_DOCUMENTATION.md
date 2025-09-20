
# Professional Letterhead System Documentation

## Overview

This document outlines the professional letterhead format implemented for all business documents in the Ampere Engineering business management system. The letterhead provides a consistent, professional appearance across all document types including quotations, invoices, purchase orders, delivery orders, and job completion certificates.

## Features

### 🎨 Professional Design Elements
- **Company Logo**: Circular gradient logo with company initial
- **Company Information**: Complete contact details and registration numbers
- **Certifications Display**: ISO 9001:2015, BizSafe Level 3, and ISO 45001 badges
- **Consistent Branding**: Red color scheme (#dc2626) throughout
- **Document Type Headers**: Clear identification of document purpose
- **Professional Footer**: Company tagline and disclaimers

### 📄 Supported Document Types
1. **Quotations** - Business proposals and price estimates
2. **Invoices** - Billing documents (ready for future implementation)
3. **Purchase Orders** - Vendor procurement documents
4. **Delivery Orders** - Shipping and delivery documentation
5. **Job Completion Certificates** - Service completion verification
6. **Receipts** - Payment confirmation documents

## Implementation

### File Structure
```
app/
├── components/
│   └── documents/
│       ├── letterhead.tsx          # Main letterhead component
│       └── document-preview.tsx    # Document preview/export component
├── lib/
│   ├── document-templates.ts       # HTML template generators
│   └── document-utils.ts          # Utility functions
├── app/api/
│   ├── quotations/[id]/export/    # Quotation export API
│   ├── finance/purchase-orders/[id]/export/  # PO export API
│   └── servicing/jobs/[id]/completion-certificate/  # Job completion API
└── public/
    └── images/
        └── certifications/        # Certification badge images
```

### Core Components

#### 1. DocumentLetterhead Component
```tsx
import { DocumentLetterhead } from '@/components/documents/letterhead'

<DocumentLetterhead
  documentType="QUOTATION"
  documentNumber="QUO-001-ABC-20240915"
  documentDate={new Date()}
  showCertifications={true}
/>
```

#### 2. Document Templates
```typescript
import { generateQuotationHTML, generatePurchaseOrderHTML } from '@/lib/document-templates'

// Generate complete HTML document with letterhead
const htmlContent = generateQuotationHTML(quotationData)
```

#### 3. Document Preview Component
```tsx
import { DocumentPreview } from '@/components/documents/document-preview'

<DocumentPreview
  documentType="quotation"
  documentId={quotation.id}
  documentNumber={quotation.quotationNumber}
  documentTitle={quotation.title}
  status={quotation.status}
/>
```

## Company Information

### Primary Details
- **Company Name**: AMPERE ENGINEERING PTE LTD
- **Tagline**: Professional Engineering Solutions
- **Address**: 123 Engineering Drive, #05-01 Engineering Hub
- **Location**: Singapore 567890, Singapore
- **Phone**: +65 6123 4567
- **Email**: info@ampereengineering.com.sg
- **Website**: www.ampereengineering.com.sg
- **Registration**: 201234567A
- **GST Number**: M90234567A

### Certifications Displayed
1. **ISO 9001:2015** - Quality Management System
2. **BizSafe Level 3** - Workplace Safety Management
3. **ISO 45001** - Occupational Health & Safety Management

## Document Templates

### 1. Quotation Template
- Client billing information
- Project details and descriptions  
- Itemized pricing with categories
- Subtotal, discount, tax calculations
- Terms and conditions
- Internal notes section

### 2. Purchase Order Template
- Vendor information
- Project association (optional)
- Item specifications with categories
- Delivery requirements
- Payment terms
- Authorization signatures

### 3. Job Completion Certificate Template
- Client information
- Work performed details
- Materials/parts used
- Completion certification
- Technician and client signatures
- Professional certification stamp

## API Endpoints

### Export URLs
```
GET /api/quotations/[id]/export
GET /api/finance/purchase-orders/[id]/export  
GET /api/servicing/jobs/[id]/completion-certificate
```

### Response Format
- **Content-Type**: `text/html`
- **Output**: Professional HTML document with embedded CSS
- **Print-Ready**: Optimized for A4 printing and PDF conversion

## Usage Examples

### 1. Adding Export to Existing Pages
```tsx
// Add export button to document details page
<Button 
  variant="outline"
  onClick={() => window.open(`/api/quotations/${quotation.id}/export`, '_blank')}
>
  <FileDown className="mr-2 h-4 w-4" />
  Export Document
</Button>
```

### 2. Generating PDF
```javascript
// Users can print to PDF using browser print functionality
// Or integrate with headless browser tools like Puppeteer
const printWindow = window.open(exportUrl, '_blank')
printWindow.onload = () => printWindow.print()
```

### 3. Email Integration
```tsx
// Future enhancement - direct email with document attachment
<Button onClick={() => emailDocument(documentId)}>
  <Mail className="mr-2 h-4 w-4" />
  Email Document
</Button>
```

## Customization

### Updating Company Information
Edit the `COMPANY_INFO` object in `/lib/document-templates.ts`:

```typescript
export const COMPANY_INFO: CompanyInfo = {
  name: "YOUR COMPANY NAME",
  address: "Your Address",
  // ... other details
}
```

### Modifying Design
Update CSS styles in the `generateDocumentHTML` function or create custom themes:

```typescript
// Modify colors, fonts, layout in the <style> section
.company-name {
  color: #your-brand-color;
  font-size: 28px;
}
```

### Adding New Document Types
1. Create new template function in `document-templates.ts`
2. Add new API route in `/app/api/[document-type]/[id]/export/`
3. Update TypeScript types for new document type

## Best Practices

### 1. Consistent Formatting
- Always use the standard letterhead for official documents
- Maintain consistent spacing and typography
- Include all required legal information (GST, registration numbers)

### 2. Professional Presentation
- Use high-quality logo and certification images
- Ensure proper alignment and clean layouts
- Include appropriate terms and conditions for each document type

### 3. Data Validation
```typescript
import { validateDocumentData } from '@/lib/document-utils'

const requiredFields = ['client.name', 'client.email', 'totalAmount']
const validation = validateDocumentData(documentData, requiredFields)

if (!validation.isValid) {
  // Handle missing required fields
  console.error('Missing fields:', validation.missingFields)
}
```

### 4. Error Handling
```typescript
try {
  const htmlContent = generateQuotationHTML(quotation)
  return new NextResponse(htmlContent, { status: 200 })
} catch (error) {
  console.error('Error generating document:', error)
  return NextResponse.json({ error: 'Document generation failed' }, { status: 500 })
}
```

## Browser Compatibility

### Print Optimization
- Optimized for A4 paper size (210mm × 297mm)
- Print-specific CSS media queries
- Page break handling for multi-page documents
- High-resolution output suitable for PDF generation

### Responsive Design
- Mobile-friendly responsive layouts
- Collapsible sections on smaller screens
- Touch-friendly buttons and controls

## Future Enhancements

### Planned Features
1. **PDF Generation**: Server-side PDF creation with Puppeteer
2. **Email Integration**: Direct document emailing with attachments
3. **Digital Signatures**: Electronic signature integration
4. **Template Customization**: User-configurable templates
5. **Multi-language Support**: Localization for different regions
6. **Bulk Export**: Batch document generation
7. **Custom Branding**: Customer-specific letterheads for white-label solutions

### Integration Possibilities
- **Xero Integration**: Direct export to accounting system
- **DocuSign**: Electronic signature workflows
- **Email Marketing**: Automated document delivery
- **Cloud Storage**: Direct save to Google Drive/Dropbox
- **CRM Integration**: Link to customer relationship management

## Testing

### Manual Testing Checklist
- [ ] All company information displays correctly
- [ ] Certifications show properly
- [ ] Document formatting is consistent
- [ ] Print preview looks professional
- [ ] Export functionality works in all browsers
- [ ] Mobile responsive design functions correctly
- [ ] All document types generate without errors

### Automated Testing
```bash
# Test document generation APIs
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/quotations/123/export

# Validate HTML output
# Check for required elements: company name, logo, document content
```

## Support

For questions or issues related to the letterhead system:

1. **Development Issues**: Check browser console for errors
2. **Design Changes**: Modify CSS in `document-templates.ts`
3. **New Document Types**: Follow the template pattern in existing implementations
4. **API Problems**: Verify authentication and data availability

## Conclusion

This professional letterhead system provides a robust, scalable solution for generating consistent business documents across the Ampere Engineering platform. The modular design allows for easy customization while maintaining professional standards and regulatory compliance.

The system is production-ready and can be easily extended for additional document types and custom requirements. All generated documents maintain the professional appearance expected in business communications while providing the flexibility needed for various document formats and use cases.
