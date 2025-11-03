-- SQL Script to create separate employers and employees tables
-- This extracts employer and employee data from the existing payroll transaction tables
-- Provides basic entity management for generating UUIDs and maintaining data integrity

-- Employers table
CREATE TABLE IF NOT EXISTS public.employers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  reviewer_email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT employers_name_key UNIQUE(name)
);

-- Employees table
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email_id TEXT,
  employee_mol TEXT, -- Ministry of Labour ID
  bank_name TEXT,
  iban TEXT,
  employer_id UUID NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT employees_mol_key UNIQUE(employee_mol)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_employers_name ON public.employers(name);
CREATE INDEX IF NOT EXISTS idx_employers_reviewer_email ON public.employers(reviewer_email);
CREATE INDEX IF NOT EXISTS idx_employees_name ON public.employees(name);
CREATE INDEX IF NOT EXISTS idx_employees_email ON public.employees(email_id);
CREATE INDEX IF NOT EXISTS idx_employees_mol ON public.employees(employee_mol);
CREATE INDEX IF NOT EXISTS idx_employees_employer_id ON public.employees(employer_id);

-- RLS policies for security
ALTER TABLE public.employers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (you may want to refine this based on your auth requirements)
CREATE POLICY "Allow all for authenticated users" ON public.employers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.employees FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to update updated_at on changes
CREATE TRIGGER update_employers_updated_at BEFORE UPDATE ON public.employers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
