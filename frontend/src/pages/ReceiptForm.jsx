import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { receiptsApi, productsApi, warehousesApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input, Label } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card, CardContent, CardHeader } from '../components/ui/Card';

export default function ReceiptForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [supplier, setSupplier] = useState('');
  const [lines, setLines] = useState([{ product: '', quantity: 1, warehouse: '', locationName: '' }]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  useEffect(() => {
    productsApi.getAll({ limit: 500 }).then((r) => setProducts(r.data.data)).catch(() => {});
    warehousesApi.getAll().then((r) => setWarehouses(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    receiptsApi.getOne(id).then((r) => {
      const d = r.data.data;
      setSupplier(d.supplier);
      setLines(d.lines?.length ? d.lines.map((l) => ({ product: l.product?._id || l.product, quantity: l.quantity, warehouse: l.warehouse?._id || l.warehouse, locationName: l.locationName || '' })) : [{ product: '', quantity: 1, warehouse: '', locationName: '' }]);
    }).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, [id]);

  const addLine = () => setLines((l) => [...l, { product: '', quantity: 1, warehouse: '', locationName: '' }]);
  const removeLine = (i) => setLines((l) => l.filter((_, idx) => idx !== i));
  const updateLine = (i, field, value) => setLines((l) => l.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { supplier, lines: lines.filter((l) => l.product && l.quantity > 0 && l.warehouse) };
    if (!payload.lines.length) return toast.error('Add at least one product line');
    setSaving(true);
    const promise = isEdit ? receiptsApi.update(id, payload) : receiptsApi.create(payload);
    promise.then(() => {
      toast.success(isEdit ? 'Receipt updated' : 'Receipt created');
      navigate('/receipts');
    }).catch((err) => toast.error(err.response?.data?.message || 'Failed')).finally(() => setSaving(false));
  };

  const handleValidate = () => {
    if (!id) return;
    setSaving(true);
    receiptsApi.validate(id).then(() => {
      toast.success('Receipt validated');
      navigate('/receipts');
    }).catch((err) => toast.error(err.response?.data?.message || 'Failed')).finally(() => setSaving(false));
  };

  if (loading && isEdit) return <div className="py-12 text-center text-slate-500">Loading...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link to="/receipts"><Button variant="ghost" size="sm" className="gap-2"><ArrowLeft className="w-4 h-4" /> Back</Button></Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{isEdit ? 'Edit Receipt' : 'New Receipt'}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader><h2 className="font-semibold">Header</h2></CardHeader>
          <CardContent>
            <Label>Supplier</Label>
            <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} required />
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader className="flex flex-row justify-between items-center">
            <h2 className="font-semibold">Lines</h2>
            <Button type="button" variant="outline" size="sm" onClick={addLine}>+ Add line</Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Product</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Quantity</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Warehouse</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Location</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {lines.map((line, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2">
                        <Select value={line.product} onChange={(e) => updateLine(i, 'product', e.target.value)} required>
                          <option value="">Select</option>
                          {products.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.SKU})</option>)}
                        </Select>
                      </td>
                      <td className="px-4 py-2"><Input type="number" min={1} value={line.quantity} onChange={(e) => updateLine(i, 'quantity', Number(e.target.value))} className="w-24" /></td>
                      <td className="px-4 py-2">
                        <Select value={line.warehouse} onChange={(e) => updateLine(i, 'warehouse', e.target.value)} required>
                          <option value="">Select</option>
                          {warehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
                        </Select>
                      </td>
                      <td className="px-4 py-2"><Input value={line.locationName} onChange={(e) => updateLine(i, 'locationName', e.target.value)} placeholder="Rack/Location" /></td>
                      <td className="px-4 py-2"><Button type="button" variant="ghost" size="sm" className="!p-2 text-red-600" onClick={() => removeLine(i)}>×</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          {isEdit && <Button type="button" variant="secondary" onClick={handleValidate} disabled={saving}>Validate receipt</Button>}
          <Link to="/receipts"><Button type="button" variant="outline">Cancel</Button></Link>
        </div>
      </form>
    </div>
  );
}
