import { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { dashboardApi } from '../services/api';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Package, AlertTriangle, XCircle, ClipboardList, Truck, ArrowLeftRight } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement);

const kpiConfig = [
  { key: 'totalProducts', label: 'Total Products', icon: Package, color: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' },
  { key: 'lowStockItems', label: 'Low Stock Items', icon: AlertTriangle, color: 'from-amber-500 to-orange-600', bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
  { key: 'outOfStockItems', label: 'Out of Stock', icon: XCircle, color: 'from-red-500 to-rose-600', bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400' },
  { key: 'pendingReceipts', label: 'Pending Receipts', icon: ClipboardList, color: 'from-blue-500 to-indigo-600', bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' },
  { key: 'pendingDeliveries', label: 'Pending Deliveries', icon: Truck, color: 'from-violet-500 to-purple-600', bg: 'bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400' },
  { key: 'scheduledTransfers', label: 'Scheduled Transfers', icon: ArrowLeftRight, color: 'from-cyan-500 to-sky-600', bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400' },
];

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [distribution, setDistribution] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [movement, setMovement] = useState([]);

  useEffect(() => {
    dashboardApi.getKpis().then((r) => setKpis(r.data.data)).catch(() => {});
    dashboardApi.getInventoryDistribution().then((r) => setDistribution(r.data.data || [])).catch(() => {});
    dashboardApi.getCategoryStats().then((r) => setCategoryStats(r.data.data || [])).catch(() => {});
    dashboardApi.getStockMovement(30).then((r) => setMovement(r.data.data || [])).catch(() => {});
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
        {kpiConfig.map(({ key, label, icon: Icon, color, bg, text }) => (
          <Card key={key} className="overflow-hidden hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-300 group">
            <CardContent className="p-5">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center ${text} mb-3 group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{kpis?.[key] ?? '–'}</p>
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
    </div>
  );
}
