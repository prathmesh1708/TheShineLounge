import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStaff } from '../common/context/StaffContext';
import {
  Ticket,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  IndianRupee,
  CreditCard,
  Banknote,
  Printer,
  Search,
  Car,
  Calendar,
  Clock,
  ShieldAlert,
  Phone,
  ArrowLeft,
  X,
  History,
  Check,
  AlertCircle
} from 'lucide-react';
import {
  isCarWashStaff,
  getCarWashMembershipsList,
  recordStaffWashDone,
  getLocalOfflineSales
} from '../common/utils/staffMembershipUtils';

export default function StaffMembershipsPage() {
  const navigate = useNavigate();
  const { currentStaff, customers, allJobs, jobs, showToast } = useStaff();

  // 1. Strict Department Access Guard: Isolated to Car Wash Staff only
  const isCarWash = isCarWashStaff(currentStaff);

  // Active Tab: 'passes' (Searchable Pass List) vs 'issue' (Sell New Pass)
  const [activeTab, setActiveTab] = useState('passes'); // 'passes' | 'issue'

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'single' | 'membership' | 'expired'
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoggingWash, setIsLoggingWash] = useState(false);

  // New Pass Issuance State
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [selectedCustomer, setSelectedCustomer] = useState(customers[0]?.id || '');
  const [customPlate, setCustomPlate] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [issuedPass, setIssuedPass] = useState(null);

  const plans = [
    { id: 'single', name: 'Single Wash', price: 499, duration: '1 Day', washes: '1 Wash' },
    { id: 'monthly', name: 'Monthly Membership', price: 2499, duration: '30 Days', washes: '30 Washes + Detailing' },
    { id: 'annual', name: 'Annual VIP Pass', price: 24999, duration: '365 Days', washes: 'Unlimited Washes' }
  ];

  const currentPlan = plans.find(p => p.id === selectedPlan) || plans[1];
  const currentCust = customers.find(c => c.id === selectedCustomer) || customers[0] || {};

  // Listen for real-time wash updates or storage changes
  useEffect(() => {
    const handleSync = () => setRefreshTrigger(prev => prev + 1);
    window.addEventListener('tsl_wash_logged', handleSync);
    window.addEventListener('tsl_wash_used', handleSync);
    window.addEventListener('tsl_offline_sales_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('tsl_wash_logged', handleSync);
      window.removeEventListener('tsl_wash_used', handleSync);
      window.removeEventListener('tsl_offline_sales_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Aggregate memberships, single washes, and offline sales
  const allMemberships = useMemo(() => {
    const rawBookings = allJobs && allJobs.length > 0 ? allJobs : (jobs || []);
    const offlineList = getLocalOfflineSales();
    return getCarWashMembershipsList({
      bookings: rawBookings,
      offlineSales: offlineList
    });
  }, [allJobs, jobs, refreshTrigger]);

  // Keep selected membership details live and synchronized
  useEffect(() => {
    if (selectedMembership) {
      const updated = allMemberships.find(m => m.id === selectedMembership.id || m.vehicleNo === selectedMembership.vehicleNo);
      if (updated) setSelectedMembership(updated);
    }
  }, [allMemberships]);

  // Filtered memberships matching search query (Name, Car Plate, Membership/Plan Name, Phone)
  const filteredMemberships = useMemo(() => {
    return allMemberships.filter(m => {
      // Search filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesName = (m.customerName || '').toLowerCase().includes(query);
        const matchesPlate = (m.vehicleNo || '').toLowerCase().replace(/[^a-z0-9]/g, '').includes(query.replace(/[^a-z0-9]/g, ''));
        const matchesPackage = (m.packageName || '').toLowerCase().includes(query);
        const matchesPhone = (m.phone || '').replace(/\D/g, '').includes(query.replace(/\D/g, ''));

        if (!matchesName && !matchesPlate && !matchesPackage && !matchesPhone) {
          return false;
        }
      }

      // Status / Category filter
      if (statusFilter === 'active') {
        return m.status === 'Active';
      }
      if (statusFilter === 'single') {
        return m.planType === 'single_wash';
      }
      if (statusFilter === 'membership') {
        return m.planType === 'membership';
      }
      if (statusFilter === 'expired') {
        return m.status === 'Expired' || m.status === 'Exhausted';
      }

      return true;
    });
  }, [allMemberships, searchTerm, statusFilter]);

  // Metrics summary
  const totalCount = allMemberships.length;
  const activeCount = allMemberships.filter(m => m.status === 'Active').length;
  const singleWashCount = allMemberships.filter(m => m.planType === 'single_wash').length;
  const expiredCount = allMemberships.filter(m => m.status === 'Expired' || m.status === 'Exhausted').length;

  // Handle Mark Wash Done directly on the ground
  const handleMarkWashDone = async (item) => {
    if (isLoggingWash) return;
    setIsLoggingWash(true);
    try {
      await recordStaffWashDone({
        vehicleNo: item.vehicleNo,
        customerName: item.customerName,
        phone: item.phone,
        vehicleModel: item.vehicleModel,
        membershipName: item.packageName,
        serviceKey: 'car-wash'
      });

      showToast(`✅ Wash completed & logged for ${item.vehicleNo}!`, 'success');
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      showToast(`Error logging wash: ${err.message}`, 'error');
    } finally {
      setIsLoggingWash(false);
    }
  };

  // Issue New Pass submit handler
  const handleIssuePass = (e) => {
    e.preventDefault();
    const plate = customPlate.trim() || currentCust.vehicles?.[0]?.registrationNumber || 'MH01AB1234';
    const newPass = {
      passId: `TSL-PASS-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: currentCust.name || 'Walk-in Customer',
      phone: currentCust.mobile || '',
      vehicleNo: plate.toUpperCase(),
      vehicleModel: customModel.trim() || currentCust.vehicles?.[0]?.model || 'Car',
      packageName: currentPlan.name,
      planName: currentPlan.name,
      amount: currentPlan.price,
      price: currentPlan.price,
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      validUntil: new Date(Date.now() + (currentPlan.id === 'annual' ? 365 : currentPlan.id === 'monthly' ? 30 : 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      paymentMode,
      serviceKey: 'car-wash',
      isOfflineSale: true,
      saleType: currentPlan.id === 'single' ? 'service' : 'membership'
    };

    // Save to local offline sales
    try {
      const existing = JSON.parse(localStorage.getItem('tsl_offline_sales') || '[]');
      localStorage.setItem('tsl_offline_sales', JSON.stringify([newPass, ...existing]));
    } catch (e) {}

    // Dispatch events across Admin and Staff portals
    try {
      window.dispatchEvent(new CustomEvent('tsl_offline_sales_updated', { detail: newPass }));
      window.dispatchEvent(new CustomEvent('tsl_wash_logged', { detail: newPass }));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}

    setIssuedPass(newPass);
    setRefreshTrigger(prev => prev + 1);
    showToast(`Pass ${newPass.passId} issued for ${plate}!`, 'success');
  };

  // -------------------------------------------------------------
  // Department Access Guard: Deny access if NOT Car Wash Staff
  // -------------------------------------------------------------
  if (!isCarWash) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm my-6 space-y-4">
        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-black text-gray-900">Restricted Department Access</h3>
          <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto mt-1">
            The Car Wash Memberships & Passes Hub is strictly reserved for ground staff in the <b>Car Wash Department</b>.
          </p>
        </div>
        <button
          onClick={() => navigate('/staff/dashboard')}
          className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-gray-800 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/staff/dashboard')}
            className="p-1.5 rounded-xl hover:bg-gray-200 text-gray-600 transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-xs flex-shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-extrabold text-sm sm:text-base text-gray-900 leading-tight">Car Wash Memberships</h2>
            <p className="text-[10px] text-gray-500">Live passes, single washes & counter offline sales</p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-gray-200/80 p-0.5 rounded-xl text-[10px] font-bold">
          <button
            onClick={() => setActiveTab('passes')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              activeTab === 'passes' ? 'bg-white text-gray-900 shadow-2xs font-black' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Passes ({allMemberships.length})
          </button>
          <button
            onClick={() => setActiveTab('issue')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              activeTab === 'issue' ? 'bg-white text-gray-900 shadow-2xs font-black' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Issue New
          </button>
        </div>
      </div>

      {/* TAB 1: PASSES & MEMBERSHIPS DIRECTORY */}
      {activeTab === 'passes' && (
        <div className="space-y-2.5">
          {/* Top Quick Counters */}
          <div className="grid grid-cols-4 gap-1.5">
            <div className="bg-white border border-gray-200 rounded-xl p-2 text-center shadow-2xs">
              <p className="text-[9px] font-bold text-gray-400 uppercase">Total</p>
              <p className="text-sm font-black text-gray-900">{totalCount}</p>
            </div>
            <div className="bg-white border border-emerald-200 rounded-xl p-2 text-center shadow-2xs bg-emerald-50/20">
              <p className="text-[9px] font-bold text-emerald-600 uppercase">Active</p>
              <p className="text-sm font-black text-emerald-700">{activeCount}</p>
            </div>
            <div className="bg-white border border-blue-200 rounded-xl p-2 text-center shadow-2xs bg-blue-50/20">
              <p className="text-[9px] font-bold text-blue-600 uppercase">Single</p>
              <p className="text-sm font-black text-blue-700">{singleWashCount}</p>
            </div>
            <div className="bg-white border border-amber-200 rounded-xl p-2 text-center shadow-2xs bg-amber-50/20">
              <p className="text-[9px] font-bold text-amber-600 uppercase">Expired</p>
              <p className="text-sm font-black text-amber-700">{expiredCount}</p>
            </div>
          </div>

          {/* Search Bar: Name, Car Number Plate, Membership Plan */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, car plate, membership..."
              className="w-full pl-8 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] font-bold">
            {[
              { id: 'all', label: 'All Passes' },
              { id: 'active', label: 'Active Only' },
              { id: 'membership', label: 'Memberships' },
              { id: 'single', label: 'Single Wash' },
              { id: 'expired', label: 'Expired / Done' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                  statusFilter === f.id
                    ? 'bg-purple-600 text-white shadow-2xs font-black'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Memberships Cards List */}
          {filteredMemberships.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-xs space-y-2">
              <Car className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="text-xs font-bold text-gray-600">No Car Wash passes match your search</p>
              <p className="text-[10px] text-gray-400">Try searching a different plate, customer name, or membership</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredMemberships.map((item) => {
                const isSingle = item.planType === 'single_wash';
                const statusColor =
                  item.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  item.status === 'Completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  item.status === 'Exhausted' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-rose-50 text-rose-700 border-rose-200';

                const progressPercent = item.isUnlimited
                  ? 100
                  : Math.min(100, Math.round(((item.washesUsed || 0) / (item.maxWashes || 1)) * 100));

                return (
                  <div
                    key={item.id + item.vehicleNo}
                    onClick={() => setSelectedMembership(item)}
                    className="bg-white border border-gray-200 hover:border-purple-300 rounded-2xl p-3 shadow-xs hover:shadow-sm transition-all cursor-pointer space-y-2.5 relative group"
                  >
                    {/* Top Row: Plate Number, Model & Status Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-900 text-white font-mono font-black text-xs rounded-md tracking-wider shadow-2xs">
                          {item.vehicleNo}
                        </span>
                        {item.vehicleModel && (
                          <span className="text-[11px] font-bold text-gray-600">
                            {item.vehicleModel}
                          </span>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${statusColor}`}>
                        {item.status}
                      </span>
                    </div>

                    {/* Owner & Package Row */}
                    <div className="flex items-center justify-between text-xs gap-2">
                      <div className="min-w-0">
                        <p className="font-extrabold text-gray-900 truncate">{item.customerName}</p>
                        {item.phone && <p className="text-[10px] text-gray-500 font-medium">{item.phone}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-purple-700 text-[11px] truncate">{item.packageName}</p>
                        <span className="text-[9px] text-gray-400 font-semibold uppercase">{item.source}</span>
                      </div>
                    </div>

                    {/* Wash Progress Bar */}
                    <div className="space-y-1 bg-gray-50 rounded-xl p-2 border border-gray-100">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-gray-500">Washes Completed:</span>
                        <span className="font-black text-gray-900">
                          {item.washesUsed} / {item.isUnlimited ? 'Unlimited' : `${item.maxWashes} Washes`}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            item.status === 'Active' ? 'bg-emerald-500' :
                            item.status === 'Exhausted' ? 'bg-amber-500' : 'bg-gray-400'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Last Wash Date & Expiry Dates */}
                    <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-gray-100">
                      <div className="flex items-center gap-1 truncate" title={`Last Wash: ${item.lastWashDate}`}>
                        <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span>Last Wash: <b className="text-gray-800">{item.lastWashDate || 'None logged yet'}</b></span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span>Expires: <b className="text-gray-800">{item.expiryDate}</b></span>
                      </div>
                    </div>

                    {/* Quick Wash Done Button */}
                    <div className="pt-1 flex items-center justify-between">
                      <span className="text-[9px] font-bold text-purple-600 group-hover:underline">
                        Tap for full history & details →
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkWashDone(item);
                        }}
                        disabled={isLoggingWash || (item.status === 'Exhausted' && !item.isUnlimited) || (isSingle && item.washesUsed >= 1)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all flex items-center gap-1 shadow-2xs ${
                          isSingle && item.washesUsed >= 1
                            ? 'bg-gray-100 text-gray-500 border border-gray-200 cursor-not-allowed'
                            : 'text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50'
                        }`}
                        title={isSingle && item.washesUsed >= 1 ? 'Wash already completed' : 'Quick Log Wash Done'}
                      >
                        {isSingle && item.washesUsed >= 1 ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Done</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 text-emerald-200" />
                            <span>Wash Done</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ISSUE NEW MEMBERSHIP PASS / OFFLINE SALE */}
      {activeTab === 'issue' && (
        <div className="space-y-3">
          <form onSubmit={handleIssuePass} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="border-b border-gray-100 pb-2">
              <h4 className="text-xs font-black text-gray-900 uppercase">Sell Wash Pass / Membership</h4>
              <p className="text-[10px] text-gray-500">Issue pass directly at counter or wash bay</p>
            </div>

            {/* Plan Cards */}
            <div className="space-y-2">
              {plans.map(p => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlan(p.id)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    selectedPlan === p.id
                      ? 'border-purple-500 bg-purple-50/50 shadow-xs'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div>
                    <h5 className="font-extrabold text-xs text-gray-900">{p.name}</h5>
                    <p className="text-[10px] text-gray-500">{p.duration} • {p.washes}</p>
                  </div>
                  <span className="font-black text-xs text-purple-700 flex items-center">
                    ₹{p.price}
                  </span>
                </div>
              ))}
            </div>

            {/* Customer Selection or Custom Entry */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Select Customer</label>
              <select
                value={selectedCustomer}
                onChange={e => setSelectedCustomer(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.vehicles?.[0]?.registrationNumber || 'No plate'}) — {c.mobile}
                  </option>
                ))}
              </select>
            </div>

            {/* Vehicle Details */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Vehicle Plate No</label>
                <input
                  type="text"
                  value={customPlate}
                  onChange={e => setCustomPlate(e.target.value)}
                  placeholder={currentCust.vehicles?.[0]?.registrationNumber || 'e.g. MP09GG8790'}
                  className="w-full px-3 py-1.5 rounded-xl border border-gray-300 text-xs font-bold uppercase focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Car Model</label>
                <input
                  type="text"
                  value={customModel}
                  onChange={e => setCustomModel(e.target.value)}
                  placeholder={currentCust.vehicles?.[0]?.model || 'e.g. Hyundai i20'}
                  className="w-full px-3 py-1.5 rounded-xl border border-gray-300 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {['UPI', 'Card', 'Cash'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMode(m)}
                    className={`py-1.5 rounded-xl text-xs font-bold border capitalize transition-all ${
                      paymentMode === m
                        ? 'border-purple-500 bg-purple-50 text-purple-900 font-black shadow-2xs'
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
              className="w-full py-2.5 rounded-xl text-white font-extrabold text-xs shadow-md bg-purple-600 hover:bg-purple-700 active:scale-95 transition-transform"
            >
              Issue Pass & Activate
            </button>
          </form>

          {/* Issued Pass Receipt Preview */}
          {issuedPass && (
            <div className="bg-gradient-to-br from-slate-900 to-purple-950 text-white rounded-3xl p-4 shadow-xl border border-purple-500/40 relative space-y-3">
              <div className="flex items-center justify-between border-b border-purple-800/60 pb-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="font-black text-xs tracking-wider uppercase text-amber-400">DIGITAL PASS ACTIVATED</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-purple-200">{issuedPass.passId}</span>
              </div>

              <div>
                <h4 className="font-black text-sm text-white">{issuedPass.customerName}</h4>
                <p className="text-xs text-amber-300 font-bold">{issuedPass.packageName}</p>
              </div>

              <div className="bg-black/40 rounded-xl p-2.5 border border-purple-800/50 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-[9px] text-gray-400 block uppercase">Vehicle Reg</span>
                  <span className="font-black text-white">{issuedPass.vehicleNo}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-gray-400 block uppercase">Valid Until</span>
                  <span className="font-black text-emerald-400">{issuedPass.validUntil}</span>
                </div>
              </div>

              <button
                onClick={() => window.print()}
                className="w-full py-2 rounded-xl bg-purple-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* INTERACTIVE MEMBERSHIP DETAILS MODAL */}
      {/* ------------------------------------------------------------- */}
      {selectedMembership && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-900 to-indigo-900 text-white">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-white text-gray-900 font-mono font-black text-sm rounded-lg shadow-sm">
                  {selectedMembership.vehicleNo}
                </span>
                <div>
                  <h3 className="text-xs font-extrabold text-white leading-tight">
                    {selectedMembership.vehicleModel || 'Registered Car'}
                  </h3>
                  <span className="text-[10px] text-purple-200 font-semibold">{selectedMembership.packageName}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedMembership(null)}
                className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-3.5 text-xs">
              {/* Customer Info & Contact */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Vehicle Owner</p>
                  <p className="text-sm font-black text-gray-900">{selectedMembership.customerName}</p>
                  {selectedMembership.phone && (
                    <p className="text-xs text-gray-600 font-semibold mt-0.5">{selectedMembership.phone}</p>
                  )}
                </div>
                {selectedMembership.phone && (
                  <a
                    href={`tel:${selectedMembership.phone}`}
                    className="p-2 rounded-xl bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                    title="Call Customer"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                )}
              </div>

              {/* 4-Stat Overview Grid */}
              <div className="grid grid-cols-2 gap-2">
                {/* Washes Used */}
                <div className="bg-white border border-gray-200 rounded-2xl p-2.5 space-y-1 shadow-2xs">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Washes Done</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-black text-gray-900">{selectedMembership.washesUsed}</span>
                    <span className="text-xs text-gray-500 font-bold">
                      / {selectedMembership.isUnlimited ? 'Unlimited' : `${selectedMembership.maxWashes}`}
                    </span>
                  </div>
                  <span className="text-[9px] font-extrabold text-emerald-700 block">
                    {selectedMembership.isUnlimited ? 'Unlimited Washes' : `${selectedMembership.remainingWashes} Remaining`}
                  </span>
                </div>

                {/* Status */}
                <div className="bg-white border border-gray-200 rounded-2xl p-2.5 space-y-1 shadow-2xs">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Pass Status</span>
                  <p className="text-base font-black text-gray-900">{selectedMembership.status}</p>
                  <span className="text-[9px] font-semibold text-gray-500 block">
                    {selectedMembership.source}
                  </span>
                </div>

                {/* Validity */}
                <div className="bg-white border border-gray-200 rounded-2xl p-2.5 space-y-1 shadow-2xs">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Plan Validity</span>
                  <p className="text-xs font-black text-gray-900">{selectedMembership.validity}</p>
                  <span className="text-[9px] text-gray-500 block">From: {selectedMembership.startDate}</span>
                </div>

                {/* Expiry Date */}
                <div className="bg-white border border-gray-200 rounded-2xl p-2.5 space-y-1 shadow-2xs">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Expiry Date</span>
                  <p className="text-xs font-black text-gray-900">{selectedMembership.expiryDate}</p>
                  <span className={`text-[9px] font-extrabold block ${
                    selectedMembership.status === 'Active' ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {selectedMembership.expiryCountdown}
                  </span>
                </div>
              </div>

              {/* Last Wash Date Banner */}
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-purple-700 uppercase block">Last Wash Recorded</span>
                  <p className="text-xs font-black text-gray-900">
                    {selectedMembership.lastWashDate && selectedMembership.lastWashDate !== '—'
                      ? selectedMembership.lastWashDate
                      : 'No previous wash logged for this car'}
                  </p>
                </div>
              </div>

              {/* Wash History Timeline */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-black text-gray-900 uppercase">
                  <History className="w-3.5 h-3.5 text-purple-600" />
                  <span>Wash Visit History</span>
                </div>
                {selectedMembership.washHistory && selectedMembership.washHistory.length > 0 ? (
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                    {selectedMembership.washHistory.map((h, i) => (
                      <div key={h.id || i} className="bg-gray-50 border border-gray-200 rounded-xl p-2 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          <span className="font-bold text-gray-900">{h.date}</span>
                        </div>
                        <span className="text-[10px] text-gray-500 font-medium">{h.time}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-center text-gray-400 text-[11px]">
                    No past wash logs recorded yet for this vehicle.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Action: Log Wash Done */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/60 flex items-center gap-2">
              <button
                onClick={() => setSelectedMembership(null)}
                className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleMarkWashDone(selectedMembership)}
                disabled={isLoggingWash || (selectedMembership.status === 'Exhausted' && !selectedMembership.isUnlimited) || (selectedMembership.planType === 'single_wash' && selectedMembership.washesUsed >= 1)}
                className={`flex-1 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all ${
                  selectedMembership.planType === 'single_wash' && selectedMembership.washesUsed >= 1
                    ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50'
                }`}
              >
                {selectedMembership.planType === 'single_wash' && selectedMembership.washesUsed >= 1 ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Single Wash Completed</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-200" />
                    <span>{isLoggingWash ? 'Recording Wash...' : 'Mark Wash as Done'}</span>
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
