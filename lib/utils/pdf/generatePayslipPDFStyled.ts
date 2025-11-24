/**
 * Styled payslip PDF using pdf-lib
 * Layout is tuned for A4 and avoids clipping by using dynamic box heights.
 */
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { KountedColors, hexToRgb } from '@/lib/config/colors'

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
  wps_fees?: number
  total_to_transfer?: number
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

// Color constants matching HTML template
const COLORS = {
  black: rgb(0.001, 0.001, 0.001), // #000100
  white: rgb(1, 1, 1),
  green: rgb(...hexToRgb(KountedColors.green)), // #80C041
  greenBg: rgb(0.941, 0.992, 0.957), // #f0fdf4
  blue: rgb(0.055, 0.647, 0.914), // #0ea5e9
  blueBg: rgb(0.941, 0.976, 1), // #f0f9ff
  gray: rgb(0.878, 0.878, 0.878), // #e0e0e0
  darkGray: rgb(0.2, 0.2, 0.2),
  lightGray: rgb(0.976, 0.976, 0.976), // #f9f9f9
  textDark: rgb(0.067, 0.067, 0.067), // #111111
  textGray: rgb(0.4, 0.4, 0.4), // #666666
}

const isNumber = (v: unknown): v is number =>
  typeof v === 'number' && !Number.isNaN(v)

export async function generatePayslipPDFStyled({
  employee,
  batchData,
}: GeneratePayslipPDFStyledParams): Promise<Blob> {
  try {
    console.log('[generatePayslipPDFStyled] Starting PDF generation with pdf-lib')
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595.28, 841.89]) // A4
    const { width, height } = page.getSize()

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const marginX = 40
    const marginTop = 40
    const lineHeight = 14
    const boxPaddingY = 10
    const boxPaddingX = 12
    const contentWidth = width - marginX * 2

    const formatCurrency = (amount: number | undefined, currency: string): string => {
      if (!isNumber(amount)) return ''
      const safeCurrency = (currency || 'AED').toUpperCase()
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: safeCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)
    }

    let y = height - marginTop

    // ---------- HEADER ----------
    const headerHeight = 50
    page.drawRectangle({
      x: marginX,
      y: y - headerHeight,
      width: contentWidth,
      height: headerHeight,
      color: COLORS.black,
    })

    // Scale header text if too long
    const headerBaseSize = 16
    let headerSize = headerBaseSize
    let headerTextWidth = boldFont.widthOfTextAtSize(batchData.employer_name, headerSize)
    const headerMaxWidth = contentWidth - 20
    if (headerTextWidth > headerMaxWidth) {
      headerSize = (headerMaxWidth / headerTextWidth) * headerSize
      headerTextWidth = boldFont.widthOfTextAtSize(batchData.employer_name, headerSize)
    }

    page.drawText(batchData.employer_name, {
      x: marginX + (contentWidth - headerTextWidth) / 2,
      y: y - headerHeight / 2 - headerSize / 2 + 4,
      size: headerSize,
      font: boldFont,
      color: COLORS.white,
    })

    y -= headerHeight + 24

    // ---------- SMALL HELPERS ----------
    const drawLabelValue = (
      label: string,
      value: string,
      yPos: number,
      labelX = marginX + 8,
      valueX = marginX + 80,
      size = 10,
    ) => {
      page.drawText(label, {
        x: labelX,
        y: yPos,
        size,
        font: boldFont,
        color: COLORS.darkGray,
      })
      page.drawText(value, {
        x: valueX,
        y: yPos,
        size,
        font,
        color: COLORS.textDark,
      })
    }

    const drawHLine = (yPos: number, inset = 0.5) => {
      page.drawLine({
        start: { x: marginX + inset, y: yPos },
        end: { x: width - marginX - inset, y: yPos },
        thickness: 0.5,
        color: COLORS.gray,
      })
    }

    const drawBoxLines = (opts: {
      title: string
      lines: { label: string; value?: number }[]
      totalLabel?: string
      totalValue?: number
      bgColor: typeof COLORS.greenBg | typeof COLORS.blueBg
      leftColor: typeof COLORS.green | typeof COLORS.blue
    }) => {
      const currency = employee.currency || 'AED'

      // filter visible lines
      const visibleLines = opts.lines.filter(l => isNumber(l.value))

      // if nothing to show and no total, skip entirely
      if (visibleLines.length === 0 && !isNumber(opts.totalValue)) {
        return y
      }

      // SECTION TITLE
      page.drawText(opts.title, {
        x: marginX + 8,
        y,
        size: 12,
        font: boldFont,
        color: COLORS.darkGray,
      })
      y -= 20

      const boxTopY = y
      const rowsCount =
        visibleLines.length + (isNumber(opts.totalValue) && opts.totalLabel ? 2 : 0) // extra for divider + total
      const boxHeight =
        boxPaddingY * 2 + rowsCount * lineHeight + (isNumber(opts.totalValue) ? 4 : 0)

      // background
      page.drawRectangle({
        x: marginX,
        y: boxTopY - boxHeight,
        width: contentWidth,
        height: boxHeight,
        color: opts.bgColor,
      })

      // left border
      page.drawRectangle({
        x: marginX,
        y: boxTopY - boxHeight,
        width: 4,
        height: boxHeight,
        color: opts.leftColor,
      })

      // content
      let cursorY = boxTopY - boxPaddingY - lineHeight
      visibleLines.forEach(l => {
        const v = l.value
        if (!isNumber(v)) return

        const valueText = formatCurrency(v, currency)
        page.drawText(l.label, {
          x: marginX + boxPaddingX + 8,
          y: cursorY,
          size: 10,
          font,
          color: COLORS.textDark,
        })

        const vWidth = boldFont.widthOfTextAtSize(valueText, 10)
        page.drawText(valueText, {
          x: marginX + contentWidth - boxPaddingX - 8 - vWidth,
          y: cursorY,
          size: 10,
          font: boldFont,
          color: COLORS.textDark,
        })

        cursorY -= lineHeight
      })

      if (isNumber(opts.totalValue) && opts.totalLabel) {
        cursorY -= 4
        // divider
        page.drawLine({
          start: { x: marginX + boxPaddingX + 8, y: cursorY },
          end: { x: marginX + contentWidth - boxPaddingX - 8, y: cursorY },
          thickness: 0.8,
          color: COLORS.gray,
        })
        cursorY -= lineHeight

        const totalText = formatCurrency(opts.totalValue, currency)
        page.drawText(opts.totalLabel, {
          x: marginX + boxPaddingX + 8,
          y: cursorY,
          size: 10,
          font: boldFont,
          color: COLORS.textDark,
        })

        const tWidth = boldFont.widthOfTextAtSize(totalText, 10)
        page.drawText(totalText, {
          x: marginX + contentWidth - boxPaddingX - 8 - tWidth,
          y: cursorY,
          size: 10,
          font: boldFont,
          color: COLORS.textDark,
        })
      }

      y = boxTopY - boxHeight - 24
      return y
    }

    // ---------- PAYSLIP DETAILS ----------
    page.drawText('Payslip Details', {
      x: marginX + 8,
      y,
      size: 12,
      font: boldFont,
      color: COLORS.darkGray,
    })
    y -= 20

    drawLabelValue('Employee:', employee.employee_name, y)
    y -= lineHeight

    drawLabelValue('Employer:', batchData.employer_name, y)
    y -= lineHeight + 10

    drawHLine(y)
    y -= 20

    // ---------- PAYSLIP PERIOD ----------
    page.drawText('Payslip Period', {
      x: marginX + 8,
      y,
      size: 12,
      font: boldFont,
      color: COLORS.darkGray,
    })
    y -= 20

    drawLabelValue('From:', batchData.pay_period_from, y)
    y -= lineHeight

    drawLabelValue('To:', batchData.pay_period_to, y)
    y -= lineHeight + 10

    drawHLine(y)
    y -= 20

    // ---------- MONTHLY EARNINGS ----------
    y = drawBoxLines({
      title: 'Monthly Earnings',
      lines: [
        { label: 'Basic Salary & Wage', value: employee.basic_salary },
        { label: 'Housing Allowance', value: employee.housing_allowance },
        { label: 'Transport Allowance', value: employee.transport_allowance },
        { label: 'Flight Allowance', value: employee.flight_allowance },
        { label: 'Education Allowance', value: employee.education_allowance },
        { label: 'General Allowance', value: employee.general_allowance },
        { label: 'Other Allowance', value: employee.other_allowance },
      ],
      totalLabel: 'TOTAL EARNINGS',
      totalValue: employee.total_gross_salary,
      bgColor: COLORS.greenBg,
      leftColor: COLORS.green,
    })

    drawHLine(y)
    y -= 20

    // ---------- OTHER ADJUSTMENTS ----------
    y = drawBoxLines({
      title: 'Other Adjustments',
      lines: [
        { label: 'Bonuses', value: employee.bonus },
        { label: 'Overtime', value: employee.overtime },
        { label: 'Arrears/Advances', value: employee.salary_in_arrears },
        { label: 'Gratuity / EOSB', value: employee.gratuity_eosb },
        {
          label: 'Unutilised Leave Days Payment',
          value: employee.unutilised_leave_days_payment,
        },
        { label: 'Expense Deductions', value: employee.expenses_deductions },
        { label: 'Other Reimbursements', value: employee.other_reimbursements },
        { label: 'Expense Reimbursements', value: employee.expense_reimbursements },
      ],
      totalLabel: 'TOTAL ADJUSTMENTS',
      totalValue: employee.total_adjustments,
      bgColor: COLORS.greenBg,
      leftColor: COLORS.green,
    })

    drawHLine(y)
    y -= 20

    // ---------- NET EARNINGS ----------
    y = drawBoxLines({
      title: 'Net Earnings',
      lines: [],
      totalLabel: 'NET',
      totalValue: employee.net_salary,
      bgColor: COLORS.greenBg,
      leftColor: COLORS.green,
    })

    // ---------- PAYMENT ADJUSTMENTS + FINAL NET ----------
    const hasPaymentAdjustments =
      isNumber(employee.total_payment_adjustments) && employee.total_payment_adjustments !== 0

    if (hasPaymentAdjustments || isNumber(employee.net_payment)) {
      drawHLine(y)
      y -= 20

      y = drawBoxLines({
        title: 'Payment Adjustments',
        lines: [{ label: 'ESOP Deductions', value: employee.esop_deductions }],
        totalLabel: 'TOTAL PAYMENT ADJUSTMENTS',
        totalValue: employee.total_payment_adjustments,
        bgColor: COLORS.greenBg,
        leftColor: COLORS.green,
      })

      drawHLine(y)
      y -= 20

      y = drawBoxLines({
        title: 'Final Net Payment',
        lines: [],
        totalLabel: 'FINAL NET PAYMENT',
        totalValue: employee.net_payment,
        bgColor: COLORS.blueBg,
        leftColor: COLORS.blue,
      })
    }

    // ---------- WPS / TOTAL TO TRANSFER (optional extra) ----------
    if (isNumber(employee.wps_fees) || isNumber(employee.total_to_transfer)) {
      drawHLine(y)
      y -= 20

      y = drawBoxLines({
        title: 'Transfer Summary',
        lines: [{ label: 'WPS / Bank Fees', value: employee.wps_fees }],
        totalLabel: 'TOTAL TO TRANSFER',
        totalValue: employee.total_to_transfer,
        bgColor: COLORS.greenBg,
        leftColor: COLORS.green,
      })
    }

    drawHLine(y)
    y -= 20

    // ---------- BANK DETAILS ----------
    page.drawText('Bank Details', {
      x: marginX + 8,
      y,
      size: 12,
      font: boldFont,
      color: COLORS.darkGray,
    })
    y -= 20

    const bankBoxTopY = y
    const bankBoxHeight = 50
    const colGap = 12
    const colWidth = (contentWidth - colGap) / 2

    // bank box
    page.drawRectangle({
      x: marginX,
      y: bankBoxTopY - bankBoxHeight,
      width: colWidth,
      height: bankBoxHeight,
      color: COLORS.lightGray,
      borderColor: COLORS.gray,
      borderWidth: 0.5,
    })

    page.drawText('Bank', {
      x: marginX + 14,
      y: bankBoxTopY - 14,
      size: 10,
      font: boldFont,
      color: COLORS.darkGray,
    })

    page.drawText(employee.bank_name || '-', {
      x: marginX + 14,
      y: bankBoxTopY - 30,
      size: 10,
      font,
      color: COLORS.textDark,
    })

    // IBAN box
    const ibanX = marginX + colWidth + colGap
    page.drawRectangle({
      x: ibanX,
      y: bankBoxTopY - bankBoxHeight,
      width: colWidth,
      height: bankBoxHeight,
      color: COLORS.lightGray,
      borderColor: COLORS.gray,
      borderWidth: 0.5,
    })

    page.drawText('IBAN', {
      x: ibanX + 14,
      y: bankBoxTopY - 14,
      size: 10,
      font: boldFont,
      color: COLORS.darkGray,
    })

    page.drawText(employee.iban || '-', {
      x: ibanX + 14,
      y: bankBoxTopY - 30,
      size: 10,
      font,
      color: COLORS.textDark,
    })

    y = bankBoxTopY - bankBoxHeight - 24

    drawHLine(y)
    y -= 18

    const footerText =
      'Generated by the Advontier Business Solutions. For assistance, contact payroll@kounted.ae'
    const footerSize = 9
    const footerWidth = font.widthOfTextAtSize(footerText, footerSize)
    page.drawText(footerText, {
      x: marginX + (contentWidth - footerWidth) / 2,
      y,
      size: footerSize,
      font,
      color: COLORS.textGray,
    })

    const pdfBytes = await pdfDoc.save()
    // @ts-ignore - pdf-lib returns Uint8Array which is compatible with Blob
    const blob = new Blob([pdfBytes], { type: 'application/pdf' })
    console.log(`[generatePayslipPDFStyled] Generated PDF blob size: ${blob.size} bytes`)
    return blob
  } catch (error) {
    console.error('[generatePayslipPDFStyled] Error generating PDF:', error)
    throw error
  }
}
