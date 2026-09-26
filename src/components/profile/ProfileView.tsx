import React from 'react';
import { useIMSStore } from '../../store/useIMSStore';
import { User, LogOut, KeyRound, ShieldCheck, Mail, Building2, CheckCircle2 } from 'lucide-react';

interface ProfileViewProps {
  onOpenAuth: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onOpenAuth }) => {
  const { user, isAuthenticated, logout, sendOtpReset } = useIMSStore();

  if (!isAuthenticated || !user) {
    return (
      <div className="glass-card rounded-3xl p-12 text-center border border-slate-800 max-w-md mx-auto my-12">
        <User className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Unauthenticated Session</h2>
        <p className="text-xs text-slate-400 mb-6">Please sign in to access your inventory manager user profile.</p>
        <button
          onClick={onOpenAuth}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  const handleOtpReset = async () => {
    const res = await sendOtpReset(user.email);
    alert(res.message);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 text-center">
        <div className="relative inline-block mb-4">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-24 h-24 rounded-full object-cover ring-4 ring-indigo-500/30 mx-auto"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center font-extrabold text-2xl text-white mx-auto">
              {user.name.charAt(0)}
            </div>
          )}
          <span className="absolute bottom-1 right-1 p-1.5 rounded-full bg-emerald-500 text-slate-950 font-bold border-2 border-slate-900">
            <CheckCircle2 className="w-4 h-4" />
          </span>
        </div>

        <h1 className="text-2xl font-extrabold text-white mb-1">{user.name}</h1>
        <p className="text-xs text-indigo-400 font-semibold mb-6">{user.role}</p>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-left space-y-3 mb-6">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-500" /> Email Address:
            </span>
            <strong className="text-white font-mono">{user.email}</strong>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-500" /> Role Permissions:
            </span>
            <strong className="text-emerald-400 font-mono">Full Access (RLS Enforced)</strong>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={handleOtpReset}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 flex items-center gap-2"
          >
            <KeyRound className="w-4 h-4 text-indigo-400" /> Request Password OTP
          </button>
          <button
            onClick={() => {
              logout();
              onOpenAuth();
            }}
            className="px-4 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/40 text-red-400 text-xs font-bold transition-all border border-red-500/30 flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
