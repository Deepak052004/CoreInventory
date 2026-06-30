import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Search, Eye, Calendar, ShoppingCart, Download } from 'lucide-react';
import { salesOrdersApi, customersApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import PermissionGuard from '../components/guards/PermissionGuard';
import { downloadCSV } from '../utils/csvExport';

export default function SalesOrders() {
  const [sos, setSOs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchSOs = () => {
    setLoading(true);
    const params = { page, limit: 10 };
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    if (customerFilter) params.customer = customerFilter;
    
    salesOrdersApi.getAll(params)
      .then((r) => {
        setSOs(r.data.data);
        setTotal(r.data.total);
      })
      .catch(() => toast.error('Failed to load sales orders'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSOs();
  }, [page, search, statusFilter, customerFilter]);

  const handleExport = () => {
    if (!sos.length) return toast.error('No data to export');
    const data = sos.map(so => ({
      'SO Number': so.soNumber,
      'Customer': so.customer?.name || '',
      'Date': new Date(so.createdAt).toLocaleDateString(),
      'Status': so.status,
      'Total Amount': so.totalAmount ? so.totalAmount.toFixed(2) : 0,
      'Source Warehouse': so.warehouse?.name || ''
    }));
    downloadCSV(data, `sales_orders_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const STATUS_COLORS = {
    draft: 'bg-slate-100 text-slate-700 border-slate-200',
    submitted: 'bg-blue-100 text-blue-700 border-blue-200',
    approved: 'bg-sky-100 text-sky-700 border-sky-200',
    partial: 'bg-amber-100 text-amber-700 border-amber-200',
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
              <ShoppingCart className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            Sales Orders
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage customer orders and track fulfillment</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExport} className="gap-2 rounded-xl">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <PermissionGuard permission="purchase_orders:create">
            <Link to="/sales-orders/new">
              <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 rounded-xl">
                <Plus className="w-4 h-4" /> Create SO
              </Button>
            </Link>
          </PermissionGuard>
        </div>
      </div>

      <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 py-4">
          <div className="flex flex-1 min-w-[200px] gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search SO Number..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10 rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-sky-500 transition-shadow min-w-[150px]">
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="partial">Partial</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-16 flex items-center justify-center gap-3 text-slate-500">
              <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
              Loading Sales Orders...
            </div>
          ) : sos.length === 0 ? (
            <div className="p-16 text-center text-slate-400 flex flex-col items-center">
              <ShoppingCart className="w-12 h-12 mb-4 opacity-50" />
              <p>No sales orders found.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="text-left px-6 py-4">SO Number</th>
                      <th className="text-left px-6 py-4">Customer</th>
                      <th className="text-left px-6 py-4">Status</th>
                      <th className="text-right px-6 py-4">Date</th>
                      <th className="text-right px-6 py-4">Total Amount</th>
                      <th className="text-right px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {sos.map((so) => (
                      <tr key={so._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group">
                        <td className="px-6 py-4">
                          <p className="font-mono text-sm font-semibold text-slate-900 dark:text-white">{so.soNumber}</p>
                          <p className="text-xs text-slate-500 mt-0.5">From: {so.warehouse?.name || 'Any Warehouse'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-900 dark:text-white">{so.customer?.name || 'Unknown Customer'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${STATUS_COLORS[so.status] || STATUS_COLORS.draft}`}>
                            {so.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-slate-600 dark:text-slate-400 flex items-center justify-end gap-1">
                           <Calendar className="w-3.5 h-3.5 opacity-70" /> {new Date(so.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-slate-900 dark:text-white">
                          ${(so.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-right flex justify-end">
                          <Link to={`/sales-orders/${so._id}`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 !p-0 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/30" title="View details">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {total > 10 && (
                <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                  <p className="text-sm text-slate-500">Showing {Math.min((page - 1) * 10 + 1, total)} to {Math.min(page * 10, total)} of {total} SOs</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-xl h-9">Previous</Button>
                    <Button variant="outline" size="sm" disabled={page * 10 >= total} onClick={() => setPage((p) => p + 1)} className="rounded-xl h-9">Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
