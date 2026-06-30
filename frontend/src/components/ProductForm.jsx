import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, X, Building2 } from 'lucide-react';
import { productsApi, warehousesApi } from '../services/api';
import { Button } from './ui/Button';
import { Input, Label } from './ui/Input';
import { Select } from './ui/Select';

export default function ProductForm({ productId, categories, onSave, onCancel }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [name, setName] = useState('');
  const [SKU, setSKU] = useState('');
  const [category, setCategory] = useState('');
  const [unitOfMeasure, setUnitOfMeasure] = useState('units');
  const [costPrice, setCostPrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [trackingType, setTrackingType] = useState('none');
  const [reorderLevel, setReorderLevel] = useState(0);
  
  const [stockLocations, setStockLocations] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  useEffect(() => {
    // Fetch warehouses to populate dropdowns
    warehousesApi.getAll().then((r) => setWarehouses(r.data.data)).catch(() => {});

    if (productId) {
      productsApi.getOne(productId).then((r) => {
        const p = r.data.data;
        setName(p.name);
        setSKU(p.SKU);
        setCategory(p.category?._id || p.category);
        setUnitOfMeasure(p.unitOfMeasure || 'units');
        setCostPrice(p.costPrice || 0);
        setSellingPrice(p.sellingPrice || 0);
        setTrackingType(p.trackingType || 'none');
        setReorderLevel(p.reorderLevel || 0);
        
        // Map backend stockLocations to local state
        if (p.stockLocations) {
          setStockLocations(p.stockLocations.map(sl => ({
            warehouse: sl.warehouse?._id || sl.warehouse,
            quantity: sl.quantity || 0,
            minStockLevel: sl.minStockLevel || 0,
            maxStockLevel: sl.maxStockLevel || 0
          })));
        }
      }).catch(() => toast.error('Failed to load product')).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [productId]);

  const addLocation = () => {
    setStockLocations([...stockLocations, { warehouse: '', quantity: 0, minStockLevel: 0, maxStockLevel: 0 }]);
  };

  const removeLocation = (index) => {
    setStockLocations(stockLocations.filter((_, i) => i !== index));
  };

  const updateLocation = (index, field, value) => {
    const updated = [...stockLocations];
    updated[index][field] = value;
    setStockLocations(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (stockLocations.some(l => !l.warehouse)) {
      return toast.error('Please select a warehouse for all stock locations');
    }

    setSaving(true);
    
    // Clean up payload
    const payload = {
      name, SKU, category, unitOfMeasure,
      trackingType,
      reorderLevel: Number(reorderLevel),
      costPrice: Number(costPrice),
      sellingPrice: Number(sellingPrice),
      stockLocations: stockLocations.map(l => ({
        warehouse: l.warehouse,
        quantity: Number(l.quantity),
        minStockLevel: Number(l.minStockLevel),
        maxStockLevel: l.maxStockLevel ? Number(l.maxStockLevel) : undefined
      }))
    };

    const promise = productId ? productsApi.update(productId, payload) : productsApi.create(payload);
    
    promise.then(() => {
      toast.success(productId ? 'Product updated' : 'Product created');
      onSave();
    }).catch((err) => toast.error(err.response?.data?.message || 'Failed')).finally(() => setSaving(false));
  };

  if (loading) return <div className="py-8 text-center text-slate-500 flex justify-center"><div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">Basic Info</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1" />
          </div>
          <div>
            <Label>SKU *</Label>
            <Input value={SKU} onChange={(e) => setSKU(e.target.value)} required disabled={!!productId} className="mt-1 font-mono text-sm" />
          </div>
          <div>
            <Label>Category *</Label>
            <Select value={category} onChange={(e) => setCategory(e.target.value)} required className="mt-1">
              <option value="">Select category...</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </Select>
          </div>
          <div>
            <Label>Unit of Measure</Label>
            <Input value={unitOfMeasure} onChange={(e) => setUnitOfMeasure(e.target.value)} placeholder="e.g. units, kg, boxes" className="mt-1" />
          </div>
        </div>
        
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2 mt-6">Pricing & Costing</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Cost Price</Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
              <Input type="number" min="0" step="0.01" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} required className="pl-7" />
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">Selling Price</Label>
            <Input type="number" min="0" step="0.01" value={sellingPrice} onChange={(e) => setSellingPrice(Number(e.target.value))} className="w-full" />
          </div>
          <div>
            <Label className="mb-1.5 block">Traceability</Label>
            <Select value={trackingType} onChange={(e) => setTrackingType(e.target.value)} className="w-full">
              <option value="none">No Tracking</option>
              <option value="batch">Batch Tracking</option>
              <option value="serial">Serial Number Tracking</option>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-500" /> Stock Locations
          </h3>
          <Button type="button" variant="outline" size="sm" onClick={addLocation} className="gap-1 h-8">
            <Plus className="w-3.5 h-3.5" /> Add Location
          </Button>
        </div>
        
        {stockLocations.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
            No stock locations assigned yet.
          </p>
        ) : (
          <div className="space-y-3">
            {stockLocations.map((loc, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 relative">
                <div className="flex-1">
                  <Label className="text-xs mb-1">Warehouse</Label>
                  <Select value={loc.warehouse} onChange={(e) => updateLocation(index, 'warehouse', e.target.value)} required className="h-9">
                    <option value="">Select warehouse...</option>
                    {warehouses.map((w) => (
                      <option key={w._id} value={w._id} disabled={stockLocations.some((sl, i) => sl.warehouse === w._id && i !== index)}>
                        {w.name} {w.code ? `(${w.code})` : ''}
                      </option>
                    ))}
                  </Select>
                </div>
                {!productId && (
                  <div className="w-full sm:w-24">
                    <Label className="text-xs mb-1">Initial Qty</Label>
                    <Input type="number" min="0" value={loc.quantity} onChange={(e) => updateLocation(index, 'quantity', e.target.value)} required className="h-9" />
                  </div>
                )}
                <div className="w-full sm:w-24">
                  <Label className="text-xs mb-1">Min Level</Label>
                  <Input type="number" min="0" value={loc.minStockLevel} onChange={(e) => updateLocation(index, 'minStockLevel', e.target.value)} className="h-9" />
                </div>
                <div className="w-full sm:w-24">
                  <Label className="text-xs mb-1">Max Level</Label>
                  <Input type="number" min="0" value={loc.maxStockLevel || ''} onChange={(e) => updateLocation(index, 'maxStockLevel', e.target.value)} placeholder="Opt" className="h-9" />
                </div>
                <button type="button" onClick={() => removeLocation(index)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-800 transition-colors shadow-sm">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
        <Button type="button" variant="secondary" onClick={onCancel} className="px-5">Cancel</Button>
        <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[100px] px-5">
          {saving ? 'Saving...' : 'Save Product'}
        </Button>
      </div>
    </form>
  );
}
