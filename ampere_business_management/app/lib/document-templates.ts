
import { TemplateType, ProjectDocumentCategory, ProjectDocumentType } from "@prisma/client"

export interface DocumentTemplateField {
  id: string
  label: string
  type: 'text' | 'textarea' | 'date' | 'select' | 'checkbox' | 'number' | 'file'
  required?: boolean
  options?: string[]
  placeholder?: string
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}

export interface DocumentTemplate {
  id: string
  name: string
  templateType: ProjectDocumentType
  category: ProjectDocumentCategory
  description: string
  fields: DocumentTemplateField[]
  sections?: {
    title: string
    fields: string[]
  }[]
}

export const DEFAULT_TEMPLATES: DocumentTemplate[] = [
  // PRE-CONSTRUCTION TEMPLATES
  {
    id: 'pre-construction-survey-template',
    name: 'Pre-Construction Survey',
    templateType: 'PRE_CONSTRUCTION_SURVEY',
    category: 'PRE_CONSTRUCTION',
    description: 'Comprehensive site survey before construction begins',
    fields: [
      { id: 'project-id', label: 'Project ID', type: 'text', required: true, placeholder: 'AMP-YYYY-XXX' },
      { id: 'survey-date', label: 'Survey Date', type: 'date', required: true },
      { id: 'site-address', label: 'Site Address', type: 'textarea', required: true, placeholder: 'Complete site address' },
      { id: 'surveyor-name', label: 'Surveyor Name', type: 'text', required: true },
      { id: 'surveyor-license', label: 'Surveyor License', type: 'text', required: true, placeholder: 'BCA License Number' },
      { id: 'site-boundaries', label: 'Site Boundaries (GPS)', type: 'textarea', required: true },
      { id: 'existing-structures', label: 'Existing Structures', type: 'textarea', placeholder: 'Detailed description' },
      { id: 'utilities-location', label: 'Utilities Location', type: 'textarea', required: true },
      { id: 'soil-conditions', label: 'Soil Conditions', type: 'textarea', required: true },
      { id: 'access-routes', label: 'Access Routes', type: 'textarea', required: true },
      { id: 'environmental-hazards', label: 'Environmental Hazards', type: 'textarea', required: true },
      { id: 'neighboring-properties', label: 'Neighboring Properties Impact', type: 'textarea', required: true }
    ],
    sections: [
      { title: 'Site Information', fields: ['project-id', 'survey-date', 'site-address', 'surveyor-name', 'surveyor-license'] },
      { title: 'Physical Conditions', fields: ['site-boundaries', 'existing-structures', 'soil-conditions'] },
      { title: 'Utilities and Services', fields: ['utilities-location'] },
      { title: 'Environmental Assessment', fields: ['access-routes', 'environmental-hazards', 'neighboring-properties'] }
    ]
  },
  {
    id: 'site-safety-plan-template',
    name: 'Site Safety Plan',
    templateType: 'SITE_SAFETY_PLAN',
    category: 'PRE_CONSTRUCTION',
    description: 'Comprehensive site safety management plan',
    fields: [
      { id: 'project-id', label: 'Project ID', type: 'text', required: true },
      { id: 'plan-version', label: 'Plan Version', type: 'text', required: true, placeholder: 'V1.0' },
      { id: 'effective-date', label: 'Effective Date', type: 'date', required: true },
      { id: 'project-manager', label: 'Project Manager', type: 'text', required: true },
      { id: 'safety-officer', label: 'Safety Officer', type: 'text', required: true },
      { id: 'site-address', label: 'Site Address', type: 'textarea', required: true },
      { id: 'project-duration', label: 'Project Duration', type: 'text', required: true },
      { id: 'work-activities', label: 'Work Activities', type: 'textarea', required: true },
      { id: 'high-risk-activities', label: 'High-Risk Activities', type: 'textarea', required: true },
      { id: 'emergency-contacts', label: 'Emergency Contacts', type: 'textarea', required: true },
      { id: 'evacuation-routes', label: 'Evacuation Routes', type: 'textarea', required: true },
      { id: 'assembly-points', label: 'Assembly Points', type: 'textarea', required: true },
      { id: 'first-aid-facilities', label: 'First Aid Facilities', type: 'textarea', required: true },
      { id: 'fire-safety-equipment', label: 'Fire Safety Equipment', type: 'textarea', required: true },
      { id: 'ppe-requirements', label: 'PPE Requirements', type: 'textarea', required: true }
    ],
    sections: [
      { title: 'Project Overview', fields: ['project-id', 'plan-version', 'effective-date', 'project-manager', 'safety-officer', 'site-address'] },
      { title: 'Work Activities', fields: ['project-duration', 'work-activities', 'high-risk-activities'] },
      { title: 'Emergency Preparedness', fields: ['emergency-contacts', 'evacuation-routes', 'assembly-points'] },
      { title: 'Safety Equipment', fields: ['first-aid-facilities', 'fire-safety-equipment', 'ppe-requirements'] }
    ]
  },
  {
    id: 'risk-assessment-template',
    name: 'Risk Assessment',
    templateType: 'RISK_ASSESSMENT',
    category: 'PRE_CONSTRUCTION',
    description: 'Comprehensive risk assessment for construction activities',
    fields: [
      { id: 'assessment-id', label: 'Assessment ID', type: 'text', required: true },
      { id: 'assessment-date', label: 'Assessment Date', type: 'date', required: true },
      { id: 'assessor-name', label: 'Assessor Name', type: 'text', required: true },
      { id: 'assessor-qualification', label: 'Assessor Qualification', type: 'text', required: true },
      { id: 'activity-process', label: 'Activity/Process', type: 'text', required: true },
      { id: 'location', label: 'Location', type: 'text', required: true },
      { id: 'personnel-involved', label: 'Personnel Involved', type: 'number', required: true },
      { id: 'hazard-description', label: 'Hazard Description', type: 'textarea', required: true },
      { id: 'risk-category', label: 'Risk Category', type: 'select', required: true, options: ['Safety', 'Health', 'Environmental'] },
      { id: 'likelihood', label: 'Likelihood (1-5)', type: 'select', required: true, options: ['1', '2', '3', '4', '5'] },
      { id: 'severity', label: 'Severity (1-5)', type: 'select', required: true, options: ['1', '2', '3', '4', '5'] },
      { id: 'existing-controls', label: 'Existing Controls', type: 'textarea', required: true },
      { id: 'additional-controls', label: 'Additional Controls', type: 'textarea' },
      { id: 'residual-risk', label: 'Residual Risk', type: 'select', required: true, options: ['Low', 'Medium', 'High', 'Critical'] },
      { id: 'review-date', label: 'Review Date', type: 'date', required: true }
    ],
    sections: [
      { title: 'Assessment Details', fields: ['assessment-id', 'assessment-date', 'assessor-name', 'assessor-qualification'] },
      { title: 'Hazard Identification', fields: ['activity-process', 'location', 'personnel-involved', 'hazard-description', 'risk-category'] },
      { title: 'Risk Evaluation', fields: ['likelihood', 'severity', 'existing-controls', 'additional-controls'] },
      { title: 'Risk Rating', fields: ['residual-risk', 'review-date'] }
    ]
  },
  {
    id: 'work-method-statement-template',
    name: 'Work Method Statement',
    templateType: 'WORK_METHOD_STATEMENT',
    category: 'PRE_CONSTRUCTION',
    description: 'Detailed methodology for specific construction activities',
    fields: [
      { id: 'wms-id', label: 'WMS ID', type: 'text', required: true },
      { id: 'activity-description', label: 'Activity Description', type: 'textarea', required: true },
      { id: 'location', label: 'Location', type: 'text', required: true },
      { id: 'start-date', label: 'Start Date', type: 'date', required: true },
      { id: 'duration', label: 'Duration (days)', type: 'number', required: true },
      { id: 'supervisor', label: 'Supervisor', type: 'text', required: true },
      { id: 'crew-size', label: 'Crew Size', type: 'number', required: true },
      { id: 'equipment-required', label: 'Equipment Required', type: 'textarea', required: true },
      { id: 'materials-required', label: 'Materials Required', type: 'textarea', required: true },
      { id: 'sequence-of-work', label: 'Sequence of Work', type: 'textarea', required: true },
      { id: 'safety-precautions', label: 'Safety Precautions', type: 'textarea', required: true },
      { id: 'quality-requirements', label: 'Quality Requirements', type: 'textarea', required: true },
      { id: 'environmental-controls', label: 'Environmental Controls', type: 'textarea', required: true },
      { id: 'inspection-points', label: 'Inspection Points', type: 'textarea', required: true },
      { id: 'acceptance-criteria', label: 'Acceptance Criteria', type: 'textarea', required: true }
    ],
    sections: [
      { title: 'Work Description', fields: ['wms-id', 'activity-description', 'location', 'start-date', 'duration'] },
      { title: 'Resources', fields: ['supervisor', 'crew-size', 'equipment-required', 'materials-required'] },
      { title: 'Methodology', fields: ['sequence-of-work', 'safety-precautions', 'quality-requirements'] },
      { title: 'Controls & Inspection', fields: ['environmental-controls', 'inspection-points', 'acceptance-criteria'] }
    ]
  },
  {
    id: 'permit-to-work-template',
    name: 'Permit to Work',
    templateType: 'PERMIT_TO_WORK',
    category: 'PRE_CONSTRUCTION',
    description: 'General permit to work authorization',
    fields: [
      { id: 'permit-number', label: 'Permit Number', type: 'text', required: true },
      { id: 'work-type', label: 'Work Type', type: 'select', required: true, options: ['Hot Work', 'Lifting', 'Confined Space', 'Excavation', 'General'] },
      { id: 'location', label: 'Work Location', type: 'text', required: true },
      { id: 'start-datetime', label: 'Start Date & Time', type: 'text', required: true },
      { id: 'end-datetime', label: 'End Date & Time', type: 'text', required: true },
      { id: 'work-description', label: 'Work Description', type: 'textarea', required: true },
      { id: 'applicant-name', label: 'Applicant Name', type: 'text', required: true },
      { id: 'supervisor', label: 'Work Supervisor', type: 'text', required: true },
      { id: 'safety-requirements', label: 'Safety Requirements', type: 'textarea', required: true },
      { id: 'protective-measures', label: 'Protective Measures', type: 'textarea', required: true },
      { id: 'equipment-isolated', label: 'Equipment Isolated', type: 'textarea' },
      { id: 'gas-test-required', label: 'Gas Test Required', type: 'checkbox' },
      { id: 'fire-watch-required', label: 'Fire Watch Required', type: 'checkbox' },
      { id: 'issuer-name', label: 'Permit Issuer', type: 'text', required: true },
      { id: 'approval-date', label: 'Approval Date', type: 'date', required: true }
    ],
    sections: [
      { title: 'Permit Details', fields: ['permit-number', 'work-type', 'location', 'start-datetime', 'end-datetime'] },
      { title: 'Work Information', fields: ['work-description', 'applicant-name', 'supervisor'] },
      { title: 'Safety Requirements', fields: ['safety-requirements', 'protective-measures', 'equipment-isolated'] },
      { title: 'Special Requirements', fields: ['gas-test-required', 'fire-watch-required'] },
      { title: 'Authorization', fields: ['issuer-name', 'approval-date'] }
    ]
  },
  {
    id: 'hot-work-permit-template',
    name: 'Hot Work Permit',
    templateType: 'HOT_WORK_PERMIT',
    category: 'PRE_CONSTRUCTION',
    description: 'Permit for welding, cutting, and other hot work activities',
    fields: [
      { id: 'permit-number', label: 'Hot Work Permit Number', type: 'text', required: true },
      { id: 'work-location', label: 'Work Location', type: 'text', required: true },
      { id: 'start-time', label: 'Start Time', type: 'text', required: true },
      { id: 'end-time', label: 'End Time', type: 'text', required: true },
      { id: 'work-description', label: 'Description of Hot Work', type: 'textarea', required: true },
      { id: 'equipment-used', label: 'Hot Work Equipment', type: 'textarea', required: true },
      { id: 'fire-prevention', label: 'Fire Prevention Measures', type: 'textarea', required: true },
      { id: 'fire-extinguishers', label: 'Fire Extinguishers Available', type: 'text', required: true },
      { id: 'combustible-removed', label: 'Combustible Materials Removed', type: 'checkbox', required: true },
      { id: 'fire-watch-person', label: 'Fire Watch Person', type: 'text', required: true },
      { id: 'gas-test-clear', label: 'Gas Test Clear', type: 'checkbox' },
      { id: 'ventilation-adequate', label: 'Adequate Ventilation', type: 'checkbox' },
      { id: 'authorized-by', label: 'Authorized By', type: 'text', required: true },
      { id: 'work-completed-time', label: 'Work Completed Time', type: 'text' },
      { id: 'final-inspection', label: 'Final Inspection Complete', type: 'checkbox' }
    ],
    sections: [
      { title: 'Permit Information', fields: ['permit-number', 'work-location', 'start-time', 'end-time'] },
      { title: 'Work Details', fields: ['work-description', 'equipment-used'] },
      { title: 'Fire Safety', fields: ['fire-prevention', 'fire-extinguishers', 'combustible-removed', 'fire-watch-person'] },
      { title: 'Safety Checks', fields: ['gas-test-clear', 'ventilation-adequate'] },
      { title: 'Authorization & Completion', fields: ['authorized-by', 'work-completed-time', 'final-inspection'] }
    ]
  },
  {
    id: 'lifting-permit-template',
    name: 'Lifting Permit',
    templateType: 'LIFTING_PERMIT',
    category: 'PRE_CONSTRUCTION',
    description: 'Permit for crane and lifting operations',
    fields: [
      { id: 'permit-number', label: 'Lifting Permit Number', type: 'text', required: true },
      { id: 'crane-type', label: 'Type of Crane/Lifting Equipment', type: 'text', required: true },
      { id: 'operator-name', label: 'Crane Operator Name', type: 'text', required: true },
      { id: 'operator-license', label: 'Operator License Number', type: 'text', required: true },
      { id: 'lift-supervisor', label: 'Lift Supervisor', type: 'text', required: true },
      { id: 'load-weight', label: 'Load Weight (kg)', type: 'number', required: true },
      { id: 'lift-height', label: 'Maximum Lift Height (m)', type: 'number', required: true },
      { id: 'lift-radius', label: 'Lift Radius (m)', type: 'number' },
      { id: 'ground-conditions', label: 'Ground Conditions Assessed', type: 'checkbox', required: true },
      { id: 'exclusion-zone', label: 'Exclusion Zone Established', type: 'checkbox', required: true },
      { id: 'weather-conditions', label: 'Weather Conditions Suitable', type: 'checkbox', required: true },
      { id: 'crane-inspected', label: 'Crane Daily Inspection Complete', type: 'checkbox', required: true },
      { id: 'rigging-gear', label: 'Rigging Gear Inspected', type: 'checkbox', required: true },
      { id: 'communication-method', label: 'Communication Method', type: 'text', required: true },
      { id: 'emergency-procedures', label: 'Emergency Procedures Briefed', type: 'checkbox', required: true }
    ],
    sections: [
      { title: 'Permit & Equipment Details', fields: ['permit-number', 'crane-type', 'operator-name', 'operator-license'] },
      { title: 'Personnel & Load', fields: ['lift-supervisor', 'load-weight', 'lift-height', 'lift-radius'] },
      { title: 'Safety Checks', fields: ['ground-conditions', 'exclusion-zone', 'weather-conditions', 'crane-inspected'] },
      { title: 'Communication & Emergency', fields: ['rigging-gear', 'communication-method', 'emergency-procedures'] }
    ]
  },
  {
    id: 'confined-space-permit-template',
    name: 'Confined Space Permit',
    templateType: 'CONFINED_SPACE_PERMIT',
    category: 'PRE_CONSTRUCTION',
    description: 'Permit for entry into confined spaces',
    fields: [
      { id: 'permit-number', label: 'Confined Space Permit Number', type: 'text', required: true },
      { id: 'space-location', label: 'Confined Space Location', type: 'text', required: true },
      { id: 'space-description', label: 'Description of Space', type: 'textarea', required: true },
      { id: 'entry-supervisor', label: 'Entry Supervisor', type: 'text', required: true },
      { id: 'entrants', label: 'Authorized Entrants', type: 'textarea', required: true },
      { id: 'attendant', label: 'Attendant', type: 'text', required: true },
      { id: 'entry-purpose', label: 'Purpose of Entry', type: 'textarea', required: true },
      { id: 'entry-date', label: 'Entry Date', type: 'date', required: true },
      { id: 'entry-time', label: 'Entry Time', type: 'text', required: true },
      { id: 'oxygen-level', label: 'Oxygen Level (%)', type: 'number', required: true },
      { id: 'lel-reading', label: 'LEL Reading (%)', type: 'number', required: true },
      { id: 'toxic-gases', label: 'Toxic Gases (ppm)', type: 'number' },
      { id: 'ventilation-required', label: 'Mechanical Ventilation Required', type: 'checkbox' },
      { id: 'rescue-equipment', label: 'Rescue Equipment Available', type: 'textarea', required: true },
      { id: 'communication-procedures', label: 'Communication Procedures', type: 'textarea', required: true }
    ],
    sections: [
      { title: 'Permit Details', fields: ['permit-number', 'space-location', 'space-description'] },
      { title: 'Personnel', fields: ['entry-supervisor', 'entrants', 'attendant'] },
      { title: 'Entry Information', fields: ['entry-purpose', 'entry-date', 'entry-time'] },
      { title: 'Atmospheric Testing', fields: ['oxygen-level', 'lel-reading', 'toxic-gases', 'ventilation-required'] },
      { title: 'Emergency Preparedness', fields: ['rescue-equipment', 'communication-procedures'] }
    ]
  },
  {
    id: 'worker-list-template',
    name: 'Worker List',
    templateType: 'WORKER_LIST',
    category: 'PRE_CONSTRUCTION',
    description: 'List of authorized workers for the project',
    fields: [
      { id: 'project-id', label: 'Project ID', type: 'text', required: true },
      { id: 'list-date', label: 'List Date', type: 'date', required: true },
      { id: 'total-workers', label: 'Total Number of Workers', type: 'number', required: true },
      { id: 'supervisor-name', label: 'Site Supervisor', type: 'text', required: true },
      { id: 'safety-officer', label: 'Safety Officer', type: 'text', required: true },
      { id: 'workers-details', label: 'Workers Details (Name, NRIC, Trade, Certification)', type: 'textarea', required: true },
      { id: 'subcontractors', label: 'Subcontractors', type: 'textarea' },
      { id: 'emergency-contacts', label: 'Emergency Contact Numbers', type: 'textarea', required: true },
      { id: 'medical-fitness', label: 'Medical Fitness Verified', type: 'checkbox', required: true },
      { id: 'safety-training', label: 'Safety Training Complete', type: 'checkbox', required: true },
      { id: 'work-passes', label: 'Work Passes Valid', type: 'checkbox', required: true },
      { id: 'insurance-coverage', label: 'Insurance Coverage Confirmed', type: 'checkbox', required: true }
    ],
    sections: [
      { title: 'Project Information', fields: ['project-id', 'list-date', 'total-workers'] },
      { title: 'Supervision', fields: ['supervisor-name', 'safety-officer'] },
      { title: 'Worker Details', fields: ['workers-details', 'subcontractors', 'emergency-contacts'] },
      { title: 'Compliance Verification', fields: ['medical-fitness', 'safety-training', 'work-passes', 'insurance-coverage'] }
    ]
  },

  // Additional templates for missing document types
  {
    id: 'inspection-test-plan-template',
    name: 'Inspection & Test Plan',
    templateType: 'INSPECTION_TEST_PLAN',
    category: 'CONSTRUCTION',
    description: 'Comprehensive inspection and testing plan',
    fields: [
      { id: 'itp-number', label: 'ITP Number', type: 'text', required: true },
      { id: 'project-name', label: 'Project Name', type: 'text', required: true },
      { id: 'scope-of-work', label: 'Scope of Work', type: 'textarea', required: true },
      { id: 'inspection-stages', label: 'Inspection Stages', type: 'textarea', required: true },
      { id: 'test-methods', label: 'Test Methods', type: 'textarea', required: true },
      { id: 'acceptance-criteria', label: 'Acceptance Criteria', type: 'textarea', required: true },
      { id: 'responsible-parties', label: 'Responsible Parties', type: 'textarea', required: true },
      { id: 'equipment-required', label: 'Testing Equipment Required', type: 'textarea', required: true }
    ],
    sections: [
      { title: 'Plan Information', fields: ['itp-number', 'project-name', 'scope-of-work'] },
      { title: 'Testing Details', fields: ['inspection-stages', 'test-methods', 'acceptance-criteria'] },
      { title: 'Resources', fields: ['responsible-parties', 'equipment-required'] }
    ]
  },
  {
    id: 'quality-checklist-template',
    name: 'Quality Checklist',
    templateType: 'QUALITY_CHECKLIST',
    category: 'CONSTRUCTION',
    description: 'Quality control checklist for construction activities',
    fields: [
      { id: 'checklist-id', label: 'Checklist ID', type: 'text', required: true },
      { id: 'activity-type', label: 'Activity Type', type: 'text', required: true },
      { id: 'inspection-date', label: 'Inspection Date', type: 'date', required: true },
      { id: 'inspector-name', label: 'Inspector Name', type: 'text', required: true },
      { id: 'work-location', label: 'Work Location', type: 'text', required: true },
      { id: 'quality-requirements', label: 'Quality Requirements', type: 'textarea', required: true },
      { id: 'inspection-results', label: 'Inspection Results', type: 'textarea', required: true },
      { id: 'conformance-status', label: 'Conformance Status', type: 'select', required: true, options: ['Conforming', 'Non-Conforming', 'Conditional'] },
      { id: 'corrective-actions', label: 'Corrective Actions Required', type: 'textarea' }
    ]
  },
  {
    id: 'material-delivery-note-template',
    name: 'Material Delivery Note',
    templateType: 'MATERIAL_DELIVERY_NOTE',
    category: 'CONSTRUCTION',
    description: 'Material delivery and receipt documentation',
    fields: [
      { id: 'delivery-note-number', label: 'Delivery Note Number', type: 'text', required: true },
      { id: 'delivery-date', label: 'Delivery Date', type: 'date', required: true },
      { id: 'supplier-name', label: 'Supplier Name', type: 'text', required: true },
      { id: 'materials-delivered', label: 'Materials Delivered', type: 'textarea', required: true },
      { id: 'quantity-ordered', label: 'Quantity Ordered', type: 'text', required: true },
      { id: 'quantity-received', label: 'Quantity Received', type: 'text', required: true },
      { id: 'condition-on-delivery', label: 'Condition on Delivery', type: 'textarea', required: true },
      { id: 'received-by', label: 'Received By', type: 'text', required: true },
      { id: 'storage-location', label: 'Storage Location', type: 'text', required: true }
    ]
  },
  {
    id: 'variation-order-template',
    name: 'Variation Order',
    templateType: 'VARIATION_ORDER',
    category: 'CONSTRUCTION',
    description: 'Contract variation order documentation',
    fields: [
      { id: 'vo-number', label: 'Variation Order Number', type: 'text', required: true },
      { id: 'project-name', label: 'Project Name', type: 'text', required: true },
      { id: 'client-name', label: 'Client Name', type: 'text', required: true },
      { id: 'variation-description', label: 'Description of Variation', type: 'textarea', required: true },
      { id: 'reason-for-variation', label: 'Reason for Variation', type: 'textarea', required: true },
      { id: 'cost-impact', label: 'Cost Impact', type: 'number', required: true },
      { id: 'time-impact', label: 'Time Impact (days)', type: 'number' },
      { id: 'approval-status', label: 'Approval Status', type: 'select', options: ['Pending', 'Approved', 'Rejected'], required: true },
      { id: 'approved-by', label: 'Approved By', type: 'text' },
      { id: 'approval-date', label: 'Approval Date', type: 'date' }
    ]
  },
  {
    id: 'accident-report-template',
    name: 'Accident Report',
    templateType: 'ACCIDENT_REPORT',
    category: 'CONSTRUCTION',
    description: 'Serious accident reporting form',
    fields: [
      { id: 'accident-date', label: 'Date of Accident', type: 'date', required: true },
      { id: 'accident-time', label: 'Time of Accident', type: 'text', required: true },
      { id: 'location', label: 'Location of Accident', type: 'text', required: true },
      { id: 'injured-person', label: 'Injured Person Details', type: 'textarea', required: true },
      { id: 'injury-description', label: 'Description of Injury', type: 'textarea', required: true },
      { id: 'medical-treatment', label: 'Medical Treatment Required', type: 'textarea', required: true },
      { id: 'hospital-details', label: 'Hospital/Clinic Details', type: 'text' },
      { id: 'witness-statements', label: 'Witness Statements', type: 'textarea', required: true },
      { id: 'investigation-findings', label: 'Investigation Findings', type: 'textarea', required: true },
      { id: 'mom-notification', label: 'MOM Notification Required', type: 'checkbox' },
      { id: 'notification-date', label: 'Notification Date', type: 'date' }
    ]
  },
  {
    id: 'progress-photos-template',
    name: 'Progress Photos',
    templateType: 'PROGRESS_PHOTOS',
    category: 'CONSTRUCTION',
    description: 'Construction progress photo documentation',
    fields: [
      { id: 'photo-date', label: 'Photo Date', type: 'date', required: true },
      { id: 'work-area', label: 'Work Area/Location', type: 'text', required: true },
      { id: 'progress-percentage', label: 'Progress Percentage', type: 'number', required: true },
      { id: 'activities-shown', label: 'Activities Shown', type: 'textarea', required: true },
      { id: 'photo-descriptions', label: 'Photo Descriptions', type: 'textarea', required: true },
      { id: 'photographer', label: 'Photographer', type: 'text', required: true },
      { id: 'weather-conditions', label: 'Weather Conditions', type: 'text' },
      { id: 'next-activities', label: 'Next Planned Activities', type: 'textarea' }
    ]
  },

  // CONSTRUCTION TEMPLATES
  {
    id: 'daily-site-report-template',
    name: 'Daily Site Report',
    templateType: 'DAILY_SITE_REPORT',
    category: 'CONSTRUCTION',
    description: 'Daily progress and activity report',
    fields: [
      { id: 'report-date', label: 'Report Date', type: 'date', required: true },
      { id: 'weather-conditions', label: 'Weather Conditions', type: 'select', required: true, options: ['Fine', 'Cloudy', 'Light Rain', 'Heavy Rain', 'Windy'] },
      { id: 'temperature', label: 'Temperature (°C)', type: 'number' },
      { id: 'workers-present', label: 'Number of Workers Present', type: 'number', required: true },
      { id: 'work-activities', label: 'Work Activities Performed', type: 'textarea', required: true },
      { id: 'progress-percentage', label: 'Overall Progress (%)', type: 'number', required: true },
      { id: 'materials-delivered', label: 'Materials Delivered', type: 'textarea' },
      { id: 'equipment-used', label: 'Equipment Used', type: 'textarea' },
      { id: 'safety-incidents', label: 'Safety Incidents', type: 'textarea' },
      { id: 'quality-issues', label: 'Quality Issues', type: 'textarea' },
      { id: 'delays-encountered', label: 'Delays Encountered', type: 'textarea' },
      { id: 'visitors', label: 'Site Visitors', type: 'textarea' },
      { id: 'next-day-plan', label: 'Next Day Plan', type: 'textarea', required: true },
      { id: 'reported-by', label: 'Reported By', type: 'text', required: true }
    ],
    sections: [
      { title: 'General Information', fields: ['report-date', 'weather-conditions', 'temperature', 'workers-present'] },
      { title: 'Work Progress', fields: ['work-activities', 'progress-percentage', 'materials-delivered', 'equipment-used'] },
      { title: 'Issues & Incidents', fields: ['safety-incidents', 'quality-issues', 'delays-encountered'] },
      { title: 'Additional Information', fields: ['visitors', 'next-day-plan', 'reported-by'] }
    ]
  },
  {
    id: 'incident-report-template',
    name: 'Incident Report',
    templateType: 'INCIDENT_REPORT',
    category: 'CONSTRUCTION',
    description: 'Comprehensive incident and accident reporting',
    fields: [
      { id: 'incident-date', label: 'Date of Incident', type: 'date', required: true },
      { id: 'incident-time', label: 'Time of Incident', type: 'text', required: true, placeholder: 'HH:MM' },
      { id: 'location', label: 'Location of Incident', type: 'text', required: true },
      { id: 'incident-type', label: 'Type of Incident', type: 'select', required: true, options: ['Near Miss', 'First Aid', 'Medical Treatment', 'Lost Time', 'Property Damage', 'Environmental'] },
      { id: 'severity', label: 'Severity Level', type: 'select', required: true, options: ['Low', 'Medium', 'High', 'Critical'] },
      { id: 'injured-person', label: 'Injured/Affected Person', type: 'text', placeholder: 'Name of person (if applicable)' },
      { id: 'injury-type', label: 'Type of Injury', type: 'text' },
      { id: 'body-part', label: 'Body Part Affected', type: 'text' },
      { id: 'witness-details', label: 'Witness Details', type: 'textarea', placeholder: 'Names and contact details of witnesses' },
      { id: 'description', label: 'Description of Incident', type: 'textarea', required: true },
      { id: 'immediate-cause', label: 'Immediate Cause', type: 'textarea', required: true },
      { id: 'root-cause', label: 'Root Cause Analysis', type: 'textarea' },
      { id: 'immediate-actions', label: 'Immediate Actions Taken', type: 'textarea', required: true },
      { id: 'corrective-actions', label: 'Corrective Actions Required', type: 'textarea', required: true },
      { id: 'reported-by', label: 'Reported By', type: 'text', required: true }
    ],
    sections: [
      { title: 'Incident Details', fields: ['incident-date', 'incident-time', 'location', 'incident-type', 'severity'] },
      { title: 'Injured Person', fields: ['injured-person', 'injury-type', 'body-part'] },
      { title: 'Incident Description', fields: ['witness-details', 'description', 'immediate-cause', 'root-cause'] },
      { title: 'Actions & Response', fields: ['immediate-actions', 'corrective-actions', 'reported-by'] }
    ]
  },
  {
    id: 'toolbox-meeting-template',
    name: 'Toolbox Meeting Record',
    templateType: 'TOOLBOX_MEETING',
    category: 'CONSTRUCTION',
    description: 'Daily safety toolbox meeting record',
    fields: [
      { id: 'meeting-date', label: 'Meeting Date', type: 'date', required: true },
      { id: 'meeting-time', label: 'Meeting Time', type: 'text', required: true, placeholder: 'HH:MM' },
      { id: 'location', label: 'Meeting Location', type: 'text', required: true },
      { id: 'conducted-by', label: 'Meeting Conducted By', type: 'text', required: true },
      { id: 'attendees-count', label: 'Number of Attendees', type: 'number', required: true },
      { id: 'attendees-list', label: 'Attendees List', type: 'textarea', required: true },
      { id: 'topics-discussed', label: 'Safety Topics Discussed', type: 'textarea', required: true },
      { id: 'hazards-identified', label: 'New Hazards Identified', type: 'textarea' },
      { id: 'safety-reminders', label: 'Safety Reminders', type: 'textarea' },
      { id: 'ppe-requirements', label: 'PPE Requirements Discussed', type: 'textarea' },
      { id: 'actions-required', label: 'Follow-up Actions Required', type: 'textarea' },
      { id: 'next-meeting', label: 'Next Meeting Date', type: 'date' }
    ],
    sections: [
      { title: 'Meeting Information', fields: ['meeting-date', 'meeting-time', 'location', 'conducted-by'] },
      { title: 'Attendance', fields: ['attendees-count', 'attendees-list'] },
      { title: 'Discussion Topics', fields: ['topics-discussed', 'hazards-identified', 'safety-reminders'] },
      { title: 'Requirements & Follow-up', fields: ['ppe-requirements', 'actions-required', 'next-meeting'] }
    ]
  },

  // HANDOVER & COMPLETION TEMPLATES
  {
    id: 'handover-form-template',
    name: 'Project Handover Form',
    templateType: 'HANDOVER_FORM',
    category: 'HANDOVER_COMPLETION',
    description: 'Comprehensive project handover documentation',
    fields: [
      { id: 'project-name', label: 'Project Name', type: 'text', required: true },
      { id: 'client-name', label: 'Client Name', type: 'text', required: true },
      { id: 'handover-date', label: 'Handover Date', type: 'date', required: true },
      { id: 'completion-date', label: 'Actual Completion Date', type: 'date', required: true },
      { id: 'project-manager', label: 'Project Manager', type: 'text', required: true },
      { id: 'client-representative', label: 'Client Representative', type: 'text', required: true },
      { id: 'work-completed', label: 'Work Completed Summary', type: 'textarea', required: true },
      { id: 'deliverables', label: 'Deliverables Handed Over', type: 'textarea', required: true },
      { id: 'outstanding-items', label: 'Outstanding Items', type: 'textarea' },
      { id: 'warranty-period', label: 'Warranty Period', type: 'text', required: true, placeholder: 'e.g., 12 months' },
      { id: 'maintenance-requirements', label: 'Maintenance Requirements', type: 'textarea' },
      { id: 'operating-instructions', label: 'Operating Instructions Provided', type: 'checkbox' },
      { id: 'training-provided', label: 'Training Provided to Client', type: 'checkbox' },
      { id: 'client-satisfaction', label: 'Client Satisfaction Rating', type: 'select', options: ['Excellent', 'Good', 'Satisfactory', 'Needs Improvement'], required: true },
      { id: 'client-feedback', label: 'Client Feedback', type: 'textarea' },
      { id: 'client-signature', label: 'Client Signature', type: 'text', required: true },
      { id: 'contractor-signature', label: 'Contractor Signature', type: 'text', required: true }
    ],
    sections: [
      { title: 'Project Information', fields: ['project-name', 'client-name', 'handover-date', 'completion-date'] },
      { title: 'Responsible Parties', fields: ['project-manager', 'client-representative'] },
      { title: 'Work Summary', fields: ['work-completed', 'deliverables', 'outstanding-items'] },
      { title: 'Warranty & Maintenance', fields: ['warranty-period', 'maintenance-requirements', 'operating-instructions', 'training-provided'] },
      { title: 'Client Satisfaction', fields: ['client-satisfaction', 'client-feedback'] },
      { title: 'Authorization', fields: ['client-signature', 'contractor-signature'] }
    ]
  },

  // HANDOVER & COMPLETION TEMPLATES - Additional
  {
    id: 'operation-maintenance-manual-template',
    name: 'Operation & Maintenance Manual',
    templateType: 'OPERATION_MAINTENANCE_MANUAL',
    category: 'HANDOVER_COMPLETION',
    description: 'Comprehensive O&M manual for handover',
    fields: [
      { id: 'manual-version', label: 'Manual Version', type: 'text', required: true },
      { id: 'system-description', label: 'System Description', type: 'textarea', required: true },
      { id: 'operating-procedures', label: 'Operating Procedures', type: 'textarea', required: true },
      { id: 'maintenance-schedule', label: 'Maintenance Schedule', type: 'textarea', required: true },
      { id: 'troubleshooting-guide', label: 'Troubleshooting Guide', type: 'textarea', required: true },
      { id: 'spare-parts-list', label: 'Spare Parts List', type: 'textarea', required: true },
      { id: 'safety-precautions', label: 'Safety Precautions', type: 'textarea', required: true },
      { id: 'warranty-information', label: 'Warranty Information', type: 'textarea', required: true }
    ]
  },
  {
    id: 'testing-commissioning-report-template',
    name: 'Testing & Commissioning Report',
    templateType: 'TESTING_COMMISSIONING_REPORT',
    category: 'HANDOVER_COMPLETION',
    description: 'System testing and commissioning results',
    fields: [
      { id: 'test-date', label: 'Test Date', type: 'date', required: true },
      { id: 'systems-tested', label: 'Systems Tested', type: 'textarea', required: true },
      { id: 'test-procedures', label: 'Test Procedures', type: 'textarea', required: true },
      { id: 'test-results', label: 'Test Results', type: 'textarea', required: true },
      { id: 'performance-criteria', label: 'Performance Criteria Met', type: 'checkbox', required: true },
      { id: 'defects-identified', label: 'Defects Identified', type: 'textarea' },
      { id: 'rectification-actions', label: 'Rectification Actions', type: 'textarea' },
      { id: 'commissioning-status', label: 'Commissioning Status', type: 'select', options: ['Passed', 'Failed', 'Conditional'], required: true }
    ]
  },
  {
    id: 'as-built-drawings-template',
    name: 'As-Built Drawings',
    templateType: 'AS_BUILT_DRAWINGS',
    category: 'HANDOVER_COMPLETION',
    description: 'As-built drawings documentation',
    fields: [
      { id: 'drawing-package', label: 'Drawing Package Title', type: 'text', required: true },
      { id: 'revision-number', label: 'Revision Number', type: 'text', required: true },
      { id: 'drawing-list', label: 'List of Drawings', type: 'textarea', required: true },
      { id: 'changes-from-design', label: 'Changes from Design Drawings', type: 'textarea', required: true },
      { id: 'surveyor-verification', label: 'Surveyor Verification', type: 'text', required: true },
      { id: 'accuracy-statement', label: 'Accuracy Statement', type: 'textarea', required: true },
      { id: 'digital-format', label: 'Digital Format Provided', type: 'checkbox' },
      { id: 'hard-copy-provided', label: 'Hard Copy Provided', type: 'checkbox' }
    ]
  },
  {
    id: 'defect-liability-report-template',
    name: 'Defect Liability Report',
    templateType: 'DEFECT_LIABILITY_REPORT',
    category: 'HANDOVER_COMPLETION',
    description: 'Defect liability period report',
    fields: [
      { id: 'inspection-date', label: 'Inspection Date', type: 'date', required: true },
      { id: 'defects-identified', label: 'Defects Identified', type: 'textarea', required: true },
      { id: 'defect-categories', label: 'Defect Categories', type: 'textarea', required: true },
      { id: 'rectification-plan', label: 'Rectification Plan', type: 'textarea', required: true },
      { id: 'completion-timeline', label: 'Completion Timeline', type: 'text', required: true },
      { id: 'cost-implications', label: 'Cost Implications', type: 'textarea' },
      { id: 'warranty-impact', label: 'Warranty Impact', type: 'textarea' }
    ]
  },
  {
    id: 'non-conformance-report-template',
    name: 'Non-Conformance Report',
    templateType: 'NON_CONFORMANCE_REPORT',
    category: 'HANDOVER_COMPLETION',
    description: 'Non-conformance identification and resolution',
    fields: [
      { id: 'ncr-number', label: 'NCR Number', type: 'text', required: true },
      { id: 'identification-date', label: 'Identification Date', type: 'date', required: true },
      { id: 'non-conformance-description', label: 'Non-Conformance Description', type: 'textarea', required: true },
      { id: 'root-cause-analysis', label: 'Root Cause Analysis', type: 'textarea', required: true },
      { id: 'corrective-action', label: 'Corrective Action', type: 'textarea', required: true },
      { id: 'preventive-action', label: 'Preventive Action', type: 'textarea' },
      { id: 'responsible-party', label: 'Responsible Party', type: 'text', required: true },
      { id: 'target-completion', label: 'Target Completion Date', type: 'date', required: true },
      { id: 'verification-method', label: 'Verification Method', type: 'textarea', required: true }
    ]
  },

  // POST-COMPLETION TEMPLATES
  {
    id: 'warranty-certificate-template',
    name: 'Warranty Certificate',
    templateType: 'WARRANTY_CERTIFICATE',
    category: 'POST_COMPLETION',
    description: 'Warranty certificate for completed work',
    fields: [
      { id: 'warranty-number', label: 'Warranty Certificate Number', type: 'text', required: true },
      { id: 'project-name', label: 'Project Name', type: 'text', required: true },
      { id: 'client-name', label: 'Client Name', type: 'text', required: true },
      { id: 'work-description', label: 'Work Description', type: 'textarea', required: true },
      { id: 'warranty-period', label: 'Warranty Period', type: 'text', required: true },
      { id: 'warranty-start-date', label: 'Warranty Start Date', type: 'date', required: true },
      { id: 'warranty-end-date', label: 'Warranty End Date', type: 'date', required: true },
      { id: 'warranty-scope', label: 'Warranty Scope', type: 'textarea', required: true },
      { id: 'exclusions', label: 'Warranty Exclusions', type: 'textarea' },
      { id: 'maintenance-requirements', label: 'Maintenance Requirements', type: 'textarea' },
      { id: 'contact-information', label: 'Contact Information', type: 'textarea', required: true }
    ]
  },
  {
    id: 'service-agreement-template',
    name: 'Service Agreement',
    templateType: 'SERVICE_AGREEMENT',
    category: 'POST_COMPLETION',
    description: 'Post-completion service agreement',
    fields: [
      { id: 'agreement-number', label: 'Agreement Number', type: 'text', required: true },
      { id: 'service-type', label: 'Type of Service', type: 'text', required: true },
      { id: 'service-scope', label: 'Service Scope', type: 'textarea', required: true },
      { id: 'service-frequency', label: 'Service Frequency', type: 'text', required: true },
      { id: 'agreement-duration', label: 'Agreement Duration', type: 'text', required: true },
      { id: 'service-rates', label: 'Service Rates', type: 'textarea', required: true },
      { id: 'response-times', label: 'Response Times', type: 'textarea', required: true },
      { id: 'performance-standards', label: 'Performance Standards', type: 'textarea', required: true },
      { id: 'termination-clause', label: 'Termination Clause', type: 'textarea' },
      { id: 'renewal-options', label: 'Renewal Options', type: 'textarea' }
    ]
  },
  {
    id: 'final-completion-certificate-template',
    name: 'Final Completion Certificate',
    templateType: 'FINAL_COMPLETION_CERTIFICATE',
    category: 'POST_COMPLETION',
    description: 'Official project completion certification',
    fields: [
      { id: 'certificate-number', label: 'Certificate Number', type: 'text', required: true },
      { id: 'project-name', label: 'Project Name', type: 'text', required: true },
      { id: 'client-name', label: 'Client Name', type: 'text', required: true },
      { id: 'project-address', label: 'Project Address', type: 'textarea', required: true },
      { id: 'contract-number', label: 'Contract Number', type: 'text', required: true },
      { id: 'original-completion-date', label: 'Original Completion Date', type: 'date', required: true },
      { id: 'actual-completion-date', label: 'Actual Completion Date', type: 'date', required: true },
      { id: 'certificate-date', label: 'Certificate Issue Date', type: 'date', required: true },
      { id: 'work-description', label: 'Work Description', type: 'textarea', required: true },
      { id: 'contract-value', label: 'Final Contract Value', type: 'number', required: true },
      { id: 'variations-value', label: 'Total Variations Value', type: 'number' },
      { id: 'defects-completed', label: 'All Defects Rectified', type: 'checkbox', required: true },
      { id: 'testing-completed', label: 'All Testing Completed', type: 'checkbox', required: true },
      { id: 'handover-completed', label: 'Handover Completed', type: 'checkbox', required: true },
      { id: 'maintenance-period-start', label: 'Maintenance Period Start', type: 'date', required: true },
      { id: 'maintenance-period-end', label: 'Maintenance Period End', type: 'date', required: true },
      { id: 'certified-by', label: 'Certified By (Professional Engineer)', type: 'text', required: true },
      { id: 'pe-registration', label: 'PE Registration Number', type: 'text', required: true }
    ],
    sections: [
      { title: 'Certificate Details', fields: ['certificate-number', 'certificate-date', 'certified-by', 'pe-registration'] },
      { title: 'Project Information', fields: ['project-name', 'client-name', 'project-address', 'contract-number'] },
      { title: 'Completion Details', fields: ['original-completion-date', 'actual-completion-date', 'work-description'] },
      { title: 'Financial Summary', fields: ['contract-value', 'variations-value'] },
      { title: 'Completion Verification', fields: ['defects-completed', 'testing-completed', 'handover-completed'] },
      { title: 'Maintenance Period', fields: ['maintenance-period-start', 'maintenance-period-end'] }
    ]
  },

  // GENERAL TEMPLATE
  {
    id: 'general-template',
    name: 'General Document',
    templateType: 'GENERAL',
    category: 'CONSTRUCTION',
    description: 'General purpose document template',
    fields: [
      { id: 'document-title', label: 'Document Title', type: 'text', required: true },
      { id: 'document-purpose', label: 'Document Purpose', type: 'textarea', required: true },
      { id: 'prepared-by', label: 'Prepared By', type: 'text', required: true },
      { id: 'preparation-date', label: 'Preparation Date', type: 'date', required: true },
      { id: 'document-content', label: 'Document Content', type: 'textarea', required: true },
      { id: 'references', label: 'References', type: 'textarea' },
      { id: 'attachments', label: 'Attachments', type: 'textarea' },
      { id: 'distribution-list', label: 'Distribution List', type: 'textarea' }
    ],
    sections: [
      { title: 'Document Information', fields: ['document-title', 'document-purpose', 'prepared-by', 'preparation-date'] },
      { title: 'Content', fields: ['document-content', 'references', 'attachments'] },
      { title: 'Distribution', fields: ['distribution-list'] }
    ]
  }
]

export function getTemplateByType(templateType: ProjectDocumentType): DocumentTemplate | undefined {
  return DEFAULT_TEMPLATES.find(template => template.templateType === templateType)
}

export function getTemplateByDocumentType(documentType: string): DocumentTemplate | undefined {
  return DEFAULT_TEMPLATES.find(template => template.templateType === documentType)
}

export function getTemplatesByCategory(category: ProjectDocumentCategory): DocumentTemplate[] {
  return DEFAULT_TEMPLATES.filter(template => template.category === category)
}

export function getAllTemplates(): DocumentTemplate[] {
  return DEFAULT_TEMPLATES
}

export function generateQuotationHTML(data: any): string {
  // Basic HTML template for quotation export
  return `
    <html>
      <head>
        <title>Quotation ${data.quotationNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .section { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Quotation</h1>
          <p>Quotation Number: ${data.quotationNumber}</p>
          <p>Date: ${new Date().toLocaleDateString()}</p>
        </div>
        <div class="section">
          <h2>Client Information</h2>
          <p>Client: ${data.clientName}</p>
          <p>Project: ${data.title}</p>
        </div>
        <div class="section">
          <h2>Items</h2>
          <table>
            <thead>
              <tr><th>Description</th><th>Quantity</th><th>Unit Price</th><th>Total</th></tr>
            </thead>
            <tbody>
              ${(data.items || []).map((item: any) => `
                <tr>
                  <td>${item.description}</td>
                  <td>${item.quantity}</td>
                  <td>$${item.unitPrice}</td>
                  <td>$${item.totalPrice}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div class="section">
          <p><strong>Total Amount: $${data.totalAmount}</strong></p>
        </div>
      </body>
    </html>
  `
}

export function generatePurchaseOrderHTML(data: any): string {
  // Basic HTML template for purchase order export
  return `
    <html>
      <head>
        <title>Purchase Order ${data.poNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .section { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Purchase Order</h1>
          <p>PO Number: ${data.poNumber}</p>
          <p>Date: ${new Date().toLocaleDateString()}</p>
        </div>
        <div class="section">
          <h2>Vendor Information</h2>
          <p>Vendor: ${data.vendorName}</p>
          <p>Project: ${data.projectName || 'N/A'}</p>
        </div>
        <div class="section">
          <h2>Items</h2>
          <table>
            <thead>
              <tr><th>Description</th><th>Quantity</th><th>Unit Price</th><th>Total</th></tr>
            </thead>
            <tbody>
              ${(data.items || []).map((item: any) => `
                <tr>
                  <td>${item.description}</td>
                  <td>${item.quantity}</td>
                  <td>$${item.unitPrice}</td>
                  <td>$${item.totalPrice}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div class="section">
          <p><strong>Total Amount: $${data.totalAmount}</strong></p>
        </div>
      </body>
    </html>
  `
}

export function generateJobCompletionHTML(data: any): string {
  // Basic HTML template for job completion certificate
  return `
    <html>
      <head>
        <title>Job Completion Certificate</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .section { margin-bottom: 20px; }
          .signature { margin-top: 40px; }
          .signature-line { border-bottom: 1px solid #000; width: 200px; margin-top: 40px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Job Completion Certificate</h1>
          <p>Date: ${new Date().toLocaleDateString()}</p>
        </div>
        <div class="section">
          <h2>Job Details</h2>
          <p><strong>Client:</strong> ${data.clientName}</p>
          <p><strong>Project:</strong> ${data.projectName}</p>
          <p><strong>Service Type:</strong> ${data.serviceType}</p>
          <p><strong>Scheduled Date:</strong> ${data.scheduledDate}</p>
          <p><strong>Completion Date:</strong> ${data.completionDate}</p>
        </div>
        <div class="section">
          <h2>Work Completed</h2>
          <p>${data.completionNotes || 'Job completed as per requirements.'}</p>
        </div>
        <div class="signature">
          <p>Completed by: ${data.assignedUserName}</p>
          <div class="signature-line"></div>
          <p>Signature</p>
        </div>
        <div class="signature">
          <p>Client Acceptance:</p>
          <div class="signature-line"></div>
          <p>Client Signature</p>
        </div>
      </body>
    </html>
  `
}
