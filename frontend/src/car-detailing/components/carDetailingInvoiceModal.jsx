import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, Download, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function CarDetailingInvoiceModal({ isOpen, onClose, booking }) {
  if (!isOpen || !booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalPrice = Number(booking.price || 1490);
  const isDeposit = booking.paymentType === 'Deposit Paid' || booking.paymentStatus === 'Deposit Paid';
  const paidAmount = Number(booking.depositAmount || (isDeposit ? Math.round(totalPrice * 0.25) : totalPrice));
  const remainingBalance = Number(booking.remainingAmount || (isDeposit ? totalPrice - paidAmount : 0));

  // Compute 18% GST breakdown from total price
  const basePrice = Math.round(totalPrice / 1.18);
  const gstAmount = totalPrice - basePrice;
  const cgst = Math.round(gstAmount / 2);
  const sgst = gstAmount - cgst;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-6 shadow-2xl border border-zinc-200 relative my-8 print:p-0 print:border-none print:shadow-none print:my-0 text-zinc-800"
        >
          {/* Top Control bar - Hidden on print */}
          <div className="flex justify-between items-center print:hidden pb-2 border-b border-zinc-150">
            <div className="flex items-center gap-2 text-luxury-emerald font-bold text-sm">
              <ShieldCheck className="w-5 h-5" />
              <span>Tax Invoice Preview</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="py-2 px-4 bg-luxury-emerald text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-luxury-emeraldHover transition-all shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Download PDF</span>
              </button>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Printable Invoice Container */}
          <div id="printable-invoice" className="space-y-6">
            
            {/* Header: Company Info & Invoice ID */}
            <div className="flex flex-col md:flex-row justify-between items-start border-b border-zinc-200 pb-6 gap-4">
              <div>
                <h1 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
                  <span className="text-luxury-emerald">THE SHINE LOUNGE</span>
                  <span className="text-xs bg-luxury-emerald/10 text-luxury-emerald px-2 py-0.5 rounded-md border border-luxury-emerald/20 font-bold uppercase">
                    Detailing Studio
                  </span>
                </h1>
                <p className="text-xs text-zinc-500 font-medium mt-1">
                  Premium Automotive Detailing & Ceramic Coatings
                </p>
                <div className="text-[11px] text-zinc-400 mt-2 space-y-0.5">
                  <p>Studio Address: Palasia Main Road, Indore, MP - 452001</p>
                  <p>Email: support@theshinelounge.com | Phone: +91 98765 43210</p>
                  <p className="font-mono font-bold text-zinc-700">GSTIN: 23AAACG1234A1Z8 | SAC Code: 998714</p>
                </div>
              </div>

              <div className="text-left md:text-right space-y-1 bg-zinc-50 p-4 rounded-2xl border border-zinc-200 min-w-[200px]">
                <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider block">TAX INVOICE</span>
                <span className="text-lg font-black font-mono text-zinc-900 block">
                  INV-{booking.id?.replace('BK-', '') || '2026-001'}
                </span>
                <div className="text-xs text-zinc-500 space-y-0.5 pt-1">
                  <p>Booking ID: <strong className="text-zinc-800 font-mono">{booking.id}</strong></p>
                </div>
              </div>
            </div>

            {/* Billed To / Vehicle Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50/70 p-4 rounded-2xl border border-zinc-200/80 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Billed To Customer</span>
                <p className="font-bold text-sm text-zinc-900">{booking.customerName || 'Car Owner'}</p>
                <p className="text-zinc-500">{booking.location || booking.address || 'Indore Studio Service'}</p>
              </div>
              <div className="space-y-1 sm:text-right">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Vehicle Specification</span>
                <p className="font-bold text-sm text-zinc-900">{booking.vehicle || 'Tesla Model 3'}</p>
                <p className="font-mono text-xs font-bold text-luxury-emerald bg-luxury-emerald/10 inline-block px-2 py-0.5 rounded border border-luxury-emerald/20 mt-0.5">
                  Reg No: {booking.vehicleNo || 'MP-09-AB-1234'}
                </p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-100 border-b border-zinc-200 text-zinc-700 font-bold text-[11px] uppercase tracking-wider">
                    <th className="p-3">Service / Treatment</th>
                    <th className="p-3">SAC Code</th>
                    <th className="p-3 text-right">Taxable Amt</th>
                    <th className="p-3 text-right">GST (18%)</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-150 text-zinc-800">
                  <tr>
                    <td className="p-3 font-bold">
                      {booking.package || booking.item || 'Premium Detail Treatment'}
                    </td>
                    <td className="p-3 font-mono text-zinc-500">998714</td>
                    <td className="p-3 text-right font-mono">₹{basePrice.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-mono">₹{gstAmount.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-bold font-mono">₹{totalPrice.toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* GST Breakdown & Payment Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 pt-2">
              
              {/* Left side: GST split & guarantee note */}
              <div className="sm:col-span-7 space-y-3 text-xs">
                <div className="p-3.5 bg-luxury-emerald/5 border border-luxury-emerald/20 rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-luxury-emerald">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>GST Tax Breakdown (Indore, MP)</span>
                  </div>
                  <div className="grid grid-cols-2 text-[11px] text-zinc-600 font-medium pt-1">
                    <span>CGST (9%): ₹{cgst.toLocaleString('en-IN')}</span>
                    <span>SGST (9%): ₹{sgst.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">
                  This is a computer-generated GST tax invoice for automotive detailing services rendered by The Shine Lounge. All warranties and ceramic coating certifications are attached to this invoice ID.
                </p>
              </div>

              {/* Right side: Amount Paid & Balance Due */}
              <div className="sm:col-span-5 space-y-2 bg-zinc-50 p-4 rounded-2xl border border-zinc-200 text-xs">
                <div className="flex justify-between text-zinc-600">
                  <span>Subtotal (Excl. Tax):</span>
                  <span className="font-mono">₹{basePrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>GST (18% Total):</span>
                  <span className="font-mono">₹{gstAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-zinc-900 border-t border-zinc-200 pt-2">
                  <span>Total Amount:</span>
                  <span className="font-mono text-luxury-emerald">₹{totalPrice.toLocaleString('en-IN')}</span>
                </div>

                <div className="border-t border-dashed border-zinc-300 pt-2 space-y-1.5">
                  <div className="flex justify-between text-zinc-700 font-semibold">
                    <span>Paid Deposit Amount:</span>
                    <span className="font-mono text-luxury-emerald">₹{paidAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-xs">
                    <span>Balance Remaining:</span>
                    <span className={`font-mono ${remainingBalance > 0 ? 'text-amber-600 font-black' : 'text-zinc-500'}`}>
                      ₹{remainingBalance.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="pt-1 text-center">
                    <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full inline-block border ${
                      remainingBalance > 0
                        ? 'bg-amber-100 text-amber-700 border-amber-300'
                        : 'bg-emerald-100 text-emerald-700 border-emerald-300'
                    }`}>
                      {remainingBalance > 0 ? 'PARTIAL DEPOSIT PAID (BALANCE PENDING)' : 'FULLY PAID & CLEARED'}
                    </span>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
