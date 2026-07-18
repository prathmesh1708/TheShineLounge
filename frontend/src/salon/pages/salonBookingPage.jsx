import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar as CalIcon, Clock, User as UserIcon, Tag, MapPin, CheckCircle, Shield } from 'lucide-react';

import { SERVICES, STYLISTS, OFFERS } from '../services/salonApi';
import { PrimaryButton, FormInput } from '../components/salonUI';

export default function SalonBookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Query parameters prep
  const serviceQuery = searchParams.get("service") || "";
  const stylistQuery = searchParams.get("stylist") || "";
  const timeQuery = searchParams.get("time") || "";

  // State hooks
  const [selectedService, setSelectedService] = useState(SERVICES.find(s => s.id === serviceQuery) || SERVICES[0]);
  const [selectedStylist, setSelectedStylist] = useState(STYLISTS.find(s => s.id === stylistQuery) || STYLISTS[0]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState(timeQuery || "");
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");

  // Generate next 7 days dynamically
  const dates = [];
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push({
      fullDate: d.toISOString().split('T')[0],
      dayName: days[d.getDay()],
      dayNum: d.getDate(),
      month: d.toLocaleString('en-US', { month: 'short' })
    });
  }

  useEffect(() => {
    if (dates.length > 0 && !selectedDate) {
      setSelectedDate(dates[0].fullDate);
    }
  }, [dates, selectedDate]);

  // Set default timeslot if stylist changes
  useEffect(() => {
    if (!timeQuery && selectedStylist) {
      setSelectedTime(selectedStylist.timeSlots[0]);
    }
  }, [selectedStylist, timeQuery]);

  // Sync selected service if query changes
  useEffect(() => {
    const s = SERVICES.find(item => item.id === serviceQuery);
    if (s) setSelectedService(s);
  }, [serviceQuery]);

  // Sync selected stylist if query changes
  useEffect(() => {
    const st = STYLISTS.find(item => item.id === stylistQuery);
    if (st) setSelectedStylist(st);
  }, [stylistQuery]);

  // Billing Calculations
  const subtotal = selectedService ? selectedService.price : 0;
  const convenienceFee = 3;
  const discountAmount = appliedCoupon ? Math.round((subtotal * discount) / 100) : 0;
  const totalAmount = subtotal + convenienceFee - discountAmount;

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setCouponError("");
    setCouponSuccess("");
    const matched = OFFERS.find(o => o.code.toLowerCase() === couponCode.trim().toLowerCase());
    if (matched) {
      if (subtotal < matched.minAmount) {
        setCouponError(`Min purchase of $${matched.minAmount} required.`);
      } else {
        setAppliedCoupon(matched);
        setDiscount(matched.value);
        setCouponSuccess(`Coupon applied! Save ${matched.value}% flat.`);
      }
    } else {
      setCouponError("Invalid coupon code. Try BEAUTY15.");
    }
  };

  const handleBookingSubmit = () => {
    if (!selectedDate || !selectedTime) return;

    // Simulate saving booking to localStorage
    const newBooking = {
      id: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
      package: selectedService.name,
      status: "Upcoming",
      date: selectedDate,
      time: selectedTime,
      service: selectedService.name,
      stylist: selectedStylist.name,
      location: "Shine Lounge Salon, Vijay Nagar, Indore",
      price: totalAmount,
      timeline: [
        { status: "Appointment Placed", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), active: true },
        { status: "Stylist Confirmed", time: "Pending", active: false }
      ]
    };

    const existing = JSON.parse(localStorage.getItem("salon_bookings") || "[]");
    localStorage.setItem("salon_bookings", JSON.stringify([newBooking, ...existing]));

    // Navigate to success screen
    navigate(`/salon/success?id=${newBooking.id}&price=${totalAmount}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5 pb-12 md:space-y-8 md:pb-16 text-zinc-800"
    >
      
      {/* Page Title */}
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-855">Book Appointment</h1>
        <p className="text-xs md:text-sm text-zinc-500 font-semibold mt-1.5">
          Select treatments, assign styling specialists, choose schedule slots, and apply promo discounts.
        </p>
      </div>

      {/* Grid: Checkout configuration and Billing summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Columns: Inputs */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* 1. Choose Service & Stylist */}
          <div className="bg-white border border-zinc-200/80 rounded-24 p-6 md:p-8 space-y-6 shadow-sm">
            <h3 className="font-extrabold text-lg text-zinc-800 border-b border-zinc-50 pb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">1</span>
              <span>Select Treatment & Stylist</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Service selection dropdown */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-450 uppercase tracking-wider block ml-1 select-none">
                  Select Service
                </label>
                <select
                  value={selectedService.id}
                  onChange={(e) => setSelectedService(SERVICES.find(s => s.id === e.target.value))}
                  className="w-full py-3.5 px-4 bg-zinc-50 border border-zinc-200 focus:border-primary text-zinc-800 rounded-20 outline-none text-sm font-semibold transition-all shadow-sm"
                >
                  {SERVICES.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} (${s.price})</option>
                  ))}
                </select>
              </div>

              {/* Stylist selection dropdown */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-450 uppercase tracking-wider block ml-1 select-none">
                  Assign Stylist
                </label>
                <select
                  value={selectedStylist.id}
                  onChange={(e) => setSelectedStylist(STYLISTS.find(st => st.id === e.target.value))}
                  className="w-full py-3.5 px-4 bg-zinc-50 border border-zinc-200 focus:border-primary text-zinc-800 rounded-20 outline-none text-sm font-semibold transition-all shadow-sm"
                >
                  {STYLISTS.map((st) => (
                    <option key={st.id} value={st.id}>{st.name} ({st.specialization})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 2. Choose Date Calendar */}
          <div className="bg-white border border-zinc-200/80 rounded-24 p-6 md:p-8 space-y-6 shadow-sm">
            <h3 className="font-extrabold text-lg text-zinc-800 border-b border-zinc-50 pb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">2</span>
              <span>Select Date & Time</span>
            </h3>

            {/* Custom Horizontal Date Picker */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-zinc-450 uppercase tracking-wider block ml-1">Select Date</span>
              <div className="flex gap-2.5 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-zinc-200 scrollbar-track-transparent -mx-4 px-4 md:mx-0 md:px-0">
                {dates.map((date, idx) => {
                  const isSelected = selectedDate === date.fullDate;
                  return (
                    <motion.button
                      key={idx}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedDate(date.fullDate)}
                      className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-20 border transition-all ${
                        isSelected
                          ? 'bg-primary border-primary text-white shadow-premium'
                          : 'bg-white border-zinc-200 hover:border-zinc-300 text-zinc-700'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">{date.dayName}</span>
                      <span className="text-lg font-extrabold mt-1">{date.dayNum}</span>
                      <span className="text-[9px] uppercase font-bold tracking-wide mt-0.5 opacity-60">{date.month}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Time Slots Grid */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-zinc-450 uppercase tracking-wider block ml-1">Available Slots</span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {selectedStylist.timeSlots.map((slot, idx) => {
                  const isSelected = selectedTime === slot;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedTime(slot)}
                      className={`py-3 text-xs font-bold rounded-15 border transition-all ${
                        isSelected
                          ? 'bg-primary border-primary text-white shadow-sm'
                          : 'bg-zinc-55 bg-zinc-50 border-zinc-200 hover:border-zinc-300 text-zinc-700'
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. Salon Location */}
          <div className="bg-white border border-zinc-200/80 rounded-24 p-6 md:p-8 space-y-4 shadow-sm flex items-start gap-4">
            <MapPin className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-extrabold text-sm text-zinc-800">Shine Lounge Studio Outlet</h4>
              <p className="text-xs md:text-sm text-zinc-500 font-semibold leading-relaxed">
                Plot 45, Palasia Square, Main Road Scheme 54, Indore, MP. Phone: 0731-4040909.
              </p>
            </div>
          </div>

        </div>

        {/* Right Column: Billing Summary & Coupon Application */}
        <div className="space-y-6 lg:sticky lg:top-24">
          
          {/* Coupon Entry */}
          <div className="bg-white border border-zinc-200/80 rounded-24 p-6 shadow-sm space-y-4">
            <h4 className="font-extrabold text-sm text-zinc-800 flex items-center gap-1.5">
              <Tag className="w-4.5 h-4.5 text-primary" />
              <span>Apply Coupon</span>
            </h4>
            
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <input
                type="text"
                placeholder="BEAUTY15"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="flex-grow py-2.5 px-3.5 bg-zinc-50 border border-zinc-200 focus:border-primary text-zinc-800 placeholder-zinc-400 rounded-15 outline-none text-xs font-semibold uppercase tracking-wider"
              />
              <button
                type="submit"
                className="py-2.5 px-4 bg-zinc-800 hover:bg-zinc-900 text-white text-xs font-bold rounded-15 transition-all shadow-sm"
              >
                Apply
              </button>
            </form>
            {couponError && <p className="text-[10px] text-red-500 font-bold ml-1">{couponError}</p>}
            {couponSuccess && <p className="text-[10px] text-emerald-500 font-bold ml-1">{couponSuccess}</p>}
          </div>

          {/* Invoice Summary */}
          <div className="bg-white border border-zinc-200/80 rounded-24 p-6 shadow-premium space-y-6">
            <h4 className="font-extrabold text-sm text-zinc-800 border-b border-zinc-100 pb-3">Booking Summary</h4>
            
            <div className="space-y-3.5 text-xs text-zinc-550 font-semibold">
              <div className="flex justify-between items-center text-zinc-700">
                <span>Selected Service</span>
                <span className="font-bold text-zinc-850 truncate max-w-[140px]">{selectedService.name}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-700">
                <span>Stylist</span>
                <span className="font-bold text-zinc-850">{selectedStylist.name}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-700">
                <span>Date & Time</span>
                <span className="font-bold text-zinc-850">{selectedDate ? `${selectedDate} at ${selectedTime}` : "Not selected"}</span>
              </div>
              
              <hr className="border-zinc-100 my-2" />

              <div className="flex justify-between items-center">
                <span>Subtotal Rate</span>
                <span className="text-zinc-800 font-extrabold">${subtotal}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Booking Fee</span>
                <span className="text-zinc-800 font-extrabold">${convenienceFee}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between items-center text-emerald-500">
                  <span>Discount ({discount}%)</span>
                  <span className="font-extrabold">-${discountAmount}</span>
                </div>
              )}

              <hr className="border-zinc-150 my-2" />

              <div className="flex justify-between items-end text-zinc-850">
                <span className="font-extrabold text-sm">Total Payable</span>
                <span className="font-extrabold text-2xl text-primary leading-none">${totalAmount}</span>
              </div>
            </div>

            <PrimaryButton
              disabled={!selectedDate || !selectedTime}
              onClick={handleBookingSubmit}
              className="w-full mt-4 font-extrabold tracking-wide text-center block"
            >
              Confirm and Pay
            </PrimaryButton>
          </div>

          {/* Secure Shield Info */}
          <div className="bg-[#FAF9F6] border border-zinc-200 rounded-24 p-5 flex items-start gap-4 shadow-sm">
            <Shield className="w-8 h-8 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-extrabold text-sm text-zinc-800">Shine Secure Checkout</h4>
              <p className="text-[10px] text-zinc-500 leading-relaxed font-semibold mt-1">
                Your styling bookings are protected. Adjust calendar times or request refunds easily.
              </p>
            </div>
          </div>
        </div>

      </div>

    </motion.div>
  );
}
