-- Complete Payroll Setup SQL Script
-- This script creates all tables needed for the payroll system including:
-- 1. Historical pay runs table for pay period management
-- 2. ESOP deductions fields for both main and historical tables
-- 3. All required indexes and constraints

-- ====================================
-- PART 1: ADD ESOP DEDUCTIONS FIELDS TO MAIN TABLE
-- ====================================

-- Add the new ESOP and payment adjustment fields to payroll_excel_imports
ALTER TABLE public.payroll_excel_imports 
ADD COLUMN IF NOT EXISTS esop_deductions NUMERIC(10, 2) DEFAULT 0;

ALTER TABLE public.payroll_excel_imports 
ADD COLUMN IF NOT EXISTS total_payment_adjustments NUMERIC(10, 2) DEFAULT 0;

ALTER TABLE public.payroll_excel_imports 
ADD COLUMN IF NOT EXISTS net_payment NUMERIC(10, 2);

-- Add indexes for the new fields to improve query performance
CREATE INDEX IF NOT EXISTS idx_payroll_excel_imports_esop_deductions 
ON public.payroll_excel_imports(esop_deductions);

CREATE INDEX IF NOT EXISTS idx_payroll_excel_imports_total_payment_adjustments 
ON public.payroll_excel_imports(total_payment_adjustments);

CREATE INDEX IF NOT EXISTS idx_payroll_excel_imports_net_payment 
ON public.payroll_excel_imports(net_payment);

-- ====================================
-- PART 2: CREATE HISTORICAL PAY RUNS TABLE
-- ====================================

-- Create the historical pay runs table for closed pay periods
CREATE TABLE IF NOT EXISTS public.payroll_historical_payruns (
  -- Primary key - unique identifier for each historical payslip
  id uuid not null default gen_random_uuid(),
  
  -- Original data from payroll_excel_imports (with ESOP fields)
  employee_id uuid not null,
  employer_id uuid not null,
  employer_name text not null,
  reviewer_email text not null,
  employee_name text not null,
  email_id text null,
  employee_mol text null,
  bank_name text null,
  iban text null,
  pay_period_from date not null,
  pay_period_to date not null,
  leave_without_pay_days numeric null default 0,
  currency text null default 'AED'::text,
  basic_salary numeric(10, 2) null,
  housing_allowance numeric(10, 2) null,
  education_allowance numeric(10, 2) null,
  flight_allowance numeric(10, 2) null,
  general_allowance numeric(10, 2) null,
  gratuity_eosb numeric(10, 2) null,
  other_allowance numeric(10, 2) null,
  transport_allowance numeric(10, 2) null,
  total_gross_salary numeric(10, 2) null,
  bonus numeric(10, 2) null,
  overtime numeric(10, 2) null,
  salary_in_arrears numeric(10, 2) null,
  expenses_deductions numeric(10, 2) null,
  other_reimbursements numeric(10, 2) null,
  expense_reimbursements numeric(10, 2) null,
  total_adjustments numeric(10, 2) null,
  net_salary numeric(10, 2) null,
  
  -- NEW: ESOP and payment adjustment fields
  esop_deductions numeric(10, 2) null default 0,
  total_payment_adjustments numeric(10, 2) null default 0,
  net_payment numeric(10, 2) null,
  
  wps_fees numeric(10, 2) null,
  total_to_transfer numeric(10, 2) null,
  created_at timestamp with time zone null default now(),
  payslip_url text null,
  payslip_token uuid null,
  
  -- Additional closure metadata
  original_id uuid not null, -- Reference to original record ID from payroll_excel_imports
  closed_at timestamp with time zone not null default now(),
  closed_by_user_id uuid null, -- Who closed this pay period
  closure_batch_id uuid not null, -- Groups records closed together
  closure_notes text null,
  
  constraint payroll_historical_payruns_pkey primary key (id)
) TABLESPACE pg_default;

-- ====================================
-- PART 3: CREATE INDEXES FOR HISTORICAL TABLE
-- ====================================

-- Create indexes for better query performance on historical table
CREATE INDEX IF NOT EXISTS idx_historical_payruns_employer_id ON public.payroll_historical_payruns USING btree (employer_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_historical_payruns_employee_id ON public.payroll_historical_payruns USING btree (employee_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_historical_payruns_pay_period ON public.payroll_historical_payruns USING btree (pay_period_from, pay_period_to) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_historical_payruns_closed_at ON public.payroll_historical_payruns USING btree (closed_at) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_historical_payruns_closure_batch ON public.payroll_historical_payruns USING btree (closure_batch_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_historical_payruns_original_id ON public.payroll_historical_payruns USING btree (original_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_historical_payruns_payslip_token ON public.payroll_historical_payruns USING btree (payslip_token) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_historical_payruns_email ON public.payroll_historical_payruns USING btree (email_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_historical_payruns_reviewer_email ON public.payroll_historical_payruns USING btree (reviewer_email) TABLESPACE pg_default;

-- NEW: Indexes for ESOP fields in historical table
CREATE INDEX IF NOT EXISTS idx_historical_payruns_esop_deductions 
ON public.payroll_historical_payruns(esop_deductions);

CREATE INDEX IF NOT EXISTS idx_historical_payruns_total_payment_adjustments 
ON public.payroll_historical_payruns(total_payment_adjustments);

CREATE INDEX IF NOT EXISTS idx_historical_payruns_net_payment 
ON public.payroll_historical_payruns(net_payment);

-- ====================================
-- PART 4: ADD TABLE COMMENTS AND DOCUMENTATION
-- ====================================

-- Add comments for documentation
COMMENT ON TABLE public.payroll_historical_payruns IS 'Historical pay runs table storing closed pay periods moved from payroll_excel_imports';
COMMENT ON COLUMN public.payroll_historical_payruns.original_id IS 'Reference to the original record ID from payroll_excel_imports table';
COMMENT ON COLUMN public.payroll_historical_payruns.closed_at IS 'Timestamp when this pay period was closed';
COMMENT ON COLUMN public.payroll_historical_payruns.closed_by_user_id IS 'ID of the user who closed this pay period';
COMMENT ON COLUMN public.payroll_historical_payruns.closure_batch_id IS 'UUID that groups all records closed in the same operation';
COMMENT ON COLUMN public.payroll_historical_payruns.closure_notes IS 'Optional notes about the closure process';

-- NEW: Comments for ESOP fields
COMMENT ON COLUMN public.payroll_excel_imports.esop_deductions IS 'Employee Stock Ownership Plan deductions applied after net salary calculation';
COMMENT ON COLUMN public.payroll_excel_imports.total_payment_adjustments IS 'Sum of all post-net-salary deductions (esop_deductions + other future deductions)';
COMMENT ON COLUMN public.payroll_excel_imports.net_payment IS 'Final payment amount after all deductions (net_salary - total_payment_adjustments)';

COMMENT ON COLUMN public.payroll_historical_payruns.esop_deductions IS 'Employee Stock Ownership Plan deductions applied after net salary calculation';
COMMENT ON COLUMN public.payroll_historical_payruns.total_payment_adjustments IS 'Sum of all post-net-salary deductions (esop_deductions + other future deductions)';
COMMENT ON COLUMN public.payroll_historical_payruns.net_payment IS 'Final payment amount after all deductions (net_salary - total_payment_adjustments)';

-- ====================================
-- PART 5: VERIFICATION QUERIES
-- ====================================

-- Verify the tables exist and have the correct structure
-- Run these to confirm successful setup:

-- Check main table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'payroll_excel_imports'
  AND column_name IN ('esop_deductions', 'total_payment_adjustments', 'net_payment')
ORDER BY ordinal_position;

-- Check historical table structure  
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'payroll_historical_payruns'
ORDER BY ordinal_position;

-- Check indexes were created
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('payroll_excel_imports', 'payroll_historical_payruns')
  AND indexname LIKE '%esop%' OR indexname LIKE '%payment_adjustments%' OR indexname LIKE '%net_payment%';

-- ====================================
-- EXECUTION NOTES
-- ====================================

-- Run this script in your Supabase SQL editor or via psql
-- The script is safe to run multiple times (uses IF NOT EXISTS)
-- Verify results with the verification queries at the end
