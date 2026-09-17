import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useStaff } from '../common/context/StaffContext';
import { Receipt, Plus, Trash2, Printer, Tag, Sparkles, CheckCircle2, ShieldCheck, Calculator, X, Loader2, Check, Copy } from 'lucide-react';
import serviceApi from '../../common/services/serviceApi';
import { defaultCalculationSettings, formatINR } from '../../admin/common/utils/calculationUtils';
import { downloadReceiptPdf, copyReceiptImageToClipboard, getReceiptPdfBlob } from '../../common/utils/receiptPdfGenerator';

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
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.registeredAddress || parsed.registeredAddress.includes('Plot 42') || parsed.registeredAddress.includes('Mumbai')) {
          parsed.registeredAddress = '1173/82, Southern Peripheral Rd, next to Sportscube, Darbaripur, Sector 75, Gurugram, Haryana 122101';
          localStorage.setItem('tsl_calculation_settings', JSON.stringify(parsed));
        }
        return parsed;
      }
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
  const [includeGst, setIncludeGst] = useState(false); // Default: Without GST
  const [generatedInvoice, setGeneratedInvoice] = useState(null);
  const receiptRef = useRef(null);

  // WhatsApp Receipt Sharing State
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [targetPhone, setTargetPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isCopyingImage, setIsCopyingImage] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [editableMessageText, setEditableMessageText] = useState('');
  const isProcessingRef = useRef(false);

  // Keep selectedCustomer synchronized when customers list updates
  useEffect(() => {
    if (customers && customers.length > 0) {
      if (!selectedCustomer || !customers.some(c => c.id === selectedCustomer)) {
        setSelectedCustomer(customers[0].id);
      }
    }
  }, [customers, selectedCustomer]);

  const currentCust = (customers || []).find(c => c.id === selectedCustomer) || customers?.[0] || null;

  // Helper to generate default WhatsApp receipt message
  const getDefaultMessage = useCallback((inv) => {
    if (!inv) return '';
    const itemNames = inv.items?.map(i => `${i.name} (x${i.qty})`).join(', ') || 'Services';
    return `✨ *The Shine Lounge - Official Receipt* ✨\n\nDear *${inv.customerName}*,\nThank you for visiting *The Shine Lounge (${inv.department})*!\n\n📄 *Invoice No:* #${inv.id}\n🚗 *Vehicle:* ${inv.vehicleNo || 'Registered Vehicle'}\n🛠️ *Services:* ${itemNames}\n💰 *Total Paid:* ₹${Number(inv.total || 0).toLocaleString('en-IN')} (${inv.paymentMethod})\n📍 *Location:* 1173/82, Southern Peripheral Rd, Sector 75, Gurugram\n\nWe look forward to serving you again!\n🌐 *The Shine Lounge*`;
  }, []);

  // Format phone number with +91 prefix
  const cleanPhoneForWhatsApp = (phoneStr) => {
    const digits = String(phoneStr || '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.length === 10) return `91${digits}`;
    if (digits.length > 10 && digits.startsWith('91')) return digits;
    if (digits.length > 10 && digits.startsWith('0')) return `91${digits.slice(1)}`;
    return digits;
  };

  // Copy receipt canvas image to clipboard
  const handleCopyReceiptImage = async () => {
    if (!receiptRef.current) return;
    setIsCopyingImage(true);
    try {
      await copyReceiptImageToClipboard(receiptRef.current);
      setCopiedSuccess(true);
      showToast?.('✅ Receipt image copied to clipboard!', 'success');
      setTimeout(() => setCopiedSuccess(false), 4000);
    } catch (err) {
      console.warn('Copy receipt image failed:', err);
      showToast?.('Could not copy image automatically to clipboard', 'error');
    } finally {
      setIsCopyingImage(false);
    }
  };

  // Send WhatsApp Action Handler
  const handleSendWhatsApp = async (rawNumber) => {
    const sanitized = cleanPhoneForWhatsApp(rawNumber);
    if (!sanitized || sanitized.length < 10) {
      setPhoneError('Please enter a valid 10-digit mobile number');
      setShowWhatsAppModal(true);
      return;
    }

    if (isProcessingRef.current || isGeneratingPdf) return;
    if (!receiptRef.current) {
      showToast?.('Receipt document is still preparing. Please try again.', 'error');
      return;
    }

    isProcessingRef.current = true;
    setIsGeneratingPdf(true);
    setPhoneError('');

    const messageText = (editableMessageText && editableMessageText.trim()) ? editableMessageText : getDefaultMessage(generatedInvoice);
    const filename = `Invoice-${generatedInvoice.id}.pdf`;
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${sanitized}&text=${encodeURIComponent(messageText)}`;

    let waWindow = null;
    const isMobileDevice = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (!isMobileDevice) {
      waWindow = window.open('about:blank', '_blank');
    }

    try {
      try {
        await copyReceiptImageToClipboard(receiptRef.current);
        setCopiedSuccess(true);
      } catch (copyErr) {
        console.warn('Auto-clipboard copy failed:', copyErr);
      }

      const pdfBlob = await getReceiptPdfBlob(receiptRef.current, filename);
      const pdfFile = new File([pdfBlob], filename, {
        type: 'application/pdf',
        lastModified: Date.now()
      });

      if (isMobileDevice && typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        try {
          await navigator.share({
            files: [pdfFile],
            title: filename,
            text: messageText
          });
          setShowWhatsAppModal(false);
          showToast?.('Invoice PDF & message shared successfully!', 'success');
          return;
        } catch (err) {
          if (err.name === 'AbortError') {
            setShowWhatsAppModal(false);
            return;
          }
        }
      }

      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 1500);

      if (waWindow) {
        waWindow.location.href = whatsappUrl;
      } else {
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      }

      setShowWhatsAppModal(false);
      showToast?.('✅ WhatsApp opened! Receipt image copied & PDF downloaded.', 'success');
    } catch (error) {
      console.error('Error in WhatsApp PDF send:', error);
      if (waWindow) {
        waWindow.location.href = whatsappUrl;
      } else {
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      }
      setShowWhatsAppModal(false);
    } finally {
      setIsGeneratingPdf(false);
      isProcessingRef.current = false;
    }
  };

  // ----------------------------------------------------
  // DYNAMIC ADMIN FINANCIAL & TAX CALCULATIONS ENGINE
  // ----------------------------------------------------
  const deptGstRate = Number(calcSettings?.categoryGstRates?.[currentDeptKey] ?? calcSettings?.defaultGstRate ?? 18);
  const effectiveGstRate = includeGst ? deptGstRate : 0;
  const isIgst = calcSettings?.taxType === 'igst';
  const sacCode = calcSettings?.categorySacCodes?.[currentDeptKey] || '998714';

  const subtotal = items.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.qty) || 1), 0);
  const discountAmount = appliedDiscount;
  const netAmount = Math.max(0, subtotal - discountAmount);

  // Exclusive GST calculation: Base price is netAmount. When GST is selected, tax is added on top.
  const taxableAmount = netAmount;
  const taxAmount = includeGst ? (taxableAmount * effectiveGstRate) / 100 : 0;
  const grandTotal = taxableAmount + taxAmount;

  // CGST / SGST / IGST Splits
  const cgstAmount = isIgst ? 0 : taxAmount / 2;
  const sgstAmount = isIgst ? 0 : taxAmount / 2;
  const igstAmount = isIgst ? taxAmount : 0;
  const splitRate = (effectiveGstRate / 2).toFixed(1).replace('.0', '');

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
      includeGst,
      gstRate: effectiveGstRate,
      gstPricingMode: 'exclusive',
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
      registeredAddress: calcSettings?.registeredAddress || '1173/82, Southern Peripheral Rd, next to Sportscube, Darbaripur, Sector 75, Gurugram, Haryana 122101'
    };
    setGeneratedInvoice(inv);
    showToast?.(`✅ Invoice ${inv.id} Generated (${includeGst ? `With ${deptGstRate}% GST` : 'Without GST'})!`, 'success');
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
                GST {deptGstRate}% ({includeGst ? 'Added on Top (+18%)' : 'Optional / Non-GST'})
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

        {/* GST Billing Mode Selector Toggle */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Select Billing & Tax Mode</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIncludeGst(false)}
              className={`py-2.5 px-3 rounded-xl text-xs font-black border transition-all flex items-center justify-center gap-1.5 ${
                !includeGst
                  ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <span>Without GST (₹{netAmount.toFixed(0)})</span>
            </button>
            <button
              type="button"
              onClick={() => setIncludeGst(true)}
              className={`py-2.5 px-3 rounded-xl text-xs font-black border transition-all flex items-center justify-center gap-1.5 ${
                includeGst
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <span>With GST (+{deptGstRate}% → ₹{(netAmount * (1 + deptGstRate / 100)).toFixed(0)})</span>
            </button>
          </div>
        </div>

        {/* Dynamic Financial Breakdown Box */}
        <div className={`p-3.5 rounded-2xl border space-y-1.5 text-xs shadow-xs transition-colors ${
          includeGst ? 'bg-amber-50/70 border-amber-200/90' : 'bg-slate-50 border-slate-200'
        }`}>
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

          {includeGst ? (
            <>
              <div className="flex justify-between text-gray-700 font-medium pt-1 border-t border-amber-200/60 text-[11px]">
                <span>Net Taxable Base Value</span>
                <span>₹{taxableAmount.toFixed(2)}</span>
              </div>

              {/* Dynamic GST Slabs Display */}
              {isIgst ? (
                <div className="flex justify-between text-gray-700 font-semibold">
                  <span className="flex items-center gap-1">
                    IGST ({deptGstRate}%)
                    <span className="text-[10px] text-gray-500 font-normal">• Added on top</span>
                  </span>
                  <span>₹{igstAmount.toFixed(2)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-gray-700 font-semibold">
                    <span className="flex items-center gap-1">
                      CGST ({splitRate}%)
                      <span className="text-[10px] text-gray-500 font-normal">• Added on top</span>
                    </span>
                    <span>₹{cgstAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700 font-semibold">
                    <span className="flex items-center gap-1">
                      SGST ({splitRate}%)
                      <span className="text-[10px] text-gray-500 font-normal">• Added on top</span>
                    </span>
                    <span>₹{sgstAmount.toFixed(2)}</span>
                  </div>
                </>
              )}

              {/* Grand Total with GST */}
              <div className="flex justify-between text-gray-900 font-black text-sm pt-2 border-t-2 border-amber-300">
                <div>
                  <span>Grand Total</span>
                  <span className="block text-[10px] font-medium text-gray-500">
                    Base Price + {deptGstRate}% GST
                  </span>
                </div>
                <span className="text-amber-800 text-base">₹{grandTotal.toFixed(2)}</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between text-gray-500 font-medium text-[11px] pt-1 border-t border-gray-200">
                <span>GST Tax Status</span>
                <span className="font-bold text-gray-600">Without GST (Tax Exempt / Non-GST)</span>
              </div>

              {/* Grand Total Without GST */}
              <div className="flex justify-between text-gray-900 font-black text-sm pt-2 border-t-2 border-slate-300">
                <div>
                  <span>Grand Total</span>
                  <span className="block text-[10px] font-medium text-gray-500">
                    Net Amount (No Tax Added)
                  </span>
                </div>
                <span className="text-slate-900 text-base">₹{grandTotal.toFixed(2)}</span>
              </div>
            </>
          )}
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
            
            <div className="mt-1 inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-800 border border-gray-300">
              {generatedInvoice.includeGst ? 'TAX INVOICE' : 'COMMERCIAL RECEIPT (NON-GST)'}
            </div>

            {generatedInvoice.includeGst && (
              <div className="flex items-center justify-center gap-2 mt-1 text-[10px] font-mono text-gray-600">
                <span>GSTIN: <strong>{generatedInvoice.gstin}</strong></span>
                <span>•</span>
                <span>SAC: <strong>{generatedInvoice.sacCode}</strong></span>
              </div>
            )}
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

            {/* Dynamic Tax Split in Receipt */}
            {generatedInvoice.includeGst ? (
              <>
                <div className="flex justify-between text-gray-600">
                  <span>Net Taxable Base Value:</span>
                  <span>₹{generatedInvoice.taxableAmount.toFixed(2)}</span>
                </div>
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
                  <span>Total Tax Added:</span>
                  <span>₹{generatedInvoice.gst.toFixed(2)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-gray-500">
                <span>Tax Breakdown:</span>
                <span>Non-GST (0%)</span>
              </div>
            )}

            <div className="flex justify-between text-gray-900 text-sm font-black pt-1 border-t border-gray-200">
              <span>Total Paid ({generatedInvoice.paymentMethod}):</span>
              <span className="text-amber-700">₹{generatedInvoice.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
            {/* Send via WhatsApp Button */}
            <button
              type="button"
              onClick={() => {
                setTargetPhone(generatedInvoice.phone || currentCust?.mobile || '');
                setEditableMessageText(getDefaultMessage(generatedInvoice));
                setShowWhatsAppModal(true);
              }}
              disabled={isGeneratingPdf}
              className="py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 bg-[#1ea952] hover:bg-[#16a34a] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Preparing...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.301-.15-1.781-.879-2.056-.979-.275-.1-.475-.15-.675.15-.2.301-.775.979-.95 1.179-.175.2-.351.225-.651.075-.3-.15-1.268-.467-2.417-1.492-.894-.798-1.497-1.784-1.673-2.084-.175-.301-.019-.464.131-.613.136-.135.301-.351.451-.526.15-.175.2-.301.3-.501.1-.2.05-.376-.025-.526-.075-.15-.676-1.63-.926-2.233-.243-.587-.49-.508-.675-.518-.175-.009-.375-.01-.575-.01-.2 0-.526.075-.802.376-.275.301-1.052 1.028-1.052 2.508 0 1.48 1.078 2.909 1.228 3.109.15.2 2.122 3.24 5.141 4.544.718.31 1.278.496 1.714.635.722.23 1.378.198 1.9.12.58-.088 1.78-.727 2.03-1.43.25-.702.25-1.303.175-1.43-.075-.126-.275-.201-.575-.351zM12.04 2C6.52 2 2.035 6.485 2.035 12.005c0 1.954.564 3.784 1.542 5.337L2 22l4.82-1.53c1.49.85 3.208 1.335 5.22 1.335 5.52 0 10.005-4.485 10.005-10.005C22.045 6.485 17.56 2 12.04 2zm0 18.27c-1.72 0-3.32-.49-4.68-1.34l-.33-.2-3.13.99.99-3.05-.22-.35c-.93-1.48-1.47-3.23-1.47-5.115 0-4.56 3.71-8.27 8.27-8.27 4.56 0 8.27 3.71 8.27 8.27 0 4.56-3.71 8.27-8.27 8.27z"/>
                  </svg>
                  <span>Send via WhatsApp</span>
                </>
              )}
            </button>

            {/* Download PDF Button */}
            <button
              type="button"
              onClick={() => downloadReceiptPdf(receiptRef.current, `Invoice-${generatedInvoice.id}.pdf`)}
              className="py-2.5 px-4 rounded-xl bg-gray-900 hover:bg-black text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" /> Download PDF Receipt
            </button>
          </div>
        </div>
      )}

      {/* WhatsApp Send Confirmation & Number Verification Popover Modal */}
      {showWhatsAppModal && generatedInvoice && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-3 bg-black/65 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 overflow-hidden space-y-4 p-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#1ea952] text-white flex items-center justify-center shadow-xs">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.301-.15-1.781-.879-2.056-.979-.275-.1-.475-.15-.675.15-.2.301-.775.979-.95 1.179-.175.2-.351.225-.651.075-.3-.15-1.268-.467-2.417-1.492-.894-.798-1.497-1.784-1.673-2.084-.175-.301-.019-.464.131-.613.136-.135.301-.351.451-.526.15-.175.2-.301.3-.501.1-.2.05-.376-.025-.526-.075-.15-.676-1.63-.926-2.233-.243-.587-.49-.508-.675-.518-.175-.009-.375-.01-.575-.01-.2 0-.526.075-.802.376-.275.301-1.052 1.028-1.052 2.508 0 1.48 1.078 2.909 1.228 3.109.15.2 2.122 3.24 5.141 4.544.718.31 1.278.496 1.714.635.722.23 1.378.198 1.9.12.58-.088 1.78-.727 2.03-1.43.25-.702.25-1.303.175-1.43-.075-.126-.275-.201-.575-.351zM12.04 2C6.52 2 2.035 6.485 2.035 12.005c0 1.954.564 3.784 1.542 5.337L2 22l4.82-1.53c1.49.85 3.208 1.335 5.22 1.335 5.52 0 10.005-4.485 10.005-10.005C22.045 6.485 17.56 2 12.04 2zm0 18.27c-1.72 0-3.32-.49-4.68-1.34l-.33-.2-3.13.99.99-3.05-.22-.35c-.93-1.48-1.47-3.23-1.47-5.115 0-4.56 3.71-8.27 8.27-8.27 4.56 0 8.27 3.71 8.27 8.27 0 4.56-3.71 8.27-8.27 8.27z"/>
                  </svg>
                </div>
                <div>
                  <h4 className="text-xs font-black text-gray-900 leading-tight">Send via WhatsApp</h4>
                  <p className="text-[10px] text-gray-500">Official Receipt Image & PDF</p>
                </div>
              </div>
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Visual Direct Image tip box */}
              <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3 space-y-2 text-amber-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-[11px]">
                    <span>💡</span>
                    <span>Send Direct Receipt Image:</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyReceiptImage}
                    disabled={isCopyingImage}
                    className="px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-[10px] font-bold text-amber-900 hover:bg-amber-100/50 shadow-2xs flex items-center gap-1 transition-colors active:scale-95"
                  >
                    {isCopyingImage ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : copiedSuccess ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3 text-amber-800" />
                    )}
                    <span>{copiedSuccess ? 'Image Copied!' : 'Copy Image Now'}</span>
                  </button>
                </div>
                <p className="text-[10px] leading-relaxed text-amber-800">
                  Clicking <strong>Send via WhatsApp</strong> automatically copies the receipt image to your clipboard. When WhatsApp opens, press <kbd className="px-1.5 py-0.5 bg-white border border-amber-300 rounded font-mono text-[9px] font-bold text-amber-900 shadow-2xs">Cmd + V</kbd> (Mac) or <kbd className="px-1.5 py-0.5 bg-white border border-amber-300 rounded font-mono text-[9px] font-bold text-amber-900 shadow-2xs">Ctrl + V</kbd> (Windows) to send the visual receipt directly into the chat!
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  disabled
                  value={generatedInvoice.customerName || 'Valued Customer'}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1">
                  WhatsApp Mobile Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. 9820012345 or +91 98200 12345"
                    value={targetPhone}
                    onChange={(e) => {
                      setTargetPhone(e.target.value);
                      setPhoneError('');
                    }}
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                {phoneError ? (
                  <p className="text-[10px] text-rose-600 font-bold mt-1">{phoneError}</p>
                ) : (
                  <p className="text-[10px] text-gray-400 mt-1">10-digit number will automatically format with country code (+91)</p>
                )}
              </div>

              {/* Info preview & WhatsApp Message Preview */}
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-2.5 space-y-2">
                <div className="flex justify-between text-[11px] font-bold text-gray-600">
                  <span>Receipt No:</span>
                  <span className="text-gray-900 font-mono">#{generatedInvoice.id}</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold text-gray-600">
                  <span>Vehicle:</span>
                  <span className="text-gray-900">{generatedInvoice.vehicleNo || 'Registered Vehicle'}</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold text-gray-600">
                  <span>Total Paid:</span>
                  <span className="text-emerald-700 font-black">₹{Number(generatedInvoice.total || 0).toLocaleString('en-IN')}</span>
                </div>

                {/* Editable WhatsApp Message */}
                <div className="pt-2 border-t border-emerald-200/60">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-bold text-emerald-900 uppercase tracking-wide flex items-center gap-1">
                      <span>WhatsApp Message</span>
                      <span className="text-[9px] text-emerald-600 font-normal lowercase">(editable)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setEditableMessageText(getDefaultMessage(generatedInvoice))}
                      className="text-[10px] text-emerald-700 hover:text-emerald-950 font-bold hover:underline transition-colors"
                      title="Reset to default message template"
                    >
                      Reset Template
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={editableMessageText}
                    onChange={(e) => setEditableMessageText(e.target.value)}
                    placeholder="Type your WhatsApp message..."
                    className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl text-[11px] text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none font-sans leading-relaxed shadow-2xs resize-y"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowWhatsAppModal(false)}
                disabled={isGeneratingPdf}
                className="flex-1 py-2.5 text-xs font-bold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSendWhatsApp(targetPhone)}
                disabled={isGeneratingPdf}
                className="flex-1 py-2.5 text-xs font-black text-white bg-[#1ea952] hover:bg-[#16a34a] rounded-full shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-60"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Preparing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5 fill-current text-white" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.301-.15-1.781-.879-2.056-.979-.275-.1-.475-.15-.675.15-.2.301-.775.979-.95 1.179-.175.2-.351.225-.651.075-.3-.15-1.268-.467-2.417-1.492-.894-.798-1.497-1.784-1.673-2.084-.175-.301-.019-.464.131-.613.136-.135.301-.351.451-.526.15-.175.2-.301.3-.501.1-.2.05-.376-.025-.526-.075-.15-.676-1.63-.926-2.233-.243-.587-.49-.508-.675-.518-.175-.009-.375-.01-.575-.01-.2 0-.526.075-.802.376-.275.301-1.052 1.028-1.052 2.508 0 1.48 1.078 2.909 1.228 3.109.15.2 2.122 3.24 5.141 4.544.718.31 1.278.496 1.714.635.722.23 1.378.198 1.9.12.58-.088 1.78-.727 2.03-1.43.25-.702.25-1.303.175-1.43-.075-.126-.275-.201-.575-.351zM12.04 2C6.52 2 2.035 6.485 2.035 12.005c0 1.954.564 3.784 1.542 5.337L2 22l4.82-1.53c1.49.85 3.208 1.335 5.22 1.335 5.52 0 10.005-4.485 10.005-10.005C22.045 6.485 17.56 2 12.04 2zm0 18.27c-1.72 0-3.32-.49-4.68-1.34l-.33-.2-3.13.99.99-3.05-.22-.35c-.93-1.48-1.47-3.23-1.47-5.115 0-4.56 3.71-8.27 8.27-8.27 4.56 0 8.27 3.71 8.27 8.27 0 4.56-3.71 8.27-8.27 8.27z"/>
                    </svg>
                    <span>Send via WhatsApp</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


