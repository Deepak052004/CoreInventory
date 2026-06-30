import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, X, Search, CheckCircle } from 'lucide-react';
import { deliveriesApi, productsApi, warehousesApi, salesOrdersApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input, Label } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import BarcodeScanner from '../components/ui/BarcodeScanner';

export default function DeliveryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [salesOrder, setSalesOrder] = useState('');
  const [customer, setCustomer] = useState('');
  const [lines, setLines] = useState([{ product: '', quantity: 1, warehouse: '', lotIdentifier: '' }]);
  
  const [sos, setSOs] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  useEffect(() => {
    Promise.all([
      salesOrdersApi.getAll({ status: 'approved,partial', limit: 100 }).catch(() => ({ data: { data: [] } })),
      productsApi.getAll({ limit: 500 }).catch(() => ({ data: { data: [] } })),
      warehousesApi.getAll({ limit: 100 }).catch(() => ({ data: { data: [] } }))
    ]).then(([resSO, resP, resW]) => {
      setSOs(resSO.data.data);
      setProducts(resP.data.data);
      setWarehouses(resW.data.data);
    }).finally(() => {
      if (!isEdit) setLoading(false);
    });

    if (isEdit) {
      deliveriesApi.getOne(id).then((r) => {
        const d = r.data.data;
        if (d.status === 'done') {
          toast.error('Cannot edit a validated delivery');
          navigate('/deliveries');
          return;
        }
        setSalesOrder(d.salesOrder?._id || d.salesOrder || '');
        setCustomer(d.customer?._id || d.customer || '');
        setLines(d.lines?.length ? d.lines.map((l) => ({ 
          product: l.product?._id || l.product, 
          quantity: l.quantity, 
          warehouse: l.warehouse?._id || l.warehouse,
          lotIdentifier: l.lotIdentifier || ''
        })) : [{ product: '', quantity: 1, warehouse: '', lotIdentifier: '' }]);
      }).catch(() => toast.error('Failed to load delivery')).finally(() => setLoading(false));
    }
  }, [id, navigate, isEdit]);

  const handleSOSelect = async (soId) => {
    setSalesOrder(soId);
    if (!soId) return;
    
    // Auto-fill from SO
    try {
      const { data: { data: so } } = await salesOrdersApi.getOne(soId);
      setCustomer(so.customer?._id || '');
      
      const targetWarehouse = so.warehouse?._id || so.warehouse;
      
      const newLines = so.items
        .map(item => {
          const remaining = (item.requestedQty || 0) - (item.deliveredQty || 0);
          return {
            product: item.product?._id || item.product,
            quantity: remaining > 0 ? remaining : 0,
            warehouse: targetWarehouse || '',
            lotIdentifier: ''
          };
        })
        .filter(line => line.quantity > 0);
        
      if (newLines.length > 0) {
        setLines(newLines);
        toast.success('Auto-filled from Sales Order');
      } else {
        toast.error('This Sales Order has already been fully delivered.');
      }
    } catch (err) {
      toast.error('Failed to load SO details');
    }
  };

  const addLine = () => setLines((l) => [...l, { product: '', quantity: 1, warehouse: '', lotIdentifier: '' }]);
  const removeLine = (i) => setLines((l) => l.filter((_, idx) => idx !== i));
  const updateLine = (i, field, value) => setLines((l) => l.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)));

  const handleScan = (code) => {
    // Check if the scanned code matches a product SKU
    const product = products.find(p => p.SKU.toLowerCase() === code.toLowerCase());
    if (product) {
      const emptyIdx = lines.findIndex(l => !l.product);
      if (emptyIdx >= 0) {
        updateLine(emptyIdx, 'product', product._id);
        toast.success(`Scanned: ${product.name}`);
      } else {
        setLines((l) => [...l, { product: product._id, quantity: 1, warehouse: '', lotIdentifier: '' }]);
        toast.success(`Added: ${product.name}`);
      }
    } else {
      toast.error(`Unknown barcode: ${code}`);
    }
  };

  // Calculate available stock for a product in a selected warehouse
  const getAvailableStock = (productId, warehouseId) => {
    if (!productId || !warehouseId) return null;
    const prod = products.find(p => p._id === productId);
    if (!prod || !prod.stockLocations) return 0;
    
    const loc = prod.stockLocations.find(loc => loc.warehouse === warehouseId || (loc.warehouse && loc.warehouse._id === warehouseId));
    return loc ? (loc.quantity || 0) : 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validLines = lines.filter((l) => l.product && l.quantity > 0 && l.warehouse);
    
    if (!customer) return toast.error('Customer name is required');
    if (!validLines.length) return toast.error('Add at least one valid product line with a source warehouse');
    
    // Check if we have sufficient stock for validation warnings (backend will also enforce)
    for (const line of validLines) {
      const avail = getAvailableStock(line.product, line.warehouse);
      if (avail !== null && avail < line.quantity) {
        return toast.error(`Insufficient stock for one or more items in the selected warehouse. (Max: ${avail})`);
      }
    }

    setSaving(true);
    const payload = { 
      customer, 
      salesOrder: salesOrder || undefined,
      lines: validLines 
    };
    
    const promise = isEdit ? deliveriesApi.update(id, payload) : deliveriesApi.create(payload);
    promise.then(() => {
      toast.success(isEdit ? 'Delivery updated' : 'Delivery created');
      navigate('/deliveries');
    }).catch((err) => toast.error(err.response?.data?.message || 'Failed')).finally(() => setSaving(false));
  };

  const handleValidate = () => {
    if (!id) return;
    if (!window.confirm('Validate and process this delivery? Inventory will be deducted.')) return;
    
    setSaving(true);
    deliveriesApi.validate(id).then(() => {
      toast.success('Delivery validated and inventory deducted');
      navigate('/deliveries');
    }).catch((err) => toast.error(err.response?.data?.message || 'Validation failed')).finally(() => setSaving(false));
  };

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link to="/deliveries">
          <Button variant="ghost" size="sm" className="gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl">
            <ArrowLeft className="w-4 h-4" /> Back to Deliveries
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white ml-auto">{isEdit ? 'Edit Delivery Order' : 'New Delivery Order'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800 py-4 px-6">
            <h2 className="font-semibold text-slate-900 dark:text-white text-lg">General Information</h2>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="mb-1.5 block">Link to Sales Order</Label>
                <Select value={salesOrder} onChange={(e) => handleSOSelect(e.target.value)} disabled={isEdit} className="w-full">
                  <option value="">-- No SO (Manual Delivery) --</option>
                  {sos.map(so => <option key={so._id} value={so._id}>{so.soNumber} ({so.customer?.name})</option>)}
                </Select>
                <p className="text-xs text-slate-500 mt-1">Select an approved SO to auto-fill outbound items.</p>
              </div>
              <div>
                <Label className="mb-1.5 block">Customer / Destination *</Label>
                <Input value={customer} onChange={(e) => setCustomer(e.target.value)} required placeholder="Select SO or enter customer manually" className="w-full" disabled={!!salesOrder} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800 py-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="font-semibold text-slate-900 dark:text-white text-lg">Outbound Items *</h2>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <BarcodeScanner onScan={handleScan} placeholder="Scan SKU..." className="flex-1 min-w-[200px]" />
              <Button type="button" onClick={addLine} size="sm" className="gap-1.5 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white flex-shrink-0">
                <Plus className="w-4 h-4" /> Add Row
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left w-1/3">Product</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-left w-1/3">Source Warehouse</th>
                    <th className="px-4 py-3 text-left">Batch/Serial</th>
                    <th className="px-4 py-3 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {lines.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                        No items added yet. Click "Add Row" to start.
                      </td>
                    </tr>
                  )}
                  {lines.map((line, idx) => {
                    const avail = getAvailableStock(line.product, line.warehouse);
                    const isExceeding = avail !== null && line.quantity > avail;
                    const prodDetails = products.find(p => p._id === line.product);
                    const isTracked = prodDetails?.trackingType === 'batch' || prodDetails?.trackingType === 'serial';
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-4 py-3">
                          <Select value={line.product} onChange={(e) => updateLine(idx, 'product', e.target.value)} required className="w-full min-w-[200px]">
                            <option value="">Select product...</option>
                            {products.map((p) => (
                              <option key={p._id} value={p._id}>{p.name} ({p.SKU})</option>
                            ))}
                          </Select>
                        </td>
                        <td className="px-4 py-3">
                          <Input type="number" min="1" value={line.quantity} onChange={(e) => updateLine(idx, 'quantity', Number(e.target.value))} required className={`w-20 text-right ml-auto ${isExceeding ? 'border-red-500 text-red-600' : ''}`} />
                        </td>
                        <td className="px-4 py-3">
                          <Select value={line.warehouse} onChange={(e) => updateLine(idx, 'warehouse', e.target.value)} required className="w-full min-w-[200px]">
                            <option value="">Select source...</option>
                            {warehouses.map((w) => (
                              <option key={w._id} value={w._id}>{w.name}</option>
                            ))}
                          </Select>
                          {line.product && line.warehouse && (
                            <p className="text-xs mt-1 text-slate-500">Available: <span className="font-semibold text-slate-700 dark:text-slate-300">{avail}</span></p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Input value={line.lotIdentifier} onChange={(e) => updateLine(idx, 'lotIdentifier', e.target.value)} placeholder="Required if tracked" disabled={!isTracked} className={`w-full min-w-[120px] ${!isTracked ? 'bg-slate-50 opacity-50' : ''}`} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button type="button" variant="ghost" onClick={() => removeLine(idx)} className="h-8 w-8 !p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg">
                            <X className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pt-4">
          <Link to="/deliveries">
            <Button type="button" variant="outline" className="px-5">Cancel</Button>
          </Link>
          <Button type="submit" disabled={saving} className="bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 px-5">
            {saving ? 'Saving...' : 'Save Draft'}
          </Button>
          {isEdit && (
            <Button type="button" onClick={handleValidate} disabled={saving} className="gap-2 bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/30 px-5">
              <CheckCircle className="w-4 h-4" /> Validate & Process
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
