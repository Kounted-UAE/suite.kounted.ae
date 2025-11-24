import dotenv from 'dotenv'
import fs from 'fs-extra'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

dotenv.config()

// === CONFIGURATION ===
const SUPABASE_URL = process.env.SUPABASE_URL?.trim()
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
const OUTPUT_DIR = './payslips'
const TEMPLATE_FILE = './payslip-template.html'
const TABLE_NAME = 'payroll_ingest_excelpayrollimport'
const STORAGE_BUCKET = 'generated-pdfs'
const STORAGE_FOLDER = 'payslips'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const sanitize = (str) =>
  str?.toString().replace(/[^a-z0-9]/gi, '_').substring(0, 64) || 'unknown'

const formatMoney = (value) => {
  if (value == null || isNaN(value)) return ''
  return Number(value).toLocaleString('en-AE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const injectTemplate = (template, row) => {
  const inject = (label, value) =>
    value != null && value !== ''
      ? `<div class="box-line"><span>${label}</span><span>${formatMoney(value)} AED</span></div>`
      : '';

  return template
    .replace('{{pay_period_from}}', row.pay_period_from || '')
    .replace('{{pay_period_to}}', row.pay_period_to || '')
    .replaceAll('{{employee_name}}', row.employee_name || '')
    .replaceAll('{{employer_name}}', row.employer_name || '')
    .replace('{{bank_name}}', row.bank_name || '-')
    .replace('{{iban}}', row.iban || '-')

    // Monthly Earnings
    .replace('{{basic_salary}}', inject('Basic Salary & Wage', row.basic_salary))
    .replace('{{housing_allowance}}', inject('Housing Allowance', row.housing_allowance))
    .replace('{{transport_allowance}}', inject('Transport Allowance', row.transport_allowance))
    .replace('{{flight_allowance}}', inject('Flight Allowance', row.flight_allowance))
    .replace('{{education_allowance}}', inject('Education Allowance', row.education_allowance))
    .replace('{{general_allowance}}', inject('General Allowance', row.general_allowance))
    .replace('{{other_allowance}}', inject('Other Allowance', row.other_allowance))
    .replace('{{gratuity_eosb}}', inject('ESOP Adjustment', row.gratuity_eosb))
    .replace('{{total_gross_salary}}', inject('TOTAL EARNINGS', row.total_gross_salary))

    // Adjustments
    .replace('{{bonus}}', inject('Bonuses', row.bonus))
    .replace('{{overtime}}', inject('Overtime', row.overtime))
    .replace('{{salary_in_arrears}}', inject('Arrears/Advances', row.salary_in_arrears))
    .replace('{{expenses_deductions}}', inject('Expense Deductions', row.expenses_deductions))
    .replace('{{expense_reimbursements}}', inject('Expense Reimbursements', row.expense_reimbursements))
    .replace('{{other_reimbursements}}', inject('Other Reimbursements', row.other_reimbursements))
    .replaceAll('{{total_adjustments}}', inject('TOTAL ADJUSTMENTS', row.total_adjustments))

    // Net Total
    .replace('{{net_salary}}', inject('NET', row.net_salary));
}

const main = async () => {
  try {
    // Debug environment variables
    console.log('🔍 Environment check:')
    console.log('SUPABASE_URL:', SUPABASE_URL ? '✅ Set' : '❌ Missing')
    console.log('SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing')
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Missing required environment variables')
      process.exit(1)
    }

    await fs.ensureDir(OUTPUT_DIR)
    const template = await fs.readFile(TEMPLATE_FILE, 'utf8')

    console.log('🔍 Querying Supabase table:', TABLE_NAME)
    console.log('🔍 Using URL:', SUPABASE_URL)
    
    try {
      const { data: rows, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .or('payslip_url.is.null,payslip_url.eq.')

      if (error) {
        console.error('❌ Supabase error details:', error)
        throw new Error(`Supabase query failed: ${error.message}`)
      }
      
      console.log(`✅ Query successful, found ${rows?.length || 0} rows`)
      
      if (!rows?.length) {
        console.warn('⚠️ No rows found without payslip URLs. Exiting.')
        return
      }

      console.warn('⚠️ PDF generation disabled - puppeteer has been removed')
      console.warn('⚠️ This script requires an alternative PDF generation method')
      console.warn(`⚠️ Found ${rows.length} rows that need PDF generation, but puppeteer is not available`)
      
      // TODO: Implement alternative PDF generation method
      // Previously used puppeteer to generate PDFs from HTML template
      // The script would:
      // 1. Launch browser with puppeteer.launch()
      // 2. Create a new page for each row
      // 3. Inject template HTML with row data
      // 4. Generate PDF with page.pdf()
      // 5. Upload to Supabase storage
      // 6. Update database with payslip URL
      
      for (const row of rows) {
        console.warn(`⚠️ Skipping PDF generation for ${row.employee_name} - puppeteer removed`)
      }

      console.log('🎉 All payslips processed.')
    } catch (fetchError) {
      console.error('❌ Network/Connection error:', fetchError.message)
      console.error('❌ Full error:', fetchError)
      throw fetchError
    }
  } catch (err) {
    console.error('❌ Script failed:', err.message)
    process.exit(1)
  }
}

main()
