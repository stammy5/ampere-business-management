
-- AddDocumentNumbering
-- Add documentNumber column to ProjectDocument table

-- First add the column as nullable
ALTER TABLE "ProjectDocument" ADD COLUMN "documentNumber" TEXT;

-- Create a temporary function to generate document numbers for existing documents
DO $$
DECLARE
    doc_record RECORD;
    project_num TEXT;
    type_code TEXT;
    seq_num INTEGER;
    doc_number TEXT;
BEGIN
    -- Loop through all existing documents
    FOR doc_record IN 
        SELECT pd.*, p."projectNumber" 
        FROM "ProjectDocument" pd
        JOIN "Project" p ON pd."projectId" = p.id
        WHERE pd."documentNumber" IS NULL
        ORDER BY pd."createdAt"
    LOOP
        -- Get type code mapping
        type_code := CASE doc_record."documentType"
            WHEN 'PRE_CONSTRUCTION_SURVEY' THEN 'PCS'
            WHEN 'SITE_SAFETY_PLAN' THEN 'SSP'
            WHEN 'RISK_ASSESSMENT' THEN 'RA'
            WHEN 'WORK_METHOD_STATEMENT' THEN 'WMS'
            WHEN 'PERMIT_TO_WORK' THEN 'PTW'
            WHEN 'HOT_WORK_PERMIT' THEN 'HWP'
            WHEN 'LIFTING_PERMIT' THEN 'LP'
            WHEN 'CONFINED_SPACE_PERMIT' THEN 'CSP'
            WHEN 'WORKER_LIST' THEN 'WL'
            WHEN 'DAILY_SITE_REPORT' THEN 'DSR'
            WHEN 'INSPECTION_TEST_PLAN' THEN 'ITP'
            WHEN 'QUALITY_CHECKLIST' THEN 'QC'
            WHEN 'MATERIAL_DELIVERY_NOTE' THEN 'MDN'
            WHEN 'PROGRESS_PHOTOS' THEN 'PP'
            WHEN 'VARIATION_ORDER' THEN 'VO'
            WHEN 'INCIDENT_REPORT' THEN 'IR'
            WHEN 'ACCIDENT_REPORT' THEN 'AR'
            WHEN 'TOOLBOX_MEETING' THEN 'TBM'
            WHEN 'OPERATION_MAINTENANCE_MANUAL' THEN 'OMM'
            WHEN 'TESTING_COMMISSIONING_REPORT' THEN 'TCR'
            WHEN 'AS_BUILT_DRAWINGS' THEN 'ABD'
            WHEN 'HANDOVER_FORM' THEN 'HF'
            WHEN 'DEFECT_LIABILITY_REPORT' THEN 'DLR'
            WHEN 'NON_CONFORMANCE_REPORT' THEN 'NCR'
            WHEN 'FINAL_COMPLETION_CERTIFICATE' THEN 'FCC'
            WHEN 'WARRANTY_CERTIFICATE' THEN 'WC'
            WHEN 'SERVICE_AGREEMENT' THEN 'SA'
            ELSE 'GD'
        END;
        
        -- Get next sequence number for this project and document type
        SELECT COALESCE(MAX(
            CASE 
                WHEN "documentNumber" ~ ('^' || doc_record."projectNumber" || '/' || type_code || '/[0-9]+$') 
                THEN CAST(split_part("documentNumber", '/', 3) AS INTEGER)
                ELSE 0 
            END), 0) + 1
        INTO seq_num
        FROM "ProjectDocument" 
        WHERE "projectId" = doc_record."projectId" 
        AND "documentNumber" IS NOT NULL;
        
        -- Generate document number
        doc_number := doc_record."projectNumber" || '/' || type_code || '/' || LPAD(seq_num::TEXT, 3, '0');
        
        -- Update the document with the generated number
        UPDATE "ProjectDocument" 
        SET "documentNumber" = doc_number 
        WHERE id = doc_record.id;
    END LOOP;
END $$;

-- Now make the column required and unique
ALTER TABLE "ProjectDocument" ALTER COLUMN "documentNumber" SET NOT NULL;
CREATE UNIQUE INDEX "ProjectDocument_documentNumber_key" ON "ProjectDocument"("documentNumber");
