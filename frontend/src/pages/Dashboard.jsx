import { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { dashboardApi } from '../services/api';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Package, AlertTriangle, XCircle, ClipboardList, Truck, DollarSign, TrendingUp, Activity, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement);

const kpiConfig = [
  { key: 'totalInventoryValue', label: 'Total Inventory Value', icon: DollarSign, color: 'from-blue-500 to-indigo-600', bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', isCurrency: true },
  { key: 'totalProducts', label: 'Total Products', icon: Package, color: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' },
  { key: 'lowStockItems', label: 'Low Stock Items', icon: AlertTriangle, color: 'from-amber-500 to-orange-600', bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
  { key: 'outOfStockItems', label: 'Out of Stock', icon: XCircle, color: 'from-red-500 to-rose-600', bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400' },
  { key: 'pendingReceipts', label: 'Pending Receipts', icon: ClipboardList, color: 'from-slate-500 to-slate-600', bg: 'bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400' },
  { key: 'pendingDeliveries', label: 'Pending Deliveries', icon: Truck, color: 'from-violet-500 to-purple-600', bg: 'bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400' },
];

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [distribution, setDistribution] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [movement, setMovement] = useState([]);
  
  const [topItems, setTopItems] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    dashboardApi.getKpis().then((r) => setKpis(r.data.data)).catch(() => {});
    dashboardApi.getInventoryDistribution().then((r) => setDistribution(r.data.data || [])).catch(() => {});
    dashboardApi.getCategoryStats().then((r) => setCategoryStats(r.data.data || [])).catch(() => {});
    dashboardApi.getStockMovement(30).then((r) => setMovement(r.data.data || [])).catch(() => {});
    dashboardApi.getTopSellingItems().then((r) => setTopItems(r.data.data || [])).catch(() => {});
    dashboardApi.getLowStockAlerts().then((r) => setLowStockAlerts(r.data.data || [])).catch(() => {});
    dashboardApi.getRecentActivity().then((r) => setRecentActivity(r.data.data || [])).catch(() => {});
  }, []);

  const doughnutData = {
    labels: distribution.map((d) => d.categoryName || d._id || 'Other'),
    datasets: [{
      data: distribution.map((d) => d.totalQuantity),
      backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'],
      borderWidth: 0,
    }],
  };

  const barData = {
    labels: categoryStats.map((c) => c.name),
    datasets: [{
      label: 'Products',
      data: categoryStats.map((c) => c.count),
      backgroundColor: 'rgba(16, 185, 129, 0.7)',
      borderRadius: 8,
    }, {
      label: 'Total Stock',
      data: categoryStats.map((c) => c.totalStock || 0),
      backgroundColor: 'rgba(59, 130, 246, 0.7)',
      borderRadius: 8,
    }],
  };

  const lineData = {
    labels: movement.map((m) => m._id),
    datasets: [{
      label: 'Movements',
      data: movement.map((m) => m.count),
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true,
      tension: 0.3,
    }],
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Overview of your inventory and operations</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiConfig.map(({ key, label, icon: Icon, color, bg, text, isCurrency }) => (
          <Card key={key} className="overflow-hidden hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-300 group">
            <CardContent className="p-5">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center ${text} mb-3 group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {kpis?.[key] !== undefined ? (isCurrency ? `$${kpis[key].toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : kpis[key].toLocaleString()) : '–'}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
            </CardContent>
            <div className={`h-1 bg-gradient-to-r ${color} opacity-80`} />
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="overflow-hidden">
          <CardHeader>
            <h2 className="font-semibold text-slate-900 dark:text-white">Inventory by Category</h2>
          </CardHeader>
          <CardContent className="flex justify-center min-h-[280px]">
            {distribution.length > 0 ? (
              <div className="w-64 h-64">
                <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom' } } }} />
              </div>
            ) : (
              <p className="text-slate-500 self-center">No data yet</p>
            )}
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader>
            <h2 className="font-semibold text-slate-900 dark:text-white">Category Stats</h2>
          </CardHeader>
          <CardContent className="min-h-[280px]">
            {categoryStats.length > 0 ? (
              <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } }, plugins: { legend: { position: 'top' } } }} />
            ) : (
              <p className="text-slate-500 self-center">No data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <h2 className="font-semibold text-slate-900 dark:text-white">Stock Movement (Last 30 days)</h2>
        </CardHeader>
        <CardContent className="min-h-[260px]">
          {movement.length > 0 ? (
            <Line data={lineData} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }} />
          ) : (
            <p className="text-slate-500">No movement data yet</p>
          )}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Top Selling Items */}
        <Card className="overflow-hidden xl:col-span-1">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-800/20 py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" /> Top Selling Items (30 Days)
            </h2>
          </CardHeader>
          <CardContent className="p-0">
            {topItems.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {topItems.map((item, i) => (
                  <div key={item._id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500">#{i + 1}</div>
                      <div>
                        <p className="font-medium text-sm text-slate-900 dark:text-white line-clamp-1">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.SKU}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{item.totalQuantity}</span>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Shipped</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">No sales data yet</div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="overflow-hidden xl:col-span-1 border-amber-200 dark:border-amber-900/50">
          <CardHeader className="bg-amber-50/50 dark:bg-amber-900/10 py-4 border-b border-amber-100 dark:border-amber-900/30">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" /> Low Stock Alerts
              </h2>
              <Link to="/purchase-orders/new">
                <Button size="sm" variant="ghost" className="h-8 text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/40">
                  <Plus className="w-4 h-4 mr-1" /> Reorder
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {lowStockAlerts.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[400px] overflow-y-auto">
                {lowStockAlerts.map(item => (
                  <div key={item._id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <div>
                      <Link to={`/products/${item._id}`} className="font-medium text-sm text-slate-900 dark:text-white hover:text-amber-600 transition-colors">{item.name}</Link>
                      <p className="text-xs text-slate-500">{item.SKU}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="danger" className="text-xs">
                        {item.stockQuantity} / {item.reorderLevel || 0}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">All stock levels look good!</div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="overflow-hidden xl:col-span-1">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-800/20 py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-slate-500" /> Recent Activity
            </h2>
          </CardHeader>
          <CardContent className="p-0">
            {recentActivity.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[400px] overflow-y-auto">
                {recentActivity.map(act => (
                  <div key={act._id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={act.operationType === 'receipt' || act.operationType === 'return_in' ? 'success' : act.operationType === 'delivery' || act.operationType === 'return_out' ? 'danger' : 'default'} className="text-[10px] uppercase">
                          {act.operationType ? act.operationType.replace('_', ' ') : 'UNKNOWN'}
                        </Badge>
                      </div>
                      <span className="text-xs text-slate-400">{new Date(act.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      <span className="font-medium">{act.product?.name}</span>
                      <span className={`font-semibold ml-2 ${act.quantity > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {act.quantity > 0 ? '+' : ''}{act.quantity}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {act.warehouse?.name} • By {act.createdBy?.name || 'System'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">No recent activity</div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
