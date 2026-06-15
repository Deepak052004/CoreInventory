import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { transfersApi, productsApi, warehousesApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input, Label } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card, CardContent, CardHeader } from '../components/ui/Card';

export default function TransferForm() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [sourceWarehouse, setSourceWarehouse] = useState('');
  const [sourceLocationName, setSourceLocationName] = useState('');
  const [destinationWarehouse, setDestinationWarehouse] = useState('');
  const [destinationLocationName, setDestinationLocationName] = useState('');
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  useEffect(() => {
    productsApi.getAll({ limit: 500 }).then((r) => setProducts(r.data.data)).catch(() => {});
    warehousesApi.getAll().then((r) => setWarehouses(r.data.data)).catch(() => {});
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!product || quantity < 1 || !sourceWarehouse || !destinationWarehouse) {
      return toast.error('Fill product, quantity, source and destination warehouse');
    }
    if (sourceWarehouse === destinationWarehouse) return toast.error('Source and destination must differ');
    setSaving(true);
    transfersApi.create({
      product,
      quantity: Number(quantity),
      sourceWarehouse,
      sourceLocationName,
      destinationWarehouse,
      destinationLocationName,
      status: 'draft',
    }).then(() => {
      toast.success('Transfer created');
      navigate('/transfers');
    }).catch((err) => toast.error(err.response?.data?.message || 'Failed')).finally(() => setSaving(false));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link to="/transfers"><Button variant="ghost" size="sm" className="gap-2"><ArrowLeft className="w-4 h-4" /> Back</Button></Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">New Internal Transfer</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="max-w-xl">
          <CardHeader><h2 className="font-semibold">Transfer details</h2></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Product</Label>
              <Select value={product} onChange={(e) => setProduct(e.target.value)} required>
                <option value="">Select product</option>
                {products.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.SKU})</option>)}
              </Select>
            </div>
            <div>
              <Label>Quantity</Label>
              <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} required />
            </div>
            <div>
              <Label>Source warehouse</Label>
              <Select value={sourceWarehouse} onChange={(e) => setSourceWarehouse(e.target.value)} required>
                <option value="">Select</option>
                {warehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
              </Select>
            </div>
            <div>
              <Label>Source location (optional)</Label>
              <Input value={sourceLocationName} onChange={(e) => setSourceLocationName(e.target.value)} placeholder="e.g. A1" />
            </div>
            <div>
              <Label>Destination warehouse</Label>
              <Select value={destinationWarehouse} onChange={(e) => setDestinationWarehouse(e.target.value)} required>
                <option value="">Select</option>
                {warehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
              </Select>
            </div>
            <div>
              <Label>Destination location (optional)</Label>
              <Input value={destinationLocationName} onChange={(e) => setDestinationLocationName(e.target.value)} placeholder="e.g. B1" />
            </div>
          </CardContent>
        </Card>
        <div className="flex gap-2 mt-6">
          <Button type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create transfer'}</Button>
          <Link to="/transfers"><Button type="button" variant="outline">Cancel</Button></Link>
        </div>
      </form>
    </div>
  );
}
