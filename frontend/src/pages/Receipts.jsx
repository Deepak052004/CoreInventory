import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Check, Trash2 } from 'lucide-react';
import { receiptsApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import Modal from '../components/ui/Modal';

export default function Receipts() {
  const [receipts, setReceipts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const fetch = () => {
    setLoading(true);
    const params = { page, limit: 10 };
    if (status) params.status = status;
    receiptsApi.getAll(params).then((r) => {
      setReceipts(r.data.data);
      setTotal(r.data.total);
    }).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [page, status]);

  const handleValidate = (id) => {
    receiptsApi.validate(id).then(() => {
      toast.success('Receipt validated');
      fetch();
    }).catch((err) => toast.error(err.response?.data?.message || 'Validation failed'));
  };

  const handleDelete = (id, s) => {
    if (s === 'done') return toast.error('Cannot delete validated receipt');
    if (!confirm('Delete this receipt?')) return;
    receiptsApi.delete(id).then(() => { toast.success('Deleted'); fetch(); }).catch(() => toast.error('Delete failed'));
  };

  const statusVariant = (s) => ({ draft: 'default', waiting: 'warning', ready: 'info', done: 'success', cancelled: 'danger' }[s] || 'default');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Receipts</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Incoming goods</p>
        </div>
        <Link to="/receipts/new"><Button className="gap-2"><Plus className="w-4 h-4" /> New Receipt</Button></Link>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap gap-2">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm">
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="waiting">Waiting</option>
            <option value="ready">Ready</option>
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
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Supplier</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Status</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Date</th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {receipts.map((r) => (
                      <tr key={r._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="px-6 py-4 font-mono text-sm">{r.reference}</td>
                        <td className="px-6 py-4">{r.supplier}</td>
                        <td className="px-6 py-4"><Badge variant={statusVariant(r.status)}>{r.status}</Badge></td>
                        <td className="px-6 py-4 text-sm text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                          <Link to={`/receipts/${r._id}`}><Button variant="ghost" size="sm">View</Button></Link>
                          {r.status !== 'done' && <Button variant="ghost" size="sm" className="text-emerald-600" onClick={() => handleValidate(r._id)}><Check className="w-4 h-4 inline mr-1" />Validate</Button>}
                          {r.status !== 'done' && <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(r._id, r.status)}><Trash2 className="w-4 h-4" /></Button>}
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
