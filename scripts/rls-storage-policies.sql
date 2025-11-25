-- RLS Policies for Storage Buckets
-- Run this in Supabase SQL Editor

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow re-running this script)
DROP POLICY IF EXISTS "Kounted staff can upload payroll files" ON storage.objects;
DROP POLICY IF EXISTS "Kounted staff can update payroll files" ON storage.objects;
DROP POLICY IF EXISTS "Kounted staff can delete payroll files" ON storage.objects;
DROP POLICY IF EXISTS "Kounted staff can read payroll files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read payroll files" ON storage.objects;

-- Allow Kounted staff (admin and staff) to upload files to Payroll bucket
CREATE POLICY "Kounted staff can upload payroll files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'Payroll'
  AND EXISTS (
    SELECT 1 FROM v_authenticated_profiles
    WHERE auth_user_id = auth.uid()
    AND (
      role_slug LIKE 'kounted-superadmin%'
      OR role_slug LIKE 'kounted-admin%'
      OR role_slug LIKE 'kounted-staff%'
    )
  )
);

-- Allow Kounted staff to update files in Payroll bucket
CREATE POLICY "Kounted staff can update payroll files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'Payroll'
  AND EXISTS (
    SELECT 1 FROM v_authenticated_profiles
    WHERE auth_user_id = auth.uid()
    AND (
      role_slug LIKE 'kounted-superadmin%'
      OR role_slug LIKE 'kounted-admin%'
      OR role_slug LIKE 'kounted-staff%'
    )
  )
);

-- Allow Kounted admins to delete files from Payroll bucket
CREATE POLICY "Kounted staff can delete payroll files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'Payroll'
  AND EXISTS (
    SELECT 1 FROM v_authenticated_profiles
    WHERE auth_user_id = auth.uid()
    AND (
      role_slug LIKE 'kounted-superadmin%'
      OR role_slug LIKE 'kounted-admin%'
    )
  )
);

-- Allow all authenticated users to read files from Payroll bucket
CREATE POLICY "Authenticated users can read payroll files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'Payroll'
);

-- Ensure the Payroll bucket exists and has public access disabled
-- Note: This needs to be run separately in Supabase dashboard or via Storage API
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('Payroll', 'Payroll', false)
-- ON CONFLICT (id) DO UPDATE SET public = false;

COMMENT ON POLICY "Kounted staff can upload payroll files" ON storage.objects IS 
'Allows Kounted staff to upload payslip PDFs and related documents';

COMMENT ON POLICY "Authenticated users can read payroll files" ON storage.objects IS 
'All authenticated users can read payroll files (consider restricting further based on client access)';

