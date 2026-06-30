import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, Pencil, Trash2, Building, Mail, Phone, MapPin } from 'lucide-react';
import { suppliersApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input, Label } from '../components/ui/Input';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import Modal from '../components/ui/Modal';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    _id: null,
    name: '',
    code: '',
    email: '',
    phone: '',
    address: '',
    contactPerson: '',
    status: 'active',
    notes: '',
  });

  const fetchSuppliers = () => {
    setLoading(true);
    const params = { page, limit: 15 };
    if (search) params.search = search;
    
    suppliersApi.getAll(params).then((r) => {
      setSuppliers(r.data.data);
      setTotal(r.data.total);
    }).catch(() => toast.error('Failed to load suppliers')).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSuppliers();
  }, [page, search]);

  const handleDelete = (id) => {
    if (!window.confirm('Delete this supplier? Purchase orders linked to this supplier may break.')) return;
    suppliersApi.delete(id).then(() => {
      toast.success('Supplier deleted');
      fetchSuppliers();
    }).catch(() => toast.error('Failed to delete supplier'));
  };

  const openForm = (supplier = null) => {
    if (supplier) {
      setForm({ ...supplier });
    } else {
      setForm({
        _id: null,
        name: '',
        code: '',
        email: '',
        phone: '',
        address: '',
        contactPerson: '',
        status: 'active',
        notes: '',
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    
    const payload = { ...form };
    const id = payload._id;
    delete payload._id;
    if (!payload.code) delete payload.code;

    const promise = id ? suppliersApi.update(id, payload) : suppliersApi.create(payload);
    
    promise.then(() => {
      toast.success(id ? 'Supplier updated' : 'Supplier created');
      setModalOpen(false);
      fetchSuppliers();
    }).catch((err) => toast.error(err.response?.data?.message || 'Failed to save supplier')).finally(() => setSaving(false));
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-900/30">
              <Building className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
            Supplier Directory
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage vendor contact info and purchasing status</p>
        </div>
        <Button onClick={() => openForm()} className="gap-2 bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/30 rounded-xl">
          <Plus className="w-4 h-4" /> Add Supplier
        </Button>
      </div>

      <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 py-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search vendors by name or code..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10 rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800" />
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {loading ? (
            <div className="p-16 flex items-center justify-center gap-3 text-slate-500">
              <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              Loading vendor directory...
            </div>
          ) : suppliers.length === 0 ? (
            <div className="p-16 text-center text-slate-400 flex flex-col items-center">
              <Building className="w-12 h-12 mb-4 opacity-50" />
              <p>No suppliers found in the directory.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="text-left px-6 py-4">Vendor Info</th>
                      <th className="text-left px-6 py-4">Contact</th>
                      <th className="text-left px-6 py-4">Status</th>
                      <th className="text-right px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {suppliers.map((s) => (
                      <tr key={s._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                            {s.name}
                          </div>
                          {s.code && <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">CODE: {s.code}</div>}
                          {s.address && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-2">
                              <MapPin className="w-3.5 h-3.5" />
                              <span className="truncate max-w-[250px]" title={s.address}>{s.address}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {s.contactPerson && <div className="font-medium text-sm text-slate-700 dark:text-slate-300 mb-1">{s.contactPerson}</div>}
                          <div className="space-y-1">
                            {s.email && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-violet-600 transition-colors">
                                <Mail className="w-3.5 h-3.5" />
                                <a href={`mailto:${s.email}`}>{s.email}</a>
                              </div>
                            )}
                            {s.phone && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <Phone className="w-3.5 h-3.5" />
                                <span>{s.phone}</span>
                              </div>
                            )}
                            {!s.email && !s.phone && !s.contactPerson && <span className="text-xs text-slate-400 italic">No contact info</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={s.status === 'active' ? 'success' : 'default'} className="px-2.5 py-1">
                            {s.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="sm" className="h-8 w-8 !p-0 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30" onClick={() => openForm(s)} title="Edit Supplier">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 !p-0 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30" onClick={() => handleDelete(s._id)} title="Delete Supplier">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {total > 15 && (
                <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                  <p className="text-sm text-slate-500">Showing {Math.min((page - 1) * 15 + 1, total)} to {Math.min(page * 15, total)} of {total}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-xl h-9">Prev</Button>
                    <Button variant="outline" size="sm" disabled={page * 15 >= total} onClick={() => setPage((p) => p + 1)} className="rounded-xl h-9">Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={form._id ? 'Edit Supplier' : 'New Supplier'} className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6 mt-2">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5 block">Supplier Name *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required placeholder="e.g. Acme Corp" />
            </div>
            <div>
              <Label className="mb-1.5 block">Vendor Code (Optional)</Label>
              <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="e.g. VEND-001" className="uppercase font-mono text-sm" />
            </div>
            
            <div>
              <Label className="mb-1.5 block">Status</Label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-violet-500">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            
            <div>
              <Label className="mb-1.5 block">Contact Person</Label>
              <Input value={form.contactPerson} onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))} placeholder="e.g. John Doe" />
            </div>
            
            <div>
              <Label className="mb-1.5 block">Email Address</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="contact@supplier.com" />
            </div>
            
            <div>
              <Label className="mb-1.5 block">Phone Number</Label>
              <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+1 (555) 000-0000" />
            </div>
          </div>
          
          <div>
            <Label className="mb-1.5 block">Physical Address</Label>
            <textarea
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className="w-full min-h-[80px] p-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-violet-500 resize-y"
              placeholder="Full street address..."
            />
          </div>
          
          <div>
            <Label className="mb-1.5 block">Internal Notes (Optional)</Label>
            <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Payment terms, special delivery instructions, etc." />
          </div>
          
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="px-5 rounded-xl">Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/30 px-6 rounded-xl">
              {saving ? 'Saving...' : form._id ? 'Save Changes' : 'Create Supplier'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
