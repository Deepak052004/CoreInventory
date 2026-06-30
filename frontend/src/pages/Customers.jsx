import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, Pencil, Trash2, Users, Mail, Phone, MapPin } from 'lucide-react';
import { customersApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input, Label } from '../components/ui/Input';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import Modal from '../components/ui/Modal';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
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

  const fetchCustomers = () => {
    setLoading(true);
    const params = { page, limit: 15 };
    if (search) params.search = search;
    
    customersApi.getAll(params).then((r) => {
      setCustomers(r.data.data);
      setTotal(r.data.total);
    }).catch(() => toast.error('Failed to load customers')).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, search]);

  const handleDelete = (id) => {
    if (!window.confirm('Delete this customer? Sales orders linked to this customer may be affected.')) return;
    customersApi.delete(id).then(() => {
      toast.success('Customer deleted');
      fetchCustomers();
    }).catch(() => toast.error('Failed to delete customer'));
  };

  const openForm = (customer = null) => {
    if (customer) {
      setForm({ ...customer });
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

    const promise = id ? customersApi.update(id, payload) : customersApi.create(payload);
    
    promise.then(() => {
      toast.success(id ? 'Customer updated' : 'Customer created');
      setModalOpen(false);
      fetchCustomers();
    }).catch((err) => toast.error(err.response?.data?.message || 'Failed to save customer')).finally(() => setSaving(false));
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            Customer Directory
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage B2B/B2C client profiles and contact information</p>
        </div>
        <Button onClick={() => openForm()} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 rounded-xl">
          <Plus className="w-4 h-4" /> Add Customer
        </Button>
      </div>

      <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 py-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search customers by name or code..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10 rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800" />
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {loading ? (
            <div className="p-16 flex items-center justify-center gap-3 text-slate-500">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Loading customer directory...
            </div>
          ) : customers.length === 0 ? (
            <div className="p-16 text-center text-slate-400 flex flex-col items-center">
              <Users className="w-12 h-12 mb-4 opacity-50" />
              <p>No customers found in the directory.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="text-left px-6 py-4">Customer Info</th>
                      <th className="text-left px-6 py-4">Contact</th>
                      <th className="text-left px-6 py-4">Status</th>
                      <th className="text-right px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {customers.map((c) => (
                      <tr key={c._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                            {c.name}
                          </div>
                          {c.code && <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">CODE: {c.code}</div>}
                          {c.address && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-2">
                              <MapPin className="w-3.5 h-3.5" />
                              <span className="truncate max-w-[250px]" title={c.address}>{c.address}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {c.contactPerson && <div className="font-medium text-sm text-slate-700 dark:text-slate-300 mb-1">{c.contactPerson}</div>}
                          <div className="space-y-1">
                            {c.email && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors">
                                <Mail className="w-3.5 h-3.5" />
                                <a href={`mailto:${c.email}`}>{c.email}</a>
                              </div>
                            )}
                            {c.phone && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <Phone className="w-3.5 h-3.5" />
                                <span>{c.phone}</span>
                              </div>
                            )}
                            {!c.email && !c.phone && !c.contactPerson && <span className="text-xs text-slate-400 italic">No contact info</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={c.status === 'active' ? 'success' : 'default'} className="px-2.5 py-1">
                            {c.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="sm" className="h-8 w-8 !p-0 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30" onClick={() => openForm(c)} title="Edit Customer">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 !p-0 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30" onClick={() => handleDelete(c._id)} title="Delete Customer">
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={form._id ? 'Edit Customer' : 'New Customer'} className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6 mt-2">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5 block">Customer Name *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required placeholder="e.g. Globex Inc" />
            </div>
            <div>
              <Label className="mb-1.5 block">Customer Code (Optional)</Label>
              <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="e.g. CUST-001" className="uppercase font-mono text-sm" />
            </div>
            
            <div>
              <Label className="mb-1.5 block">Status</Label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            
            <div>
              <Label className="mb-1.5 block">Contact Person</Label>
              <Input value={form.contactPerson} onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))} placeholder="e.g. Jane Smith" />
            </div>
            
            <div>
              <Label className="mb-1.5 block">Email Address</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="contact@customer.com" />
            </div>
            
            <div>
              <Label className="mb-1.5 block">Phone Number</Label>
              <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+1 (555) 000-0000" />
            </div>
          </div>
          
          <div>
            <Label className="mb-1.5 block">Shipping/Billing Address</Label>
            <textarea
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className="w-full min-h-[80px] p-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              placeholder="Full physical address..."
            />
          </div>
          
          <div>
            <Label className="mb-1.5 block">Internal Notes (Optional)</Label>
            <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Account details, credit terms, etc." />
          </div>
          
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="px-5 rounded-xl">Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 px-6 rounded-xl">
              {saving ? 'Saving...' : form._id ? 'Save Changes' : 'Create Customer'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
