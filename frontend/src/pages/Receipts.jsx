import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Check, Trash2, Search, ClipboardList, Eye } from 'lucide-react';
import { receiptsApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export default function Receipts() {
  const [receipts, setReceipts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchReceipts = () => {
    setLoading(true);
    const params = { page, limit: 10 };
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    
    receiptsApi.getAll(params).then((r) => {
      setReceipts(r.data.data);
      setTotal(r.data.total);
    }).catch(() => toast.error('Failed to load receipts')).finally(() => setLoading(false));
  };

  useEffect(() => { fetchReceipts(); }, [page, search, statusFilter]);

  const handleValidate = (id) => {
    if (!window.confirm('Validate and process this receipt? Inventory will be updated.')) return;
    receiptsApi.validate(id).then(() => {
      toast.success('Receipt validated and inventory updated');
      fetchReceipts();
    }).catch((err) => toast.error(err.response?.data?.message || 'Validation failed'));
  };

  const handleDelete = (id, s) => {
    if (s === 'done') return toast.error('Cannot delete a validated receipt');
    if (!window.confirm('Delete this receipt?')) return;
    receiptsApi.delete(id).then(() => { toast.success('Deleted'); fetchReceipts(); }).catch(() => toast.error('Delete failed'));
  };

  const STATUS_COLORS = {
    draft: 'bg-slate-100 text-slate-700',
    waiting: 'bg-amber-100 text-amber-700',
    ready: 'bg-blue-100 text-blue-700',
    done: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-900/30">
              <ClipboardList className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            Goods Receipts (GRN)
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Receive incoming inventory against Purchase Orders</p>
        </div>
        <Link to="/receipts/new">
          <Button className="gap-2 bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/30 rounded-xl">
            <Plus className="w-4 h-4" /> Receive Goods
          </Button>
        </Link>
      </div>

      <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 py-4">
          <div className="flex flex-1 min-w-[200px] gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search Ref or Supplier..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10 rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-orange-500 transition-shadow min-w-[150px]">
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="waiting">Waiting</option>
              <option value="ready">Ready</option>
              <option value="done">Done</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-16 flex items-center justify-center gap-3 text-slate-500">
              <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              Loading receipts...
            </div>
          ) : receipts.length === 0 ? (
             <div className="p-16 text-center text-slate-400 flex flex-col items-center">
              <ClipboardList className="w-12 h-12 mb-4 opacity-50" />
              <p>No receipts found.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="text-left px-6 py-4">Receipt Ref</th>
                      <th className="text-left px-6 py-4">Supplier</th>
                      <th className="text-left px-6 py-4">Status</th>
                      <th className="text-right px-6 py-4">Date</th>
                      <th className="text-right px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {receipts.map((r) => (
                      <tr key={r._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group">
                        <td className="px-6 py-4">
                          <p className="font-mono text-sm font-semibold text-slate-900 dark:text-white">{r.reference}</p>
                          {/* We don't populate PO natively yet in getAll in M6 scope without changing controller, so we skip showing PO number here unless available */}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{r.supplier}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${STATUS_COLORS[r.status] || STATUS_COLORS.draft}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-slate-600 dark:text-slate-400">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right flex justify-end gap-1">
                          <Link to={`/receipts/${r._id}`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 !p-0 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          {r.status !== 'done' && (
                            <Button variant="ghost" size="sm" className="h-8 w-8 !p-0 rounded-lg text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30" onClick={() => handleValidate(r._id)} title="Validate Receipt">
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          {r.status !== 'done' && (
                            <Button variant="ghost" size="sm" className="h-8 w-8 !p-0 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30" onClick={() => handleDelete(r._id, r.status)} title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {total > 10 && (
                <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                  <p className="text-sm text-slate-500">Showing {Math.min((page - 1) * 10 + 1, total)} to {Math.min(page * 10, total)} of {total} Receipts</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-xl h-9">Prev</Button>
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
