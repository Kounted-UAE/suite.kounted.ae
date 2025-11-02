-- Script to refresh Supabase schema cache
-- This resolves schema cache issues when new columns are added

-- Force schema cache refresh by running these commands:

-- 1. Check if total_to_transfer column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'payroll_excel_imports' 
  AND column_name = 'total_to_transfer';

-- 2. If it doesn't exist, add it
ALTER TABLE public.payroll_excel_imports 
ADD COLUMN IF NOT EXISTS total_to_transfer NUMERIC(10, 2);

-- 3. Refresh the schema cache by analyzing the table
ANALYZE public.payroll_excel_imports;

-- 4. Verify all expected columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'payroll_excel_imports'
  AND column_name IN (
    'total_to_transfer', 'esop_deductions', 'total_payment_adjustments', 'net_payment', 'wps_fees'
  )
ORDER BY column_name;

-- Note: After running this, restart your Next.js development server 
-- to clear any cached schema information in the application.
