import React from 'react';
import { createPortal } from 'react-dom';
import { X, User, Car, CreditCard, Calendar, Clock, ShoppingBag, Phone, Mail, FileText, Plus } from 'lucide-react';

export default function RegisteredVehicleDetailModal({ isOpen, onClose, vehicle, bookingHistory = [], onNewOfflineSale }) {
  if (!isOpen || !vehicle) return null;

  const v = vehicle;

  // Compute membership validity info if present
  const hasMembership = v.membershipName || v.membershipValidity || v.membershipExpiry;

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
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center font-black text-lg">
              🚗
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 leading-tight">{v.model || 'Vehicle'}</h3>
              <p className="text-xs font-black text-amber-600 tracking-wider">{v.plate}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onNewOfflineSale && (
              <button
                onClick={() => { onClose(); onNewOfflineSale(v); }}
                className="px-3 py-1.5 rounded-xl text-[10px] font-bold text-white flex items-center gap-1 shadow-sm transition-all hover:shadow-md"
                style={{ backgroundColor: '#e07b2a' }}
              >
                <Plus className="w-3 h-3" /> New Offline Sale
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">

          {/* Owner Info Section */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
            <h4 className="flex items-center gap-2 text-xs font-black text-gray-900">
              <User className="w-4 h-4 text-amber-500" />
              Owner Profile
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-600">
              <div className="flex items-start gap-2">
                <User className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="block text-[10px] text-gray-400 uppercase font-bold">Name</span>
                  <strong className="text-gray-800">{v.ownerName || '—'}</strong>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="block text-[10px] text-gray-400 uppercase font-bold">Contact</span>
                  <strong className="text-gray-800">{v.ownerPhone || '—'}</strong>
                </div>
              </div>
              <div className="flex items-start gap-2 sm:col-span-2">
                <Mail className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="block text-[10px] text-gray-400 uppercase font-bold">Email</span>
                  <strong className="text-gray-800">{v.ownerEmail || '—'}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle & Service Stats */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
            <h4 className="flex items-center gap-2 text-xs font-black text-gray-900">
              <Car className="w-4 h-4 text-amber-500" />
              Vehicle & Service Info
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                <span className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Plate</span>
                <span className="text-xs font-black text-amber-600 tracking-wider">{v.plate}</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                <span className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Model</span>
                <span className="text-xs font-bold text-gray-800">{v.model || '—'}</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                <span className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Total Services</span>
                <span className="text-sm font-black text-gray-900">{v.totalWashes || v.totalBookings || 0}</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                <span className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Last Service</span>
                <span className="text-xs font-bold text-gray-800">{v.lastWashDate || v.lastServiceDate || '—'}</span>
              </div>
            </div>
          </div>

          {/* Active Membership */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
            <h4 className="flex items-center gap-2 text-xs font-black text-gray-900">
              <CreditCard className="w-4 h-4 text-amber-500" />
              Membership & Package
            </h4>
            {hasMembership ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Membership:</span>
                  <span className="font-bold text-amber-700">{v.membershipName}</span>
                </div>
                {v.membershipValidity && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Validity:</span>
                    <span className="font-semibold text-gray-700">{v.membershipValidity}</span>
                  </div>
                )}
                {v.membershipExpiry && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Expires:</span>
                    <span className="font-semibold text-gray-700">{v.membershipExpiry}</span>
                  </div>
                )}
                {v.membershipStatus && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Status:</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                      v.membershipStatus === 'Active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}>{v.membershipStatus}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center py-3 text-gray-400">
                <p className="text-xs font-semibold">Active Package: <span className="text-amber-700 font-bold">{v.packageName || 'Single Service'}</span></p>
                {!v.packageName && <p className="text-[10px] mt-1">No active membership plan</p>}
              </div>
            )}
          </div>

          {/* Offline Sale / Billing Info (if present) */}
          {(v.offlineSalePrice || v.paymentMode) && (
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
              <h4 className="flex items-center gap-2 text-xs font-black text-gray-900">
                <ShoppingBag className="w-4 h-4 text-amber-500" />
                Billing & Payment
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                {v.offlineSalePrice && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Amount Paid:</span>
                    <strong className="text-gray-900">₹{v.offlineSalePrice}</strong>
                  </div>
                )}
                {v.paymentMode && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Payment Mode:</span>
                    <span className="font-bold text-gray-700">{v.paymentMode}</span>
                  </div>
                )}
                {v.offlineSaleDate && (
                  <div className="flex justify-between col-span-2">
                    <span className="text-gray-400">Sale Date:</span>
                    <span className="font-semibold text-gray-700">{v.offlineSaleDate}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes (if present) */}
          {v.notes && (
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-2">
              <h4 className="flex items-center gap-2 text-xs font-black text-gray-900">
                <FileText className="w-4 h-4 text-amber-500" />
                Notes
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">{v.notes}</p>
            </div>
          )}

          {/* Service / Booking History */}
          {bookingHistory.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
              <h4 className="flex items-center gap-2 text-xs font-black text-gray-900">
                <Calendar className="w-4 h-4 text-amber-500" />
                Service History ({bookingHistory.length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {bookingHistory.map((bk, idx) => (
                  <div key={bk.id || idx} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                    <div className="space-y-0.5">
                      <p className="font-bold text-gray-800">{bk.packageName || bk.plan || bk.service || 'Service'}</p>
                      <p className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {bk.date || bk.createdAt || '—'}
                      </p>
                    </div>
                    <div className="text-right space-y-0.5">
                      <p className="font-bold text-gray-900">₹{bk.price || bk.total || bk.amount || '—'}</p>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                        (bk.status || '').toLowerCase() === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : (bk.status || '').toLowerCase() === 'pending'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-gray-100 text-gray-600 border-gray-200'
                      }`}>{bk.status || 'N/A'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
