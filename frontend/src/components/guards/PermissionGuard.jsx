import { useAuth } from '../../hooks/useAuth';

/**
 * PermissionGuard — Conditionally renders children based on RBAC permissions.
 *
 * Usage:
 *   <PermissionGuard permission="products:create">
 *     <CreateProductButton />
 *   </PermissionGuard>
 *
 *   <PermissionGuard roles={['admin', 'owner']} fallback={<p>No access</p>}>
 *     <AdminPanel />
 *   </PermissionGuard>
 *
 * Props:
 *   permission  {string}       — Single permission string (e.g. 'products:create')
 *   permissions {string[]}     — Array: user must have ANY of these
 *   roles       {string[]}     — Array: user must have ANY of these roles
 *   fallback    {ReactNode}    — What to render if access denied (default: null)
 *   showDenied  {boolean}      — If true, renders a styled "Access Denied" message as fallback
 */
export default function PermissionGuard({
  permission,
  permissions = [],
  roles = [],
  fallback = null,
  showDenied = false,
  children,
}) {
  const { user, hasPermission, hasRole } = useAuth();

  if (!user) return fallback;

  // Build the list of permissions to check (supports both prop forms)
  const permsToCheck = permission ? [permission, ...permissions] : permissions;

  // Role check
  if (roles.length > 0 && !hasRole(...roles)) {
    return showDenied ? <AccessDenied /> : fallback;
  }

  // Permission check — passes if user has ANY of the listed permissions
  if (permsToCheck.length > 0) {
    const hasAny = permsToCheck.some((p) => hasPermission(p));
    if (!hasAny) {
      return showDenied ? <AccessDenied /> : fallback;
    }
  }

  return children;
}

function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">Access Denied</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        You don't have permission to view this content.
        Contact your administrator to request access.
      </p>
    </div>
  );
}
