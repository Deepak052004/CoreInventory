import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Scale, Search, History } from 'lucide-react';
import { adjustmentsApi, productsApi, warehousesApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import { Input, Label } from '../components/ui/Input';
import { Select } from '../components/ui/Select';

export default function Adjustments() {
  const [adjustments, setAdjustments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  
  const [form, setForm] = useState({ product: '', warehouse: '', countedQuantity: '', reason: '' });
  const [saving, setSaving] = useState(false);
  const [systemQuantity, setSystemQuantity] = useState(null);

  const fetchAdjustments = () => {
    setLoading(true);
    adjustmentsApi.getAll({ page, limit: 15 }).then((r) => {
      setAdjustments(r.data.data);
      setTotal(r.data.total);
    }).catch(() => toast.error('Failed to load adjustments')).finally(() => setLoading(false));
  };

  useEffect(() => { fetchAdjustments(); }, [page]);
  
  useEffect(() => {
    productsApi.getAll({ limit: 500 }).then((r) => setProducts(r.data.data)).catch(() => {});
    warehousesApi.getAll({ limit: 100 }).then((r) => setWarehouses(r.data.data)).catch(() => {});
  }, []);

  // Dynamically calculate system quantity based on product & warehouse selection
  useEffect(() => {
    if (!form.product || !form.warehouse) {
      setSystemQuantity(null);
      return;
    }
    const prod = products.find(p => p._id === form.product);
    if (prod && prod.stockLocations) {
      const loc = prod.stockLocations.find(l => l.warehouse === form.warehouse || (l.warehouse && l.warehouse._id === form.warehouse));
      setSystemQuantity(loc ? (loc.quantity || 0) : 0);
    } else {
      setSystemQuantity(0);
    }
  }, [form.product, form.warehouse, products]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.product || !form.warehouse || form.countedQuantity === '') {
      return toast.error('Please fill product, warehouse, and counted quantity');
    }
    
    setSaving(true);
    adjustmentsApi.create({
      product: form.product,
      warehouse: form.warehouse,
      countedQuantity: Number(form.countedQuantity),
      reason: form.reason,
    }).then(() => {
      toast.success('Inventory adjustment successfully applied');
      setModalOpen(false);
      setForm({ product: '', warehouse: '', countedQuantity: '', reason: '' });
      fetchAdjustments();
      
      // We should also silently refresh products so the next adjustment has fresh data
      productsApi.getAll({ limit: 500 }).then((r) => setProducts(r.data.data)).catch(() => {});
    }).catch((err) => toast.error(err.response?.data?.message || 'Failed to adjust stock')).finally(() => setSaving(false));
  };

  const countedVal = form.countedQuantity !== '' ? Number(form.countedQuantity) : null;
  const difference = (systemQuantity !== null && countedVal !== null) ? (countedVal - systemQuantity) : null;
  const isLoss = difference !== null && difference < 0;
  const isGain = difference !== null && difference > 0;

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-900/30">
              <Scale className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            Inventory Adjustments
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Reconcile physical stock counts with system records</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2 bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/30 rounded-xl">
          <Plus className="w-4 h-4" /> New Adjustment
        </Button>
      </div>

      <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-16 flex items-center justify-center gap-3 text-slate-500">
              <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              Loading history...
            </div>
          ) : adjustments.length === 0 ? (
             <div className="p-16 text-center text-slate-400 flex flex-col items-center">
              <History className="w-12 h-12 mb-4 opacity-50" />
              <p>No inventory adjustments found.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="text-left px-6 py-4">Date</th>
                      <th className="text-left px-6 py-4">Product</th>
                      <th className="text-left px-6 py-4">Warehouse</th>
                      <th className="text-right px-6 py-4">System Qty</th>
                      <th className="text-right px-6 py-4">Counted Qty</th>
                      <th className="text-right px-6 py-4">Difference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {adjustments.map((a) => {
                      const isRowLoss = a.difference < 0;
                      const isRowGain = a.difference > 0;
                      return (
                        <tr key={a._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4 text-sm text-slate-500">{new Date(a.createdAt).toLocaleString()}</td>
                          <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{a.product?.name || 'Unknown'}</td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{a.warehouse?.name || 'Unknown'}</td>
                          <td className="px-6 py-4 text-right text-slate-500">{a.systemQuantity}</td>
                          <td className="px-6 py-4 text-right font-medium text-slate-900 dark:text-white">{a.countedQuantity}</td>
                          <td className="px-6 py-4 text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              isRowGain ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                              isRowLoss ? 'bg-red-100 text-red-700 border border-red-200' :
                              'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {a.difference > 0 ? `+${a.difference}` : a.difference}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {total > 15 && (
                <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                  <p className="text-sm text-slate-500">Showing {Math.min((page - 1) * 15 + 1, total)} to {Math.min(page * 15, total)} of {total} Adjustments</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-xl h-9">Prev</Button>
                    <Button variant="outline" size="sm" disabled={page * 15 >= total} onClick={() => setPage((p) => p + 1)} className="rounded-xl h-9">Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Inventory Adjustment" size="md">
        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          
          <div className="space-y-4 bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <div>
              <Label className="mb-1.5 block">Product *</Label>
              <Select value={form.product} onChange={(e) => setForm((f) => ({ ...f, product: e.target.value }))} required className="w-full bg-white dark:bg-slate-900">
                <option value="">Select product to adjust...</option>
                {products.map((p) => <option key={p._id} value={p._id}>{p.SKU} - {p.name}</option>)}
              </Select>
            </div>
            
            <div>
              <Label className="mb-1.5 block">Warehouse Location *</Label>
              <Select value={form.warehouse} onChange={(e) => setForm((f) => ({ ...f, warehouse: e.target.value }))} required className="w-full bg-white dark:bg-slate-900">
                <option value="">Select warehouse...</option>
                {warehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col justify-center">
              <Label className="text-slate-500 mb-1">Current System Stock</Label>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {systemQuantity !== null ? systemQuantity : '-'}
              </div>
            </div>
            
            <div>
              <Label className="mb-1.5 block font-medium">New Physical Count *</Label>
              <Input 
                type="number" min={0} 
                value={form.countedQuantity} 
                onChange={(e) => setForm((f) => ({ ...f, countedQuantity: e.target.value }))} 
                required 
                className="w-full text-xl h-14 font-semibold"
                placeholder="0"
              />
            </div>
          </div>

          {difference !== null && difference !== 0 && (
            <div className={`p-3 rounded-lg border flex items-center justify-between ${
              isGain ? 'bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800/30 dark:text-emerald-400' :
              'bg-red-50 border-red-100 text-red-800 dark:bg-red-900/20 dark:border-red-800/30 dark:text-red-400'
            }`}>
              <span className="text-sm font-medium">Net Adjustment:</span>
              <span className="font-bold text-lg">{difference > 0 ? `+${difference}` : difference} units</span>
            </div>
          )}

          <div>
            <Label className="mb-1.5 block">Reason (Optional)</Label>
            <Input 
              value={form.reason} 
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} 
              placeholder="e.g. Shrinkage, damaged goods, found stock" 
              className="w-full"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="px-5 rounded-xl">Cancel</Button>
            <Button type="submit" disabled={saving || difference === 0} className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/30 px-6 rounded-xl">
              {saving ? 'Applying...' : 'Apply Adjustment'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
