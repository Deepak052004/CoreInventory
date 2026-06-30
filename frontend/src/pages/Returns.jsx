import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Search, Eye, RotateCcw, Calendar, ArrowRightLeft } from 'lucide-react';
import { returnsApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import PermissionGuard from '../components/guards/PermissionGuard';

export default function Returns() {
  const [returns, setReturns] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchReturns = () => {
    setLoading(true);
    const params = { page, limit: 10 };
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    if (typeFilter) params.type = typeFilter;
    
    returnsApi.getAll(params)
      .then((r) => {
        setReturns(r.data.data);
        setTotal(r.data.total);
      })
      .catch(() => toast.error('Failed to load returns'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReturns();
  }, [page, search, statusFilter, typeFilter]);

  const STATUS_COLORS = {
    draft: 'bg-slate-100 text-slate-700 border-slate-200',
    pending_inspection: 'bg-amber-100 text-amber-700 border-amber-200',
    approved: 'bg-blue-100 text-blue-700 border-blue-200',
    processed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/30">
              <RotateCcw className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>
            Returns (RMAs & RTVs)
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage reverse logistics, inbound RMAs, and outbound RTVs</p>
        </div>
        <PermissionGuard permission="inventory:write">
          <Link to="/returns/new">
            <Button className="gap-2 bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/30 rounded-xl">
              <Plus className="w-4 h-4" /> New Return
            </Button>
          </Link>
        </PermissionGuard>
      </div>

      <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 py-4">
          <div className="flex flex-1 flex-wrap min-w-[200px] gap-3">
            <div className="relative flex-1 max-w-xs min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search Reference..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10 rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800" />
            </div>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-rose-500">
              <option value="">All Types</option>
              <option value="inbound">Inbound (from Customer)</option>
              <option value="outbound">Outbound (to Supplier)</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-rose-500">
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="pending_inspection">Pending Inspection</option>
              <option value="approved">Approved</option>
              <option value="processed">Processed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-16 flex items-center justify-center gap-3 text-slate-500">
              <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
              Loading Returns...
            </div>
          ) : returns.length === 0 ? (
            <div className="p-16 text-center text-slate-400 flex flex-col items-center">
              <RotateCcw className="w-12 h-12 mb-4 opacity-50" />
              <p>No returns found.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="text-left px-6 py-4">Reference</th>
                      <th className="text-left px-6 py-4">Type</th>
                      <th className="text-left px-6 py-4">Party</th>
                      <th className="text-left px-6 py-4">Status</th>
                      <th className="text-right px-6 py-4">Date</th>
                      <th className="text-right px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {returns.map((ret) => (
                      <tr key={ret._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group">
                        <td className="px-6 py-4">
                          <p className="font-mono text-sm font-semibold text-slate-900 dark:text-white">{ret.reference}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{ret.lines.length} items</p>
                        </td>
                        <td className="px-6 py-4">
                          {ret.type === 'inbound' ? (
                            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                              <ArrowRightLeft className="w-4 h-4" /> Inbound RMA
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400 text-sm font-medium">
                              <ArrowRightLeft className="w-4 h-4 rotate-180" /> Outbound RTV
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-900 dark:text-white">
                            {ret.type === 'inbound' ? ret.customer?.name : ret.supplier?.name}
                          </p>
                          <p className="text-xs text-slate-500 uppercase tracking-wider">
                            {ret.type === 'inbound' ? 'Customer' : 'Supplier'}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${STATUS_COLORS[ret.status] || STATUS_COLORS.draft}`}>
                            {ret.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-slate-600 dark:text-slate-400">
                          {new Date(ret.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right flex justify-end">
                          <Link to={`/returns/${ret._id}`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 !p-0 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30" title="View details">
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
                  <p className="text-sm text-slate-500">Showing {Math.min((page - 1) * 10 + 1, total)} to {Math.min(page * 10, total)} of {total}</p>
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
