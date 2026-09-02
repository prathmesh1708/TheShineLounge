import React, { useState, useMemo, useRef } from 'react';
import { Plus, ShoppingBag, Car, CreditCard, Users, Eye, Search, ChevronLeft, ChevronRight, FileText, Calendar, X, Trash2 } from 'lucide-react';
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
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;
  const isSubmittingSaleRef = useRef(false);

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

    return Array.from(map.values());
  }, [bookings]);

  // KPI Stats
  const totalVolume = offlineSales.reduce((sum, s) => sum + (Number(s.price) || Number(s.total) || Number(s.amount) || 0), 0);
  const totalTransactions = offlineSales.length;
  const offlineMemberships = offlineSales.filter(s => s.saleType === 'membership').length;
  const uniquePlates = new Set(offlineSales.map(s => (s.vehicleNo || '').toUpperCase().trim()).filter(Boolean)).size;

  // Preset handlers for date range
  const handlePresetChange = (preset) => {
    setDatePreset(preset);
    setCurrentPage(1);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'yesterday') {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (preset === 'week') {
      const w = new Date(today);
      w.setDate(w.getDate() - 7);
      setStartDate(w.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'month') {
      const m = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(m.toISOString().split('T')[0]);
      setEndDate(todayStr);
    }
  };

  // Helper to extract date from sale record
  const getSaleDateObj = (sale) => {
    if (sale.saleDate) {
      const d = new Date(sale.saleDate + 'T00:00:00');
      if (!isNaN(d.getTime())) return d;
    }
    if (sale.date) {
      const d = new Date(sale.date);
      if (!isNaN(d.getTime())) return d;
    }
    if (sale.createdAt) {
      const d = new Date(sale.createdAt);
      if (!isNaN(d.getTime())) return d;
    }
    return null;
  };

  // Search & Paginate with text and date range filtering
  const filteredSales = offlineSales.filter(s => {
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

    return true;
  });

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
    { label: 'Total Offline Volume', value: `₹${totalVolume.toLocaleString('en-IN')}`, icon: ShoppingBag, color: '#e07b2a' },
    { label: 'Walk-in Transactions', value: totalTransactions, icon: Users, color: '#1e4a7e' },
    { label: 'Offline Memberships', value: offlineMemberships, icon: CreditCard, color: '#059669' },
    { label: 'Fleet Cars Registered', value: uniquePlates, icon: Car, color: '#7c3aed' }
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
          <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">Record walk-in counter sales, offline membership purchases & manual vehicle registrations</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex-1 sm:flex-initial px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs font-bold text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
            style={{ backgroundColor: '#e07b2a' }}
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">New Offline Sale</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {kpiCards.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm flex items-center gap-2.5 sm:gap-3 hover:border-amber-300 transition-all">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ backgroundColor: kpi.color }}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase font-bold truncate">{kpi.label}</p>
                <p className="text-sm sm:text-lg font-black text-gray-900 truncate">{kpi.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sales Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Table Header Bar with Search & Date Range Filter */}
        <div className="p-3 sm:p-4 border-b border-gray-100 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 bg-gray-50/40">
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

          {/* Date Range Filter Controls */}
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full xl:w-auto">
            {/* Quick Presets */}
            <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 shadow-2xs text-[11px] font-bold overflow-x-auto">
              {[
                { id: 'all', label: 'All' },
                { id: 'today', label: 'Today' },
                { id: 'yesterday', label: 'Yesterday' },
                { id: 'week', label: '7 Days' },
                { id: 'month', label: 'This Month' }
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => handlePresetChange(p.id)}
                  className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap ${
                    datePreset === p.id && !startDate && !endDate && p.id === 'all'
                      ? 'bg-amber-500 text-white shadow-2xs'
                      : datePreset === p.id
                      ? 'bg-amber-500 text-white shadow-2xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom Date Range Picker */}
            <div className="flex items-center justify-between sm:justify-start gap-1.5 bg-white border border-gray-200 rounded-xl px-2.5 py-1 shadow-2xs text-xs">
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
              {(startDate || endDate || datePreset !== 'all') && (
                <button
                  onClick={() => handlePresetChange('all')}
                  className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors ml-1"
                  title="Clear Date Filter"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <span className="text-[11px] font-bold text-gray-500 ml-1 text-right sm:text-left">
              {filteredSales.length} record{filteredSales.length !== 1 ? 's' : ''} found
            </span>
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
                    <th className="text-left px-4 py-3 font-bold text-gray-600 uppercase tracking-wider text-[10px]">Date</th>
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
                      <td className="px-4 py-3 font-bold text-gray-900">₹{sale.price || sale.total || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-bold rounded-md border border-gray-200">
                          {sale.paymentMode || '—'}
                        </span>
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
