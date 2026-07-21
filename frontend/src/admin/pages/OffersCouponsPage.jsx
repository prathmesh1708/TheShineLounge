import React, { useState } from 'react';
import { Plus, Ticket, ToggleLeft, ToggleRight, Trash2, Calendar, Percent, Tag, CheckCircle2 } from 'lucide-react';
import { useAdmin } from '../common/context/AdminContext';
import AdminModal from '../common/components/AdminModal';

export default function OffersCouponsPage() {
  const { coupons, addCoupon, toggleCouponStatus } = useAdmin();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    code: '',
    title: '',
    discountType: 'Percentage',
    discountValue: 20,
    minPurchase: 500,
    maxDiscount: 200,
    startDate: '2026-07-20',
    endDate: '2026-08-31',
    eligibleServices: 'All Services',
    usageLimit: 200
  });

  const handleCreateCoupon = (e) => {
    e.preventDefault();
    if (!form.code || !form.title) return;
    addCoupon(form);
    setIsModalOpen(false);
    setForm({
      code: '',
      title: '',
      discountType: 'Percentage',
      discountValue: 20,
      minPurchase: 500,
      maxDiscount: 200,
      startDate: '2026-07-20',
      endDate: '2026-08-31',
      eligibleServices: 'All Services',
      usageLimit: 200
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Offers & Promo Code Engine</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Create discount vouchers, promo campaigns, and service coupon codes for lounge customers.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white rounded-xl shadow-sm hover:opacity-95 transition-opacity"
          style={{ backgroundColor: '#e07b2a' }}
        >
          <Plus className="w-4 h-4" /> Create Promo Code
        </button>
      </div>

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coupons.map((cpn) => (
          <div
            key={cpn.id}
            className={`bg-white border rounded-2xl p-5 shadow-sm space-y-4 relative overflow-hidden ${
              cpn.status === 'Active' ? 'border-gray-200' : 'border-gray-200 opacity-60'
            }`}
          >
            {/* Top Code Badge & Status */}
            <div className="flex items-center justify-between">
              <div className="px-3 py-1.5 bg-amber-50 border border-amber-300/80 rounded-xl font-black text-sm text-amber-700 tracking-wider flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-amber-500" />
                <span>{cpn.code}</span>
              </div>

              <button
                onClick={() => toggleCouponStatus(cpn.id)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all ${
                  cpn.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {cpn.status === 'Active' ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                <span>{cpn.status}</span>
              </button>
            </div>

            <div>
              <h3 className="text-base font-bold text-gray-900">{cpn.title}</h3>
              <p className="text-xs text-amber-600 font-extrabold mt-0.5">
                {cpn.discountType === 'Percentage' ? `${cpn.discountValue}% OFF` : `Flat ₹${cpn.discountValue} OFF`}
              </p>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs space-y-1.5">
              <div className="flex justify-between text-gray-600">
                <span>Min Purchase:</span>
                <span className="font-bold text-gray-900">₹{cpn.minPurchase}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Eligible Services:</span>
                <span className="font-bold text-blue-900 truncate max-w-[140px]">{cpn.eligibleServices}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Valid Period:</span>
                <span className="font-bold text-gray-700">{cpn.startDate} to {cpn.endDate}</span>
              </div>
            </div>

            {/* Usage Progress */}
            <div>
              <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
                <span>Usage Progress</span>
                <span className="text-amber-600">{cpn.usedCount} / {cpn.usageLimit} Used</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${Math.min(100, (cpn.usedCount / cpn.usageLimit) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Create Coupon */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Promo Voucher Code"
        subtitle="Set discount percentage, service scope, and redemption limits"
      >
        <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Promo Code (CAPS)</label>
              <input
                type="text"
                required
                placeholder="e.g. MONSOON2026"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold uppercase focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">Campaign Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Monsoon Special 20% Off"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Discount Type</label>
              <select
                value={form.discountType}
                onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-semibold"
              >
                <option value="Percentage">Percentage (%)</option>
                <option value="Fixed Amount">Fixed Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">Discount Value</label>
              <input
                type="number"
                value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Min Order Value (₹)</label>
              <input
                type="number"
                value={form.minPurchase}
                onChange={(e) => setForm({ ...form, minPurchase: Number(e.target.value) })}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">Total Redemption Limit</label>
              <input
                type="number"
                value={form.usageLimit}
                onChange={(e) => setForm({ ...form, usageLimit: Number(e.target.value) })}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">Eligible Services</label>
            <input
              type="text"
              placeholder="e.g. Car Wash, Car Detailing"
              value={form.eligibleServices}
              onChange={(e) => setForm({ ...form, eligibleServices: e.target.value })}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-bold text-white rounded-xl"
              style={{ backgroundColor: '#e07b2a' }}
            >
              Launch Promo Code
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
