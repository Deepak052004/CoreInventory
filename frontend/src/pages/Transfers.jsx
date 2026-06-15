import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Check, Trash2 } from 'lucide-react';
import { transfersApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export default function Transfers() {
  const [transfers, setTransfers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const fetch = () => {
    setLoading(true);
    const params = { page, limit: 10 };
    if (status) params.status = status;
    transfersApi.getAll(params).then((r) => {
      setTransfers(r.data.data);
      setTotal(r.data.total);
    }).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [page, status]);

  const handleComplete = (id) => {
    transfersApi.complete(id).then(() => {
      toast.success('Transfer completed');
      fetch();
    }).catch((err) => toast.error(err.response?.data?.message || 'Failed'));
  };

  const handleDelete = (id, s) => {
    if (s === 'done') return toast.error('Cannot delete completed transfer');
    if (!confirm('Delete this transfer?')) return;
    transfersApi.delete(id).then(() => { toast.success('Deleted'); fetch(); }).catch(() => toast.error('Delete failed'));
  };

  const statusVariant = (s) => ({ draft: 'default', scheduled: 'info', in_transit: 'warning', done: 'success', cancelled: 'danger' }[s] || 'default');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Internal Transfers</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Move stock between locations</p>
        </div>
        <Link to="/transfers/new"><Button className="gap-2"><Plus className="w-4 h-4" /> New Transfer</Button></Link>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap gap-2">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm">
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_transit">In transit</option>
            <option value="done">Done</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? <div className="p-12 text-center text-slate-500">Loading...</div> : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Reference</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Product</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Qty</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">From → To</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Status</th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {transfers.map((t) => (
                      <tr key={t._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="px-6 py-4 font-mono text-sm">{t.reference}</td>
                        <td className="px-6 py-4">{t.product?.name}</td>
                        <td className="px-6 py-4">{t.quantity}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                          {t.sourceWarehouse?.name} → {t.destinationWarehouse?.name}
                        </td>
                        <td className="px-6 py-4"><Badge variant={statusVariant(t.status)}>{t.status}</Badge></td>
                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                          {t.status !== 'done' && <Button variant="ghost" size="sm" className="text-emerald-600" onClick={() => handleComplete(t._id)}><Check className="w-4 h-4 inline mr-1" />Complete</Button>}
                          {t.status !== 'done' && <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(t._id, t.status)}><Trash2 className="w-4 h-4" /></Button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {total > 10 && (
                <div className="flex justify-between px-6 py-3 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-sm text-slate-500">Total {total}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
                    <Button variant="outline" size="sm" disabled={page * 10 >= total} onClick={() => setPage((p) => p + 1)}>Next</Button>
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
