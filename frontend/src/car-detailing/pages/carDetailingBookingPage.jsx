import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, Package, Calendar, MapPin, Sparkles, ShieldCheck, ChevronRight, ChevronLeft, HelpCircle, Lock, CreditCard, Smartphone, QrCode, Loader2, CheckCircle2, Check, Clock, Tag } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { PrimaryButton, SecondaryButton, FormInput, FormSelect, DatePicker, Toast } from '../components/carDetailingUI';
import { SERVICES, PACKAGES, OFFERS } from '../services/carDetailingApi';

const ADD_ONS = [
  { id: "add-engine", name: "Engine Bay Steam Clean", price: 1500, desc: "Safe degreasing and satin polish" },
  { id: "add-glass", name: "Rain-Repellent Windshield Shield", price: 800, desc: "Aero-nano coating for monsoon rains" },
  { id: "add-leather", name: "Fine Leather Nourish Wrap", price: 1200, desc: "Aloe-based deep cream leather massage" },
  { id: "add-light", name: "Oxidized Headlight Correct", price: 2500, desc: "Wet sanding + UV coating clarity" }
];

export default function CarDetailingBookingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState(1);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [formData, setFormData] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("card"); // card, upi, pod
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [upiId, setUpiId] = useState("");
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    defaultValues: {
      vehicleBrand: "",
      vehicleModel: "",
      vehicleType: "Sedan",
      vehicleNumber: "",
      serviceSelection: searchParams.get("service") || SERVICES[0].id,
      packageSelection: searchParams.get("package") || "none",
      bookingDate: new Date().toISOString().split('T')[0],
      bookingTime: "08:30 AM - 12:30 PM (Morning)",
      address: "",
      landmark: "",
      pincode: "",
      couponCode: searchParams.get("coupon") || "",
    }
  });

  const [selectedAddons, setSelectedAddons] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [toastOpen, setToastOpen] = useState(false);

  // Watch form fields for summary calculation
  const watchedService = watch("serviceSelection");
  const watchedPackage = watch("packageSelection");
  const watchedBrand = watch("vehicleBrand");
  const watchedModel = watch("vehicleModel");
  const watchedDate = watch("bookingDate");
  const watchedTime = watch("bookingTime");
  const watchedCoupon = watch("couponCode");

  // Load initial coupon from URL if present
  useEffect(() => {
    const urlCoupon = searchParams.get("coupon");
    if (urlCoupon) {
      handleApplyCoupon(urlCoupon);
    }
  }, [searchParams]);

  const toggleAddon = (addon) => {
    setSelectedAddons(prev =>
      prev.some(a => a.id === addon.id)
        ? prev.filter(a => a.id !== addon.id)
        : [...prev, addon]
    );
  };

  // Find prices
  const getBasePrice = () => {
    if (watchedPackage !== "none") {
      const p = PACKAGES.find(p => p.id === watchedPackage);
      return p ? p.price * 10 : 0; // Convert simulated dollar to rupees (scaled)
    } else {
      const s = SERVICES.find(s => s.id === watchedService);
      return s ? s.price * 10 : 0;
    }
  };

  const getAddonsTotal = () => {
    return selectedAddons.reduce((acc, a) => acc + a.price, 0);
  };

  const getSubtotal = () => {
    return getBasePrice() + getAddonsTotal();
  };

  const getTax = () => {
    return Math.round(getSubtotal() * 0.18); // 18% GST
  };

  const getFinalTotal = () => {
    const sub = getSubtotal() + getTax();
    return Math.max(0, sub - discount);
  };

  const handleApplyCoupon = (codeOverride) => {
    const code = codeOverride || watchedCoupon;
    if (!code) return;

    const offer = OFFERS.find(o => o.code.toUpperCase() === code.trim().toUpperCase());
    if (offer) {
      const sub = getSubtotal();
      if (sub >= offer.minAmount) {
        if (offer.type === "percentage") {
          setDiscount(Math.round((sub + getTax()) * (offer.value / 100)));
        } else {
          setDiscount(offer.value * 10); // scale flat rate
        }
        setAppliedCoupon(offer.code);
        setToastMsg(`Coupon "${offer.code}" applied successfully!`);
        setToastOpen(true);
      } else {
        setToastMsg(`Minimum amount for this coupon is ₹${offer.minAmount}`);
        setToastOpen(true);
      }
    } else {
      setToastMsg("Invalid coupon code.");
      setToastOpen(true);
    }
  };

  const handleRemoveCoupon = () => {
    setDiscount(0);
    setAppliedCoupon("");
    setValue("couponCode", "");
    setToastMsg("Coupon removed.");
    setToastOpen(true);
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const onSubmit = (data) => {
    setFormData(data);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setShowPaymentModal(false);
      
      const selectedItem = watchedPackage !== "none"
        ? PACKAGES.find(p => p.id === watchedPackage)?.name
        : SERVICES.find(s => s.id === watchedService)?.name;

      navigate('/car-detailing/success', {
        state: {
          bookingId: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
          vehicle: `${formData.vehicleBrand} ${formData.vehicleModel}`,
          item: selectedItem,
          date: formData.bookingDate,
          time: formData.bookingTime,
          price: getFinalTotal(),
          address: `${formData.address}, ${formData.landmark || ''} (Pin: ${formData.pincode})`
        }
      });
    }, 1500);
  };

  const stepsList = ["Vehicle", "Service Selection", "Date & Slots", "Add-ons", "Address", "Checkout"];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto space-y-8 text-zinc-800"
    >
      {/* Back Button */}
      <div className="flex items-center">
        <button
          onClick={() => navigate('/car-detailing')}
          className="flex items-center justify-center w-10 h-10 bg-white border border-zinc-200/80 rounded-full text-zinc-650 hover:bg-zinc-50 shadow-sm transition-all"
          aria-label="Back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Steps Indicator Progress Bar */}
      <div className="hidden md:flex justify-between items-center gap-2 bg-white border border-zinc-200/80 rounded-20 p-4 shadow-sm">
        {stepsList.map((sName, idx) => {
          const sNum = idx + 1;
          const isDone = sNum < step;
          const isActive = sNum === step;
          return (
            <div key={idx} className="flex items-center gap-2 flex-grow last:flex-grow-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                isDone ? 'bg-luxury-emerald text-white' : isActive ? 'bg-luxury-emerald/10 text-luxury-emerald border border-luxury-emerald/30 shadow-sm' : 'bg-zinc-50 border border-zinc-200 text-zinc-400'
              }`}>
                {isDone ? <CheckCircle2 className="w-5 h-5" /> : <span>{sNum}</span>}
              </div>
              <span className={`text-xs font-bold ${isActive ? 'text-luxury-emerald' : isDone ? 'text-zinc-700' : 'text-zinc-400'}`}>
                {sName}
              </span>
              {idx < stepsList.length - 1 && (
                <ChevronRight className="w-4 h-4 text-zinc-200 flex-grow" />
              )}
            </div>
          );
        })}
      </div>

      {/* Main Multi-step Form Content */}
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side Form inputs (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-zinc-200/85 rounded-24 p-6 md:p-8 space-y-6 shadow-premium min-h-[380px] flex flex-col justify-between">
          
          <AnimatePresence mode="wait">
            
            {/* Step 1: Vehicle Info */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5"
              >
                <h3 className="text-lg font-bold flex items-center gap-2 text-zinc-800">
                  <Car className="w-5 h-5 text-luxury-emerald" />
                  <span>1. Vehicle Information</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput
                    label="Brand Name"
                    name="vehicleBrand"
                    placeholder="e.g. BMW, Hyundai"
                    register={register}
                    errors={errors}
                    required
                  />
                  <FormInput
                    label="Model Name"
                    name="vehicleModel"
                    placeholder="e.g. M3, Verna"
                    register={register}
                    errors={errors}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormSelect
                    label="Vehicle Type"
                    name="vehicleType"
                    register={register}
                    errors={errors}
                    options={["Hatchback", "Sedan", "SUV", "Luxury / Sports"]}
                    required
                  />
                  <FormInput
                    label="Registration Number"
                    name="vehicleNumber"
                    placeholder="e.g. MP09AB1234"
                    register={register}
                    errors={errors}
                    required
                  />
                </div>
              </motion.div>
            )}

            {/* Step 2: Service/Package Selector */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-bold flex items-center gap-2 text-zinc-800">
                  <Package className="w-5 h-5 text-luxury-emerald" />
                  <span>2. Service Selection</span>
                </h3>

                {/* Choose Detailing Menu or Package */}
                <div className="space-y-5">
                  <FormSelect
                    label="Choose Individual Service"
                    name="serviceSelection"
                    register={register}
                    errors={errors}
                    options={SERVICES.map(s => ({ value: s.id, label: `${s.name} (₹${s.price * 10})` }))}
                    disabled={watchedPackage !== "none"}
                  />

                  <div className="flex items-center gap-2 my-2 text-zinc-400 text-xs font-semibold">
                    <span className="h-[1px] bg-zinc-200 flex-grow" />
                    <span>OR SELECT PACKAGE</span>
                    <span className="h-[1px] bg-zinc-200 flex-grow" />
                  </div>

                  <FormSelect
                    label="Choose Package"
                    name="packageSelection"
                    register={register}
                    errors={errors}
                    options={[
                      { value: "none", label: "-- Use Individual Service Instead --" },
                      ...PACKAGES.map(p => ({ value: p.id, label: `${p.name} (₹${p.price * 10})` }))
                    ]}
                  />
                </div>
              </motion.div>
            )}

            {/* Step 3: Date & Slots */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-bold flex items-center gap-2 text-zinc-800">
                  <Calendar className="w-5 h-5 text-luxury-emerald" />
                  <span>3. Booking Date & Time Slot</span>
                </h3>

                <DatePicker
                  value={watchedDate}
                  onChange={(dateStr) => setValue("bookingDate", dateStr)}
                />

                <div className="space-y-3.5">
                  <label className="text-sm font-semibold text-zinc-650 ml-1">Choose Time Slot</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {["08:30 AM - 12:30 PM (Morning)", "01:00 PM - 05:00 PM (Afternoon)"].map((slot, idx) => {
                      const isSelected = watchedTime === slot;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setValue("bookingTime", slot)}
                          className={`py-3.5 px-4 text-xs font-bold rounded-20 border transition-all ${
                            isSelected
                              ? 'bg-luxury-emerald border-luxury-emerald text-white'
                              : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 shadow-sm'
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Add-ons */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5"
              >
                <h3 className="text-lg font-bold flex items-center gap-2 text-zinc-800">
                  <Sparkles className="w-5 h-5 text-luxury-emerald" />
                  <span>4. Choose Optional Add-ons</span>
                </h3>
                <p className="text-xs text-zinc-500 font-semibold">Add these detailers specialties to complete your car preservation.</p>

                <div className="space-y-3">
                  {ADD_ONS.map((addon) => {
                    const isChecked = selectedAddons.some(a => a.id === addon.id);
                    return (
                      <div
                        key={addon.id}
                        onClick={() => toggleAddon(addon)}
                        className={`p-4 rounded-20 border cursor-pointer flex justify-between items-center transition-all shadow-sm ${
                          isChecked
                            ? 'bg-luxury-emerald/5 border-luxury-emerald'
                            : 'bg-white border-zinc-200 hover:border-zinc-300'
                        }`}
                      >
                        <div className="space-y-1">
                          <h4 className="font-bold text-sm text-zinc-800">{addon.name}</h4>
                          <p className="text-[11px] text-zinc-500 font-medium">{addon.desc}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-sm text-zinc-800">+₹{addon.price}</span>
                          <div className={`w-5 h-5 rounded-full border mt-1.5 flex items-center justify-center mx-auto transition-colors ${
                            isChecked ? 'bg-luxury-emerald border-luxury-emerald text-white' : 'border-zinc-300'
                          }`}>
                            {isChecked && <span className="text-[9px]">✔</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 5: Address Form */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5"
              >
                <h3 className="text-lg font-bold flex items-center gap-2 text-zinc-800">
                  <MapPin className="w-5 h-5 text-luxury-emerald" />
                  <span>5. Address & Landmark details</span>
                </h3>

                <FormInput
                  label="Detailed Street Address / Apartment"
                  name="address"
                  placeholder="e.g. House No. 204, Scheme No. 54"
                  register={register}
                  errors={errors}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput
                    label="Landmark (Optional)"
                    name="landmark"
                    placeholder="e.g. Near Vijay Nagar Police Station"
                    register={register}
                    errors={errors}
                  />
                  <FormInput
                    label="Pincode"
                    name="pincode"
                    placeholder="e.g. 452010"
                    register={register}
                    errors={errors}
                    required
                  />
                </div>
              </motion.div>
            )}

            {/* Step 6: Booking Summary & Final Coupon Check */}
            {step === 6 && (
              <motion.div
                key="step6"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-bold flex items-center gap-2 text-zinc-800">
                  <ShieldCheck className="w-5 h-5 text-luxury-emerald" />
                  <span>6. Review & Checkout</span>
                </h3>

                {/* Info summary layout */}
                <div className="bg-zinc-50 border border-zinc-200 rounded-24 p-5 text-xs md:text-sm space-y-4 shadow-sm">
                  <div className="flex justify-between border-b border-zinc-150 pb-2">
                    <span className="text-zinc-500 font-semibold">Vehicle Model</span>
                    <strong className="text-zinc-800">{watchedBrand} {watchedModel}</strong>
                  </div>
                  <div className="flex justify-between border-b border-zinc-150 pb-2">
                    <span className="text-zinc-500 font-semibold">Scheduled slot</span>
                    <strong className="text-zinc-800">{watchedDate} @ {watchedTime}</strong>
                  </div>
                  <div className="flex justify-between border-b border-zinc-150 pb-2">
                    <span className="text-zinc-500 font-semibold">Detailing Choice</span>
                    <strong className="text-zinc-800">
                      {watchedPackage !== "none"
                        ? PACKAGES.find(p => p.id === watchedPackage)?.name
                        : SERVICES.find(s => s.id === watchedService)?.name}
                    </strong>
                  </div>
                  
                  {selectedAddons.length > 0 && (
                    <div className="flex justify-between border-b border-zinc-150 pb-2">
                      <span className="text-zinc-500 font-semibold">Add-ons Selected</span>
                      <span className="text-right text-zinc-800 font-bold">
                        {selectedAddons.map(a => a.name).join(", ")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Coupon Code section */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 ml-1">Have a Coupon Code?</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="e.g. DETAIL20"
                      {...register("couponCode")}
                      disabled={!!appliedCoupon}
                      className="flex-grow py-3 px-4 bg-white border border-zinc-200 rounded-20 outline-none focus:border-luxury-emerald text-sm uppercase text-zinc-800 font-semibold"
                    />
                    {appliedCoupon ? (
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="py-3 px-5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-20 shadow-sm"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon()}
                        className="py-3 px-5 bg-luxury-emerald hover:bg-luxury-emeraldHover text-white text-xs font-bold rounded-20 shadow-sm"
                      >
                        Apply
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Navigation Controls buttons */}
          <div className="flex gap-4 border-t border-zinc-100 pt-6 mt-6">
            {step > 1 && (
              <SecondaryButton onClick={prevStep} className="w-1/2">
                <ChevronLeft className="w-5 h-5 mr-1" />
                <span>Back</span>
              </SecondaryButton>
            )}

            {step < 6 ? (
              <PrimaryButton onClick={nextStep} className={step === 1 ? 'w-full' : 'w-1/2'} icon={<ChevronRight className="w-5 h-5" />}>
                <span>Continue</span>
              </PrimaryButton>
            ) : (
              <PrimaryButton type="submit" className="w-1/2" icon={<ShieldCheck className="w-5 h-5" />}>
                <span>Confirm Booking</span>
              </PrimaryButton>
            )}
          </div>

        </div>

        {/* Right Side Order Summary panel (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-24 p-6 md:p-8 space-y-6 shadow-premium sticky top-24">
          <h3 className="text-lg font-bold flex items-center gap-2 border-b border-zinc-100 pb-3 text-zinc-800">
            <span>Price Summary</span>
          </h3>

          <div className="space-y-4 text-xs md:text-sm text-zinc-600 font-semibold">
            <div className="flex justify-between">
              <span>Detailing Base Price</span>
              <span className="text-zinc-800">₹{getBasePrice()}</span>
            </div>

            {selectedAddons.length > 0 && (
              <div className="flex justify-between">
                <span>Add-ons Total</span>
                <span className="text-zinc-800">+₹{getAddonsTotal()}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>GST Tax (18%)</span>
              <span className="text-zinc-800">₹{getTax()}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-luxury-emerald font-bold">
                <span>Coupon Discount</span>
                <span>-₹{discount}</span>
              </div>
            )}

            <div className="border-t border-zinc-100 pt-4 flex justify-between items-center text-zinc-800">
              <span className="text-sm font-bold">Total Amount</span>
              <span className="text-2xl font-extrabold text-luxury-emerald">₹{getFinalTotal()}</span>
            </div>
          </div>

          {/* Secure Guarantee label */}
          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-20 flex gap-2.5 items-start text-xs text-zinc-500 leading-relaxed font-semibold">
            <HelpCircle className="w-5 h-5 text-luxury-emerald flex-shrink-0 mt-0.5" />
            <span>
              All bookings are secure. Pay online or choose Pay on Detailing (Cash/UPI) post completion. Free cancel up to 24 hours.
            </span>
          </div>

        </div>

      </form>

      {/* Secure Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white border border-zinc-200 rounded-24 p-6 sm:p-8 max-w-md w-full shadow-2xl relative overflow-hidden flex flex-col justify-between"
            >
              {isProcessing ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
                  <Loader2 className="w-12 h-12 text-luxury-emerald animate-spin" />
                  <h3 className="text-xl font-extrabold text-zinc-800">Processing Payment</h3>
                  <p className="text-sm text-zinc-500 font-semibold max-w-xs">
                    Please do not close this window or refresh the page while we authenticate your transaction with your bank...
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-zinc-800">
                      <Lock className="w-5 h-5 text-luxury-emerald" />
                      <span>Secure Payment Gateway</span>
                    </h3>
                    <button
                      onClick={() => setShowPaymentModal(false)}
                      className="text-zinc-450 hover:text-zinc-600 text-sm font-bold p-1"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Pricing summary */}
                  <div className="bg-luxury-emerald/5 border border-luxury-emerald/10 rounded-20 p-4 flex justify-between items-center">
                    <span className="text-sm text-zinc-600 font-bold">Total Amount (INR)</span>
                    <span className="text-2xl font-extrabold text-luxury-emerald">₹{getFinalTotal()}</span>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("card")}
                      className={`py-2 px-3 border rounded-16 text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                        paymentMethod === "card"
                          ? "border-luxury-emerald bg-luxury-emerald/5 text-luxury-emerald"
                          : "border-zinc-200 text-zinc-500 bg-white"
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Card</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("upi")}
                      className={`py-2 px-3 border rounded-16 text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                        paymentMethod === "upi"
                          ? "border-luxury-emerald bg-luxury-emerald/5 text-luxury-emerald"
                          : "border-zinc-200 text-zinc-500 bg-white"
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>UPI / QR</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("pod")}
                      className={`py-2 px-3 border rounded-16 text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                        paymentMethod === "pod"
                          ? "border-luxury-emerald bg-luxury-emerald/5 text-luxury-emerald"
                          : "border-zinc-200 text-zinc-500 bg-white"
                      }`}
                    >
                      <MapPin className="w-4 h-4" />
                      <span>Pay Later</span>
                    </button>
                  </div>

                  {/* Forms based on method */}
                  <div className="space-y-4 pt-2 border-t border-zinc-100 min-h-[160px] flex flex-col justify-center">
                    {paymentMethod === "card" && (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase ml-1">Card Number</label>
                          <input
                            type="text"
                            placeholder="4111 2222 3333 4444"
                            maxLength={19}
                            value={cardNumber}
                            onChange={(e) => {
                              const v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                              const matches = v.match(/\d{4,16}/g);
                              const match = matches && matches[0] || '';
                              const parts = [];
                              for (let i=0, len=match.length; i<len; i+=4) {
                                parts.push(match.substring(i, i+4));
                              }
                              if (parts.length > 0) {
                                setCardNumber(parts.join(' '));
                              } else {
                                setCardNumber(v);
                              }
                            }}
                            className="w-full py-3 px-4 bg-zinc-50 border border-zinc-200 rounded-16 outline-none focus:border-luxury-emerald text-sm text-zinc-800 font-semibold"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase ml-1">Expiry Date</label>
                            <input
                              type="text"
                              placeholder="MM/YY"
                              maxLength={5}
                              value={cardExpiry}
                              onChange={(e) => {
                                const v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                                if (v.length >= 2) {
                                  setCardExpiry(v.substring(0,2) + '/' + v.substring(2,4));
                                } else {
                                  setCardExpiry(v);
                                }
                              }}
                              className="w-full py-3 px-4 bg-zinc-50 border border-zinc-200 rounded-16 outline-none focus:border-luxury-emerald text-sm text-zinc-800 font-semibold"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase ml-1">CVV</label>
                            <input
                              type="password"
                              placeholder="123"
                              maxLength={3}
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value.replace(/[^0-9]/gi, ''))}
                              className="w-full py-3 px-4 bg-zinc-50 border border-zinc-200 rounded-16 outline-none focus:border-luxury-emerald text-sm text-zinc-800 font-semibold"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentMethod === "upi" && (
                      <div className="space-y-4 flex flex-col items-center">
                        <div className="space-y-1 w-full">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase ml-1">UPI ID</label>
                          <input
                            type="text"
                            placeholder="username@upi"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            className="w-full py-3 px-4 bg-zinc-50 border border-zinc-200 rounded-16 outline-none focus:border-luxury-emerald text-sm text-zinc-800 font-semibold"
                          />
                        </div>
                        <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 rounded-20 p-3 w-full">
                          <QrCode className="w-10 h-10 text-luxury-emerald flex-shrink-0" />
                          <div className="text-[10px] sm:text-xs font-semibold text-zinc-500">
                            Or scan the dynamic QR code during checkout. Confirm booking after complete scanning.
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentMethod === "pod" && (
                      <div className="text-center p-4 bg-zinc-50 border border-zinc-200 rounded-20 space-y-1.5">
                        <h4 className="font-bold text-sm text-zinc-800">Pay on Detailing (POD)</h4>
                        <p className="text-xs text-zinc-500 leading-relaxed font-semibold">
                          Book now and pay via UPI, Card, or Cash on site once the detailing is completed by our technician.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer CTAs */}
                  <div className="flex gap-4 border-t border-zinc-150 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowPaymentModal(false)}
                      className="w-1/2 py-3.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-bold rounded-20 text-xs sm:text-sm shadow-sm transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handlePaymentSuccess}
                      className="w-1/2 py-3.5 bg-luxury-emerald hover:bg-luxury-emeraldHover text-white font-bold rounded-20 text-xs sm:text-sm shadow-premium transition-all"
                    >
                      {paymentMethod === "pod" ? "Confirm Booking" : "Pay & Confirm"}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback Toast */}
      <Toast
        isOpen={toastOpen}
        onClose={() => setToastOpen(false)}
        message={toastMsg}
        type={toastMsg.includes("success") || toastMsg.includes("removed") ? "success" : "warning"}
      />

    </motion.div>
  );
}
