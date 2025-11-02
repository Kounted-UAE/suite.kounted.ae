/**
 * Fallback PDF generation using @react-pdf/renderer
 * This is used when Puppeteer fails in production environments
 */
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

interface EmployeeData {
  id: string
  employee_name: string
  email_id?: string
  basic_salary?: number
  housing_allowance?: number
  education_allowance?: number
  flight_allowance?: number
  general_allowance?: number
  gratuity_eosb?: number
  other_allowance?: number
  total_fixed_salary?: number
  bonus?: number
  overtime?: number
  salary_in_arrears?: number
  expenses_deductions?: number
  other_reimbursements?: number
  expense_reimbursements?: number
  total_variable_salary?: number
  total_salary?: number
  esop_deductions?: number
  total_payment_adjustments?: number
  net_payment?: number
  wps_fees?: number
  total_to_transfer?: number
  currency?: string
}

interface BatchData {
  batch_id: string
  employer_name: string
  pay_period_from: string
  pay_period_to: string
}

interface GeneratePayslipPDFFallbackParams {
  employee: EmployeeData
  batchData: BatchData
  language: 'english' | 'arabic' | 'mixed'
}

export async function generatePayslipPDFFallback({
  employee,
  batchData,
  language
}: GeneratePayslipPDFFallbackParams): Promise<Blob> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595.28, 841.89]) // A4 size
  const { width, height } = page.getSize()

  // Load fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // Helper function to format currency
  const formatCurrency = (amount: number | undefined, currency: string) => {
    if (!amount) return '0.00'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'AED',
      minimumFractionDigits: 2
    }).format(amount)
  }

  // Helper function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Header
  const headerY = height - 50
  page.drawText('PAYSLIP', {
    x: 50,
    y: headerY,
    size: 24,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2)
  })

  // Company Information
  page.drawText(batchData.employer_name, {
    x: 50,
    y: headerY - 30,
    size: 14,
    font: boldFont,
    color: rgb(0.3, 0.3, 0.3)
  })

  // Pay Period
  page.drawText(`Pay Period: ${formatDate(batchData.pay_period_from)} - ${formatDate(batchData.pay_period_to)}`, {
    x: 50,
    y: headerY - 50,
    size: 10,
    font: font,
    color: rgb(0.5, 0.5, 0.5)
  })

  // Employee Information Section
  const employeeSectionY = headerY - 100
  page.drawText('Employee Information', {
    x: 50,
    y: employeeSectionY,
    size: 12,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2)
  })

  page.drawText(`Name: ${employee.employee_name}`, {
    x: 50,
    y: employeeSectionY - 20,
    size: 10,
    font: font,
    color: rgb(0.3, 0.3, 0.3)
  })

  if (employee.email_id) {
    page.drawText(`Email: ${employee.email_id}`, {
      x: 50,
      y: employeeSectionY - 40,
      size: 10,
      font: font,
      color: rgb(0.3, 0.3, 0.3)
    })
  }

  // Earnings Section
  const earningsY = employeeSectionY - 80
  page.drawText('Earnings', {
    x: 50,
    y: earningsY,
    size: 12,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2)
  })

  let currentY = earningsY - 20
  const lineHeight = 15

  // Basic Salary
  if (employee.basic_salary) {
    page.drawText(`Basic Salary: ${formatCurrency(employee.basic_salary, employee.currency || 'AED')}`, {
      x: 50,
      y: currentY,
      size: 10,
      font: font,
      color: rgb(0.3, 0.3, 0.3)
    })
    currentY -= lineHeight
  }

  // Housing Allowance
  if (employee.housing_allowance) {
    page.drawText(`Housing Allowance: ${formatCurrency(employee.housing_allowance, employee.currency || 'AED')}`, {
      x: 50,
      y: currentY,
      size: 10,
      font: font,
      color: rgb(0.3, 0.3, 0.3)
    })
    currentY -= lineHeight
  }

  // Education Allowance
  if (employee.education_allowance) {
    page.drawText(`Education Allowance: ${formatCurrency(employee.education_allowance, employee.currency || 'AED')}`, {
      x: 50,
      y: currentY,
      size: 10,
      font: font,
      color: rgb(0.3, 0.3, 0.3)
    })
    currentY -= lineHeight
  }

  // Flight Allowance
  if (employee.flight_allowance) {
    page.drawText(`Flight Allowance: ${formatCurrency(employee.flight_allowance, employee.currency || 'AED')}`, {
      x: 50,
      y: currentY,
      size: 10,
      font: font,
      color: rgb(0.3, 0.3, 0.3)
    })
    currentY -= lineHeight
  }

  // General Allowance
  if (employee.general_allowance) {
    page.drawText(`General Allowance: ${formatCurrency(employee.general_allowance, employee.currency || 'AED')}`, {
      x: 50,
      y: currentY,
      size: 10,
      font: font,
      color: rgb(0.3, 0.3, 0.3)
    })
    currentY -= lineHeight
  }

  // Other Allowance
  if (employee.other_allowance) {
    page.drawText(`Other Allowance: ${formatCurrency(employee.other_allowance, employee.currency || 'AED')}`, {
      x: 50,
      y: currentY,
      size: 10,
      font: font,
      color: rgb(0.3, 0.3, 0.3)
    })
    currentY -= lineHeight
  }

  // Total Gross Salary
  if (employee.total_fixed_salary) {
    page.drawText(`Total Gross Salary: ${formatCurrency(employee.total_fixed_salary, employee.currency || 'AED')}`, {
      x: 50,
      y: currentY - 10,
      size: 11,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2)
    })
    currentY -= lineHeight + 10
  }

  // Adjustments Section
  const adjustmentsY = currentY - 20
  page.drawText('Adjustments', {
    x: 50,
    y: adjustmentsY,
    size: 12,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2)
  })

  currentY = adjustmentsY - 20

  // Bonus
  if (employee.bonus) {
    page.drawText(`Bonus: ${formatCurrency(employee.bonus, employee.currency || 'AED')}`, {
      x: 50,
      y: currentY,
      size: 10,
      font: font,
      color: rgb(0.3, 0.3, 0.3)
    })
    currentY -= lineHeight
  }

  // Gratuity / EOSB (Adjustment)
  if (employee.gratuity_eosb) {
    page.drawText(`Gratuity / EOSB: ${formatCurrency(employee.gratuity_eosb, employee.currency || 'AED')}`, {
      x: 50,
      y: currentY,
      size: 10,
      font: font,
      color: rgb(0.3, 0.3, 0.3)
    })
    currentY -= lineHeight
  }

  // Overtime
  if (employee.overtime) {
    page.drawText(`Overtime: ${formatCurrency(employee.overtime, employee.currency || 'AED')}`, {
      x: 50,
      y: currentY,
      size: 10,
      font: font,
      color: rgb(0.3, 0.3, 0.3)
    })
    currentY -= lineHeight
  }

  // Net Salary
  if (employee.total_salary) {
    page.drawText(`Net Salary: ${formatCurrency(employee.total_salary, employee.currency || 'AED')}`, {
      x: 50,
      y: currentY - 20,
      size: 12,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1)
    })
  }

  // Footer
  page.drawText('Generated by kounted Business Solutions', {
    x: 50,
    y: 50,
    size: 8,
    font: font,
    color: rgb(0.5, 0.5, 0.5)
  })

  page.drawText('For assistance, contact payroll@kounted.ae', {
    x: 50,
    y: 40,
    size: 8,
    font: font,
    color: rgb(0.5, 0.5, 0.5)
  })

  // Convert to blob
  const pdfBytes = await pdfDoc.save()
  return new Blob([pdfBytes], { type: 'application/pdf' })
}
