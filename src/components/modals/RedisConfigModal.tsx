import React, { useState, useEffect } from 'react';
import { Zap, X, CheckCircle2, AlertCircle, RefreshCw, Key, Globe, Shield, Activity, Trash2 } from 'lucide-react';
import { isRedisConfigured, saveRedisCredentials, clearRedisCredentials, getRedisUrl, getRedisToken } from '../../lib/redis';
import { redisCache } from '../../services/redisService';
import { useIMSStore } from '../../store/useIMSStore';

interface RedisConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RedisConfigModal: React.FC<RedisConfigModalProps> = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');
  const [testing, setTesting] = useState(false);
  const [pingResult, setPingResult] = useState<{ connected: boolean; latencyMs?: number; error?: string } | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ success: boolean; message: string } | null>(null);
  const [flushed, setFlushed] = useState(false);

  const { redisCacheTTL } = useIMSStore();
  const stats = redisCache.getStats();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUrl(getRedisUrl());
      setToken(getRedisToken());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isConfigured = isRedisConfigured();

  const handleTestPing = async () => {
    setTesting(true);
    setPingResult(null);
    const result = await redisCache.ping();
    setPingResult(result);
    setTesting(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.startsWith('https://') || !url.includes('upstash.io')) {
      setStatusMsg({ success: false, message: 'URL must start with https:// and end with upstash.io' });
      return;
    }
    if (token.length < 10) {
      setStatusMsg({ success: false, message: 'REST Token appears to be invalid or too short.' });
      return;
    }

    saveRedisCredentials(url, token);
  };

  const handleClear = () => {
    clearRedisCredentials();
  };

  const handleFlushCache = async () => {
    await redisCache.invalidateKPIsCache();
    setFlushed(true);
    setTimeout(() => setFlushed(false), 2000);
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
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Zap className="w-6 h-6 fill-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">Upstash Redis Caching</h2>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                  isConfigured
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                }`}
              >
                {isConfigured ? 'Live Redis Connected' : 'Local Fast Cache Active'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Sub-millisecond KPI Aggregation Caching (TTL: 60s)</p>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Cache TTL</span>
            <span className="text-lg font-bold font-mono text-emerald-400">{redisCacheTTL}s</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Cache Hits</span>
            <span className="text-lg font-bold font-mono text-indigo-300">{stats.hits}</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Cache Misses</span>
            <span className="text-lg font-bold font-mono text-amber-300">{stats.misses}</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Active Keys</span>
            <span className="text-lg font-bold font-mono text-purple-300">{stats.cachedKeysCount}</span>
          </div>
        </div>

        {/* Informational banner */}
        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 text-xs mb-5 space-y-2">
          <div className="flex items-start gap-2 text-slate-300">
            <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Dashboard KPI aggregations (Products in Stock, Low Stock, Pending Receipts, Deliveries, and Transfers) are cached in Redis with a <strong>60-second TTL</strong> to eliminate expensive database compute spikes. Caches automatically invalidate on any inventory mutation.
            </span>
          </div>
        </div>

        {/* Test Ping Bar */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs mb-5">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-400" />
            <span className="text-slate-300 font-medium">Redis Diagnostic Ping:</span>
            {pingResult && (
              <span className={`font-mono font-bold ${pingResult.connected ? 'text-emerald-400' : 'text-amber-400'}`}>
                {pingResult.connected ? `Connected (${pingResult.latencyMs}ms latency)` : pingResult.error}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleFlushCache}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-[11px] flex items-center gap-1"
              title="Clear cached KPI entries"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{flushed ? 'Flushed!' : 'Flush Cache'}</span>
            </button>
            <button
              type="button"
              onClick={handleTestPing}
              disabled={testing}
              className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? 'Testing...' : 'Test Ping'}</span>
            </button>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>Upstash Redis REST URL</span>
            </label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-upstash-db.upstash.io"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-indigo-400" />
              <span>Upstash Redis REST Token</span>
            </label>
            <input
              type="password"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="AZ...UpstashRESTToken"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          {statusMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                statusMsg.success ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30' : 'bg-red-950/60 text-red-300 border border-red-500/30'
              }`}
            >
              {statusMsg.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{statusMsg.message}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            {isConfigured ? (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-red-400 hover:text-red-300 underline font-medium"
              >
                Revert to Local Cache
              </button>
            ) : (
              <span className="text-[11px] text-slate-500">Dual-mode automatically falls back to local memory</span>
            )}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
              >
                Save & Connect
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
