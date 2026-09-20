import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Plus,
  ShoppingBag,
  Car,
  CreditCard,
  Users,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  Calendar,
  X,
  Trash2,
  ArrowDown,
  ArrowUp,
  Banknote,
  QrCode,
  Globe,
  TrendingUp,
  Filter,
  Wallet
} from 'lucide-react';
import { useAdmin } from '../common/context/AdminContext';
import OfflineSaleModal from '../common/components/OfflineSaleModal';
import RegisteredVehicleDetailModal from '../common/components/RegisteredVehicleDetailModal';
import OfflineSaleInvoiceModal from '../common/components/OfflineSaleInvoiceModal';

export default function ManageOfflineSalesPage() {
  const { bookings, addOfflineSale, deleteOfflineSale, showToast, services } = useAdmin();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedInvoiceSale, setSelectedInvoiceSale] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [datePreset, setDatePreset] = useState('all');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState('all'); // 'all' | 'Cash' | 'UPI' | 'Card' | 'Net Banking'
  const [selectedSaleType, setSelectedSaleType] = useState('all'); // 'all' | 'service' | 'membership'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' = calendar sequence (earliest first, e.g. Aug 20 then Sep 2), 'desc' = latest first
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;
  const isSubmittingSaleRef = useRef(false);

  // Interactive Calendar Popover State
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarMode, setCalendarMode] = useState('single'); // 'single' | 'range'
  const [calendarViewDate, setCalendarViewDate] = useState(() => new Date());
  const calendarRef = useRef(null);

  // Close calendar popover on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setIsCalendarOpen(false);
      }
    };
    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCalendarOpen]);

  // Helper to extract timestamp from the displayed calendar date for chronological sequence sorting
  const getSaleTime = (sale) => {
    if (!sale) return 0;
    // 1. Prioritize displayed date string (e.g., "August 20, 2026" or "September 2, 2026")
    if (sale.date) {
      const d = new Date(sale.date);
      if (!isNaN(d.getTime())) return d.getTime();

      // Fallback for DD/MM/YYYY or DD-MM-YYYY format
      const parts = String(sale.date).trim().split(/[-/]/);
      if (parts.length === 3 && parts[2]?.length === 4) {
        const parsed = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00`);
        if (!isNaN(parsed.getTime())) return parsed.getTime();
      }
    }
    // 2. Check saleDate (YYYY-MM-DD)
    if (sale.saleDate) {
      const d = new Date(sale.saleDate.includes('T') ? sale.saleDate : `${sale.saleDate}T12:00:00`);
      if (!isNaN(d.getTime())) return d.getTime();
    }
    // 3. Fallback to createdAt timestamp
    if (sale.createdAt) {
      const t = new Date(sale.createdAt).getTime();
      if (!isNaN(t) && t > 0) return t;
    }
    return 0;
  };

  // Default seed matching the user's recorded sale
  const defaultOfflineSale = {
    id: 'OFS-MTJX5GRW-3986',
    bookingId: 'OFS-MTJX5GRW-3986',
    customerName: 'Prathmesh Jawade',
    customerEmail: 'prathmesh@gmail.com',
    phone: '98098090',
    vehicleNo: 'MP09GG8790',
    vehicleModel: 'HYUNDAI i20',
    packageName: 'Single Wash',
    saleType: 'service',
    price: 499,
    total: 499,
    paymentMode: 'Cash',
    date: 'September 2, 2026',
    isOfflineSale: true
  };

  // Filter offline sales from bookings and localStorage seamlessly
  const offlineSales = useMemo(() => {
    const fromBookings = bookings.filter(b =>
      b.isOfflineSale ||
      (b.bookingId && String(b.bookingId).startsWith('OFS-')) ||
      (b.id && String(b.id).startsWith('OFS-'))
    );
    let fromStorage = [];
    try {
      fromStorage = JSON.parse(localStorage.getItem('tsl_offline_sales') || '[]');
    } catch (e) {}

    const map = new Map();
    fromBookings.forEach(s => map.set(s.id || s.bookingId, s));
    fromStorage.forEach(s => {
      const key = s.id || s.bookingId;
      if (!map.has(key)) map.set(key, s);
    });

    if (map.size === 0) {
      map.set(defaultOfflineSale.id, defaultOfflineSale);
    }

    const list = Array.from(map.values());
    return list.sort((a, b) => {
      const timeA = getSaleTime(a);
      const timeB = getSaleTime(b);
      if (timeA !== timeB) return timeA - timeB;
      return String(a.id || a.bookingId || '').localeCompare(String(b.id || b.bookingId || ''));
    });
  }, [bookings]);

  // KPI Stats
  const totalVolume = offlineSales.reduce((sum, s) => sum + (Number(s.price) || Number(s.total) || Number(s.amount) || 0), 0);
  const totalTransactions = offlineSales.length;
  const offlineMemberships = offlineSales.filter(s => s.saleType === 'membership').length;
  const uniquePlates = new Set(offlineSales.map(s => (s.vehicleNo || '').toUpperCase().trim()).filter(Boolean)).size;

  // Local date formatter to YYYY-MM-DD (local time, avoiding UTC offset shifts)
  const formatYMD = (d) => {
    if (!d || isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Preset handlers for date range
  const handlePresetChange = (preset) => {
    setDatePreset(preset);
    setCurrentPage(1);
    const today = new Date();
    const todayStr = formatYMD(today);

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'yesterday') {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const yStr = formatYMD(y);
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (preset === 'week') {
      const w = new Date(today);
      w.setDate(w.getDate() - 7);
      setStartDate(formatYMD(w));
      setEndDate(todayStr);
    } else if (preset === 'month') {
      const m = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(formatYMD(m));
      setEndDate(todayStr);
    }
  };

  // Helper to extract date from sale record
  const getSaleDateObj = (sale) => {
    if (!sale) return null;
    if (sale.date) {
      const d = new Date(sale.date);
      if (!isNaN(d.getTime())) return d;
    }
    if (sale.saleDate) {
      const d = new Date(sale.saleDate.includes('T') ? sale.saleDate : `${sale.saleDate}T00:00:00`);
      if (!isNaN(d.getTime())) return d;
    }
    if (sale.createdAt) {
      const d = new Date(sale.createdAt);
      if (!isNaN(d.getTime())) return d;
    }
    return null;
  };

  // Today's Date helpers
  const today = new Date();
  const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  // Set of dates with recorded sales to show indicator dots on calendar days
  const salesDatesSet = useMemo(() => {
    const set = new Set();
    offlineSales.forEach(s => {
      const d = getSaleDateObj(s);
      if (d) {
        set.add(formatYMD(d));
      }
    });
    return set;
  }, [offlineSales]);

  // Calendar days generation for active calendarViewDate
  const calendarDays = useMemo(() => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells = [];

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, d);
      cells.push({
        dayNumber: d,
        date: prevDate,
        dateStr: formatYMD(prevDate),
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const curDate = new Date(year, month, d);
      cells.push({
        dayNumber: d,
        date: curDate,
        dateStr: formatYMD(curDate),
        isCurrentMonth: true
      });
    }

    // Next month padding
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      cells.push({
        dayNumber: d,
        date: nextDate,
        dateStr: formatYMD(nextDate),
        isCurrentMonth: false
      });
    }

    return cells;
  }, [calendarViewDate]);

  const handleCalendarDayClick = (cellDateStr) => {
    setCurrentPage(1);
    if (calendarMode === 'single') {
      setStartDate(cellDateStr);
      setEndDate(cellDateStr);
      setDatePreset('custom');
    } else {
      if (!startDate || (startDate && endDate)) {
        setStartDate(cellDateStr);
        setEndDate('');
        setDatePreset('custom');
      } else if (startDate && !endDate) {
        if (cellDateStr < startDate) {
          setStartDate(cellDateStr);
        } else {
          setEndDate(cellDateStr);
          setDatePreset('custom');
        }
      }
    }
  };

  const handlePrevMonth = () => {
    setCalendarViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCalendarViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // 1. Today's Sales Calculation
  const todaySales = useMemo(() => {
    return offlineSales.filter(s => {
      const d = getSaleDateObj(s);
      return isSameDay(d, today);
    });
  }, [offlineSales]);

  const todayTotalAmount = useMemo(() => {
    return todaySales.reduce((sum, s) => sum + (Number(s.price) || Number(s.total) || 0), 0);
  }, [todaySales]);
  const todayCount = todaySales.length;

  // 2. Sales in the currently selected date/scope (used to calculate payment method breakdown)
  const salesForDateScope = useMemo(() => {
    return offlineSales.filter(s => {
      if (startDate || endDate) {
        const saleDate = getSaleDateObj(s);
        if (!saleDate) return false;
        if (startDate) {
          const start = new Date(startDate + 'T00:00:00');
          if (saleDate < start) return false;
        }
        if (endDate) {
          const end = new Date(endDate + 'T23:59:59');
          if (saleDate > end) return false;
        }
      }
      if (selectedSaleType !== 'all') {
        if (s.saleType !== selectedSaleType) return false;
      }
      return true;
    });
  }, [offlineSales, startDate, endDate, selectedSaleType]);

  // Payment method totals for the active date range
  const paymentTotals = useMemo(() => {
    let cash = { amount: 0, count: 0 };
    let upi = { amount: 0, count: 0 };
    let card = { amount: 0, count: 0 };
    let netBanking = { amount: 0, count: 0 };

    salesForDateScope.forEach(s => {
      const amt = Number(s.price) || Number(s.total) || 0;
      const m = (s.paymentMode || '').toLowerCase();
      if (m.includes('cash')) {
        cash.amount += amt;
        cash.count += 1;
      } else if (m.includes('upi')) {
        upi.amount += amt;
        upi.count += 1;
      } else if (m.includes('card')) {
        card.amount += amt;
        card.count += 1;
      } else {
        netBanking.amount += amt;
        netBanking.count += 1;
      }
    });

    const sum = cash.amount + upi.amount + card.amount + netBanking.amount;
    return {
      cash,
      upi,
      card,
      netBanking,
      total: sum,
      count: salesForDateScope.length
    };
  }, [salesForDateScope]);

  // Search, Filter & Sequence Sort for the table
  const filteredSales = useMemo(() => {
    const list = offlineSales.filter(s => {
      // 1. Text Search Filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesText = (
          (s.customerName || '').toLowerCase().includes(term) ||
          (s.vehicleNo || '').toLowerCase().includes(term) ||
          (s.customerEmail || '').toLowerCase().includes(term) ||
          (s.phone || '').toLowerCase().includes(term) ||
          (s.packageName || '').toLowerCase().includes(term) ||
          (s.membershipName || '').toLowerCase().includes(term) ||
          (s.id || '').toLowerCase().includes(term)
        );
        if (!matchesText) return false;
      }

      // 2. Date Range Filter
      if (startDate || endDate) {
        const saleDate = getSaleDateObj(s);
        if (!saleDate) return false;

        if (startDate) {
          const start = new Date(startDate + 'T00:00:00');
          if (saleDate < start) return false;
        }
        if (endDate) {
          const end = new Date(endDate + 'T23:59:59');
          if (saleDate > end) return false;
        }
      }

      // 3. Payment Method Filter
      if (selectedPaymentMode !== 'all') {
        const pMode = (s.paymentMode || '').toLowerCase();
        const target = selectedPaymentMode.toLowerCase();
        if (!pMode.includes(target)) return false;
      }

      // 4. Sale Type Filter (Service vs Membership)
      if (selectedSaleType !== 'all') {
        if (s.saleType !== selectedSaleType) return false;
      }

      return true;
    });

    // Sequence sorting by calendar date (earliest date first: 'asc')
    return [...list].sort((a, b) => {
      const timeA = getSaleTime(a);
      const timeB = getSaleTime(b);
      if (timeA !== timeB) {
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      }
      return sortOrder === 'asc'
        ? String(a.id || a.bookingId || '').localeCompare(String(b.id || b.bookingId || ''))
        : String(b.id || b.bookingId || '').localeCompare(String(a.id || a.bookingId || ''));
    });
  }, [offlineSales, searchTerm, startDate, endDate, selectedPaymentMode, selectedSaleType, sortOrder]);

  const filteredTotalAmount = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + (Number(s.price) || Number(s.total) || 0), 0);
  }, [filteredSales]);

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setDatePreset('all');
    setSelectedPaymentMode('all');
    setSelectedSaleType('all');
    setCurrentPage(1);
  };

  const getFilterPeriodLabel = () => {
    if (datePreset === 'today') {
      return `Today (${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})`;
    }
    if (datePreset === 'yesterday') return 'Yesterday';
    if (datePreset === 'week') return 'Last 7 Days';
    if (datePreset === 'month') return 'This Month';
    if (startDate && endDate) {
      if (startDate === endDate) {
        const d = new Date(startDate + 'T12:00:00');
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
      const s = new Date(startDate + 'T12:00:00');
      const e = new Date(endDate + 'T12:00:00');
      return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    if (startDate) return `From ${startDate}`;
    if (endDate) return `Until ${endDate}`;
    return 'All Time';
  };

  const isFilterActive = Boolean(startDate || endDate || datePreset !== 'all' || selectedPaymentMode !== 'all' || selectedSaleType !== 'all');

  const totalPages = Math.ceil(filteredSales.length / pageSize) || 1;
  const paginatedSales = filteredSales.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Build vehicle detail for modal
  const openVehicleDetail = (sale) => {
    const plate = (sale.vehicleNo || '').toUpperCase().trim();
    const vehicleBookings = bookings.filter(b => (b.vehicleNo || '').toUpperCase().trim() === plate);
    setSelectedVehicle({
      vehicle: {
        plate,
        model: sale.vehicleModel || sale.vehicleType || '',
        ownerName: sale.customerName || '',
        ownerEmail: sale.customerEmail || '',
        ownerPhone: sale.phone || '',
        packageName: sale.packageName || '',
        membershipName: sale.membershipName || '',
        membershipValidity: sale.membershipValidity || '',
        membershipExpiry: sale.membershipExpiry || '',
        membershipStatus: sale.membershipExpiry ? (new Date(sale.membershipExpiry) > new Date() ? 'Active' : 'Expired') : '',
        offlineSalePrice: sale.price || sale.total || '',
        paymentMode: sale.paymentMode || '',
        offlineSaleDate: sale.date || '',
        notes: sale.notes || '',
        totalWashes: vehicleBookings.length
      },
      history: vehicleBookings
    });
  };

  const handleOfflineSaleSubmit = async (formData) => {
    // Explicitly dismiss create modal immediately
    setIsCreateModalOpen(false);

    // Guard against rapid duplicate clicks
    if (isSubmittingSaleRef.current) return;
    isSubmittingSaleRef.current = true;

    try {
      let created = null;
      if (addOfflineSale) {
        created = await addOfflineSale(formData);
      } else {
        showToast?.('Offline sale saved locally');
      }
      // Automatically pop open the invoice modal for instant download
      if (created) {
        setSelectedInvoiceSale(created);
      }
    } finally {
      setTimeout(() => {
        isSubmittingSaleRef.current = false;
      }, 800);
    }
  };

  const handleDeleteSale = async (sale) => {
    const saleId = sale.id || sale.bookingId;
    const name = sale.customerName || 'customer';
    if (!window.confirm(`Are you sure you want to delete offline sale ${saleId} (${name})?`)) {
      return;
    }
    if (deleteOfflineSale) {
      await deleteOfflineSale(saleId);
    }
  };

  const kpiCards = [
    {
      label: "Today's Sales",
      value: `₹${todayTotalAmount.toLocaleString('en-IN')}`,
      subtitle: `${todayCount} order${todayCount !== 1 ? 's' : ''} today`,
      badge: 'Live Today',
      icon: TrendingUp,
      color: '#e07b2a'
    },
    {
      label: isFilterActive ? 'Filtered Period Sales' : 'Total Offline Volume',
      value: `₹${filteredTotalAmount.toLocaleString('en-IN')}`,
      subtitle: `${filteredSales.length} transaction${filteredSales.length !== 1 ? 's' : ''}`,
      icon: ShoppingBag,
      color: '#1e4a7e'
    },
    {
      label: 'All-Time Volume',
      value: `₹${totalVolume.toLocaleString('en-IN')}`,
      subtitle: `${totalTransactions} total walk-ins`,
      icon: Users,
      color: '#059669'
    },
    {
      label: 'Fleet Cars Registered',
      value: uniquePlates,
      subtitle: `${offlineMemberships} memberships`,
      icon: Car,
      color: '#7c3aed'
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 flex-shrink-0" />
            Offline Sales / Manual POS
          </h2>
          <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">
            Record walk-in counter sales, offline membership purchases & manual vehicle registrations
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex-1 sm:flex-initial px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs font-bold text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            style={{ backgroundColor: '#e07b2a' }}
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">New Offline Sale</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (Including Today's Sales & Filtered Sales) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {kpiCards.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm flex items-center gap-2.5 sm:gap-3 hover:border-amber-300 transition-all">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ backgroundColor: kpi.color }}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase font-bold truncate">{kpi.label}</p>
                  {kpi.badge && (
                    <span className="text-[8px] sm:text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {kpi.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm sm:text-lg font-black text-gray-900 truncate">{kpi.value}</p>
                {kpi.subtitle && (
                  <p className="text-[10px] text-gray-400 font-medium truncate">{kpi.subtitle}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Amount Received by Payment Method Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs sm:text-sm font-bold text-gray-900">
              Amount Received by Payment Method {startDate || endDate || datePreset !== 'all' ? `(${getFilterPeriodLabel()})` : ''}
            </h3>
          </div>
          {selectedPaymentMode !== 'all' && (
            <button
              onClick={() => { setSelectedPaymentMode('all'); setCurrentPage(1); }}
              className="text-[11px] font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span>Show All Methods</span>
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {/* Cash Card */}
          <div
            onClick={() => { setSelectedPaymentMode(prev => prev === 'Cash' ? 'all' : 'Cash'); setCurrentPage(1); }}
            className={`bg-white border rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm flex items-center gap-2.5 sm:gap-3 transition-all cursor-pointer select-none ${
              selectedPaymentMode === 'Cash'
                ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/30'
                : 'border-gray-200 hover:border-emerald-300'
            }`}
            title="Click to filter Cash transactions"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 bg-emerald-600 shadow-2xs">
              <Banknote className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase font-bold truncate">Cash Received</p>
                {paymentTotals.total > 0 && (
                  <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                    {Math.round((paymentTotals.cash.amount / (paymentTotals.total || 1)) * 100)}%
                  </span>
                )}
              </div>
              <p className="text-sm sm:text-lg font-black text-gray-900 truncate">
                ₹{paymentTotals.cash.amount.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-gray-500 font-medium truncate">
                {paymentTotals.cash.count} transaction{paymentTotals.cash.count !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* UPI / QR Card */}
          <div
            onClick={() => { setSelectedPaymentMode(prev => prev === 'UPI' ? 'all' : 'UPI'); setCurrentPage(1); }}
            className={`bg-white border rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm flex items-center gap-2.5 sm:gap-3 transition-all cursor-pointer select-none ${
              selectedPaymentMode === 'UPI'
                ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/30'
                : 'border-gray-200 hover:border-indigo-300'
            }`}
            title="Click to filter UPI transactions"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 bg-indigo-600 shadow-2xs">
              <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase font-bold truncate">UPI / QR Received</p>
                {paymentTotals.total > 0 && (
                  <span className="text-[9px] font-extrabold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                    {Math.round((paymentTotals.upi.amount / (paymentTotals.total || 1)) * 100)}%
                  </span>
                )}
              </div>
              <p className="text-sm sm:text-lg font-black text-gray-900 truncate">
                ₹{paymentTotals.upi.amount.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-gray-500 font-medium truncate">
                {paymentTotals.upi.count} transaction{paymentTotals.upi.count !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Card Received */}
          <div
            onClick={() => { setSelectedPaymentMode(prev => prev === 'Card' ? 'all' : 'Card'); setCurrentPage(1); }}
            className={`bg-white border rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm flex items-center gap-2.5 sm:gap-3 transition-all cursor-pointer select-none ${
              selectedPaymentMode === 'Card'
                ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/30'
                : 'border-gray-200 hover:border-blue-300'
            }`}
            title="Click to filter Card transactions"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 bg-blue-600 shadow-2xs">
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase font-bold truncate">Card Received</p>
                {paymentTotals.total > 0 && (
                  <span className="text-[9px] font-extrabold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                    {Math.round((paymentTotals.card.amount / (paymentTotals.total || 1)) * 100)}%
                  </span>
                )}
              </div>
              <p className="text-sm sm:text-lg font-black text-gray-900 truncate">
                ₹{paymentTotals.card.amount.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-gray-500 font-medium truncate">
                {paymentTotals.card.count} transaction{paymentTotals.card.count !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Net Banking / Other */}
          <div
            onClick={() => { setSelectedPaymentMode(prev => prev === 'Net Banking' ? 'all' : 'Net Banking'); setCurrentPage(1); }}
            className={`bg-white border rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm flex items-center gap-2.5 sm:gap-3 transition-all cursor-pointer select-none ${
              selectedPaymentMode === 'Net Banking'
                ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/30'
                : 'border-gray-200 hover:border-amber-300'
            }`}
            title="Click to filter Net Banking transactions"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 bg-amber-500 shadow-2xs">
              <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase font-bold truncate">Net Banking / Other</p>
                {paymentTotals.total > 0 && (
                  <span className="text-[9px] font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                    {Math.round((paymentTotals.netBanking.amount / (paymentTotals.total || 1)) * 100)}%
                  </span>
                )}
              </div>
              <p className="text-sm sm:text-lg font-black text-gray-900 truncate">
                ₹{paymentTotals.netBanking.amount.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-gray-500 font-medium truncate">
                {paymentTotals.netBanking.count} transaction{paymentTotals.netBanking.count !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Date & Range Sales Summary Banner */}
      {isFilterActive && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-black text-gray-900">
                  Sales for: {getFilterPeriodLabel()}
                </span>
                {selectedPaymentMode !== 'all' && (
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                    Mode: {selectedPaymentMode}
                  </span>
                )}
                {selectedSaleType !== 'all' && (
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                    Type: {selectedSaleType === 'membership' ? 'Memberships' : 'Services'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-600 mt-0.5">
                Total Amount Received: <span className="font-extrabold text-amber-700 text-xs sm:text-sm">₹{filteredTotalAmount.toLocaleString('en-IN')}</span> across <span className="font-bold text-gray-800">{filteredSales.length} transaction{filteredSales.length !== 1 ? 's' : ''}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-600 bg-white border border-gray-200 px-3 py-1.5 rounded-xl shadow-2xs">
              <span>💵 Cash: <b className="text-gray-900 font-extrabold">₹{paymentTotals.cash.amount.toLocaleString('en-IN')}</b></span>
              <span>•</span>
              <span>📱 UPI: <b className="text-gray-900 font-extrabold">₹{paymentTotals.upi.amount.toLocaleString('en-IN')}</b></span>
              <span>•</span>
              <span>💳 Card: <b className="text-gray-900 font-extrabold">₹{paymentTotals.card.amount.toLocaleString('en-IN')}</b></span>
            </div>
            <button
              onClick={handleClearAllFilters}
              className="px-2.5 py-1.5 rounded-xl bg-white border border-gray-200 hover:bg-rose-50 hover:border-rose-200 text-gray-600 hover:text-rose-600 text-xs font-bold transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
              title="Reset all filters to show all sales"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      )}

      {/* Sales Table Container */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Table Header Bar with Search & Enhanced Filters */}
        <div className="p-3 sm:p-4 border-b border-gray-100 flex flex-col gap-3 bg-gray-50/40">
          {/* Top Filter Row: Search & Presets */}
          <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full xl:max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder="Search by customer, plate, email, phone, sale ID..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white shadow-2xs"
              />
            </div>

            {/* Quick Date Presets & Interactive Calendar */}
            <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 shadow-2xs text-[11px] font-bold self-start xl:self-auto relative">
              {[
                { id: 'all', label: 'All Time' },
                { id: 'today', label: 'Today' },
                { id: 'yesterday', label: 'Yesterday' },
                { id: 'week', label: '7 Days' },
                { id: 'month', label: 'This Month' }
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    handlePresetChange(p.id);
                    setIsCalendarOpen(false);
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                    datePreset === p.id && !startDate && !endDate && p.id === 'all'
                      ? 'bg-amber-500 text-white shadow-2xs'
                      : (datePreset === p.id && datePreset !== 'custom')
                      ? 'bg-amber-500 text-white shadow-2xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}

              {/* Subtle Divider */}
              <div className="h-4 w-px bg-gray-200 mx-1 flex-shrink-0" />

              {/* Calendar Button (with custom date label and interactive popover) */}
              <div className="relative" ref={calendarRef}>
                <button
                  type="button"
                  onClick={() => {
                    if (!isCalendarOpen && startDate) {
                      setCalendarViewDate(new Date(startDate + 'T12:00:00'));
                    }
                    setIsCalendarOpen(prev => !prev);
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    (datePreset === 'custom' || (startDate && datePreset !== 'today' && datePreset !== 'yesterday' && datePreset !== 'week' && datePreset !== 'month'))
                      ? 'bg-amber-500 text-white shadow-2xs font-extrabold'
                      : isCalendarOpen
                      ? 'bg-amber-100 text-amber-900 font-extrabold'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  title="Click to open calendar and select date or range"
                >
                  <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>
                    {startDate && endDate && startDate === endDate
                      ? new Date(startDate + 'T12:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
                      : startDate && endDate
                      ? `${new Date(startDate + 'T12:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} – ${new Date(endDate + 'T12:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`
                      : startDate
                      ? `From ${new Date(startDate + 'T12:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`
                      : endDate
                      ? `Until ${new Date(endDate + 'T12:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`
                      : 'Calendar'}
                  </span>
                  {(startDate || endDate) && datePreset === 'custom' && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setStartDate('');
                        setEndDate('');
                        setDatePreset('all');
                        setCurrentPage(1);
                      }}
                      className="ml-0.5 hover:bg-black/20 p-0.5 rounded transition-colors"
                      title="Clear date filter"
                    >
                      <X className="w-3 h-3" />
                    </span>
                  )}
                </button>

                {/* Calendar Popover */}
                {isCalendarOpen && (
                  <div
                    className="absolute right-0 sm:right-0 top-full mt-2 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl p-3.5 w-[310px] sm:w-[330px]"
                    style={{ minWidth: '310px' }}
                  >
                    {/* Header with Mode Toggle */}
                    <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-gray-100">
                      <span className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-500" />
                        <span>Select Date</span>
                      </span>
                      <div className="flex items-center bg-gray-100 p-0.5 rounded-lg text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => setCalendarMode('single')}
                          className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                            calendarMode === 'single'
                              ? 'bg-white text-gray-900 shadow-2xs font-extrabold'
                              : 'text-gray-500 hover:text-gray-800'
                          }`}
                        >
                          Single Day
                        </button>
                        <button
                          type="button"
                          onClick={() => setCalendarMode('range')}
                          className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                            calendarMode === 'range'
                              ? 'bg-white text-gray-900 shadow-2xs font-extrabold'
                              : 'text-gray-500 hover:text-gray-800'
                          }`}
                        >
                          Range
                        </button>
                      </div>
                    </div>

                    {/* Month Navigator */}
                    <div className="flex items-center justify-between mb-2">
                      <button
                        type="button"
                        onClick={handlePrevMonth}
                        className="p-1 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
                        title="Previous Month"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-black text-gray-900">
                        {calendarViewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </span>
                      <button
                        type="button"
                        onClick={handleNextMonth}
                        className="p-1 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
                        title="Next Month"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 gap-1 mb-1 text-center text-[10px] font-bold text-gray-400">
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                        <div key={d} className="py-0.5">{d}</div>
                      ))}
                    </div>

                    {/* Calendar Month Grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map((cell, idx) => {
                        const isSingleSelected = (startDate === cell.dateStr && endDate === cell.dateStr) ||
                                                 (startDate === cell.dateStr && !endDate);
                        const isRangeStart = startDate === cell.dateStr && endDate && startDate !== endDate;
                        const isRangeEnd = endDate === cell.dateStr && startDate && startDate !== endDate;
                        const isInRange = startDate && endDate && cell.dateStr > startDate && cell.dateStr < endDate;
                        const isTodayDate = cell.dateStr === formatYMD(today);
                        const hasSales = salesDatesSet.has(cell.dateStr);

                        let cellClass = "text-gray-700 hover:bg-amber-100 hover:text-amber-900";
                        if (!cell.isCurrentMonth) {
                          cellClass = "text-gray-300 hover:bg-gray-50";
                        }
                        if (isSingleSelected || isRangeStart || isRangeEnd) {
                          cellClass = "bg-amber-500 text-white font-black shadow-2xs hover:bg-amber-600";
                        } else if (isInRange) {
                          cellClass = "bg-amber-100 text-amber-900 font-bold hover:bg-amber-200";
                        } else if (isTodayDate) {
                          cellClass = "border border-amber-400 font-bold text-amber-700 hover:bg-amber-50";
                        }

                        return (
                          <button
                            key={cell.dateStr + idx}
                            type="button"
                            onClick={() => handleCalendarDayClick(cell.dateStr)}
                            className={`h-7 w-full rounded-lg text-[11px] flex flex-col items-center justify-center transition-all cursor-pointer relative ${cellClass}`}
                            title={`${cell.dateStr}${hasSales ? ' (Has recorded sales)' : ''}`}
                          >
                            <span className="leading-none">{cell.dayNumber}</span>
                            {hasSales && !isSingleSelected && !isRangeStart && !isRangeEnd && (
                              <span className="w-1 h-1 rounded-full bg-amber-600 absolute bottom-0.5" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Native Date Input Picker */}
                    <div className="mt-2.5 pt-2 border-t border-gray-100">
                      {calendarMode === 'single' ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-gray-500 whitespace-nowrap">Selected:</span>
                          <input
                            type="date"
                            value={startDate || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setStartDate(val);
                              setEndDate(val);
                              setDatePreset('custom');
                              setCurrentPage(1);
                              if (val) setCalendarViewDate(new Date(val + 'T12:00:00'));
                            }}
                            className="text-[11px] font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-500 flex-1 cursor-pointer"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="date"
                            value={startDate || ''}
                            onChange={(e) => {
                              setStartDate(e.target.value);
                              setDatePreset('custom');
                              setCurrentPage(1);
                              if (e.target.value) setCalendarViewDate(new Date(e.target.value + 'T12:00:00'));
                            }}
                            className="text-[11px] font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-500 w-1/2 cursor-pointer"
                            title="From Date"
                          />
                          <span className="text-gray-300 font-bold text-xs">–</span>
                          <input
                            type="date"
                            value={endDate || ''}
                            onChange={(e) => {
                              setEndDate(e.target.value);
                              setDatePreset('custom');
                              setCurrentPage(1);
                            }}
                            className="text-[11px] font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-500 w-1/2 cursor-pointer"
                            title="To Date"
                          />
                        </div>
                      )}
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="grid grid-cols-4 gap-1 mt-2 pt-2 border-t border-gray-100 text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => {
                          const todayYMD = formatYMD(today);
                          setStartDate(todayYMD);
                          setEndDate(todayYMD);
                          setDatePreset('today');
                          setCalendarViewDate(new Date(today));
                          setCurrentPage(1);
                        }}
                        className="py-1 text-center rounded-md bg-gray-50 hover:bg-amber-50 hover:text-amber-700 text-gray-600 transition-colors cursor-pointer"
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const y = new Date(today);
                          y.setDate(y.getDate() - 1);
                          const yYMD = formatYMD(y);
                          setStartDate(yYMD);
                          setEndDate(yYMD);
                          setDatePreset('yesterday');
                          setCalendarViewDate(new Date(y));
                          setCurrentPage(1);
                        }}
                        className="py-1 text-center rounded-md bg-gray-50 hover:bg-amber-50 hover:text-amber-700 text-gray-600 transition-colors cursor-pointer"
                      >
                        Yesterday
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handlePresetChange('week');
                          setCalendarViewDate(new Date(today));
                        }}
                        className="py-1 text-center rounded-md bg-gray-50 hover:bg-amber-50 hover:text-amber-700 text-gray-600 transition-colors cursor-pointer"
                      >
                        7 Days
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleClearAllFilters();
                          setIsCalendarOpen(false);
                        }}
                        className="py-1 text-center rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>

                    {/* Selected Summary Footer */}
                    <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                      <div className="text-[10px] text-gray-600 leading-tight">
                        {startDate ? (
                          <div>
                            <span className="font-extrabold text-gray-900">{getFilterPeriodLabel()}</span>
                            <div className="text-amber-700 font-black text-[11px]">
                              ₹{filteredTotalAmount.toLocaleString('en-IN')} ({filteredSales.length} sale{filteredSales.length !== 1 ? 's' : ''})
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Select any day to inspect</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsCalendarOpen(false)}
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Filter Row: Date Pickers, Payment Method Dropdown, Sale Type Dropdown & Counter */}
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-gray-100">
            <div className="flex flex-wrap items-center gap-2">
              {/* Custom Date Range Picker */}
              <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-2.5 py-1 shadow-2xs text-xs">
                <Calendar className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setDatePreset('custom'); setCurrentPage(1); }}
                  className="text-[11px] font-medium text-gray-700 bg-transparent focus:outline-none w-28 sm:w-auto"
                  title="From Date"
                />
                <span className="text-gray-300 font-bold text-xs">–</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setDatePreset('custom'); setCurrentPage(1); }}
                  className="text-[11px] font-medium text-gray-700 bg-transparent focus:outline-none w-28 sm:w-auto"
                  title="To Date"
                />
                {(startDate || endDate) && (
                  <button
                    onClick={() => { setStartDate(''); setEndDate(''); setDatePreset('all'); }}
                    className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors ml-1 cursor-pointer"
                    title="Clear Date Range"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Payment Mode Filter Dropdown */}
              <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-2.5 py-1 shadow-2xs text-xs">
                <CreditCard className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <select
                  value={selectedPaymentMode}
                  onChange={(e) => { setSelectedPaymentMode(e.target.value); setCurrentPage(1); }}
                  className="text-[11px] font-semibold text-gray-700 bg-transparent focus:outline-none cursor-pointer"
                  title="Filter by payment method"
                >
                  <option value="all">All Payment Modes</option>
                  <option value="Cash">Cash Only</option>
                  <option value="UPI">UPI / QR Only</option>
                  <option value="Card">Card Only</option>
                  <option value="Net Banking">Net Banking</option>
                </select>
              </div>

              {/* Sale Type Filter Dropdown */}
              <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-2.5 py-1 shadow-2xs text-xs">
                <Filter className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <select
                  value={selectedSaleType}
                  onChange={(e) => { setSelectedSaleType(e.target.value); setCurrentPage(1); }}
                  className="text-[11px] font-semibold text-gray-700 bg-transparent focus:outline-none cursor-pointer"
                  title="Filter by sales category"
                >
                  <option value="all">All Sales Types</option>
                  <option value="service">Services / Washes</option>
                  <option value="membership">Memberships Only</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-[11px] font-bold text-gray-500">
                {filteredSales.length} record{filteredSales.length !== 1 ? 's' : ''} found
              </span>
              {isFilterActive && (
                <button
                  onClick={handleClearAllFilters}
                  className="text-[11px] font-bold text-amber-600 hover:text-amber-800 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table Body */}
        {filteredSales.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-400">No offline sales recorded yet</p>
            <p className="text-xs text-gray-400 mt-1">Click "New Offline Sale" to create your first counter sale</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 font-bold text-gray-600 uppercase tracking-wider text-[10px]">Sale ID</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-600 uppercase tracking-wider text-[10px]">Customer</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-600 uppercase tracking-wider text-[10px]">Vehicle</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-600 uppercase tracking-wider text-[10px]">Service / Membership</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-600 uppercase tracking-wider text-[10px]">Price</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-600 uppercase tracking-wider text-[10px]">Payment</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-600 uppercase tracking-wider text-[10px]">
                      <button
                        type="button"
                        onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        className="inline-flex items-center gap-1 font-bold text-gray-600 hover:text-amber-700 transition-colors uppercase tracking-wider text-[10px] group"
                        title={sortOrder === 'asc' ? 'Sorted: Calendar sequence (earliest first). Click for newest first' : 'Sorted: Newest first. Click for calendar sequence'}
                      >
                        <span>Date</span>
                        {sortOrder === 'asc' ? (
                          <ArrowUp className="w-3 h-3 text-amber-600 group-hover:scale-110 transition-transform" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-amber-600 group-hover:scale-110 transition-transform" />
                        )}
                      </button>
                    </th>
                    <th className="text-center px-4 py-3 font-bold text-gray-600 uppercase tracking-wider text-[10px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSales.map((sale, idx) => (
                    <tr key={sale.id || idx} className="border-b border-gray-50 hover:bg-amber-50/30 transition-colors">
                      <td className="px-4 py-3 font-bold text-gray-900">{sale.id || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          <p className="font-extrabold text-gray-900">{sale.customerName || '—'}</p>
                          <p className="text-[10px] text-gray-500">{sale.phone || sale.customerEmail || ''}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[9px] font-mono font-bold tracking-wider">
                          {sale.vehicleNo || '—'}
                        </span>
                        {sale.vehicleModel && <p className="text-[10px] text-gray-500 mt-0.5">{sale.vehicleModel}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-gray-800">{sale.packageName || sale.membershipName || '—'}</p>
                        {sale.saleType === 'membership' && (
                          <span className="inline-block px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[9px] font-bold mt-0.5">
                            Membership
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900">
                        {sale.price !== undefined && sale.price !== null && !isNaN(Number(sale.price))
                          ? `₹${Number(sale.price).toLocaleString('en-IN')}`
                          : (sale.total !== undefined && !isNaN(Number(sale.total))
                              ? `₹${Number(sale.total).toLocaleString('en-IN')}`
                              : (sale.price || sale.total ? `₹${sale.price || sale.total}` : '—'))}
                      </td>
                      <td className="px-4 py-3">
                        {(() => {
                          const mode = (sale.paymentMode || '').toLowerCase();
                          let badgeClass = "bg-gray-100 text-gray-700 border-gray-200";
                          if (mode.includes('cash')) badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
                          else if (mode.includes('upi') || mode.includes('qr') || mode.includes('online')) badgeClass = "bg-indigo-50 text-indigo-700 border-indigo-200";
                          else if (mode.includes('card')) badgeClass = "bg-blue-50 text-blue-700 border-blue-200";
                          else if (mode.includes('bank') || mode.includes('net')) badgeClass = "bg-amber-50 text-amber-700 border-amber-200";

                          return (
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border inline-block ${badgeClass}`}>
                              {sale.paymentMode || '—'}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 text-gray-600 font-medium">{sale.date || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedInvoiceSale(sale)}
                            className="px-2.5 py-1 rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 font-bold text-[10px] transition-all flex items-center gap-1 shadow-2xs"
                            title="Generate & Download Receipt"
                          >
                            <FileText className="w-3.5 h-3.5 text-amber-600" />
                            <span>Invoice</span>
                          </button>
                          <button
                            onClick={() => openVehicleDetail(sale)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                            title="View full vehicle & sale details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSale(sale)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete this offline sale record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/30 text-xs text-gray-500">
                <span>
                  Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredSales.length)} of {filteredSales.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-1 font-bold">{currentPage} / {totalPages}</span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Offline Sale Modal */}
      <OfflineSaleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleOfflineSaleSubmit}
        services={services}
      />

      {/* Vehicle Detail Modal */}
      <RegisteredVehicleDetailModal
        isOpen={!!selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
        vehicle={selectedVehicle?.vehicle}
        bookingHistory={selectedVehicle?.history || []}
        onNewOfflineSale={(v) => {
          setSelectedVehicle(null);
          setIsCreateModalOpen(true);
        }}
        onDownloadInvoice={(v) => {
          setSelectedInvoiceSale({
            id: v.offlineSaleId || 'OFS-RECEIPT',
            customerName: v.ownerName,
            phone: v.ownerPhone,
            customerEmail: v.ownerEmail,
            vehicleNo: v.plate,
            vehicleModel: v.model,
            packageName: v.packageName,
            membershipName: v.membershipName,
            saleType: v.membershipName ? 'membership' : 'service',
            price: v.offlineSalePrice || v.price || 0,
            paymentMode: v.paymentMode || 'Cash',
            date: v.offlineSaleDate || v.lastWashDate || v.lastServiceDate,
            membershipExpiry: v.membershipExpiry,
            membershipValidity: v.membershipValidity
          });
        }}
      />

      {/* Invoice / Receipt Download Modal */}
      <OfflineSaleInvoiceModal
        isOpen={!!selectedInvoiceSale}
        onClose={() => setSelectedInvoiceSale(null)}
        sale={selectedInvoiceSale}
      />
    </div>
  );
}
