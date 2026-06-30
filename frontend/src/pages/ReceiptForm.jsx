import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, X, Search, CheckCircle } from 'lucide-react';
import { receiptsApi, purchaseOrdersApi, productsApi, warehousesApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input, Label } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import BarcodeScanner from '../components/ui/BarcodeScanner';

export default function ReceiptForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [poLink, setPoLink] = useState('');
  const [supplier, setSupplier] = useState('');
  const [lines, setLines] = useState([{ product: '', quantity: 1, warehouse: '', lotIdentifier: '', expiryDate: '' }]);
  
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  useEffect(() => {
    Promise.all([
      purchaseOrdersApi.getAll({ status: 'approved,partial', limit: 100 }).catch(() => ({ data: { data: [] } })), // Only fetch approved or partial POs
      productsApi.getAll({ limit: 500 }).catch(() => ({ data: { data: [] } })),
      warehousesApi.getAll({ limit: 100 }).catch(() => ({ data: { data: [] } }))
    ]).then(([resPO, resP, resW]) => {
      setProducts(resP.data.data);
      setWarehouses(resW.data.data);
    }).finally(() => {
      if (!isEdit) setLoading(false);
    });

    if (isEdit) {
      receiptsApi.getOne(id).then((r) => {
        const d = r.data.data;
        if (d.status === 'done') {
          toast.error('Cannot edit a validated receipt');
          navigate('/receipts');
          return;
        }
        setPoLink(r.data.data.purchaseOrder?._id || r.data.data.purchaseOrder || '');
        setSupplier(r.data.data.supplier);
        setLines(r.data.data.lines?.length ? r.data.data.lines.map((l) => ({ 
          product: l.product?._id || l.product, 
          quantity: l.quantity, 
          warehouse: l.warehouse?._id || l.warehouse,
          lotIdentifier: l.lotIdentifier || '',
          expiryDate: l.expiryDate ? l.expiryDate.split('T')[0] : ''
        })) : [{ product: '', quantity: 1, warehouse: '', lotIdentifier: '', expiryDate: '' }]);
      }).catch(() => toast.error('Failed to load receipt')).finally(() => setLoading(false));
    }
  }, [id, navigate, isEdit]);

  const handlePOSelect = async (poId) => {
    setPoLink(poId);
    if (!poId) return;
    
    // Auto-fill from PO
    try {
      const { data: { data: po } } = await purchaseOrdersApi.getOne(poId);
      setSupplier(po.supplier?.name || '');
      
      const targetWarehouse = po.warehouse?._id || po.warehouse;
      
      // Calculate remaining quantities
      const newLines = po.items
        .map(item => {
          const remaining = (item.requestedQty || 0) - (item.receivedQty || 0);
          return {
            product: item.product?._id || item.product,
            quantity: remaining > 0 ? remaining : 0,
            warehouse: targetWarehouse || '',
            lotIdentifier: '',
            expiryDate: ''
          };
        })
        .filter(line => line.quantity > 0); // Only add lines that still need receiving
        
      if (newLines.length > 0) {
        setLines(newLines);
        toast.success('Auto-filled from Purchase Order');
      } else {
        toast.error('This Purchase Order has already been fully received.');
      }
    } catch (err) {
      toast.error('Failed to load PO details');
    }
  };

  const addLine = () => setLines((l) => [...l, { product: '', quantity: 1, warehouse: '', lotIdentifier: '', expiryDate: '' }]);
  const removeLine = (i) => setLines((l) => l.filter((_, idx) => idx !== i));
  const updateLine = (i, field, value) => setLines((l) => l.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)));

  const handleScan = (code) => {
    // Check if the scanned code matches a product SKU
    const product = products.find(p => p.SKU.toLowerCase() === code.toLowerCase());
    if (product) {
      // Find if we already have an empty line, or create a new one
      const emptyIdx = lines.findIndex(l => !l.product);
      if (emptyIdx >= 0) {
        updateLine(emptyIdx, 'product', product._id);
        toast.success(`Scanned: ${product.name}`);
      } else {
        setLines((l) => [...l, { product: product._id, quantity: 1, warehouse: '', lotIdentifier: '', expiryDate: '' }]);
        toast.success(`Added: ${product.name}`);
      }
    } else {
      toast.error(`Unknown barcode: ${code}`);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validLines = lines.filter((l) => l.product && l.quantity > 0 && l.warehouse);
    
    if (!supplier) return toast.error('Supplier is required');
    if (!validLines.length) return toast.error('Add at least one valid product line with a warehouse');
    
    setSaving(true);
    const payload = { 
      supplier, 
      purchaseOrder: poLink || undefined,
      lines: validLines 
    };
    
    const promise = isEdit ? receiptsApi.update(id, payload) : receiptsApi.create(payload);
    promise.then(() => {
      toast.success(isEdit ? 'Receipt updated' : 'Receipt created');
      navigate('/receipts');
    }).catch((err) => toast.error(err.response?.data?.message || 'Failed')).finally(() => setSaving(false));
  };

  const handleValidate = () => {
    if (!id) return;
    if (!window.confirm('Validate and process this receipt? Inventory will be updated.')) return;
    
    setSaving(true);
    receiptsApi.validate(id).then(() => {
      toast.success('Receipt validated and inventory updated');
      navigate('/receipts');
    }).catch((err) => toast.error(err.response?.data?.message || 'Validation failed')).finally(() => setSaving(false));
  };

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link to="/receipts">
          <Button variant="ghost" size="sm" className="gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl">
            <ArrowLeft className="w-4 h-4" /> Back to Receipts
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white ml-auto">{isEdit ? 'Edit Goods Receipt' : 'New Goods Receipt'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800 py-4 px-6">
            <h2 className="font-semibold text-slate-900 dark:text-white text-lg">General Information</h2>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="mb-1.5 block">Link to Purchase Order</Label>
                <Select value={poLink} onChange={(e) => handlePOSelect(e.target.value)} disabled={isEdit} className="w-full">
                  <option value="">-- No PO (Manual Receipt) --</option>
                </Select>
                <p className="text-xs text-slate-500 mt-1">Select an approved PO to auto-fill items and target warehouse.</p>
              </div>
              <div>
                <Label className="mb-1.5 block">Supplier / Vendor Name *</Label>
                <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} required placeholder="e.g. Acme Corp" className="w-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800 py-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="font-semibold text-slate-900 dark:text-white text-lg">Inbound Items *</h2>
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
                    <th className="px-4 py-3 text-left w-1/4">Product</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-left w-1/4">Warehouse</th>
                    <th className="px-4 py-3 text-left">Batch/Serial</th>
                    <th className="px-4 py-3 text-left">Expiry (Opt)</th>
                    <th className="px-4 py-3 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {lines.map((line, idx) => {
                    const prodDetails = products.find(p => p._id === line.product);
                    const isTracked = prodDetails?.trackingType === 'batch' || prodDetails?.trackingType === 'serial';
                    return (
                    <tr key={idx}>
                      <td className="px-4 py-3">
                        <Select value={line.product} onChange={(e) => updateLine(idx, 'product', e.target.value)} required className="w-full min-w-[200px]">
                          <option value="">Select product...</option>
                          {products.map((p) => (
                            <option key={p._id} value={p._id}>{p.name} ({p.SKU})</option>
                          ))}
                        </Select>
                      </td>
                      <td className="px-4 py-3">
                        <Input type="number" min="1" value={line.quantity} onChange={(e) => updateLine(idx, 'quantity', e.target.value)} required className="w-20 text-right ml-auto" />
                      </td>
                      <td className="px-4 py-3">
                        <Select value={line.warehouse} onChange={(e) => updateLine(idx, 'warehouse', e.target.value)} required className="w-full min-w-[150px]">
                          <option value="">Select target...</option>
                          {warehouses.map((w) => (
                            <option key={w._id} value={w._id}>{w.name}</option>
                          ))}
                        </Select>
                      </td>
                      <td className="px-4 py-3">
                        <Input value={line.lotIdentifier} onChange={(e) => updateLine(idx, 'lotIdentifier', e.target.value)} placeholder="If required" disabled={!isTracked} className={`w-full min-w-[120px] ${!isTracked ? 'bg-slate-50 opacity-50' : ''}`} />
                      </td>
                      <td className="px-4 py-3">
                        <Input type="date" value={line.expiryDate} onChange={(e) => updateLine(idx, 'expiryDate', e.target.value)} disabled={prodDetails?.trackingType !== 'batch'} className={`w-full min-w-[130px] ${prodDetails?.trackingType !== 'batch' ? 'bg-slate-50 opacity-50' : ''}`} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button type="button" variant="ghost" onClick={() => removeLine(idx)} className="h-8 w-8 !p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg">
                          <X className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pt-4">
          <Link to="/receipts">
            <Button type="button" variant="outline" className="px-5">Cancel</Button>
          </Link>
          <Button type="submit" disabled={saving} className="bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 px-5">
            {saving ? 'Saving...' : 'Save Draft'}
          </Button>
          {isEdit && (
            <Button type="button" onClick={handleValidate} disabled={saving} className="gap-2 bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/30 px-5">
              <CheckCircle className="w-4 h-4" /> Validate & Process
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
