import React from 'react';
import { FileSpreadsheet, Printer, Plus, FolderOpen, LayoutTemplate } from 'lucide-react';

interface HeaderProps {
  viewMode: 'split' | 'edit' | 'preview';
  setViewMode: (mode: 'split' | 'edit' | 'preview') => void;
  onExportExcel: () => void;
  onPrint: () => void;
  onNewInvoice: () => void;
  onOpenSaved: () => void;
  onOpenTemplates: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  setViewMode,
  onExportExcel,
  onPrint,
  onNewInvoice,
  onOpenSaved,
  onOpenTemplates,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-xs">
            ₹
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
            TaxFlow Invoice
          </span>
        </div>

        {/* Zone 2: View Switcher and Quick Actions */}
        <div className="flex items-center gap-2">
          {/* View Mode Segmented Controls */}
          <div className="hidden sm:flex items-center p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                viewMode === 'split'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Split View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('edit')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                viewMode === 'edit'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Form Editor
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                viewMode === 'preview'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Document Preview
            </button>
          </div>

          <div className="h-5 w-px bg-slate-200 hidden md:block mx-1" />

          {/* Templates & Saved bills */}
          <button
            type="button"
            onClick={onOpenTemplates}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
            title="Choose invoice template preset"
          >
            <LayoutTemplate className="w-3.5 h-3.5 text-slate-600" />
            <span>Templates</span>
          </button>

          <button
            type="button"
            onClick={onOpenSaved}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
            title="Saved bills in browser"
          >
            <FolderOpen className="w-3.5 h-3.5 text-slate-600" />
            <span>Saved</span>
          </button>

          <button
            type="button"
            onClick={onNewInvoice}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
            title="Create new blank invoice"
          >
            <Plus className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">New Bill</span>
          </button>
        </div>

        {/* Zone 3: Primary Action (Excel Export & Print) */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onPrint}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 shadow-2xs"
            title="Print or Save as PDF"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span className="hidden md:inline">Print / PDF</span>
          </button>

          <button
            type="button"
            onClick={onExportExcel}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Download Excel</span>
          </button>
        </div>
      </div>
    </header>
  );
};
