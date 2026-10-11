import React, { useRef } from 'react';
import { InvoiceData } from '../types/invoice';
import { calculateInvoice, formatCurrency } from '../utils/calculations';
import { X, FolderOpen, Save, Trash2, ArrowRight, Download, Upload } from 'lucide-react';

interface SavedInvoicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentInvoice: InvoiceData;
  onLoadInvoice: (invoice: InvoiceData) => void;
  savedInvoices: InvoiceData[];
  onSaveCurrent: () => void;
  onDeleteInvoice: (id: string) => void;
  onImportInvoices: (invoices: InvoiceData[]) => void;
}

export const SavedInvoicesModal: React.FC<SavedInvoicesModalProps> = ({
  isOpen,
  onClose,
  currentInvoice,
  onLoadInvoice,
  savedInvoices,
  onSaveCurrent,
  onDeleteInvoice,
  onImportInvoices,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExportBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(savedInvoices, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `TaxFlow_Invoices_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = event => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            onImportInvoices(parsed);
          } else if (parsed.meta && parsed.items) {
            onImportInvoices([parsed]);
          }
        } catch (err) {
          alert('Invalid JSON file format.');
        }
      };
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <FolderOpen className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-slate-900">Saved Invoices & Bills</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <button
            onClick={onSaveCurrent}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-2xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Current Bill</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportBackup}
              disabled={savedInvoices.length === 0}
              className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-300 hover:bg-slate-100 rounded-lg text-slate-700 font-medium disabled:opacity-40"
              title="Download backup file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-300 hover:bg-slate-100 rounded-lg text-slate-700 font-medium"
              title="Import backup file"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import JSON</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />
          </div>
        </div>

        {/* Invoices List */}
        <div className="overflow-y-auto p-6 space-y-3 flex-1">
          {savedInvoices.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FolderOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-700">No saved invoices found</p>
              <p className="text-xs text-slate-500 mt-1">
                Click &ldquo;Save Current Bill&rdquo; above to store this invoice in your browser storage.
              </p>
            </div>
          ) : (
            savedInvoices.map(inv => {
              const calc = calculateInvoice(inv);
              const isCurrent = inv.id === currentInvoice.id;
              return (
                <div
                  key={inv.id}
                  className={`p-3.5 rounded-lg border transition-all flex items-center justify-between gap-4 ${
                    isCurrent
                      ? 'border-indigo-400 bg-indigo-50/30 ring-1 ring-indigo-200'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {inv.meta.invoiceNumber || inv.meta.billNumber || 'Untitled Bill'}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] bg-indigo-100 text-indigo-700 font-medium px-2 py-0.5 rounded">
                          Currently Active
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5 truncate">
                      <strong>To:</strong> {inv.party.partyName || 'Unknown Party'}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-1">
                      <span>Date: {inv.meta.invoiceDate}</span>
                      <span>·</span>
                      <span>{inv.items.length} item(s)</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-sm text-slate-900 tabular-nums">
                      {formatCurrency(calc.grandTotal, inv.meta.currencySymbol)}
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 justify-end">
                      <button
                        onClick={() => {
                          onLoadInvoice(inv);
                          onClose();
                        }}
                        className="px-2.5 py-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors flex items-center gap-1"
                      >
                        <span>Load</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onDeleteInvoice(inv.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Delete bill"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
