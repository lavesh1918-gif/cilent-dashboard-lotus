import React, { useState } from 'react';
import { loginAdminWithGoogle } from '../services/adminAuthService';
import { ShieldCheck, AlertCircle, Phone } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      await loginAdminWithGoogle();
      onLoginSuccess();
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-indigo-500 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center font-black text-white text-3xl shadow-xl shadow-indigo-500/20 mx-auto mb-4 border border-indigo-400/30">
          🪷
        </div>
        <h2 className="text-2xl font-black tracking-tight text-white">Lotus Web Studio</h2>
        <p className="mt-1 text-xs uppercase font-bold tracking-widest text-slate-400">
          Internal Administration Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-900 border border-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-800">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <span className="text-sm font-bold text-white">Authorized Admin Access Only</span>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <span className="font-semibold leading-relaxed">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <p className="text-xs text-slate-400 text-center leading-relaxed">
              Sign in with your authorized Google administrator account to manage clients, projects, marketing reports, and invoices.
            </p>

            {/* Continue with Google Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-sm font-bold shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-3 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Google Authorization...</span>
                </>
              ) : (
                <>
                  {/* Google SVG Logo */}
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>
          </div>

          {/* Business Contact Footer */}
          <div className="mt-8 pt-5 border-t border-slate-800 text-center">
            <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-400">
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              <span>Agency Business Contact: <strong className="font-mono text-slate-300">8058378450</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
