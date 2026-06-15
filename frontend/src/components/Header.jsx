import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { Moon, Sun, LogOut, Bell } from 'lucide-react';
import { Button } from './ui/Button';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { alertsApi } from '../services/api';
import { useEffect } from 'react';

export default function Header() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alerts, setAlerts] = useState(null);

  useEffect(() => {
    alertsApi.getAlerts().then((r) => setAlerts(r.data.data)).catch(() => {});
  }, []);

  const lowCount = (alerts?.lowStock?.length || 0) + (alerts?.outOfStock?.length || 0);
  const pendingCount = alerts?.pendingDeliveries?.length || 0;

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100 hidden sm:block">Inventory</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={toggle} className="!p-2">
          {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
        <div className="relative">
          <Button variant="ghost" size="sm" className="!p-2" onClick={() => setAlertsOpen((o) => !o)}>
            <Bell className="w-5 h-5" />
            {(lowCount + pendingCount) > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                {lowCount + pendingCount}
              </span>
            )}
          </Button>
          {alertsOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setAlertsOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-80 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl py-2 z-20 animate-slide-up">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 font-medium text-slate-700 dark:text-slate-200">Alerts</div>
                {alerts?.lowStock?.length > 0 && (
                  <div className="px-4 py-2">
                    <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Low stock</p>
                    {alerts.lowStock.slice(0, 3).map((p) => (
                      <p key={p._id} className="text-sm text-slate-600 dark:text-slate-400">{p.name} ({p.stockQuantity})</p>
                    ))}
                  </div>
                )}
                {alerts?.outOfStock?.length > 0 && (
                  <div className="px-4 py-2">
                    <p className="text-xs font-medium text-red-600 dark:text-red-400">Out of stock</p>
                    {alerts.outOfStock.slice(0, 3).map((p) => (
                      <p key={p._id} className="text-sm text-slate-600 dark:text-slate-400">{p.name}</p>
                    ))}
                  </div>
                )}
                {alerts?.pendingDeliveries?.length > 0 && (
                  <div className="px-4 py-2">
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Pending deliveries</p>
                    {alerts.pendingDeliveries.slice(0, 3).map((d) => (
                      <NavLink key={d._id} to="/deliveries" className="block text-sm text-slate-600 dark:text-slate-400 hover:text-emerald-600" onClick={() => setAlertsOpen(false)}>{d.reference}</NavLink>
                    ))}
                  </div>
                )}
                {(!alerts || (lowCount + pendingCount) === 0) && (
                  <p className="px-4 py-3 text-sm text-slate-500">No alerts</p>
                )}
              </div>
            </>
          )}
        </div>
        <span className="text-sm text-slate-600 dark:text-slate-400 hidden sm:inline">{user?.name}</span>
        <Button variant="ghost" size="sm" onClick={logout} className="!p-2" title="Logout">
          <LogOut className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}
