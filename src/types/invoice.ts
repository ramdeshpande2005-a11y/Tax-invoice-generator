export interface SellerDetails {
  companyName: string;
  tagline: string;
  address: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  gstin: string;
  pan: string;
  phone: string;
  email: string;
  website: string;
}

export interface PartyDetails {
  partyName: string;
  tradeName?: string;
  billingAddress: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  gstin: string;
  pan: string;
  phone: string;
  email: string;
  shippingAddress: string;
  sameAsBilling: boolean;
  placeOfSupply: string;
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  ifscCode: string;
  branch: string;
  accountType: string;
  upiId?: string;
}

export interface LineItem {
  id: string;
  description: string;
  hsnCode: string;
  quantity: number;
  unit: string;
  rate: number;
  discountPercent: number;
  gstRate: number; // e.g. 0, 5, 12, 18, 28
  // Calculated fields:
  taxableAmount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalAmount: number;
}

export interface InvoiceMeta {
  invoiceNumber: string;
  billNumber?: string;
  invoiceDate: string;
  dueDate: string;
  poNumber: string;
  poDate: string;
  reverseCharge: boolean;
  isInterState: boolean; // false = Intra-state (CGST + SGST), true = Inter-state (IGST)
  currencySymbol: string;
  currencyCode: string;
  notes: string;
  termsConditions: string;
  authorizedSignatory: string;
  signatoryDesignation: string;
  invoiceType: 'TAX INVOICE' | 'RETAIL INVOICE' | 'PROFORMA INVOICE' | 'BILL OF SUPPLY';
  copyType: 'ORIGINAL FOR RECIPIENT' | 'DUPLICATE FOR TRANSPORTER' | 'TRIPLICATE FOR SUPPLIER';
}

export interface AdditionalCharges {
  shippingCharges: number;
  shippingGstRate: number;
  packagingCharges: number;
  otherCharges: number;
  autoRoundOff: boolean;
}

export interface InvoiceData {
  id: string;
  meta: InvoiceMeta;
  seller: SellerDetails;
  party: PartyDetails;
  bank: BankDetails;
  items: LineItem[];
  additionalCharges: AdditionalCharges;
  updatedAt: string;
}

export interface HsnSummary {
  hsnCode: string;
  taxableValue: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTax: number;
}

export interface InvoiceCalculations {
  totalTaxableAmount: number;
  totalCgstAmount: number;
  totalSgstAmount: number;
  totalIgstAmount: number;
  totalTaxAmount: number;
  additionalChargesTotal: number;
  subtotalWithTax: number;
  roundOff: number;
  grandTotal: number;
  grandTotalWords: string;
  hsnSummaries: HsnSummary[];
}
