/**
 * CoreInventory — Role-Based Access Control (RBAC) Permission System
 *
 * Permission string format: 'resource:action'
 * Example: 'products:create', 'purchase_orders:approve'
 *
 * Role hierarchy (higher level = more access):
 *   owner (5) > admin (4) > manager (3) > warehouse_staff (2) > viewer (1)
 */

// ─── All Permission Strings ────────────────────────────────────────────────────

export const PERMISSIONS = {
  // Users
  USERS_CREATE: 'users:create',
  USERS_READ: 'users:read',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  USERS_MANAGE_PERMISSIONS: 'users:manage_permissions',

  // Products
  PRODUCTS_CREATE: 'products:create',
  PRODUCTS_READ: 'products:read',
  PRODUCTS_UPDATE: 'products:update',
  PRODUCTS_DELETE: 'products:delete',
  PRODUCTS_BULK_UPLOAD: 'products:bulk_upload',

  // Categories
  CATEGORIES_CREATE: 'categories:create',
  CATEGORIES_READ: 'categories:read',
  CATEGORIES_UPDATE: 'categories:update',
  CATEGORIES_DELETE: 'categories:delete',

  // Warehouses
  WAREHOUSES_CREATE: 'warehouses:create',
  WAREHOUSES_READ: 'warehouses:read',
  WAREHOUSES_UPDATE: 'warehouses:update',
  WAREHOUSES_DELETE: 'warehouses:delete',
  WAREHOUSES_MANAGE_LOCATIONS: 'warehouses:manage_locations',

  // Suppliers
  SUPPLIERS_CREATE: 'suppliers:create',
  SUPPLIERS_READ: 'suppliers:read',
  SUPPLIERS_UPDATE: 'suppliers:update',
  SUPPLIERS_DELETE: 'suppliers:delete',

  // Customers
  CUSTOMERS_CREATE: 'customers:create',
  CUSTOMERS_READ: 'customers:read',
  CUSTOMERS_UPDATE: 'customers:update',
  CUSTOMERS_DELETE: 'customers:delete',

  // Purchase Orders
  PO_CREATE: 'purchase_orders:create',
  PO_READ: 'purchase_orders:read',
  PO_UPDATE: 'purchase_orders:update',
  PO_SUBMIT: 'purchase_orders:submit',
  PO_APPROVE: 'purchase_orders:approve',
  PO_CANCEL: 'purchase_orders:cancel',

  // Goods Receipt Note
  GRN_CREATE: 'grn:create',
  GRN_READ: 'grn:read',
  GRN_RECEIVE: 'grn:receive',

  // Sales Orders
  SO_CREATE: 'sales_orders:create',
  SO_READ: 'sales_orders:read',
  SO_UPDATE: 'sales_orders:update',
  SO_SUBMIT: 'sales_orders:submit',
  SO_APPROVE: 'sales_orders:approve',
  SO_CANCEL: 'sales_orders:cancel',

  // Deliveries
  DELIVERIES_CREATE: 'deliveries:create',
  DELIVERIES_READ: 'deliveries:read',
  DELIVERIES_UPDATE: 'deliveries:update',
  DELIVERIES_DISPATCH: 'deliveries:dispatch',
  DELIVERIES_VALIDATE: 'deliveries:validate',

  // Transfers
  TRANSFERS_CREATE: 'transfers:create',
  TRANSFERS_READ: 'transfers:read',
  TRANSFERS_COMPLETE: 'transfers:complete',

  // Adjustments
  ADJUSTMENTS_CREATE: 'adjustments:create',
  ADJUSTMENTS_READ: 'adjustments:read',
  ADJUSTMENTS_APPROVE: 'adjustments:approve',

  // Returns
  RETURNS_CREATE: 'returns:create',
  RETURNS_READ: 'returns:read',
  RETURNS_PROCESS: 'returns:process',

  // Reports & Dashboard
  DASHBOARD_READ: 'dashboard:read',
  REPORTS_READ: 'reports:read',
  REPORTS_EXPORT: 'reports:export',

  // Stock Ledger
  LEDGER_READ: 'ledger:read',
  LEDGER_EXPORT: 'ledger:export',

  // Alerts
  ALERTS_READ: 'alerts:read',

  // Audit Logs
  AUDIT_READ: 'audit:read',
};

// ─── Role Permission Defaults ──────────────────────────────────────────────────

/** Permissions granted by default to each role */
export const ROLE_PERMISSIONS = {
  /**
   * Owner — Full system access. Cannot be restricted.
   * Only one owner should exist per organization.
   */
  owner: Object.values(PERMISSIONS),

  /**
   * Admin — Almost full access. Can manage users and all operations.
   * Cannot delete the owner account.
   */
  admin: [
    PERMISSIONS.USERS_CREATE, PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_UPDATE, PERMISSIONS.USERS_DELETE,
    PERMISSIONS.USERS_MANAGE_PERMISSIONS,
    PERMISSIONS.PRODUCTS_CREATE, PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.PRODUCTS_UPDATE, PERMISSIONS.PRODUCTS_DELETE,
    PERMISSIONS.PRODUCTS_BULK_UPLOAD,
    PERMISSIONS.CATEGORIES_CREATE, PERMISSIONS.CATEGORIES_READ,
    PERMISSIONS.CATEGORIES_UPDATE, PERMISSIONS.CATEGORIES_DELETE,
    PERMISSIONS.WAREHOUSES_CREATE, PERMISSIONS.WAREHOUSES_READ,
    PERMISSIONS.WAREHOUSES_UPDATE, PERMISSIONS.WAREHOUSES_DELETE,
    PERMISSIONS.WAREHOUSES_MANAGE_LOCATIONS,
    PERMISSIONS.SUPPLIERS_CREATE, PERMISSIONS.SUPPLIERS_READ,
    PERMISSIONS.SUPPLIERS_UPDATE, PERMISSIONS.SUPPLIERS_DELETE,
    PERMISSIONS.CUSTOMERS_CREATE, PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.CUSTOMERS_UPDATE, PERMISSIONS.CUSTOMERS_DELETE,
    PERMISSIONS.PO_CREATE, PERMISSIONS.PO_READ, PERMISSIONS.PO_UPDATE,
    PERMISSIONS.PO_SUBMIT, PERMISSIONS.PO_APPROVE, PERMISSIONS.PO_CANCEL,
    PERMISSIONS.GRN_CREATE, PERMISSIONS.GRN_READ, PERMISSIONS.GRN_RECEIVE,
    PERMISSIONS.SO_CREATE, PERMISSIONS.SO_READ, PERMISSIONS.SO_UPDATE,
    PERMISSIONS.SO_SUBMIT, PERMISSIONS.SO_APPROVE, PERMISSIONS.SO_CANCEL,
    PERMISSIONS.DELIVERIES_CREATE, PERMISSIONS.DELIVERIES_READ,
    PERMISSIONS.DELIVERIES_UPDATE, PERMISSIONS.DELIVERIES_DISPATCH,
    PERMISSIONS.DELIVERIES_VALIDATE,
    PERMISSIONS.TRANSFERS_CREATE, PERMISSIONS.TRANSFERS_READ,
    PERMISSIONS.TRANSFERS_COMPLETE,
    PERMISSIONS.ADJUSTMENTS_CREATE, PERMISSIONS.ADJUSTMENTS_READ,
    PERMISSIONS.ADJUSTMENTS_APPROVE,
    PERMISSIONS.RETURNS_CREATE, PERMISSIONS.RETURNS_READ,
    PERMISSIONS.RETURNS_PROCESS,
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.REPORTS_READ, PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.LEDGER_READ, PERMISSIONS.LEDGER_EXPORT,
    PERMISSIONS.ALERTS_READ,
    PERMISSIONS.AUDIT_READ,
  ],

  /**
   * Manager — Full inventory operations + approval authority. Cannot manage users.
   */
  manager: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.PRODUCTS_CREATE, PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.PRODUCTS_UPDATE, PERMISSIONS.PRODUCTS_BULK_UPLOAD,
    PERMISSIONS.CATEGORIES_CREATE, PERMISSIONS.CATEGORIES_READ,
    PERMISSIONS.CATEGORIES_UPDATE,
    PERMISSIONS.WAREHOUSES_READ, PERMISSIONS.WAREHOUSES_MANAGE_LOCATIONS,
    PERMISSIONS.SUPPLIERS_CREATE, PERMISSIONS.SUPPLIERS_READ,
    PERMISSIONS.SUPPLIERS_UPDATE,
    PERMISSIONS.CUSTOMERS_CREATE, PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.CUSTOMERS_UPDATE,
    PERMISSIONS.PO_CREATE, PERMISSIONS.PO_READ, PERMISSIONS.PO_UPDATE,
    PERMISSIONS.PO_SUBMIT, PERMISSIONS.PO_APPROVE, PERMISSIONS.PO_CANCEL,
    PERMISSIONS.GRN_CREATE, PERMISSIONS.GRN_READ, PERMISSIONS.GRN_RECEIVE,
    PERMISSIONS.SO_CREATE, PERMISSIONS.SO_READ, PERMISSIONS.SO_UPDATE,
    PERMISSIONS.SO_SUBMIT, PERMISSIONS.SO_APPROVE, PERMISSIONS.SO_CANCEL,
    PERMISSIONS.DELIVERIES_CREATE, PERMISSIONS.DELIVERIES_READ,
    PERMISSIONS.DELIVERIES_UPDATE, PERMISSIONS.DELIVERIES_DISPATCH,
    PERMISSIONS.DELIVERIES_VALIDATE,
    PERMISSIONS.TRANSFERS_CREATE, PERMISSIONS.TRANSFERS_READ,
    PERMISSIONS.TRANSFERS_COMPLETE,
    PERMISSIONS.ADJUSTMENTS_CREATE, PERMISSIONS.ADJUSTMENTS_READ,
    PERMISSIONS.ADJUSTMENTS_APPROVE,
    PERMISSIONS.RETURNS_CREATE, PERMISSIONS.RETURNS_READ,
    PERMISSIONS.RETURNS_PROCESS,
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.REPORTS_READ, PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.LEDGER_READ, PERMISSIONS.LEDGER_EXPORT,
    PERMISSIONS.ALERTS_READ,
  ],

  /**
   * Warehouse Staff — Day-to-day inventory operations. No approvals.
   */
  warehouse_staff: [
    PERMISSIONS.PRODUCTS_READ, PERMISSIONS.PRODUCTS_UPDATE,
    PERMISSIONS.CATEGORIES_READ,
    PERMISSIONS.WAREHOUSES_READ,
    PERMISSIONS.SUPPLIERS_READ,
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.PO_READ,
    PERMISSIONS.GRN_CREATE, PERMISSIONS.GRN_READ, PERMISSIONS.GRN_RECEIVE,
    PERMISSIONS.SO_READ,
    PERMISSIONS.DELIVERIES_CREATE, PERMISSIONS.DELIVERIES_READ,
    PERMISSIONS.DELIVERIES_UPDATE, PERMISSIONS.DELIVERIES_DISPATCH,
    PERMISSIONS.TRANSFERS_CREATE, PERMISSIONS.TRANSFERS_READ,
    PERMISSIONS.TRANSFERS_COMPLETE,
    PERMISSIONS.ADJUSTMENTS_CREATE, PERMISSIONS.ADJUSTMENTS_READ,
    PERMISSIONS.RETURNS_CREATE, PERMISSIONS.RETURNS_READ,
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.LEDGER_READ,
    PERMISSIONS.ALERTS_READ,
  ],

  /**
   * Viewer — Read-only access to all modules. Cannot modify anything.
   */
  viewer: [
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.CATEGORIES_READ,
    PERMISSIONS.WAREHOUSES_READ,
    PERMISSIONS.SUPPLIERS_READ,
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.PO_READ,
    PERMISSIONS.GRN_READ,
    PERMISSIONS.SO_READ,
    PERMISSIONS.DELIVERIES_READ,
    PERMISSIONS.TRANSFERS_READ,
    PERMISSIONS.ADJUSTMENTS_READ,
    PERMISSIONS.RETURNS_READ,
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.LEDGER_READ,
    PERMISSIONS.ALERTS_READ,
  ],

  /**
   * Legacy 'user' role — mapped to warehouse_staff for backward compatibility.
   * Will be deprecated after migration.
   */
  user: [
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.CATEGORIES_READ,
    PERMISSIONS.WAREHOUSES_READ,
    PERMISSIONS.SUPPLIERS_READ,
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.PO_READ,
    PERMISSIONS.GRN_READ,
    PERMISSIONS.SO_READ,
    PERMISSIONS.DELIVERIES_CREATE, PERMISSIONS.DELIVERIES_READ,
    PERMISSIONS.DELIVERIES_UPDATE,
    PERMISSIONS.TRANSFERS_CREATE, PERMISSIONS.TRANSFERS_READ,
    PERMISSIONS.ADJUSTMENTS_CREATE, PERMISSIONS.ADJUSTMENTS_READ,
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.LEDGER_READ,
    PERMISSIONS.ALERTS_READ,
  ],
};

// ─── Permission Checker ────────────────────────────────────────────────────────

/**
 * Check whether a user has a specific permission.
 * Owners always pass. Custom permissions can grant OR explicitly deny (prefix '-').
 *
 * @param {string} role - User's role
 * @param {string[]} customPermissions - User's custom permission overrides
 * @param {string} requiredPermission - Permission string to check
 * @returns {boolean}
 */
export const hasPermission = (role, customPermissions = [], requiredPermission) => {
  // Owners bypass all permission checks
  if (role === 'owner') return true;

  // Check for explicit denial first (custom permission prefixed with '-')
  const denied = `deny:${requiredPermission}`;
  if (customPermissions.includes(denied)) return false;

  // Check if granted via custom permission override
  if (customPermissions.includes(requiredPermission)) return true;

  // Check role defaults
  const rolePerms = ROLE_PERMISSIONS[role] || [];
  return rolePerms.includes(requiredPermission);
};

/**
 * Get all effective permissions for a user (role defaults + custom grants - custom denials).
 *
 * @param {string} role
 * @param {string[]} customPermissions
 * @returns {string[]}
 */
export const getEffectivePermissions = (role, customPermissions = []) => {
  if (role === 'owner') return Object.values(PERMISSIONS);

  const rolePerms = new Set(ROLE_PERMISSIONS[role] || []);

  for (const perm of customPermissions) {
    if (perm.startsWith('deny:')) {
      rolePerms.delete(perm.replace('deny:', ''));
    } else {
      rolePerms.add(perm);
    }
  }

  return [...rolePerms];
};

/**
 * Get the numeric hierarchy level of a role.
 * Useful for checking "can this user manage that user?"
 * Higher = more authority.
 */
export const ROLE_LEVEL = {
  owner: 5,
  admin: 4,
  manager: 3,
  warehouse_staff: 2,
  viewer: 1,
  user: 2, // legacy
};

export const getRoleLevel = (role) => ROLE_LEVEL[role] || 0;
