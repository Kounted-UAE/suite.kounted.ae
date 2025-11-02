'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/react-ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/react-ui/card'
import { Badge } from '@/components/react-ui/badge'
import { Calendar, Archive, Clock, TrendingDown } from 'lucide-react'
import PayPeriodClosureDialog from '@/components/payroll/PayPeriodClosureDialog'
import { toast } from '@/hooks/use-toast'
import type { PayPeriodClosureSummary } from '@/lib/types/payrollIngest'

export default function PayPeriodManagementPage() {
  const [closureDialogOpen, setClosureDialogOpen] = useState(false)
  const [recentClosures, setRecentClosures] = useState<PayPeriodClosureSummary[]>([])

  const handleClosureSuccess = useCallback((summary: PayPeriodClosureSummary) => {
    setRecentClosures(prev => [summary, ...prev.slice(0, 4)]) // Keep last 5 closures
    toast({
      title: 'Pay periods closed successfully',
      description: `${summary.total_records_moved} records moved to historical storage`,
      variant: 'default'
    })
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pay Period Management</h1>
        <p className="text-muted-foreground">
          Manage active pay periods and close completed periods for historical storage.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Close Pay Periods Card */}
        <Card className="border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-orange-600" />
              Close Pay Periods
            </CardTitle>
            <CardDescription>
              Move completed pay periods to historical storage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Close pay periods that have been fully processed and no longer need to be active. 
              This action moves records to historical storage.
            </p>
            <Button 
              onClick={() => setClosureDialogOpen(true)}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              <Archive className="h-4 w-4 mr-2" />
              Close Pay Periods
            </Button>
          </CardContent>
        </Card>

        {/* View Active Periods Card */}
        <Card className="border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Active Pay Periods
            </CardTitle>
            <CardDescription>
              View and manage currently active pay periods
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              View all currently active pay periods, including record counts and amounts.
            </p>
            <Button 
              variant="outline" 
              className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
              onClick={() => {
                // Navigate to payroll management page
                window.location.href = '/suite/payroll'
              }}
            >
              <Calendar className="h-4 w-4 mr-2" />
              View Active Periods
            </Button>
          </CardContent>
        </Card>

        {/* View Historical Data Card */}
        <Card className="border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" />
              Historical Data
            </CardTitle>
            <CardDescription>
              Access closed pay period records
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              View and search through historical pay period records that have been closed.
            </p>
            <Button 
              variant="outline" 
              className="w-full border-green-200 text-green-700 hover:bg-green-50"
              onClick={() => {
                toast({
                  title: 'Coming Soon',
                  description: 'Historical data viewer will be available in the next update',
                  variant: 'default'
                })
              }}
            >
              <Clock className="h-4 w-4 mr-2" />
              View History
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Closures */}
      {recentClosures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Recent Closures
            </CardTitle>
            <CardDescription>
              Recently closed pay periods in this session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentClosures.map((closure) => (
                <div
                  key={closure.closure_batch_id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-gray-50"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{closure.period_end_dates.length} periods</Badge>
                      <span className="text-sm font-medium">
                        {closure.total_records_moved} records moved
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Closed at {formatDate(closure.closed_at)}
                    </p>
                    {closure.notes && (
                      <p className="text-sm text-muted-foreground italic">
                        "{closure.notes}"
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono text-muted-foreground">
                      Batch: {closure.closure_batch_id.slice(0, 8)}...
                    </div>
                    <div className="text-xs text-green-600 font-medium">
                      Completed
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <PayPeriodClosureDialog
        open={closureDialogOpen}
        onOpenChange={setClosureDialogOpen}
        onSuccess={handleClosureSuccess}
      />
    </div>
  )
}

