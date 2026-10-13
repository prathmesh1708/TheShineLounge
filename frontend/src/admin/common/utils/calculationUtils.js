// Financial & Tax Calculation Engine for "The Shine Lounge"
import {
  isRevenueSale,
  getBookingDate,
  bookingAmount,
  isInDateRange,
  getPresetRange,
  getFinancialYear
} from './dashboardStats';
// Standardized according to Indian GST Law, SAC codes, and Lounge Financial Operations

export const defaultCalculationSettings = {
  // Business Legal & Tax Identification
  businessName: 'Shine N Sip Solutions Private Limited',
  tradeName: 'The Shine Lounge',
  gstin: '06ABSCS4162M1ZO',
  pan: 'AABCT8742L',
  stateCode: '06 - Haryana',
  registeredAddress: '1173/82, Southern Peripheral Rd, next to Sportscube, Darbaripur, Sector 75, Gurugram, Haryana 122101',

  // GST & Tax Presets
  defaultGstRate: 18, // 18% standard rate
  gstPricingMode: 'inclusive', // 'inclusive' (price has GST built-in) | 'exclusive' (GST added on top)
  taxType: 'split', // 'split' (CGST 50% + SGST 50%) | 'igst' (100% IGST)
  
  // Category-specific GST Rates (%)
  categoryGstRates: {
    'car-wash': 18,
    'car-detailing': 18,
    'cafe': 5,
    'drive-through-cafe': 5,
    'dog-wash': 18,
    'salon': 18
  },

  // Statutory SAC (Services Accounting Code) under GST
  categorySacCodes: {
    'car-wash': '998714', // Maintenance and repair services of motor vehicles
    'car-detailing': '998714', // Surface treatment and detailing of motor vehicles
    'cafe': '996331', // Restaurant and food serving services (5% without ITC)
    'drive-through-cafe': '996331', // Takeaway / Drive-thru food service
    'dog-wash': '999729', // Other pet grooming & care services
    'salon': '999721' // Hairdressing and beauty treatment services
  },

  // Operating Overhead & Deduction Rates (% of base/gross)
  operatingOverheadRate: 18.5, // 18.5% allocated to rent, power, water & consumables
  staffIncentiveRate: 0,
  gatewaySurchargeRate: 1.8, // 1.8% average card/UPI payment processing fee
  depreciationReserveRate: 0,
  fixedMonthlyOverhead: 150000, // ₹1,50,000 fixed overhead per month

  // How Net Profit is worked out:
  //  'estimate' – taxable sales minus the overhead % and gateway % above
  //  'actual'   – taxable sales minus costs actually recorded in the app
  profitMethod: 'estimate',
  profitIncludeExpenses: true, // actual mode: subtract Misc. Expenses
  profitIncludePayroll: true,  // actual mode: subtract staff salaries (net payable)

  // Fiscal Year & Reporting
  fiscalYear: getFinancialYear().label,
  quarter: 'Q2 (Jul - Sep)',
  accountingMethod: 'Accrual Basis',

  // Chartered Accountant (CA) Contact Details
  caName: 'CA Rajesh Agarwal',
  caFirmName: 'R. Agarwal & Associates, Chartered Accountants',
  caMembershipNo: 'FCA-084291',
  caPhone: '+919820123456',
  caEmail: 'tax.audit@theshinelounge.com',
  caNotes: 'Verified for quarterly GST return GSTR-3B, GSTR-1 reconciliation & statutory balance sheet audit.'
};

/**
 * Normalizes any department name or key to a canonical key
 */
export const normalizeServiceKey = (nameOrKey = '') => {
  const s = String(nameOrKey || '').toLowerCase().trim();
  if (s.includes('detailing')) return 'car-detailing';
  if (s.includes('wash') && !s.includes('dog')) return 'car-wash';
  if (s.includes('dog') || s.includes('pet')) return 'dog-wash';
  if (s.includes('drive') || s.includes('thru')) return 'drive-through-cafe';
  if (s.includes('caf') || s.includes('coffee') || s.includes('food')) return 'cafe';
  if (s.includes('salon') || s.includes('hair') || s.includes('barber')) return 'salon';
  return 'car-wash';
};

/**
 * Returns human-readable department title
 */
export const getServiceDisplayName = (key) => {
  const map = {
    'car-wash': 'Car Wash',
    'car-detailing': 'Car Detailing',
    'cafe': 'Café',
    'drive-through-cafe': 'Drive-Through Café',
    'dog-wash': 'Dog Bath',
    'salon': "Men's Salon"
  };
  return map[key] || 'Car Wash';
};

/**
 * Computes GST tax & base for a single transaction according to calculation settings
 */
export const computeTransactionTax = (item, settings = defaultCalculationSettings) => {
  const gross = bookingAmount(item);
  const serviceKey = normalizeServiceKey(item.serviceKey || item.serviceName || item.service || item.department);
  const sacCode = settings.categorySacCodes?.[serviceKey] || '998714';

  let rate;
  let taxableBase;
  let taxAmount;
  let finalGross = gross;

  if (typeof item.includeGst === 'boolean') {
    // The sale records whether GST was charged and how much — use that. A
    // non-GST receipt has no output tax; inventing 18% on it overstated the
    // GST liability sent to the CA.
    if (item.includeGst) {
      const stored = Number(item.gstAmount) || 0;
      const fromSubtotal = Number(item.subtotal) > 0 ? gross - Number(item.subtotal) : 0;
      const storedRate = Number(item.gstRate) || 0;
      taxAmount = stored > 0 ? stored
        : fromSubtotal > 0 ? fromSubtotal
        : storedRate > 0 ? gross - gross / (1 + storedRate / 100)
        : 0;
      taxAmount = Math.min(Math.max(0, taxAmount), gross);
      taxableBase = gross - taxAmount;
      rate = storedRate || (taxableBase > 0 ? Math.round((taxAmount / taxableBase) * 1000) / 10 : 0);
    } else {
      taxAmount = 0;
      taxableBase = gross;
      rate = 0;
    }
  } else {
    // Legacy rows with no GST record: estimate from the configured category rate.
    rate = Number(settings.categoryGstRates?.[serviceKey] ?? settings.defaultGstRate ?? 18);
    if (settings.gstPricingMode === 'exclusive') {
      taxableBase = gross;
      taxAmount = (gross * rate) / 100;
      finalGross = taxableBase + taxAmount;
    } else {
      taxableBase = rate > 0 ? gross / (1 + rate / 100) : gross;
      taxAmount = gross - taxableBase;
    }
  }

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (settings.taxType === 'igst') {
    igst = taxAmount;
  } else {
    cgst = taxAmount / 2;
    sgst = taxAmount / 2;
  }

  return {
    gross: finalGross,
    taxableBase,
    taxRate: rate,
    taxAmount,
    cgst,
    sgst,
    igst,
    sacCode,
    serviceKey,
    serviceName: getServiceDisplayName(serviceKey)
  };
};

/**
 * Parses and returns a valid Date object from transaction fields.
 * Same rule as the dashboard: the sale date wins over the record's createdAt.
 */
export const parseItemDate = (item) => getBookingDate(item);

/**
 * Checks if a transaction is cancelled or failed
 */
export const isCancelledTransaction = (item) => {
  if (!item) return false;
  const s = String(item.status || item.bookingStatus || '').toLowerCase();
  const p = String(item.paymentStatus || '').toLowerCase();
  return ['cancelled', 'canceled', 'rejected', 'failed', 'refunded'].includes(s) || ['failed', 'refunded', 'cancelled'].includes(p);
};

export const currentFinancialYearLabel = () => getFinancialYear().label;

// 'FY 2026-27' -> { start: '2026-04-01', end: '2027-03-31' }
const parseFyLabel = (label) => {
  const m = /^FY\s*(\d{4})-(\d{2})$/.exec(String(label || '').trim());
  if (!m) return null;
  const y = Number(m[1]);
  return { start: `${y}-04-01`, end: `${y + 1}-03-31` };
};

/**
 * Filters to paid, non-zero sales inside the time range. Unpaid, cancelled and
 * ₹0 membership redemptions are excluded so totals, counts and AOV are real.
 */
export const filterTransactionsByRange = (items = [], timeRange = 'This Month', customStart = null, customEnd = null) => {
  let range = null;
  if (timeRange === 'Today') range = getPresetRange('today');
  else if (timeRange === 'This Week') range = getPresetRange('last7');
  else if (timeRange === 'This Month') range = getPresetRange('thisMonth');
  else if (timeRange === 'Custom' && customStart && customEnd) range = { start: customStart, end: customEnd };
  else range = parseFyLabel(timeRange); // 'FY yyyy-yy'; null => All Time
  return filterByRange(items, range);
};

// The concrete { start, end } a report time range covers (null => All Time).
export const getReportRange = (timeRange, customStart = null, customEnd = null) => {
  if (timeRange === 'Today') return getPresetRange('today');
  if (timeRange === 'This Week') return getPresetRange('last7');
  if (timeRange === 'This Month') return getPresetRange('thisMonth');
  if (timeRange === 'Custom' && customStart && customEnd) return { start: customStart, end: customEnd };
  return parseFyLabel(timeRange);
};

const filterByRange = (items, range) => {
  return (items || []).filter((item) => {
    if (!isRevenueSale(item)) return false;
    if (!range) return true;
    return isInDateRange(getBookingDate(item), range.start, range.end);
  });
};

/**
 * Computes complete financial summary, P&L, and CA audit metrics strictly from live transaction data
 */
/**
 * actualCosts (only used when settings.profitMethod === 'actual'):
 *   { expenses: number|null, payroll: number|null, loading: boolean }
 * null means "not loaded / unavailable" — reported, never guessed.
 */
export const computeFinancialSummary = (allTransactions = [], settings = defaultCalculationSettings, timeRange = 'This Month', actualCosts = null) => {
  const safeSettings = { ...defaultCalculationSettings, ...(settings || {}) };
  const filtered = filterTransactionsByRange(allTransactions, timeRange);

  let totalGross = 0;
  let totalTaxable = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalTax = 0;

  const deptKeys = ['car-wash', 'car-detailing', 'cafe', 'drive-through-cafe', 'dog-wash', 'salon'];
  const deptAgg = {
    'car-wash': { count: 0, gross: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, tax: 0 },
    'car-detailing': { count: 0, gross: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, tax: 0 },
    'cafe': { count: 0, gross: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, tax: 0 },
    'drive-through-cafe': { count: 0, gross: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, tax: 0 },
    'dog-wash': { count: 0, gross: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, tax: 0 },
    'salon': { count: 0, gross: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, tax: 0 }
  };

  const paymentAgg = {
    'UPI / QR': { count: 0, gross: 0 },
    'Credit/Debit Card': { count: 0, gross: 0 },
    'Cash': { count: 0, gross: 0 },
    'Bank Transfer': { count: 0, gross: 0 }
  };

  const enrichedTransactions = filtered.map((item, idx) => {
    const taxData = computeTransactionTax(item, safeSettings);
    totalGross += taxData.gross;
    totalTaxable += taxData.taxableBase;
    totalCgst += taxData.cgst;
    totalSgst += taxData.sgst;
    totalIgst += taxData.igst;
    totalTax += taxData.taxAmount;

    if (deptAgg[taxData.serviceKey]) {
      deptAgg[taxData.serviceKey].count += 1;
      deptAgg[taxData.serviceKey].gross += taxData.gross;
      deptAgg[taxData.serviceKey].taxable += taxData.taxableBase;
      deptAgg[taxData.serviceKey].cgst += taxData.cgst;
      deptAgg[taxData.serviceKey].sgst += taxData.sgst;
      deptAgg[taxData.serviceKey].igst += taxData.igst;
      deptAgg[taxData.serviceKey].tax += taxData.taxAmount;
    }

    const payMode = (item.paymentMode || item.paymentMethod || item.paymentType || 'Cash').trim();
    const matchedMode = Object.keys(paymentAgg).find(m => m.toLowerCase().includes(payMode.toLowerCase())) || 
      (payMode.toLowerCase().includes('upi') || payMode.toLowerCase().includes('online') || payMode.toLowerCase().includes('qr') ? 'UPI / QR' :
       payMode.toLowerCase().includes('card') ? 'Credit/Debit Card' :
       payMode.toLowerCase().includes('bank') ? 'Bank Transfer' : 'Cash');
    
    paymentAgg[matchedMode].count += 1;
    paymentAgg[matchedMode].gross += taxData.gross;

    return {
      ...item,
      invoiceId: item.invoiceId || item.id || `TSL-INV-2026-${String(idx + 101).padStart(4, '0')}`,
      calculatedGross: taxData.gross,
      taxableBase: taxData.taxableBase,
      taxRate: taxData.taxRate,
      cgst: taxData.cgst,
      sgst: taxData.sgst,
      igst: taxData.igst,
      taxAmount: taxData.taxAmount,
      sacCode: taxData.sacCode,
      serviceName: taxData.serviceName
    };
  });

  // Actual blended rate of the GST charged in the period, not the default setting.
  const effectiveTaxRate = totalTaxable > 0 ? Math.round((totalTax / totalTaxable) * 1000) / 10 : 0;

  // Operating deductions: estimated from the settings, or actual recorded costs.
  const isActual = safeSettings.profitMethod === 'actual';
  const overheadRate = Number(safeSettings.operatingOverheadRate ?? 18.5);
  const gatewayRate = Number(safeSettings.gatewaySurchargeRate ?? 1.8);

  let operatingOverheads = 0;
  let gatewayFees = 0;
  let recordedExpenses = 0;
  let payrollCost = 0;
  const deductionRows = [];

  if (isActual) {
    const costs = actualCosts || {};
    if (safeSettings.profitIncludeExpenses !== false) {
      recordedExpenses = Number(costs.expenses) || 0;
      deductionRows.push({ label: 'Recorded Expenses (Misc. Expenses)', basis: 'Actual, by date spent', amount: Math.round(recordedExpenses) });
    }
    if (safeSettings.profitIncludePayroll !== false) {
      payrollCost = Number(costs.payroll) || 0;
      deductionRows.push({ label: 'Staff Salaries (net payable)', basis: 'Actual, pro-rated to the period', amount: Math.round(payrollCost) });
    }
  } else {
    operatingOverheads = (totalTaxable * overheadRate) / 100;
    gatewayFees = (totalGross * gatewayRate) / 100;
    deductionRows.push({ label: 'Operating Overheads (Rent, Utilities, Consumables)', basis: `${overheadRate}% of net taxable base (estimate)`, amount: Math.round(operatingOverheads) });
    deductionRows.push({ label: 'Payment Gateway & POS Surcharge', basis: `${gatewayRate}% of gross turnover (estimate)`, amount: Math.round(gatewayFees) });
  }

  const staffIncentives = 0;
  const depreciationReserve = 0;
  const totalDeductions = operatingOverheads + gatewayFees + recordedExpenses + payrollCost;

  // Net Operating Profit (EBITDA before direct corporate income tax).
  // Not clamped: a loss must show as a loss, not as ₹0.
  const netProfit = totalTaxable - totalDeductions;
  const netProfitMargin = totalTaxable > 0 ? (netProfit / totalTaxable) * 100 : 0;

  const txCount = enrichedTransactions.length;
  const aov = txCount > 0 ? totalGross / txCount : 0;

  // Build department schedule strictly from real transaction data
  const departmentBreakdown = deptKeys.map(key => {
    const deptData = deptAgg[key] || { gross: 0, taxable: 0, cgst: 0, sgst: 0, tax: 0, count: 0 };
    const rate = Number(safeSettings.categoryGstRates?.[key] ?? safeSettings.defaultGstRate ?? 18);
    const sacCode = safeSettings.categorySacCodes?.[key] || '998714';

    return {
      key,
      name: getServiceDisplayName(key),
      sacCode,
      rate,
      count: deptData.count,
      gross: Math.round(deptData.gross),
      taxable: Math.round(deptData.taxable),
      cgst: Math.round(deptData.cgst),
      sgst: Math.round(deptData.sgst),
      tax: Math.round(deptData.tax),
      share: totalGross > 0 ? Math.round((deptData.gross / totalGross) * 1000) / 10 : 0
    };
  });

  // Build Payment Mode Breakdown strictly from real transaction data
  const paymentModeBreakdown = Object.keys(paymentAgg).map(mode => {
    const count = paymentAgg[mode].count;
    const gross = paymentAgg[mode].gross;
    const share = totalGross > 0 ? Math.round((gross / totalGross) * 100) : 0;
    return {
      mode,
      count,
      gross: Math.round(gross),
      share
    };
  });

  return {
    timeRange,
    grossSales: Math.round(totalGross),
    netSales: Math.round(totalTaxable),
    cgst: Math.round(totalCgst * 100) / 100,
    sgst: Math.round(totalSgst * 100) / 100,
    igst: Math.round(totalIgst * 100) / 100,
    totalGst: Math.round(totalTax * 100) / 100,
    effectiveTaxRate,
    operatingOverheads: Math.round(operatingOverheads),
    staffIncentives: Math.round(staffIncentives),
    gatewayFees: Math.round(gatewayFees),
    depreciationReserve: Math.round(depreciationReserve),
    totalDeductions: Math.round(totalDeductions),
    profitMethod: isActual ? 'actual' : 'estimate',
    profitBasisLabel: isActual ? 'Actual recorded costs' : 'Estimated from overhead %',
    costsLoading: Boolean(isActual && actualCosts && actualCosts.loading),
    recordedExpenses: Math.round(recordedExpenses),
    payrollCost: Math.round(payrollCost),
    deductionRows,
    netProfit: Math.round(netProfit),
    netProfitMargin: Math.round(netProfitMargin * 10) / 10,
    transactionCount: txCount,
    aov: Math.round(aov),
    departmentBreakdown,
    paymentModeBreakdown,
    transactions: enrichedTransactions
  };
};

/**
 * Currency formatter for Indian Rupees
 */
export const formatINR = (val) => {
  const raw = Number(val || 0);
  const num = Math.abs(raw);
  return (raw < 0 ? '-₹' : '₹') + num.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: num % 1 === 0 ? 0 : 2
  });
};

/**
 * Monthly salary totals pro-rated to the days of `range` that fall in each
 * month (a 7-day report carries 7/31 of a 31-day month's payroll). Days after
 * today are not charged.
 */
export const prorateMonthlyCost = (monthRows = [], range, todayKey) => {
  if (!range || !range.start || !range.end) {
    return monthRows.reduce((sum, r) => sum + (Number(r.netPayable) || 0), 0);
  }
  const end = range.end > todayKey ? todayKey : range.end;
  let total = 0;
  for (const row of monthRows) {
    const [y, m] = String(row.month).split('-').map(Number);
    const dim = new Date(y, m, 0).getDate();
    const mStart = `${row.month}-01`;
    const mEnd = `${row.month}-${String(dim).padStart(2, '0')}`;
    const from = range.start > mStart ? range.start : mStart;
    const to = end < mEnd ? end : mEnd;
    if (from > to) continue;
    const days = Math.round((new Date(`${to}T12:00:00`) - new Date(`${from}T12:00:00`)) / 86400000) + 1;
    total += (Number(row.netPayable) || 0) * (days / dim);
  }
  return total;
};
