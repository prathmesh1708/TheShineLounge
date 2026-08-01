import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, CreditCard, Smartphone, QrCode, MapPin, Building2, ShieldCheck, ArrowRight, X, Copy, Check } from 'lucide-react';

export default function CarDetailingPaymentGateway({
  isOpen,
  onClose,
  totalAmount = 0,
  bookingDetails = {},
  onPaymentSuccess
}) {
  const [paymentOption, setPaymentOption] = useState("full"); // "full" or "deposit"
  const [paymentMethod, setPaymentMethod] = useState("card"); // "card", "upi", "netbanking", "pod"
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0); // 0: connecting, 1: authenticating, 2: success

  // Form states
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [upiId, setUpiId] = useState("");
  const [selectedBank, setSelectedBank] = useState("HDFC");
  const [showQrCode, setShowQrCode] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const depositAmount = Math.round(totalAmount * 0.25);
  const remainingAmount = totalAmount - depositAmount;
  const payableAmount = paymentOption === "deposit" ? depositAmount : totalAmount;

  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    const formatted = raw.match(/.{1,4}/g)?.join(' ').substr(0, 19) || '';
    setCardNumber(formatted);
    setErrorMsg("");
  };

  const handleExpiryChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    let formatted = raw;
    if (raw.length >= 2) {
      formatted = raw.substr(0, 2) + '/' + raw.substr(2, 2);
    }
    setCardExpiry(formatted.substr(0, 5));
    setErrorMsg("");
  };

  const handleCvvChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').substr(0, 4);
    setCardCvv(raw);
    setErrorMsg("");
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText("tsl.detailing@icici");
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleConfirmPay = () => {
    // Basic validation
    if (paymentMethod === "card") {
      if (cardNumber.replace(/\s/g, '').length < 15) {
        setErrorMsg("Please enter a valid 16-digit card number.");
        return;
      }
      if (cardExpiry.length < 5) {
        setErrorMsg("Please enter card expiry date (MM/YY).");
        return;
      }
      if (cardCvv.length < 3) {
        setErrorMsg("Please enter a valid CVV code.");
        return;
      }
    } else if (paymentMethod === "upi" && !showQrCode && !upiId.trim()) {
      setErrorMsg("Please enter a valid UPI ID (e.g. name@upi).");
      return;
    }

    setErrorMsg("");
    setIsProcessing(true);
    setProcessingStep(0);

    setTimeout(() => setProcessingStep(1), 1200);
    setTimeout(() => setProcessingStep(2), 2400);

    setTimeout(() => {
      setIsProcessing(false);
      if (onPaymentSuccess) {
        onPaymentSuccess({
          paymentOption,
          paymentMethod,
          paidAmount: payableAmount,
          remainingAmount: paymentOption === "deposit" ? remainingAmount : 0,
          paymentStatus: paymentOption === "deposit" ? "Deposit Paid" : "Fully Paid"
        });
      }
    }, 3200);
  };

  // Card brand detector
  const getCardBrand = () => {
    const clean = cardNumber.replace(/\s/g, '');
    if (clean.startsWith('4')) return 'VISA';
    if (/^5[1-5]/.test(clean)) return 'MASTERCARD';
    if (/^6[0245]/.test(clean)) return 'RUPAY';
    if (/^3[47]/.test(clean)) return 'AMEX';
    return 'CARD';
  };

  return (
    <AnimatePresence>
      {/* High z-index wrapper (z-[9999]) so it sits strictly on top of all bottom navigation bars */}
      <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-zinc-950/80 backdrop-blur-md overflow-hidden pb-16 sm:pb-0">
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.96 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className="bg-white border border-zinc-200/90 w-full max-w-lg md:max-w-xl rounded-t-[32px] sm:rounded-[32px] h-[86vh] sm:h-auto sm:max-h-[88vh] shadow-2xl relative flex flex-col justify-between overflow-hidden text-zinc-800"
        >
          {/* Header Bar - Fixed Top */}
          <div className="flex-shrink-0 bg-white p-4 sm:p-6 border-b border-zinc-150 rounded-t-[32px]">
            {/* Mobile Handle Indicator */}
            <div className="w-12 h-1 bg-zinc-300 rounded-full mx-auto mb-3 sm:hidden" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-20 sm:rounded-24 bg-luxury-emerald/10 text-luxury-emerald flex items-center justify-center flex-shrink-0 shadow-sm border border-luxury-emerald/20">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-xl font-black text-zinc-900 tracking-tight leading-tight">
                    Checkout Payment Gateway
                  </h3>
                  <span className="text-[10px] sm:text-[11px] text-zinc-400 font-semibold flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-luxury-emerald" />
                    256-Bit SSL Encrypted & PCI-DSS Safe
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {isProcessing ? (
            /* Processing Animation Screen */
            <div className="flex-1 py-12 px-6 flex flex-col items-center justify-center space-y-6 text-center overflow-y-auto">
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
                  className="w-20 h-20 rounded-full border-4 border-luxury-emerald/20 border-t-luxury-emerald"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Lock className="w-8 h-8 text-luxury-emerald" />
                </div>
              </div>

              <div className="space-y-2 max-w-sm">
                <h3 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
                  {processingStep === 0 && "Connecting to Secure Gateway"}
                  {processingStep === 1 && "Authenticating 3D Secure / OTP"}
                  {processingStep === 2 && "Payment Approved!"}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-500 font-medium leading-relaxed">
                  {processingStep < 2
                    ? "Please do not refresh or close this screen while we verify transaction credentials with bank server..."
                    : "Redirecting to your confirmed detailing appointment summary..."}
                </p>
              </div>

              <div className="w-full max-w-xs bg-zinc-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-zinc-200">
                <motion.div
                  className="bg-gradient-to-r from-emerald-500 to-luxury-emerald h-full rounded-full"
                  initial={{ width: "15%" }}
                  animate={{ width: processingStep === 0 ? "40%" : processingStep === 1 ? "80%" : "100%" }}
                  transition={{ duration: 0.8 }}
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono font-bold pt-2">
                <ShieldCheck className="w-4 h-4 text-luxury-emerald" />
                <span>Banking Grade Security</span>
              </div>
            </div>
          ) : (
            /* Scrollable Form Body */
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6 overscroll-contain">
              
              {/* 1. Payment Plan Selection (Full vs 25% Advance) */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-extrabold text-zinc-650 uppercase tracking-wider block">
                    1. Choose Payment Plan
                  </label>
                  <span className="text-[10px] text-luxury-emerald font-extrabold bg-luxury-emerald/10 px-2 py-0.5 rounded-full border border-luxury-emerald/20">
                    Flexible Checkout
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentOption("full")}
                    className={`p-3.5 sm:p-4 rounded-24 border text-left transition-all relative ${
                      paymentOption === "full"
                        ? 'bg-luxury-emerald/10 border-luxury-emerald ring-2 ring-luxury-emerald/20 shadow-sm'
                        : 'bg-white border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-zinc-700">Full Payment</span>
                      {paymentOption === "full" && (
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-luxury-emerald text-white flex items-center justify-center text-xs font-bold shadow-sm">
                          ✓
                        </div>
                      )}
                    </div>
                    <span className="text-lg sm:text-xl font-black text-luxury-emerald block mt-1 font-mono">
                      ₹{totalAmount.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] text-zinc-400 font-medium block">100% Instant Settlement</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentOption("deposit")}
                    className={`p-3.5 sm:p-4 rounded-24 border text-left transition-all relative ${
                      paymentOption === "deposit"
                        ? 'bg-luxury-emerald/10 border-luxury-emerald ring-2 ring-luxury-emerald/20 shadow-sm'
                        : 'bg-white border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-zinc-700">25% Advance Deposit</span>
                      {paymentOption === "deposit" && (
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-luxury-emerald text-white flex items-center justify-center text-xs font-bold shadow-sm">
                          ✓
                        </div>
                      )}
                    </div>
                    <span className="text-lg sm:text-xl font-black text-luxury-emerald block mt-1 font-mono">
                      ₹{depositAmount.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] text-zinc-400 font-medium block">
                      Bal: ₹{remainingAmount.toLocaleString('en-IN')} post detailing
                    </span>
                  </button>
                </div>
              </div>

              {/* Total Payable Summary Banner */}
              <div className="p-4 bg-gradient-to-r from-zinc-900 to-zinc-800 text-white rounded-24 flex justify-between items-center shadow-lg">
                <div>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                    {paymentOption === "deposit" ? "Payable Now (25% Deposit)" : "Payable Now (Full Amount)"}
                  </span>
                  <span className="text-xs font-bold text-zinc-200 block truncate max-w-[180px] sm:max-w-xs mt-0.5">
                    {bookingDetails.item || 'Premium Detailing Treatment'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xl sm:text-3xl font-black text-emerald-400 font-mono">
                    ₹{payableAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* 2. Select Payment Mode */}
              <div className="space-y-2.5">
                <label className="text-xs font-extrabold text-zinc-650 uppercase tracking-wider block">
                  2. Choose Payment Mode
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => { setPaymentMethod("card"); setErrorMsg(""); }}
                    className={`py-3 px-3 rounded-20 border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5 ${
                      paymentMethod === "card"
                        ? "border-luxury-emerald bg-luxury-emerald/10 text-luxury-emerald shadow-sm ring-1 ring-luxury-emerald/30"
                        : "border-zinc-200 text-zinc-600 bg-white hover:bg-zinc-50"
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setPaymentMethod("upi"); setErrorMsg(""); }}
                    className={`py-3 px-3 rounded-20 border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5 ${
                      paymentMethod === "upi"
                        ? "border-luxury-emerald bg-luxury-emerald/10 text-luxury-emerald shadow-sm ring-1 ring-luxury-emerald/30"
                        : "border-zinc-200 text-zinc-600 bg-white hover:bg-zinc-50"
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>UPI / QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setPaymentMethod("netbanking"); setErrorMsg(""); }}
                    className={`py-3 px-3 rounded-20 border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5 ${
                      paymentMethod === "netbanking"
                        ? "border-luxury-emerald bg-luxury-emerald/10 text-luxury-emerald shadow-sm ring-1 ring-luxury-emerald/30"
                        : "border-zinc-200 text-zinc-600 bg-white hover:bg-zinc-50"
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>NetBanking</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setPaymentMethod("pod"); setErrorMsg(""); }}
                    className={`py-3 px-3 rounded-20 border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5 ${
                      paymentMethod === "pod"
                        ? "border-luxury-emerald bg-luxury-emerald/10 text-luxury-emerald shadow-sm ring-1 ring-luxury-emerald/30"
                        : "border-zinc-200 text-zinc-600 bg-white hover:bg-zinc-50"
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                    <span>Pay Later</span>
                  </button>
                </div>
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-20 flex items-center gap-2">
                  <span>⚠️ {errorMsg}</span>
                </div>
              )}

              {/* 3. Form Content per Payment Method */}
              <div className="bg-zinc-50/80 border border-zinc-200/80 rounded-24 p-4 sm:p-5 min-h-[170px] flex flex-col justify-center">
                
                {/* CARD FORM */}
                {paymentMethod === "card" && (
                  <div className="space-y-4">
                    {/* Live Virtual Card Preview */}
                    <div className="bg-gradient-to-tr from-zinc-900 via-zinc-800 to-zinc-900 text-white rounded-20 p-4 shadow-md space-y-3 relative overflow-hidden border border-zinc-700/50">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase">THE SHINE LOUNGE CARD</span>
                        <span className="text-xs font-black font-mono tracking-wider text-emerald-400">{getCardBrand()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-5 bg-amber-400/80 rounded-md border border-amber-300 flex items-center justify-center">
                          <div className="w-4 h-3 border border-amber-600/50 rounded-sm" />
                        </div>
                        <span className="text-xs font-mono text-zinc-400">••••</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="font-mono text-sm sm:text-base tracking-wider font-bold text-zinc-100">
                          {cardNumber || "•••• •••• •••• ••••"}
                        </span>
                        <span className="font-mono text-xs text-zinc-300">
                          {cardExpiry || "MM/YY"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">Card Number</label>
                      <input
                        type="text"
                        placeholder="4532 1100 2290 8921"
                        maxLength={19}
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        className="w-full py-3 px-4 bg-white border border-zinc-200 rounded-16 outline-none focus:border-luxury-emerald text-sm font-mono text-zinc-850 font-bold shadow-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">Expiry Date</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          maxLength={5}
                          value={cardExpiry}
                          onChange={handleExpiryChange}
                          className="w-full py-3 px-4 bg-white border border-zinc-200 rounded-16 outline-none focus:border-luxury-emerald text-sm font-mono text-zinc-850 font-bold shadow-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">CVV Code</label>
                        <input
                          type="password"
                          placeholder="•••"
                          maxLength={4}
                          value={cardCvv}
                          onChange={handleCvvChange}
                          className="w-full py-3 px-4 bg-white border border-zinc-200 rounded-16 outline-none focus:border-luxury-emerald text-sm font-mono text-zinc-850 font-bold shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* UPI & QR FORM */}
                {paymentMethod === "upi" && (
                  <div className="space-y-4">
                    <div className="flex bg-white p-1 border border-zinc-200 rounded-16 text-xs font-bold shadow-sm">
                      <button
                        type="button"
                        onClick={() => setShowQrCode(false)}
                        className={`w-1/2 py-2.5 rounded-12 transition-all ${!showQrCode ? 'bg-luxury-emerald text-white shadow-sm' : 'text-zinc-500'}`}
                      >
                        Enter UPI ID
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowQrCode(true)}
                        className={`w-1/2 py-2.5 rounded-12 transition-all ${showQrCode ? 'bg-luxury-emerald text-white shadow-sm' : 'text-zinc-500'}`}
                      >
                        Instant Scan QR
                      </button>
                    </div>

                    {!showQrCode ? (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">VPA / UPI Handle</label>
                          <input
                            type="text"
                            placeholder="mobile-number@upi / user@gpay"
                            value={upiId}
                            onChange={(e) => { setUpiId(e.target.value); setErrorMsg(""); }}
                            className="w-full py-3 px-4 bg-white border border-zinc-200 rounded-16 outline-none focus:border-luxury-emerald text-sm text-zinc-850 font-bold shadow-sm"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider block">One-Tap Quick App Suffixes:</span>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { label: "Google Pay", suffix: "@gpay", bg: "hover:bg-blue-50 hover:border-blue-300" },
                              { label: "PhonePe", suffix: "@ybl", bg: "hover:bg-purple-50 hover:border-purple-300" },
                              { label: "Paytm", suffix: "@paytm", bg: "hover:bg-sky-50 hover:border-sky-300" },
                              { label: "BHIM / ICICI", suffix: "@icici", bg: "hover:bg-orange-50 hover:border-orange-300" }
                            ].map((app) => (
                              <button
                                key={app.suffix}
                                type="button"
                                onClick={() => {
                                  const base = upiId.split('@')[0] || 'user';
                                  setUpiId(`${base}${app.suffix}`);
                                }}
                                className={`px-3 py-1.5 bg-white border border-zinc-200 text-zinc-700 text-xs font-bold rounded-14 transition-all shadow-sm ${app.bg}`}
                              >
                                {app.label} ({app.suffix})
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-24 border border-zinc-200 shadow-sm">
                        <div className="w-28 h-28 bg-zinc-950 rounded-20 p-2.5 flex items-center justify-center flex-shrink-0 shadow-md relative">
                          <QrCode className="w-full h-full text-white" />
                        </div>
                        <div className="space-y-2 text-center sm:text-left">
                          <span className="text-xs font-extrabold text-zinc-900 block">Scan using GPay, PhonePe, Paytm or BHIM</span>
                          <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
                            Open any UPI app on your phone and scan the QR code to finish ₹{payableAmount} instant payment.
                          </p>
                          <button
                            type="button"
                            onClick={handleCopyUpi}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-luxury-emerald hover:underline pt-0.5"
                          >
                            {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedUpi ? "UPI ID Copied!" : "Copy Store UPI ID (tsl.detailing@icici)"}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* NETBANKING FORM */}
                {paymentMethod === "netbanking" && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Popular Banks</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {["HDFC", "ICICI", "SBI", "AXIS", "KOTAK", "BOB"].map((bank) => (
                        <button
                          key={bank}
                          type="button"
                          onClick={() => setSelectedBank(bank)}
                          className={`py-3 px-3 border rounded-16 text-xs font-bold transition-all ${
                            selectedBank === bank
                              ? 'bg-luxury-emerald/10 border-luxury-emerald text-luxury-emerald shadow-sm ring-1 ring-luxury-emerald/30'
                              : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                          }`}
                        >
                          {bank} Bank
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* PAY ON DETAILING (POD) */}
                {paymentMethod === "pod" && (
                  <div className="text-center space-y-2 py-2 px-3 bg-emerald-50/50 border border-emerald-200/60 rounded-20">
                    <div className="w-10 h-10 bg-luxury-emerald text-white rounded-full flex items-center justify-center mx-auto text-base font-bold shadow-md">
                      ✓
                    </div>
                    <h4 className="font-bold text-sm text-zinc-900">Pay Post Service Completion</h4>
                    <p className="text-xs text-zinc-600 font-medium max-w-xs mx-auto leading-relaxed">
                      Book now with 0 advance commitment. Settle via Cash, GPay, or Card machine after inspecting your showroom finished vehicle.
                    </p>
                  </div>
                )}

              </div>

            </div>
          )}

          {/* Action Buttons Container - FIXED FOOTER (ALWAYS VISIBLE & STICKY AT BOTTOM) */}
          {!isProcessing && (
            <div className="flex-shrink-0 bg-white border-t border-zinc-150 p-4 sm:p-5 shadow-2xl z-20 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-3.5 sm:py-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-20 text-xs sm:text-sm transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPay}
                className="w-2/3 py-3.5 sm:py-4 bg-gradient-to-r from-emerald-600 to-luxury-emerald hover:from-emerald-500 hover:to-emerald-600 text-white font-extrabold rounded-20 text-xs sm:text-sm shadow-xl shadow-emerald-600/25 transition-all flex items-center justify-center gap-2"
              >
                <span>
                  {paymentMethod === "pod" ? "Confirm Detailing Booking" : `Pay ₹${payableAmount.toLocaleString('en-IN')} Securely`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
