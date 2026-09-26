import React, { useState, useEffect } from 'react';
import { Database, X, CheckCircle2, AlertCircle, RefreshCw, Key, Globe, Shield, ExternalLink, Copy, Check } from 'lucide-react';
import { isSupabaseConfigured, saveSupabaseCredentials, clearSupabaseCredentials } from '../../lib/supabase';
import { supabaseService } from '../../services/supabaseService';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ success: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUrl = localStorage.getItem('IMS_VITE_SUPABASE_URL') || (import.meta.env.VITE_SUPABASE_URL as string) || '';
      const storedKey = localStorage.getItem('IMS_VITE_SUPABASE_ANON_KEY') || (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';
      setUrl(storedUrl);
      setAnonKey(storedKey);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isConfigured = isSupabaseConfigured();

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    setStatusMsg(null);

    if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
      setStatusMsg({ success: false, message: 'URL must start with https:// and end with .supabase.co' });
      setTesting(false);
      return;
    }

    if (anonKey.length < 20) {
      setStatusMsg({ success: false, message: 'Anon API Key appears to be invalid or too short.' });
      setTesting(false);
      return;
    }

    // Save and reload
    saveSupabaseCredentials(url, anonKey);
  };

  const handleClear = () => {
    clearSupabaseCredentials();
  };

  const copySqlPath = () => {
    navigator.clipboard.writeText('supabase/schema.sql');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 sm:p-8 text-slate-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">Supabase Integration</h2>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                  isConfigured
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                }`}
              >
                {isConfigured ? 'Live Database Active' : 'Local Demo Storage Active'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">PostgreSQL Database, Realtime Subscriptions & Auth</p>
          </div>
        </div>

        {/* Informational banner */}
        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 text-xs mb-5 space-y-2">
          <div className="flex items-start gap-2 text-slate-300">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              The application operates seamlessly in <strong>Dual Mode</strong>: automatically synchronizing with live Supabase PostgreSQL when credentials are provided, or running with persistent local storage during offline evaluation.
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-700/60 text-[11px] text-slate-400">
            <span>SQL Schema File:</span>
            <button
              onClick={copySqlPath}
              className="text-emerald-400 hover:underline flex items-center gap-1 font-mono font-semibold"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied path!' : 'supabase/schema.sql'}
            </button>
          </div>
        </div>

        {statusMsg && (
          <div
            className={`p-3 rounded-xl mb-4 text-xs flex items-center gap-2 border ${
              statusMsg.success
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                : 'bg-red-950/40 border-red-500/30 text-red-300'
            }`}
          >
            {statusMsg.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
            <span>{statusMsg.message}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleTestAndSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>Supabase Project URL</span>
            </label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
              className="w-full bg-slate-950/90 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 border border-slate-700 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-slate-400" />
              <span>Supabase Anon Public API Key</span>
            </label>
            <input
              type="password"
              required
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full bg-slate-950/90 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 border border-slate-700 focus:outline-none focus:border-emerald-500 font-mono"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Found in: Project Settings &rarr; API &rarr; Project API keys (anon / public)
            </span>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            {isConfigured ? (
              <button
                type="button"
                onClick={handleClear}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 text-xs font-semibold transition-all"
              >
                Disconnect & Use Local Demo
              </button>
            ) : (
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>Create Free Project on Supabase</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={testing}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
              >
                {testing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Save & Connect</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
