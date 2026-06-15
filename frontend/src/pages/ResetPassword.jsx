import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input, Label } from '../components/ui/Input';

export default function ResetPassword() {
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const state = location.state || {};
    if (state.email) setEmail(state.email);
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authApi.resetPassword({ email, newPassword });
      login(data.token, data.user);
      toast.success('Password reset successfully');
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reset password</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Enter your new password (OTP already verified)</p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div>
              <Label>New password</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" minLength={6} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Resetting...' : 'Reset password'}</Button>
          </form>
          <Link to="/login" className="block mt-6 text-center text-sm text-slate-500 hover:text-emerald-600">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
