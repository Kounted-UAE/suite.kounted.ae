import React from 'react'
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  Font,
  Image 
} from '@react-pdf/renderer'

// Register fonts (you can add custom fonts here)
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfA.ttf', fontWeight: 'normal' },
    { src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfB.ttf', fontWeight: 'bold' }
  ]
})

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Helvetica'
  },
  
  // Header Section
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    borderBottom: '2 solid #2563eb',
    paddingBottom: 20
  },
  
  companyInfo: {
    flex: 1
  },
  
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8
  },
  
  companyAddress: {
    fontSize: 10,
    color: '#64748b',
    lineHeight: 1.4
  },
  
  payslipTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2563eb',
    textAlign: 'right'
  },
  
  // Employee Information Section
  employeeSection: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#f8fafc',
    borderRadius: 8
  },
  
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
    borderBottom: '1 solid #e2e8f0',
    paddingBottom: 5
  },
  
  employeeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20
  },
  
  employeeField: {
    minWidth: '45%',
    marginBottom: 8
  },
  
  fieldLabel: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 2
  },
  
  fieldValue: {
    fontSize: 11,
    color: '#1e293b',
    fontWeight: 'bold'
  },
  
  // Pay Period Section
  payPeriodSection: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    borderLeft: '4 solid #2563eb'
  },
  
  payPeriodTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8
  },
  
  payPeriodText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: 'bold'
  },
  
  // Salary Breakdown Section
  salarySection: {
    marginBottom: 25
  },
  
  salaryTable: {
    border: '1 solid #e2e8f0',
    borderRadius: 6
  },
  
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottom: '1 solid #e2e8f0'
  },
  
  tableHeaderCell: {
    flex: 1,
    padding: 10,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#475569',
    textAlign: 'center'
  },
  
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #f1f5f9'
  },
  
  tableRowLast: {
    flexDirection: 'row',
    borderBottom: 'none'
  },
  
  tableCell: {
    flex: 1,
    padding: 8,
    fontSize: 9,
    color: '#374151',
    textAlign: 'center'
  },
  
  tableCellLeft: {
    flex: 1,
    padding: 8,
    fontSize: 9,
    color: '#374151',
    textAlign: 'left'
  },
  
  tableCellRight: {
    flex: 1,
    padding: 8,
    fontSize: 9,
    color: '#374151',
    textAlign: 'right'
  },
  
  // Total Section
  totalSection: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#f0fdf4',
    borderRadius: 6,
    border: '2 solid #16a34a'
  },
  
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5
  },
  
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#15803d'
  },
  
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#15803d'
  },
  
  netSalaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1 solid #bbf7d0',
    paddingTop: 8,
    marginTop: 8
  },
  
  netSalaryLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#166534'
  },
  
  netSalaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#166534'
  },
  
  // Footer Section
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTop: '1 solid #e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end'
  },
  
  footerLeft: {
    flex: 1
  },
  
  footerText: {
    fontSize: 8,
    color: '#64748b',
    lineHeight: 1.3
  },
  
  signatureSection: {
    flex: 1,
    alignItems: 'flex-end'
  },
  
  signatureLine: {
    width: 150,
    borderBottom: '1 solid #94a3b8',
    marginBottom: 5
  },
  
  signatureLabel: {
    fontSize: 8,
    color: '#64748b',
    textAlign: 'center'
  },
  
  // Utility classes
  textCenter: {
    textAlign: 'center'
  },
  
  textRight: {
    textAlign: 'right'
  },
  
  textBold: {
    fontWeight: 'bold'
  }
})

interface EmployeeData {
  employee_name: string
  email_id?: string
  employee_mol?: string
  bank_name?: string
  iban?: string
  basic_salary?: number
  housing_allowance?: number
  education_allowance?: number
  flight_allowance?: number
  general_allowance?: number
  other_allowance?: number
  total_fixed_salary?: number
  bonus?: number
  overtime?: number
  salary_in_arrears?: number
  unutilised_leave_days_payment?: number
  expenses_deductions?: number
  other_reimbursements?: number
  expense_reimbursements?: number
  gratuity_eosb?: number
  total_variable_salary?: number
  total_salary?: number
  wps_fees?: number
  total_to_transfer?: number
  currency?: string
}

interface BatchData {
  employer_name: string
  pay_period_from: string
  pay_period_to: string
  currency: string
}

interface PayslipInput {
  employee: EmployeeData
  batch: BatchData
}

// Helper function to format currency
const formatCurrency = (amount: number | undefined, currency: string): string => {
  if (!amount) return '0.00'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'AED',
    minimumFractionDigits: 2
  }).format(amount)
}

// Helper function to format date
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Helper function to get month and year
const getMonthYear = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long'
  })
}

// Payslip Document Component
const PayslipDocument: React.FC<PayslipInput> = ({ employee, batch }) => {
  const currency = employee.currency || batch.currency || 'AED'
  
  // Prepare salary breakdown data
  const salaryBreakdown = [
    { label: 'Basic Salary', amount: employee.basic_salary, type: 'fixed' },
    { label: 'Housing Allowance', amount: employee.housing_allowance, type: 'fixed' },
    { label: 'Education Allowance', amount: employee.education_allowance, type: 'fixed' },
    { label: 'Flight Allowance', amount: employee.flight_allowance, type: 'fixed' },
    { label: 'General Allowance', amount: employee.general_allowance, type: 'fixed' },
    { label: 'Other Allowance', amount: employee.other_allowance, type: 'fixed' },
    { label: 'Bonus', amount: employee.bonus, type: 'variable' },
    { label: 'Overtime', amount: employee.overtime, type: 'variable' },
    { label: 'Salary in Arrears', amount: employee.salary_in_arrears, type: 'variable' },
    { label: 'Gratuity/EOSB', amount: employee.gratuity_eosb, type: 'variable' },
    { label: 'Unutilised Leave Days Payment', amount: employee.unutilised_leave_days_payment, type: 'variable' },
    { label: 'Adhoc Expenses', amount: employee.expenses_deductions, type: 'variable' },
    { label: 'School Reimbursements', amount: employee.other_reimbursements, type: 'variable' },
    { label: 'Internet Reimbursements', amount: employee.expense_reimbursements, type: 'variable' }
  ].filter(item => item.amount && item.amount > 0)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{batch.employer_name}</Text>
            <Text style={styles.companyAddress}>
              Dubai, United Arab Emirates{'\n'}
              Tel: +971 4 XXX XXXX | Email: payroll@{batch.employer_name.toLowerCase().replace(/\s+/g, '')}.ae
            </Text>
          </View>
          <View>
            <Text style={styles.payslipTitle}>PAYSLIP</Text>
          </View>
        </View>

        {/* Employee Information */}
        <View style={styles.employeeSection}>
          <Text style={styles.sectionTitle}>Employee Information</Text>
          <View style={styles.employeeGrid}>
            <View style={styles.employeeField}>
              <Text style={styles.fieldLabel}>Employee Name</Text>
              <Text style={styles.fieldValue}>{employee.employee_name}</Text>
            </View>
            <View style={styles.employeeField}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <Text style={styles.fieldValue}>{employee.email_id || 'N/A'}</Text>
            </View>
            <View style={styles.employeeField}>
              <Text style={styles.fieldLabel}>MOL ID</Text>
              <Text style={styles.fieldValue}>{employee.employee_mol || 'N/A'}</Text>
            </View>
            <View style={styles.employeeField}>
              <Text style={styles.fieldLabel}>Bank</Text>
              <Text style={styles.fieldValue}>{employee.bank_name || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Pay Period */}
        <View style={styles.payPeriodSection}>
          <Text style={styles.payPeriodTitle}>Pay Period</Text>
          <Text style={styles.payPeriodText}>
            {formatDate(batch.pay_period_from)} - {formatDate(batch.pay_period_to)}
          </Text>
        </View>

        {/* Salary Breakdown */}
        <View style={styles.salarySection}>
          <Text style={styles.sectionTitle}>Salary Breakdown</Text>
          <View style={styles.salaryTable}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderCell}>Description</Text>
              <Text style={styles.tableHeaderCell}>Amount ({currency})</Text>
            </View>
            
            {/* Table Rows */}
            {salaryBreakdown.map((item, index) => (
              <View key={index} style={index === salaryBreakdown.length - 1 ? styles.tableRowLast : styles.tableRow}>
                <Text style={styles.tableCellLeft}>{item.label}</Text>
                <Text style={styles.tableCellRight}>{formatCurrency(item.amount, currency)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totalSection}>
          {employee.total_fixed_salary && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Fixed Salary:</Text>
              <Text style={styles.totalValue}>{formatCurrency(employee.total_fixed_salary, currency)}</Text>
            </View>
          )}
          
          {employee.total_variable_salary && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Variable Salary:</Text>
              <Text style={styles.totalValue}>{formatCurrency(employee.total_variable_salary, currency)}</Text>
            </View>
          )}
          
          {employee.total_salary && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Gross Salary:</Text>
              <Text style={styles.totalValue}>{formatCurrency(employee.total_salary, currency)}</Text>
            </View>
          )}
          
          {employee.wps_fees && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>WPS Fees (Deduction):</Text>
              <Text style={styles.totalValue}>-{formatCurrency(employee.wps_fees, currency)}</Text>
            </View>
          )}
          
          {employee.total_to_transfer && (
            <View style={styles.netSalaryRow}>
              <Text style={styles.netSalaryLabel}>Net Salary (To Transfer):</Text>
              <Text style={styles.netSalaryValue}>{formatCurrency(employee.total_to_transfer, currency)}</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Text style={styles.footerText}>
              This payslip is computer generated and does not require a signature.{'\n'}
              Generated on: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}{'\n'}
              For queries, please contact your HR department.
            </Text>
          </View>
          <View style={styles.signatureSection}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Authorized Signature</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}

// Main export function
export async function generatePayslipPDF(data: PayslipInput): Promise<Blob> {
  const { renderToStream } = await import('@react-pdf/renderer')
  
  const stream = await renderToStream(<PayslipDocument {...data} />)
  
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

// Alternative export for direct PDF generation
export { PayslipDocument } 