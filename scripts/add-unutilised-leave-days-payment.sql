-- SQL Script to add unutilised leave days payment field
-- to the payroll_excel_imports table
-- This field is part of the variable/adjustments section of the payslip

-- Add the new field after total_adjustments (in the variable/adjustments section)
ALTER TABLE public.payroll_excel_imports 
ADD COLUMN IF NOT EXISTS unutilised_leave_days_payment NUMERIC(10, 2);

-- Add index for the new field to improve query performance
CREATE INDEX IF NOT EXISTS idx_payroll_excel_imports_unutilised_leave_days_payment 
ON public.payroll_excel_imports(unutilised_leave_days_payment);

-- Add the same field to the historical payrun table if it exists
ALTER TABLE public.payroll_historical_payruns 
ADD COLUMN IF NOT EXISTS unutilised_leave_days_payment NUMERIC(10, 2);

-- Add index for the historical table as well
CREATE INDEX IF NOT EXISTS idx_historical_payruns_unutilised_leave_days_payment 
ON public.payroll_historical_payruns(unutilised_leave_days_payment);

-- Add comments for documentation
COMMENT ON COLUMN public.payroll_excel_imports.unutilised_leave_days_payment IS 'Payment for unutilised leave days - part of variable/adjustments section';

COMMENT ON COLUMN public.payroll_historical_payruns.unutilised_leave_days_payment IS 'Payment for unutilised leave days - part of variable/adjustments section';

