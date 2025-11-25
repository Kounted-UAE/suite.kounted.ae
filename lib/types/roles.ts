// lib/types/roles.ts
export interface VAuthenticatedProfile {
  id: string
  auth_user_id: string
  email: string | null
  full_name: string | null
  role_slug: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type UserRole =
  | 'kounted-superadmin'
  | 'kounted-admin'
  | 'kounted-staff'
  | 'client-admin'
  | 'client-standard'

export const ROLE_PERMISSIONS = {
  'kounted-superadmin': {
    canManageUsers: true,
    canManagePayroll: true,
    canManageStorage: true,
    canViewAllData: true,
    canManageRoles: true,
  },
  'kounted-admin': {
    canManageUsers: true,
    canManagePayroll: true,
    canManageStorage: true,
    canViewAllData: true,
    canManageRoles: false,
  },
  'kounted-staff': {
    canManageUsers: false,
    canManagePayroll: true,
    canManageStorage: false,
    canViewAllData: true,
    canManageRoles: false,
  },
  'client-admin': {
    canManageUsers: false,
    canManagePayroll: false,
    canManageStorage: false,
    canViewAllData: false,
    canManageRoles: false,
  },
  'client-standard': {
    canManageUsers: false,
    canManagePayroll: false,
    canManageStorage: false,
    canViewAllData: false,
    canManageRoles: false,
  },
} as const

