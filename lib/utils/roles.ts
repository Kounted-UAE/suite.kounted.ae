// lib/utils/roles.ts
import { VAuthenticatedProfile, ROLE_PERMISSIONS, UserRole } from '@/lib/types/roles'

/**
 * Check if a user profile has any of the required roles
 */
export function hasRole(profile: VAuthenticatedProfile | null, requiredRoles: string[]): boolean {
  if (!profile || !profile.role_slug) {
    return false
  }

  return requiredRoles.some(role => profile.role_slug === role || profile.role_slug?.startsWith(`${role}-`))
}

/**
 * Check if user is a Kounted admin (superadmin or admin)
 */
export function isAdmin(profile: VAuthenticatedProfile | null): boolean {
  return hasRole(profile, ['kounted-superadmin', 'kounted-admin'])
}

/**
 * Check if user is a Kounted superadmin
 */
export function isSuperAdmin(profile: VAuthenticatedProfile | null): boolean {
  return hasRole(profile, ['kounted-superadmin'])
}

/**
 * Check if user is any Kounted staff (superadmin, admin, or staff)
 */
export function isKountedStaff(profile: VAuthenticatedProfile | null): boolean {
  return hasRole(profile, ['kounted-superadmin', 'kounted-admin', 'kounted-staff'])
}

/**
 * Check if user can manage payroll operations
 */
export function canManagePayroll(profile: VAuthenticatedProfile | null): boolean {
  if (!profile || !profile.role_slug) {
    return false
  }

  const permissions = ROLE_PERMISSIONS[profile.role_slug as UserRole]
  return permissions?.canManagePayroll ?? false
}

/**
 * Check if user can manage other users
 */
export function canManageUsers(profile: VAuthenticatedProfile | null): boolean {
  if (!profile || !profile.role_slug) {
    return false
  }

  const permissions = ROLE_PERMISSIONS[profile.role_slug as UserRole]
  return permissions?.canManageUsers ?? false
}

/**
 * Check if user can manage storage/files
 */
export function canManageStorage(profile: VAuthenticatedProfile | null): boolean {
  if (!profile || !profile.role_slug) {
    return false
  }

  const permissions = ROLE_PERMISSIONS[profile.role_slug as UserRole]
  return permissions?.canManageStorage ?? false
}

/**
 * Check if user can view all data across the system
 */
export function canViewAllData(profile: VAuthenticatedProfile | null): boolean {
  if (!profile || !profile.role_slug) {
    return false
  }

  const permissions = ROLE_PERMISSIONS[profile.role_slug as UserRole]
  return permissions?.canViewAllData ?? false
}

/**
 * Check if user can assign/modify roles
 */
export function canManageRoles(profile: VAuthenticatedProfile | null): boolean {
  if (!profile || !profile.role_slug) {
    return false
  }

  const permissions = ROLE_PERMISSIONS[profile.role_slug as UserRole]
  return permissions?.canManageRoles ?? false
}

/**
 * Get a human-readable role name
 */
export function getRoleName(roleSlug: string | null): string {
  if (!roleSlug) return 'No Role'

  const roleMap: Record<string, string> = {
    'kounted-superadmin': 'Super Admin',
    'kounted-admin': 'Admin',
    'kounted-staff': 'Staff',
    'client-admin': 'Client Admin',
    'client-standard': 'Client User',
  }

  return roleMap[roleSlug] || roleSlug
}

