import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Package } from 'lucide-react';
import { productsApi } from '../services/api';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productsApi.getOne(id).then((r) => setProduct(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-300 border-t-emerald-500" /></div>;
  if (!product) return <div className="text-slate-500">Product not found.</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link to="/products"><Button variant="ghost" size="sm" className="gap-2"><ArrowLeft className="w-4 h-4" /> Back</Button></Link>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{product.name}</h1>
              <p className="font-mono text-sm text-slate-500">{product.SKU}</p>
            </div>
          </div>
          <Badge variant={product.stockQuantity <= 0 ? 'danger' : (product.stockQuantity <= (product.reorderLevel || 0) ? 'warning' : 'success')}>
            Stock: {product.stockQuantity ?? 0} {product.unitOfMeasure}
          </Badge>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Details</h3>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-slate-500">Category</dt><dd className="font-medium text-slate-900 dark:text-white">{product.category?.name}</dd></div>
              <div><dt className="text-slate-500">Unit</dt><dd className="font-medium">{product.unitOfMeasure}</dd></div>
              <div><dt className="text-slate-500">Reorder level</dt><dd className="font-medium">{product.reorderLevel ?? 0}</dd></div>
            </dl>
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Stock by location</h3>
            {product.stockByLocation?.length > 0 ? (
              <ul className="space-y-2">
                {product.stockByLocation.map((s, i) => (
                  <li key={i} className="flex justify-between text-sm">
                    <span>{s.warehouse?.name || s.warehouse}</span>
                    <span className="font-medium">{s.quantity} {s.locationName ? `(${s.locationName})` : ''}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No location breakdown</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
