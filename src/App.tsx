import React, { useState, useEffect } from 'react';
import { InvoiceData } from './types/invoice';
import { DEFAULT_INVOICE } from './utils/defaultData';
import { exportInvoiceToExcel } from './utils/excelExport';
import { Header } from './components/Header';
import { InvoiceEditor } from './components/InvoiceEditor';
import { InvoicePreview } from './components/InvoicePreview';
import { SavedInvoicesModal } from './components/SavedInvoicesModal';
import { TemplateSelectorModal } from './components/TemplateSelectorModal';
import { QuickCalculationsBar } from './components/QuickCalculationsBar';
import { CheckCircle2, Info } from 'lucide-react';

const STORAGE_KEY_CURRENT = 'taxflow_current_invoice_v1';
const STORAGE_KEY_SAVED = 'taxflow_saved_invoices_v1';

export default function App() {
  const [invoice, setInvoice] = useState<InvoiceData>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CURRENT);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load invoice from localStorage', e);
    }
    return DEFAULT_INVOICE;
  });

  const [savedInvoices, setSavedInvoices] = useState<InvoiceData[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SAVED);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load saved invoices', e);
    }
    return [DEFAULT_INVOICE];
  });

  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-save current invoice to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(invoice));
    } catch (e) {
      console.error('Could not save current invoice', e);
    }
  }, [invoice]);

  // Persist saved invoices list
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify(savedInvoices));
    } catch (e) {
      console.error('Could not persist saved invoices', e);
    }
  }, [savedInvoices]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleExportExcel = () => {
    try {
      exportInvoiceToExcel(invoice);
      showToast('Excel file downloaded with all data and formulas!');
    } catch (err) {
      console.error('Failed to export Excel', err);
      alert('Error generating Excel file. Please check console for details.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleNewInvoice = () => {
    if (confirm('Create a new blank invoice? (Your current invoice is auto-saved)')) {
      const newBillNumber = `INV-${new Date().getFullYear()}/${String(Math.floor(100 + Math.random() * 900))}`;
      const newInv: InvoiceData = {
        ...DEFAULT_INVOICE,
        id: `inv-${Date.now()}`,
        meta: {
          ...DEFAULT_INVOICE.meta,
          invoiceNumber: newBillNumber,
          billNumber: newBillNumber.replace('INV-', 'BILL-'),
          invoiceDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
        },
        party: {
          ...DEFAULT_INVOICE.party,
          partyName: '',
          billingAddress: '',
          city: '',
          pincode: '',
          gstin: '',
          phone: '',
          email: '',
          shippingAddress: '',
        },
        items: [
          {
            id: `item-${Date.now()}`,
            description: '',
            hsnCode: '',
            quantity: 1,
            unit: 'PCS',
            rate: 0,
            discountPercent: 0,
            gstRate: 18,
            taxableAmount: 0,
            cgstRate: 9,
            cgstAmount: 0,
            sgstRate: 9,
            sgstAmount: 0,
            igstRate: 0,
            igstAmount: 0,
            totalAmount: 0,
          },
        ],
        updatedAt: new Date().toISOString(),
      };
      setInvoice(newInv);
      showToast('New blank invoice created');
    }
  };

  const handleSaveCurrent = () => {
    const existingIndex = savedInvoices.findIndex(i => i.id === invoice.id);
    if (existingIndex >= 0) {
      const updated = [...savedInvoices];
      updated[existingIndex] = invoice;
      setSavedInvoices(updated);
      showToast('Updated existing saved invoice!');
    } else {
      setSavedInvoices(prev => [invoice, ...prev]);
      showToast('Invoice saved successfully to browser storage!');
    }
  };

  const handleDeleteSaved = (id: string) => {
    if (confirm('Delete this invoice from saved list?')) {
      setSavedInvoices(prev => prev.filter(i => i.id !== id));
      showToast('Invoice removed from saved list');
    }
  };

  const handleLoadInvoice = (loaded: InvoiceData) => {
    setInvoice(loaded);
    showToast(`Loaded invoice ${loaded.meta.invoiceNumber || loaded.meta.billNumber}`);
  };

  const handleImportInvoices = (imported: InvoiceData[]) => {
    setSavedInvoices(prev => [...imported, ...prev]);
    if (imported.length > 0) {
      setInvoice(imported[0]);
    }
    showToast(`Successfully imported ${imported.length} invoice(s)`);
  };

  const handleSelectTemplate = (templateData: Partial<InvoiceData>) => {
    setInvoice(prev => ({
      ...prev,
      ...templateData,
      id: `inv-${Date.now()}`,
      updatedAt: new Date().toISOString(),
    }));
    showToast('Template preset applied');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Header
        viewMode={viewMode}
        setViewMode={setViewMode}
        onExportExcel={handleExportExcel}
        onPrint={handlePrint}
        onNewInvoice={handleNewInvoice}
        onOpenSaved={() => setIsSavedModalOpen(true)}
        onOpenTemplates={() => setIsTemplatesModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Banner with brief instructions & reassurance */}
        <div className="mb-6 p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-900">
                GST Tax Invoice Generator & Excel Exporter
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Input party particulars, GSTIN, item rates and bank details. Totals and CGST/SGST/IGST recalculate in real-time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <span className="text-xs text-slate-500">
              Tax Mode:{' '}
              <strong className="text-indigo-600 font-medium">
                {invoice.meta.isInterState ? 'IGST (Inter-State)' : 'CGST + SGST (Intra-State)'}
              </strong>
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500 font-mono">
              Bill: <strong>{invoice.meta.invoiceNumber || invoice.meta.billNumber}</strong>
            </span>
          </div>
        </div>

        {/* Viewport switch: Split, Form Only, or Preview Only */}
        <div className="w-full">
          {viewMode === 'split' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-6 xl:col-span-6 no-print">
                <InvoiceEditor invoice={invoice} onChange={setInvoice} />
              </div>
              <div className="lg:col-span-6 xl:col-span-6 sticky top-24">
                <InvoicePreview invoice={invoice} onChange={setInvoice} />
              </div>
            </div>
          )}

          {viewMode === 'edit' && (
            <div className="max-w-4xl mx-auto no-print">
              <InvoiceEditor invoice={invoice} onChange={setInvoice} />
            </div>
          )}

          {viewMode === 'preview' && (
            <div className="py-2">
              <InvoicePreview invoice={invoice} onChange={setInvoice} />
            </div>
          )}
        </div>
      </main>

      {/* Floating Bottom Calculations Bar */}
      <QuickCalculationsBar
        invoice={invoice}
        onExportExcel={handleExportExcel}
        onPrint={handlePrint}
      />

      {/* Modals */}
      <SavedInvoicesModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        currentInvoice={invoice}
        onLoadInvoice={handleLoadInvoice}
        savedInvoices={savedInvoices}
        onSaveCurrent={handleSaveCurrent}
        onDeleteInvoice={handleDeleteSaved}
        onImportInvoices={handleImportInvoices}
      />

      <TemplateSelectorModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2 no-print">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
