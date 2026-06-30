import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PackagePlus, Search, SlidersHorizontal, Package, Download, Upload, Eye, Pencil, Trash2 } from 'lucide-react';
import { productsApi, categoriesApi } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import { downloadCSV } from '../utils/csvExport';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import ProductForm from '../components/ProductForm';
import LabelPrintModal from '../components/ui/LabelPrintModal';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', category: '' });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  
  const debouncedSearch = useDebounce(filters.search, 500);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printProduct, setPrintProduct] = useState(null);

  const fetchProducts = () => {
    setLoading(true);
    const params = { page, limit: 10 };
    if (filters.search) params.search = filters.search;
    if (filters.category) params.category = filters.category;
    productsApi.getAll(params).then((r) => {
      setProducts(r.data.data);
      setTotal(r.data.total);
    }).catch(() => toast.error('Failed to load products')).finally(() => setLoading(false));
  };

  useEffect(() => {
    categoriesApi.getAll().then((r) => setCategories(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [page, debouncedSearch, filters.category]);

  const handleDelete = (id) => {
    if (!window.confirm('Delete this product?')) return;
    productsApi.delete(id).then(() => {
      toast.success('Product deleted');
      fetchProducts();
    }).catch(() => toast.error('Delete failed'));
  };

  const handleSave = () => {
    setModalOpen(false);
    setEditingId(null);
    fetchProducts();
  };

  const getStockStatus = (p) => {
    if (p.totalStock <= 0) return 'danger';
    const anyBelowMin = p.stockLocations?.some(l => l.quantity <= l.minStockLevel);
    if (anyBelowMin) return 'warning';
    return 'success';
  };

  const handleExport = async () => {
    if (!products.length) return toast.error('No data to export');
    try {
      const data = products.map(p => ({
        'SKU': p.SKU,
        'Name': p.name,
        'Category': p.category?.name || '',
        'Total Stock': p.totalStock || 0,
        'Unit of Measure': p.unitOfMeasure || '',
        'Tracking Type': p.trackingType || 'none',
        'Unit Cost': p.costPrice || 0,
        'Unit Selling Price': p.sellingPrice || 0,
        'Total Value': ((p.totalStock || 0) * (p.costPrice || 0)).toFixed(2)
      }));
      downloadCSV(data, `products_export_${new Date().toISOString().split('T')[0]}.csv`);
    } catch (err) {
      toast.error('Failed to export data');
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsImporting(true);
    const loadingToast = toast.loading('Importing products...');
    try {
      const res = await productsApi.importCSV(formData);
      toast.success(res.data.message || 'Import successful', { id: loadingToast });
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to import products', { id: loadingToast });
    } finally {
      setIsImporting(false);
      e.target.value = null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
              <Package className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            Products
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage catalog and track global stock levels</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 text-slate-700 bg-white" onClick={handleExport}>
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <label className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors border border-slate-200 rounded-xl bg-white text-slate-700 hover:bg-slate-50 cursor-pointer">
            <Upload className="w-4 h-4" /> {isImporting ? 'Importing...' : 'Import CSV'}
            <input type="file" accept=".csv" className="hidden" onChange={handleImport} disabled={isImporting} />
          </label>
          <Button onClick={() => { setEditingId(null); setModalOpen(true); }} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/30 rounded-xl">
            <PackagePlus className="w-4 h-4" /> Add Product
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 py-4">
          <div className="flex flex-1 min-w-[200px] gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search by name or SKU..." value={filters.search} onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))} className="pl-9 h-10 rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800" />
            </div>
            <select value={filters.category} onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))} className="h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow min-w-[150px]">
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-16 flex items-center justify-center gap-3 text-slate-500">
              <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              Loading products...
            </div>
          ) : products.length === 0 ? (
            <div className="p-16 text-center text-slate-400 flex flex-col items-center">
              <Package className="w-12 h-12 mb-4 opacity-50" />
              <p>No products found matching your filters.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="text-left px-6 py-4">SKU / Name</th>
                      <th className="text-left px-6 py-4">Category</th>
                      <th className="text-right px-6 py-4">Locations</th>
                      <th className="text-right px-6 py-4">Total Stock</th>
                      <th className="text-right px-6 py-4">Total Value</th>
                      <th className="text-right px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {products.map((p) => (
                      <tr key={p._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group">
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-900 dark:text-white">{p.name}</p>
                          <p className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-0.5">{p.SKU}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                          {p.category?.name || '—'}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-slate-600 dark:text-slate-400">
                          {p.stockLocations?.length || 0}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Badge variant={getStockStatus(p)} className="px-2.5 py-1">
                            {p.totalStock?.toLocaleString() || 0} {p.unitOfMeasure}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">
                          ${((p.totalStock || 0) * (p.costPrice || 0)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </td>
                        <td className="px-6 py-4 text-right flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="sm" className="h-8 w-8 !p-0 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30" onClick={() => { setPrintProduct(p); setPrintModalOpen(true); }} title="Print Barcode">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>
                          </Button>
                          <Link to={`/products/${p._id}`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 !p-0 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30" title="View details">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="sm" className="h-8 w-8 !p-0 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30" onClick={() => { setEditingId(p._id); setModalOpen(true); }} title="Edit">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 !p-0 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30" onClick={() => handleDelete(p._id)} title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {total > 10 && (
                <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                  <p className="text-sm text-slate-500">Showing {Math.min((page - 1) * 10 + 1, total)} to {Math.min(page * 10, total)} of {total} products</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-xl h-9">Previous</Button>
                    <Button variant="outline" size="sm" disabled={page * 10 >= total} onClick={() => setPage((p) => p + 1)} className="rounded-xl h-9">Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditingId(null); }} title={editingId ? 'Edit Product' : 'New Product'} className="max-w-3xl">
        <ProductForm productId={editingId} categories={categories} onSave={handleSave} onCancel={() => { setModalOpen(false); setEditingId(null); }} />
      </Modal>

      <LabelPrintModal 
        open={printModalOpen} 
        onClose={() => setPrintModalOpen(false)} 
        skuOrLot={printProduct?.SKU} 
        productName={printProduct?.name} 
      />
    </div>
  );
}
