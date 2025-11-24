/**
 * Styled PDF generation using @react-pdf/renderer
 * Matches the HTML template styling exactly
 */
import React from 'react'
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  Font
} from '@react-pdf/renderer'

// Register fonts
Font.register({
  family: 'Segoe UI',
  fonts: [
    { 
      src: 'https://fonts.gstatic.com/s/segoeui/v18/NEO-UNFDBD.ttf', 
      fontWeight: 'normal' 
    },
    { 
      src: 'https://fonts.gstatic.com/s/segoeui/v18/NEO-UNFDBD.ttf', 
      fontWeight: 'bold' 
    }
  ]
})

// Fallback to Helvetica if Segoe UI fails
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfA.ttf', fontWeight: 'normal' },
    { src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfB.ttf', fontWeight: 'bold' }
  ]
})

// Create styles matching the HTML template
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 24,
    fontFamily: 'Segoe UI',
    fontSize: 10,
    color: '#000100'
  },
  // Black header matching HTML template
  header: {
    backgroundColor: '#000100',
    color: '#ffffff',
    padding: 24,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    marginBottom: 0
  },
  // Section styling
  section: {
    padding: '20px 24px',
    borderBottom: '0.5px solid #e0e0e0'
  },
  sectionLast: {
    padding: '20px 24px',
    borderBottom: 'none'
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 4,
    color: '#333333'
  },
  // Field styling (label + value)
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 6
  },
  fieldLabel: {
    fontWeight: 500,
    color: '#333333',
    marginRight: 12
  },
  fieldValue: {
    color: '#111111'
  },
  // Green box for earnings/adjustments
  box: {
    backgroundColor: '#f0fdf4',
    borderLeft: '4px solid #80C041',
    padding: 12,
    marginTop: 4,
    fontSize: 10,
    lineHeight: 1.6
  },
  // Blue box for final net payment
  boxBlue: {
    backgroundColor: '#f0f9ff',
    borderLeft: '4px solid #0ea5e9',
    padding: 12,
    marginTop: 2,
    fontSize: 10,
    lineHeight: 1.6
  },
  // Box line (label and value in box)
  boxLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 4
  },
  boxLineLabel: {
    fontSize: 10
  },
  boxLineValue: {
    fontSize: 10,
    fontWeight: 'bold'
  },
  // Horizontal rule
  hr: {
    borderTop: '1px solid #cccccc',
    marginTop: 8,
    marginBottom: 8
  },
  // Grid for bank details
  grid2: {
    flexDirection: 'row',
    gap: 12
  },
  gridItem: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: '12px 16px',
    borderRadius: 6
  },
  gridItemLabel: {
    fontWeight: 500,
    marginBottom: 4,
    fontSize: 10
  },
  gridItemValue: {
    color: '#000000',
    fontSize: 10,
    wordBreak: 'break-word'
  },
  // Footer
  footer: {
    fontSize: 10,
    color: '#666666',
    textAlign: 'center',
    padding: 12,
    marginTop: 20,
    borderTop: '0.5px solid #dddddd'
  }
})

interface EmployeeData {
  id: string
  employee_name: string
  email_id?: string
  basic_salary?: number
  housing_allowance?: number
  transport_allowance?: number
  education_allowance?: number
  flight_allowance?: number
  general_allowance?: number
  other_allowance?: number
  total_gross_salary?: number
  bonus?: number
  overtime?: number
  salary_in_arrears?: number
  gratuity_eosb?: number
  unutilised_leave_days_payment?: number
  expenses_deductions?: number
  expense_reimbursements?: number
  other_reimbursements?: number
  total_adjustments?: number
  net_salary?: number
  esop_deductions?: number
  total_payment_adjustments?: number
  net_payment?: number
  bank_name?: string
  iban?: string
  currency?: string
}

interface BatchData {
  batch_id: string
  employer_name: string
  pay_period_from: string
  pay_period_to: string
}

interface GeneratePayslipPDFStyledParams {
  employee: EmployeeData
  batchData: BatchData
  language: 'english' | 'arabic' | 'mixed'
}

// Helper function to format currency
const formatCurrency = (amount: number | undefined, currency: string): string => {
  if (amount == null || isNaN(amount)) return ''
  const safeCurrency = (currency || 'AED').toUpperCase()
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: safeCurrency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount))
}

// Helper to render box line (label + value)
const BoxLine: React.FC<{ label: string; value: number | undefined; currency: string }> = ({ label, value, currency }) => {
  if (value == null || value === '') return null
  return (
    <View style={styles.boxLine}>
      <Text style={styles.boxLineLabel}>{label}</Text>
      <Text style={styles.boxLineValue}>{formatCurrency(value, currency)}</Text>
    </View>
  )
}

// Payslip Document Component
const PayslipDocument: React.FC<GeneratePayslipPDFStyledParams> = ({ employee, batchData }) => {
  const currency = (employee.currency || 'AED') as string
  const hasPaymentAdjustments = employee.total_payment_adjustments && employee.total_payment_adjustments !== 0

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text>{batchData.employer_name}</Text>
        </View>

        {/* Payslip Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payslip Details</Text>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Employee:</Text>
            <Text style={styles.fieldValue}>{employee.employee_name}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Employer:</Text>
            <Text style={styles.fieldValue}>{batchData.employer_name}</Text>
          </View>
        </View>

        {/* Payslip Period Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payslip Period</Text>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>From:</Text>
            <Text style={styles.fieldValue}>{batchData.pay_period_from}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>To:</Text>
            <Text style={styles.fieldValue}>{batchData.pay_period_to}</Text>
          </View>
        </View>

        {/* Monthly Earnings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Earnings</Text>
          <View style={styles.box}>
            <BoxLine label="Basic Salary & Wage" value={employee.basic_salary} currency={currency} />
            <BoxLine label="Housing Allowance" value={employee.housing_allowance} currency={currency} />
            <BoxLine label="Transport Allowance" value={employee.transport_allowance} currency={currency} />
            <BoxLine label="Flight Allowance" value={employee.flight_allowance} currency={currency} />
            <BoxLine label="Education Allowance" value={employee.education_allowance} currency={currency} />
            <BoxLine label="General Allowance" value={employee.general_allowance} currency={currency} />
            <BoxLine label="Other Allowance" value={employee.other_allowance} currency={currency} />
            <View style={styles.hr} />
            <BoxLine label="TOTAL EARNINGS" value={employee.total_gross_salary} currency={currency} />
          </View>
        </View>

        {/* Other Adjustments Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Other Adjustments</Text>
          <View style={styles.box}>
            <BoxLine label="Bonuses" value={employee.bonus} currency={currency} />
            <BoxLine label="Overtime" value={employee.overtime} currency={currency} />
            <BoxLine label="Arrears/Advances" value={employee.salary_in_arrears} currency={currency} />
            <BoxLine label="Gratuity/EOSB" value={employee.gratuity_eosb} currency={currency} />
            <BoxLine label="Unutilised Leave Days Payment" value={employee.unutilised_leave_days_payment} currency={currency} />
            <BoxLine label="Expense Deductions" value={employee.expenses_deductions} currency={currency} />
            <BoxLine label="Other Reimbursements" value={employee.other_reimbursements} currency={currency} />
            <BoxLine label="Expense Reimbursements" value={employee.expense_reimbursements} currency={currency} />
            <View style={styles.hr} />
            <BoxLine label="TOTAL ADJUSTMENTS" value={employee.total_adjustments} currency={currency} />
          </View>
        </View>

        {/* Net Earnings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Net Earnings</Text>
          <View style={styles.box}>
            <BoxLine label="NET" value={employee.net_salary} currency={currency} />
          </View>
        </View>

        {/* Payment Adjustments Section - Conditional */}
        {hasPaymentAdjustments && (
          <>
            <View style={[styles.section, { padding: '12px 24px' }]}>
              <Text style={styles.sectionTitle}>Payment Adjustments</Text>
              <View style={[styles.box, { marginTop: 2 }]}>
                <BoxLine label="ESOP Deductions" value={employee.esop_deductions} currency={currency} />
                <View style={[styles.hr, { marginTop: 4, marginBottom: 4 }]} />
                <BoxLine label="TOTAL PAYMENT ADJUSTMENTS" value={employee.total_payment_adjustments} currency={currency} />
              </View>
            </View>

            <View style={[styles.section, { padding: '12px 24px', borderBottom: 'none' }]}>
              <Text style={styles.sectionTitle}>Final Net Payment</Text>
              <View style={[styles.boxBlue, { marginTop: 2 }]}>
                <BoxLine label="FINAL NET PAYMENT" value={employee.net_payment} currency={currency} />
              </View>
            </View>
          </>
        )}

        {/* Bank Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bank Details</Text>
          <View style={styles.grid2}>
            <View style={styles.gridItem}>
              <Text style={styles.gridItemLabel}>Bank</Text>
              <Text style={styles.gridItemValue}>{employee.bank_name || '-'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridItemLabel}>IBAN</Text>
              <Text style={styles.gridItemValue}>{employee.iban || '-'}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Generated by the Advontier Business Solutions. For assistance, contact{' '}
            <Text style={{ fontWeight: 'bold' }}>payroll@kounted.ae</Text>
          </Text>
        </View>
      </Page>
    </Document>
  )
}

// Main export function
export async function generatePayslipPDFStyled({
  employee,
  batchData,
  language
}: GeneratePayslipPDFStyledParams): Promise<Blob> {
  const { renderToStream } = await import('@react-pdf/renderer')
  
  const stream = await renderToStream(
    <PayslipDocument employee={employee} batchData={batchData} language={language} />
  )
  
  // Convert stream to blob
  const chunks: Uint8Array[] = []
  for await (const chunk of stream) {
    if (typeof chunk === 'string') {
      chunks.push(new TextEncoder().encode(chunk))
    } else if (chunk instanceof Buffer) {
      chunks.push(new Uint8Array(chunk))
    } else {
      chunks.push(chunk as Uint8Array)
    }
  }
  
  const blob = new Blob(chunks as BlobPart[], { type: 'application/pdf' })
  return blob
}

