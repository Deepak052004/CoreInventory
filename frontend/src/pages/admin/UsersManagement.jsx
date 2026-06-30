import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Users, Plus, Search, Shield, ShieldCheck, ShieldOff,
  MoreVertical, Edit2, Trash2, Key, ChevronDown, ChevronUp,
  CheckCircle, XCircle, Clock, Loader2, RefreshCw, UserX, UserCheck,
  History, Lock,
} from 'lucide-react';
import { usersApi } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import PermissionGuard from '../../components/guards/PermissionGuard';

// ─── Constants ─────────────────────────────────────────────────────────────────

const ROLES = ['owner', 'admin', 'manager', 'warehouse_staff', 'viewer'];

const ROLE_CONFIG = {
  owner: { label: 'Owner', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', icon: '👑' },
  admin: { label: 'Admin', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', icon: '🔑' },
  manager: { label: 'Manager', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', icon: '📋' },
  warehouse_staff: { label: 'Staff', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', icon: '📦' },
  viewer: { label: 'Viewer', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400', icon: '👁' },
  user: { label: 'User', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400', icon: '👤' },
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function RoleBadge({ role }) {
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.viewer;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
      <span>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

function StatusBadge({ isActive, isEmailVerified }) {
  if (!isActive) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400">
      <XCircle className="w-3 h-3" /> Deactivated
    </span>
  );
  if (!isEmailVerified) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
      <Clock className="w-3 h-3" /> Unverified
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
      <CheckCircle className="w-3 h-3" /> Active
    </span>
  );
}

// ─── Create User Modal ─────────────────────────────────────────────────────────

function CreateUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'viewer' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await usersApi.create(form);
      toast.success(`User "${form.name}" created successfully.`);
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user.');
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-500" /> Create New User
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {[
            { label: 'Full Name', field: 'name', type: 'text', placeholder: 'John Doe' },
            { label: 'Email', field: 'email', type: 'email', placeholder: 'john@company.com' },
            { label: 'Password', field: 'password', type: 'password', placeholder: 'Min 8 chars, 1 uppercase, 1 number' },
          ].map(({ label, field, type, placeholder }) => (
            <div key={field}>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
              <input
                type={type}
                value={form[field]}
                onChange={set(field)}
                placeholder={placeholder}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Role</label>
            <select
              value={form.role}
              onChange={set('role')}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_CONFIG[r]?.label || r}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {loading ? 'Creating…' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit Role Modal ───────────────────────────────────────────────────────────

function EditUserModal({ user, onClose, onUpdated }) {
  const [role, setRole] = useState(user.role);
  const [isActive, setIsActive] = useState(user.isActive);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await usersApi.update(user._id, { role, isActive });
      toast.success('User updated successfully.');
      onUpdated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-700">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Edit2 className="w-5 h-5 text-blue-500" /> Edit User
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{user.name} · {user.email}</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
              {ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_CONFIG[r]?.label || r}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Account Status</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isActive ? 'User can log in' : 'User cannot log in'}
              </p>
            </div>
            <button type="button" onClick={() => setIsActive(!isActive)}
              className={`relative w-11 h-6 rounded-full transition-colors ${isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Permissions Drawer ────────────────────────────────────────────────────────

function PermissionsDrawer({ user, onClose }) {
  const [permsData, setPermsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    usersApi.getPermissions(user._id).then((r) => {
      setPermsData(r.data.data);
      setLoading(false);
    }).catch(() => {
      toast.error('Failed to load permissions.');
      setLoading(false);
    });
  }, [user._id]);

  const handleReset = async () => {
    setSaving(true);
    try {
      await usersApi.resetPermissions(user._id);
      const r = await usersApi.getPermissions(user._id);
      setPermsData(r.data.data);
      toast.success('Permissions reset to role defaults.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed.');
    } finally {
      setSaving(false);
    }
  };

  const togglePerm = async (perm, currentlyEffective) => {
    setSaving(true);
    try {
      const isInRoleDefault = permsData.roleDefaults.includes(perm);
      let grant = [];
      let revoke = [];

      if (currentlyEffective) {
        // Currently has it — deny if it's a role default, or just remove grant if custom
        if (isInRoleDefault) revoke = [perm];
        else revoke = [perm];
      } else {
        // Currently doesn't have it — grant it
        grant = [perm];
      }

      const r = await usersApi.updatePermissions(user._id, { grant, revoke });
      const updated = await usersApi.getPermissions(user._id);
      setPermsData(updated.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update permission.');
    } finally {
      setSaving(false);
    }
  };

  const filteredPerms = permsData?.allAvailablePermissions.filter((p) =>
    p.toLowerCase().includes(search.toLowerCase())
  ) || [];

  // Group permissions by resource
  const grouped = filteredPerms.reduce((acc, perm) => {
    const [resource] = perm.split(':');
    if (!acc[resource]) acc[resource] = [];
    acc[resource].push(perm);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-end">
      <div className="bg-white dark:bg-slate-900 h-full w-full max-w-lg shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-500" /> Manage Permissions
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{user.name} · <RoleBadge role={user.role} /></p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Search + Reset */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter permissions…"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button onClick={handleReset} disabled={saving}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5">
            <RefreshCw className="w-4 h-4" /> Reset
          </button>
        </div>

        {/* Permission List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            </div>
          ) : (
            Object.entries(grouped).map(([resource, perms]) => (
              <div key={resource}>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
                  {resource.replace(/_/g, ' ')}
                </h3>
                <div className="space-y-1">
                  {perms.map((perm) => {
                    const isEffective = permsData.effectivePermissions.includes(perm);
                    const isRoleDefault = permsData.roleDefaults.includes(perm);
                    const isCustomGrant = permsData.customPermissions.includes(perm);
                    const isCustomDeny = permsData.customPermissions.includes(`deny:${perm}`);
                    const action = perm.split(':').slice(1).join(':');

                    return (
                      <button
                        key={perm}
                        onClick={() => togglePerm(perm, isEffective)}
                        disabled={saving}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all ${
                          isEffective
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 opacity-60'
                        }`}
                      >
                        <span className={`font-medium ${isEffective ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'}`}>
                          {action}
                        </span>
                        <div className="flex items-center gap-2">
                          {isCustomGrant && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium">
                              +custom
                            </span>
                          )}
                          {isCustomDeny && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium">
                              denied
                            </span>
                          )}
                          {isRoleDefault && !isCustomDeny && !isCustomGrant && (
                            <span className="text-xs text-slate-400">role default</span>
                          )}
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isEffective ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                            {isEffective ? <CheckCircle className="w-3.5 h-3.5 text-white" /> : <XCircle className="w-3.5 h-3.5 text-white" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Login History Modal ───────────────────────────────────────────────────────

function LoginHistoryModal({ user, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    usersApi.getLoginHistory(user._id).then((r) => {
      setHistory(r.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user._id]);

  const ACTION_CONFIG = {
    login_success: { label: 'Login', icon: <CheckCircle className="w-3.5 h-3.5" />, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400' },
    login_failed: { label: 'Failed', icon: <XCircle className="w-3.5 h-3.5" />, color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400' },
    logout: { label: 'Logout', icon: <UserX className="w-3.5 h-3.5" />, color: 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400' },
    account_locked: { label: 'Locked', icon: <Lock className="w-3.5 h-3.5" />, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400' },
    password_reset: { label: 'Reset', icon: <RefreshCw className="w-3.5 h-3.5" />, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700 max-h-[80vh] flex flex-col">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-5 h-5 text-blue-500" /> Login History
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{user.name} · Last 90 days</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-emerald-500" /></div>
          ) : history.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No login history found.</p>
          ) : (
            <div className="space-y-2">
              {history.map((entry) => {
                const cfg = ACTION_CONFIG[entry.action] || ACTION_CONFIG.login_failed;
                return (
                  <div key={entry._id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${cfg.color} shrink-0`}>
                      {cfg.icon} {cfg.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {entry.ip} · {entry.device?.substring(0, 60)}
                      </p>
                      {entry.failureReason && (
                        <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">{entry.failureReason.replace(/_/g, ' ')}</p>
                      )}
                    </div>
                    <time className="text-xs text-slate-400 shrink-0">
                      {new Date(entry.createdAt).toLocaleString()}
                    </time>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function UsersManagement() {
  const { user: currentUser, hasPermission } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 1 });

  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterActive, setFilterActive] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [permUser, setPermUser] = useState(null);
  const [historyUser, setHistoryUser] = useState(null);

  const [activeMenuId, setActiveMenuId] = useState(null);

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (filterRole) params.role = filterRole;
      if (filterActive !== '') params.isActive = filterActive;
      const { data } = await usersApi.getAll(params);
      setUsers(data.data);
      setPagination(data.pagination);
    } catch (err) {
      toast.error('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [search, filterRole, filterActive]);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  const handleDelete = async (user) => {
    if (!window.confirm(`Deactivate "${user.name}"? They will no longer be able to log in.`)) return;
    try {
      await usersApi.delete(user._id);
      toast.success(`"${user.name}" has been deactivated.`);
      fetchUsers(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deactivate user.');
    }
    setActiveMenuId(null);
  };

  const canManageUser = (targetUser) => {
    if (!currentUser) return false;
    if (currentUser.role === 'owner') return true;
    const LEVELS = { owner: 5, admin: 4, manager: 3, warehouse_staff: 2, viewer: 1, user: 2 };
    return (LEVELS[currentUser.role] || 0) > (LEVELS[targetUser.role] || 0);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/30">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            User Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage accounts, roles, and permissions · {pagination.total} user{pagination.total !== 1 ? 's' : ''}
          </p>
        </div>
        <PermissionGuard permission="users:create">
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors shadow-lg shadow-emerald-500/25"
          >
            <Plus className="w-4 h-4" /> Add User
          </button>
        </PermissionGuard>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
        >
          <option value="">All Roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{ROLE_CONFIG[r]?.label}</option>)}
        </select>
        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Deactivated</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Users className="w-10 h-10 mb-3" />
            <p className="font-medium">No users found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  {['User', 'Role', 'Status', 'Last Login', 'Actions'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-4">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => {
                  const isCurrentUser = u._id === currentUser?._id;
                  const canManage = canManageUser(u) && !isCurrentUser;
                  return (
                    <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white text-sm">
                              {u.name}
                              {isCurrentUser && <span className="ml-2 text-xs text-slate-400">(you)</span>}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4"><RoleBadge role={u.role} /></td>
                      <td className="px-6 py-4"><StatusBadge isActive={u.isActive} isEmailVerified={u.isEmailVerified} /></td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never'}
                        </p>
                        {u.lastLoginIp && (
                          <p className="text-xs text-slate-400">{u.lastLoginIp}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {/* Permissions button */}
                          <PermissionGuard permission="users:manage_permissions">
                            {canManage && (
                              <button onClick={() => setPermUser(u)} title="Manage Permissions"
                                className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                                <Key className="w-4 h-4" />
                              </button>
                            )}
                          </PermissionGuard>
                          {/* Login history */}
                          <PermissionGuard permission="users:read">
                            <button onClick={() => setHistoryUser(u)} title="Login History"
                              className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                              <History className="w-4 h-4" />
                            </button>
                          </PermissionGuard>
                          {/* Action menu */}
                          {canManage && (
                            <div className="relative">
                              <button onClick={() => setActiveMenuId(activeMenuId === u._id ? null : u._id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              {activeMenuId === u._id && (
                                <div className="absolute right-0 top-8 z-20 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 w-44">
                                  <PermissionGuard permission="users:update">
                                    <button onClick={() => { setEditingUser(u); setActiveMenuId(null); }}
                                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                      <Edit2 className="w-4 h-4 text-blue-500" /> Edit User
                                    </button>
                                  </PermissionGuard>
                                  <PermissionGuard permission="users:delete">
                                    <button onClick={() => handleDelete(u)}
                                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                      <Trash2 className="w-4 h-4" /> Deactivate
                                    </button>
                                  </PermissionGuard>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Page {pagination.page} of {pagination.pages} · {pagination.total} total
            </p>
            <div className="flex gap-2">
              <button onClick={() => fetchUsers(pagination.page - 1)} disabled={pagination.page <= 1}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                Previous
              </button>
              <button onClick={() => fetchUsers(pagination.page + 1)} disabled={pagination.page >= pagination.pages}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} onCreated={() => fetchUsers(1)} />}
      {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onUpdated={() => fetchUsers(pagination.page)} />}
      {permUser && <PermissionsDrawer user={permUser} onClose={() => setPermUser(null)} />}
      {historyUser && <LoginHistoryModal user={historyUser} onClose={() => setHistoryUser(null)} />}

      {/* Close menu on outside click */}
      {activeMenuId && (
        <div className="fixed inset-0 z-10" onClick={() => setActiveMenuId(null)} />
      )}
    </div>
  );
}
