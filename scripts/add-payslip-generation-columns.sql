-- SQL Script to add missing payslip generation columns to production database
-- This adds columns that exist in local development but are missing in production

-- Add payslip_filename column
ALTER TABLE public.payroll_excel_imports 
ADD COLUMN IF NOT EXISTS payslip_filename TEXT;

-- Add payslip_generated_at column  
ALTER TABLE public.payroll_excel_imports 
ADD COLUMN IF NOT EXISTS payslip_generated_at TIMESTAMPTZ;

-- Add payslip_generation_method column
ALTER TABLE public.payroll_excel_imports 
ADD COLUMN IF NOT EXISTS payslip_generation_method TEXT;

-- Add indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_payroll_excel_imports_payslip_filename 
ON public.payroll_excel_imports(payslip_filename);

CREATE INDEX IF NOT EXISTS idx_payroll_excel_imports_payslip_generated_at 
ON public.payroll_excel_imports(payslip_generated_at);

CREATE INDEX IF NOT EXISTS idx_payroll_excel_imports_payslip_generation_method 
ON public.payroll_excel_imports(payslip_generation_method);

-- Also add the same columns to historical payruns table for consistency
ALTER TABLE public.payroll_historical_payruns 
ADD COLUMN IF NOT EXISTS payslip_filename TEXT;

ALTER TABLE public.payroll_historical_payruns 
ADD COLUMN IF NOT EXISTS payslip_generated_at TIMESTAMPTZ;

ALTER TABLE public.payroll_historical_payruns 
ADD COLUMN IF NOT EXISTS payslip_generation_method TEXT;

-- Add indexes for historical table
CREATE INDEX IF NOT EXISTS idx_historical_payruns_payslip_filename 
ON public.payroll_historical_payruns(payslip_filename);

CREATE INDEX IF NOT EXISTS idx_historical_payruns_payslip_generated_at 
ON public.payroll_historical_payruns(payslip_generated_at);

CREATE INDEX IF NOT EXISTS idx_historical_payruns_payslip_generation_method 
ON public.payroll_historical_payruns(payslip_generation_method);
