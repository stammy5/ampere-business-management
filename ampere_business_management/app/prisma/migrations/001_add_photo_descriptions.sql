
-- Add photo description support to ProjectDocument
ALTER TABLE "ProjectDocument" ADD COLUMN "photoDescriptions" JSONB;
ALTER TABLE "ProjectDocument" ADD COLUMN "photoCount" INTEGER DEFAULT 0;
ALTER TABLE "ProjectDocument" ADD COLUMN "hasPhotos" BOOLEAN DEFAULT FALSE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_project_document_has_photos" ON "ProjectDocument" ("hasPhotos");
CREATE INDEX IF NOT EXISTS "idx_project_document_photo_count" ON "ProjectDocument" ("photoCount");
