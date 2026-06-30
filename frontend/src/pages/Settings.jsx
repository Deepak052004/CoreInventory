import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Save, Settings as SettingsIcon, Building, DollarSign, Image as ImageIcon, Upload } from 'lucide-react';
import { settingsApi } from '../services/api';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Input, Label } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    companyAddress: '',
    currencySymbol: '$',
    defaultTaxRate: 10,
    logoUrl: null,
  });
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = () => {
    settingsApi.get()
      .then((res) => {
        if (res.data.data) {
          setForm(res.data.data);
        }
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsApi.update(form);
      toast.success('Settings updated successfully');
      window.location.reload(); // Refresh to update Sidebar logo if needed
    } catch (err) {
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('logo', file);

    const loadingToast = toast.loading('Uploading logo...');
    try {
      const res = await settingsApi.uploadLogo(formData);
      setForm(res.data.data);
      toast.success('Logo uploaded successfully', { id: loadingToast });
      window.location.reload();
    } catch (err) {
      toast.error('Failed to upload logo', { id: loadingToast });
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading settings...</div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
              <SettingsIcon className="w-6 h-6 text-slate-600 dark:text-slate-400" />
            </div>
            System Settings
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Configure global application preferences</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-800/20 py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Building className="w-5 h-5 text-indigo-500" /> Company Profile
            </h2>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Company Name</Label>
                <Input name="companyName" value={form.companyName} onChange={handleChange} required />
              </div>
              <div>
                <Label>Company Email</Label>
                <Input type="email" name="companyEmail" value={form.companyEmail} onChange={handleChange} required />
              </div>
              <div>
                <Label>Company Phone</Label>
                <Input name="companyPhone" value={form.companyPhone} onChange={handleChange} />
              </div>
              <div className="md:col-span-2">
                <Label>Company Address (Appears on PDFs)</Label>
                <textarea 
                  name="companyAddress" 
                  value={form.companyAddress} 
                  onChange={handleChange} 
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors outline-none"
                  rows="3"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-800/20 py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-500" /> Financial & Formatting
            </h2>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Currency Symbol</Label>
                <select 
                  name="currencySymbol" 
                  value={form.currencySymbol} 
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors outline-none"
                >
                  <option value="$">USD ($)</option>
                  <option value="€">EUR (€)</option>
                  <option value="£">GBP (£)</option>
                  <option value="₹">INR (₹)</option>
                  <option value="¥">JPY (¥)</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">Default currency displayed across the app.</p>
              </div>
              <div>
                <Label>Default Tax Rate (%)</Label>
                <Input type="number" step="0.01" min="0" name="defaultTaxRate" value={form.defaultTaxRate} onChange={handleChange} required />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
}
