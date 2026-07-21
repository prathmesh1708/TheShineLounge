import React, { useState } from 'react';
import { useStaff } from '../common/context/StaffContext';
import { Receipt, Plus, Trash2, IndianRupee, Printer, Check, QrCode, Tag } from 'lucide-react';

export default function StaffInvoicingPage() {
  const { customers, currentStaff, showToast } = useStaff();

  const [selectedCustomer, setSelectedCustomer] = useState(customers[0]?.id || '');
  const [items, setItems] = useState([
    { id: '1', name: 'Deluxe Foam Car Wash', price: 699, qty: 1 },
    { id: '2', name: 'Artisanal Iced Latte', price: 250, qty: 2 }
  ]);
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [generatedInvoice, setGeneratedInvoice] = useState(null);

  const currentCust = customers.find(c => c.id === selectedCustomer) || customers[0];

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const discountAmount = appliedDiscount;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const gst = taxableAmount * 0.18; // 18% GST
  const grandTotal = taxableAmount + gst;

  const handleApplyCoupon = () => {
    if (couponCode.toUpperCase() === 'SHINE50') {
      setAppliedDiscount(350);
      showToast('Coupon SHINE50 applied! ₹350 Discount', 'success');
    } else if (couponCode.toUpperCase() === 'CAFE100') {
      setAppliedDiscount(100);
      showToast('Coupon CAFE100 applied! ₹100 Discount', 'success');
    } else {
      showToast('Invalid Coupon Code', 'error');
    }
  };

  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      { id: Date.now().toString(), name: 'Executive Grooming Service', price: 499, qty: 1 }
    ]);
  };

  const handleRemoveItem = (id) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleCreateInvoice = (e) => {
    e.preventDefault();
    const inv = {
      id: `INV-${Math.floor(10000 + Math.random() * 90000)}`,
      customerName: currentCust.name,
      phone: currentCust.mobile,
      vehicleNo: currentCust.vehicles[0]?.registrationNumber || 'MH01AB1234',
      items,
      subtotal,
      discount: discountAmount,
      gst,
      total: grandTotal,
      paymentMethod,
      staffName: currentStaff?.name || 'Ground Staff',
      date: new Date().toLocaleString()
    };
    setGeneratedInvoice(inv);
    showToast(`Invoice ${inv.id} Generated with 18% GST!`, 'success');
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
          <Receipt className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="font-extrabold text-base text-gray-900">Invoicing & POS Counter</h2>
          <p className="text-xs text-gray-500">Auto 18% GST (9% CGST + 9% SGST)</p>
        </div>
      </div>

      {/* Invoice Form */}
      <form onSubmit={handleCreateInvoice} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Select Customer Profile</label>
          <select
            value={selectedCustomer}
            onChange={e => setSelectedCustomer(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold bg-white"
          >
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.vehicles[0]?.registrationNumber || 'No Reg'}) — {c.mobile}
              </option>
            ))}
          </select>
        </div>

        {/* Item List */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-gray-700">Line Items</label>
            <button
              type="button"
              onClick={handleAddItem}
              className="text-[11px] font-extrabold text-amber-600 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Service
            </button>
          </div>

          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="flex items-center justify-between bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-xs">
                <div>
                  <p className="font-extrabold text-gray-900">{item.name}</p>
                  <p className="text-[10px] text-gray-500">Qty: {item.qty} × ₹{item.price}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-gray-900">₹{item.price * item.qty}</span>
                  {items.length > 1 && (
                    <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-rose-500 hover:text-rose-700">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coupon Input */}
        <div className="pt-2">
          <label className="block text-xs font-bold text-gray-700 mb-1">Apply Promo / Coupon</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={couponCode}
                onChange={e => setCouponCode(e.target.value)}
                placeholder="Try SHINE50 or CAFE100"
                className="w-full pl-8 pr-2 py-2 border rounded-xl text-xs font-bold uppercase"
              />
            </div>
            <button
              type="button"
              onClick={handleApplyCoupon}
              className="px-3 py-2 rounded-xl bg-gray-900 text-white font-extrabold text-xs"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Breakdown Box */}
        <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200 space-y-1 text-xs">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          {appliedDiscount > 0 && (
            <div className="flex justify-between text-emerald-700 font-bold">
              <span>Coupon Discount</span>
              <span>-₹{appliedDiscount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-600">
            <span>GST 18% (9% CGST + 9% SGST)</span>
            <span>₹{gst.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-900 font-black text-sm pt-1 border-t border-amber-200">
            <span>Grand Total</span>
            <span className="text-amber-700">₹{grandTotal.toFixed(2)}</span>
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
                className={`py-2 rounded-xl text-xs font-bold border ${paymentMethod === m ? 'bg-amber-500 text-white border-amber-500' : 'bg-gray-50 text-gray-700 border-gray-200'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-xl text-white font-extrabold text-xs shadow-md active:scale-95 transition-transform"
          style={{ backgroundColor: '#10b981' }}
        >
          Generate Invoice & Collect Payment
        </button>
      </form>

      {/* Generated Receipt Preview Modal */}
      {generatedInvoice && (
        <div className="bg-white rounded-3xl p-5 shadow-2xl border border-gray-300 space-y-3">
          <div className="text-center border-b pb-2">
            <h3 className="font-black text-sm text-gray-900">THE SHINE LOUNGE RECEIPT</h3>
            <p className="text-[10px] text-gray-500 font-mono">{generatedInvoice.id} • {generatedInvoice.date}</p>
          </div>

          <div className="text-xs space-y-1">
            <p className="font-bold text-gray-900">Customer: {generatedInvoice.customerName} ({generatedInvoice.phone})</p>
            <p className="text-gray-500">Vehicle: {generatedInvoice.vehicleNo}</p>
            <p className="text-gray-500">Staff Billed: {generatedInvoice.staffName}</p>
          </div>

          <div className="border-t border-b py-2 space-y-1 text-xs">
            {generatedInvoice.items.map(i => (
              <div key={i.id} className="flex justify-between font-semibold text-gray-800">
                <span>{i.name} × {i.qty}</span>
                <span>₹{i.price * i.qty}</span>
              </div>
            ))}
          </div>

          <div className="text-xs space-y-1 font-bold">
            <div className="flex justify-between text-gray-600"><span>GST 18%:</span><span>₹{generatedInvoice.gst.toFixed(2)}</span></div>
            <div className="flex justify-between text-gray-900 text-sm font-black"><span>Total Paid ({generatedInvoice.paymentMethod}):</span><span>₹{generatedInvoice.total.toFixed(2)}</span></div>
          </div>

          <button
            onClick={() => window.print()}
            className="w-full py-2.5 rounded-xl bg-gray-900 text-white font-extrabold text-xs flex items-center justify-center gap-1.5"
          >
            <Printer className="w-4 h-4" /> Print PDF Receipt
          </button>
        </div>
      )}
    </div>
  );
}
