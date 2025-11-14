// lib/validators/excelPayrollImportSchema.ts

import { z } from 'zod'

export const excelPayrollImportSchema = z.object({
  // Required fields only
  employee_id: z.string().uuid(),
  employer_id: z.string().uuid(),
  
  // All other fields are optional
  employer_name: z.string().optional().nullable(),
  reviewer_email: z.string().optional().nullable(),
  employee_name: z.string().optional().nullable(),
  email_id: z.string().optional().nullable(),
  employee_mol: z.string().optional().nullable(),
  bank_name: z.string().optional().nullable(),
  iban: z.string().optional().nullable(),

  pay_period_from: z.string().optional().nullable(),
  pay_period_to: z.string().optional().nullable(), 
  leave_without_pay_days: z.number().optional().nullable(),
  currency: z.string().optional().nullable(),

  basic_salary: z.number().optional().nullable(),
  housing_allowance: z.number().optional().nullable(),
  education_allowance: z.number().optional().nullable(),
  flight_allowance: z.number().optional().nullable(),
  general_allowance: z.number().optional().nullable(),
  gratuity_eosb: z.number().optional().nullable(),
  other_allowance: z.number().optional().nullable(),
  transport_allowance: z.number().optional().nullable(),
  total_gross_salary: z.number().optional().nullable(),

  bonus: z.number().optional().nullable(),
  overtime: z.number().optional().nullable(),
  salary_in_arrears: z.number().optional().nullable(),
  unutilised_leave_days_payment: z.number().optional().nullable(),
  expenses_deductions: z.number().optional().nullable(),
  other_reimbursements: z.number().optional().nullable(),
  expense_reimbursements: z.number().optional().nullable(),
  total_adjustments: z.number().optional().nullable(),

  net_salary: z.number().optional().nullable(),
  
  // NEW: ESOP fields
  esop_deductions: z.number().optional().nullable(),
  total_payment_adjustments: z.number().optional().nullable(),
  net_payment: z.number().optional().nullable(),
  
  wps_fees: z.number().optional().nullable(),
  total_to_transfer: z.number().optional().nullable(),
  
  // Meta fields
  created_at: z.string().optional().nullable(),
  payslip_url: z.string().optional().nullable(),
  payslip_token: z.string().optional().nullable(),
})

export const EXCEL_PAYROLL_IMPORT_TEMPLATE = [
  'employee_id',
  'employer_id', 
  'employer_name',
  'reviewer_email',
  'employee_name',
  'email_id',
  'employee_mol',
  'bank_name',
  'iban',
  'pay_period_from',
  'pay_period_to',
  'leave_without_pay_days',
  'currency',
  'basic_salary',
  'housing_allowance',
  'education_allowance',
  'flight_allowance',
  'general_allowance',
  'gratuity_eosb',
  'other_allowance',
  'transport_allowance',
  'total_gross_salary',
  'bonus',
  'overtime',
  'salary_in_arrears',
  'unutilised_leave_days_payment',
  'expenses_deductions',
  'other_reimbursements',
  'expense_reimbursements',
  'total_adjustments',
  'net_salary',
  'esop_deductions',
  'total_payment_adjustments', 
  'net_payment',
  'wps_fees',
  'total_to_transfer',
]
