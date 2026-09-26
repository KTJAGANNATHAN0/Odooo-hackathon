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
            <AlertCircle className="w-4 h-4 text-amber-700" />
            <span>Stock vs. Reorder Level</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Five products ranked by current available quantity
          </p>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
            <XAxis type="number" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis dataKey="name" type="category" stroke="#4b5563" fontSize={11} width={100} tickLine={false} axisLine={false} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-white border border-slate-200 p-3 rounded-lg text-xs text-slate-800">
                      <div className="font-semibold text-slate-900">{item.fullName}</div>
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
                  fill={entry.current === 0 ? '#b91c1c' : entry.current <= entry.reorder ? '#b45309' : '#2563eb'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
