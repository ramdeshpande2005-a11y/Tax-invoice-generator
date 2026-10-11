import React, { useState } from 'react';
import {
  InvoiceData,
  LineItem,
} from '../types/invoice';
import {
  INDIAN_STATES,
  GST_RATES,
  COMMON_UNITS,
  calculateLineItem,
  validateGSTIN,
  formatCurrency,
} from '../utils/calculations';
import {
  Building2,
  UserCheck,
  Receipt,
  Landmark,
  Plus,
  Trash2,
  Copy,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Percent,
} from 'lucide-react';

interface InvoiceEditorProps {
  invoice: InvoiceData;
  onChange: (updated: InvoiceData) => void;
}

export const InvoiceEditor: React.FC<InvoiceEditorProps> = ({ invoice, onChange }) => {
  const [activeSection, setActiveSection] = useState<string>('all');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    additional: true,
  });

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Updaters
  const updateMeta = (field: keyof InvoiceData['meta'], value: any) => {
    onChange({
      ...invoice,
      meta: { ...invoice.meta, [field]: value },
      updatedAt: new Date().toISOString(),
    });
  };

  const updateSeller = (field: keyof InvoiceData['seller'], value: string) => {
    onChange({
      ...invoice,
      seller: { ...invoice.seller, [field]: value },
      updatedAt: new Date().toISOString(),
    });
  };

  const updateParty = (field: keyof InvoiceData['party'], value: any) => {
    const updatedParty = { ...invoice.party, [field]: value };
    // If state changed, update stateCode
    if (field === 'state') {
      const match = INDIAN_STATES.find(s => s.name === value);
      if (match) {
        updatedParty.stateCode = match.code;
        updatedParty.placeOfSupply = `${match.name} (${match.code})`;
      }
    }
    onChange({
      ...invoice,
      party: updatedParty,
      updatedAt: new Date().toISOString(),
    });
  };

  const updateBank = (field: keyof InvoiceData['bank'], value: string) => {
    onChange({
      ...invoice,
      bank: { ...invoice.bank, [field]: value },
      updatedAt: new Date().toISOString(),
    });
  };

  const updateAdditional = (field: keyof InvoiceData['additionalCharges'], value: any) => {
    onChange({
      ...invoice,
      additionalCharges: { ...invoice.additionalCharges, [field]: value },
      updatedAt: new Date().toISOString(),
    });
  };

  // Line Items operations
  const updateItem = (index: number, field: keyof LineItem, val: any) => {
    const items = [...invoice.items];
    const current = { ...items[index], [field]: val };
    const recomputed = calculateLineItem(current, invoice.meta.isInterState);
    items[index] = recomputed;

    onChange({
      ...invoice,
      items,
      updatedAt: new Date().toISOString(),
    });
  };

  const addItem = () => {
    const newItem: LineItem = calculateLineItem(
      {
        id: `item-${Date.now()}`,
        description: '',
        hsnCode: '',
        quantity: 1,
        unit: 'PCS',
        rate: 0,
        discountPercent: 0,
        gstRate: 18,
      },
      invoice.meta.isInterState
    );

    onChange({
      ...invoice,
      items: [...invoice.items, newItem],
      updatedAt: new Date().toISOString(),
    });
  };

  const duplicateItem = (index: number) => {
    const target = invoice.items[index];
    const copy: LineItem = {
      ...target,
      id: `item-${Date.now()}`,
      description: `${target.description} (Copy)`,
    };
    const items = [...invoice.items];
    items.splice(index + 1, 0, copy);
    onChange({
      ...invoice,
      items,
      updatedAt: new Date().toISOString(),
    });
  };

  const removeItem = (index: number) => {
    if (invoice.items.length <= 1) {
      alert('Invoice must have at least one line item.');
      return;
    }
    const items = invoice.items.filter((_, i) => i !== index);
    onChange({
      ...invoice,
      items,
      updatedAt: new Date().toISOString(),
    });
  };

  // Handle GSTIN change with validation
  const handlePartyGstinChange = (gstin: string) => {
    const cleanGstin = gstin.toUpperCase().trim();
    const validation = validateGSTIN(cleanGstin);
    let stateUpdates = {};
    if (cleanGstin.length >= 2) {
      const code = cleanGstin.substring(0, 2);
      const match = INDIAN_STATES.find(s => s.code === code);
      if (match) {
        stateUpdates = {
          state: match.name,
          stateCode: match.code,
          placeOfSupply: `${match.name} (${match.code})`,
        };
      }
    }
    onChange({
      ...invoice,
      party: {
        ...invoice.party,
        gstin: cleanGstin,
        ...stateUpdates,
      },
      updatedAt: new Date().toISOString(),
    });
  };

  // Toggle supply type (Intra-state vs Inter-state) and recompute all line items instantly
  const toggleSupplyType = (isInterState: boolean) => {
    const recomputedItems = invoice.items.map(item => calculateLineItem(item, isInterState));
    onChange({
      ...invoice,
      meta: { ...invoice.meta, isInterState },
      items: recomputedItems,
      updatedAt: new Date().toISOString(),
    });
  };

  const partyGstinStatus = validateGSTIN(invoice.party.gstin);
  const sellerGstinStatus = validateGSTIN(invoice.seller.gstin);

  return (
    <div className="space-y-6 pb-20">
      {/* 1. INVOICE META & TAX SETTINGS */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <Receipt className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-slate-900">Invoice & Bill Details</h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">Real-time calculations active</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Invoice / Bill Number *
            </label>
            <input
              type="text"
              value={invoice.meta.invoiceNumber}
              onChange={e => {
                updateMeta('invoiceNumber', e.target.value);
                updateMeta('billNumber', e.target.value);
              }}
              placeholder="e.g. INV-2026/084"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Bill Reference No.</label>
            <input
              type="text"
              value={invoice.meta.billNumber || ''}
              onChange={e => updateMeta('billNumber', e.target.value)}
              placeholder="e.g. BILL-084"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Invoice Date *</label>
            <input
              type="date"
              value={invoice.meta.invoiceDate}
              onChange={e => updateMeta('invoiceDate', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Payment Due Date</label>
            <input
              type="date"
              value={invoice.meta.dueDate}
              onChange={e => updateMeta('dueDate', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>
        </div>

        {/* GST Tax Nature Switcher */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">GST Tax Type</label>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => toggleSupplyType(false)}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  !invoice.meta.isInterState
                    ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Intra-State (CGST + SGST)
              </button>
              <button
                type="button"
                onClick={() => toggleSupplyType(true)}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  invoice.meta.isInterState
                    ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Inter-State (IGST)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Document Header</label>
            <select
              value={invoice.meta.invoiceType}
              onChange={e => updateMeta('invoiceType', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="TAX INVOICE">TAX INVOICE</option>
              <option value="RETAIL INVOICE">RETAIL INVOICE</option>
              <option value="PROFORMA INVOICE">PROFORMA INVOICE</option>
              <option value="BILL OF SUPPLY">BILL OF SUPPLY</option>
            </select>
          </div>

          <div className="flex items-center gap-4 pt-4 md:pt-0">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={invoice.meta.reverseCharge}
                onChange={e => updateMeta('reverseCharge', e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <span>Reverse Charge Applicable</span>
            </label>
          </div>
        </div>
      </div>

      {/* 2. BILLED TO / PARTY DETAILS (BUYER) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-slate-900">
              Billed To (Party / Customer Details)
            </h2>
          </div>
          <span className="text-xs text-slate-500">Input party name, address & GST</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Party / Client Name *
            </label>
            <input
              type="text"
              value={invoice.party.partyName}
              onChange={e => updateParty('partyName', e.target.value)}
              placeholder="e.g. Apex Technologies India LLP"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Party GST / GSTIN Number
            </label>
            <input
              type="text"
              value={invoice.party.gstin}
              onChange={e => handlePartyGstinChange(e.target.value)}
              placeholder="e.g. 06AABCA9876B1Z3"
              className={`w-full px-3 py-2 text-sm bg-slate-50 border rounded-lg focus:outline-hidden focus:ring-2 uppercase font-mono ${
                invoice.party.gstin && !partyGstinStatus.isValid
                  ? 'border-amber-300 focus:ring-amber-400 bg-amber-50/50'
                  : 'border-slate-200 focus:ring-indigo-500 focus:bg-white'
              }`}
            />
            {invoice.party.gstin && !partyGstinStatus.isValid && (
              <p className="text-[11px] text-amber-600 mt-1">{partyGstinStatus.message}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Billing Address *
            </label>
            <input
              type="text"
              value={invoice.party.billingAddress}
              onChange={e => updateParty('billingAddress', e.target.value)}
              placeholder="Street Address, Building, Area"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">City</label>
            <input
              type="text"
              value={invoice.party.city}
              onChange={e => updateParty('city', e.target.value)}
              placeholder="City / District"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">State</label>
            <select
              value={invoice.party.state}
              onChange={e => updateParty('state', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              {INDIAN_STATES.map(s => (
                <option key={s.code} value={s.name}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">State Code</label>
            <input
              type="text"
              value={invoice.party.stateCode}
              onChange={e => updateParty('stateCode', e.target.value)}
              placeholder="e.g. 06"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">PIN Code</label>
            <input
              type="text"
              value={invoice.party.pincode}
              onChange={e => updateParty('pincode', e.target.value)}
              placeholder="e.g. 122002"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
            <input
              type="text"
              value={invoice.party.phone}
              onChange={e => updateParty('phone', e.target.value)}
              placeholder="e.g. +91 98112 34567"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              value={invoice.party.email}
              onChange={e => updateParty('email', e.target.value)}
              placeholder="e.g. accounts@apex.com"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Place of Supply</label>
            <input
              type="text"
              value={invoice.party.placeOfSupply}
              onChange={e => updateParty('placeOfSupply', e.target.value)}
              placeholder="e.g. Haryana (06)"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* 3. ITEM PARTICULARS & TAX CALCULATION (CORE TABLE) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 mb-4 gap-2">
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-base font-semibold text-slate-900">Item Particulars & Tax Rates</h2>
              <p className="text-xs text-slate-500">
                Taxable amounts & taxes update instantly as you type
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-2xs self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Line Item</span>
          </button>
        </div>

        {/* Dynamic Items Table */}
        <div className="space-y-4">
          {invoice.items.map((item, index) => {
            return (
              <div
                key={item.id}
                className="p-4 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center font-mono">
                      {index + 1}
                    </span>
                    <span className="text-xs font-medium text-slate-600">
                      Line Item #{index + 1}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => duplicateItem(index)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-md transition-colors"
                      title="Duplicate item"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  {/* Description */}
                  <div className="md:col-span-5">
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Item Particulars / Description *
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={e => updateItem(index, 'description', e.target.value)}
                      placeholder="e.g. Server Maintenance / Consulting Service"
                      className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>

                  {/* HSN / SAC */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      HSN / SAC Code
                    </label>
                    <input
                      type="text"
                      value={item.hsnCode}
                      onChange={e => updateItem(index, 'hsnCode', e.target.value)}
                      placeholder="e.g. 998313"
                      className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  {/* Quantity */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Quantity</label>
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      value={item.quantity}
                      onChange={e => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono tabular-nums text-right"
                    />
                  </div>

                  {/* Unit */}
                  <div className="md:col-span-3">
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Unit</label>
                    <div className="flex gap-1">
                      <select
                        value={COMMON_UNITS.includes(item.unit) ? item.unit : 'CUSTOM'}
                        onChange={e => {
                          if (e.target.value !== 'CUSTOM') {
                            updateItem(index, 'unit', e.target.value);
                          }
                        }}
                        className="w-1/2 px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      >
                        {COMMON_UNITS.map(u => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                        <option value="CUSTOM">Other</option>
                      </select>
                      <input
                        type="text"
                        value={item.unit}
                        onChange={e => updateItem(index, 'unit', e.target.value.toUpperCase())}
                        placeholder="Unit"
                        className="w-1/2 px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 uppercase font-mono"
                      />
                    </div>
                  </div>

                  {/* Rate */}
                  <div className="md:col-span-3">
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Unit Rate ({invoice.meta.currencySymbol}) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={item.rate}
                      onChange={e => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono tabular-nums text-right"
                    />
                  </div>

                  {/* Discount % */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Discount %
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="any"
                      value={item.discountPercent}
                      onChange={e =>
                        updateItem(index, 'discountPercent', parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono tabular-nums text-right"
                    />
                  </div>

                  {/* GST Rate */}
                  <div className="md:col-span-3">
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      GST Rate %
                    </label>
                    <select
                      value={item.gstRate}
                      onChange={e => updateItem(index, 'gstRate', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                    >
                      {GST_RATES.map(rate => (
                        <option key={rate} value={rate}>
                          {rate}% {rate === 18 ? '(Standard 18%)' : rate === 12 ? '(Standard 12%)' : rate === 5 ? '(Concessional 5%)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Calculated metrics preview badge */}
                  <div className="md:col-span-4 bg-white px-3 py-2 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] text-slate-500 uppercase tracking-wider">
                        Taxable Value
                      </span>
                      <span className="text-xs font-semibold text-slate-800 font-mono tabular-nums">
                        {formatCurrency(item.taxableAmount, invoice.meta.currencySymbol)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="block text-[10px] text-slate-500 uppercase tracking-wider">
                        Row Total (+Tax)
                      </span>
                      <span className="text-sm font-bold text-indigo-600 font-mono tabular-nums">
                        {formatCurrency(item.totalAmount, invoice.meta.currencySymbol)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. EDITABLE BANK DETAILS (Explicitly highlighted & required by user prompt) */}
      <div className="bg-white rounded-xl border border-indigo-200 p-5 shadow-2xs relative overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-indigo-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Bank Details for Payment
              </h2>
              <p className="text-xs text-slate-500">
                Bank Name, IFSC Code, Account Number (Fully Editable)
              </p>
            </div>
          </div>
          <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
            Editable on Invoice & Excel
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Bank Name *
            </label>
            <input
              type="text"
              value={invoice.bank.bankName}
              onChange={e => updateBank('bankName', e.target.value)}
              placeholder="e.g. HDFC Bank Ltd"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Account Number *
            </label>
            <input
              type="text"
              value={invoice.bank.accountNumber}
              onChange={e => updateBank('accountNumber', e.target.value)}
              placeholder="e.g. 50200049817234"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono tracking-wide"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              IFSC Code *
            </label>
            <input
              type="text"
              value={invoice.bank.ifscCode}
              onChange={e => updateBank('ifscCode', e.target.value.toUpperCase())}
              placeholder="e.g. HDFC0000280"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Account Holder Name
            </label>
            <input
              type="text"
              value={invoice.bank.accountHolderName}
              onChange={e => updateBank('accountHolderName', e.target.value)}
              placeholder="e.g. Vertex Solutions Pvt Ltd"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Branch Name
            </label>
            <input
              type="text"
              value={invoice.bank.branch}
              onChange={e => updateBank('branch', e.target.value)}
              placeholder="e.g. DLF Cyber City, Phase 2"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Account Type / UPI ID
            </label>
            <div className="flex gap-2">
              <select
                value={invoice.bank.accountType}
                onChange={e => updateBank('accountType', e.target.value)}
                className="w-1/2 px-2 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Current Account">Current</option>
                <option value="Savings Account">Savings</option>
                <option value="Cash Credit">OD / CC</option>
              </select>
              <input
                type="text"
                value={invoice.bank.upiId || ''}
                onChange={e => updateBank('upiId', e.target.value)}
                placeholder="UPI (e.g. user@okhdfc)"
                className="w-1/2 px-2 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 5. BILLED BY / SELLER DETAILS (YOUR COMPANY) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-slate-900">
              Billed By (Seller / Your Business Details)
            </h2>
          </div>
          <span className="text-xs text-slate-500">Your company profile</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Company / Business Name *
            </label>
            <input
              type="text"
              value={invoice.seller.companyName}
              onChange={e => updateSeller('companyName', e.target.value)}
              placeholder="e.g. Vertex Solutions Pvt Ltd"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              GSTIN Number
            </label>
            <input
              type="text"
              value={invoice.seller.gstin}
              onChange={e => updateSeller('gstin', e.target.value.toUpperCase().trim())}
              placeholder="e.g. 06AAACV1234F1Z8"
              className={`w-full px-3 py-2 text-sm bg-slate-50 border rounded-lg focus:outline-hidden focus:ring-2 uppercase font-mono ${
                invoice.seller.gstin && !sellerGstinStatus.isValid
                  ? 'border-amber-300 focus:ring-amber-400'
                  : 'border-slate-200 focus:ring-indigo-500 focus:bg-white'
              }`}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Address *
            </label>
            <input
              type="text"
              value={invoice.seller.address}
              onChange={e => updateSeller('address', e.target.value)}
              placeholder="Office Address, Area, Landmark"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">City</label>
            <input
              type="text"
              value={invoice.seller.city}
              onChange={e => updateSeller('city', e.target.value)}
              placeholder="City"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">State</label>
            <select
              value={invoice.seller.state}
              onChange={e => {
                const sName = e.target.value;
                const match = INDIAN_STATES.find(s => s.name === sName);
                onChange({
                  ...invoice,
                  seller: {
                    ...invoice.seller,
                    state: sName,
                    stateCode: match ? match.code : invoice.seller.stateCode,
                  },
                });
              }}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              {INDIAN_STATES.map(s => (
                <option key={s.code} value={s.name}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">State Code</label>
            <input
              type="text"
              value={invoice.seller.stateCode}
              onChange={e => updateSeller('stateCode', e.target.value)}
              placeholder="e.g. 06"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">PAN Number</label>
            <input
              type="text"
              value={invoice.seller.pan}
              onChange={e => updateSeller('pan', e.target.value.toUpperCase())}
              placeholder="e.g. AAACV1234F"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
            <input
              type="text"
              value={invoice.seller.phone}
              onChange={e => updateSeller('phone', e.target.value)}
              placeholder="e.g. +91 98765 43210"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={invoice.seller.email}
              onChange={e => updateSeller('email', e.target.value)}
              placeholder="billing@company.com"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* 6. ADDITIONAL CHARGES & TERMS */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <button
          type="button"
          onClick={() => toggleSection('additional')}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2.5">
            <Percent className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-slate-900">
              Additional Charges, Terms & Signatory
            </h2>
          </div>
          {collapsedSections.additional ? (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {!collapsedSections.additional && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Shipping / Freight Charges ({invoice.meta.currencySymbol})
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={invoice.additionalCharges.shippingCharges}
                  onChange={e =>
                    updateAdditional('shippingCharges', parseFloat(e.target.value) || 0)
                  }
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono tabular-nums text-right"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Packaging Charges ({invoice.meta.currencySymbol})
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={invoice.additionalCharges.packagingCharges}
                  onChange={e =>
                    updateAdditional('packagingCharges', parseFloat(e.target.value) || 0)
                  }
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono tabular-nums text-right"
                />
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={invoice.additionalCharges.autoRoundOff}
                    onChange={e => updateAdditional('autoRoundOff', e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span>Auto Round Off Grand Total</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Notes / Payment Instructions
                </label>
                <textarea
                  rows={3}
                  value={invoice.meta.notes}
                  onChange={e => updateMeta('notes', e.target.value)}
                  placeholder="Thank you for your business..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Terms & Conditions
                </label>
                <textarea
                  rows={3}
                  value={invoice.meta.termsConditions}
                  onChange={e => updateMeta('termsConditions', e.target.value)}
                  placeholder="1. Goods once sold..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Authorized Signatory Name
                </label>
                <input
                  type="text"
                  value={invoice.meta.authorizedSignatory}
                  onChange={e => updateMeta('authorizedSignatory', e.target.value)}
                  placeholder="e.g. Rajesh Sharma"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Signatory Designation
                </label>
                <input
                  type="text"
                  value={invoice.meta.signatoryDesignation}
                  onChange={e => updateMeta('signatoryDesignation', e.target.value)}
                  placeholder="e.g. Managing Director / Partner"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
