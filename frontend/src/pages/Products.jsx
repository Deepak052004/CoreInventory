import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Search, Pencil, Trash2, Eye } from 'lucide-react';
import { productsApi, categoriesApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import ProductForm from '../components/ProductForm';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const fetch = () => {
    setLoading(true);
    const params = { page, limit: 10 };
    if (search) params.search = search;
    if (categoryFilter) params.category = categoryFilter;
    productsApi.getAll(params).then((r) => {
      setProducts(r.data.data);
      setTotal(r.data.total);
    }).catch(() => toast.error('Failed to load products')).finally(() => setLoading(false));
  };

  useEffect(() => {
    categoriesApi.getAll().then((r) => setCategories(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    fetch();
  }, [page, search, categoryFilter]);

  const handleDelete = (id) => {
    if (!confirm('Delete this product?')) return;
    productsApi.delete(id).then(() => {
      toast.success('Product deleted');
      fetch();
    }).catch(() => toast.error('Delete failed'));
  };

  const handleSave = () => {
    setModalOpen(false);
    setEditingId(null);
    fetch();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Products</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your product catalog</p>
        </div>
        <Button onClick={() => { setEditingId(null); setModalOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Add Product
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <div className="flex flex-1 min-w-[200px] gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search by name or SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm">
              <option value="">All categories</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Loading...</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">SKU</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Name</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Category</th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Stock</th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Reorder</th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {products.map((p) => (
                      <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 font-mono text-sm text-slate-700 dark:text-slate-300">{p.SKU}</td>
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{p.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{p.category?.name}</td>
                        <td className="px-6 py-4 text-right">
                          <Badge variant={p.stockQuantity <= 0 ? 'danger' : (p.stockQuantity <= (p.reorderLevel || 0) ? 'warning' : 'success')}>
                            {p.stockQuantity ?? 0}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-slate-500">{p.reorderLevel ?? 0}</td>
                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                          <Link to={`/products/${p._id}`}><Button variant="ghost" size="sm" className="!p-2"><Eye className="w-4 h-4" /></Button></Link>
                          <Button variant="ghost" size="sm" className="!p-2" onClick={() => { setEditingId(p._id); setModalOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" className="!p-2 text-red-600" onClick={() => handleDelete(p._id)}><Trash2 className="w-4 h-4" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {total > 10 && (
                <div className="flex justify-between items-center px-6 py-3 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-sm text-slate-500">Total {total} products</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                    <Button variant="outline" size="sm" disabled={page * 10 >= total} onClick={() => setPage((p) => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditingId(null); }} title={editingId ? 'Edit Product' : 'New Product'} size="lg">
        <ProductForm productId={editingId} categories={categories} onSave={handleSave} onCancel={() => { setModalOpen(false); setEditingId(null); }} />
      </Modal>
    </div>
  );
}
