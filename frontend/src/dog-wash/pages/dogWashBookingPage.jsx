import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Package, Calendar, MapPin, Sparkles, ShieldCheck, ChevronRight, ChevronLeft, HelpCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { PrimaryButton, SecondaryButton, FormInput, FormSelect, DatePicker, Toast } from '../components/dogWashUI';
import { SERVICES, PACKAGES, OFFERS, MOCK_PETS } from '../services/dogWashApi';

const ADD_ONS = [
  { id: "add-deshed", name: "De-Shedding Blowout Rake", price: 10, desc: "High-velocity blowout + undercoat blast" },
  { id: "add-flea", name: "Citrus Medicated Flea Rinse", price: 8, desc: "EPA citrus pest removal rinse" },
  { id: "add-face", name: "Blueberry Face Tear Scrub", price: 5, desc: "Tearless organic facial tear stain clean" },
  { id: "add-paw", name: "Organic Paws Balm Massage", price: 6, desc: "Wax soothing pads protection massage" }
];

export default function DogWashBookingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState(1);
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    defaultValues: {
      selectedPet: MOCK_PETS[0].id,
      serviceSelection: searchParams.get("service") || SERVICES[0].id,
      packageSelection: searchParams.get("package") || "none",
      bookingDate: new Date().toISOString().split('T')[0],
      bookingTime: "09:00 AM - 11:30 AM (Morning Slot)",
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

  const getBasePrice = () => {
    if (watchedPackage !== "none") {
      const p = PACKAGES.find(p => p.id === watchedPackage);
      return p ? p.price : 0;
    } else {
      const s = SERVICES.find(s => s.id === watchedService);
      return s ? s.price : 0;
    }
  };

  const getAddonsTotal = () => {
    return selectedAddons.reduce((acc, a) => acc + a.price, 0);
  };

  const getSubtotal = () => {
    return getBasePrice() + getAddonsTotal();
  };

  const getFinalTotal = () => {
    const sub = getSubtotal();
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
          setDiscount(Math.round(sub * (offer.value / 100)));
        } else {
          setDiscount(offer.value);
        }
        setAppliedCoupon(offer.code);
        setToastMsg(`Coupon "${offer.code}" applied successfully!`);
        setToastOpen(true);
      } else {
        setToastMsg(`Minimum subtotal for this coupon is $${offer.minAmount}`);
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
    const selectedItem = watchedPackage !== "none"
      ? PACKAGES.find(p => p.id === watchedPackage)?.name
      : SERVICES.find(s => s.id === watchedService)?.name;
    const petObj = MOCK_PETS.find(p => p.id === data.selectedPet) || MOCK_PETS[0];

    navigate('/dog-wash/success', {
      state: {
        bookingId: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
        vehicle: `${petObj.name} (${petObj.breed})`,
        item: selectedItem,
        date: data.bookingDate,
        time: data.bookingTime,
        price: getFinalTotal(),
        address: `${data.address}, ${data.landmark || ''} (Pin: ${data.pincode})`
      }
    });
  };

  const watchedService = watch("serviceSelection");
  const watchedPackage = watch("packageSelection");
  const watchedPet = watch("selectedPet");
  const watchedDate = watch("bookingDate");
  const watchedTime = watch("bookingTime");
  const watchedCoupon = watch("couponCode");

  const stepsList = ["Select Pet", "Service Selection", "Date & Slots", "Add-ons", "Address", "Checkout"];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto space-y-8 text-zinc-800"
    >
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-855">Book Grooming Slot</h1>
        <p className="text-xs md:text-sm text-zinc-500 font-semibold mt-1">Configure your premium mobile dog wash appointment.</p>
      </div>

      {/* Desktop Indicator */}
      <div className="hidden md:flex justify-between items-center gap-2 bg-white border border-zinc-200/80 rounded-20 p-4 shadow-sm">
        {stepsList.map((sName, idx) => {
          const sNum = idx + 1;
          const isDone = sNum < step;
          const isActive = sNum === step;
          return (
            <div key={idx} className="flex items-center gap-2 flex-grow last:flex-grow-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                isDone ? 'bg-grooming-primary text-white' : isActive ? 'bg-grooming-primary/10 text-grooming-primary border border-grooming-primary/30 shadow-sm' : 'bg-zinc-50 border border-zinc-200 text-zinc-400'
              }`}>
                {isDone ? <span>✔</span> : <span>{sNum}</span>}
              </div>
              <span className={`text-xs font-bold ${isActive ? 'text-grooming-primary' : isDone ? 'text-zinc-700' : 'text-zinc-405'}`}>
                {sName}
              </span>
              {idx < stepsList.length - 1 && (
                <ChevronRight className="w-4 h-4 text-zinc-200 flex-grow" />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile Indicator */}
      <div className="flex md:hidden justify-between items-center bg-white border border-zinc-200/80 rounded-20 p-4 shadow-sm">
        <span className="text-xs font-semibold text-zinc-400">Step {step} of 6</span>
        <span className="text-sm font-bold text-grooming-primary">{stepsList[step - 1]}</span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Form Inputs panel */}
        <div className="lg:col-span-7 bg-white border border-zinc-200/85 rounded-24 p-6 md:p-8 space-y-6 shadow-premium min-h-[380px] flex flex-col justify-between">
          
          <AnimatePresence mode="wait">
            
            {/* Step 1: Select Pet */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5"
              >
                <h3 className="text-lg font-bold flex items-center gap-2 text-zinc-800">
                  <Heart className="w-5 h-5 text-grooming-primary" />
                  <span>1. Select Pet Profile</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {MOCK_PETS.map((pet) => {
                    const isSelected = watchedPet === pet.id;
                    return (
                      <div
                        key={pet.id}
                        onClick={() => setValue("selectedPet", pet.id)}
                        className={`p-4 rounded-20 border cursor-pointer flex items-center gap-4 transition-all shadow-sm ${
                          isSelected ? 'bg-grooming-light/20 border-grooming-primary' : 'bg-white border-zinc-200 hover:border-zinc-300'
                        }`}
                      >
                        <img src={pet.avatar} alt={pet.name} className="w-12 h-12 rounded-full object-cover border border-zinc-200 flex-shrink-0" />
                        <div>
                          <h4 className="font-extrabold text-sm text-zinc-800">{pet.name}</h4>
                          <span className="text-[10px] text-zinc-500 font-bold block uppercase mt-0.5">{pet.breed} • {pet.weight}</span>
                        </div>
                      </div>
                    );
                  })}
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
                  <Package className="w-5 h-5 text-grooming-primary" />
                  <span>2. Service Selection</span>
                </h3>

                <div className="space-y-5">
                  <FormSelect
                    label="Choose Individual Service"
                    name="serviceSelection"
                    register={register}
                    errors={errors}
                    options={SERVICES.map(s => ({ value: s.id, label: `${s.name} ($${s.price})` }))}
                    disabled={watchedPackage !== "none"}
                  />

                  <div className="flex items-center gap-2 my-2 text-zinc-400 text-xs font-bold">
                    <span className="h-[1px] bg-zinc-200 flex-grow" />
                    <span>OR SELECT COMPLETE PACKAGE</span>
                    <span className="h-[1px] bg-zinc-200 flex-grow" />
                  </div>

                  <FormSelect
                    label="Choose Spa Package"
                    name="packageSelection"
                    register={register}
                    errors={errors}
                    options={[
                      { value: "none", label: "-- Use Individual Service Instead --" },
                      ...PACKAGES.map(p => ({ value: p.id, label: `${p.name} ($${p.price})` }))
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
                  <Calendar className="w-5 h-5 text-grooming-primary" />
                  <span>3. Booking Date & Slot</span>
                </h3>

                <DatePicker
                  value={watchedDate}
                  onChange={(dateStr) => setValue("bookingDate", dateStr)}
                />

                <div className="space-y-3.5">
                  <label className="text-sm font-semibold text-zinc-500 ml-1">Choose Time Slot</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {["09:00 AM - 11:30 AM (Morning Slot)", "01:30 PM - 04:00 PM (Afternoon Slot)"].map((slot, idx) => {
                      const isSelected = watchedTime === slot;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setValue("bookingTime", slot)}
                          className={`py-3.5 px-4 text-xs font-bold rounded-20 border transition-all ${
                            isSelected
                              ? 'bg-grooming-primary border-grooming-primary text-white'
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
                  <Sparkles className="w-5 h-5 text-grooming-primary" />
                  <span>4. Choose Groomers Specialties</span>
                </h3>

                <div className="space-y-3">
                  {ADD_ONS.map((addon) => {
                    const isChecked = selectedAddons.some(a => a.id === addon.id);
                    return (
                      <div
                        key={addon.id}
                        onClick={() => toggleAddon(addon)}
                        className={`p-4 rounded-20 border cursor-pointer flex justify-between items-center transition-all shadow-sm ${
                          isChecked
                            ? 'bg-grooming-light/5 border-grooming-primary'
                            : 'bg-white border-zinc-200 hover:border-zinc-300'
                        }`}
                      >
                        <div className="space-y-1">
                          <h4 className="font-bold text-sm text-zinc-850">{addon.name}</h4>
                          <p className="text-[11px] text-zinc-500 font-semibold">{addon.desc}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-sm text-zinc-850">+${addon.price}</span>
                          <div className={`w-5 h-5 rounded-full border mt-1.5 flex items-center justify-center mx-auto transition-colors ${
                            isChecked ? 'bg-grooming-primary border-grooming-primary text-white' : 'border-zinc-300'
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
                  <MapPin className="w-5 h-5 text-grooming-primary" />
                  <span>5. Mobile Van Location Address</span>
                </h3>

                <FormInput
                  label="Street Address / Residence Name"
                  name="address"
                  placeholder="e.g. Apt 104, Royal Palms"
                  register={register}
                  errors={errors}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput
                    label="Landmark (Optional)"
                    name="landmark"
                    placeholder="e.g. Behind Palasia Post Office"
                    register={register}
                    errors={errors}
                  />
                  <FormInput
                    label="Pincode"
                    name="pincode"
                    placeholder="e.g. 452001"
                    register={register}
                    errors={errors}
                    required
                  />
                </div>
              </motion.div>
            )}

            {/* Step 6: Review & Checkout */}
            {step === 6 && (
              <motion.div
                key="step6"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-bold flex items-center gap-2 text-zinc-800">
                  <ShieldCheck className="w-5 h-5 text-grooming-primary" />
                  <span>6. Review & Checkout</span>
                </h3>

                <div className="bg-zinc-50 border border-zinc-200 rounded-24 p-5 text-xs md:text-sm space-y-4 shadow-sm font-semibold text-zinc-650">
                  <div className="flex justify-between border-b border-zinc-150 pb-2">
                    <span>Pet Scheduled</span>
                    <strong className="text-zinc-850">{MOCK_PETS.find(p => p.id === watchedPet)?.name}</strong>
                  </div>
                  <div className="flex justify-between border-b border-zinc-150 pb-2">
                    <span>Scheduled Slot</span>
                    <strong className="text-zinc-850">{watchedDate} @ {watchedTime}</strong>
                  </div>
                  <div className="flex justify-between border-b border-zinc-150 pb-2">
                    <span>Selected Grooming</span>
                    <strong className="text-zinc-855">
                      {watchedPackage !== "none"
                        ? PACKAGES.find(p => p.id === watchedPackage)?.name
                        : SERVICES.find(s => s.id === watchedService)?.name}
                    </strong>
                  </div>
                  
                  {selectedAddons.length > 0 && (
                    <div className="flex justify-between border-b border-zinc-150 pb-2">
                      <span>Add-ons Selected</span>
                      <span className="text-right text-zinc-855 font-bold">
                        {selectedAddons.map(a => a.name).join(", ")}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 ml-1">Promo Coupon Code</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="e.g. FIRSTPAW15"
                      {...register("couponCode")}
                      disabled={!!appliedCoupon}
                      className="flex-grow py-3 px-4 bg-white border border-zinc-200 rounded-20 outline-none focus:border-grooming-primary text-sm uppercase text-zinc-850 font-bold"
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
                        className="py-3 px-5 bg-grooming-primary hover:bg-grooming-hover text-white text-xs font-bold rounded-20 shadow-sm"
                      >
                        Apply
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Navigation buttons */}
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

        {/* Right Summary panel */}
        <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-24 p-6 md:p-8 space-y-6 shadow-premium sticky top-24">
          <h3 className="text-lg font-bold flex items-center gap-2 border-b border-zinc-100 pb-3 text-zinc-800">
            <span>Price Summary</span>
          </h3>

          <div className="space-y-4 text-xs md:text-sm text-zinc-600 font-bold">
            <div className="flex justify-between">
              <span>Base Grooming Price</span>
              <span className="text-zinc-850">${getBasePrice()}</span>
            </div>

            {selectedAddons.length > 0 && (
              <div className="flex justify-between">
                <span>Add-ons Total</span>
                <span className="text-zinc-850">+${getAddonsTotal()}</span>
              </div>
            )}

            {discount > 0 && (
              <div className="flex justify-between text-grooming-primary font-bold">
                <span>Coupon Discount</span>
                <span>-${discount}</span>
              </div>
            )}

            <div className="border-t border-zinc-100 pt-4 flex justify-between items-center text-zinc-800">
              <span className="text-sm font-bold">Total Amount</span>
              <span className="text-2xl font-extrabold text-grooming-primary">${getFinalTotal()}</span>
            </div>
          </div>

          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-20 flex gap-2.5 items-start text-xs text-zinc-500 leading-relaxed font-semibold">
            <HelpCircle className="w-5 h-5 text-grooming-primary flex-shrink-0 mt-0.5" />
            <span>
              All bookings are secure. Pay online or choose Pay on Detailing (Cash/UPI) post completion. Free cancel up to 24 hours.
            </span>
          </div>

        </div>

      </form>

      <Toast
        isOpen={toastOpen}
        onClose={() => setToastOpen(false)}
        message={toastMsg}
        type={toastMsg.includes("success") || toastMsg.includes("removed") ? "success" : "warning"}
      />

    </motion.div>
  );
}
