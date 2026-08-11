import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalIcon, Clock, User as UserIcon, Tag, MapPin, CheckCircle, Shield, ChevronDown, Check } from 'lucide-react';

import { SERVICES, STYLISTS, OFFERS, getTimeSlotsSync, getServicesSync, getStylistsSync } from '../services/salonApi';
import { PrimaryButton, FormInput } from '../components/salonUI';
import apiClient from '../../common/utils/apiClient';

// Custom Mobile Responsive Service Selector
function CustomServiceSelect({ services, selectedService, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <label className="text-xs font-bold text-zinc-450 uppercase tracking-wider block mb-1.5 ml-1 select-none">
        Select Service
      </label>
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-zinc-50 hover:bg-zinc-100/90 border border-zinc-200 focus:border-primary text-zinc-800 rounded-20 outline-none transition-all shadow-xs text-left group"
      >
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          {selectedService?.image ? (
            <img
              src={selectedService.image}
              alt={selectedService.name}
              className="w-10 h-10 rounded-12 object-cover border border-zinc-200/80 shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-12 bg-primary/10 text-primary flex items-center justify-center font-extrabold text-sm shrink-0">
              ✂️
            </div>
          )}
          <div className="min-w-0 flex-1">
            <span className="font-extrabold text-xs sm:text-sm text-zinc-850 truncate block">
              {selectedService?.name || 'Choose Service'}
            </span>
            <span className="text-[10px] text-zinc-450 font-bold uppercase block tracking-wider truncate">
              {selectedService?.category || 'Service'} {selectedService?.duration ? `• ${selectedService.duration}` : ''}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="py-1 px-2.5 bg-primary/10 text-primary text-xs font-extrabold rounded-lg">
            ₹{selectedService?.price || 0}
          </span>
          <ChevronDown className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
        </div>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full z-50 mt-1.5 bg-white border border-zinc-200/90 rounded-24 shadow-2xl overflow-hidden max-h-72 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-zinc-200"
          >
            {services.map((s) => {
              const isSelected = (s.id || s._id) === (selectedService?.id || selectedService?._id);
              return (
                <button
                  key={s.id || s._id}
                  type="button"
                  onClick={() => {
                    onSelect(s);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-18 transition-all text-left ${
                    isSelected ? 'bg-primary/10 border border-primary/20 text-primary font-bold' : 'hover:bg-zinc-50 text-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    {s.image ? (
                      <img src={s.image} alt={s.name} className="w-9 h-9 rounded-12 object-cover border border-zinc-200 shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-12 bg-zinc-100 text-zinc-600 flex items-center justify-center font-bold text-xs shrink-0">
                        ✂️
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-extrabold text-xs text-zinc-850 truncate">{s.name}</p>
                      <p className="text-[10px] text-zinc-400 font-semibold truncate">{s.category} {s.duration ? `• ${s.duration}` : ''}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-extrabold text-zinc-850">₹{s.price || 0}</span>
                    {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Custom Mobile Responsive Stylist Selector
function CustomStylistSelect({ stylists, selectedStylist, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <label className="text-xs font-bold text-zinc-450 uppercase tracking-wider block mb-1.5 ml-1 select-none">
        Assign Stylist
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-zinc-50 hover:bg-zinc-100/90 border border-zinc-200 focus:border-primary text-zinc-800 rounded-20 outline-none transition-all shadow-xs text-left group"
      >
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <img
            src={selectedStylist?.avatar || "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150"}
            alt={selectedStylist?.name || selectedStylist?.fullName}
            className="w-10 h-10 rounded-full object-cover border border-primary/20 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <span className="font-extrabold text-xs sm:text-sm text-zinc-850 truncate block">
              {selectedStylist?.name || selectedStylist?.fullName || 'Select Specialist'}
            </span>
            <span className="text-[10px] text-zinc-450 font-bold uppercase block tracking-wider truncate">
              {selectedStylist?.specialization || selectedStylist?.staffRole || 'Salon Specialist'}
            </span>
          </div>
        </div>

        <ChevronDown className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full z-50 mt-1.5 bg-white border border-zinc-200/90 rounded-24 shadow-2xl overflow-hidden max-h-72 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-zinc-200"
          >
            {stylists.map((st) => {
              const isSelected = (st.id || st._id) === (selectedStylist?.id || selectedStylist?._id);
              const name = st.name || st.fullName;
              const role = st.specialization || st.staffRole || 'Salon Specialist';

              return (
                <button
                  key={st.id || st._id}
                  type="button"
                  onClick={() => {
                    onSelect(st);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-18 transition-all text-left ${
                    isSelected ? 'bg-primary/10 border border-primary/20 text-primary font-bold' : 'hover:bg-zinc-50 text-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <img
                      src={st.avatar || st.photo || "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150"}
                      alt={name}
                      className="w-9 h-9 rounded-full object-cover border border-zinc-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-extrabold text-xs text-zinc-850 truncate">{name}</p>
                      <p className="text-[10px] text-zinc-400 font-semibold truncate">{role}</p>
                    </div>
                  </div>

                  {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SalonBookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Query parameters prep
  const serviceQuery = searchParams.get("service") || "";
  const stylistQuery = searchParams.get("stylist") || "";
  const timeQuery = searchParams.get("time") || "";

  // Dynamic Salon Time Slots, Services & Stylists
  const [allSlots, setAllSlots] = useState(getTimeSlotsSync());
  const [salonServices, setSalonServices] = useState(getServicesSync());
  const [salonStylists, setSalonStylists] = useState(() => getStylistsSync());

  useEffect(() => {
    const handleSync = () => {
      setAllSlots(getTimeSlotsSync());
      setSalonServices(getServicesSync());
      setSalonStylists(getStylistsSync());
    };
    window.addEventListener('salonDataChanged', handleSync);
    return () => window.removeEventListener('salonDataChanged', handleSync);
  }, []);

  // Fetch staff created by admin in Salon Staff
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        let dbList = [];
        const res = await apiClient.get('/users/staff?serviceKey=salon');
        if (res.data && res.data.staff && res.data.staff.length > 0) {
          dbList = res.data.staff.map(st => ({
            id: st._id || st.id,
            _id: st._id || st.id,
            name: st.fullName || st.name,
            specialization: st.staffRole || st.role || 'Salon Specialist',
            avatar: st.photo || st.profileImage || st.avatar || "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150",
            phone: st.mobile || "+91 98210 77777",
            timeSlots: ["09:30 AM", "10:30 AM", "11:30 AM", "01:30 PM", "03:00 PM", "04:30 PM"]
          }));
        }

        const localList = getStylistsSync();
        
        // Merge dbList and localList without duplicates
        const map = new Map();
        dbList.forEach(s => map.set(s.name?.toLowerCase() || s.id, s));
        localList.forEach(s => {
          const key = s.name?.toLowerCase() || s.id;
          if (!map.has(key)) {
            map.set(key, s);
          }
        });

        const merged = Array.from(map.values());
        if (merged.length > 0) {
          setSalonStylists(merged);
        }
      } catch (err) {
        console.warn('Could not fetch live salon staff, using local list:', err.message);
        setSalonStylists(getStylistsSync());
      }
    };
    fetchStaff();
  }, []);

  // Filter active time slots
  const activeSlots = useMemo(() => {
    return allSlots.filter(s => s.status !== 'inactive').map(s => s.time);
  }, [allSlots]);

  // State hooks
  const [selectedService, setSelectedService] = useState(() => {
    const initial = getServicesSync();
    return initial.find(s => (s.id || s._id) === serviceQuery) || initial[0] || SERVICES[0];
  });
  const [selectedStylist, setSelectedStylist] = useState(() => {
    const initialStylists = getStylistsSync();
    return initialStylists.find(st => (st.id || st._id) === stylistQuery) || initialStylists[0];
  });
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState(timeQuery || "");
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");

  // Determine slot list (use dynamic active salon slots, or fallback to stylist slots)
  const displaySlots = useMemo(() => {
    return activeSlots.length > 0 ? activeSlots : (selectedStylist?.timeSlots || []);
  }, [activeSlots, selectedStylist]);

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

  // Set default timeslot ONLY if no slot is currently selected
  useEffect(() => {
    if (!selectedTime && displaySlots.length > 0) {
      setSelectedTime(displaySlots[0]);
    }
  }, [displaySlots]);

  // Sync selected service if query changes or list changes
  useEffect(() => {
    if (serviceQuery) {
      const s = salonServices.find(item => (item.id || item._id) === serviceQuery);
      if (s) setSelectedService(s);
    } else if (salonServices.length > 0 && (!selectedService || !salonServices.some(s => (s.id || s._id) === (selectedService.id || selectedService._id)))) {
      setSelectedService(salonServices[0]);
    }
  }, [serviceQuery, salonServices]);

  // Sync selected stylist if query changes or staff list changes
  useEffect(() => {
    if (stylistQuery) {
      const st = salonStylists.find(item => (item.id || item._id) === stylistQuery);
      if (st) setSelectedStylist(st);
    } else if (salonStylists.length > 0 && (!selectedStylist || !salonStylists.some(st => (st.id || st._id) === (selectedStylist.id || selectedStylist._id)))) {
      setSelectedStylist(salonStylists[0]);
    }
  }, [stylistQuery, salonStylists]);

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
        setCouponError(`Min purchase of ₹${matched.minAmount} required.`);
      } else {
        setAppliedCoupon(matched);
        setDiscount(matched.value);
        setCouponSuccess(`Coupon applied! Save ${matched.value}% flat.`);
      }
    } else {
      setCouponError("Invalid coupon code. Try BEAUTY15.");
    }
  };

  const handleBookingSubmit = async () => {
    if (!selectedDate || !selectedTime) return;

    const newBookingId = `BK-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    let customerName = 'Salon Client';
    let customerEmail = '';
    let phone = '';
    try {
      const stored = localStorage.getItem('tsl_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u.fullName) customerName = u.fullName;
        else if (u.name) customerName = u.name;
        if (u.email) customerEmail = u.email;
        if (u.mobile) phone = u.mobile;
        else if (u.phone) phone = u.phone;
      }
    } catch (e) {}

    const payload = {
      bookingId: newBookingId,
      serviceKey: 'salon',
      serviceName: 'Men\'s Salon',
      packageName: selectedService?.name || 'Executive Haircut',
      price: totalAmount,
      date: selectedDate,
      timeSlot: selectedTime,
      customerName,
      customerEmail,
      phone,
      vehicleNo: `Stylist: ${selectedStylist?.name || 'Any Specialist'}`,
      vehicleType: 'Salon Client'
    };

    try {
      await apiClient.post('/bookings', payload);
    } catch (err) {
      console.warn('Error creating salon booking in DB:', err.message);
    }

    // Save booking to localStorage for client-side my-bookings
    const newBooking = {
      id: newBookingId,
      package: selectedService?.name,
      status: "Upcoming",
      date: selectedDate,
      time: selectedTime,
      service: selectedService?.name,
      stylist: selectedStylist?.name,
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
    navigate(`/salon/success?id=${newBookingId}&price=${totalAmount}`);
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
              {/* Custom Mobile Responsive Service Selector */}
              <CustomServiceSelect
                services={salonServices}
                selectedService={selectedService}
                onSelect={(s) => setSelectedService(s)}
              />

              {/* Custom Mobile Responsive Stylist Selector */}
              <CustomStylistSelect
                stylists={salonStylists}
                selectedStylist={selectedStylist}
                onSelect={(st) => setSelectedStylist(st)}
              />
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
                {displaySlots.map((slot, idx) => {
                  const isSelected = selectedTime === slot;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedTime(slot)}
                      className={`py-3 text-xs font-bold rounded-15 border transition-all cursor-pointer select-none active:scale-95 ${
                        isSelected
                          ? 'bg-primary border-primary text-white shadow-sm ring-2 ring-primary/20 font-extrabold'
                          : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300 text-zinc-700 hover:bg-zinc-100'
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
                <span className="font-bold text-zinc-850 truncate max-w-[140px]">{selectedService?.name || 'Selected Service'}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-700">
                <span>Stylist</span>
                <span className="font-bold text-zinc-850">{selectedStylist?.name || 'Selected Specialist'}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-700">
                <span>Date & Time</span>
                <span className="font-bold text-zinc-850">{selectedDate ? `${selectedDate} at ${selectedTime}` : "Not selected"}</span>
              </div>
              
              <hr className="border-zinc-100 my-2" />

              <div className="flex justify-between items-center">
                <span>Subtotal Rate</span>
                <span className="text-zinc-800 font-extrabold">₹{subtotal}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Booking Fee</span>
                <span className="text-zinc-800 font-extrabold">₹{convenienceFee}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between items-center text-emerald-500">
                  <span>Discount ({discount}%)</span>
                  <span className="font-extrabold">-₹{discountAmount}</span>
                </div>
              )}

              <hr className="border-zinc-150 my-2" />

              <div className="flex justify-between items-end text-zinc-850">
                <span className="font-extrabold text-sm">Total Payable</span>
                <span className="font-extrabold text-2xl text-primary leading-none">₹{totalAmount}</span>
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
