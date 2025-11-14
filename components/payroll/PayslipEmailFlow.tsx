'use client'

import { useState } from 'react'
import { Button } from '@/components/react-ui/button'
import { toast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@/components/react-ui/dialog'
import type { PayslipRow } from './PayslipFiltersAndTable'
import { generatePayslipFilename } from '@/lib/utils/pdf/payslipNaming'

const SUPABASE_PUBLIC_URL = 'https://tyznabdlwpgldgxktlzo.supabase.co/storage/v1/object/public/Payroll'

interface PayslipEmailFlowProps {
  rows: PayslipRow[]
  selected: Set<string>
  onBack: () => void
  onRefresh?: () => void
}

export function PayslipEmailFlow({
  rows,
  selected,
  onBack,
  onRefresh,
}: PayslipEmailFlowProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [sendMode, setSendMode] = useState<'test' | 'reviewer' | 'live' | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)

  const sendEmails = async (mode: 'test' | 'reviewer' | 'live') => {
    setIsSending(true)
    const filtered = rows.filter(r => selected.has(r.batch_id))
    const successLog: string[] = []
    const errorLog: string[] = []
    
    setProgress({ current: 0, total: filtered.length })

    for (let i = 0; i < filtered.length; i++) {
      const row = filtered[i]
      setProgress({ current: i, total: filtered.length })
      const rawTo =
        mode === 'test'
          ? 'payroll@kounted.ae'
          : mode === 'reviewer'
            ? row.reviewer_email
            : row.email_id

      const filename = generatePayslipFilename(row.employee_name || 'unknown', row.payslip_token)
      const url = row.payslip_url && row.payslip_url.startsWith('http')
        ? row.payslip_url
        : `${SUPABASE_PUBLIC_URL}/${filename}`

      if (!rawTo || !row.payslip_token) {
        errorLog.push(`${row.employee_name}: Missing ${!rawTo ? 'email' : 'payslip token'}`)
        toast({
          title: `Skipping ${row.employee_name}`,
          description: !rawTo ? 'Missing email address' : 'Missing payslip token',
          variant: 'destructive',
        })
        continue
      }

      // Support multiple recipients separated by "," or ";"
      const toList = Array.isArray(rawTo)
        ? rawTo
        : String(rawTo)
            .split(/[;,]/)
            .map(e => e.trim())
            .filter(Boolean)

      try {
        const res = await fetch('/api/send-payslip-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: toList.length === 1 ? toList[0] : toList,
            name: row.employee_name,
            url,
            batch_id: row.batch_id,
          }),
        })

        if (res.ok) {
          try {
            const data = await res.json()
            const resendEmailId = data.resendEmailId
            
            if (!resendEmailId) {
              // Warning: Email accepted but Resend ID not returned
              const warningMsg = data.warning || 'Email accepted but Resend ID not returned - may not appear in Resend logs'
              successLog.push(`${row.employee_name} → ${toList.join(', ')} ⚠️`)
              toast({
                title: `Sent (with warning): ${row.employee_name}`,
                description: warningMsg,
                variant: 'default',
              })
            } else {
              successLog.push(`${row.employee_name} → ${toList.join(', ')}`)
            }
          } catch (parseError) {
            // Response is OK but not JSON - still count as success
            successLog.push(`${row.employee_name} → ${toList.join(', ')}`)
          }
        } else {
          // Try to parse error response
          let errorMsg = 'Unknown error'
          try {
            const errorData = await res.json()
            errorMsg = errorData.error || errorData.message || `HTTP ${res.status}`
            if (errorData.details) {
              errorMsg += `: ${JSON.stringify(errorData.details)}`
            }
          } catch {
            errorMsg = await res.text() || `HTTP ${res.status}`
          }
          
          errorLog.push(`${row.employee_name} → ${toList.join(', ')}: ${errorMsg}`)
          toast({
            title: `Failed to send: ${row.employee_name}`,
            description: errorMsg,
            variant: 'destructive',
          })
        }
      } catch (e: any) {
        const msg = e?.message || 'Network error'
        errorLog.push(`${row.employee_name} → ${toList.join(', ')}: ${msg}`)
        toast({ 
          title: `Failed to send: ${row.employee_name}`, 
          description: msg, 
          variant: 'destructive' 
        })
      }
    }

    setIsSending(false)
    setProgress({ current: filtered.length, total: filtered.length })

    if (successLog.length) {
      toast({
        title: 'Emails sent',
        description: `${successLog.length} of ${filtered.length} emails delivered successfully.`,
        action: (
          <Button
            variant="default"
            size="sm"
            onClick={() =>
              navigator.clipboard.writeText(successLog.join('\n')).then(() =>
                toast({ title: 'Copied to clipboard' })
              )
            }
          >
            Copy Log
          </Button>
        ),
      })
      // Refresh data to show updated "Last Sent" times
      onRefresh?.()
    }

    if (errorLog.length) {
      toast({
        title: 'Some emails failed',
        description: `${errorLog.length} failed. Click to copy error log.`,
        variant: 'destructive',
        action: (
          <Button
            variant="destructive"
            size="sm"
            onClick={() =>
              navigator.clipboard.writeText(errorLog.join('\n')).then(() =>
                toast({ title: 'Error log copied' })
              )
            }
          >
            Copy Errors
          </Button>
        ),
      })
    }
  }

  const selectedRows = rows.filter(r => selected.has(r.batch_id))

  return (
    <div className="space-y-4">
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payslip Emails</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-cyan-600 space-y-2 max-h-[300px] overflow-auto">
            {selectedRows.map(r => {
              const to =
                sendMode === 'test' ? 'payroll@kounted.ae' :
                  sendMode === 'reviewer' ? r.reviewer_email :
                    r.email_id

              return (
                <div key={r.batch_id}>
                  <strong>{r.employee_name}</strong> → {to || <em>Missing Email</em>}
                </div>
              )
            })}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={isSending}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!sendMode) return
                await sendEmails(sendMode)
                setConfirmOpen(false)
                onBack()
              }}
              disabled={isSending}
            >
              {isSending ? 'Sending…' : 'Confirm Send'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p className="text-cyan-600 text-sm">
        Send payslips for <strong>{selectedRows.length}</strong> selected employees.
      </p>
      
      {/* Progress indicator */}
      {progress && isSending && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-900">
              Sending emails... {progress.current} / {progress.total}
            </span>
            <span className="text-sm text-green-700">
              {Math.round((progress.current / progress.total) * 100)}%
            </span>
          </div>
          <div className="w-full bg-green-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}
      
      <div className="flex gap-4 mt-4">
        <Button variant="outline" onClick={() => { setSendMode('test'); setConfirmOpen(true) }} disabled={isSending}>
          Send to Test Email
        </Button>
        <Button variant="outline" onClick={() => { setSendMode('reviewer'); setConfirmOpen(true) }} disabled={isSending}>
          Send to Reviewer Email
        </Button>
        <Button variant="default" onClick={() => { setSendMode('live'); setConfirmOpen(true) }} disabled={isSending}>
          Send to Live Email
        </Button>
        <Button variant="ghost" onClick={onBack} disabled={isSending}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
