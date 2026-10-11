import React from 'react';
import { InvoiceData } from '../types/invoice';
import { calculateInvoice, formatCurrency } from '../utils/calculations';
import { FileSpreadsheet, Printer } from 'lucide-react';

interface QuickCalculationsBarProps {
  invoice: InvoiceData;
  onExportExcel: () => void;
  onPrint: () => void;
}

export const QuickCalculationsBar: React.FC<QuickCalculationsBarProps> = ({
  invoice,
  onExportExcel,
  onPrint,
}) => {
  const calc = calculateInvoice(invoice);
  const currency = invoice.meta.currencySymbol;

  return (
    <div className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-4 py-2.5 no-print">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Real-time metrics counters */}
        <div className="flex items-center flex-wrap gap-4 sm:gap-6 text-xs w-full sm:w-auto justify-between sm:justify-start">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase tracking-wider">
              Line Items
            </span>
            <span className="font-semibold text-slate-800 font-mono">
              {invoice.items.length} item{invoice.items.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          <div>
            <span className="text-slate-500 block text-[10px] uppercase tracking-wider">
              Taxable Value
            </span>
            <span className="font-semibold text-slate-900 font-mono tabular-nums">
              {formatCurrency(calc.totalTaxableAmount, currency)}
            </span>
          </div>

          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          <div>
            <span className="text-slate-500 block text-[10px] uppercase tracking-wider">
              {invoice.meta.isInterState ? 'IGST Total' : 'Total GST (CGST+SGST)'}
            </span>
            <span className="font-semibold text-slate-900 font-mono tabular-nums">
              {formatCurrency(calc.totalTaxAmount, currency)}
            </span>
          </div>

          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          <div className="bg-indigo-50/80 px-3 py-1 rounded-md border border-indigo-100">
            <span className="text-indigo-700 block text-[10px] uppercase font-bold tracking-wider">
              Grand Total
            </span>
            <span className="text-sm font-bold text-indigo-700 font-mono tabular-nums">
              {formatCurrency(calc.grandTotal, currency)}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onPrint}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print</span>
          </button>

          <button
            type="button"
            onClick={onExportExcel}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export to Excel</span>
          </button>
        </div>
      </div>
    </div>
  );
};
