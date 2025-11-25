'use client'

import { useState } from 'react'
import { Button } from '@/components/react-ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/react-ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/react-ui/dialog'
import { Checkbox } from '@/components/react-ui/checkbox'
import { Textarea } from '@/components/react-ui/textarea'
import { Alert, AlertDescription } from '@/components/react-ui/alert'
import { Badge } from '@/components/react-ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Download, Trash2, Shield, AlertTriangle, FileText, Database } from 'lucide-react'
import Link from 'next/link'

export function GDPRDataRights() {
  const [isExporting, setIsExporting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteReason, setDeleteReason] = useState('')
  const [confirmDeletion, setConfirmDeletion] = useState(false)
  const [acknowledgeLegal, setAcknowledgeLegal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const handleDataExport = async () => {
    try {
      setIsExporting(true)
      
      // First, log the export request
      const response = await fetch('/api/gdpr/data-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request_export' }),
      })

      if (!response.ok) {
        throw new Error('Failed to initiate export')
      }

      // Then download the data
      const downloadResponse = await fetch('/api/gdpr/data-export', {
        method: 'GET',
      })

      if (!downloadResponse.ok) {
        throw new Error('Failed to export data')
      }

      // Create download link
      const blob = await downloadResponse.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `kounted-data-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: 'Data Export Successful',
        description: 'Your data has been downloaded to your device.',
      })

    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: 'Export Failed',
        description: 'Unable to export your data. Please try again or contact support.',
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleAccountDeletion = async () => {
    if (!confirmDeletion || !acknowledgeLegal) {
      toast({
        title: 'Confirmation Required',
        description: 'Please confirm deletion and acknowledge legal obligations.',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsDeleting(true)

      const response = await fetch('/api/gdpr/data-deletion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: deleteReason,
          confirm_deletion: confirmDeletion,
          acknowledge_legal_obligations: acknowledgeLegal,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete account')
      }

      if (result.status === 'retention_required') {
        toast({
          title: 'Partial Deletion Completed',
          description: 'Some data must be retained for legal compliance. Personal data has been anonymized.',
        })
      } else if (result.status === 'deleted') {
        toast({
          title: 'Account Deleted',
          description: 'Your account and data have been successfully deleted.',
        })
        // Redirect to home page after successful deletion
        setTimeout(() => {
          window.location.href = '/'
        }, 3000)
      }

      setShowDeleteDialog(false)

    } catch (error) {
      console.error('Deletion error:', error)
      toast({
        title: 'Deletion Failed',
        description: error instanceof Error ? error.message : 'Unable to delete account. Please contact support.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="h-4 w-4 text-primary" />
        <h2 className="text-xl font-semibold">Your Data Rights</h2>
        <Badge variant="outline">GDPR Compliant</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Data Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-4 w-4 text-zinc-600" />
              Export Your Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-zinc-400">
              Download a complete copy of all personal data we have about you in a structured, 
              machine-readable format.
            </p>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Included Data:</h4>
              <ul className="text-xs text-zinc-400 space-y-1">
                <li>• Personal profile information</li>
                <li>• Business and client data</li>
                <li>• Payroll and financial records</li>
                <li>• File uploads and documents</li>
                <li>• System logs and access records</li>
              </ul>
            </div>

            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Data will be provided in JSON format. Sensitive information like bank details 
                will be partially masked for security.
              </AlertDescription>
            </Alert>

            <Button 
              onClick={handleDataExport} 
              disabled={isExporting}
              className="w-full gap-2"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  Preparing Export...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export My Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Account Deletion */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-red-600" />
              Delete Your Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-zinc-400">
              Permanently delete your account and personal data. This action cannot be undone.
            </p>

            <Alert className="border-yellow-200 bg-zinc-100 dark:bg-yellow-900/20">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-xs text-yellow-800 dark:text-yellow-200">
                Some data may be retained for legal compliance (UAE law requires 7-year retention 
                of financial records). Personal identifiers will be anonymized.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">What will be deleted:</h4>
              <ul className="text-xs text-zinc-400 space-y-1">
                <li>• Personal profile and contact information</li>
                <li>• Draft documents and non-financial records</li>
                <li>• Session logs and usage analytics</li>
                <li>• Marketing preferences and cookies</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">What will be anonymized:</h4>
              <ul className="text-xs text-zinc-400 space-y-1">
                <li>• Completed payroll records (legal requirement)</li>
                <li>• Financial transaction records</li>
                <li>• Compliance and audit logs</li>
              </ul>
            </div>

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="w-full gap-2">
                  <Trash2 className="h-4 w-4" />
                  Request Account Deletion
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    Delete Account
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-sm text-red-800 dark:text-red-200">
                      <strong>Warning:</strong> This action is permanent and cannot be undone. 
                      Make sure to export your data first if you need it.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">
                        Reason for deletion (optional):
                      </label>
                      <Textarea
                        value={deleteReason}
                        onChange={(e) => setDeleteReason(e.target.value)}
                        placeholder="Please let us know why you're deleting your account..."
                        className="mt-1"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="confirm-deletion"
                          checked={confirmDeletion}
                          onCheckedChange={(checked) => setConfirmDeletion(checked === 'indeterminate' ? false : checked)}
                        />
                        <label htmlFor="confirm-deletion" className="text-sm">
                          I understand that this action will permanently delete my account and 
                          cannot be undone.
                        </label>
                      </div>

                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="acknowledge-legal"
                          checked={acknowledgeLegal}
                          onCheckedChange={(checked) => setAcknowledgeLegal(checked === 'indeterminate' ? false : checked)}
                        />
                        <label htmlFor="acknowledge-legal" className="text-sm">
                          I understand that some data may be retained for legal compliance 
                          as described in the{' '}
                          <Link href="/privacy-policy" className="text-primary hover:underline">
                            Privacy Policy
                          </Link>
                          .
                        </label>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowDeleteDialog(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleAccountDeletion}
                        disabled={!confirmDeletion || !acknowledgeLegal || isDeleting}
                        className="flex-1 gap-2"
                      >
                        {isDeleting ? (
                          <>
                            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4" />
                            Delete Account
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* Additional Rights Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-4 w-4 text-green-600" />
            Other Data Rights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-zinc-400">
            Under GDPR and UAE data protection laws, you have additional rights regarding your personal data:
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <h4 className="font-medium text-sm">Right to Rectification</h4>
              <p className="text-xs text-zinc-400">
                Update or correct inaccurate personal information through your account settings.
              </p>
            </div>

            <div className="space-y-1">
              <h4 className="font-medium text-sm">Right to Restrict Processing</h4>
              <p className="text-xs text-zinc-400">
                Limit how we process your data in certain circumstances.
              </p>
            </div>

            <div className="space-y-1">
              <h4 className="font-medium text-sm">Right to Object</h4>
              <p className="text-xs text-zinc-400">
                Object to processing based on legitimate interests or direct marketing.
              </p>
            </div>

            <div className="space-y-1">
              <h4 className="font-medium text-sm">Right to Lodge a Complaint</h4>
              <p className="text-xs text-zinc-400">
                Contact data protection authorities if you believe your rights have been violated.
              </p>
            </div>
          </div>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-sm">
              To exercise any of these rights or if you have questions about data processing, 
              contact our Data Protection Officer at{' '}
              <a href="mailto:support@kounted.ae" className="text-primary hover:underline">
                support@kounted.ae
              </a>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}