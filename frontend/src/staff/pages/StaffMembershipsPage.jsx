import React, { useState } from 'react';
import { useStaff } from '../common/context/StaffContext';
import { Ticket, Sparkles, CheckCircle2, ShieldCheck, IndianRupee, QrCode, CreditCard, Banknote, Printer } from 'lucide-react';

export default function StaffMembershipsPage() {
  const { customers, showToast } = useStaff();

  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [selectedCustomer, setSelectedCustomer] = useState(customers[0]?.id || '');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [issuedPass, setIssuedPass] = useState(null);

  const plans = [
    { id: 'single', name: 'Single Wash', price: 699, duration: '1 Day', washes: '1 Wash' },
    { id: 'monthly', name: 'Monthly Membership', price: 2499, duration: '30 Days', washes: '4 Washes + Polish' },
    { id: 'annual', name: 'Annual VIP Pass', price: 24999, duration: '365 Days', washes: 'Unlimited Washes + Detailing' }
  ];

  const currentPlan = plans.find(p => p.id === selectedPlan);
  const currentCust = customers.find(c => c.id === selectedCustomer) || customers[0];

  const handleIssuePass = (e) => {
    e.preventDefault();
    const newPass = {
      passId: `TSL-PASS-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: currentCust.name,
      phone: currentCust.mobile,
      vehicleNo: currentCust.vehicles[0]?.registrationNumber || 'MH01AB1234',
      planName: currentPlan.name,
      amount: currentPlan.price,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      paymentMode
    };
    setIssuedPass(newPass);
    showToast(`Pass ${newPass.passId} issued successfully!`, 'success');
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
          <Ticket className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="font-extrabold text-base text-gray-900">Membership Pass Counter</h2>
          <p className="text-xs text-gray-500">Sell Car Wash Passes & VIP Memberships</p>
        </div>
      </div>

      {/* Plan Selection Cards */}
      <div className="space-y-2">
        {plans.map(p => (
          <div
            key={p.id}
            onClick={() => setSelectedPlan(p.id)}
            className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
              selectedPlan === p.id
                ? 'border-amber-500 bg-amber-50/60 shadow-xs'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div>
              <h4 className="font-extrabold text-xs text-gray-900">{p.name}</h4>
              <p className="text-[10px] text-gray-500">{p.duration} • {p.washes}</p>
            </div>
            <span className="font-black text-sm text-gray-900 flex items-center">
              <IndianRupee className="w-3.5 h-3.5 text-amber-600" /> {p.price}
            </span>
          </div>
        ))}
      </div>

      {/* Issue Pass Form */}
      <form onSubmit={handleIssuePass} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
        <h4 className="text-xs font-black text-gray-900 uppercase">Customer & Payment</h4>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Select Customer</label>
          <select
            value={selectedCustomer}
            onChange={e => setSelectedCustomer(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold bg-white"
          >
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.vehicles[0]?.registrationNumber || 'No Vehicle'}) — {c.mobile}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Payment Method</label>
          <div className="grid grid-cols-3 gap-2">
            {['UPI', 'Card', 'Cash'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setPaymentMode(m)}
                className={`py-2 rounded-xl text-xs font-bold border capitalize transition-all ${
                  paymentMode === m
                    ? 'border-amber-500 bg-amber-50 text-amber-900 font-black'
                    : 'border-gray-200 bg-gray-50 text-gray-600'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-xl text-white font-extrabold text-xs shadow-md active:scale-95 transition-transform"
          style={{ backgroundColor: '#e07b2a' }}
        >
          Issue Pass & Generate Digital Card
        </button>
      </form>

      {/* Issued Digital Pass Card Modal / Preview */}
      {issuedPass && (
        <div className="bg-gradient-to-br from-blue-900 to-slate-900 text-white rounded-3xl p-5 shadow-2xl border border-amber-500/40 relative space-y-3">
          <div className="flex items-center justify-between border-b border-blue-700/60 pb-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="font-black text-xs tracking-wider uppercase text-amber-400">DIGITAL VIP PASS</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-blue-200">{issuedPass.passId}</span>
          </div>

          <div>
            <h3 className="font-black text-base text-white">{issuedPass.customerName}</h3>
            <p className="text-xs text-amber-300 font-bold">{issuedPass.planName}</p>
          </div>

          <div className="bg-blue-950/80 rounded-xl p-3 border border-blue-800 flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-[9px] text-gray-400 block uppercase">Vehicle Reg</span>
              <span className="font-extrabold text-white">{issuedPass.vehicleNo}</span>
            </div>
            <div>
              <span className="text-[9px] text-gray-400 block uppercase">Valid Till</span>
              <span className="font-extrabold text-emerald-400">{issuedPass.validUntil}</span>
            </div>
          </div>

          <button
            onClick={() => window.print()}
            className="w-full py-2 rounded-xl bg-amber-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>Print Digital Pass Receipt</span>
          </button>
        </div>
      )}
    </div>
  );
}
