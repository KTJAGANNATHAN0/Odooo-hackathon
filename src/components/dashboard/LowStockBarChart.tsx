import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { useIMSStore } from '../../store/useIMSStore';
import { AlertCircle } from 'lucide-react';

export const LowStockBarChart: React.FC = () => {
  const { products, stockLevels, activeWarehouseId } = useIMSStore();

  const data = products.map((p) => {
    const qty = stockLevels
      .filter((sl) => sl.product_id === p.id && (activeWarehouseId === 'all' || sl.warehouse_id === activeWarehouseId))
      .reduce((sum, item) => sum + Number(item.quantity), 0);

    return {
      name: p.name.length > 18 ? p.name.substring(0, 16) + '...' : p.name,
      fullName: p.name,
      current: qty,
      reorder: p.reorder_level,
      uom: p.unit_of_measure,
      sku: p.sku,
    };
  })
  .sort((a, b) => a.current - b.current)
  .slice(0, 5); // Top 5 critical items

  return (
    <div className="glass-card p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 text-white font-semibold text-base">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            <span>Top Low-Stock Items vs Reorder Threshold</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Products requiring immediate vendor PO reordering
          </p>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} horizontal={false} />
            <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} />
            <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={100} tickLine={false} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs text-white">
                      <div className="font-bold text-amber-300">{item.fullName}</div>
                      <div className="text-slate-400 font-mono">SKU: {item.sku}</div>
                      <div className="mt-1 flex items-center justify-between gap-4">
                        <span>Current Stock:</span>
                        <span className="font-mono font-bold text-white">{item.current} {item.uom}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span>Reorder Level:</span>
                        <span className="font-mono text-amber-400">{item.reorder} {item.uom}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="current" name="Current Stock" radius={[0, 8, 8, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.current === 0 ? '#ef4444' : entry.current <= entry.reorder ? '#f59e0b' : '#6366f1'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
