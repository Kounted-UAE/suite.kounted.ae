/**
 * Payroll route PDF generator (browser-safe) using pdf-lib.
 * Used by the payroll wizard components under `components/kounted-payroll/...`.
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
  unutilised_leave_days_payment?: number
  expenses_deductions?: number
  other_reimbursements?: number
  expense_reimbursements?: number
  total_variable_salary?: number
  total_salary?: number
  wps_fees?: number
  total_to_transfer?: number
  currency?: string
}

interface BatchData {
  batch_id: string
  employer_name: string
  pay_period_from: string
  pay_period_to: string
  currency: string
}

interface GeneratePayslipPDFParams {
  employee: EmployeeData
  batchData: BatchData
  language: 'english' | 'arabic' | 'mixed'
}

export async function generatePayslipPDF({
  employee,
  batchData,
  language
}: GeneratePayslipPDFParams): Promise<Blob> {
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
      y: employeeSectionY - 35,
      size: 10,
      font: font,
      color: rgb(0.3, 0.3, 0.3)
    })
  }

  // Salary Breakdown Section
  const salarySectionY = employeeSectionY - 80
  page.drawText('Salary Breakdown', {
    x: 50,
    y: salarySectionY,
    size: 12,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2)
  })

  let currentY = salarySectionY - 20
  const lineHeight = 15

  // Fixed Salary Components
  const fixedComponents = [
    { label: 'Basic Salary', value: employee.basic_salary },
    { label: 'Housing Allowance', value: employee.housing_allowance },
    { label: 'Education Allowance', value: employee.education_allowance },
    { label: 'Flight Allowance', value: employee.flight_allowance },
    { label: 'General Allowance', value: employee.general_allowance },
    { label: 'Other Allowance', value: employee.other_allowance }
  ]

  page.drawText('Fixed Salary Components:', {
    x: 50,
    y: currentY,
    size: 10,
    font: boldFont,
    color: rgb(0.3, 0.3, 0.3)
  })
  currentY -= lineHeight

  fixedComponents.forEach(component => {
    if (component.value) {
      page.drawText(`${component.label}:`, {
        x: 70,
        y: currentY,
        size: 9,
        font: font,
        color: rgb(0.4, 0.4, 0.4)
      })
      page.drawText(formatCurrency(component.value, employee.currency || batchData.currency), {
        x: 250,
        y: currentY,
        size: 9,
        font: font,
        color: rgb(0.4, 0.4, 0.4)
      })
      currentY -= lineHeight
    }
  })

  // Total Fixed Salary
  if (employee.total_fixed_salary) {
    page.drawText('Total Fixed Salary:', {
      x: 70,
      y: currentY,
      size: 10,
      font: boldFont,
      color: rgb(0.3, 0.3, 0.3)
    })
    page.drawText(formatCurrency(employee.total_fixed_salary, employee.currency || batchData.currency), {
      x: 250,
      y: currentY,
      size: 10,
      font: boldFont,
      color: rgb(0.3, 0.3, 0.3)
    })
    currentY -= lineHeight * 1.5
  }

  // Variable Salary Components
  const variableComponents = [
    { label: 'Bonus', value: employee.bonus },
    { label: 'Overtime', value: employee.overtime },
    { label: 'Salary in Arrears', value: employee.salary_in_arrears },
    { label: 'Gratuity/EOSB', value: employee.gratuity_eosb },
    { label: 'Unutilised Leave Days Payment', value: employee.unutilised_leave_days_payment },
    { label: 'Adhoc Expenses', value: employee.expenses_deductions },
    { label: 'School Reimbursements', value: employee.other_reimbursements },
    { label: 'Internet Reimbursements', value: employee.expense_reimbursements }
  ]

  page.drawText('Variable Salary Components:', {
    x: 50,
    y: currentY,
    size: 10,
    font: boldFont,
    color: rgb(0.3, 0.3, 0.3)
  })
  currentY -= lineHeight

  variableComponents.forEach(component => {
    if (component.value) {
      page.drawText(`${component.label}:`, {
        x: 70,
        y: currentY,
        size: 9,
        font: font,
        color: rgb(0.4, 0.4, 0.4)
      })
      page.drawText(formatCurrency(component.value, employee.currency || batchData.currency), {
        x: 250,
        y: currentY,
        size: 9,
        font: font,
        color: rgb(0.4, 0.4, 0.4)
      })
      currentY -= lineHeight
    }
  })

  // Total Variable Salary
  if (employee.total_variable_salary) {
    page.drawText('Total Variable Salary:', {
      x: 70,
      y: currentY,
      size: 10,
      font: boldFont,
      color: rgb(0.3, 0.3, 0.3)
    })
    page.drawText(formatCurrency(employee.total_variable_salary, employee.currency || batchData.currency), {
      x: 250,
      y: currentY,
      size: 10,
      font: boldFont,
      color: rgb(0.3, 0.3, 0.3)
    })
    currentY -= lineHeight * 1.5
  }

  // Deductions
  if (employee.wps_fees) {
    page.drawText('Deductions:', {
      x: 50,
      y: currentY,
      size: 10,
      font: boldFont,
      color: rgb(0.3, 0.3, 0.3)
    })
    currentY -= lineHeight

    page.drawText('WPS Fees:', {
      x: 70,
      y: currentY,
      size: 9,
      font: font,
      color: rgb(0.4, 0.4, 0.4)
    })
    page.drawText(formatCurrency(employee.wps_fees, employee.currency || batchData.currency), {
      x: 250,
      y: currentY,
      size: 9,
      font: font,
      color: rgb(0.4, 0.4, 0.4)
    })
    currentY -= lineHeight * 1.5
  }

  // Totals
  const totalsY = currentY - 20
  page.drawText('Summary:', {
    x: 50,
    y: totalsY,
    size: 12,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2)
  })

  if (employee.total_salary) {
    page.drawText('Gross Salary:', {
      x: 70,
      y: totalsY - 20,
      size: 11,
      font: boldFont,
      color: rgb(0.3, 0.3, 0.3)
    })
    page.drawText(formatCurrency(employee.total_salary, employee.currency || batchData.currency), {
      x: 250,
      y: totalsY - 20,
      size: 11,
      font: boldFont,
      color: rgb(0.3, 0.3, 0.3)
    })
  }

  if (employee.total_to_transfer) {
    page.drawText('Net Salary (To Transfer):', {
      x: 70,
      y: totalsY - 40,
      size: 12,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1)
    })
    page.drawText(formatCurrency(employee.total_to_transfer, employee.currency || batchData.currency), {
      x: 250,
      y: totalsY - 40,
      size: 12,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1)
    })
  }

  // Footer
  const footerY = 50
  page.drawText(`Generated on: ${new Date().toLocaleDateString()}`, {
    x: 50,
    y: footerY,
    size: 8,
    font: font,
    color: rgb(0.5, 0.5, 0.5)
  })

  page.drawText(`Batch ID: ${batchData.batch_id}`, {
    x: 50,
    y: footerY - 15,
    size: 8,
    font: font,
    color: rgb(0.5, 0.5, 0.5)
  })

  // Serialize the PDF to bytes
  const pdfBytes = await pdfDoc.save()
  
  // Convert to Blob
  return new Blob([pdfBytes as any], { type: 'application/pdf' })
} 