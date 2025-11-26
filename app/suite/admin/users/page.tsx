'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/auth-provider'
import { canManageUsers, getRoleName } from '@/lib/utils/roles'
import { Button } from '@/components/react-ui/button'
import { Input } from '@/components/react-ui/input'
import { Label } from '@/components/react-ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/react-ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/react-ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/react-ui/table'
import { AlertCircle, UserPlus, Search, Loader2, RefreshCw, Edit2, Check, X } from 'lucide-react'
import { toast } from 'sonner'

export const dynamic = 'force-dynamic'

interface User {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  profile: {
    full_name: string | null
    role_slug: string | null
    is_active: boolean
  } | null
}

export default function UsersManagementPage() {
  const router = useRouter()
  const { profile, loading: authLoading } = useAuth()
  
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Invite dialog state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('kounted-staff')
  const [inviteFullName, setInviteFullName] = useState('')
  const [inviting, setInviting] = useState(false)

  // Track which user's role is being updated
  const [updatingRoleForUser, setUpdatingRoleForUser] = useState<string | null>(null)

  // Inline name editing state
  const [editingNameForUser, setEditingNameForUser] = useState<string | null>(null)
  const [editingNameValue, setEditingNameValue] = useState('')
  const [updatingName, setUpdatingName] = useState(false)

  // Edit user dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editEmail, setEditEmail] = useState('')
  const [editEmailConfirm, setEditEmailConfirm] = useState('')
  const [editFullName, setEditFullName] = useState('')
  const [editRole, setEditRole] = useState('')
  const [editIsActive, setEditIsActive] = useState(true)
  const [updatingUser, setUpdatingUser] = useState(false)

  // Check permissions
  useEffect(() => {
    if (!authLoading && (!profile || !canManageUsers(profile))) {
      router.push('/suite')
    }
  }, [profile, authLoading, router])

  // Fetch users function (can be called to refresh)
  const fetchUsers = async (showToast = false) => {
    if (showToast) setRefreshing(true)
    try {
      const response = await fetch('/api/admin/users/list')
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      const data = await response.json()
      setUsers(data.users || [])
      setFilteredUsers(data.users || [])
      if (showToast) {
        toast.success('User list refreshed')
      }
    } catch (err) {
      console.error('Error fetching users:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Fetch users on mount
  useEffect(() => {
    if (authLoading || !profile || !canManageUsers(profile)) return
    fetchUsers()
  }, [authLoading, profile])

  // Filter users based on search
  useEffect(() => {
    if (!searchTerm) {
      setFilteredUsers(users)
      return
    }

    const filtered = users.filter(user =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredUsers(filtered)
  }, [searchTerm, users])

  const handleInviteUser = async () => {
    if (!inviteEmail || !inviteRole) return

    setInviting(true)
    const toastId = toast.loading('Sending invitation...')

    try {
      const response = await fetch('/api/admin/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role_slug: inviteRole,
          full_name: inviteFullName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to invite user')
      }

      // Show success toast
      toast.success('User invited successfully! They will receive an email.', { id: toastId })

      // Refresh users list
      await fetchUsers()

      // Close dialog and reset form
      setInviteDialogOpen(false)
      setInviteEmail('')
      setInviteRole('kounted-staff')
      setInviteFullName('')
    } catch (err) {
      console.error('Error inviting user:', err)
      const errorMsg = err instanceof Error ? err.message : 'Failed to invite user'
      toast.error(errorMsg, { id: toastId })
    } finally {
      setInviting(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingRoleForUser(userId)
    const toastId = toast.loading('Updating role...')

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role_slug: newRole }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update role')
      }

      // Update local state optimistically
      setUsers(users.map(user =>
        user.id === userId
          ? {
              ...user,
              profile: user.profile ? { ...user.profile, role_slug: newRole } : null,
            }
          : user
      ))
      
      toast.success('Role updated successfully', { id: toastId })
    } catch (err) {
      console.error('Error updating role:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to update role', { id: toastId })
      // Refresh to get correct state
      await fetchUsers()
    } finally {
      setUpdatingRoleForUser(null)
    }
  }

  const handleToggleStatus = async (userId: string, currentStatus: boolean, userEmail: string) => {
    // Prevent self-deactivation
    if (userId === profile?.id && currentStatus) {
      toast.error('You cannot deactivate your own account')
      return
    }

    const action = currentStatus ? 'deactivate' : 'activate'
    const toastId = toast.loading(`${action === 'activate' ? 'Activating' : 'Deactivating'} user...`)

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || `Failed to ${action} user`)
      }

      // Update local state
      setUsers(users.map(user =>
        user.id === userId
          ? {
              ...user,
              profile: user.profile ? { ...user.profile, is_active: !currentStatus } : null,
            }
          : user
      ))
      
      toast.success(`User ${action}d successfully`, { id: toastId })
    } catch (err) {
      console.error(`Error ${action}ing user:`, err)
      toast.error(err instanceof Error ? err.message : `Failed to ${action} user`, { id: toastId })
      await fetchUsers()
    }
  }

  const handleStartEditName = (user: User) => {
    setEditingNameForUser(user.id)
    setEditingNameValue(user.profile?.full_name || '')
  }

  const handleCancelEditName = () => {
    setEditingNameForUser(null)
    setEditingNameValue('')
  }

  const handleSaveName = async (userId: string) => {
    setUpdatingName(true)
    const toastId = toast.loading('Updating name...')

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: editingNameValue || null }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update name')
      }

      // Update local state
      setUsers(users.map(user =>
        user.id === userId
          ? {
              ...user,
              profile: user.profile ? { ...user.profile, full_name: editingNameValue || null } : null,
            }
          : user
      ))

      toast.success('Name updated successfully', { id: toastId })
      setEditingNameForUser(null)
      setEditingNameValue('')
    } catch (err) {
      console.error('Error updating name:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to update name', { id: toastId })
      await fetchUsers()
    } finally {
      setUpdatingName(false)
    }
  }

  const handleOpenEditDialog = (user: User) => {
    setEditingUser(user)
    setEditEmail(user.email)
    setEditEmailConfirm(user.email)
    setEditFullName(user.profile?.full_name || '')
    setEditRole(user.profile?.role_slug || 'kounted-staff')
    setEditIsActive(user.profile?.is_active ?? true)
    setEditDialogOpen(true)
  }

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false)
    setEditingUser(null)
    setEditEmail('')
    setEditEmailConfirm('')
    setEditFullName('')
    setEditRole('kounted-staff')
    setEditIsActive(true)
  }

  const handleSaveUser = async () => {
    if (!editingUser) return

    // Validate email if changed
    if (editEmail !== editingUser.email) {
      if (editEmail !== editEmailConfirm) {
        toast.error('Email addresses do not match')
        return
      }
      if (!editEmail || !editEmail.includes('@')) {
        toast.error('Please enter a valid email address')
        return
      }
    }

    setUpdatingUser(true)
    const toastId = toast.loading('Updating user...')

    try {
      const updateBody: Record<string, any> = {}

      // Only include fields that changed
      if (editFullName !== (editingUser.profile?.full_name || '')) {
        updateBody.full_name = editFullName || null
      }
      if (editRole !== (editingUser.profile?.role_slug || '')) {
        updateBody.role_slug = editRole
      }
      if (editIsActive !== (editingUser.profile?.is_active ?? true)) {
        updateBody.is_active = editIsActive
      }
      if (editEmail !== editingUser.email) {
        updateBody.email = editEmail
      }

      if (Object.keys(updateBody).length === 0) {
        toast.info('No changes to save', { id: toastId })
        handleCloseEditDialog()
        return
      }

      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateBody),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update user')
      }

      toast.success('User updated successfully', { id: toastId })
      handleCloseEditDialog()
      await fetchUsers()
    } catch (err) {
      console.error('Error updating user:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to update user', { id: toastId })
    } finally {
      setUpdatingUser(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!profile || !canManageUsers(profile)) {
    return null
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">User Management</h1>
            <p className="text-neutral-600">Manage user accounts and permissions</p>
          </div>
          <Button
            variant="outline"
            onClick={() => fetchUsers(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Button onClick={() => setInviteDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite User
        </Button>
      </div>

      <div className="bg-white rounded-lg border">
        <Table>
          <colgroup>
            <col className="w-[200px]" />
            <col className="w-[200px]" />
            <col className="w-[180px]" />
            <col className="w-[100px]" />
            <col className="w-[120px]" />
            <col className="w-[120px]" />
            <col className="w-[100px]" />
          </colgroup>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Sign In</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-neutral-500">
                  {searchTerm ? 'No users match your search' : 'No users found'}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id} className="group">
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    {editingNameForUser === user.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editingNameValue}
                          onChange={(e) => setEditingNameValue(e.target.value)}
                          className="h-8 w-[200px]"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveName(user.id)
                            } else if (e.key === 'Escape') {
                              handleCancelEditName()
                            }
                          }}
                          autoFocus
                          disabled={updatingName}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSaveName(user.id)}
                          disabled={updatingName}
                          className="h-8 w-8 p-0"
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEditName}
                          disabled={updatingName}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="min-w-[100px]">{user.profile?.full_name || '-'}</span>
                        <button
                          onClick={() => handleStartEditName(user)}
                          className="opacity-60 hover:opacity-100 hover:text-blue-600 transition-opacity"
                          title="Edit name"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.profile?.role_slug || ''}
                      onValueChange={(value) => handleRoleChange(user.id, value)}
                      disabled={updatingRoleForUser === user.id}
                    >
                      <SelectTrigger className="w-[180px]">
                        {updatingRoleForUser === user.id ? (
                          <div className="flex items-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </div>
                        ) : (
                          <SelectValue placeholder="Select role" />
                        )}
                      </SelectTrigger>
                      <SelectContent className=" bg-white">
                        <SelectItem value="kounted-superadmin">Super Admin</SelectItem>
                        <SelectItem value="kounted-admin">Admin</SelectItem>
                        <SelectItem value="kounted-staff">Staff</SelectItem>
                        <SelectItem value="client-admin">Client Admin</SelectItem>
                        <SelectItem value="client-standard">Client User</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleToggleStatus(user.id, user.profile?.is_active ?? false, user.email)}
                      className={`px-2 py-1 rounded-full text-xs cursor-pointer hover:opacity-80 transition-opacity ${
                        user.profile?.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                      title={`Click to ${user.profile?.is_active ? 'deactivate' : 'activate'}`}
                    >
                      {user.profile?.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </TableCell>
                  <TableCell>
                    {user.last_sign_in_at
                      ? new Date(user.last_sign_in_at).toLocaleDateString()
                      : 'Never'}
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEditDialog(user)}
                      className="h-8"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Invite User Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite New User</DialogTitle>
            <DialogDescription>
              Send an invitation email to a new user. They will receive an email to set up their account.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name (Optional)</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={inviteFullName}
                onChange={(e) => setInviteFullName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className=" bg-white">
                  <SelectItem value="kounted-superadmin">Super Admin</SelectItem>
                  <SelectItem value="kounted-admin">Admin</SelectItem>
                  <SelectItem value="kounted-staff">Staff</SelectItem>
                  <SelectItem value="client-admin">Client Admin</SelectItem>
                  <SelectItem value="client-standard">Client User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setInviteDialogOpen(false)}
              disabled={inviting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInviteUser}
              disabled={inviting || !inviteEmail || !inviteRole}
            >
              {inviting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Inviting...
                </>
              ) : (
                'Send Invitation'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information. Changes will be saved immediately.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email Address</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="user@example.com"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                disabled={updatingUser}
              />
            </div>

            {editEmail !== editingUser?.email && (
              <div className="space-y-2">
                <Label htmlFor="edit-email-confirm">Confirm Email Address</Label>
                <Input
                  id="edit-email-confirm"
                  type="email"
                  placeholder="user@example.com"
                  value={editEmailConfirm}
                  onChange={(e) => setEditEmailConfirm(e.target.value)}
                  disabled={updatingUser}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-fullName">Full Name</Label>
              <Input
                id="edit-fullName"
                type="text"
                placeholder="John Doe"
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                disabled={updatingUser}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select value={editRole} onValueChange={setEditRole} disabled={updatingUser}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="kounted-superadmin">Super Admin</SelectItem>
                  <SelectItem value="kounted-admin">Admin</SelectItem>
                  <SelectItem value="kounted-staff">Staff</SelectItem>
                  <SelectItem value="client-admin">Client Admin</SelectItem>
                  <SelectItem value="client-standard">Client User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select 
                value={editIsActive ? 'active' : 'inactive'} 
                onValueChange={(value) => setEditIsActive(value === 'active')}
                disabled={updatingUser || (editingUser?.id === profile?.id && editIsActive)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              {editingUser?.id === profile?.id && editIsActive && (
                <p className="text-xs text-amber-600 mt-1">
                  You cannot deactivate your own account
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseEditDialog}
              disabled={updatingUser}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveUser}
              disabled={updatingUser}
            >
              {updatingUser ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

