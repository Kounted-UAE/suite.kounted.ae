-- SQL Script to remove unique email constraint for employees
-- This allows multiple employees with the same email per employer
-- (useful when all payslips go to HR contact)

-- Remove the unique constraint on email_id and employer_id combination
ALTER TABLE public.employees 
DROP CONSTRAINT IF EXISTS employees_email_employer_key;

-- Update any existing indexes that might be related to this constraint
-- (The constraint removal should handle this, but this is for safety)

-- Verify the constraint has been removed
-- You can run this query to check:
-- SELECT conname, contype 
-- FROM pg_constraint 
-- WHERE conrelid = 'public.employees'::regclass 
--   AND conname = 'employees_email_employer_key';
