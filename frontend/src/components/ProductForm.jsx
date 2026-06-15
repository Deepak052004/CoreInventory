import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { productsApi } from '../services/api';
import { Button } from './ui/Button';
import { Input, Label } from './ui/Input';
import { Select } from './ui/Select';

export default function ProductForm({ productId, categories, onSave, onCancel }) {
  const [loading, setLoading] = useState(!!productId);
  const [name, setName] = useState('');
  const [SKU, setSKU] = useState('');
  const [category, setCategory] = useState('');
  const [unitOfMeasure, setUnitOfMeasure] = useState('units');
  const [stockQuantity, setStockQuantity] = useState(0);
  const [reorderLevel, setReorderLevel] = useState(0);

  useEffect(() => {
    if (!productId) return;
    productsApi.getOne(productId).then((r) => {
      const p = r.data.data;
      setName(p.name);
      setSKU(p.SKU);
      setCategory(p.category?._id || p.category);
      setUnitOfMeasure(p.unitOfMeasure || 'units');
      setStockQuantity(p.stockQuantity ?? 0);
      setReorderLevel(p.reorderLevel ?? 0);
    }).catch(() => toast.error('Failed to load product')).finally(() => setLoading(false));
  }, [productId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = { name, SKU, category, unitOfMeasure, stockQuantity: Number(stockQuantity), reorderLevel: Number(reorderLevel) };
    const promise = productId ? productsApi.update(productId, payload) : productsApi.create(payload);
    promise.then(() => {
      toast.success(productId ? 'Product updated' : 'Product created');
      onSave();
    }).catch((err) => toast.error(err.response?.data?.message || 'Failed')).finally(() => setLoading(false));
  };

  if (loading && productId) return <div className="py-8 text-center text-slate-500">Loading...</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <Label>SKU</Label>
        <Input value={SKU} onChange={(e) => setSKU(e.target.value)} required disabled={!!productId} />
      </div>
      <div>
        <Label>Category</Label>
        <Select value={category} onChange={(e) => setCategory(e.target.value)} required>
          <option value="">Select category</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Unit</Label>
          <Input value={unitOfMeasure} onChange={(e) => setUnitOfMeasure(e.target.value)} />
        </div>
        <div>
          <Label>Reorder level</Label>
          <Input type="number" min={0} value={reorderLevel} onChange={(e) => setReorderLevel(e.target.value)} />
        </div>
      </div>
      {!productId && (
        <div>
          <Label>Initial stock</Label>
          <Input type="number" min={0} value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} />
        </div>
      )}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
      </div>
    </form>
  );
}
