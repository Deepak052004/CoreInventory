import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { warehousesApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Input, Label } from '../components/ui/Input';
import Modal from '../components/ui/Modal';

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', location: '', description: '' });
  const [saving, setSaving] = useState(false);

  const fetch = () => {
    setLoading(true);
    warehousesApi.getAll().then((r) => setWarehouses(r.data.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: '', location: '', description: '' });
    setModalOpen(true);
  };

  const openEdit = (w) => {
    setEditingId(w._id);
    setForm({ name: w.name, location: w.location || '', description: w.description || '' });
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    setSaving(true);
    const promise = editingId ? warehousesApi.update(editingId, form) : warehousesApi.create(form);
    promise.then(() => {
      toast.success(editingId ? 'Warehouse updated' : 'Warehouse created');
      setModalOpen(false);
      fetch();
    }).catch(() => toast.error('Failed')).finally(() => setSaving(false));
  };

  const handleDelete = (id) => {
    if (!confirm('Delete this warehouse?')) return;
    warehousesApi.delete(id).then(() => { toast.success('Deleted'); fetch(); }).catch(() => toast.error('Delete failed'));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Warehouses</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage warehouses and locations</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Add Warehouse</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-12 text-center text-slate-500">Loading...</div>
        ) : (
          warehouses.map((w) => (
            <Card key={w._id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row justify-between items-start">
                <h3 className="font-semibold text-slate-900 dark:text-white">{w.name}</h3>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="!p-2" onClick={() => openEdit(w)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm" className="!p-2 text-red-600" onClick={() => handleDelete(w._id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-slate-500">{w.location || 'No location'}</p>
                {w.description && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{w.description}</p>}
                {w.locations?.length > 0 && (
                  <p className="text-xs text-slate-400 mt-2">Locations: {w.locations.map((l) => l.name).join(', ')}</p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Warehouse' : 'New Warehouse'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <Label>Location</Label>
            <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="Building / Address" />
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
