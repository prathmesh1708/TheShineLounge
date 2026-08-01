import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, Package, MapPin, ShieldCheck, ChevronRight, ChevronLeft, HelpCircle, Lock, CreditCard, Smartphone, QrCode, Loader2, CheckCircle2, Check, Tag } from 'lucide-react';
import { useForm } from 'react-hook-form';
import apiClient from '../../common/utils/apiClient';

import { PrimaryButton, SecondaryButton, FormInput, FormSelect, Toast } from '../components/carDetailingUI';
import CarDetailingPaymentGateway from '../components/carDetailingPaymentGateway';
import { SERVICES, PACKAGES, OFFERS, addBooking, getVehicleTypes, saveVehicleType } from '../services/carDetailingApi';

export default function CarDetailingBookingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState(1);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [formData, setFormData] = useState(null);
  const [vehicleTypes, setVehicleTypes] = useState(getVehicleTypes());

  useEffect(() => {
    const syncTypes = () => setVehicleTypes(getVehicleTypes());
    window.addEventListener('carDetailingVehicleTypesChanged', syncTypes);
    return () => window.removeEventListener('carDetailingVehicleTypesChanged', syncTypes);
  }, []);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    defaultValues: {
      vehicleBrand: "",
      vehicleModel: "",
      vehicleType: "Sedan",
      customVehicleType: "",
      vehicleNumber: "",
      serviceSelection: searchParams.get("service") || SERVICES[0].id,
      packageSelection: searchParams.get("package") || "none",
      address: "",
      landmark: "",
      pincode: "",
      couponCode: searchParams.get("coupon") || "",
    }
  });

  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [toastOpen, setToastOpen] = useState(false);

  // Watch form fields for summary calculation
  const watchedService = watch("serviceSelection");
  const watchedPackage = watch("packageSelection");
  const watchedBrand = watch("vehicleBrand");
  const watchedModel = watch("vehicleModel");
  const watchedVehicleType = watch("vehicleType");
  const watchedCoupon = watch("couponCode");

  // Load initial coupon from URL if present
  useEffect(() => {
    const urlCoupon = searchParams.get("coupon");
    if (urlCoupon) {
      handleApplyCoupon(urlCoupon);
    }
  }, [searchParams]);

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

  const getSubtotal = () => {
    return getBasePrice();
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
    const effectiveVehicleType = data.vehicleType === "Other" && data.customVehicleType
      ? data.customVehicleType.trim()
      : data.vehicleType;

    if (data.vehicleType === "Other" && data.customVehicleType?.trim()) {
      saveVehicleType(data.customVehicleType.trim());
    }

    const processedData = {
      ...data,
      vehicleType: effectiveVehicleType
    };

    setFormData(processedData);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async (paymentResult = {}) => {
    const selectedItem = watchedPackage !== "none"
      ? PACKAGES.find(p => p.id === watchedPackage)?.name
      : SERVICES.find(s => s.id === watchedService)?.name;

    const generatedBookingId = `BK-${Math.floor(1000 + Math.random() * 9000)}`;

    const totalFinal = getFinalTotal();
    const isDeposit = paymentResult.paymentOption === "deposit";
    const depositAmount = paymentResult.paidAmount || (isDeposit ? Math.round(totalFinal * 0.25) : totalFinal);
    const remainingAmount = paymentResult.remainingAmount || (isDeposit ? totalFinal - depositAmount : 0);
    const paymentStatusText = paymentResult.paymentStatus || (isDeposit ? "Deposit Paid" : "Fully Paid");

    const bookingObject = {
      id: generatedBookingId,
      package: selectedItem || 'Paint Protection Film (PPF)',
      price: totalFinal,
      paymentType: paymentStatusText,
      depositAmount: depositAmount,
      remainingAmount: remainingAmount,
      paymentStatus: paymentStatusText,
      customerName: formData?.fullName || 'Car Owner',
      vehicle: `${formData?.vehicleBrand || ''} ${formData?.vehicleModel || ''}`.trim() || 'Vehicle',
      vehicleNo: formData?.vehicleNumber || 'MP-09-AB-1234',
      vehicleType: formData?.vehicleType || 'Sedan',
      location: `${formData?.address || ''}, ${formData?.landmark || ''} (Pin: ${formData?.pincode || ''})`,
    };

    // Save into localStorage persistent store
    await addBooking(bookingObject);

    const payload = {
      bookingId: generatedBookingId,
      serviceKey: 'car-detailing',
      serviceName: 'Car Detailing',
      packageName: selectedItem || 'Paint Protection Film (PPF)',
      price: totalFinal,
      customerName: formData?.fullName || 'Car Owner',
      customerEmail: formData?.email || '',
      vehicleNo: formData?.vehicleNumber || `${formData?.vehicleBrand || ''} ${formData?.vehicleModel || ''}`.trim() || 'MP-09-AB-1234',
      vehicleType: formData?.vehicleType || 'Car'
    };

    try {
      await apiClient.post('/bookings', payload);
    } catch (err) {
      console.warn('Error creating car detailing booking in DB:', err.message);
    }

    setShowPaymentModal(false);

    navigate('/car-detailing/success', {
      state: {
        bookingId: generatedBookingId,
        vehicle: `${formData?.vehicleBrand || ''} ${formData?.vehicleModel || ''}`,
        item: selectedItem,
        price: totalFinal,
        paidAmount: depositAmount,
        remainingAmount: remainingAmount,
        paymentStatus: paymentStatusText,
        address: `${formData?.address || ''}, ${formData?.landmark || ''} (Pin: ${formData?.pincode || ''})`
      }
    });
  };

  const stepsList = ["Vehicle", "Service Selection", "Address", "Checkout"];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto space-y-4 sm:space-y-6 text-zinc-800"
    >
      {/* Header Bar with Back Button */}
      <div className="flex items-center justify-between gap-3 bg-white border border-zinc-200/80 rounded-20 p-3.5 sm:p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/car-detailing')}
            className="flex items-center justify-center w-9 h-9 bg-zinc-50 border border-zinc-200 rounded-full text-zinc-700 hover:bg-zinc-100 transition-all shrink-0"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight leading-tight">
              Book Car Detailing
            </h1>
            <p className="text-[11px] text-zinc-400 font-semibold hidden sm:block">
              Showroom detailing treatment & customization
            </p>
          </div>
        </div>

        <span className="text-xs font-extrabold text-luxury-emerald bg-luxury-emerald/10 px-3 py-1 rounded-full border border-luxury-emerald/20 shrink-0">
          Step {step} of 4: {stepsList[step - 1]}
        </span>
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
                    options={[...vehicleTypes, "Other"]}
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

                {watchedVehicleType === "Other" && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-20 space-y-2"
                  >
                    <FormInput
                      label="Specify Custom Vehicle Type"
                      name="customVehicleType"
                      placeholder="e.g. Pickup Truck, Convertible, Off-Road 4x4, Van"
                      register={register}
                      errors={errors}
                      required
                    />
                    <p className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                      <span>💡 This vehicle type will be saved with your booking and registered for detailers & admin management.</span>
                    </p>
                  </motion.div>
                )}
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

            {/* Step 3: Address Form */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5"
              >
                <h3 className="text-lg font-bold flex items-center gap-2 text-zinc-800">
                  <MapPin className="w-5 h-5 text-luxury-emerald" />
                  <span>3. Address & Landmark details</span>
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
                    label="Landmark"
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

            {/* Step 4: Booking Summary & Final Coupon Check */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-bold flex items-center gap-2 text-zinc-800">
                  <ShieldCheck className="w-5 h-5 text-luxury-emerald" />
                  <span>4. Review & Checkout</span>
                </h3>

                {/* Info summary layout */}
                <div className="bg-zinc-50 border border-zinc-200 rounded-24 p-5 text-xs md:text-sm space-y-4 shadow-sm">
                  <div className="flex justify-between border-b border-zinc-150 pb-2">
                    <span className="text-zinc-500 font-semibold">Vehicle Model</span>
                    <strong className="text-zinc-800">{watchedBrand} {watchedModel}</strong>
                  </div>
                  <div className="flex justify-between border-b border-zinc-150 pb-2">
                    <span className="text-zinc-500 font-semibold">Detailing Choice</span>
                    <strong className="text-zinc-800">
                      {watchedPackage !== "none"
                        ? PACKAGES.find(p => p.id === watchedPackage)?.name
                        : SERVICES.find(s => s.id === watchedService)?.name}
                    </strong>
                  </div>
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

            {step < 4 ? (
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

      {/* Responsive Payment Gateway Modal */}
      <CarDetailingPaymentGateway
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        totalAmount={getFinalTotal()}
        bookingDetails={{
          item: watchedPackage !== "none"
            ? PACKAGES.find(p => p.id === watchedPackage)?.name
            : SERVICES.find(s => s.id === watchedService)?.name
        }}
        onPaymentSuccess={handlePaymentSuccess}
      />

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
