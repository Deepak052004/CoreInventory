import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../services/api';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';

/**
 * Email verification page.
 * Users land here after clicking the verification link in their registration email.
 * URL format: /verify-email?token=<token>&email=<email>
 */
export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // loading | success | error | expired
  const [message, setMessage] = useState('');
  const [resending, setResending] = useState(false);

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (!token || !email) {
      setStatus('error');
      setMessage('Invalid verification link. Please check your email and try again.');
      return;
    }

    authApi
      .verifyEmail({ token, email })
      .then((res) => {
        setStatus('success');
        setMessage(res.data.message || 'Email verified successfully.');
      })
      .catch((err) => {
        const errMsg = err.response?.data?.message || 'Verification failed.';
        const code = err.response?.data?.code;
        if (code === 'VERIFICATION_EXPIRED') {
          setStatus('expired');
        } else {
          setStatus('error');
        }
        setMessage(errMsg);
      });
  }, [token, email]);

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      await authApi.resendVerification(email);
      setStatus('resent');
      setMessage('A new verification email has been sent. Please check your inbox.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 items-center justify-center text-white font-bold text-2xl shadow-xl shadow-emerald-500/30 mb-4">
            C
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">CoreInventory</h1>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl p-8 text-center">
          {/* Loading */}
          {status === 'loading' && (
            <>
              <Loader2 className="w-12 h-12 mx-auto text-emerald-500 animate-spin mb-4" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Verifying your email…</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Please wait a moment.</p>
            </>
          )}

          {/* Success */}
          {status === 'success' && (
            <>
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Email Verified!</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{message}</p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-colors"
              >
                Sign In Now
              </Link>
            </>
          )}

          {/* Expired */}
          {status === 'expired' && (
            <>
              <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Link Expired</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{message}</p>
              <button
                onClick={handleResend}
                disabled={resending}
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold text-sm transition-colors"
              >
                {resending ? 'Sending…' : 'Resend Verification Email'}
              </button>
            </>
          )}

          {/* Error */}
          {status === 'error' && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Verification Failed</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{message}</p>
              <div className="flex flex-col gap-3">
                {email && (
                  <button
                    onClick={handleResend}
                    disabled={resending}
                    className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-60 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-colors"
                  >
                    {resending ? 'Sending…' : 'Request New Link'}
                  </button>
                )}
                <Link
                  to="/login"
                  className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Back to Login
                </Link>
              </div>
            </>
          )}

          {/* Resent confirmation */}
          {status === 'resent' && (
            <>
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Email Sent!</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{message}</p>
              <Link
                to="/login"
                className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Back to Login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
