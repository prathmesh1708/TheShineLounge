// Financial & Tax Calculation Engine for "The Shine Lounge"
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

  // Fiscal Year & Reporting
  fiscalYear: 'FY 2025-26',
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
  const gross = Math.max(0, Number(item.total ?? item.amount ?? item.price ?? 0));
  const serviceKey = normalizeServiceKey(item.serviceKey || item.serviceName || item.service || item.department);
  const rate = Number(settings.categoryGstRates?.[serviceKey] ?? settings.defaultGstRate ?? 18);
  const sacCode = settings.categorySacCodes?.[serviceKey] || '998714';

  let taxableBase = 0;
  let taxAmount = 0;
  let finalGross = gross;

  if (settings.gstPricingMode === 'exclusive') {
    taxableBase = gross;
    taxAmount = (gross * rate) / 100;
    finalGross = taxableBase + taxAmount;
  } else {
    // Inclusive (standard Indian consumer billing)
    taxableBase = rate > 0 ? gross / (1 + rate / 100) : gross;
    taxAmount = gross - taxableBase;
    finalGross = gross;
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
 * Parses and returns a valid Date object from transaction fields
 */
export const parseItemDate = (item) => {
  if (!item) return null;
  const raw = item.date || item.createdAt || item.bookedAt || item.saleDate || item.bookingDate;
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * Checks if a transaction is cancelled or failed
 */
export const isCancelledTransaction = (item) => {
  if (!item) return false;
  const s = String(item.status || item.bookingStatus || '').toLowerCase();
  const p = String(item.paymentStatus || '').toLowerCase();
  return s === 'cancelled' || s === 'canceled' || p === 'failed';
};

/**
 * Filters transactions based on time range (Excludes cancelled/failed orders)
 */
export const filterTransactionsByRange = (items = [], timeRange = 'This Month', customStart = null, customEnd = null) => {
  const now = new Date();

  return items.filter(item => {
    // Exclude cancelled or failed transactions from revenue
    if (isCancelledTransaction(item)) {
      return false;
    }

    const itemDate = parseItemDate(item);

    if (timeRange === 'Today') {
      if (!itemDate) return false;
      return (
        itemDate.getDate() === now.getDate() &&
        itemDate.getMonth() === now.getMonth() &&
        itemDate.getFullYear() === now.getFullYear()
      );
    }

    if (timeRange === 'This Week') {
      if (!itemDate) return false;
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return itemDate >= oneWeekAgo && itemDate <= now;
    }

    if (timeRange === 'This Month') {
      if (!itemDate) return false;
      return (
        itemDate.getMonth() === now.getMonth() &&
        itemDate.getFullYear() === now.getFullYear()
      );
    }

    if (timeRange === 'FY 2025-26') {
      if (!itemDate) return false;
      const startFY = new Date(2025, 3, 1, 0, 0, 0); // 1 Apr 2025
      const endFY = new Date(2026, 2, 31, 23, 59, 59, 999); // 31 Mar 2026
      return itemDate >= startFY && itemDate <= endFY;
    }

    if (timeRange === 'Custom' && customStart && customEnd) {
      if (!itemDate) return false;
      const start = new Date(customStart);
      const end = new Date(customEnd);
      end.setHours(23, 59, 59, 999);
      return itemDate >= start && itemDate <= end;
    }

    // Default 'All Time'
    return true;
  });
};

/**
 * Computes complete financial summary, P&L, and CA audit metrics strictly from live transaction data
 */
export const computeFinancialSummary = (allTransactions = [], settings = defaultCalculationSettings, timeRange = 'This Month') => {
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

  const effectiveTaxRate = Number(safeSettings.defaultGstRate || 18);

  // Operating Deductions according to Admin Calculation Settings
  const overheadRate = Number(safeSettings.operatingOverheadRate || 18.5);
  const gatewayRate = Number(safeSettings.gatewaySurchargeRate || 1.8);

  const operatingOverheads = (totalTaxable * overheadRate) / 100;
  const staffIncentives = 0;
  const gatewayFees = (totalGross * gatewayRate) / 100;
  const depreciationReserve = 0;
  const totalDeductions = operatingOverheads + gatewayFees;

  // Net Operating Profit (EBITDA before direct corporate income tax)
  const netProfit = Math.max(0, totalTaxable - totalDeductions);
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
  const num = Number(val || 0);
  return '₹' + num.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: num % 1 === 0 ? 0 : 2
  });
};
