import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input, Label } from '../components/ui/Input';
import { AlertCircle, Mail } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorInfo(null);
    try {
      const { data } = await authApi.login({ email, password });
      // New API returns accessToken; old token key kept as fallback
      login(data.accessToken || data.token, data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate('/', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      const code = err.response?.data?.code;
      const status = err.response?.status;

      if (code === 'EMAIL_NOT_VERIFIED') {
        setErrorInfo({ type: 'verify', message: msg });
      } else if (status === 423) {
        setErrorInfo({ type: 'locked', message: msg });
      } else {
        setErrorInfo({ type: 'error', message: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      await authApi.resendVerification(email);
      toast.success('Verification email sent. Check your inbox.');
      setErrorInfo(null);
    } catch {
      toast.error('Failed to send verification email.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 items-center justify-center text-white font-bold text-2xl shadow-xl shadow-emerald-500/30 mb-4">C</div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">CoreInventory</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Sign in to your account</p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline">Forgot password?</Link>
            </div>
            {errorInfo && (
              <div className={`rounded-xl p-4 flex flex-col gap-2 text-sm ${
                errorInfo.type === 'verify'
                  ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
              }`}>
                <div className="flex items-start gap-2">
                  {errorInfo.type === 'verify' ? <Mail className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
                  <span>{errorInfo.message}</span>
                </div>
                {errorInfo.type === 'verify' && (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    className="text-amber-600 dark:text-amber-400 font-medium underline underline-offset-2 text-left"
                  >
                    Resend verification email
                  </button>
                )}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Don't have an account? <Link to="/signup" className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
