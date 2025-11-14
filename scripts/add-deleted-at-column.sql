-- SQL Script to add deleted_at column for soft delete functionality
-- This allows records to be marked as deleted instead of being permanently removed
-- Records with deleted_at IS NOT NULL are considered deleted and should be excluded from queries

-- Add deleted_at column to payroll_excel_imports table
ALTER TABLE IF EXISTS public.payroll_excel_imports
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN public.payroll_excel_imports.deleted_at IS 'Timestamp when the record was soft deleted. NULL indicates the record is active.';

-- Create index on deleted_at for better query performance when filtering out deleted records
CREATE INDEX IF NOT EXISTS idx_payroll_excel_imports_deleted_at ON public.payroll_excel_imports(deleted_at)
WHERE deleted_at IS NOT NULL;

-- Note: The partial index only includes rows where deleted_at IS NOT NULL,
-- which makes it smaller and more efficient for queries that exclude deleted records.


