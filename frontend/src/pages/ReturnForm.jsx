import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, X, ArrowLeft, Save } from 'lucide-react';
import { returnsApi, customersApi, suppliersApi, warehousesApi, productsApi, salesOrdersApi, purchaseOrdersApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input, Label } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card, CardContent, CardHeader } from '../components/ui/Card';

export default function ReturnForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  
  const [type, setType] = useState('inbound'); // 'inbound' or 'outbound'
  const [customer, setCustomer] = useState('');
  const [supplier, setSupplier] = useState('');
  const [salesOrder, setSalesOrder] = useState('');
  const [purchaseOrder, setPurchaseOrder] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState([{ product: '', quantity: 1, warehouse: '', reason: 'Defective/Unwanted', condition: 'unknown' }]);
  
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [sos, setSOs] = useState([]);
  const [pos, setPOs] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    Promise.all([
      customersApi.getAll({ limit: 100 }),
      suppliersApi.getAll({ limit: 100 }),
      salesOrdersApi.getAll({ status: 'completed,partial', limit: 100 }),
      purchaseOrdersApi.getAll({ status: 'completed,partial', limit: 100 }),
      warehousesApi.getAll({ limit: 100 }),
      productsApi.getAll({ limit: 500 })
    ]).then(([resC, resSup, resSO, resPO, resW, resP]) => {
      setCustomers(resC.data.data);
      setSuppliers(resSup.data.data);
      setSOs(resSO.data.data);
      setPOs(resPO.data.data);
      setWarehouses(resW.data.data);
      setProducts(resP.data.data);
    }).catch(() => toast.error('Failed to load form dependencies'));

    if (id) {
      returnsApi.getOne(id).then((r) => {
        const ret = r.data.data;
        if (ret.status !== 'draft') {
          toast.error('Only draft Returns can be edited');
          navigate(`/returns/${id}`);
          return;
        }
        setType(ret.type);
        setCustomer(ret.customer?._id || ret.customer || '');
        setSupplier(ret.supplier?._id || ret.supplier || '');
        setSalesOrder(ret.salesOrder?._id || ret.salesOrder || '');
        setPurchaseOrder(ret.purchaseOrder?._id || ret.purchaseOrder || '');
        setNotes(ret.notes || '');
        setLines(ret.lines.map(line => ({
          product: line.product?._id || line.product,
          quantity: line.quantity,
          warehouse: line.warehouse?._id || line.warehouse,
          reason: line.reason,
          condition: line.condition
        })));
      }).catch(() => toast.error('Failed to load Return')).finally(() => setLoading(false));
    }
  }, [id, navigate]);

  const addLine = () => setLines([...lines, { product: '', quantity: 1, warehouse: '', reason: 'Defective', condition: 'unknown' }]);
  const removeLine = (idx) => setLines(lines.filter((_, i) => i !== idx));
  const updateLine = (idx, field, val) => {
    const updated = [...lines];
    updated[idx][field] = val;
    setLines(updated);
  };

  const handleSOSync = async (soId) => {
    setSalesOrder(soId);
    if (!soId) return;
    const so = sos.find(s => s._id === soId);
    if (so) setCustomer(so.customer?._id || so.customer);
  };

  const handlePOSync = async (poId) => {
    setPurchaseOrder(poId);
    if (!poId) return;
    const po = pos.find(p => p._id === poId);
    if (po) setSupplier(po.supplier?._id || po.supplier);
  };

  const handleSubmit = (actionStatus) => {
    if (type === 'inbound' && !customer) return toast.error('Customer is required for inbound returns');
    if (type === 'outbound' && !supplier) return toast.error('Supplier is required for outbound returns');
    if (lines.length === 0) return toast.error('Please add at least one item');
    if (lines.some(l => !l.product || l.quantity < 1 || !l.warehouse)) return toast.error('Please complete all item fields (Product, Qty, Warehouse)');

    setSaving(true);
    const payload = {
      type,
      customer: type === 'inbound' ? customer : undefined,
      salesOrder: type === 'inbound' ? (salesOrder || undefined) : undefined,
      supplier: type === 'outbound' ? supplier : undefined,
      purchaseOrder: type === 'outbound' ? (purchaseOrder || undefined) : undefined,
      notes,
      lines,
      status: actionStatus
    };

    const promise = id ? returnsApi.update(id, payload) : returnsApi.create(payload);
    
    promise.then((res) => {
      toast.success('Return saved successfully');
      navigate(`/returns/${res.data.data._id}`);
    }).catch(err => toast.error(err.response?.data?.message || 'Failed to save Return')).finally(() => setSaving(false));
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-2 border-rose-500 border-t-transparent" /></div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link to="/returns">
          <Button variant="ghost" size="sm" className="gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl">
            <ArrowLeft className="w-4 h-4" /> Back to List
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white ml-auto">{id ? 'Edit Draft Return' : 'New Return Authorization'}</h1>
      </div>

      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800 py-4 px-6 flex flex-row items-center gap-4">
          <h2 className="font-semibold text-slate-900 dark:text-white text-lg">General Information</h2>
          {!id && (
            <div className="ml-auto flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button type="button" onClick={() => setType('inbound')} className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${type === 'inbound' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}>Inbound (RMA)</button>
              <button type="button" onClick={() => setType('outbound')} className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${type === 'outbound' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}>Outbound (RTV)</button>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {type === 'inbound' ? (
              <>
                <div>
                  <Label className="mb-1.5 block">Original Sales Order (Optional)</Label>
                  <Select value={salesOrder} onChange={(e) => handleSOSync(e.target.value)} className="w-full">
                    <option value="">No SO Link</option>
                    {sos.map(s => <option key={s._id} value={s._id}>{s.soNumber} ({s.customer?.name})</option>)}
                  </Select>
                </div>
                <div>
                  <Label className="mb-1.5 block">Customer *</Label>
                  <Select value={customer} onChange={(e) => setCustomer(e.target.value)} className="w-full" disabled={!!salesOrder}>
                    <option value="">Select Customer...</option>
                    {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </Select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label className="mb-1.5 block">Original Purchase Order (Optional)</Label>
                  <Select value={purchaseOrder} onChange={(e) => handlePOSync(e.target.value)} className="w-full">
                    <option value="">No PO Link</option>
                    {pos.map(p => <option key={p._id} value={p._id}>{p.poNumber} ({p.supplier?.name})</option>)}
                  </Select>
                </div>
                <div>
                  <Label className="mb-1.5 block">Supplier *</Label>
                  <Select value={supplier} onChange={(e) => setSupplier(e.target.value)} className="w-full" disabled={!!purchaseOrder}>
                    <option value="">Select Supplier...</option>
                    {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </Select>
                </div>
              </>
            )}

            <div className="md:col-span-2">
              <Label className="mb-1.5 block">Reason / Notes</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Explain the return..." className="w-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800 py-4 px-6 flex flex-row items-center justify-between">
          <h2 className="font-semibold text-slate-900 dark:text-white text-lg">Return Items *</h2>
          <Button type="button" onClick={addLine} size="sm" className="gap-1.5 h-8 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white">
            <Plus className="w-3.5 h-3.5" /> Add Row
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3 text-left w-1/4">Product</th>
                  <th className="px-6 py-3 text-right">Qty</th>
                  <th className="px-6 py-3 text-left w-1/4">Warehouse</th>
                  <th className="px-6 py-3 text-left">Condition</th>
                  <th className="px-6 py-3 text-left">Reason</th>
                  <th className="px-6 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {lines.length === 0 && (
                  <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500">No items added yet.</td></tr>
                )}
                {lines.map((line, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4">
                      <Select value={line.product} onChange={(e) => updateLine(idx, 'product', e.target.value)} className="w-full">
                        <option value="">Select product...</option>
                        {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                      </Select>
                    </td>
                    <td className="px-6 py-4">
                      <Input type="number" min="1" value={line.quantity} onChange={(e) => updateLine(idx, 'quantity', e.target.value)} className="text-right w-20 ml-auto" />
                    </td>
                    <td className="px-6 py-4">
                      <Select value={line.warehouse} onChange={(e) => updateLine(idx, 'warehouse', e.target.value)} className="w-full">
                        <option value="">Select target...</option>
                        {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                      </Select>
                    </td>
                    <td className="px-6 py-4">
                      <Select value={line.condition} onChange={(e) => updateLine(idx, 'condition', e.target.value)} className="w-full">
                        <option value="new">New / Resellable</option>
                        <option value="used">Used / Open Box</option>
                        <option value="damaged">Damaged / Scrap</option>
                        <option value="unknown">Unknown</option>
                      </Select>
                    </td>
                    <td className="px-6 py-4">
                      <Input value={line.reason} onChange={(e) => updateLine(idx, 'reason', e.target.value)} placeholder="Why?" className="w-full" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button type="button" variant="ghost" onClick={() => removeLine(idx)} className="h-8 w-8 !p-0 text-red-500 hover:bg-red-50 rounded-lg">
                        <X className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" onClick={() => handleSubmit('draft')} disabled={saving || lines.length === 0} className="gap-2">
          <Save className="w-4 h-4" /> Save as Draft
        </Button>
        <Button onClick={() => handleSubmit('pending_inspection')} disabled={saving || lines.length === 0} className="bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/30">
          Submit for Inspection
        </Button>
      </div>
    </div>
  );
}
