import { useState, useEffect } from 'react';
import { stockLedgerApi } from '../services/api';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export default function MoveHistory() {
  const [movements, setMovements] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [operationType, setOperationType] = useState('');
  const [loading, setLoading] = useState(true);

  const fetch = () => {
    setLoading(true);
    const params = { page, limit: 25 };
    if (operationType) params.operationType = operationType;
    stockLedgerApi.getAll(params).then((r) => {
      setMovements(r.data.data);
      setTotal(r.data.total);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [page, operationType]);

  const typeVariant = (t) => ({ receipt: 'success', delivery: 'danger', transfer_in: 'info', transfer_out: 'warning', adjustment: 'default' }[t] || 'default');

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Move History</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Stock movement ledger</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap gap-2">
          <select value={operationType} onChange={(e) => setOperationType(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm">
            <option value="">All types</option>
            <option value="receipt">Receipt</option>
            <option value="delivery">Delivery</option>
            <option value="transfer_in">Transfer In</option>
            <option value="transfer_out">Transfer Out</option>
            <option value="adjustment">Adjustment</option>
          </select>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? <div className="p-12 text-center text-slate-500">Loading...</div> : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Date</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Product</th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase">Quantity</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Type</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Source / Dest</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {movements.map((m) => (
                      <tr key={m._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">{new Date(m.createdAt).toLocaleString()}</td>
                        <td className="px-6 py-4 font-medium">{m.product?.name}</td>
                        <td className="px-6 py-4 text-right font-medium">{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</td>
                        <td className="px-6 py-4"><Badge variant={typeVariant(m.operationType)}>{m.operationType}</Badge></td>
                        <td className="px-6 py-4 text-sm text-slate-500">{m.sourceWarehouse?.name || '–'} / {m.destinationWarehouse?.name || '–'}</td>
                        <td className="px-6 py-4 font-mono text-xs">{m.reference || '–'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {total > 25 && (
                <div className="flex justify-between px-6 py-3 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-sm text-slate-500">Total {total} movements</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
                    <Button variant="outline" size="sm" disabled={page * 25 >= total} onClick={() => setPage((p) => p + 1)}>Next</Button>
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
