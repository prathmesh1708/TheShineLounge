import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStaff } from '../common/context/StaffContext';
import {
  Receipt,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Coffee,
  Phone,
  Car,
  ChevronRight,
  Flame,
  Check,
  ShoppingBag
} from 'lucide-react';

export default function StaffOrdersPage() {
  const navigate = useNavigate();
  const { jobs, updateJobStatus, currentStaff, showToast } = useStaff();

  const [activeFilter, setActiveFilter] = useState('active'); // 'active' | 'completed' | 'all'
  const [search, setSearch] = useState('');

  // Orders are jobs with serviceKey 'cafe', 'drive-through-cafe', or order items
  const orderJobs = jobs.filter((j) => {
    const isFood = j.serviceKey === 'cafe' || j.serviceKey === 'drive-through-cafe';
    const hasItems = Array.isArray(j.items) && j.items.length > 0;
    return isFood || hasItems || j.orderType === 'food' || j.orderType === 'retail';
  });

  const displayList = orderJobs.length > 0 ? orderJobs : jobs;

  const filteredOrders = displayList.filter((order) => {
    const status = (order.status || '').toLowerCase();
    const isDone = status.includes('completed') || status.includes('delivered') || (order.stepIndex || 0) >= 3;

    if (activeFilter === 'active' && isDone) return false;
    if (activeFilter === 'completed' && !isDone) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = (order.customerName || '').toLowerCase().includes(q);
      const matchId = (order.id || '').toLowerCase().includes(q);
      const matchVehicle = (order.vehicleNo || '').toLowerCase().includes(q);
      return matchName || matchId || matchVehicle;
    }
    return true;
  });

  const handleNextStep = (order) => {
    const nextStep = (order.stepIndex || 0) + 1;
    let nextStatus = 'Preparing';
    if (nextStep === 1) nextStatus = 'In Kitchen / Brewing';
    else if (nextStep === 2) nextStatus = 'Ready for Pickup';
    else if (nextStep >= 3) nextStatus = 'Delivered & Completed';

    updateJobStatus(order.id, nextStatus, nextStep);
    showToast(`Order #${order.id} marked as ${nextStatus}!`, 'success');
  };

  const activeCount = displayList.filter((o) => {
    const s = (o.status || '').toLowerCase();
    return !s.includes('completed') && !s.includes('delivered') && (o.stepIndex || 0) < 3;
  }).length;

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
          <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold shadow-xs flex-shrink-0">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-black text-sm sm:text-base text-gray-900 leading-tight">Live Orders Hub</h2>
            <p className="text-[10px] text-gray-500">Live food, drinks & service orders</p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1">
          <Flame className="w-3 h-3 text-amber-600 animate-pulse" />
          {activeCount} Active
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="bg-gray-200/80 p-1 rounded-2xl flex items-center text-xs font-bold">
        {[
          { id: 'active', label: `In Prep (${activeCount})` },
          { id: 'completed', label: 'Completed' },
          { id: 'all', label: 'All Orders' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`flex-1 py-1.5 rounded-xl transition-all text-center ${
              activeFilter === tab.id ? 'bg-white text-gray-900 shadow-xs font-black' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by order ID, customer name, vehicle..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-amber-500 shadow-xs"
        />
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200 p-6 space-y-2">
            <ShoppingBag className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-xs font-bold text-gray-700">No {activeFilter} orders found</p>
            <p className="text-[10px] text-gray-400">Incoming orders will show up here in real-time.</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const step = order.stepIndex || 0;
            const isCompleted = (order.status || '').toLowerCase().includes('completed') || step >= 3;

            return (
              <div
                key={order.id}
                className="bg-white border border-gray-200 rounded-2xl p-3.5 space-y-3 shadow-xs hover:border-amber-400 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded uppercase">
                        #{order.id}
                      </span>
                      <span className="text-[9px] font-bold text-blue-900 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                        {order.serviceName || order.serviceKey || 'Order'}
                      </span>
                    </div>
                    <h3 className="text-xs font-black text-gray-900 mt-1">{order.customerName || 'Customer'}</h3>
                    {order.customerPhone && (
                      <p className="text-[10px] text-gray-400 font-medium flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-gray-400" />
                        {order.customerPhone}
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-gray-900 block leading-tight">
                      ₹{order.total || order.amount || 350}
                    </span>
                    <span
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border inline-block mt-1 ${
                        isCompleted
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : step === 2
                          ? 'bg-blue-50 text-blue-800 border-blue-200 animate-pulse'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {order.status || 'Received'}
                    </span>
                  </div>
                </div>

                {/* Items Breakdown */}
                <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-100 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-extrabold text-gray-600">
                    <span>Ordered Items</span>
                    <span className="text-gray-400">{order.vehicleNo ? `🚗 ${order.vehicleNo}` : order.timeSlot || 'Ready Now'}</span>
                  </div>
                  <p className="text-[11px] font-bold text-gray-900">
                    {order.itemsSummary || (order.items && order.items.map((i) => `${i.qty || 1}x ${i.name}`).join(', ')) || order.serviceName || 'Custom Service Order'}
                  </p>
                </div>

                {/* Stepper Progress Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[9px] font-bold text-gray-500">
                    <span className={step >= 0 ? 'text-amber-600 font-black' : ''}>1. Received</span>
                    <span className={step >= 1 ? 'text-amber-600 font-black' : ''}>2. Preparing</span>
                    <span className={step >= 2 ? 'text-blue-600 font-black' : ''}>3. Ready</span>
                    <span className={step >= 3 ? 'text-emerald-600 font-black' : ''}>4. Done</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden flex">
                    <div className={`h-full transition-all duration-300 ${isCompleted ? 'bg-emerald-500 w-full' : step === 2 ? 'bg-blue-500 w-3/4' : step === 1 ? 'bg-amber-500 w-1/2' : 'bg-amber-400 w-1/4'}`} />
                  </div>
                </div>

                {/* Action Button */}
                {!isCompleted && (
                  <button
                    onClick={() => handleNextStep(order)}
                    className="w-full py-2 bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  >
                    <span>{step === 0 ? 'Start Preparing' : step === 1 ? 'Mark Ready for Pickup' : 'Complete & Deliver'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
