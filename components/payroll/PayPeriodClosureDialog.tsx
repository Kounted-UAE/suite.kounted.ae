'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/react-ui/dialog'
import { Button } from '@/components/react-ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/react-ui/card'
import { Badge } from '@/components/react-ui/badge'
import { Checkbox } from '@/components/react-ui/checkbox'
import { Textarea } from '@/components/react-ui/textarea'
import { Label } from '@/components/react-ui/label'
import { Separator } from '@/components/react-ui/separator'
import { AlertTriangle, Calendar, Users, DollarSign, Clock } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import type { UniquePayPeriod, PayPeriodClosureSummary } from '@/lib/types/payrollIngest'

interface PayPeriodClosureDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (summary: PayPeriodClosureSummary) => void
}

export default function PayPeriodClosureDialog({ open, onOpenChange, onSuccess }: PayPeriodClosureDialogProps) {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [periods, setPeriods] = useState<UniquePayPeriod[]>([])
  const [selectedPeriods, setSelectedPeriods] = useState<Set<string>>(new Set())
  const [notes, setNotes] = useState('')
  const [step, setStep] = useState<'select' | 'confirm' | 'processing'>('select')

  // Fetch active pay periods
  useEffect(() => {
    if (open) {
      fetchActivePeriods()
    }
  }, [open])

  const fetchActivePeriods = async () => {
    try {
      setFetching(true)
      const response = await fetch('/api/admin/pay-periods/list-active')
      if (!response.ok) {
        throw new Error('Failed to fetch active pay periods')
      }
      const data = await response.json()
      setPeriods(data.periods || [])
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch active pay periods',
        variant: 'destructive'
      })
    } finally {
      setFetching(false)
    }
  }

  const handlePeriodToggle = (periodEndDate: string) => {
    const newSelected = new Set(selectedPeriods)
    if (newSelected.has(periodEndDate)) {
      newSelected.delete(periodEndDate)
    } else {
      newSelected.add(periodEndDate)
    }
    setSelectedPeriods(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedPeriods.size === periods.length) {
      setSelectedPeriods(new Set())
    } else {
      setSelectedPeriods(new Set(periods.map(p => p.pay_period_to)))
    }
  }

  const getSelectedPeriods = () => {
    return periods.filter(p => selectedPeriods.has(p.pay_period_to))
  }

  const getTotalRecords = () => {
    return getSelectedPeriods().reduce((sum, p) => sum + p.record_count, 0)
  }

  const getTotalAmount = () => {
    return getSelectedPeriods().reduce((sum, p) => sum + p.total_amount, 0)
  }

  const handleClose = async () => {
    if (selectedPeriods.size === 0) {
      toast({
        title: 'No periods selected',
        description: 'Please select at least one pay period to close',
        variant: 'destructive'
      })
      return
    }

    try {
      setStep('processing')
      setLoading(true)

      const response = await fetch('/api/admin/pay-periods/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period_end_dates: Array.from(selectedPeriods),
          notes: notes.trim() || undefined
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to close pay periods')
      }

      const result = await response.json()
      
      toast({
        title: 'Pay periods closed successfully',
        description: `Moved ${result.summary.total_records_moved} records to historical storage`,
        variant: 'default'
      })

      if (onSuccess) {
        onSuccess(result.summary)
      }

      // Reset state
      setSelectedPeriods(new Set())
      setNotes('')
      setStep('select')
      onOpenChange(false)

    } catch (error: any) {
      setStep('select')
      toast({
        title: 'Error closing pay periods',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number, currency: string = 'AED') => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Close Pay Periods
          </DialogTitle>
          <DialogDescription>
            Move completed pay periods from active records to historical storage. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {step === 'select' && (
          <>
            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto space-y-6 px-1">
            {/* Warning Card */}
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-orange-800">Important Notice</p>
                    <p className="text-sm text-orange-700">
                      Closing pay periods will permanently move records to historical storage. 
                      Ensure all payslips have been generated and sent before proceeding.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Period Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Select Pay Periods to Close</h3>
                {periods.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {selectedPeriods.size === periods.length ? 'Deselect All' : 'Select All'}
                  </Button>
                )}
              </div>

              {fetching ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading active pay periods...</p>
                </div>
              ) : periods.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No active pay periods found</p>
                </div>
              ) : (
                <div className="max-h-[40vh] overflow-y-auto">
                  <div className="grid gap-3 pr-2">
                    {periods.map((period) => (
                      <Card
                        key={period.pay_period_to}
                        className={`cursor-pointer transition-colors ${
                          selectedPeriods.has(period.pay_period_to)
                            ? 'border-blue-300 bg-blue-50'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handlePeriodToggle(period.pay_period_to)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={selectedPeriods.has(period.pay_period_to)}
                                onChange={() => handlePeriodToggle(period.pay_period_to)}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div>
                                <div className="font-semibold">
                                  Period ending: {formatDate(period.pay_period_to)}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {period.employers.slice(0, 2).join(', ')}
                                  {period.employers.length > 2 && ` +${period.employers.length - 2} more`}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                <span>{period.record_count}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                <span>{formatCurrency(period.total_amount)}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>

              {/* Summary - Fixed at bottom of scrollable area */}
              {selectedPeriods.size > 0 && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                  <h4 className="font-semibold mb-3">Closure Summary</h4>
                  <div className="grid grid-cols-3 gap-4 text-center mb-4">
                    <div>
                      <div className="text-xl font-bold text-blue-600">{selectedPeriods.size}</div>
                      <div className="text-xs text-muted-foreground">Pay Periods</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-green-600">{getTotalRecords()}</div>
                      <div className="text-xs text-muted-foreground">Total Records</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-purple-600">
                        {formatCurrency(getTotalAmount())}
                      </div>
                      <div className="text-xs text-muted-foreground">Total Amount</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-sm">Closure Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Enter any notes about this closure..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      className="resize-none text-sm"
                    />
                  </div>
                </div>
              )}

            </div>

            {/* Sticky footer with action buttons */}
            <div className="flex-shrink-0 border-t pt-6 mt-6 bg-white">
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleClose}
                  disabled={selectedPeriods.size === 0 || loading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {loading ? 'Processing...' : `Close ${selectedPeriods.size} Period${selectedPeriods.size !== 1 ? 's' : ''}`}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 'processing' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center py-8">
              <div className="flex items-center justify-center gap-3">
                <Clock className="h-6 w-6 animate-spin" />
                <p className="text-lg">Processing pay period closure...</p>
              </div>
              <p className="text-muted-foreground mt-2">
                Moving records to historical storage. Please wait...
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

