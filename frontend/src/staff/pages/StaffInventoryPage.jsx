import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStaff } from '../common/context/StaffContext';
import {
  Package,
  Search,
  AlertTriangle,
  CheckCircle2,
  Send,
  ArrowLeft,
  Filter,
  Plus,
  Boxes,
  Sparkles,
  Layers,
  X
} from 'lucide-react';

const INITIAL_INVENTORY_ITEMS = [
  { id: 'INV-001', name: 'Premium Foam Snow Shampoo', category: 'Car Wash', currentStock: 14, minStock: 5, unit: 'Liters', status: 'in-stock', supplier: 'Chemical Guys India' },
  { id: 'INV-002', name: 'Ceramic 9H Coating Vials', category: 'Detailing', currentStock: 3, minStock: 4, unit: 'Vials (50ml)', status: 'low-stock', supplier: 'Gtechniq Pro' },
  { id: 'INV-003', name: 'Microfiber Drying Towels (1200 GSM)', category: 'Car Wash', currentStock: 28, minStock: 10, unit: 'Pieces', status: 'in-stock', supplier: 'Detailing Knights' },
  { id: 'INV-004', name: 'Organic Oatmeal Dog Shampoo', category: 'Dog Wash', currentStock: 2, minStock: 5, unit: 'Bottles (1L)', status: 'low-stock', supplier: 'PetHead Professional' },
  { id: 'INV-005', name: 'Espresso Dark Roast Beans', category: 'Cafe', currentStock: 18, minStock: 5, unit: 'Kg', status: 'in-stock', supplier: 'Blue Tokai Roasters' },
  { id: 'INV-006', name: 'Oat Milk Barista Edition', category: 'Cafe', currentStock: 8, minStock: 6, unit: 'Tetra Packs', status: 'in-stock', supplier: 'Oatly Commercial' },
  { id: 'INV-007', name: 'Matte Clay Hair Pomade', category: 'Salon', currentStock: 11, minStock: 4, unit: 'Tubs', status: 'in-stock', supplier: 'Schwarzkopf Pro' },
  { id: 'INV-008', name: 'Tire Shine Silicone Dressing', category: 'Car Wash', currentStock: 0, minStock: 3, unit: 'Cans (5L)', status: 'out-of-stock', supplier: 'Meguiars Auto' },
  { id: 'INV-009', name: 'Disposable Seat Covers & Mats', category: 'Car Wash', currentStock: 150, minStock: 50, unit: 'Sets', status: 'in-stock', supplier: 'AutoProtect Hub' },
  { id: 'INV-010', name: 'Disposable Beard Capes & Razors', category: 'Salon', currentStock: 45, minStock: 20, unit: 'Sets', status: 'in-stock', supplier: 'Gillette Salon Pro' }
];

export default function StaffInventoryPage() {
  const navigate = useNavigate();
  const { currentStaff, showToast } = useStaff();

  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('tsl_admin_inventory');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_INVENTORY_ITEMS;
  });

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Request Restock Modal State
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [requestItem, setRequestItem] = useState(null);
  const [requestQty, setRequestQty] = useState(1);
  const [requestUrgency, setRequestUrgency] = useState('Normal');
  const [requestNote, setRequestNote] = useState('');

  const categories = ['All', 'Car Wash', 'Detailing', 'Cafe', 'Dog Wash', 'Salon'];

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      (item.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.category || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.supplier || '').toLowerCase().includes(search.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || item.category?.toLowerCase() === selectedCategory.toLowerCase();

    const actualStatus = item.currentStock <= 0 ? 'out-of-stock' : item.currentStock <= (item.minStock || 5) ? 'low-stock' : 'in-stock';
    const matchesStatus = statusFilter === 'All' || actualStatus === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const lowStockCount = items.filter((i) => (Number(i.currentStock) || 0) <= (Number(i.minStock) || 5)).length;

  const handleOpenRequest = (item) => {
    setRequestItem(item);
    setRequestQty(Math.max(1, (item.minStock || 5) * 2 - (item.currentStock || 0)));
    setRequestUrgency(item.currentStock <= 0 ? 'Urgent' : 'Normal');
    setRequestNote('');
    setIsRequestOpen(true);
  };

  const handleSendRequest = (e) => {
    e.preventDefault();
    if (!requestItem) return;

    try {
      const existingReqs = JSON.parse(localStorage.getItem('tsl_stock_requests') || '[]');
      const newReq = {
        id: `REQ-${Date.now().toString().slice(-4)}`,
        itemId: requestItem.id,
        itemName: requestItem.name,
        category: requestItem.category,
        quantity: Number(requestQty) || 1,
        unit: requestItem.unit,
        urgency: requestUrgency,
        requestedBy: currentStaff?.name || 'Staff Member',
        department: currentStaff?.department || requestItem.category,
        note: requestNote,
        createdAt: new Date().toISOString(),
        status: 'Pending Admin Approval'
      };
      localStorage.setItem('tsl_stock_requests', JSON.stringify([newReq, ...existingReqs]));
      showToast(`Stock request for ${requestItem.name} sent to Admin!`, 'success');
      setIsRequestOpen(false);
    } catch {
      showToast('Failed to save stock request', 'error');
    }
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Mobile Header Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/staff/dashboard')}
            className="p-1.5 rounded-xl hover:bg-gray-200 text-gray-600 transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs flex-shrink-0">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-black text-sm sm:text-base text-gray-900 leading-tight">Inventory & Supplies</h2>
            <p className="text-[10px] text-gray-500">Ground stock levels & consumable requests</p>
          </div>
        </div>

        {lowStockCount > 0 && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 shrink-0">
            <AlertTriangle className="w-3 h-3 text-rose-500" />
            {lowStockCount} Low
          </span>
        )}
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white border border-gray-200 rounded-2xl p-2.5 text-center shadow-xs">
          <Boxes className="w-4 h-4 mx-auto text-blue-800 mb-0.5" />
          <span className="text-base font-black text-blue-950 block">{items.length}</span>
          <p className="text-[9px] font-bold text-gray-500">Total Items</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-2.5 text-center shadow-xs">
          <CheckCircle2 className="w-4 h-4 mx-auto text-emerald-600 mb-0.5" />
          <span className="text-base font-black text-emerald-800 block">
            {items.filter((i) => i.currentStock > (i.minStock || 5)).length}
          </span>
          <p className="text-[9px] font-bold text-gray-500">In Stock</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-2.5 text-center shadow-xs">
          <AlertTriangle className="w-4 h-4 mx-auto text-amber-600 mb-0.5" />
          <span className="text-base font-black text-amber-800 block">{lowStockCount}</span>
          <p className="text-[9px] font-bold text-gray-500">Reorder Needed</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search supplies, chemicals, coffee beans..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-amber-500 shadow-xs"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product List */}
      <div className="space-y-2.5">
        {filteredItems.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200 p-6 space-y-2">
            <Package className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-xs font-bold text-gray-700">No inventory products found</p>
            <p className="text-[10px] text-gray-400">Try changing your search term or department filter.</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isOut = item.currentStock <= 0;
            const isLow = !isOut && item.currentStock <= (item.minStock || 5);
            const statusClass = isOut
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : isLow
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200';

            const statusLabel = isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'Adequate';

            return (
              <div
                key={item.id}
                className="bg-white border border-gray-200 rounded-2xl p-3.5 space-y-2.5 shadow-xs hover:border-amber-400 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] font-black text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                        {item.category}
                      </span>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${statusClass}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <h3 className="text-xs font-black text-gray-900 mt-1 truncate">{item.name}</h3>
                    <p className="text-[10px] text-gray-400 font-medium">Supplier: {item.supplier || 'Main Store'}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-base font-black text-gray-900 block leading-tight">{item.currentStock}</span>
                    <span className="text-[9px] font-semibold text-gray-400">{item.unit || 'Units'}</span>
                  </div>
                </div>

                {/* Stock Level Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-bold text-gray-500">
                    <span>Threshold: {item.minStock || 5} {item.unit}</span>
                    <span className={isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-emerald-600'}>
                      {item.currentStock} / {Math.max(item.currentStock, (item.minStock || 5) * 3)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isOut ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{
                        width: `${Math.min(100, Math.max(8, (item.currentStock / Math.max(item.currentStock, (item.minStock || 5) * 2)) * 100))}%`
                      }}
                    />
                  </div>
                </div>

                {/* Action button */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[9px] font-mono text-gray-400">{item.id}</span>
                  <button
                    onClick={() => handleOpenRequest(item)}
                    className="px-3 py-1 rounded-xl text-[10px] font-extrabold text-white bg-blue-900 hover:bg-blue-800 transition-colors flex items-center gap-1 shadow-2xs active:scale-95"
                  >
                    <Send className="w-3 h-3" />
                    <span>Request Stock Refill</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Request Stock / Consumables */}
      {isRequestOpen && requestItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-gray-900">Request Stock Refill</h3>
                <p className="text-[10px] text-gray-500">Notify inventory admin for replenishment</p>
              </div>
              <button
                onClick={() => setIsRequestOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendRequest} className="space-y-3">
              <div className="bg-gray-50 rounded-2xl p-3 border border-gray-200">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Product Item</span>
                <p className="text-xs font-black text-gray-900 mt-0.5">{requestItem.name}</p>
                <p className="text-[10px] text-blue-900 font-bold mt-0.5">
                  Current on ground: {requestItem.currentStock} {requestItem.unit}
                </p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Required Quantity ({requestItem.unit})
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={requestQty}
                  onChange={(e) => setRequestQty(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">Urgency Level</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Normal', 'Urgent (Required Today)'].map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setRequestUrgency(u.split(' ')[0])}
                      className={`py-2 rounded-xl text-[10px] font-extrabold border transition-all ${
                        requestUrgency === u.split(' ')[0]
                          ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">Ground Notes / Reason</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Running low before peak weekend appointments..."
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsRequestOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-95"
                >
                  Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
