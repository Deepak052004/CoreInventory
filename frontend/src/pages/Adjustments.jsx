import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
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

  const fetch = () => {
    setLoading(true);
    adjustmentsApi.getAll({ page, limit: 15 }).then((r) => {
      setAdjustments(r.data.data);
      setTotal(r.data.total);
    }).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [page]);
  useEffect(() => {
    productsApi.getAll({ limit: 500 }).then((r) => setProducts(r.data.data)).catch(() => {});
    warehousesApi.getAll().then((r) => setWarehouses(r.data.data)).catch(() => {});
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.product || !form.warehouse || form.countedQuantity === '') return toast.error('Fill product, warehouse and counted quantity');
    setSaving(true);
    adjustmentsApi.create({
      product: form.product,
      warehouse: form.warehouse,
      countedQuantity: Number(form.countedQuantity),
      reason: form.reason,
    }).then(() => {
      toast.success('Adjustment applied');
      setModalOpen(false);
      setForm({ product: '', warehouse: '', countedQuantity: '', reason: '' });
      fetch();
    }).catch((err) => toast.error(err.response?.data?.message || 'Failed')).finally(() => setSaving(false));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Inventory Adjustments</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Reconcile physical count with system</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2"><Plus className="w-4 h-4" /> New Adjustment</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? <div className="p-12 text-center text-slate-500">Loading...</div> : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Product</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Warehouse</th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase">System</th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase">Counted</th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase">Difference</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {adjustments.map((a) => (
                      <tr key={a._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="px-6 py-4">{a.product?.name}</td>
                        <td className="px-6 py-4">{a.warehouse?.name}</td>
                        <td className="px-6 py-4 text-right">{a.systemQuantity}</td>
                        <td className="px-6 py-4 text-right">{a.countedQuantity}</td>
                        <td className="px-6 py-4 text-right font-medium">{a.difference >= 0 ? `+${a.difference}` : a.difference}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{new Date(a.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {total > 15 && (
                <div className="flex justify-between px-6 py-3 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-sm text-slate-500">Total {total}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
                    <Button variant="outline" size="sm" disabled={page * 15 >= total} onClick={() => setPage((p) => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Adjustment" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Product</Label>
            <Select value={form.product} onChange={(e) => setForm((f) => ({ ...f, product: e.target.value }))} required>
              <option value="">Select</option>
              {products.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.SKU}) - Stock: {p.stockQuantity ?? 0}</option>)}
            </Select>
          </div>
          <div>
            <Label>Warehouse</Label>
            <Select value={form.warehouse} onChange={(e) => setForm((f) => ({ ...f, warehouse: e.target.value }))} required>
              <option value="">Select</option>
              {warehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
            </Select>
          </div>
          <div>
            <Label>Counted quantity</Label>
            <Input type="number" min={0} value={form.countedQuantity} onChange={(e) => setForm((f) => ({ ...f, countedQuantity: e.target.value }))} required />
          </div>
          <div>
            <Label>Reason (optional)</Label>
            <Input value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Applying...' : 'Apply'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
