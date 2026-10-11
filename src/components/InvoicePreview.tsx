import React, { useState } from 'react';
import { InvoiceData } from '../types/invoice';
import { calculateInvoice, formatCurrency } from '../utils/calculations';
import { Landmark, Check, Edit2, ShieldCheck } from 'lucide-react';

interface InvoicePreviewProps {
  invoice: InvoiceData;
  onChange: (updated: InvoiceData) => void;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoice, onChange }) => {
  const calc = calculateInvoice(invoice);
  const [inlineEditing, setInlineEditing] = useState<string | null>(null);

  const isInterState = invoice.meta.isInterState;
  const currency = invoice.meta.currencySymbol;

  // Simple quick inline field update helper
  const handleInlineChange = (path: string, value: any) => {
    const keys = path.split('.');
    const cloned: any = JSON.parse(JSON.stringify(invoice));
    let target = cloned;
    for (let i = 0; i < keys.length - 1; i++) {
      target = target[keys[i]];
    }
    target[keys[keys.length - 1]] = value;
    onChange(cloned);
  };

  return (
    <div className="w-full max-w-[850px] mx-auto bg-white text-slate-900 border border-slate-300 shadow-md rounded-sm p-6 sm:p-10 invoice-printable font-sans leading-relaxed text-[13px]">
      {/* TOP INVOICE HEADER BAR */}
      <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
        <div>
          <span className="text-xl font-bold tracking-tight text-slate-900 uppercase">
            {invoice.meta.invoiceType || 'TAX INVOICE'}
          </span>
          <span className="block text-[11px] text-slate-500 uppercase tracking-widest mt-0.5">
            Issued under GST Rules 2017
          </span>
        </div>

        <div className="text-right">
          <span className="inline-block text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded tracking-wide uppercase">
            {invoice.meta.copyType || 'ORIGINAL FOR RECIPIENT'}
          </span>
          <div className="text-[11px] text-slate-500 mt-1">
            Reverse Charge:{' '}
            <strong className="text-slate-800">{invoice.meta.reverseCharge ? 'YES' : 'NO'}</strong>
          </div>
        </div>
      </div>

      {/* SELLER / COMPANY PROFILE HEADER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4 border-b border-slate-200 mb-4">
        <div>
          <div className="flex items-center gap-2 group">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              {invoice.seller.companyName}
            </h1>
          </div>
          {invoice.seller.tagline && (
            <p className="text-xs text-slate-500 italic mb-1">{invoice.seller.tagline}</p>
          )}
          <p className="text-slate-600 text-xs mt-1">
            {invoice.seller.address}, {invoice.seller.city}, {invoice.seller.state} -{' '}
            {invoice.seller.pincode}
          </p>
          <div className="mt-2 text-xs space-y-0.5 text-slate-700">
            <div>
              <span className="font-semibold text-slate-900">GSTIN:</span>{' '}
              <span className="font-mono font-medium">{invoice.seller.gstin || 'Unregistered'}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">PAN:</span>{' '}
              <span className="font-mono">{invoice.seller.pan || 'N/A'}</span>
              <span className="mx-2 text-slate-300">|</span>
              <span className="font-semibold text-slate-900">State:</span>{' '}
              {invoice.seller.state} ({invoice.seller.stateCode})
            </div>
            {(invoice.seller.phone || invoice.seller.email) && (
              <div className="text-slate-600">
                <span>Tel: {invoice.seller.phone}</span>
                {invoice.seller.email && <span> · Email: {invoice.seller.email}</span>}
              </div>
            )}
          </div>
        </div>

        {/* INVOICE META GRID */}
        <div className="bg-slate-50/80 rounded border border-slate-200 p-3.5 space-y-1.5 text-xs">
          <div className="flex justify-between items-center py-0.5 border-b border-slate-200/60">
            <span className="text-slate-500 font-medium">Invoice / Bill No:</span>
            <span className="font-bold font-mono text-slate-900 text-sm">
              {invoice.meta.invoiceNumber || invoice.meta.billNumber || 'INV-001'}
            </span>
          </div>
          <div className="flex justify-between items-center py-0.5 border-b border-slate-200/60">
            <span className="text-slate-500 font-medium">Invoice Date:</span>
            <span className="font-mono text-slate-900">{invoice.meta.invoiceDate}</span>
          </div>
          <div className="flex justify-between items-center py-0.5 border-b border-slate-200/60">
            <span className="text-slate-500 font-medium">Payment Due Date:</span>
            <span className="font-mono text-slate-900">{invoice.meta.dueDate || 'Upon Receipt'}</span>
          </div>
          <div className="flex justify-between items-center py-0.5 border-b border-slate-200/60">
            <span className="text-slate-500 font-medium">Place of Supply:</span>
            <span className="font-semibold text-slate-900">{invoice.party.placeOfSupply || invoice.party.state}</span>
          </div>
          {invoice.meta.poNumber && (
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-500 font-medium">PO No & Date:</span>
              <span className="font-mono text-slate-900">
                {invoice.meta.poNumber} {invoice.meta.poDate ? `(${invoice.meta.poDate})` : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* BILLED TO (PARTY DETAILS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-slate-200 mb-4">
        <div className="border border-slate-200 rounded p-3 bg-slate-50/40">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Billed To (Party Details)
          </div>
          <div className="font-bold text-slate-900 text-sm">{invoice.party.partyName || 'Party Name'}</div>
          <p className="text-xs text-slate-600 mt-1">
            {invoice.party.billingAddress}
            {invoice.party.city && `, ${invoice.party.city}`}
            {invoice.party.pincode && ` - ${invoice.party.pincode}`}
          </p>
          <div className="mt-2 text-xs space-y-0.5">
            <div>
              <span className="font-semibold text-slate-900">GSTIN:</span>{' '}
              <span className="font-mono font-medium text-slate-900">
                {invoice.party.gstin || 'Consumer / Unregistered'}
              </span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">State:</span>{' '}
              {invoice.party.state} (Code: {invoice.party.stateCode})
            </div>
            {(invoice.party.phone || invoice.party.email) && (
              <div className="text-slate-600">
                Contact: {invoice.party.phone} {invoice.party.email ? `· ${invoice.party.email}` : ''}
              </div>
            )}
          </div>
        </div>

        <div className="border border-slate-200 rounded p-3 bg-slate-50/40">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Shipped To (Delivery Destination)
          </div>
          {invoice.party.sameAsBilling ? (
            <div className="text-xs text-slate-600 pt-1">
              <div className="font-medium text-slate-800">Same as Billed Address</div>
              <p className="text-slate-500 mt-1">
                {invoice.party.billingAddress}, {invoice.party.city}, {invoice.party.state}
              </p>
            </div>
          ) : (
            <div className="text-xs text-slate-600 pt-1">
              <p>{invoice.party.shippingAddress || 'As per purchase order'}</p>
            </div>
          )}
          <div className="mt-3 pt-2 border-t border-slate-200 text-xs flex justify-between items-center text-slate-500">
            <span>Taxation Mode:</span>
            <span className="font-semibold text-slate-800">
              {isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}
            </span>
          </div>
        </div>
      </div>

      {/* ITEM PARTICULARS TABLE */}
      <div className="mb-4 overflow-x-auto">
        <table className="w-full text-left text-xs border border-slate-300 border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-semibold">
              <th className="p-2 border-r border-slate-300 w-10 text-center">#</th>
              <th className="p-2 border-r border-slate-300 min-w-[200px]">Item Particulars / Description</th>
              <th className="p-2 border-r border-slate-300 w-16 text-center">HSN/SAC</th>
              <th className="p-2 border-r border-slate-300 w-14 text-right">Qty</th>
              <th className="p-2 border-r border-slate-300 w-12 text-center">Unit</th>
              <th className="p-2 border-r border-slate-300 w-20 text-right">Rate ({currency})</th>
              <th className="p-2 border-r border-slate-300 w-14 text-right">Disc %</th>
              <th className="p-2 border-r border-slate-300 w-24 text-right">Taxable Val</th>
              {isInterState ? (
                <>
                  <th className="p-2 border-r border-slate-300 w-14 text-right">IGST %</th>
                  <th className="p-2 border-r border-slate-300 w-20 text-right">IGST Amt</th>
                </>
              ) : (
                <>
                  <th className="p-2 border-r border-slate-300 w-14 text-right">CGST %</th>
                  <th className="p-2 border-r border-slate-300 w-16 text-right">CGST</th>
                  <th className="p-2 border-r border-slate-300 w-14 text-right">SGST %</th>
                  <th className="p-2 border-r border-slate-300 w-16 text-right">SGST</th>
                </>
              )}
              <th className="p-2 w-24 text-right font-bold">Total ({currency})</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {invoice.items.map((item, idx) => (
              <tr key={item.id} className="hover:bg-slate-50/80">
                <td className="p-2 border-r border-slate-300 text-center font-mono text-slate-500">
                  {idx + 1}
                </td>
                <td className="p-2 border-r border-slate-300 font-medium text-slate-900">
                  {item.description || <span className="text-slate-400 italic">No description</span>}
                </td>
                <td className="p-2 border-r border-slate-300 text-center font-mono text-slate-700">
                  {item.hsnCode || '-'}
                </td>
                <td className="p-2 border-r border-slate-300 text-right font-mono tabular-nums">
                  {item.quantity}
                </td>
                <td className="p-2 border-r border-slate-300 text-center font-mono text-slate-600">
                  {item.unit}
                </td>
                <td className="p-2 border-r border-slate-300 text-right font-mono tabular-nums">
                  {item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="p-2 border-r border-slate-300 text-right font-mono tabular-nums text-slate-600">
                  {item.discountPercent ? `${item.discountPercent}%` : '-'}
                </td>
                <td className="p-2 border-r border-slate-300 text-right font-mono tabular-nums font-semibold text-slate-800">
                  {item.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>

                {isInterState ? (
                  <>
                    <td className="p-2 border-r border-slate-300 text-right font-mono tabular-nums text-slate-600">
                      {item.igstRate}%
                    </td>
                    <td className="p-2 border-r border-slate-300 text-right font-mono tabular-nums">
                      {item.igstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-2 border-r border-slate-300 text-right font-mono tabular-nums text-slate-600">
                      {item.cgstRate}%
                    </td>
                    <td className="p-2 border-r border-slate-300 text-right font-mono tabular-nums">
                      {item.cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 border-r border-slate-300 text-right font-mono tabular-nums text-slate-600">
                      {item.sgstRate}%
                    </td>
                    <td className="p-2 border-r border-slate-300 text-right font-mono tabular-nums">
                      {item.sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </>
                )}

                <td className="p-2 text-right font-mono tabular-nums font-bold text-slate-900">
                  {item.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>

          {/* Subtotals footer row */}
          <tfoot>
            <tr className="bg-slate-100 font-semibold border-t-2 border-slate-300 text-slate-900">
              <td colSpan={7} className="p-2 border-r border-slate-300 text-right">
                Total Taxable Amount:
              </td>
              <td className="p-2 border-r border-slate-300 text-right font-mono tabular-nums">
                {calc.totalTaxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              {isInterState ? (
                <>
                  <td className="p-2 border-r border-slate-300"></td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono tabular-nums">
                    {calc.totalIgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </>
              ) : (
                <>
                  <td className="p-2 border-r border-slate-300"></td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono tabular-nums">
                    {calc.totalCgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-2 border-r border-slate-300"></td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono tabular-nums">
                    {calc.totalSgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </>
              )}
              <td className="p-2 text-right font-mono tabular-nums font-bold">
                {calc.subtotalWithTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* HSN / SAC TAX SUMMARY ACCORDION / BOX */}
      <div className="mb-4">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
          HSN / SAC Wise Tax Breakdown
        </div>
        <table className="w-full text-xs border border-slate-300 border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-300">
              <th className="p-1.5 border-r border-slate-300 text-left">HSN / SAC</th>
              <th className="p-1.5 border-r border-slate-300 text-right">Taxable Value</th>
              {isInterState ? (
                <>
                  <th className="p-1.5 border-r border-slate-300 text-right">IGST Rate</th>
                  <th className="p-1.5 border-r border-slate-300 text-right">IGST Amount</th>
                </>
              ) : (
                <>
                  <th className="p-1.5 border-r border-slate-300 text-right">CGST Rate</th>
                  <th className="p-1.5 border-r border-slate-300 text-right">CGST Amount</th>
                  <th className="p-1.5 border-r border-slate-300 text-right">SGST Rate</th>
                  <th className="p-1.5 border-r border-slate-300 text-right">SGST Amount</th>
                </>
              )}
              <th className="p-1.5 text-right font-bold">Total Tax ({currency})</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {calc.hsnSummaries.map((h, i) => (
              <tr key={i} className="hover:bg-slate-50/50">
                <td className="p-1.5 border-r border-slate-300 font-mono text-slate-800">{h.hsnCode}</td>
                <td className="p-1.5 border-r border-slate-300 text-right font-mono tabular-nums">
                  {h.taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                {isInterState ? (
                  <>
                    <td className="p-1.5 border-r border-slate-300 text-right font-mono">{h.igstRate}%</td>
                    <td className="p-1.5 border-r border-slate-300 text-right font-mono tabular-nums">
                      {h.igstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-1.5 border-r border-slate-300 text-right font-mono">{h.cgstRate}%</td>
                    <td className="p-1.5 border-r border-slate-300 text-right font-mono tabular-nums">
                      {h.cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-1.5 border-r border-slate-300 text-right font-mono">{h.sgstRate}%</td>
                    <td className="p-1.5 border-r border-slate-300 text-right font-mono tabular-nums">
                      {h.sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </>
                )}
                <td className="p-1.5 text-right font-mono tabular-nums font-semibold text-slate-900">
                  {h.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* LOWER SECTION: BANK DETAILS + GRAND TOTAL CALCULATIONS */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2 pb-4 border-t-2 border-slate-900 mb-4">
        {/* BANK DETAILS (LEFT) - Required in prompt */}
        <div className="md:col-span-7 space-y-3">
          <div className="border border-indigo-200 bg-indigo-50/40 rounded p-3 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2 pb-1 border-b border-indigo-100">
              <Landmark className="w-3.5 h-3.5 text-indigo-600" />
              <span>Bank Account Details for Payment</span>
            </div>

            <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 text-slate-700">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Bank Name:</span>
                <span className="font-semibold text-slate-900">{invoice.bank.bankName || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Account Number:</span>
                <span className="font-mono font-bold text-slate-900 tracking-wider">
                  {invoice.bank.accountNumber || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">IFSC Code:</span>
                <span className="font-mono font-bold text-indigo-700 tracking-wide">
                  {invoice.bank.ifscCode || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Branch & Type:</span>
                <span>{invoice.bank.branch || ''} ({invoice.bank.accountType})</span>
              </div>
              <div className="col-span-2 pt-1 border-t border-indigo-100/60 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-semibold">A/C Name: </span>
                  <span className="font-medium text-slate-800">
                    {invoice.bank.accountHolderName || invoice.seller.companyName}
                  </span>
                </div>
                {invoice.bank.upiId && (
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold">UPI: </span>
                    <span className="font-mono text-indigo-800 font-medium">{invoice.bank.upiId}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Amount in words */}
          <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs">
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
              Invoice Amount in Words:
            </span>
            <span className="font-semibold text-slate-900 italic leading-snug">
              {calc.grandTotalWords}
            </span>
          </div>
        </div>

        {/* SUMMARY CALCULATION TOTALS (RIGHT) */}
        <div className="md:col-span-5 bg-slate-50/70 p-3 rounded border border-slate-200 text-xs space-y-1.5 self-start">
          <div className="flex justify-between items-center py-1 border-b border-slate-200">
            <span className="text-slate-600">Taxable Value:</span>
            <span className="font-mono font-semibold text-slate-800 tabular-nums">
              {formatCurrency(calc.totalTaxableAmount, currency)}
            </span>
          </div>

          {isInterState ? (
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="text-slate-600">Total IGST:</span>
              <span className="font-mono text-slate-800 tabular-nums">
                {formatCurrency(calc.totalIgstAmount, currency)}
              </span>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-600">Total CGST:</span>
                <span className="font-mono text-slate-800 tabular-nums">
                  {formatCurrency(calc.totalCgstAmount, currency)}
                </span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-slate-200">
                <span className="text-slate-600">Total SGST:</span>
                <span className="font-mono text-slate-800 tabular-nums">
                  {formatCurrency(calc.totalSgstAmount, currency)}
                </span>
              </div>
            </>
          )}

          {calc.additionalChargesTotal > 0 && (
            <div className="flex justify-between items-center py-1 border-b border-slate-200 text-slate-600">
              <span>Freight & Other Charges:</span>
              <span className="font-mono tabular-nums">
                {formatCurrency(calc.additionalChargesTotal, currency)}
              </span>
            </div>
          )}

          {calc.roundOff !== 0 && (
            <div className="flex justify-between items-center py-1 border-b border-slate-200 text-slate-500 text-[11px]">
              <span>Round Off:</span>
              <span className="font-mono tabular-nums">
                {calc.roundOff > 0 ? `+${calc.roundOff}` : calc.roundOff}
              </span>
            </div>
          )}

          {/* GRAND TOTAL */}
          <div className="flex justify-between items-center pt-2 pb-1 text-sm font-bold text-slate-900 border-t-2 border-slate-900">
            <span>GRAND TOTAL:</span>
            <span className="text-base text-indigo-700 font-mono tabular-nums">
              {formatCurrency(calc.grandTotal, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* TERMS & SIGNATURE FOOTER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 text-xs border-t border-slate-200">
        <div>
          <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block mb-1">
            Terms & Conditions:
          </span>
          <p className="text-slate-600 whitespace-pre-line text-[11px] leading-relaxed">
            {invoice.meta.termsConditions || '1. Goods once sold will not be returned.\n2. Subject to local jurisdiction.'}
          </p>
          {invoice.meta.notes && (
            <div className="mt-2 text-slate-500 italic text-[11px]">
              Note: {invoice.meta.notes}
            </div>
          )}
        </div>

        <div className="text-right flex flex-col justify-between items-end min-h-[90px]">
          <div>
            <span className="font-semibold text-slate-800 text-xs uppercase">
              For {invoice.seller.companyName}
            </span>
          </div>
          <div className="pt-8">
            <div className="w-44 border-b border-slate-400 mb-1 ml-auto"></div>
            <span className="font-bold text-slate-900 block text-xs">
              {invoice.meta.authorizedSignatory || 'Authorized Signatory'}
            </span>
            <span className="text-slate-500 text-[11px] block">
              {invoice.meta.signatoryDesignation || 'Designated Partner / Director'}
            </span>
          </div>
        </div>
      </div>

      {/* FOOTER COMPUTER GENERATED NOTE */}
      <div className="mt-6 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400">
        This is a computer-generated tax invoice generated via TaxFlow. All taxes calculated as per statutory GST rates.
      </div>
    </div>
  );
};
