'use client'

import StorageManagement from '@/components/admin/StorageManagement'

// Prevent static generation for this page since it requires browser-only APIs
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function StorageManagementPage() {
  return (
    <div className="container mx-auto py-8">
      <StorageManagement />
    </div>
  )
}

