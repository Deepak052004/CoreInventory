import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { History, Search, Download, Activity, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Scale, Clock, User } from 'lucide-react';
import { stockLedgerApi } from '../services/api';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { downloadCSV } from '../utils/csvExport';

export default function MoveHistory() {
  const [movements, setMovements] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [operationType, setOperationType] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchMovements = () => {
    setLoading(true);
    const params = { page, limit: 25 };
    if (operationType) params.operationType = operationType;
    stockLedgerApi.getAll(params).then((r) => {
      setMovements(r.data.data);
      setTotal(r.data.total);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchMovements(); }, [page, operationType]);

  const getOperationDetails = (type, qty) => {
    const isPos = qty > 0;
    switch (type) {
      case 'receipt':
        return { 
          icon: <ArrowDownLeft className="w-4 h-4 text-emerald-600" />, 
          bg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
          label: 'Inbound Receipt'
        };
      case 'delivery':
        return { 
          icon: <ArrowUpRight className="w-4 h-4 text-purple-600" />, 
          bg: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
          label: 'Outbound Delivery'
        };
      case 'transfer_in':
        return { 
          icon: <ArrowLeftRight className="w-4 h-4 text-teal-600" />, 
          bg: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400',
          label: 'Internal Transfer (In)'
        };
      case 'transfer_out':
        return { 
          icon: <ArrowLeftRight className="w-4 h-4 text-teal-600" />, 
          bg: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400',
          label: 'Internal Transfer (Out)'
        };
      case 'adjustment':
        return { 
          icon: <Scale className={`w-4 h-4 ${isPos ? 'text-emerald-600' : 'text-red-600'}`} />, 
          bg: isPos ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
          label: 'Inventory Adjustment'
        };
      default:
        return { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', label: type.replace('_', ' ') };
    }
  };

  const handleExport = () => {
    if (!movements.length) return toast.error('No data to export');
    const data = movements.map(h => ({
      'Date': new Date(h.createdAt).toLocaleString(),
      'Product SKU': h.product?.SKU || '',
      'Product Name': h.product?.name || '',
      'Transaction Type': h.operationType,
      'Quantity': h.quantity,
      'Warehouse': h.destinationWarehouse?.name || h.sourceWarehouse?.name || '',
      'Reference': h.reference || '',
      'Created By': h.user?.name || 'System'
    }));
    downloadCSV(data, `move_history_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
              <History className="w-6 h-6 text-slate-600 dark:text-slate-400" />
            </div>
            Move History
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Audit log of all inventory transactions</p>
        </div>
        <Button variant="outline" onClick={handleExport} className="gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 py-4">
          <div className="flex flex-1 min-w-[200px] gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mr-2">
              <Search className="w-4 h-4" /> Filter by Type:
            </div>
            <select value={operationType} onChange={(e) => { setOperationType(e.target.value); setPage(1); }} className="h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-shadow min-w-[180px]">
              <option value="">All Operations</option>
              <option value="receipt">Inbound Receipts (GRN)</option>
              <option value="delivery">Outbound Deliveries</option>
              <option value="transfer_out">Transfers (Source)</option>
              <option value="transfer_in">Transfers (Destination)</option>
              <option value="adjustment">Manual Adjustments</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-16 flex items-center justify-center gap-3 text-slate-500">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Loading ledger data...
            </div>
          ) : movements.length === 0 ? (
             <div className="p-16 text-center text-slate-400 flex flex-col items-center">
              <Activity className="w-12 h-12 mb-4 opacity-50" />
              <p>No movements found in the ledger.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="text-left px-6 py-4">Timestamp</th>
                      <th className="text-left px-6 py-4">Operation</th>
                      <th className="text-left px-6 py-4">Product</th>
                      <th className="text-left px-6 py-4">Warehouse Location</th>
                      <th className="text-right px-6 py-4">Net Change</th>
                      <th className="text-left px-6 py-4">Ref & User</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {movements.map((m) => {
                      const details = getOperationDetails(m.operationType, m.quantity);
                      const isPos = m.quantity > 0;
                      return (
                        <tr key={m._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                              <Clock className="w-3.5 h-3.5" />
                              {new Date(m.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border border-transparent ${details.bg}`}>
                              {details.icon}
                              {details.label}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                            {m.product?.name || 'Unknown'}
                            <div className="text-xs text-slate-500 font-normal mt-0.5">SKU: {m.product?.SKU || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              {m.operationType === 'transfer_in' || m.operationType === 'receipt' ? m.destinationWarehouse?.name : m.sourceWarehouse?.name || m.destinationWarehouse?.name || 'Global'}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`inline-flex items-center justify-end font-bold text-base ${isPos ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                              {isPos ? `+${m.quantity}` : m.quantity}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {m.reference || 'N/A'}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                              <User className="w-3 h-3" /> {m.user?.name || 'System'}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {total > 25 && (
                <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                  <p className="text-sm text-slate-500">Showing {Math.min((page - 1) * 25 + 1, total)} to {Math.min(page * 25, total)} of {total} Movements</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-xl h-9">Prev</Button>
                    <Button variant="outline" size="sm" disabled={page * 25 >= total} onClick={() => setPage((p) => p + 1)} className="rounded-xl h-9">Next</Button>
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
