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
} from 'lucide-react';
import { clsx } from 'clsx';

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/products', icon: Package, label: 'Products' },
  { to: '/receipts', icon: ClipboardList, label: 'Receipts' },
  { to: '/deliveries', icon: Truck, label: 'Delivery Orders' },
  { to: '/transfers', icon: ArrowLeftRight, label: 'Internal Transfers' },
  { to: '/adjustments', icon: SlidersHorizontal, label: 'Inventory Adjustment' },
  { to: '/move-history', icon: History, label: 'Move History' },
  { to: '/warehouses', icon: Building2, label: 'Warehouses' },
  { to: '/categories', icon: FolderTree, label: 'Categories' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function Sidebar() {
  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex flex-col">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800">
        <NavLink to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/30">
            C
          </div>
          <span className="font-semibold text-slate-900 dark:text-white">CoreInventory</span>
        </NavLink>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
              )
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
