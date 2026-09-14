import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useStaff } from '../common/context/StaffContext';
import { Receipt, Plus, Trash2, Printer, Tag, Sparkles, CheckCircle2, ShieldCheck, Calculator } from 'lucide-react';
import serviceApi from '../../common/services/serviceApi';
import { defaultCalculationSettings, formatINR } from '../../admin/common/utils/calculationUtils';
import { downloadReceiptPdf } from '../../common/utils/receiptPdfGenerator';

// Helper function to extract pure admin-configured services & packages from DB / cached service object
const extractAdminServices = (serviceData) => {
  if (!serviceData) return [];
  const list = [];
  const seen = new Set();

  // 1. Pricing items (Single Services configured in Admin Hub)
  if (Array.isArray(serviceData.pricing) && serviceData.pricing.length > 0) {
    serviceData.pricing.forEach((p, idx) => {
      const name = (p.title || p.name || '').trim();
      const price = Number(p.price) || 0;
      const key = `${name.toLowerCase()}::${price}`;
      if (name && !seen.has(key)) {
        seen.add(key);
        list.push({
          id: p._id || p.id || `pricing-${idx}`,
          name: name,
          price: price,
          description: p.description || '',
          type: 'pricing'
        });
      }
    });
  }

  // 2. Plans (Packages configured in Admin Hub if not already in pricing)
  if (Array.isArray(serviceData.plans) && serviceData.plans.length > 0) {
    serviceData.plans.forEach((p, idx) => {
      const name = (p.name || p.title || '').trim();
      const price = Number(p.price) || 0;
      const key = `${name.toLowerCase()}::${price}`;
      if (name && !seen.has(key)) {
        seen.add(key);
        list.push({
          id: p._id || p.id || `plan-${idx}`,
          name: name,
          price: price,
          description: p.description || (Array.isArray(p.features) ? p.features.join(', ') : '') || '',
          type: 'plan'
        });
      }
    });
  }

  // 3. Membership Passes (Configured in Admin Hub)
  if (Array.isArray(serviceData.memberships) && serviceData.memberships.length > 0) {
    serviceData.memberships.forEach((m, idx) => {
      const name = (m.name || m.title || '').trim();
      const price = Number(m.price) || 0;
      const key = `${name.toLowerCase()}::${price}`;
      if (name && !seen.has(key)) {
        seen.add(key);
        list.push({
          id: m._id || m.id || `mem-${idx}`,
          name: name,
          price: price,
          description: Array.isArray(m.benefits) ? m.benefits.join(', ') : (m.benefits || m.description || ''),
          badge: m.badge || 'PASS',
          type: 'membership'
        });
      }
    });
  }

  return list;
};

// Helper to read cached service data for a department slug
const getCachedServiceData = (deptSlug) => {
  try {
    const storageKey = `tsl_${deptSlug.replace(/-/g, '_')}_service`;
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      return extractAdminServices(parsed);
    }
  } catch (e) {
    console.warn('Error parsing cached service data:', e);
  }
  return [];
};

export default function StaffInvoicingPage() {
  const { customers, currentStaff, showToast } = useStaff();

  // Dynamic Admin Calculation Settings from localStorage / AdminContext
  const [calcSettings, setCalcSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('tsl_calculation_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error parsing calculation settings:', e);
    }
    return defaultCalculationSettings;
  });

  // Listen for real-time admin tax and calculation rule updates
  useEffect(() => {
    const handleCalcUpdate = (e) => {
      if (e?.detail) {
        setCalcSettings(e.detail);
      } else {
        try {
          const saved = localStorage.getItem('tsl_calculation_settings');
          if (saved) setCalcSettings(JSON.parse(saved));
        } catch (err) {}
      }
    };

    const handleStorageCalc = (e) => {
      if (e.key === 'tsl_calculation_settings' || !e.key) {
        try {
          const saved = localStorage.getItem('tsl_calculation_settings');
          if (saved) setCalcSettings(JSON.parse(saved));
        } catch (err) {}
      }
    };

    window.addEventListener('tsl_calculation_settings_updated', handleCalcUpdate);
    window.addEventListener('storage', handleStorageCalc);

    return () => {
      window.removeEventListener('tsl_calculation_settings_updated', handleCalcUpdate);
      window.removeEventListener('storage', handleStorageCalc);
    };
  }, []);

  // Detect staff's department & service key
  const dept = currentStaff?.department || '';
  const key = currentStaff?.serviceKey || '';
  const deptLower = (dept || '').toLowerCase();
  const roleLower = (currentStaff?.role || currentStaff?.staffRole || '').toLowerCase();
  const combined = `${key} ${deptLower} ${roleLower}`;

  let currentDeptKey = 'car-wash';
  let currentDeptLabel = 'Car Wash';

  if (combined.includes('drive')) {
    currentDeptKey = 'drive-through-cafe';
    currentDeptLabel = 'Drive-Through Café';
  } else if (combined.includes('cafe') || combined.includes('barista') || combined.includes('chef') || combined.includes('pastry')) {
    currentDeptKey = 'cafe';
    currentDeptLabel = 'Café';
  } else if (combined.includes('detail') || combined.includes('ceramic') || combined.includes('ppf')) {
    currentDeptKey = 'car-detailing';
    currentDeptLabel = 'Car Detailing';
  } else if (combined.includes('dog') || combined.includes('pet') || combined.includes('groom')) {
    currentDeptKey = 'dog-wash';
    currentDeptLabel = 'Dog Wash';
  } else if (combined.includes('salon') || combined.includes('barber') || combined.includes('hair') || combined.includes('stylist')) {
    currentDeptKey = 'salon';
    currentDeptLabel = "Men's Salon";
  }

  // Available services for the staff's department — initialized purely from admin cache
  const [deptServices, setDeptServices] = useState(() => {
    const initial = getCachedServiceData(currentDeptKey);
    return initial.length > 0 ? initial : [];
  });
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [items, setItems] = useState([]);

  // Sync services from live MongoDB backend and cache
  const syncDepartmentServices = useCallback(async () => {
    // 1. Check local cache first for instant rendering
    const cachedItems = getCachedServiceData(currentDeptKey);
    if (cachedItems.length > 0) {
      setDeptServices(cachedItems);
    }

    // 2. Fetch live data from backend database
    try {
      const res = await serviceApi.getServiceBySlug(currentDeptKey);
      if (res?.success && res.service) {
        const liveItems = extractAdminServices(res.service);
        if (liveItems.length > 0) {
          setDeptServices(liveItems);
          try {
            const storageKey = `tsl_${currentDeptKey.replace(/-/g, '_')}_service`;
            localStorage.setItem(storageKey, JSON.stringify(res.service));
          } catch (e) {}
        }
      }
    } catch (err) {
      console.warn(`Could not fetch live ${currentDeptKey} services:`, err.message);
    }
  }, [currentDeptKey]);

  useEffect(() => {
    syncDepartmentServices();

    // Listen to real-time admin package updates
    const handleAdminServiceUpdate = (e) => {
      if (e?.detail) {
        const updatedSlug = e.detail.slug || (e.detail.serviceName ? e.detail.serviceName.toLowerCase().replace(/\s+/g, '-') : '');
        if (!updatedSlug || updatedSlug === currentDeptKey || updatedSlug.includes(currentDeptKey.split('-')[0])) {
          const updatedItems = extractAdminServices(e.detail);
          if (updatedItems.length > 0) {
            setDeptServices(updatedItems);
          }
        }
      } else {
        syncDepartmentServices();
      }
    };

    const handleStorageChange = (e) => {
      const storageKey = `tsl_${currentDeptKey.replace(/-/g, '_')}_service`;
      if (e.key === storageKey || !e.key) {
        syncDepartmentServices();
      }
    };

    window.addEventListener('tsl_service_updated', handleAdminServiceUpdate);
    window.addEventListener('tsl_car_wash_pricing_updated', syncDepartmentServices);
    window.addEventListener('carDetailingDataChanged', syncDepartmentServices);
    window.addEventListener('dogWashDataChanged', syncDepartmentServices);
    window.addEventListener('salonDataChanged', syncDepartmentServices);
    window.addEventListener('tsl_drive_through_cafe_updated', syncDepartmentServices);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('tsl_service_updated', handleAdminServiceUpdate);
      window.removeEventListener('tsl_car_wash_pricing_updated', syncDepartmentServices);
      window.removeEventListener('carDetailingDataChanged', syncDepartmentServices);
      window.removeEventListener('dogWashDataChanged', syncDepartmentServices);
      window.removeEventListener('salonDataChanged', syncDepartmentServices);
      window.removeEventListener('tsl_drive_through_cafe_updated', syncDepartmentServices);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [currentDeptKey, syncDepartmentServices]);

  // Keep selectedServiceId and initial item synchronized with available department services
  useEffect(() => {
    if (deptServices.length > 0) {
      if (!selectedServiceId || !deptServices.some(s => s.id === selectedServiceId)) {
        setSelectedServiceId(deptServices[0].id);
      }
      setItems(prev => {
        if (prev.length === 0) {
          return [{
            id: `item-${Date.now()}`,
            name: deptServices[0].name,
            price: Number(deptServices[0].price) || 0,
            qty: 1
          }];
        }
        return prev;
      });
    }
  }, [deptServices, selectedServiceId]);

  const [selectedCustomer, setSelectedCustomer] = useState(() => customers[0]?.id || '');
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [generatedInvoice, setGeneratedInvoice] = useState(null);
  const receiptRef = useRef(null);

  // Keep selectedCustomer synchronized when customers list updates
  useEffect(() => {
    if (customers && customers.length > 0) {
      if (!selectedCustomer || !customers.some(c => c.id === selectedCustomer)) {
        setSelectedCustomer(customers[0].id);
      }
    }
  }, [customers, selectedCustomer]);

  const currentCust = (customers || []).find(c => c.id === selectedCustomer) || customers?.[0] || null;

  // ----------------------------------------------------
  // DYNAMIC ADMIN FINANCIAL & TAX CALCULATIONS ENGINE
  // ----------------------------------------------------
  const deptGstRate = Number(calcSettings?.categoryGstRates?.[currentDeptKey] ?? calcSettings?.defaultGstRate ?? 18);
  const isExclusive = calcSettings?.gstPricingMode === 'exclusive';
  const isIgst = calcSettings?.taxType === 'igst';
  const sacCode = calcSettings?.categorySacCodes?.[currentDeptKey] || '998714';

  const subtotal = items.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.qty) || 1), 0);
  const discountAmount = appliedDiscount;
  const netAmount = Math.max(0, subtotal - discountAmount);

  let taxableAmount = 0;
  let taxAmount = 0;
  let grandTotal = 0;

  if (isExclusive) {
    // Exclusive mode: GST is added on top of the taxable amount
    taxableAmount = netAmount;
    taxAmount = (taxableAmount * deptGstRate) / 100;
    grandTotal = taxableAmount + taxAmount;
  } else {
    // Inclusive mode: Total price includes GST, base is back-calculated
    taxableAmount = deptGstRate > 0 ? netAmount / (1 + deptGstRate / 100) : netAmount;
    taxAmount = netAmount - taxableAmount;
    grandTotal = netAmount;
  }

  // CGST / SGST / IGST Splits
  const cgstAmount = isIgst ? 0 : taxAmount / 2;
  const sgstAmount = isIgst ? 0 : taxAmount / 2;
  const igstAmount = isIgst ? taxAmount : 0;
  const splitRate = (deptGstRate / 2).toFixed(1).replace('.0', '');

  const handleApplyCoupon = () => {
    if (couponCode.toUpperCase() === 'SHINE50') {
      setAppliedDiscount(350);
      showToast?.('Coupon SHINE50 applied! ₹350 Discount', 'success');
    } else if (couponCode.toUpperCase() === 'CAFE100') {
      setAppliedDiscount(100);
      showToast?.('Coupon CAFE100 applied! ₹100 Discount', 'success');
    } else {
      showToast?.('Invalid Coupon Code', 'error');
    }
  };

  const handleAddSelectedService = () => {
    const found = deptServices.find(s => s.id === selectedServiceId) || deptServices[0];
    if (!found) return;

    const newItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: found.name,
      price: Number(found.price) || 0,
      qty: 1
    };

    setItems(prev => [...prev, newItem]);
    showToast?.(`Added "${newItem.name}" to line items`, 'success');
  };

  const handleUpdatePrice = (id, newPrice) => {
    const val = Number(newPrice);
    setItems(prev => prev.map(i => i.id === id ? { ...i, price: isNaN(val) ? 0 : val } : i));
  };

  const handleUpdateQty = (id, newQty) => {
    const qtyNum = Math.max(1, parseInt(newQty) || 1);
    setItems(prev => prev.map(i => i.id === id ? { ...i, qty: qtyNum } : i));
  };

  const handleRemoveItem = (id) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleCreateInvoice = (e) => {
    e.preventDefault();
    if (items.length === 0) {
      showToast?.('Please add at least one line item to generate an invoice', 'error');
      return;
    }

    const inv = {
      id: `INV-${Math.floor(10000 + Math.random() * 90000)}`,
      department: currentDeptLabel,
      departmentKey: currentDeptKey,
      sacCode: sacCode,
      customerName: currentCust?.name || 'Customer',
      phone: currentCust?.mobile || '',
      vehicleNo: currentCust?.vehicles?.[0]?.registrationNumber || '',
      items: items.map(it => ({ ...it, price: Number(it.price) || 0, qty: Number(it.qty) || 1 })),
      subtotal,
      discount: discountAmount,
      taxableAmount,
      gstRate: deptGstRate,
      gstPricingMode: isExclusive ? 'exclusive' : 'inclusive',
      taxType: isIgst ? 'igst' : 'split',
      gst: taxAmount,
      cgst: cgstAmount,
      sgst: sgstAmount,
      igst: igstAmount,
      total: grandTotal,
      paymentMethod,
      staffName: currentStaff?.name || 'Ground Staff',
      date: new Date().toLocaleString(),
      businessName: calcSettings?.businessName || 'The Shine Lounge Pvt Ltd',
      tradeName: calcSettings?.tradeName || 'The Shine Lounge',
      gstin: calcSettings?.gstin || '27AABCT8742L1ZK',
      pan: calcSettings?.pan || 'AABCT8742L',
      registeredAddress: calcSettings?.registeredAddress || 'Plot 42, Senapati Bapat Marg, Lower Parel, Mumbai, Maharashtra 400013'
    };
    setGeneratedInvoice(inv);
    showToast?.(`✅ Invoice ${inv.id} Generated with ${deptGstRate}% GST (${isExclusive ? 'Exclusive' : 'Inclusive'})!`, 'success');
  };

  return (
    <div className="space-y-4">
      {/* Title & Live Dynamic Tax Info Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-bold shadow-sm">
            <Receipt className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-base text-gray-900">Invoicing & POS Counter</h2>
            </div>
            <p className="text-xs text-gray-500 flex flex-wrap items-center gap-1.5 mt-0.5">
              <span className="font-bold text-amber-800">{currentDeptLabel}</span>
              <span>•</span>
              <span className="font-semibold text-gray-700">
                GST {deptGstRate}% ({isExclusive ? 'Exclusive - Added on top' : 'Inclusive in Price'})
              </span>
              <span>•</span>
              <span className="text-gray-500">
                {deptGstRate === 0 ? 'Tax Exempt' : isIgst ? `100% IGST (${deptGstRate}%)` : `Split: ${splitRate}% CGST + ${splitRate}% SGST`}
              </span>
              <span>•</span>
              <span className="text-gray-400 font-mono text-[11px]">SAC {sacCode}</span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-amber-100/80 text-amber-900 text-xs font-black uppercase rounded-xl tracking-wider border border-amber-300/50">
            {currentDeptLabel}
          </span>
        </div>
      </div>

      {/* Invoice Form */}
      <form onSubmit={handleCreateInvoice} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3.5">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Select Customer Profile</label>
          <select
            value={selectedCustomer}
            onChange={e => setSelectedCustomer(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          >
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.vehicles?.[0]?.registrationNumber || 'No Reg'}) — {c.mobile}
              </option>
            ))}
          </select>
        </div>

        {/* Department Service Dropdown Selector */}
        <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Select {currentDeptLabel} Service
            </label>
            <span className="text-[10px] font-bold text-amber-700">
              {deptServices.length} Services Available
            </span>
          </div>
          
          <div className="flex gap-2">
            <select
              value={selectedServiceId}
              onChange={e => setSelectedServiceId(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 truncate"
            >
              {deptServices.map(srv => (
                <option key={srv.id} value={srv.id}>
                  {srv.name} — ₹{srv.price}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAddSelectedService}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" /> Add Service
            </button>
          </div>
        </div>

        {/* Line Items List with Editable Price & Qty */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-gray-700">Line Items ({items.length})</label>
            <span className="text-[10px] text-gray-500 font-semibold italic">
              💡 Tip: Click price or ± to adjust rates
            </span>
          </div>

          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="flex items-center justify-between bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-xs gap-2">
                <div className="flex-1 min-w-0 pr-1">
                  <p className="font-extrabold text-gray-900 truncate">{item.name}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {/* Qty Stepper */}
                    <div className="inline-flex items-center bg-white border border-gray-200 rounded-lg shadow-2xs">
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item.id, item.qty - 1)}
                        className="px-1.5 py-0.5 text-gray-600 hover:bg-gray-100 font-bold text-[10px] rounded-l-lg transition-colors"
                        title="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="px-2 text-[11px] font-black text-gray-800">{item.qty}</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item.id, item.qty + 1)}
                        className="px-1.5 py-0.5 text-gray-600 hover:bg-gray-100 font-bold text-[10px] rounded-r-lg transition-colors"
                        title="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <span className="text-[10px] text-gray-400">×</span>

                    {/* Inline Editable Unit Price */}
                    <div className="relative inline-flex items-center">
                      <span className="text-[11px] font-black text-gray-600 mr-0.5">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={item.price}
                        onChange={(e) => handleUpdatePrice(item.id, e.target.value)}
                        className="w-20 px-2 py-0.5 text-xs font-black text-amber-700 bg-white border border-amber-300/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                        title="Click to edit unit price"
                      />
                    </div>
                  </div>
                </div>

                {/* Total and Remove */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-black text-gray-900 text-xs">
                    ₹{(Number(item.price || 0) * Number(item.qty || 1)).toFixed(0)}
                  </span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coupon Input */}
        <div className="pt-1">
          <label className="block text-xs font-bold text-gray-700 mb-1">Apply Promo / Coupon</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={couponCode}
                onChange={e => setCouponCode(e.target.value)}
                placeholder="Try SHINE50 or CAFE100"
                className="w-full pl-8 pr-2 py-2 border border-gray-300 rounded-xl text-xs font-bold uppercase text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
            <button
              type="button"
              onClick={handleApplyCoupon}
              className="px-3.5 py-2 rounded-xl bg-gray-900 hover:bg-black text-white font-extrabold text-xs shadow-xs transition-colors"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Dynamic Financial Breakdown Box */}
        <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/90 space-y-1.5 text-xs shadow-xs">
          <div className="flex justify-between text-gray-600 font-semibold">
            <span>Items Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>

          {appliedDiscount > 0 && (
            <div className="flex justify-between text-emerald-700 font-bold">
              <span>Promo / Coupon Discount</span>
              <span>-₹{appliedDiscount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-gray-700 font-medium pt-1 border-t border-amber-200/60 text-[11px]">
            <span>Net Taxable Base Value</span>
            <span>₹{taxableAmount.toFixed(2)}</span>
          </div>

          {/* Dynamic GST Slabs Display */}
          {deptGstRate > 0 ? (
            <>
              {isIgst ? (
                <div className="flex justify-between text-gray-700 font-semibold">
                  <span className="flex items-center gap-1">
                    IGST ({deptGstRate}%)
                    <span className="text-[10px] text-gray-500 font-normal">
                      {isExclusive ? '• Added on top' : '• Built-in'}
                    </span>
                  </span>
                  <span>₹{igstAmount.toFixed(2)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-gray-700 font-semibold">
                    <span className="flex items-center gap-1">
                      CGST ({splitRate}%)
                      <span className="text-[10px] text-gray-500 font-normal">
                        {isExclusive ? '• Added' : '• Built-in'}
                      </span>
                    </span>
                    <span>₹{cgstAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700 font-semibold">
                    <span className="flex items-center gap-1">
                      SGST ({splitRate}%)
                      <span className="text-[10px] text-gray-500 font-normal">
                        {isExclusive ? '• Added' : '• Built-in'}
                      </span>
                    </span>
                    <span>₹{sgstAmount.toFixed(2)}</span>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex justify-between text-emerald-700 font-bold">
              <span>GST (0% Statutory Exempt)</span>
              <span>₹0.00</span>
            </div>
          )}

          {/* Grand Total */}
          <div className="flex justify-between text-gray-900 font-black text-sm pt-2 border-t-2 border-amber-300">
            <div>
              <span>Grand Total</span>
              <span className="block text-[10px] font-medium text-gray-500">
                {isExclusive ? 'Net + Taxes Added' : 'Total Amount (All Taxes Inclusive)'}
              </span>
            </div>
            <span className="text-amber-800 text-base">₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Options */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Payment Method</label>
          <div className="grid grid-cols-3 gap-2">
            {['UPI', 'Card', 'Cash'].map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setPaymentMethod(m)}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${paymentMethod === m ? 'bg-amber-500 text-white border-amber-500 shadow-xs' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-xl text-white font-extrabold text-xs shadow-md active:scale-95 transition-transform flex items-center justify-center gap-1.5"
          style={{ backgroundColor: '#10b981' }}
        >
          <CheckCircle2 className="w-4 h-4" /> Generate Invoice & Collect Payment
        </button>
      </form>

      {/* Generated Receipt Preview Modal */}
      {generatedInvoice && (
        <div ref={receiptRef} id="printable-tsl-receipt" className="bg-white rounded-3xl p-5 shadow-2xl border border-gray-300 space-y-3">
          <div className="text-center border-b pb-2">
            <h3 className="font-black text-sm text-gray-900 uppercase tracking-wide">
              {generatedInvoice.businessName}
            </h3>
            <p className="text-[11px] font-bold text-gray-700">{generatedInvoice.tradeName}</p>
            <p className="text-[10px] text-gray-500">{generatedInvoice.registeredAddress}</p>
            <div className="flex items-center justify-center gap-2 mt-1 text-[10px] font-mono text-gray-600">
              <span>GSTIN: <strong>{generatedInvoice.gstin}</strong></span>
              <span>•</span>
              <span>SAC: <strong>{generatedInvoice.sacCode}</strong></span>
            </div>
            <p className="text-[10px] text-gray-500 font-mono mt-0.5">
              {generatedInvoice.id} • {generatedInvoice.department} • {generatedInvoice.date}
            </p>
          </div>

          <div className="text-xs space-y-1">
            <p className="font-bold text-gray-900">Customer: {generatedInvoice.customerName} ({generatedInvoice.phone})</p>
            {generatedInvoice.vehicleNo && <p className="text-gray-500">Vehicle: {generatedInvoice.vehicleNo}</p>}
            <p className="text-gray-500">Billed by: {generatedInvoice.staffName} ({generatedInvoice.department})</p>
          </div>

          <div className="border-t border-b py-2 space-y-1 text-xs">
            {generatedInvoice.items.map(i => (
              <div key={i.id} className="flex justify-between font-semibold text-gray-800">
                <span>{i.name} × {i.qty}</span>
                <span>₹{(i.price * i.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="text-xs space-y-1 font-bold">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span>₹{generatedInvoice.subtotal.toFixed(2)}</span>
            </div>
            {generatedInvoice.discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount:</span>
                <span>-₹{generatedInvoice.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Taxable Value:</span>
              <span>₹{generatedInvoice.taxableAmount.toFixed(2)}</span>
            </div>

            {/* Dynamic Tax Split in Receipt */}
            {generatedInvoice.gstRate > 0 ? (
              <>
                {generatedInvoice.taxType === 'igst' ? (
                  <div className="flex justify-between text-gray-600">
                    <span>IGST ({generatedInvoice.gstRate}%):</span>
                    <span>₹{generatedInvoice.igst.toFixed(2)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-gray-600">
                      <span>CGST ({(generatedInvoice.gstRate / 2).toFixed(1).replace('.0', '')}%):</span>
                      <span>₹{generatedInvoice.cgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>SGST ({(generatedInvoice.gstRate / 2).toFixed(1).replace('.0', '')}%):</span>
                      <span>₹{generatedInvoice.sgst.toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-gray-700 font-semibold text-[11px]">
                  <span>Total Tax ({generatedInvoice.gstPricingMode === 'exclusive' ? 'Added' : 'Included'}):</span>
                  <span>₹{generatedInvoice.gst.toFixed(2)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-emerald-700">
                <span>GST:</span>
                <span>Exempt (0%)</span>
              </div>
            )}

            <div className="flex justify-between text-gray-900 text-sm font-black pt-1 border-t border-gray-200">
              <span>Total Paid ({generatedInvoice.paymentMethod}):</span>
              <span className="text-amber-700">₹{generatedInvoice.total.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={() => downloadReceiptPdf(receiptRef.current, 'Receipt.pdf')}
            className="w-full py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" /> Download PDF Receipt
          </button>
        </div>
      )}
    </div>
  );
}


