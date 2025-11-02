-- SQL Script to create the historical pay runs table
-- This table stores closed pay periods moved from payroll_excel_imports
-- Schema matches payroll_excel_imports plus closure metadata

CREATE TABLE IF NOT EXISTS public.payroll_historical_payruns (
  -- Primary key - unique identifier for each historical payslip
  id uuid not null default gen_random_uuid(),
  
  -- Original data from payroll_excel_imports
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_historical_payruns_employer_id ON public.payroll_historical_payruns USING btree (employer_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_historical_payruns_employee_id ON public.payroll_historical_payruns USING btree (employee_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_historical_payruns_pay_period ON public.payroll_historical_payruns USING btree (pay_period_from, pay_period_to) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_historical_payruns_closed_at ON public.payroll_historical_payruns USING btree (closed_at) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_historical_payruns_closure_batch ON public.payroll_historical_payruns USING btree (closure_batch_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_historical_payruns_original_id ON public.payroll_historical_payruns USING btree (original_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_historical_payruns_payslip_token ON public.payroll_historical_payruns USING btree (payslip_token) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_historical_payruns_email ON public.payroll_historical_payruns USING btree (email_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_historical_payruns_reviewer_email ON public.payroll_historical_payruns USING btree (reviewer_email) TABLESPACE pg_default;

-- Add comment for documentation
COMMENT ON TABLE public.payroll_historical_payruns IS 'Historical pay runs table storing closed pay periods moved from payroll_excel_imports';
COMMENT ON COLUMN public.payroll_historical_payruns.original_id IS 'Reference to the original record ID from payroll_excel_imports table';
COMMENT ON COLUMN public.payroll_historical_payruns.closed_at IS 'Timestamp when this pay period was closed';
COMMENT ON COLUMN public.payroll_historical_payruns.closed_by_user_id IS 'ID of the user who closed this pay period';
COMMENT ON COLUMN public.payroll_historical_payruns.closure_batch_id IS 'UUID that groups all records closed in the same operation';
COMMENT ON COLUMN public.payroll_historical_payruns.closure_notes IS 'Optional notes about the closure process';

