import { useState } from 'react';
import toast from 'react-hot-toast';
import { userApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input, Label } from '../components/ui/Input';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { useAuth } from '../hooks/useAuth';

export default function Profile() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    userApi.updateProfile({ name }).then((r) => {
      toast.success('Profile updated');
      localStorage.setItem('user', JSON.stringify(r.data.user));
    }).catch(() => toast.error('Update failed')).finally(() => setSaving(false));
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profile</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Your account settings</p>
      </div>

      <Card>
        <CardHeader><h2 className="font-semibold">Account</h2></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={user?.email || ''} disabled className="opacity-70" />
            </div>
            <div>
              <Label>Role</Label>
              <Input value={user?.role || ''} disabled className="opacity-70 capitalize" />
            </div>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
