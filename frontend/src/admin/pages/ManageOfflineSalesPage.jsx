import React, { useState, useMemo } from 'react';
import { Plus, ShoppingBag, Car, CreditCard, Users, Eye, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAdmin } from '../common/context/AdminContext';
import OfflineSaleModal from '../common/components/OfflineSaleModal';
import RegisteredVehicleDetailModal from '../common/components/RegisteredVehicleDetailModal';

export default function ManageOfflineSalesPage() {
  const { bookings, addOfflineSale, showToast } = useAdmin();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Filter offline sales from bookings (those with isOfflineSale flag, or
  // fallback — show all bookings that have a vehicleNo for now)
  const offlineSales = useMemo(() => {
    return bookings.filter(b => b.isOfflineSale);
  }, [bookings]);

  // KPI Stats
  const totalVolume = offlineSales.reduce((sum, s) => sum + (Number(s.price) || Number(s.total) || Number(s.amount) || 0), 0);
  const totalTransactions = offlineSales.length;
  const offlineMemberships = offlineSales.filter(s => s.saleType === 'membership').length;
  const uniquePlates = new Set(offlineSales.map(s => (s.vehicleNo || '').toUpperCase().trim()).filter(Boolean)).size;

  // Search & Paginate
  const filteredSales = offlineSales.filter(s => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (s.customerName || '').toLowerCase().includes(term) ||
      (s.vehicleNo || '').toLowerCase().includes(term) ||
      (s.customerEmail || '').toLowerCase().includes(term) ||
      (s.phone || '').toLowerCase().includes(term) ||
      (s.packageName || '').toLowerCase().includes(term) ||
      (s.id || '').toLowerCase().includes(term)
    );
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
    if (addOfflineSale) {
      await addOfflineSale(formData);
    } else {
      showToast?.('Offline sale saved locally');
    }
  };

  const kpiCards = [
    { label: 'Total Offline Volume', value: `₹${totalVolume.toLocaleString('en-IN')}`, icon: ShoppingBag, color: '#e07b2a' },
    { label: 'Walk-in Transactions', value: totalTransactions, icon: Users, color: '#1e4a7e' },
    { label: 'Offline Memberships', value: offlineMemberships, icon: CreditCard, color: '#059669' },
    { label: 'Fleet Cars Registered', value: uniquePlates, icon: Car, color: '#7c3aed' }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-amber-500" />
            Offline Sales / Manual POS
          </h2>
          <p className="text-xs text-gray-500 mt-1">Record walk-in counter sales, offline membership purchases & manual vehicle registrations</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          style={{ backgroundColor: '#e07b2a' }}
        >
          <Plus className="w-4 h-4" />
          New Offline Sale
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center gap-3 hover:border-amber-300 transition-all">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: kpi.color }}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold">{kpi.label}</p>
                <p className="text-lg font-black text-gray-900">{kpi.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sales Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Table Header Bar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/40">
          <div className="relative w-full sm:w-auto sm:flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Search by customer, plate, email, phone..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
            />
          </div>
          <span className="text-[11px] font-bold text-gray-500">
            {filteredSales.length} record{filteredSales.length !== 1 ? 's' : ''} found
          </span>
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
                    <th className="text-center px-4 py-3 font-bold text-gray-600 uppercase tracking-wider text-[10px]">View</th>
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
                        <button
                          onClick={() => openVehicleDetail(sale)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title="View full vehicle & sale details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
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
      />
    </div>
  );
}
