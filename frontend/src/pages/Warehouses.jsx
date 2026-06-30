import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Building2, MapPin, Users, Phone, Activity } from 'lucide-react';
import { warehousesApi, usersApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Input, Label } from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import PermissionGuard from '../components/guards/PermissionGuard';

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    code: '', name: '', location: '', description: '',
    capacity: 0, status: 'active', contact: '', managers: []
  });
  const [saving, setSaving] = useState(false);

  const fetchWarehouses = () => {
    setLoading(true);
    warehousesApi.getAll()
      .then((r) => setWarehouses(r.data.data))
      .catch(() => toast.error('Failed to load warehouses'))
      .finally(() => setLoading(false));
  };

  const fetchUsers = () => {
    usersApi.getAll({ limit: 100 }) // Adjust limit as needed
      .then((r) => setAllUsers(r.data.data))
      .catch(() => console.error('Failed to load users'));
  };

  useEffect(() => {
    fetchWarehouses();
    fetchUsers();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ code: '', name: '', location: '', description: '', capacity: 0, status: 'active', contact: '', managers: [] });
    setModalOpen(true);
  };

  const openEdit = (w) => {
    setEditingId(w._id);
    setForm({
      code: w.code || '',
      name: w.name,
      location: w.location || '',
      description: w.description || '',
      capacity: w.capacity || 0,
      status: w.status || 'active',
      contact: w.contact || '',
      managers: (w.managers || []).map(m => m._id)
    });
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
      fetchWarehouses();
    }).catch((err) => toast.error(err.response?.data?.message || 'Failed')).finally(() => setSaving(false));
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this warehouse?')) return;
    warehousesApi.delete(id)
      .then(() => { toast.success('Deleted'); fetchWarehouses(); })
      .catch((err) => toast.error(err.response?.data?.message || 'Delete failed'));
  };

  const toggleManager = (userId) => {
    setForm(f => {
      if (f.managers.includes(userId)) return { ...f, managers: f.managers.filter(id => id !== userId) };
      return { ...f, managers: [...f.managers, userId] };
    });
  };

  const STATUS_COLORS = {
    active: 'bg-emerald-100 text-emerald-700',
    inactive: 'bg-slate-100 text-slate-700',
    maintenance: 'bg-amber-100 text-amber-700',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            Warehouses
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage multiple inventory locations</p>
        </div>
        <PermissionGuard permission="warehouses:create">
          <Button onClick={openCreate} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 rounded-xl">
            <Plus className="w-4 h-4" /> Add Warehouse
          </Button>
        </PermissionGuard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-500 flex justify-center items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            Loading warehouses...
          </div>
        ) : warehouses.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400">
            <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No warehouses found.</p>
          </div>
        ) : (
          warehouses.map((w) => (
            <Card key={w._id} className="hover:shadow-lg transition-shadow border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col bg-white dark:bg-slate-900">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800/50 pb-4 flex flex-row justify-between items-start bg-slate-50/50 dark:bg-slate-800/20">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-lg">{w.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[w.status || 'active']}`}>
                      {w.status || 'active'}
                    </span>
                  </div>
                  {w.code && <p className="text-xs font-mono text-slate-500 dark:text-slate-400">{w.code}</p>}
                </div>
                <div className="flex gap-1 -mt-1 -mr-1">
                  <PermissionGuard permission="warehouses:update">
                    <Button variant="ghost" size="sm" className="h-8 w-8 !p-0 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30" onClick={() => openEdit(w)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </PermissionGuard>
                  <PermissionGuard permission="warehouses:delete">
                    <Button variant="ghost" size="sm" className="h-8 w-8 !p-0 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30" onClick={() => handleDelete(w._id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </PermissionGuard>
                </div>
              </CardHeader>
              <CardContent className="pt-4 flex-1 flex flex-col gap-3">
                {w.location && (
                  <div className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
                    <span>{w.location}</span>
                  </div>
                )}
                {w.contact && (
                  <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                    <Phone className="w-4 h-4 shrink-0 text-slate-400" />
                    <span>{w.contact}</span>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Activity className="w-3 h-3" /> Capacity</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{w.capacity > 0 ? w.capacity.toLocaleString() : 'Unlimited'}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Users className="w-3 h-3" /> Managers</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{w.managers?.length || 0}</p>
                  </div>
                </div>

                {w.managers?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {w.managers.map((m) => (
                      <span key={m._id} className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {m.name}
                      </span>
                    ))}
                  </div>
                )}

                {w.description && <p className="text-sm text-slate-500 mt-auto pt-2 border-t border-slate-100 dark:border-slate-800">{w.description}</p>}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Warehouse' : 'New Warehouse'} className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <Label className="text-slate-700 dark:text-slate-300">Warehouse Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="mt-1.5" />
            </div>
            <div>
              <Label className="text-slate-700 dark:text-slate-300">Warehouse Code</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. WH-01" className="mt-1.5 uppercase" />
            </div>
            <div className="md:col-span-2">
              <Label className="text-slate-700 dark:text-slate-300">Location Address</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Full address..." className="mt-1.5" />
            </div>
            <div>
              <Label className="text-slate-700 dark:text-slate-300">Contact Number</Label>
              <Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label className="text-slate-700 dark:text-slate-300">Total Capacity</Label>
              <Input type="number" min="0" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} className="mt-1.5" />
            </div>
            <div>
              <Label className="text-slate-700 dark:text-slate-300">Status</Label>
              <select 
                value={form.status} 
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="mt-1.5 w-full rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 outline-none transition-colors border"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Under Maintenance</option>
              </select>
            </div>
          </div>
          
          <div>
            <Label className="text-slate-700 dark:text-slate-300">Assign Managers</Label>
            <div className="mt-2 border border-slate-200 dark:border-slate-700 rounded-xl max-h-48 overflow-y-auto bg-slate-50/50 dark:bg-slate-800/20 p-2 space-y-1">
              {allUsers.filter(u => ['owner', 'admin', 'manager'].includes(u.role)).map(u => (
                <label key={u._id} className="flex items-center gap-3 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={form.managers.includes(u._id)}
                    onChange={() => toggleManager(u._id)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{u.name}</p>
                    <p className="text-xs text-slate-500">{u.email} &bull; {u.role}</p>
                  </div>
                </label>
              ))}
              {allUsers.length === 0 && <p className="p-2 text-sm text-slate-500 text-center">Loading managers...</p>}
            </div>
          </div>

          <div>
            <Label className="text-slate-700 dark:text-slate-300">Description</Label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1.5" />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]">
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
