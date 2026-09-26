import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useIMSStore } from '../../store/useIMSStore';
import { TrendingUp, Calendar } from 'lucide-react';

export const StockTrendChart: React.FC = () => {
  const { ledger } = useIMSStore();

  // Aggregate ledger by date (last 7 days simulation)
  const daysMap: Record<string, { date: string; incoming: number; outgoing: number; transfers: number }> = {};

  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    daysMap[dateStr] = { date: dateStr, incoming: 0, outgoing: 0, transfers: 0 };
  }

  ledger.forEach((entry) => {
    const d = new Date(entry.performed_at);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (daysMap[dateStr]) {
      if (entry.movement_type === 'IN') {
        daysMap[dateStr].incoming += Math.abs(entry.quantity_change);
      } else if (entry.movement_type === 'OUT') {
        daysMap[dateStr].outgoing += Math.abs(entry.quantity_change);
      } else if (entry.movement_type.includes('TRANSFER')) {
        daysMap[dateStr].transfers += Math.abs(entry.quantity_change);
      }
    }
  });

  const chartData = Object.values(daysMap);

  return (
    <div className="glass-card p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 text-white font-semibold text-base">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <span>Stock Movement Activity (Last 7 Days)</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Aggregated stock inflows (Receipts) vs outflows (Deliveries) from Stock Ledger
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
            <span className="text-slate-300">Incoming (+Qty)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>
            <span className="text-slate-300">Outgoing (-Qty)</span>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIncoming" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorOutgoing" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '12px',
                color: '#f8fafc',
                fontSize: '12px',
              }}
            />
            <Area
              type="monotone"
              dataKey="incoming"
              name="Incoming (IN)"
              stroke="#10b981"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorIncoming)"
            />
            <Area
              type="monotone"
              dataKey="outgoing"
              name="Outgoing (OUT)"
              stroke="#3b82f6"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorOutgoing)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
