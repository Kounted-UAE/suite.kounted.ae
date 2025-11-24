import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabase/server'
import crypto from 'crypto'
import { generatePayslipPDFStyled } from '@/lib/utils/pdf/generatePayslipPDFStyled'
import { generatePayslipPDFFallback } from '@/lib/utils/pdf/generatePayslipPDFFallback'
import { generatePayslipFilename } from '@/lib/utils/pdf/payslipNaming'

export const runtime = 'nodejs'


const STORAGE_BUCKET = 'Payroll'
const STORAGE_FOLDER = '' // Root of Payroll bucket

async function processRowWithStyledPDF(row: any, supabase: any): Promise<{ batch_id: string; ok: boolean; message?: string }> {
  try {
    console.log(`[STYLED PDF] Processing styled PDF for ${row.id}`)
    console.log(`[STYLED PDF] Employee: ${row.employee_name}, Employer: ${row.employer_name}`)
    
    // Generate styled PDF using pdf-lib
    const pdfBlob = await generatePayslipPDFStyled({
      employee: {
        id: row.id,
        employee_name: row.employee_name || '',
        email_id: row.email_id,
        basic_salary: row.basic_salary,
        housing_allowance: row.housing_allowance,
        transport_allowance: row.transport_allowance,
        education_allowance: row.education_allowance,
        flight_allowance: row.flight_allowance,
        general_allowance: row.general_allowance,
        other_allowance: row.other_allowance,
        total_gross_salary: row.total_gross_salary,
        bonus: row.bonus,
        overtime: row.overtime,
        salary_in_arrears: row.salary_in_arrears,
        gratuity_eosb: row.gratuity_eosb,
        unutilised_leave_days_payment: row.unutilised_leave_days_payment,
        expenses_deductions: row.expenses_deductions,
        expense_reimbursements: row.expense_reimbursements,
        other_reimbursements: row.other_reimbursements,
        total_adjustments: row.total_adjustments,
        net_salary: row.net_salary,
        esop_deductions: row.esop_deductions,
        total_payment_adjustments: row.total_payment_adjustments,
        net_payment: row.net_payment,
        bank_name: row.bank_name,
        iban: row.iban,
        wps_fees: row.wps_fees,
        total_to_transfer: row.total_to_transfer,
        currency: (row.currency || 'AED') as string
      },
      batchData: {
        batch_id: row.id,
        employer_name: row.employer_name || '',
        pay_period_from: row.pay_period_from || '',
        pay_period_to: row.pay_period_to || ''
      },
      language: 'english'
    })

    // Convert blob to buffer for upload
    const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer())
    console.log(`[STYLED PDF] Generated PDF buffer size: ${pdfBuffer.length} bytes for ${row.id}`)
    
    // Always regenerate - use existing token if present, otherwise create new one
    const token = row.payslip_token || crypto.randomUUID()
    const filename = generatePayslipFilename(row.employee_name || 'unknown', token)
    const storagePath = STORAGE_FOLDER ? `${STORAGE_FOLDER}/${filename}` : filename

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      console.error(`Upload error for ${row.id}:`, uploadError)
      return { batch_id: row.id, ok: false, message: `Upload failed: ${uploadError.message}` }
    }

    // Update database with payslip info
    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath)

    const { error: updateError } = await supabase
      .from('payroll_excel_imports')
      .update({
        payslip_filename: filename,
        payslip_url: publicUrlData?.publicUrl,
        payslip_token: token,
        payslip_generated_at: new Date().toISOString(),
        payslip_generation_method: 'styled-pdf'
      })
      .eq('id', row.id)

    if (updateError) {
      console.error(`Database update error for ${row.id}:`, updateError)
      return { batch_id: row.id, ok: false, message: `Database update failed: ${updateError.message}` }
    }

    console.log(`Successfully processed styled PDF for ${row.id}`)
    return { batch_id: row.id, ok: true, message: 'Generated using styled PDF (pdf-lib)' }
    
  } catch (error) {
    console.error(`[STYLED PDF] Processing failed for ${row.id}:`, error)
    console.error(`[STYLED PDF] Error stack:`, error instanceof Error ? error.stack : 'No stack trace')
    console.error(`[STYLED PDF] Error details:`, {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'Unknown',
      rowId: row.id,
      employeeName: row.employee_name
    })
    return { 
      batch_id: row.id, 
      ok: false, 
      message: `Styled PDF processing failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }
  }
}

async function processRowWithFallback(row: any, supabase: any): Promise<{ batch_id: string; ok: boolean; message?: string }> {
  try {
    console.log(`Processing fallback PDF for ${row.id}`)
    const fallbackPdf = await generatePayslipPDFFallback({
      employee: {
        id: row.id,
        employee_name: row.employee_name || '',
        email_id: row.email_id,
        basic_salary: row.basic_salary,
        housing_allowance: row.housing_allowance,
        transport_allowance: row.transport_allowance,
        education_allowance: row.education_allowance,
        flight_allowance: row.flight_allowance,
        general_allowance: row.general_allowance,
        other_allowance: row.other_allowance,
        total_fixed_salary: row.total_gross_salary,
        bonus: row.bonus,
        overtime: row.overtime,
        salary_in_arrears: row.salary_in_arrears,
        unutilised_leave_days_payment: row.unutilised_leave_days_payment,
        expenses_deductions: row.expenses_deductions,
        other_reimbursements: row.other_reimbursements,
        expense_reimbursements: row.expense_reimbursements,
        gratuity_eosb: row.gratuity_eosb,
        total_variable_salary: row.total_adjustments,
        total_salary: row.net_salary,
        esop_deductions: row.esop_deductions,
        total_payment_adjustments: row.total_payment_adjustments,
        net_payment: row.net_payment,
        bank_name: row.bank_name,
        iban: row.iban,
        wps_fees: row.wps_fees,
        total_to_transfer: row.total_to_transfer,
        currency: (row.currency || 'AED') as string
      },
      batchData: {
        batch_id: row.id,
        employer_name: row.employer_name || '',
        pay_period_from: row.pay_period_from || '',
        pay_period_to: row.pay_period_to || ''
      },
      language: 'english'
    })
    
    const token = row.payslip_token || crypto.randomUUID()
    const filename = generatePayslipFilename(row.employee_name || 'unknown', token)
    const storagePath = STORAGE_FOLDER ? `${STORAGE_FOLDER}/${filename}` : filename

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, fallbackPdf, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      console.error(`Upload error for ${row.id}:`, uploadError)
      return { batch_id: row.id, ok: false, message: `Upload failed: ${uploadError.message}` }
    }

    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath)

    const { error: updateError } = await supabase
      .from('payroll_excel_imports')
      .update({
        payslip_filename: filename,
        payslip_url: publicUrlData?.publicUrl,
        payslip_token: token,
        payslip_generated_at: new Date().toISOString(),
        payslip_generation_method: 'fallback'
      })
      .eq('id', row.id)

    if (updateError) {
      console.error(`Database update error for ${row.id}:`, updateError)
      return { batch_id: row.id, ok: false, message: `Database update failed: ${updateError.message}` }
    }

    console.log(`Successfully processed fallback PDF for ${row.id}`)
    return { batch_id: row.id, ok: true, message: 'Generated using fallback method' }
    
  } catch (error) {
    console.error(`Fallback processing failed for ${row.id}:`, error)
    return { 
      batch_id: row.id, 
      ok: false, 
      message: `Fallback processing failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('Starting payslip generation API...')
    const supabase = getSupabaseServiceClient()
    
    // Support both direct batchIds array or chunked approach with filters
    const body = await req.json().catch(() => ({}))
    let batchIds: string[] = []
    
    if (Array.isArray(body.batchIds)) {
      batchIds = body.batchIds
    } else if (body.filters) {
      // Fetch IDs based on filters (for large batches)
      const { data, error } = await supabase
        .from('payroll_excel_imports')
        .select('id')
        .in('id', body.filters.ids || [])
      
      if (error) {
        console.error('Error fetching batch IDs:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      batchIds = (data || []).map(r => r.id)
    }
    
    if (batchIds.length === 0) {
      console.log('No batch IDs provided')
      return NextResponse.json({ error: 'batchIds required' }, { status: 400 })
    }
    
    console.log(`Processing ${batchIds.length} batch IDs`)

  const { data: rows, error } = await supabase
    .from('payroll_excel_imports')
    .select('*')
    .in('id', batchIds)

  if (error) {
    console.error('Database error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  console.log(`Found ${rows?.length || 0} rows to process`)

    console.log('Using styled PDF generation with pdf-lib')
  
  const results: { batch_id: string; ok: boolean; message?: string }[] = []

  for (const row of rows ?? []) {
    // Always try styled PDF generation first (even if PDF already exists)
    // The upsert: true flag in upload will replace existing files
    console.log(`[MAIN] Processing row ${row.id} - will regenerate PDF even if exists`)
    const result = await processRowWithStyledPDF(row, supabase)
    
    // If styled PDF fails, try fallback
    if (!result.ok) {
      console.log(`[MAIN] Styled PDF failed for ${row.id}, attempting fallback`)
      const fallbackResult = await processRowWithFallback(row, supabase)
      results.push(fallbackResult)
    } else {
      console.log(`[MAIN] Successfully generated styled PDF for ${row.id}`)
      results.push(result)
    }
  }

  return NextResponse.json({ results })
  } catch (error) {
    console.error('Error in payslips generate API:', error)
    
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}


