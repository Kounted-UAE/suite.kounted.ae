# User Roles, RLS Policies & Admin Interface Implementation

## ✅ Implementation Complete

This document describes the comprehensive role-based access control (RBAC) system that has been implemented.

## What Was Implemented

### 1. Role System Foundation ✅

**Files Created:**
- `lib/types/roles.ts` - Role type definitions and permissions matrix
- `lib/utils/roles.ts` - Role helper functions

**Roles Defined:**
- `kounted-superadmin` - Full system access
- `kounted-admin` - Admin access (manage users, payroll, storage)
- `kounted-staff` - Staff access (payroll processing, view data)
- `client-admin` - Client administrator
- `client-standard` - Standard client user

**Helper Functions:**
- `hasRole()` - Check if user has specific role(s)
- `isAdmin()` - Check if user is admin or superadmin
- `isSuperAdmin()` - Check if user is superadmin
- `isKountedStaff()` - Check if user is any Kounted staff
- `canManagePayroll()` - Check payroll management permission
- `canManageUsers()` - Check user management permission
- `canManageStorage()` - Check storage management permission
- `canViewAllData()` - Check data viewing permission
- `canManageRoles()` - Check role assignment permission
- `getRoleName()` - Get human-readable role name

### 2. Server Client Architecture ✅

**File Updated:** `lib/supabase/server.ts`

**Functions:**
- `getSupabaseServerClient()` - User-level client (respects RLS based on user's role)
- `getSupabaseAdminClient()` - Admin-level client (bypasses RLS, only for verified operations)
- `getSupabaseWithUser()` - Get client with authenticated user profile
- `getSupabaseServiceClient` - Deprecated, now alias to `getSupabaseServerClient()`

**Key Changes:**
- Separated user-level and admin-level clients
- Admin client uses `SUPABASE_SERVICE_ROLE_KEY` environment variable
- User client respects RLS policies
- Added user context helper that fetches profile automatically

### 3. RLS Policies ✅

**Files Created:**
- `scripts/rls-storage-policies.sql` - Storage bucket policies
- `scripts/rls-payroll-policies.sql` - Payroll table policies

**Storage Policies:**
- Kounted staff can upload/update payroll files
- Kounted admins can delete payroll files
- All authenticated users can read payroll files

**Payroll Table Policies:**
- Admins have full CRUD access to payroll_excel_imports
- Staff can insert and update payroll records
- All Kounted users can view payroll records
- Similar policies for employees and employers tables

**⚠️ Important:** These SQL scripts must be run in Supabase SQL Editor to apply the policies.

### 4. Updated Payslip Generation ✅

**File Updated:** `app/api/admin/payslips/generate/route.ts`

**Changes:**
- Verifies user authentication before processing
- Checks if user has `canManagePayroll` permission
- Returns 401 if not authenticated
- Returns 403 if user lacks permission
- Uses admin client only after verifying user permissions
- Falls back to user client if admin client unavailable

### 5. User Management API ✅

**Files Created:**
- `app/api/admin/users/list/route.ts` - List all users
- `app/api/admin/users/invite/route.ts` - Invite new user
- `app/api/admin/users/[id]/route.ts` - Get/update/delete user

**Features:**
- List all users with their profiles and roles
- Invite new users via email with role assignment
- Update user roles and details
- Delete users (with self-deletion prevention)
- All endpoints check `canManageUsers` permission

### 6. Admin User Management UI ✅

**File Created:** `app/suite/admin/users/page.tsx`

**Features:**
- List all users in a table
- Search/filter users by email or name
- View user status, role, last sign-in
- Quick role assignment dropdown
- Invite new users via dialog
- Real-time role updates
- Responsive design with loading states
- Error handling and user feedback

### 7. Middleware Protection ✅

**File Updated:** `middleware.ts`

**Changes:**
- Enforces role-based access for `/suite/admin/*` routes
- Only admins and superadmins can access admin pages
- Redirects unauthorized users with error message
- Logs unauthorized access attempts
- Maintains existing auth checks for other routes

## Environment Variables Required

Add to your `.env.local` file:

```bash
# Existing variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# NEW: Required for admin operations
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: For invite emails
NEXT_PUBLIC_SITE_URL=https://suite.kounted.ae
```

## Deployment Steps

### Step 1: Apply RLS Policies to Database

Run these SQL scripts in your Supabase SQL Editor (in order):

1. **Storage Policies:**
   ```sql
   -- Copy contents of scripts/rls-storage-policies.sql
   -- Run in Supabase SQL Editor
   ```

2. **Payroll Policies:**
   ```sql
   -- Copy contents of scripts/rls-payroll-policies.sql
   -- Run in Supabase SQL Editor
   ```

### Step 2: Set Environment Variables

In Vercel/your deployment platform:
1. Add `SUPABASE_SERVICE_ROLE_KEY` to environment variables
2. Redeploy the application

### Step 3: Assign User Roles

After deployment, you need to manually assign roles to existing users in Supabase:

```sql
-- Update your user to be an admin
UPDATE public_user_profiles
SET role_slug = 'kounted-admin'
WHERE email = 'your-email@example.com';
```

### Step 4: Test the System

1. **Test Admin Access:**
   - Navigate to `/suite/admin/users`
   - Verify you can see the user management page

2. **Test Payslip Generation:**
   - Go to `/suite/payroll`
   - Generate payslips for selected employees
   - Should work without RLS errors

3. **Test User Invitation:**
   - Use the "Invite User" button
   - Assign a role and send invitation
   - New user should receive email

4. **Test Permission Enforcement:**
   - Create a test user with `client-standard` role
   - Try to access `/suite/admin/*`
   - Should be redirected with error

## Testing Checklist

### ✅ Authentication Flow
- [ ] Users can log in with OTP
- [ ] Password reset flow works correctly
- [ ] Users are redirected to appropriate pages based on role

### ✅ Payslip Generation
- [ ] Admin users can generate payslips
- [ ] Staff users can generate payslips
- [ ] Payslips are saved to storage successfully
- [ ] Database records are updated correctly
- [ ] No RLS policy violations

### ✅ User Management
- [ ] Admins can view user list
- [ ] Admins can invite new users
- [ ] Admins can change user roles
- [ ] Admins can update user details
- [ ] Admins cannot delete themselves
- [ ] Non-admin users cannot access user management

### ✅ Permission Enforcement
- [ ] Non-admin users cannot access `/suite/admin/*`
- [ ] Staff users can perform payroll operations
- [ ] Client users have appropriate restricted access
- [ ] Middleware blocks unauthorized access

### ✅ Storage Access
- [ ] Kounted staff can upload files to Payroll bucket
- [ ] All authenticated users can read payroll files
- [ ] Only admins can delete files

## Architecture Benefits

### 1. Security
- **Database-level security:** RLS policies enforced at database level
- **No bypass risk:** Service key only used after permission verification
- **Principle of least privilege:** Users only get access they need

### 2. Scalability
- **Easy role addition:** Add new roles to `ROLE_PERMISSIONS` object
- **Flexible permissions:** Granular control over what each role can do
- **Centralized logic:** Role checks in one place

### 3. Maintainability
- **Clear separation:** User client vs admin client
- **Type safety:** TypeScript interfaces for roles and profiles
- **Documented:** Helper functions with clear names

### 4. Audit Trail
- **Logging:** Unauthorized access attempts logged
- **User context:** All operations tied to authenticated user
- **Traceability:** Can track who did what

## Common Issues & Solutions

### Issue: Payslip generation fails with RLS error

**Solution:** 
1. Ensure RLS policies are applied (run SQL scripts)
2. Verify `SUPABASE_SERVICE_ROLE_KEY` is set in environment
3. Check user has `kounted-staff`, `kounted-admin`, or `kounted-superadmin` role

### Issue: Cannot access user management page

**Solution:**
1. Verify your user profile has `kounted-admin` or `kounted-superadmin` role
2. Check middleware is not blocking the route
3. Clear browser cache and try again

### Issue: Invited users not receiving emails

**Solution:**
1. Check Supabase email settings
2. Verify SMTP is configured in Supabase
3. Check `NEXT_PUBLIC_SITE_URL` is set correctly

### Issue: "Admin client not available" in logs

**Solution:**
1. Add `SUPABASE_SERVICE_ROLE_KEY` to environment variables
2. Redeploy the application
3. System will fall back to user client (may hit RLS policies)

## Next Steps

### Optional Enhancements

1. **Audit Logging:**
   - Create audit log table
   - Track all role changes
   - Log sensitive operations

2. **Role Hierarchy:**
   - Implement role inheritance
   - Add custom permissions per user
   - Create role templates

3. **UI Improvements:**
   - Add user activity dashboard
   - Show audit trail in UI
   - Add bulk user operations

4. **Advanced Permissions:**
   - Client-specific data access
   - Department-based permissions
   - Time-based access restrictions

## Support

For issues or questions:
1. Check this documentation first
2. Review Supabase RLS policy documentation
3. Check application logs in Vercel
4. Contact system administrator

---

**Implementation Date:** November 25, 2025
**Status:** ✅ Complete and Ready for Deployment

