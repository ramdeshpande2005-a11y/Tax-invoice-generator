import * as XLSX from 'xlsx';
import { InvoiceData } from '../types/invoice';
import { calculateInvoice } from './calculations';

export function exportInvoiceToExcel(invoice: InvoiceData) {
  const calc = calculateInvoice(invoice);
  const wb = XLSX.utils.book_new();

  // Create Tax Invoice Sheet data array
  const wsData: (string | number | undefined)[][] = [];

  // Row 1: Company Header
  wsData.push([invoice.seller.companyName.toUpperCase()]);
  if (invoice.seller.tagline) {
    wsData.push([invoice.seller.tagline]);
  }
  wsData.push([`${invoice.seller.address}, ${invoice.seller.city}, ${invoice.seller.state} - ${invoice.seller.pincode}`]);
  wsData.push([`GSTIN: ${invoice.seller.gstin} | PAN: ${invoice.seller.pan} | Phone: ${invoice.seller.phone} | Email: ${invoice.seller.email}`]);
  wsData.push([]); // blank line

  // Row 5: Document Title
  wsData.push([invoice.meta.invoiceType || 'TAX INVOICE', '', '', '', '', '', '', invoice.meta.copyType || 'ORIGINAL FOR RECIPIENT']);
  wsData.push([]); // blank line

  // Invoice & Party Metadata in structured grid
  wsData.push(['INVOICE DETAILS', '', '', '', 'BILLED TO (BUYER DETAILS)', '', '', '']);
  wsData.push([
    'Invoice / Bill No:',
    invoice.meta.invoiceNumber || invoice.meta.billNumber || 'N/A',
    '',
    '',
    'Party / Buyer Name:',
    invoice.party.partyName || 'N/A',
  ]);
  wsData.push([
    'Invoice Date:',
    invoice.meta.invoiceDate || 'N/A',
    '',
    '',
    'GSTIN / Unique ID:',
    invoice.party.gstin || 'Unregistered',
  ]);
  wsData.push([
    'Due Date:',
    invoice.meta.dueDate || 'N/A',
    '',
    '',
    'Address:',
    `${invoice.party.billingAddress || ''}, ${invoice.party.city || ''}, ${invoice.party.state || ''} - ${invoice.party.pincode || ''}`.trim(),
  ]);
  wsData.push([
    'Place of Supply:',
    invoice.party.placeOfSupply || invoice.party.state || 'N/A',
    '',
    '',
    'State & State Code:',
    `${invoice.party.state || ''} (${invoice.party.stateCode || ''})`,
  ]);
  wsData.push([
    'Reverse Charge:',
    invoice.meta.reverseCharge ? 'Yes' : 'No',
    '',
    '',
    'Contact Phone / Email:',
    `${invoice.party.phone || ''} ${invoice.party.email ? '/ ' + invoice.party.email : ''}`.trim() || 'N/A',
  ]);
  if (invoice.meta.poNumber) {
    wsData.push([
      'PO Number & Date:',
      `${invoice.meta.poNumber} ${invoice.meta.poDate ? '(' + invoice.meta.poDate + ')' : ''}`,
      '',
      '',
      'Shipping Address:',
      invoice.party.sameAsBilling ? 'Same as Billing Address' : (invoice.party.shippingAddress || 'N/A'),
    ]);
  }
  wsData.push([]); // blank line

  // Table Headers for Items
  const isInterState = invoice.meta.isInterState;
  const headers = isInterState
    ? [
        'S.No',
        'Item Description / Particulars',
        'HSN/SAC',
        'Qty',
        'Unit',
        'Rate',
        'Disc %',
        'Taxable Amount',
        'IGST Rate %',
        'IGST Amount',
        'Total Amount',
      ]
    : [
        'S.No',
        'Item Description / Particulars',
        'HSN/SAC',
        'Qty',
        'Unit',
        'Rate',
        'Disc %',
        'Taxable Amount',
        'CGST Rate %',
        'CGST Amount',
        'SGST Rate %',
        'SGST Amount',
        'Total Amount',
      ];

  wsData.push(headers);

  // Line items
  invoice.items.forEach((item, index) => {
    if (isInterState) {
      wsData.push([
        index + 1,
        item.description,
        item.hsnCode || '-',
        item.quantity,
        item.unit,
        item.rate,
        item.discountPercent || 0,
        item.taxableAmount,
        `${item.igstRate}%`,
        item.igstAmount,
        item.totalAmount,
      ]);
    } else {
      wsData.push([
        index + 1,
        item.description,
        item.hsnCode || '-',
        item.quantity,
        item.unit,
        item.rate,
        item.discountPercent || 0,
        item.taxableAmount,
        `${item.cgstRate}%`,
        item.cgstAmount,
        `${item.sgstRate}%`,
        item.sgstAmount,
        item.totalAmount,
      ]);
    }
  });

  wsData.push([]); // blank line

  // Summary and Calculations
  if (isInterState) {
    wsData.push(['', '', '', '', '', '', 'Total Taxable Value:', calc.totalTaxableAmount]);
    wsData.push(['', '', '', '', '', '', 'Total IGST:', calc.totalIgstAmount]);
  } else {
    wsData.push(['', '', '', '', '', '', '', '', 'Total Taxable Value:', calc.totalTaxableAmount]);
    wsData.push(['', '', '', '', '', '', '', '', 'Total CGST:', calc.totalCgstAmount]);
    wsData.push(['', '', '', '', '', '', '', '', 'Total SGST:', calc.totalSgstAmount]);
  }

  if (calc.additionalChargesTotal > 0) {
    const colOffset = isInterState ? 6 : 8;
    const prefix = Array(colOffset).fill('');
    wsData.push([...prefix, 'Additional Charges:', calc.additionalChargesTotal]);
  }

  if (calc.roundOff !== 0) {
    const colOffset = isInterState ? 6 : 8;
    const prefix = Array(colOffset).fill('');
    wsData.push([...prefix, 'Round Off (+/-):', calc.roundOff]);
  }

  const grandOffset = isInterState ? 6 : 8;
  const grandPrefix = Array(grandOffset).fill('');
  wsData.push([...grandPrefix, 'GRAND TOTAL:', calc.grandTotal]);

  wsData.push([]);
  wsData.push(['Amount in Words:', calc.grandTotalWords]);
  wsData.push([]);

  // Bank Details Section
  wsData.push(['BANK DETAILS FOR PAYMENT']);
  wsData.push(['Bank Name:', invoice.bank.bankName || 'N/A']);
  wsData.push(['Account Number:', invoice.bank.accountNumber || 'N/A']);
  wsData.push(['Account Holder Name:', invoice.bank.accountHolderName || invoice.seller.companyName]);
  wsData.push(['IFSC Code:', invoice.bank.ifscCode || 'N/A']);
  wsData.push(['Branch & Account Type:', `${invoice.bank.branch || ''} (${invoice.bank.accountType || 'Current'})`]);
  if (invoice.bank.upiId) {
    wsData.push(['UPI ID (VPA):', invoice.bank.upiId]);
  }

  wsData.push([]);

  // Terms and Signatory
  wsData.push(['TERMS & CONDITIONS', '', '', '', 'FOR ' + (invoice.seller.companyName.toUpperCase())]);
  wsData.push([invoice.meta.termsConditions || '1. Goods/Services once sold will not be taken back.\n2. Subject to local jurisdiction.']);
  wsData.push([]);
  wsData.push(['', '', '', '', 'Authorized Signatory:', invoice.meta.authorizedSignatory || '']);
  wsData.push(['', '', '', '', 'Designation:', invoice.meta.signatoryDesignation || '']);

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths for readability
  ws['!cols'] = isInterState
    ? [
        { wch: 6 },  // S.No
        { wch: 36 }, // Description
        { wch: 12 }, // HSN/SAC
        { wch: 8 },  // Qty
        { wch: 8 },  // Unit
        { wch: 12 }, // Rate
        { wch: 8 },  // Disc %
        { wch: 16 }, // Taxable Amount
        { wch: 12 }, // IGST %
        { wch: 14 }, // IGST Amt
        { wch: 16 }, // Total Amount
      ]
    : [
        { wch: 6 },  // S.No
        { wch: 36 }, // Description
        { wch: 12 }, // HSN/SAC
        { wch: 8 },  // Qty
        { wch: 8 },  // Unit
        { wch: 12 }, // Rate
        { wch: 8 },  // Disc %
        { wch: 16 }, // Taxable Amount
        { wch: 12 }, // CGST %
        { wch: 14 }, // CGST Amt
        { wch: 12 }, // SGST %
        { wch: 14 }, // SGST Amt
        { wch: 16 }, // Total Amount
      ];

  XLSX.utils.book_append_sheet(wb, ws, 'Tax Invoice');

  // Sheet 2: HSN Summary
  const hsnHeaders = [
    'HSN/SAC Code',
    'Taxable Value',
    'CGST Rate %',
    'CGST Amount',
    'SGST Rate %',
    'SGST Amount',
    'IGST Rate %',
    'IGST Amount',
    'Total Tax Amount',
  ];
  const hsnRows = calc.hsnSummaries.map(h => [
    h.hsnCode,
    h.taxableValue,
    `${h.cgstRate}%`,
    h.cgstAmount,
    `${h.sgstRate}%`,
    h.sgstAmount,
    `${h.igstRate}%`,
    h.igstAmount,
    h.totalTax,
  ]);

  const hsnSheetData = [
    ['HSN / SAC WISE TAX SUMMARY'],
    ['Invoice No:', invoice.meta.invoiceNumber, 'Date:', invoice.meta.invoiceDate],
    [],
    hsnHeaders,
    ...hsnRows,
    [],
    ['Total Taxable:', calc.totalTaxableAmount, '', calc.totalCgstAmount, '', calc.totalSgstAmount, '', calc.totalIgstAmount, calc.totalTaxAmount],
  ];

  const wsHsn = XLSX.utils.aoa_to_sheet(hsnSheetData);
  wsHsn['!cols'] = [
    { wch: 15 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
  ];

  XLSX.utils.book_append_sheet(wb, wsHsn, 'HSN Tax Summary');

  // Generate clean filename
  const safeInvNo = (invoice.meta.invoiceNumber || 'INV-001').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeDate = invoice.meta.invoiceDate || new Date().toISOString().split('T')[0];
  const fileName = `Tax_Invoice_${safeInvNo}_${safeDate}.xlsx`;

  XLSX.writeFile(wb, fileName);
}
