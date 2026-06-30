import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowRight, ArrowLeftRight } from 'lucide-react';
import { transfersApi, productsApi, warehousesApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input, Label } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card, CardContent, CardHeader } from '../components/ui/Card';

export default function TransferForm() {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [product, setProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [sourceWarehouse, setSourceWarehouse] = useState('');
  const [destinationWarehouse, setDestinationWarehouse] = useState('');
  
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [availableStock, setAvailableStock] = useState(null);

  useEffect(() => {
    Promise.all([
      productsApi.getAll({ limit: 500 }).catch(() => ({ data: { data: [] } })),
      warehousesApi.getAll({ limit: 100 }).catch(() => ({ data: { data: [] } }))
    ]).then(([resP, resW]) => {
      setProducts(resP.data.data);
      setWarehouses(resW.data.data);
    }).finally(() => setLoading(false));
  }, []);

  // Recalculate available stock when product or source warehouse changes
  useEffect(() => {
    if (!product || !sourceWarehouse) {
      setAvailableStock(null);
      return;
    }
    
    const selectedProd = products.find(p => p._id === product);
    if (selectedProd && selectedProd.stockLocations) {
      const loc = selectedProd.stockLocations.find(l => l.warehouse === sourceWarehouse || (l.warehouse && l.warehouse._id === sourceWarehouse));
      setAvailableStock(loc ? (loc.quantity || 0) : 0);
    } else {
      setAvailableStock(0);
    }
  }, [product, sourceWarehouse, products]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!product || quantity < 1 || !sourceWarehouse || !destinationWarehouse) {
      return toast.error('Please complete all required fields');
    }
    
    if (sourceWarehouse === destinationWarehouse) {
      return toast.error('Source and destination warehouses cannot be the same');
    }
    
    if (availableStock !== null && quantity > availableStock) {
      return toast.error(`Insufficient stock at source warehouse. Max available: ${availableStock}`);
    }

    setSaving(true);
    transfersApi.create({
      product,
      quantity: Number(quantity),
      sourceWarehouse,
      destinationWarehouse,
      status: 'scheduled', // Automatically schedule it
    }).then(() => {
      toast.success('Internal Transfer Created & Scheduled');
      navigate('/transfers');
    }).catch((err) => toast.error(err.response?.data?.message || 'Failed to create transfer')).finally(() => setSaving(false));
  };

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>;

  const isExceeding = availableStock !== null && quantity > availableStock;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link to="/transfers">
          <Button variant="ghost" size="sm" className="gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl">
            <ArrowLeft className="w-4 h-4" /> Back to Transfers
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white ml-auto">Schedule Transfer</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800 py-5 px-6">
            <h2 className="font-semibold text-slate-900 dark:text-white text-lg flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-teal-600" /> Transfer Configuration
            </h2>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 space-y-8">
            
            {/* Product & Qty */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-slate-50 dark:bg-slate-800/30 p-5 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="sm:col-span-2">
                <Label className="mb-2 block font-medium">Product to Transfer *</Label>
                <Select value={product} onChange={(e) => setProduct(e.target.value)} required className="w-full bg-white dark:bg-slate-900">
                  <option value="">Search and select product...</option>
                  {products.map((p) => <option key={p._id} value={p._id}>{p.SKU} - {p.name}</option>)}
                </Select>
              </div>
              <div>
                <Label className="mb-2 block font-medium">Transfer Quantity *</Label>
                <Input 
                  type="number" min="1" 
                  value={quantity} 
                  onChange={(e) => setQuantity(Number(e.target.value))} 
                  required 
                  className={`w-full bg-white dark:bg-slate-900 text-lg ${isExceeding ? 'border-red-500 text-red-600 focus:ring-red-500' : ''}`} 
                />
              </div>
            </div>

            {/* Routing */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
              
              {/* Source */}
              <div className="flex-1 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative">
                <div className="absolute -top-3 left-4 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-sm">
                  From Source
                </div>
                <Select value={sourceWarehouse} onChange={(e) => setSourceWarehouse(e.target.value)} required className="w-full mt-2 border-transparent bg-slate-50 dark:bg-slate-800">
                  <option value="">Select source warehouse...</option>
                  {warehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
                </Select>
                
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-sm">
                  <span className="text-slate-500">Available Stock:</span>
                  {availableStock === null ? (
                    <span className="text-slate-400 italic">Select product & source</span>
                  ) : (
                    <span className={`font-bold ${isExceeding ? 'text-red-500' : 'text-teal-600'}`}>{availableStock}</span>
                  )}
                </div>
              </div>

              {/* Arrow */}
              <div className="hidden md:flex flex-col items-center justify-center p-2 text-slate-300 dark:text-slate-600">
                <ArrowRight className="w-8 h-8" />
              </div>

              {/* Destination */}
              <div className="flex-1 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative">
                <div className="absolute -top-3 left-4 bg-teal-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-sm">
                  To Destination
                </div>
                <Select value={destinationWarehouse} onChange={(e) => setDestinationWarehouse(e.target.value)} required className="w-full mt-2 border-transparent bg-slate-50 dark:bg-slate-800">
                  <option value="">Select destination warehouse...</option>
                  {warehouses.map((w) => (
                    <option key={w._id} value={w._id} disabled={w._id === sourceWarehouse}>
                      {w.name} {w._id === sourceWarehouse ? '(Source)' : ''}
                    </option>
                  ))}
                </Select>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-sm">
                  <span className="text-slate-500">Status:</span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Ready to receive</span>
                </div>
              </div>

            </div>

          </CardContent>
        </Card>
        
        <div className="flex justify-end gap-3 pt-2">
          <Link to="/transfers">
            <Button type="button" variant="outline" className="px-5 rounded-xl">Cancel</Button>
          </Link>
          <Button type="submit" disabled={saving || isExceeding} className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-500/30 px-6 rounded-xl">
            {saving ? 'Processing...' : 'Schedule Transfer'}
          </Button>
        </div>
      </form>
    </div>
  );
}
