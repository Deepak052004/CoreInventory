import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Search, MapPin, PackageSearch, AlertTriangle } from 'lucide-react';
import { lotsApi } from '../services/api';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import LabelPrintModal from '../components/ui/LabelPrintModal';

export default function Lots() {
  const [lots, setLots] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [loading, setLoading] = useState(true);
  
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printLot, setPrintLot] = useState(null);

  const fetchLots = () => {
    setLoading(true);
    const params = { page, limit: 15 };
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;

    lotsApi.getAll(params)
      .then(r => {
        setLots(r.data.data);
        setTotal(r.data.total);
      })
      .catch(() => toast.error('Failed to load lots'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLots();
  }, [page, search, statusFilter]);

  const STATUS_STYLES = {
    active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    depleted: 'bg-slate-100 text-slate-700 border-slate-200',
    quarantined: 'bg-amber-100 text-amber-700 border-amber-200',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
              <PackageSearch className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            Traceability & Lots
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Track serial numbers and batches across all locations</p>
        </div>
      </div>

      <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 py-4">
          <div className="flex flex-1 flex-wrap min-w-[200px] gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search Batch or Serial Number..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10 rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="depleted">Depleted</option>
              <option value="quarantined">Quarantined</option>
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-16 flex items-center justify-center gap-3 text-slate-500">
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              Loading traceability data...
            </div>
          ) : lots.length === 0 ? (
            <div className="p-16 text-center text-slate-400 flex flex-col items-center">
              <PackageSearch className="w-12 h-12 mb-4 opacity-50" />
              <p>No lots or serial numbers found.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="text-left px-6 py-4">Identifier</th>
                      <th className="text-left px-6 py-4">Product</th>
                      <th className="text-left px-6 py-4">Location</th>
                      <th className="text-right px-6 py-4">Quantity</th>
                      <th className="text-left px-6 py-4">Status</th>
                      <th className="text-right px-6 py-4">Expiry Date</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {lots.map((lot) => {
                      const isExpired = lot.expiryDate && new Date(lot.expiryDate) < new Date() && lot.status === 'active';
                      return (
                        <tr key={lot._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                              {lot.identifier}
                            </span>
                            {lot.product?.trackingType === 'serial' && (
                              <span className="ml-2 text-xs uppercase text-indigo-500 font-bold">Serial</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium text-slate-900 dark:text-white">{lot.product?.name}</p>
                            <p className="text-xs text-slate-500">{lot.product?.SKU}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                              <MapPin className="w-3.5 h-3.5" /> {lot.warehouse?.name}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-slate-700 dark:text-slate-300">
                            {lot.quantity} {lot.product?.unitOfMeasure}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${STATUS_STYLES[lot.status] || STATUS_STYLES.active}`}>
                              {lot.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {lot.expiryDate ? (
                              <span className={`inline-flex items-center gap-1.5 ${isExpired ? 'text-red-600 font-bold' : 'text-slate-600 dark:text-slate-400'}`}>
                                {isExpired && <AlertTriangle className="w-4 h-4" />}
                                {new Date(lot.expiryDate).toLocaleDateString()}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button variant="ghost" size="sm" className="h-8 w-8 !p-0 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30" onClick={() => { setPrintLot(lot); setPrintModalOpen(true); }} title="Print Barcode">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {total > 15 && (
                <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                  <p className="text-sm text-slate-500">Showing {Math.min((page - 1) * 15 + 1, total)} to {Math.min(page * 15, total)} of {total}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                    <Button variant="outline" size="sm" disabled={page * 15 >= total} onClick={() => setPage((p) => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      
      <LabelPrintModal 
        open={printModalOpen} 
        onClose={() => setPrintModalOpen(false)} 
        skuOrLot={printLot?.identifier} 
        productName={printLot?.product?.name} 
      />
    </div>
  );
}
