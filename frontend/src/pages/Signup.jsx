import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input, Label } from '../components/ui/Input';
import { CheckCircle, Mail } from 'lucide-react';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [devUrl, setDevUrl] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authApi.signup({ name, email, password });
      setSuccess(true);
      // In development, expose the verification URL for testing
      if (data.devVerificationUrl) {
        setDevUrl(data.devVerificationUrl);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 items-center justify-center text-white font-bold text-2xl shadow-xl shadow-emerald-500/30 mb-4">
            C
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create account</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">CoreInventory</p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl p-8">
          {/* ── Success State ───────────────────────────────────────────────── */}
          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Check Your Email</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                We sent a verification link to <strong className="text-slate-700 dark:text-slate-300">{email}</strong>.
                Click the link to activate your account.
              </p>

              {/* Dev-only verification URL */}
              {devUrl && (
                <div className="mb-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl text-left">
                  <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 mb-1">
                    🧪 Development Mode — No email configured
                  </p>
                  <a
                    href={devUrl}
                    className="text-xs text-yellow-600 dark:text-yellow-300 underline break-all"
                  >
                    Click to verify your email
                  </a>
                </div>
              )}

              <div className="flex items-center gap-2 justify-center text-xs text-slate-400">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Link expires in 24 hours</span>
              </div>

              <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
                Already verified?{' '}
                <Link to="/login" className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          ) : (
            /* ── Signup Form ──────────────────────────────────────────────── */
            <>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label>Full Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    required
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters, 1 uppercase, 1 number"
                    minLength={8}
                    required
                  />
                  <p className="mt-1.5 text-xs text-slate-400">
                    Must be 8+ characters with at least one uppercase letter and one number.
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating account…' : 'Create Account'}
                </Button>
              </form>
              <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
                Already have an account?{' '}
                <Link to="/login" className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
