import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Truck,
  ArrowLeftRight,
  SlidersHorizontal,
  History,
  Building2,
  User,
  FolderTree,
  Users,
  ShieldCheck,
  RotateCcw,
  PackageSearch,
  Building,
  ShoppingCart,
  ShieldAlert,
  Settings,
  FileText,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../hooks/useAuth';
import { settingsApi } from '../services/api';

const mainNav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/products', icon: Package, label: 'Products' },
  { to: '/sales-orders', icon: ShoppingCart, label: 'Sales Orders', permission: 'purchase_orders:read' },
  { to: '/receipts', icon: ClipboardList, label: 'Receipts' },
  { to: '/deliveries', icon: Truck, label: 'Delivery Orders' },
  { to: '/returns', icon: RotateCcw, label: 'Returns (RMAs)' },
  { to: '/lots', icon: PackageSearch, label: 'Traceability & Lots' },
  { to: '/purchase-orders', icon: FileText, label: 'Purchase Orders', permission: 'purchase_orders:read' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/suppliers', icon: Building, label: 'Suppliers' },
  { to: '/transfers', icon: ArrowLeftRight, label: 'Internal Transfers' },
  { to: '/adjustments', icon: SlidersHorizontal, label: 'Inventory Adjustment' },
  { to: '/move-history', icon: History, label: 'Move History' },
  { to: '/warehouses', icon: Building2, label: 'Warehouses' },
  { to: '/categories', icon: FolderTree, label: 'Categories' },
];

const adminNav = [
  { label: 'Settings', icon: Settings, to: '/settings', permission: 'users:manage' },
  { label: 'Team Access', icon: Users, to: '/admin/users', permission: 'users:manage' },
  { label: 'Audit Logs', icon: FileText, to: '/admin/audit-logs', permission: 'users:manage' }
];

const bottomNav = [
  { to: '/profile', icon: User, label: 'Profile' },
];

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
          isActive
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
        )
      }
    >
      <Icon className="w-[18px] h-[18px] flex-shrink-0" />
      {label}
    </NavLink>
  );
}

export default function Sidebar() {
  const { hasPermission } = useAuth();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    settingsApi.get().then(res => setSettings(res.data.data)).catch(() => {});
  }, []);

  // Filter admin nav based on permissions
  const visibleAdminNav = adminNav.filter((item) =>
    !item.permission || hasPermission(item.permission)
  );

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800">
        <NavLink to="/" className="flex items-center gap-2.5">
          {settings?.logoUrl ? (
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0">
              <img src={`http://localhost:5000${settings.logoUrl}`} alt="Logo" className="max-w-full max-h-full object-contain" />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/30">
              C
            </div>
          )}
          <div>
            <span className="font-bold text-slate-900 dark:text-white text-sm">{settings?.companyName || 'CoreInventory'}</span>
            <span className="block text-xs text-slate-400">v2.0</span>
          </div>
        </NavLink>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        <div className="space-y-0.5">
          {mainNav.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </div>

        {/* Admin Section */}
        {visibleAdminNav.length > 0 && (
          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
            <p className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Administration
            </p>
            <div className="space-y-0.5">
              {visibleAdminNav.map((item) => (
                <NavItem key={item.to} {...item} />
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Bottom Nav */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800">
        {bottomNav.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </div>
    </aside>
  );
}
