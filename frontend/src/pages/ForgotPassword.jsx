import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input, Label } from '../components/ui/Input';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [otpForDev, setOtpForDev] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setOtpForDev(null);
    try {
      const { data } = await authApi.forgotPassword(email);
      setSent(true);
      if (data.otpForDev) {
        setOtpForDev(data.otpForDev);
        toast.success('Use the OTP below (email not configured)');
      } else {
        toast.success('OTP sent to your email');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const goToVerifyOtp = () => {
    navigate('/verify-otp', { state: { email, otpForDev } });
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl p-8 text-center animate-slide-up">
          {otpForDev ? (
            <>
              <p className="text-slate-700 dark:text-slate-200 mb-2">Email is not configured. Use this OTP to reset your password:</p>
              <p className="text-2xl font-bold font-mono tracking-widest text-emerald-600 dark:text-emerald-400 my-4">{otpForDev}</p>
              <Button onClick={goToVerifyOtp} className="w-full mt-4">Verify OTP</Button>
            </>
          ) : (
            <p className="text-slate-700 dark:text-slate-200">Check your email for the OTP, then reset your password.</p>
          )}
          {!otpForDev && (
            <Link to="/verify-otp" state={{ email }} className="mt-4 inline-block text-emerald-600 dark:text-emerald-400 font-medium hover:underline">Verify OTP</Link>
          )}
          <Link to="/login" className="block mt-4 text-sm text-slate-500 hover:text-emerald-600">Back to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Forgot password</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">We'll send an OTP to your email</p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Sending...' : 'Send OTP'}</Button>
          </form>
          <Link to="/login" className="block mt-6 text-center text-sm text-slate-500 hover:text-emerald-600">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
