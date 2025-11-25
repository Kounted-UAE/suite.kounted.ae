-- RLS Policies for Payroll Tables
-- Run this in Supabase SQL Editor

-- ============================================
-- PAYROLL_EXCEL_IMPORTS TABLE POLICIES
-- ============================================

-- Enable RLS on payroll_excel_imports
ALTER TABLE payroll_excel_imports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin users can manage all payroll" ON payroll_excel_imports;
DROP POLICY IF EXISTS "Staff users can insert and update payroll" ON payroll_excel_imports;
DROP POLICY IF EXISTS "Authenticated users can view payroll" ON payroll_excel_imports;

-- Allow superadmins and admins full access to all payroll records
CREATE POLICY "Admin users can manage all payroll"
ON payroll_excel_imports
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM v_authenticated_profiles
    WHERE auth_user_id = auth.uid()
    AND (
      role_slug = 'kounted-superadmin'
      OR role_slug = 'kounted-admin'
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM v_authenticated_profiles
    WHERE auth_user_id = auth.uid()
    AND (
      role_slug = 'kounted-superadmin'
      OR role_slug = 'kounted-admin'
    )
  )
);

-- Allow Kounted staff to insert and update payroll records
CREATE POLICY "Staff users can insert and update payroll"
ON payroll_excel_imports
FOR INSERT, UPDATE
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM v_authenticated_profiles
    WHERE auth_user_id = auth.uid()
    AND (
      role_slug LIKE 'kounted-superadmin%'
      OR role_slug LIKE 'kounted-admin%'
      OR role_slug LIKE 'kounted-staff%'
    )
  )
);

-- Allow all authenticated Kounted users to view payroll records
CREATE POLICY "Authenticated users can view payroll"
ON payroll_excel_imports
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM v_authenticated_profiles
    WHERE auth_user_id = auth.uid()
    AND role_slug LIKE 'kounted-%'
  )
);

-- ============================================
-- EMPLOYEES TABLE POLICIES
-- ============================================

-- Enable RLS on employees if not already enabled
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin users can manage employees" ON employees;
DROP POLICY IF EXISTS "Staff users can insert and update employees" ON employees;
DROP POLICY IF EXISTS "Kounted users can view employees" ON employees;

-- Allow admins full access
CREATE POLICY "Admin users can manage employees"
ON employees
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM v_authenticated_profiles
    WHERE auth_user_id = auth.uid()
    AND (role_slug = 'kounted-superadmin' OR role_slug = 'kounted-admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM v_authenticated_profiles
    WHERE auth_user_id = auth.uid()
    AND (role_slug = 'kounted-superadmin' OR role_slug = 'kounted-admin')
  )
);

-- Allow staff to insert and update
CREATE POLICY "Staff users can insert and update employees"
ON employees
FOR INSERT, UPDATE
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM v_authenticated_profiles
    WHERE auth_user_id = auth.uid()
    AND role_slug LIKE 'kounted-%'
  )
);

-- Allow all Kounted users to view
CREATE POLICY "Kounted users can view employees"
ON employees
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM v_authenticated_profiles
    WHERE auth_user_id = auth.uid()
    AND role_slug LIKE 'kounted-%'
  )
);

-- ============================================
-- EMPLOYERS TABLE POLICIES
-- ============================================

-- Enable RLS on employers if not already enabled
ALTER TABLE employers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin users can manage employers" ON employers;
DROP POLICY IF EXISTS "Staff users can insert and update employers" ON employers;
DROP POLICY IF EXISTS "Kounted users can view employers" ON employers;

-- Allow admins full access
CREATE POLICY "Admin users can manage employers"
ON employers
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM v_authenticated_profiles
    WHERE auth_user_id = auth.uid()
    AND (role_slug = 'kounted-superadmin' OR role_slug = 'kounted-admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM v_authenticated_profiles
    WHERE auth_user_id = auth.uid()
    AND (role_slug = 'kounted-superadmin' OR role_slug = 'kounted-admin')
  )
);

-- Allow staff to insert and update
CREATE POLICY "Staff users can insert and update employers"
ON employers
FOR INSERT, UPDATE
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM v_authenticated_profiles
    WHERE auth_user_id = auth.uid()
    AND role_slug LIKE 'kounted-%'
  )
);

-- Allow all Kounted users to view
CREATE POLICY "Kounted users can view employers"
ON employers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM v_authenticated_profiles
    WHERE auth_user_id = auth.uid()
    AND role_slug LIKE 'kounted-%'
  )
);

-- ============================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON POLICY "Admin users can manage all payroll" ON payroll_excel_imports IS 
'Superadmins and admins have full CRUD access to payroll records';

COMMENT ON POLICY "Staff users can insert and update payroll" ON payroll_excel_imports IS 
'Kounted staff can create and update payroll records for processing payslips';

COMMENT ON POLICY "Authenticated users can view payroll" ON payroll_excel_imports IS 
'All Kounted users can view payroll data';

