import React, { useState } from 'react';
import { X, ShoppingBag, User, Car, CreditCard, FileText, CheckCircle2 } from 'lucide-react';
import { createPortal } from 'react-dom';

const SERVICE_OPTIONS = [
  { key: 'car-wash', label: 'Car Wash', serviceName: 'Car Wash' },
  { key: 'car-detailing', label: 'Car Detailing', serviceName: 'Car Detailing' },
  { key: 'dog-wash', label: 'Dog Bath / Dog Wash', serviceName: 'Dog Bath' },
  { key: 'salon', label: "Men's Salon", serviceName: "Men's Salon" },
  { key: 'cafe', label: 'Café', serviceName: 'Café' },
  { key: 'drive-through-cafe', label: 'Drive-Thru Café', serviceName: 'Drive-Through Café' }
];

const SALE_TYPES = [
  { value: 'service', label: 'One-Time Service' },
  { value: 'membership', label: 'Membership Plan' }
];

const PAYMENT_MODES = ['Cash', 'UPI', 'Card', 'Net Banking'];

const VALIDITY_OPTIONS = [
  { value: '7', label: '7 Days' },
  { value: '15', label: '15 Days' },
  { value: '30', label: '1 Month (30 Days)' },
  { value: '90', label: '3 Months (90 Days)' },
  { value: '180', label: '6 Months (180 Days)' },
  { value: '365', label: '1 Year (365 Days)' },
  { value: 'custom', label: 'Custom Date' }
];

const initialFormState = {
  serviceKey: 'car-wash',
  serviceName: 'Car Wash',
  customerName: '',
  customerEmail: '',
  phone: '',
  vehicleNo: '',
  vehicleModel: '',
  saleType: 'service',
  packageName: '',
  membershipName: '',
  validityDays: '30',
  customExpiryDate: '',
  price: '',
  paymentMode: 'Cash',
  notes: ''
};

export default function OfflineSaleModal({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState({ ...initialFormState });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      // If service selection changed, update serviceName
      if (field === 'serviceKey') {
        const match = SERVICE_OPTIONS.find(s => s.key === value);
        updated.serviceName = match ? match.serviceName : value;
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customerName || !form.phone || !form.vehicleNo || !form.price) return;
    setSubmitting(true);
    try {
      await onSubmit(form);
      setForm({ ...initialFormState });
      onClose();
    } catch (err) {
      console.error('Offline sale submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const inputClass = 'w-full p-2.5 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none transition-all bg-white';
  const labelClass = 'block text-[11px] font-bold text-gray-700 mb-1 uppercase tracking-wide';
  const sectionHeadingClass = 'flex items-center gap-2 text-xs font-black text-gray-900 pb-2 border-b border-gray-100 mb-3';

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-md">
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: '#e07b2a' }}>
              <ShoppingBag className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 leading-tight">Create Offline Sale</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Record a walk-in / counter sale manually</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 custom-scrollbar">

          {/* Service Selection — FIRST */}
          <div>
            <div className={sectionHeadingClass}>
              <ShoppingBag className="w-4 h-4 text-amber-500" />
              Service Selection
            </div>
            <div>
              <label className={labelClass}>Select Service *</label>
              <select
                value={form.serviceKey}
                onChange={e => handleChange('serviceKey', e.target.value)}
                className={inputClass}
                required
              >
                {SERVICE_OPTIONS.map(s => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Customer Info */}
          <div>
            <div className={sectionHeadingClass}>
              <User className="w-4 h-4 text-amber-500" />
              Customer Information
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Customer Name *</label>
                <input
                  type="text"
                  required
                  value={form.customerName}
                  onChange={e => handleChange('customerName', e.target.value)}
                  placeholder="e.g. Ramesh Gupta"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Contact Number *</label>
                <input
                  type="text"
                  required
                  value={form.phone}
                  onChange={e => handleChange('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Email Address</label>
                <input
                  type="email"
                  value={form.customerEmail}
                  onChange={e => handleChange('customerEmail', e.target.value)}
                  placeholder="customer@email.com"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Vehicle Info */}
          <div>
            <div className={sectionHeadingClass}>
              <Car className="w-4 h-4 text-amber-500" />
              Vehicle Details
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Car Number / Plate *</label>
                <input
                  type="text"
                  required
                  value={form.vehicleNo}
                  onChange={e => handleChange('vehicleNo', e.target.value.toUpperCase())}
                  placeholder="MH-01-AB-1234"
                  className={`${inputClass} font-mono tracking-wider`}
                />
              </div>
              <div>
                <label className={labelClass}>Car Model</label>
                <input
                  type="text"
                  value={form.vehicleModel}
                  onChange={e => handleChange('vehicleModel', e.target.value)}
                  placeholder="e.g. BMW 3 Series"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Service & Membership */}
          <div>
            <div className={sectionHeadingClass}>
              <CreditCard className="w-4 h-4 text-amber-500" />
              Package / Membership
            </div>

            {/* Sale Type Toggle */}
            <div className="flex gap-2 mb-3">
              {SALE_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => handleChange('saleType', t.value)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
                    form.saleType === t.value
                      ? 'text-white border-amber-500 shadow-sm'
                      : 'text-gray-600 border-gray-200 bg-gray-50 hover:bg-gray-100'
                  }`}
                  style={form.saleType === t.value ? { backgroundColor: '#e07b2a' } : {}}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {form.saleType === 'service' ? (
              <div>
                <label className={labelClass}>Package / Service Name *</label>
                <input
                  type="text"
                  required
                  value={form.packageName}
                  onChange={e => handleChange('packageName', e.target.value)}
                  placeholder="e.g. Executive Wash, Full Detailing, Beard Trim"
                  className={inputClass}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Membership Name *</label>
                  <input
                    type="text"
                    required
                    value={form.membershipName}
                    onChange={e => handleChange('membershipName', e.target.value)}
                    placeholder="e.g. Monthly Unlimited Wash, Premium Detailing Pass"
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Validity Duration *</label>
                    <select
                      value={form.validityDays}
                      onChange={e => handleChange('validityDays', e.target.value)}
                      className={inputClass}
                    >
                      {VALIDITY_OPTIONS.map(v => (
                        <option key={v.value} value={v.value}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                  {form.validityDays === 'custom' && (
                    <div>
                      <label className={labelClass}>Custom Expiry Date</label>
                      <input
                        type="date"
                        value={form.customExpiryDate}
                        onChange={e => handleChange('customExpiryDate', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Pricing & Payment */}
          <div>
            <div className={sectionHeadingClass}>
              <FileText className="w-4 h-4 text-amber-500" />
              Pricing & Payment
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Price / Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={form.price}
                  onChange={e => handleChange('price', e.target.value)}
                  placeholder="e.g. 2499"
                  className={inputClass}
                  min="0"
                />
              </div>
              <div>
                <label className={labelClass}>Payment Mode *</label>
                <select
                  value={form.paymentMode}
                  onChange={e => handleChange('paymentMode', e.target.value)}
                  className={inputClass}
                >
                  {PAYMENT_MODES.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Notes / Remarks</label>
                <textarea
                  value={form.notes}
                  onChange={e => handleChange('notes', e.target.value)}
                  placeholder="Any additional notes about this sale..."
                  className={`${inputClass} h-16 resize-none`}
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: '#e07b2a' }}
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? 'Saving...' : 'Submit Offline Sale'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
