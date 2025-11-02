-- SQL Script to add ESOP deductions and payment adjustments fields
-- to the payroll_excel_imports table

-- Add the new fields after net_salary
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

-- Add the same fields to the historical payrun table if it exists
ALTER TABLE public.payroll_historical_payruns 
ADD COLUMN IF NOT EXISTS esop_deductions NUMERIC(10, 2) DEFAULT 0;

ALTER TABLE public.payroll_historical_payruns 
ADD COLUMN IF NOT EXISTS total_payment_adjustments NUMERIC(10, 2) DEFAULT 0;

ALTER TABLE public.payroll_historical_payruns 
ADD COLUMN IF NOT EXISTS net_payment NUMERIC(10, 2);

-- Add indexes for the historical table as well
CREATE INDEX IF NOT EXISTS idx_historical_payruns_esop_deductions 
ON public.payroll_historical_payruns(esop_deductions);

CREATE INDEX IF NOT EXISTS idx_historical_payruns_total_payment_adjustments 
ON public.payroll_historical_payruns(total_payment_adjustments);

CREATE INDEX IF NOT EXISTS idx_historical_payruns_net_payment 
ON public.payroll_historical_payruns(net_payment);

-- Add comments for documentation
COMMENT ON COLUMN public.payroll_excel_imports.esop_deductions IS 'Employee Stock Ownership Plan deductions applied after net salary calculation';
COMMENT ON COLUMN public.payroll_excel_imports.total_payment_adjustments IS 'Sum of all post-net-salary deductions (esop_deductions + other future deductions)';
COMMENT ON COLUMN public.payroll_excel_imports.net_payment IS 'Final payment amount after all deductions (net_salary - total_payment_adjustments)';

COMMENT ON COLUMN public.payroll_historical_payruns.esop_deductions IS 'Employee Stock Ownership Plan deductions applied after net salary calculation';
COMMENT ON COLUMN public.payroll_historical_payruns.total_payment_adjustments IS 'Sum of all post-net-salary deductions (esop_deductions + other future deductions)';
COMMENT ON COLUMN public.payroll_historical_payruns.net_payment IS 'Final payment amount after all deductions (net_salary - total_payment_adjustments)';
