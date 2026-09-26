import React, { useState } from 'react';
import { useIMSStore } from '../../store/useIMSStore';
import { KeyRound, Mail, User as UserIcon, Lock, X, CheckCircle, ShieldAlert, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, signup, sendOtpReset, isAuthenticated, user, logout } = useIMSStore();

  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('alex.rivera@odoo-ims.com');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (mode === 'login') {
      const ok = login(email, password);
      if (ok) {
        onClose();
      } else {
        setError('Invalid credentials. Please enter valid email and password.');
      }
    } else if (mode === 'signup') {
      if (!name) {
        setError('Please enter your full name.');
        return;
      }
      const ok = signup(email, name, password);
      if (ok) {
        setMessage('Account created successfully!');
        setTimeout(() => onClose(), 800);
      }
    } else if (mode === 'reset') {
      const res = sendOtpReset(email);
      setMessage(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 sm:p-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Icon */}
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4">
          <KeyRound className="w-6 h-6" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-1">
          {mode === 'login' && 'Welcome Back'}
          {mode === 'signup' && 'Create Your Account'}
          {mode === 'reset' && 'Reset Password via OTP'}
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          {mode === 'login' && 'Sign in to manage warehouse inventory, stock transfers, and deliveries.'}
          {mode === 'signup' && 'Register as an Inventory Manager or Warehouse Specialist.'}
          {mode === 'reset' && 'Enter your email address to receive an instant OTP login link.'}
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
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
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-slate-800 text-slate-200 text-sm rounded-xl pl-9 pr-4 py-2.5 border border-slate-700 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {mode !== 'reset' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('reset')}
                    className="text-xs text-indigo-400 hover:underline"
                  >
                    Forgot OTP password?
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
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 mt-2"
          >
            <span>
              {mode === 'login' && 'Sign In'}
              {mode === 'signup' && 'Create Account'}
              {mode === 'reset' && 'Send OTP Code'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Mode Toggle */}
        <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
          {mode === 'login' && (
            <>
              Don't have an account?{' '}
              <button onClick={() => setMode('signup')} className="text-indigo-400 font-semibold hover:underline">
                Sign Up
              </button>
            </>
          )}
          {mode === 'signup' && (
            <>
              Already registered?{' '}
              <button onClick={() => setMode('login')} className="text-indigo-400 font-semibold hover:underline">
                Sign In
              </button>
            </>
          )}
          {mode === 'reset' && (
            <button onClick={() => setMode('login')} className="text-indigo-400 font-semibold hover:underline">
              Back to Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
