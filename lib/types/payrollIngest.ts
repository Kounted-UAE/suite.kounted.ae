export type IngestRow = {
  // primary identifiers
  id: string
  employee_id: string
  employer_id: string

  // employer / reviewer
  employer_name: string
  reviewer_email: string

  // employee
  employee_name: string
  email_id: string | null
  employee_mol: string | null

  // bank
  bank_name: string | null
  iban: string | null

  // period
  pay_period_from: string
  pay_period_to: string
  leave_without_pay_days: number | null

  // currency
  currency: string | null

  // salary components
  basic_salary: number | null
  housing_allowance: number | null
  education_allowance: number | null
  flight_allowance: number | null
  general_allowance: number | null
  gratuity_eosb: number | null
  other_allowance: number | null
  transport_allowance: number | null
  total_gross_salary: number | null

  // adjustments
  bonus: number | null
  overtime: number | null
  salary_in_arrears: number | null
  expenses_deductions: number | null
  other_reimbursements: number | null
  expense_reimbursements: number | null
  total_adjustments: number | null

  // totals
  net_salary: number | null
  
  // payment adjustments
  esop_deductions: number | null
  total_payment_adjustments: number | null
  net_payment: number | null
  
  wps_fees: number | null
  total_to_transfer: number | null

  // meta
  created_at: string
  payslip_url: string | null
  payslip_token: string | null
}

export type IngestSortableField =
  | 'created_at'
  | 'pay_period_to'
  | 'employer_name'
  | 'employee_name'
  | 'currency'
  | 'net_salary'
  | 'esop_deductions'
  | 'total_payment_adjustments'
  | 'net_payment'
  | 'total_to_transfer'

export const numericFields: readonly (keyof IngestRow)[] = [
  'leave_without_pay_days',
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
] as const

export const dateFields: readonly (keyof IngestRow)[] = [
  'pay_period_from',
  'pay_period_to',
] as const

export const editableTextFields: readonly (keyof IngestRow)[] = [
  'employer_name',
  'reviewer_email',
  'employee_name',
  'email_id',
  'employee_mol',
  'bank_name',
  'iban',
  'currency',
  'payslip_url',
] as const

export const nonEditableFields: readonly (keyof IngestRow)[] = [
  'id',
  'employee_id',
  'employer_id',
  'created_at',
  'payslip_token',
] as const

// Historical payrun types for closed pay periods
export type HistoricalPayrunRow = IngestRow & {
  original_id: string
  closed_at: string
  closed_by_user_id: string | null
  closure_batch_id: string
  closure_notes: string | null
}

// Pay period closure types
export type PayPeriodClosureRequest = {
  period_end_dates: string[] // Array of pay_period_to dates to close
  notes?: string
}

export type PayPeriodClosureSummary = {
  closure_batch_id: string
  period_end_dates: string[]
  total_records_moved: number
  records_by_period: { [period_end_date: string]: number }
  closed_at: string
  notes?: string
}

// Unique pay periods for selection
export type UniquePayPeriod = {
  pay_period_to: string
  record_count: number
  employers: string[]
  total_amount: number
  currency_breakdown: { [currency: string]: number }
}


