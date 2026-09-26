import React, { useState } from 'react';
import { useIMSStore } from '../../store/useIMSStore';
import { isSupabaseConfigured } from '../../lib/supabase';
import {
  KeyRound,
  Mail,
  User as UserIcon,
  Lock,
  X,
  CheckCircle,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Copy,
  Check,
  Loader2,
  Database,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, signup, sendOtpReset } = useIMSStore();

  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [loginId, setLoginId] = useState('alex.rivera@odoo-ims.com');
  const [email, setEmail] = useState('alex.rivera@gmail.com');
  const [name, setName] = useState('Alex Rivera');
  const [password, setPassword] = useState('Password123!');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleAutofillDemo = () => {
    setLoginId('alex.rivera@odoo-ims.com');
    setPassword('Password123!');
    setError(null);
    setMessage('Demo credentials auto-filled! Click "Sign In" below.');
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const res = await login(loginId, password);
        if (res.success) {
          setMessage('Signed in successfully!');
          setTimeout(() => onClose(), 400);
        } else {
          setError(res.message || 'Invalid Login ID or Password');
        }
      } else if (mode === 'signup') {
        if (!name.trim()) {
          setError('Please enter your full name.');
          setIsLoading(false);
          return;
        }
        if (!email.trim() || !email.includes('@')) {
          setError('Please enter a valid email address.');
          setIsLoading(false);
          return;
        }
        const res = await signup(loginId, email, name, password);
        if (res.success) {
          setMessage(res.message || 'Account created successfully!');
          setTimeout(() => onClose(), 1500);
        } else {
          setError(res.message || 'Signup failed');
        }
      } else if (mode === 'reset') {
        const res = await sendOtpReset(email);
        setMessage(res.message);
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication encountered an error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Icon */}
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3 mx-auto">
          <KeyRound className="w-6 h-6" />
        </div>

        <h2 className="text-2xl font-extrabold text-white text-center mb-1">
          {mode === 'login' && 'Sign In to StockSense'}
          {mode === 'signup' && 'Create Your Account'}
          {mode === 'reset' && 'Reset Password via OTP'}
        </h2>
        <p className="text-xs text-slate-400 text-center mb-4">
          {mode === 'login' && 'Authenticate with Supabase or evaluate with demo credentials.'}
          {mode === 'signup' && 'Register in Supabase Auth as an Inventory Manager.'}
          {mode === 'reset' && 'Enter your registered email to receive a password reset link or OTP.'}
        </p>

        {/* DEMO CREDENTIALS BOX - Prominently placed above the form */}
        {mode === 'login' && (
          <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-800/80 to-slate-900 border border-indigo-500/30 shadow-lg">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-indigo-500/20">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Demo Evaluation Credentials</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 font-mono">
                <Database className="w-2.5 h-2.5" />
                <span>{isSupabaseConfigured() ? 'Supabase Live' : 'Demo Mode'}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-950/50 border border-slate-800">
                <span className="text-slate-400 text-[11px]">Email:</span>
                <div className="flex items-center gap-2">
                  <span className="text-indigo-200 font-semibold selection:bg-indigo-600">alex.rivera@odoo-ims.com</span>
                  <button
                    type="button"
                    onClick={() => handleCopy('alex.rivera@odoo-ims.com', 'email')}
                    className="p-1 text-slate-400 hover:text-white transition-colors"
                    title="Copy Email"
                  >
                    {copiedField === 'email' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-950/50 border border-slate-800">
                <span className="text-slate-400 text-[11px]">Password:</span>
                <div className="flex items-center gap-2">
                  <span className="text-indigo-200 font-semibold selection:bg-indigo-600">Password123!</span>
                  <button
                    type="button"
                    onClick={() => handleCopy('Password123!', 'pass')}
                    className="p-1 text-slate-400 hover:text-white transition-colors"
                    title="Copy Password"
                  >
                    {copiedField === 'pass' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAutofillDemo}
              className="mt-2.5 w-full py-1.5 px-3 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-medium transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>Auto-fill Demo Credentials</span>
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-xs flex items-center gap-2 animate-in fade-in">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full bg-slate-800 text-slate-200 text-sm rounded-xl pl-9 pr-4 py-2.5 border border-slate-700 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {mode === 'login' ? 'Email Address or Login ID *' : 'Login ID (6–12 characters) *'}
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder={mode === 'login' ? 'alex.rivera@odoo-ims.com or alexrivera' : 'alexrivera'}
                className="w-full bg-slate-800 text-slate-200 text-sm rounded-xl pl-9 pr-4 py-2.5 border border-slate-700 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {mode !== 'login' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email ID (Supabase Auth) *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full bg-slate-800 text-slate-200 text-sm rounded-xl pl-9 pr-4 py-2.5 border border-slate-700 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {mode !== 'reset' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">Password *</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('reset');
                      setError(null);
                      setMessage(null);
                    }}
                    className="text-xs text-indigo-400 hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-800 text-slate-200 text-sm rounded-xl pl-9 pr-4 py-2.5 border border-slate-700 focus:outline-none focus:border-indigo-500"
                />
              </div>
              {mode === 'signup' && (
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special character
                </span>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>
                  {mode === 'login' && 'Sign In'}
                  {mode === 'signup' && 'Create Account in Supabase'}
                  {mode === 'reset' && 'Send Reset Link'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
          {mode === 'login' && (
            <>
              Don't have an account?{' '}
              <button
                onClick={() => {
                  setMode('signup');
                  setError(null);
                  setMessage(null);
                }}
                className="text-indigo-400 font-semibold hover:underline"
              >
                Sign Up
              </button>
            </>
          )}
          {mode === 'signup' && (
            <>
              Already registered?{' '}
              <button
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setMessage(null);
                }}
                className="text-indigo-400 font-semibold hover:underline"
              >
                Sign In
              </button>
            </>
          )}
          {mode === 'reset' && (
            <button
              onClick={() => {
                setMode('login');
                setError(null);
                setMessage(null);
              }}
              className="text-indigo-400 font-semibold hover:underline"
            >
              Back to Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

