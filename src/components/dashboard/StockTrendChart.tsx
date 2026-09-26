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
            <TrendingUp className="w-4 h-4 text-blue-700" />
            <span>Stock Movement</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Incoming and outgoing quantities over the last seven days
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
            <span className="text-slate-300">Incoming (+Qty)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block"></span>
            <span className="text-slate-300">Outgoing (-Qty)</span>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="date" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderColor: '#e5e7eb',
                borderRadius: '8px',
                color: '#1f2937',
                fontSize: '12px',
              }}
            />
            <Area
              type="monotone"
              dataKey="incoming"
              name="Incoming (IN)"
              stroke="#2563eb"
              strokeWidth={2}
              fill="none"
            />
            <Area
              type="monotone"
              dataKey="outgoing"
              name="Outgoing (OUT)"
              stroke="#94a3b8"
              strokeWidth={2}
              fill="none"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
