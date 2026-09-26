import React from 'react';
import { Operation, Product, Warehouse } from '../../types';
import { useIMSStore } from '../../store/useIMSStore';
import { Printer, X, CheckCircle2, Building2, User, Calendar, FileText } from 'lucide-react';

interface PrintOperationModalProps {
  operation: Operation | null;
  onClose: () => void;
}

export const PrintOperationModal: React.FC<PrintOperationModalProps> = ({ operation, onClose }) => {
  const { products, warehouses } = useIMSStore();

  if (!operation) return null;

  const handlePrint = () => {
    window.print();
  };

  const srcWh = warehouses.find((w) => w.id === operation.source_warehouse_id);
  const destWh = warehouses.find((w) => w.id === operation.destination_warehouse_id);

  const getDocTitle = () => {
    switch (operation.type) {
      case 'receipt':
        return 'GOODS RECEIPT SLIP';
      case 'delivery':
        return 'DELIVERY ORDER DISPATCH NOTE';
      case 'transfer':
        return 'INTERNAL WAREHOUSE TRANSFER NOTE';
      case 'adjustment':
        return 'PHYSICAL STOCK ADJUSTMENT VOUCHER';
    }
  };

  const printDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-slip, #printable-slip * {
            visibility: visible;
          }
          #printable-slip {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 24px;
            background: white !important;
            color: #0f172a !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-3xl my-8 rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 sm:p-8 text-slate-200">
        {/* Modal Controls */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800 no-print">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
            <Printer className="w-4 h-4 text-indigo-400" />
            <span>Printable Inventory Document</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30"
            >
              <Printer className="w-4 h-4" /> Print Document
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Paper */}
        <div
          id="printable-slip"
          className="bg-white text-slate-900 p-8 rounded-2xl shadow-md border border-slate-200 font-sans"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b-2 border-slate-800 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-indigo-700">ODOO</span>
                <span className="text-xl font-bold tracking-tight text-slate-800">INVENTORY SYSTEMS</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Central Warehouse Management & Logistics</p>
            </div>
            <div className="text-left sm:text-right">
              <span className="inline-block px-3 py-1 rounded-md text-xs font-black tracking-wider uppercase bg-slate-900 text-white mb-1">
                {getDocTitle()}
              </span>
              <div className="font-mono text-base font-extrabold text-indigo-600">
                {operation.reference_no}
              </div>
            </div>
          </div>

          {/* Meta Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-5 border-b border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Status</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700 uppercase mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> {operation.status}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Schedule Date</span>
              <span className="font-semibold text-slate-800 font-mono mt-0.5 block">{operation.schedule_date || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Responsible</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">{operation.responsible_name || operation.created_by}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Printed Date</span>
              <span className="font-semibold text-slate-600 font-mono text-[11px] mt-0.5 block">{printDate}</span>
            </div>
          </div>

          {/* Parties Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5 border-b border-slate-200 text-xs bg-slate-50 p-4 rounded-xl my-4">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider mb-1">
                {operation.type === 'receipt' ? 'Vendor / Source:' : 'Source Location:'}
              </span>
              <div className="font-bold text-slate-900 text-sm">
                {operation.type === 'receipt' ? operation.supplier_or_customer || 'Vendor Delivery' : srcWh?.name || 'Central Hub'}
              </div>
              {srcWh?.location && <div className="text-[11px] text-slate-500">{srcWh.location}</div>}
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider mb-1">
                {operation.type === 'delivery' ? 'Destination Customer / Address:' : 'Destination Warehouse:'}
              </span>
              <div className="font-bold text-slate-900 text-sm">
                {operation.type === 'delivery' ? operation.supplier_or_customer || 'Customer Dispatch' : destWh?.name || 'Main Storage'}
              </div>
              {destWh?.location && <div className="text-[11px] text-slate-500">{destWh.location}</div>}
            </div>
          </div>

          {/* Product Items Table */}
          <div className="my-6">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Itemized Product List</div>
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                <tr className="border-b border-slate-200">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3 text-right">Expected Qty</th>
                  <th className="py-2.5 px-3 text-right">Actual Qty</th>
                  <th className="py-2.5 px-3">Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {operation.lines.map((line, idx) => {
                  const prod = products.find((p) => p.id === line.product_id);
                  return (
                    <tr key={line.id || idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-500">{idx + 1}</td>
                      <td className="py-2 px-3 font-bold text-indigo-700">{prod?.sku || 'SKU-N/A'}</td>
                      <td className="py-2 px-3 font-sans font-semibold text-slate-900">{prod?.name || 'Item'}</td>
                      <td className="py-2 px-3 text-right text-slate-600">{line.expected_qty}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">
                        {line.actual_qty ?? line.expected_qty}
                      </td>
                      <td className="py-2 px-3 text-slate-600 font-sans uppercase">{line.unit_of_measure}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Notes */}
          {operation.notes && (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 mb-6">
              <strong className="text-slate-800">Operational Notes: </strong>
              {operation.notes}
            </div>
          )}

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-8 mt-6 border-t border-slate-200 text-xs">
            <div>
              <div className="h-12 border-b border-slate-400 border-dashed mb-1"></div>
              <div className="font-bold text-slate-800">Prepared / Dispatched By</div>
              <div className="text-[10px] text-slate-500">Warehouse Staff Signature</div>
            </div>
            <div>
              <div className="h-12 border-b border-slate-400 border-dashed mb-1"></div>
              <div className="font-bold text-slate-800">Received & Inspected By</div>
              <div className="text-[10px] text-slate-500">Authorized Agent / Receiver Signature</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
