import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, X, ArrowLeft, Save, Send } from 'lucide-react';
import { salesOrdersApi, customersApi, warehousesApi, productsApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input, Label } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card, CardContent, CardHeader } from '../components/ui/Card';

export default function SalesOrderForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  
  const [customer, setCustomer] = useState('');
  const [warehouse, setWarehouse] = useState('');
  const [expectedShipDate, setExpectedShipDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([]);
  
  const [customers, setCustomers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    Promise.all([
      customersApi.getAll({ limit: 100 }),
      warehousesApi.getAll({ limit: 100 }),
      productsApi.getAll({ limit: 500 })
    ]).then(([resC, resW, resP]) => {
      setCustomers(resC.data.data);
      setWarehouses(resW.data.data);
      setProducts(resP.data.data);
    }).catch(() => toast.error('Failed to load form dependencies'));

    if (id) {
      salesOrdersApi.getOne(id).then((r) => {
        const so = r.data.data;
        if (so.status !== 'draft') {
          toast.error('Only draft SOs can be edited');
          navigate(`/sales-orders/${id}`);
          return;
        }
        setCustomer(so.customer?._id || so.customer);
        setWarehouse(so.warehouse?._id || so.warehouse || '');
        setExpectedShipDate(so.expectedShipDate ? so.expectedShipDate.split('T')[0] : '');
        setNotes(so.notes || '');
        setItems(so.items.map(item => ({
          product: item.product?._id || item.product,
          requestedQty: item.requestedQty,
          unitPrice: item.unitPrice
        })));
      }).catch(() => toast.error('Failed to load SO')).finally(() => setLoading(false));
    }
  }, [id, navigate]);

  const addItem = () => setItems([...items, { product: '', requestedQty: 1, unitPrice: 0 }]);
  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx, field, val) => {
    const updated = [...items];
    updated[idx][field] = val;
    setItems(updated);
  };
  
  const autoFillPrice = (idx, productId) => {
    updateItem(idx, 'product', productId);
    if (!productId) return;
    const prod = products.find(p => p._id === productId);
    if (prod && prod.sellingPrice) {
      updateItem(idx, 'unitPrice', prod.sellingPrice);
    }
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (Number(item.requestedQty || 0) * Number(item.unitPrice || 0)), 0);
  };

  const handleSubmit = (action) => {
    if (!customer) return toast.error('Please select a customer');
    if (items.length === 0) return toast.error('Please add at least one item');
    if (items.some(i => !i.product || i.requestedQty < 1 || i.unitPrice < 0)) return toast.error('Please complete all item rows correctly');

    setSaving(true);
    const payload = {
      customer,
      warehouse: warehouse || undefined,
      expectedShipDate: expectedShipDate || undefined,
      notes,
      items: items.map(i => ({
        product: i.product,
        requestedQty: Number(i.requestedQty),
        unitPrice: Number(i.unitPrice)
      })),
      status: action // 'draft' or 'submitted'
    };

    const promise = id ? salesOrdersApi.update(id, payload) : salesOrdersApi.create(payload);
    
    promise.then((res) => {
      toast.success(`SO successfully ${action === 'submitted' ? 'submitted' : 'saved as draft'}`);
      navigate(`/sales-orders/${res.data.data._id}`);
    }).catch(err => toast.error(err.response?.data?.message || 'Failed to save SO')).finally(() => setSaving(false));
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-2 border-sky-500 border-t-transparent" /></div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link to="/sales-orders">
          <Button variant="ghost" size="sm" className="gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl">
            <ArrowLeft className="w-4 h-4" /> Back to List
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white ml-auto">{id ? 'Edit Draft SO' : 'Create Sales Order'}</h1>
      </div>

      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800 py-4 px-6">
          <h2 className="font-semibold text-slate-900 dark:text-white text-lg">General Information</h2>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="mb-1.5 block">Customer *</Label>
              <Select value={customer} onChange={(e) => setCustomer(e.target.value)} className="w-full">
                <option value="">Select Customer...</option>
                {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Default Source Warehouse (Optional)</Label>
              <Select value={warehouse} onChange={(e) => setWarehouse(e.target.value)} className="w-full">
                <option value="">Any / Will assign later...</option>
                {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Expected Ship Date</Label>
              <Input type="date" value={expectedShipDate} onChange={(e) => setExpectedShipDate(e.target.value)} className="w-full" />
            </div>
            <div>
              <Label className="mb-1.5 block">Notes / Reference</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes for fulfillment" className="w-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800 py-4 px-6 flex flex-row items-center justify-between">
          <h2 className="font-semibold text-slate-900 dark:text-white text-lg">Line Items *</h2>
          <Button type="button" onClick={addItem} size="sm" className="gap-1.5 h-8 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white">
            <Plus className="w-3.5 h-3.5" /> Add Row
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3 text-left w-2/5">Product</th>
                  <th className="px-6 py-3 text-right">Quantity</th>
                  <th className="px-6 py-3 text-right">Unit Price</th>
                  <th className="px-6 py-3 text-right">Line Total</th>
                  <th className="px-6 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                      No items added yet. Click "Add Row" to start.
                    </td>
                  </tr>
                )}
                {items.map((item, idx) => {
                  const lineTotal = Number(item.requestedQty || 0) * Number(item.unitPrice || 0);
                  return (
                    <tr key={idx}>
                      <td className="px-6 py-4">
                        <Select value={item.product} onChange={(e) => autoFillPrice(idx, e.target.value)} className="w-full">
                          <option value="">Select product...</option>
                          {products.map(p => <option key={p._id} value={p._id}>{p.SKU} - {p.name}</option>)}
                        </Select>
                      </td>
                      <td className="px-6 py-4">
                        <Input type="number" min="1" value={item.requestedQty} onChange={(e) => updateItem(idx, 'requestedQty', e.target.value)} className="text-right" />
                      </td>
                      <td className="px-6 py-4">
                        <Input type="number" min="0" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)} className="text-right" />
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-700 dark:text-slate-300">
                        ${lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button type="button" variant="ghost" onClick={() => removeItem(idx)} className="h-8 w-8 !p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                          <X className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {items.length > 0 && (
                <tfoot className="bg-slate-50 dark:bg-slate-800/30">
                  <tr>
                    <td colSpan="3" className="px-6 py-4 text-right text-sm font-semibold text-slate-500 uppercase tracking-wider">Estimated Subtotal:</td>
                    <td className="px-6 py-4 text-right text-lg font-bold text-slate-900 dark:text-white">
                      ${calculateSubtotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" onClick={() => handleSubmit('draft')} disabled={saving || items.length === 0} className="gap-2">
          <Save className="w-4 h-4" /> Save as Draft
        </Button>
        <Button onClick={() => handleSubmit('submitted')} disabled={saving || items.length === 0} className="gap-2 bg-sky-600 hover:bg-sky-700 text-white shadow-lg shadow-sky-500/30">
          <Send className="w-4 h-4" /> Submit for Approval
        </Button>
      </div>
    </div>
  );
}
