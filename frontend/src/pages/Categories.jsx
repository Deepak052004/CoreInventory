import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { categoriesApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Input, Label } from '../components/ui/Input';
import Modal from '../components/ui/Modal';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  const fetch = () => {
    setLoading(true);
    categoriesApi.getAll().then((r) => setCategories(r.data.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: '', description: '' });
    setModalOpen(true);
  };

  const openEdit = (c) => {
    setEditingId(c._id);
    setForm({ name: c.name, description: c.description || '' });
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    setSaving(true);
    const promise = editingId ? categoriesApi.update(editingId, form) : categoriesApi.create(form);
    promise.then(() => {
      toast.success(editingId ? 'Category updated' : 'Category created');
      setModalOpen(false);
      fetch();
    }).catch(() => toast.error('Failed')).finally(() => setSaving(false));
  };

  const handleDelete = (id) => {
    if (!confirm('Delete this category?')) return;
    categoriesApi.delete(id).then(() => { toast.success('Deleted'); fetch(); }).catch(() => toast.error('Delete failed'));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Categories</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Product categories</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Add Category</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? <div className="p-12 text-center text-slate-500">Loading...</div> : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Name</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Description</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {categories.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="px-6 py-4 font-medium">{c.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{c.description || '–'}</td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" className="mr-2" onClick={() => openEdit(c)}><Pencil className="w-4 h-4 inline" /></Button>
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(c._id)}><Trash2 className="w-4 h-4 inline" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Category' : 'New Category'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <Label>Description</Label>
            <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
