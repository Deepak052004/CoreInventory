import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Package, MapPin, AlertTriangle, CheckCircle, BarChart3, Building2 } from 'lucide-react';
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

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!product) return <div className="text-center py-16 text-slate-500 text-lg">Product not found.</div>;

  const totalStock = product.totalStock || 0;
  
  const getOverallStatus = () => {
    if (totalStock <= 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-700 border-red-200' };
    const anyBelowMin = product.stockLocations?.some(l => l.quantity <= (l.minStockLevel || 0));
    if (anyBelowMin) return { label: 'Low Stock Alert', color: 'bg-amber-100 text-amber-700 border-amber-200' };
    return { label: 'In Stock', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
  };

  const status = getOverallStatus();

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link to="/products">
          <Button variant="ghost" size="sm" className="gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl">
            <ArrowLeft className="w-4 h-4" /> Back to Products
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Header / Summary Card */}
        <Card className="md:col-span-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <CardHeader className="p-6 md:p-8 flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-200 dark:border-slate-700 shrink-0 shadow-inner">
                <Package className="w-8 h-8 text-emerald-500" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1.5">{product.name}</h1>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">{product.SKU}</span>
                  <span className="text-slate-300 dark:text-slate-600">&bull;</span>
                  <span className="font-medium text-slate-600 dark:text-slate-300">{product.category?.name || 'Uncategorized'}</span>
                  <span className="text-slate-300 dark:text-slate-600">&bull;</span>
                  <span className="text-slate-500 dark:text-slate-400">Unit: {product.unitOfMeasure}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-start md:items-end gap-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 min-w-[200px]">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" /> Total Global Stock
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{totalStock.toLocaleString()}</span>
                <span className="text-sm font-medium text-slate-500">{product.unitOfMeasure}</span>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border mt-1 ${status.color}`}>
                {status.label}
              </span>
            </div>
          </CardHeader>
        </Card>

        {/* Multi-Warehouse Stock Breakdown */}
        <Card className="md:col-span-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 py-4 px-6 flex flex-row items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-500" /> Location Breakdown
            </h3>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
              {product.stockLocations?.length || 0} Locations
            </span>
          </CardHeader>
          <CardContent className="p-0">
            {(!product.stockLocations || product.stockLocations.length === 0) ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                <MapPin className="w-10 h-10 mb-3 opacity-30" />
                <p>No inventory locations configured for this product.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800">
                {product.stockLocations.map((loc, idx) => {
                  const qty = loc.quantity || 0;
                  const min = loc.minStockLevel || 0;
                  const isLow = qty <= min;
                  
                  return (
                    <div key={idx} className="p-6 relative group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-white text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {loc.warehouse?.name || 'Unknown Warehouse'}
                          </h4>
                          {loc.warehouse?.code && <p className="text-xs font-mono text-slate-400">{loc.warehouse.code}</p>}
                        </div>
                        {isLow ? (
                          <AlertTriangle className="w-5 h-5 text-amber-500" title="Low Stock" />
                        ) : (
                          <CheckCircle className="w-5 h-5 text-emerald-500 opacity-50" />
                        )}
                      </div>
                      
                      <div className="flex items-end gap-2 mb-4">
                        <span className={`text-4xl font-bold tracking-tight ${isLow ? 'text-amber-600 dark:text-amber-500' : 'text-slate-800 dark:text-slate-100'}`}>
                          {qty.toLocaleString()}
                        </span>
                        <span className="text-sm font-medium text-slate-500 mb-1">{product.unitOfMeasure}</span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-2.5 border border-slate-200 dark:border-slate-700">
                          <span className="block text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Min Level</span>
                          <span className="font-mono text-slate-700 dark:text-slate-300">{min}</span>
                        </div>
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-2.5 border border-slate-200 dark:border-slate-700">
                          <span className="block text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Max Level</span>
                          <span className="font-mono text-slate-700 dark:text-slate-300">{loc.maxStockLevel ? loc.maxStockLevel : '—'}</span>
                        </div>
                      </div>
                      
                      {isLow && (
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-amber-500" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
