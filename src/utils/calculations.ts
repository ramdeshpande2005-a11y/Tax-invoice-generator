import { InvoiceData, InvoiceCalculations, LineItem, HsnSummary } from '../types/invoice';

export const INDIAN_STATES: { code: string; name: string }[] = [
  { code: '01', name: 'Jammu & Kashmir' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' },
  { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' },
  { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar' },
  { code: '11', name: 'Sikkim' },
  { code: '12', name: 'Arunachal Pradesh' },
  { code: '13', name: 'Nagaland' },
  { code: '14', name: 'Manipur' },
  { code: '15', name: 'Mizoram' },
  { code: '16', name: 'Tripura' },
  { code: '17', name: 'Meghalaya' },
  { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' },
  { code: '20', name: 'Jharkhand' },
  { code: '21', name: 'Odisha' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '24', name: 'Gujarat' },
  { code: '26', name: 'Dadra and Nagar Haveli and Daman and Diu' },
  { code: '27', name: 'Maharashtra' },
  { code: '28', name: 'Andhra Pradesh' },
  { code: '29', name: 'Karnataka' },
  { code: '30', name: 'Goa' },
  { code: '31', name: 'Lakshadweep' },
  { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '34', name: 'Puducherry' },
  { code: '35', name: 'Andaman & Nicobar Islands' },
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh (New)' },
  { code: '38', name: 'Ladakh' },
  { code: '97', name: 'Other Territory' },
];

export const GST_RATES = [0, 0.25, 3, 5, 12, 18, 28];

export const COMMON_UNITS = [
  'PCS',
  'NOS',
  'KGS',
  'MTR',
  'BOX',
  'SET',
  'HRS',
  'DAYS',
  'SQFT',
  'LTR',
  'TON',
  'PKT',
];

/**
 * Calculates line item amounts based on rate, qty, discount, gstRate, and inter-state flag.
 */
export function calculateLineItem(item: Omit<LineItem, 'taxableAmount' | 'cgstRate' | 'cgstAmount' | 'sgstRate' | 'sgstAmount' | 'igstRate' | 'igstAmount' | 'totalAmount'>, isInterState: boolean): LineItem {
  const qty = Number(item.quantity) || 0;
  const rate = Number(item.rate) || 0;
  const discPercent = Number(item.discountPercent) || 0;
  const gstRate = Number(item.gstRate) || 0;

  const rawGross = qty * rate;
  const discountAmt = (rawGross * discPercent) / 100;
  const taxableAmount = Math.max(0, rawGross - discountAmt);

  let cgstRate = 0;
  let cgstAmount = 0;
  let sgstRate = 0;
  let sgstAmount = 0;
  let igstRate = 0;
  let igstAmount = 0;

  if (isInterState) {
    igstRate = gstRate;
    igstAmount = Number(((taxableAmount * igstRate) / 100).toFixed(2));
  } else {
    cgstRate = gstRate / 2;
    sgstRate = gstRate / 2;
    cgstAmount = Number(((taxableAmount * cgstRate) / 100).toFixed(2));
    sgstAmount = Number(((taxableAmount * sgstRate) / 100).toFixed(2));
  }

  const totalAmount = Number((taxableAmount + cgstAmount + sgstAmount + igstAmount).toFixed(2));

  return {
    ...item,
    taxableAmount: Number(taxableAmount.toFixed(2)),
    cgstRate,
    cgstAmount,
    sgstRate,
    sgstAmount,
    igstRate,
    igstAmount,
    totalAmount,
  };
}

/**
 * Recalculates all items in the invoice and computes overall invoice metrics.
 */
export function calculateInvoice(invoice: InvoiceData): InvoiceCalculations {
  const isInterState = invoice.meta.isInterState;
  
  let totalTaxableAmount = 0;
  let totalCgstAmount = 0;
  let totalSgstAmount = 0;
  let totalIgstAmount = 0;

  const hsnMap = new Map<string, HsnSummary>();

  invoice.items.forEach(item => {
    // Recompute line item to ensure accuracy
    const calculated = calculateLineItem(item, isInterState);
    totalTaxableAmount += calculated.taxableAmount;
    totalCgstAmount += calculated.cgstAmount;
    totalSgstAmount += calculated.sgstAmount;
    totalIgstAmount += calculated.igstAmount;

    // HSN grouping
    const key = (item.hsnCode || 'N/A') + '_' + item.gstRate;
    const existing = hsnMap.get(key) || {
      hsnCode: item.hsnCode || 'N/A',
      taxableValue: 0,
      cgstRate: calculated.cgstRate,
      cgstAmount: 0,
      sgstRate: calculated.sgstRate,
      sgstAmount: 0,
      igstRate: calculated.igstRate,
      igstAmount: 0,
      totalTax: 0,
    };

    existing.taxableValue += calculated.taxableAmount;
    existing.cgstAmount += calculated.cgstAmount;
    existing.sgstAmount += calculated.sgstAmount;
    existing.igstAmount += calculated.igstAmount;
    existing.totalTax += calculated.cgstAmount + calculated.sgstAmount + calculated.igstAmount;

    hsnMap.set(key, existing);
  });

  totalTaxableAmount = Number(totalTaxableAmount.toFixed(2));
  totalCgstAmount = Number(totalCgstAmount.toFixed(2));
  totalSgstAmount = Number(totalSgstAmount.toFixed(2));
  totalIgstAmount = Number(totalIgstAmount.toFixed(2));
  const totalTaxAmount = Number((totalCgstAmount + totalSgstAmount + totalIgstAmount).toFixed(2));

  // Additional charges
  const shipping = Number(invoice.additionalCharges.shippingCharges) || 0;
  const shippingGst = Number(invoice.additionalCharges.shippingGstRate) || 0;
  const shippingTax = (shipping * shippingGst) / 100;

  const packaging = Number(invoice.additionalCharges.packagingCharges) || 0;
  const other = Number(invoice.additionalCharges.otherCharges) || 0;

  const additionalChargesTotal = Number((shipping + shippingTax + packaging + other).toFixed(2));

  const unroundedGrandTotal = totalTaxableAmount + totalTaxAmount + additionalChargesTotal;

  let roundOff = 0;
  let grandTotal = unroundedGrandTotal;

  if (invoice.additionalCharges.autoRoundOff) {
    grandTotal = Math.round(unroundedGrandTotal);
    roundOff = Number((grandTotal - unroundedGrandTotal).toFixed(2));
  } else {
    grandTotal = Number(unroundedGrandTotal.toFixed(2));
    roundOff = 0;
  }

  const hsnSummaries: HsnSummary[] = Array.from(hsnMap.values()).map(h => ({
    ...h,
    taxableValue: Number(h.taxableValue.toFixed(2)),
    cgstAmount: Number(h.cgstAmount.toFixed(2)),
    sgstAmount: Number(h.sgstAmount.toFixed(2)),
    igstAmount: Number(h.igstAmount.toFixed(2)),
    totalTax: Number(h.totalTax.toFixed(2)),
  }));

  const grandTotalWords = numberToWordsINR(grandTotal, invoice.meta.currencyCode);

  return {
    totalTaxableAmount,
    totalCgstAmount,
    totalSgstAmount,
    totalIgstAmount,
    totalTaxAmount,
    additionalChargesTotal,
    subtotalWithTax: Number((totalTaxableAmount + totalTaxAmount).toFixed(2)),
    roundOff,
    grandTotal,
    grandTotalWords,
    hsnSummaries,
  };
}

/**
 * Converts a number to words according to Indian number numbering convention
 * (Crores, Lakhs, Thousands, Hundreds, Tens, and Paise).
 */
export function numberToWordsINR(num: number, currencyCode = 'INR'): string {
  if (isNaN(num) || num === 0) return currencyCode === 'INR' ? 'Zero Rupees Only' : 'Zero Only';

  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n: number): string {
    if (n < 10) return units[n];
    if (n >= 10 && n < 20) return teens[n - 10];
    const ten = Math.floor(n / 10);
    const unit = n % 10;
    return tens[ten] + (unit ? ' ' + units[unit] : '');
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let res = '';
    if (hundred > 0) {
      res += units[hundred] + ' Hundred';
      if (rest > 0) res += ' and ';
    }
    if (rest > 0) {
      res += convertTwoDigits(rest);
    }
    return res;
  }

  const integerPart = Math.floor(absNum);
  const decimalPart = Math.round((absNum - integerPart) * 100);

  let words = '';

  if (integerPart === 0) {
    words = 'Zero';
  } else {
    // Indian numbering:
    // Crores (> 10,000,000)
    // Lakhs (> 100,000)
    // Thousands (> 1,000)
    // Hundreds & Rest
    let n = integerPart;

    const crore = Math.floor(n / 10000000);
    n %= 10000000;

    const lakh = Math.floor(n / 100000);
    n %= 100000;

    const thousand = Math.floor(n / 1000);
    n %= 1000;

    const hundredAndRest = n;

    if (crore > 0) {
      words += convertThreeDigits(crore) + ' Crore ';
    }
    if (lakh > 0) {
      words += convertTwoDigits(lakh) + ' Lakh ';
    }
    if (thousand > 0) {
      words += convertTwoDigits(thousand) + ' Thousand ';
    }
    if (hundredAndRest > 0) {
      words += convertThreeDigits(hundredAndRest);
    }
  }

  words = words.trim();

  let currencyUnit = 'Rupees';
  let decimalUnit = 'Paise';

  if (currencyCode === 'USD') {
    currencyUnit = 'Dollars';
    decimalUnit = 'Cents';
  } else if (currencyCode === 'EUR') {
    currencyUnit = 'Euros';
    decimalUnit = 'Cents';
  } else if (currencyCode === 'GBP') {
    currencyUnit = 'Pounds';
    decimalUnit = 'Pence';
  }

  let finalStr = `${isNegative ? 'Negative ' : ''}${words} ${currencyUnit}`;

  if (decimalPart > 0) {
    finalStr += ` and ${convertTwoDigits(decimalPart)} ${decimalUnit}`;
  }

  return finalStr + ' Only';
}

/**
 * Format currency with Indian Comma System (e.g. ₹ 1,23,456.78)
 */
export function formatCurrency(amount: number, symbol = '₹'): string {
  if (isNaN(amount)) return `${symbol} 0.00`;
  
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(amount);
  const [intPart, decPart = '00'] = abs.toFixed(2).split('.');

  // Indian comma format: last 3 digits, then groups of 2 digits
  let lastThree = intPart.substring(intPart.length - 3);
  const otherNumbers = intPart.substring(0, intPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInt = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  return `${sign}${symbol} ${formattedInt}.${decPart}`;
}

/**
 * Check GSTIN structure (15 chars: 2 state digits, 10 PAN, 1 entity code, 1 'Z', 1 checksum)
 */
export function validateGSTIN(gstin: string): { isValid: boolean; stateCode?: string; message?: string } {
  if (!gstin) return { isValid: true };
  const clean = gstin.trim().toUpperCase();
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  
  if (clean.length !== 15) {
    return { isValid: false, message: 'GSTIN must be 15 alphanumeric characters' };
  }
  if (!regex.test(clean)) {
    return { isValid: false, message: 'Invalid GSTIN format (e.g. 27ABCDE1234F1Z5)' };
  }
  const stateCode = clean.substring(0, 2);
  return { isValid: true, stateCode };
}
