import React, { useState, useEffect } from 'react';
import { useStaff } from '../common/context/StaffContext';
import apiClient from '../../common/utils/apiClient';
import { UserPlus, Search, Car, Phone, Mail, MapPin, Award, X, Calendar, IndianRupee, Clock, ChevronRight, ShieldCheck, Sparkles, History } from 'lucide-react';

export default function StaffCustomersPage() {
  const { customers, addCustomer } = useStaff();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerBookings, setCustomerBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [brand, setBrand] = useState('Hyundai');
  const [model, setModel] = useState('Creta');

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.mobile.includes(searchTerm) ||
    c.vehicles?.some(v => v.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleRegister = (e) => {
    e.preventDefault();
    addCustomer({
      name,
      mobile: mobile.startsWith('+91') ? mobile : `+91 ${mobile}`,
      email,
      address,
      city: 'Mumbai',
      segment: 'New Customer',
      vehicles: [
        { id: `V-${Date.now()}`, registrationNumber: vehicleNo.toUpperCase(), brand, model, color: 'White', fuelType: 'Petrol' }
      ]
    });
    setShowAddModal(false);
    setName('');
    setMobile('');
    setVehicleNo('');
  };

  // Open customer profile & fetch their bookings
  const openCustomerProfile = async (cust) => {
    setSelectedCustomer(cust);
    setCustomerBookings([]);
    setLoadingBookings(true);
    try {
      const res = await apiClient.get('/bookings');
      if (res.data && res.data.bookings) {
        const custEmail = (cust.email || cust.id || '').toLowerCase();
        const custName = (cust.name || cust.fullName || '').toLowerCase();
        const matched = res.data.bookings.filter(b => {
          const bEmail = (b.customerEmail || '').toLowerCase();
          const bName = (b.customerName || '').toLowerCase();
          return (custEmail && bEmail === custEmail) || (custName && bName === custName);
        });
        setCustomerBookings(matched);
      }
    } catch (err) {
      console.warn('Could not fetch bookings for customer:', err.message);
    }
    setLoadingBookings(false);
  };

  const activePasses = customerBookings.filter(b => {
    const pName = (b.packageName || '').toLowerCase();
    return pName.includes('membership') || pName.includes('pass') || pName.includes('monthly') || pName.includes('yearly');
  });

  const totalSpent = customerBookings.reduce((sum, b) => sum + (b.price || 0), 0);

  return (
    <div className="space-y-4">
      {/* Header & Add Customer Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-extrabold text-base text-gray-900">Customer CRM</h2>
          <p className="text-xs text-gray-500">{customers.length} Registered Profiles</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-2 rounded-xl text-xs font-extrabold text-white flex items-center gap-1 shadow-md active:scale-95 transition-transform"
          style={{ backgroundColor: '#e07b2a' }}
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search by name, mobile (+91), or vehicle no (MH01...)"
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 text-xs font-bold bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {/* Customers List */}
      <div className="space-y-3">
        {filteredCustomers.map(cust => (
          <div
            key={cust.id}
            onClick={() => openCustomerProfile(cust)}
            className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-2 cursor-pointer hover:border-amber-300 hover:shadow-md transition-all active:scale-[0.98]"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20 font-black flex items-center justify-center text-sm flex-shrink-0">
                  {(cust.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="text-[10px] font-black text-amber-600 uppercase">{cust.email || cust.id}</span>
                  <h3 className="font-extrabold text-sm text-gray-900">{cust.name}</h3>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-gray-400" /> {cust.mobile}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-900 border border-blue-200">
                  {cust.segment}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </div>
            </div>

            {/* Registered Vehicles */}
            <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-100 space-y-1">
              <span className="text-[10px] font-black uppercase text-gray-400">Registered Vehicles</span>
              {(() => {
                // Only what the customer registered. A stand-in plate here was
                // read by staff as the real one.
                const vList = (cust.vehicles || []).filter(v => v.registrationNumber);

                if (vList.length === 0) {
                  return (
                    <div className="text-[11px] font-semibold text-gray-400 italic">
                      No Registered Vehicles
                    </div>
                  );
                }

                return vList.map(v => (
                  <div key={v.id || v.registrationNumber} className="flex items-center justify-between text-xs">
                    <span className="font-black text-gray-900 flex items-center gap-1">
                      <Car className="w-3.5 h-3.5 text-amber-600" /> {v.registrationNumber}
                    </span>
                    <span className="text-gray-500 font-semibold">
                      {[v.brand, v.model].filter(Boolean).join(' ') || 'Vehicle'}
                      {v.fuelType ? ` (${v.fuelType})` : ''}
                    </span>
                  </div>
                ));
              })()}
            </div>
          </div>
        ))}
      </div>

      {/* ──── Customer Profile Modal ──── */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setSelectedCustomer(null)}>
          <div
            className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Profile Header */}
            <div className="relative bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white p-5 pb-6">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur text-white font-black text-2xl flex items-center justify-center border-2 border-white/30">
                  {(selectedCustomer.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-black">{selectedCustomer.name || selectedCustomer.fullName}</h3>
                  <p className="text-amber-100 text-xs font-semibold flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3 h-3" /> {selectedCustomer.email || selectedCustomer.id}
                  </p>
                  <p className="text-amber-100 text-xs font-semibold flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3 h-3" /> {selectedCustomer.mobile || selectedCustomer.phone || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="bg-white/15 backdrop-blur rounded-xl p-2.5 text-center">
                  <span className="text-lg font-black">{customerBookings.length}</span>
                  <p className="text-[9px] font-bold text-amber-100">Total Visits</p>
                </div>
                <div className="bg-white/15 backdrop-blur rounded-xl p-2.5 text-center">
                  <span className="text-lg font-black">₹{totalSpent.toLocaleString()}</span>
                  <p className="text-[9px] font-bold text-amber-100">Total Spent</p>
                </div>
                <div className="bg-white/15 backdrop-blur rounded-xl p-2.5 text-center">
                  <span className="text-lg font-black">{activePasses.length}</span>
                  <p className="text-[9px] font-bold text-amber-100">Active Passes</p>
                </div>
              </div>
            </div>

            {/* Profile Body */}
            <div className="p-4 space-y-4">

              {/* Membership / Active Passes */}
              {activePasses.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-gray-900 flex items-center gap-1.5 uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Active Memberships
                  </h4>
                  {activePasses.map((p, i) => (
                    <div key={i} className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <span className="font-extrabold text-xs text-emerald-800">{p.packageName}</span>
                        <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                          Purchased: {p.date || 'Recently'}
                        </p>
                      </div>
                      <span className="text-xs font-black text-emerald-700">₹{p.price?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Registered Vehicles */}
              {(() => {
                const registered = (selectedCustomer.vehicles || []).filter(v => v.registrationNumber);

                // Plates seen on this customer's own past bookings are real —
                // someone typed them at the counter — so they are still worth
                // showing, but labelled as what they are rather than passed off
                // as registered vehicles. What is gone is the block that
                // manufactured a plate when both lists were empty.
                const seen = new Set(registered.map(v => String(v.registrationNumber).toUpperCase()));
                const fromBookings = [];
                customerBookings.forEach((b, i) => {
                  const plate = (b.vehicleNo || '').trim().toUpperCase();
                  if (!plate || seen.has(plate)) return;
                  seen.add(plate);
                  fromBookings.push({
                    id: `v-booking-${i}`,
                    registrationNumber: plate,
                    brand: b.vehicleType || '',
                    model: ''
                  });
                });

                return (
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-gray-900 flex items-center gap-1.5 uppercase tracking-wider">
                      <Car className="w-3.5 h-3.5 text-blue-600" /> Registered Vehicles
                    </h4>

                    {registered.length === 0 && fromBookings.length === 0 && (
                      <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-3 text-center">
                        <p className="text-[11px] font-bold text-gray-500">No Registered Vehicles</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          This customer has not added a vehicle to their account.
                        </p>
                      </div>
                    )}

                    {registered.map(v => (
                      <div key={v.id || v.registrationNumber} className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <span className="font-black text-sm text-gray-900">{v.registrationNumber}</span>
                          <p className="text-[10px] text-gray-500 font-semibold">
                            {[v.brand, v.model].filter(Boolean).join(' ') || 'Vehicle'}
                          </p>
                        </div>
                        {v.fuelType && (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            {v.fuelType}
                          </span>
                        )}
                      </div>
                    ))}

                    {fromBookings.map(v => (
                      <div key={v.id} className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <span className="font-black text-sm text-gray-900">{v.registrationNumber}</span>
                          <p className="text-[10px] text-gray-500 font-semibold">{v.brand || 'Vehicle'}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          From booking
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Booking History */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-gray-900 flex items-center gap-1.5 uppercase tracking-wider">
                  <History className="w-3.5 h-3.5 text-amber-600" /> Booking History
                </h4>
                {loadingBookings ? (
                  <div className="text-center py-6 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-[10px] text-gray-400 mt-2 font-bold">Loading bookings...</p>
                  </div>
                ) : customerBookings.length > 0 ? (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                    {customerBookings.map((b, i) => (
                      <div key={b._id || i} className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <span className="font-extrabold text-xs text-gray-900">{b.packageName || b.serviceName}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-gray-500 font-semibold flex items-center gap-0.5">
                              <Calendar className="w-2.5 h-2.5" /> {b.date || 'N/A'}
                            </span>
                            <span className="text-[10px] text-gray-500 font-semibold flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" /> {b.timeSlot || 'N/A'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-amber-600">₹{b.price?.toLocaleString()}</span>
                          <span className={`block text-[9px] font-bold mt-0.5 ${
                            b.status === 'Completed' || b.status === 'Delivered' ? 'text-emerald-600' :
                            b.status === 'Cancelled' ? 'text-red-500' : 'text-amber-600'
                          }`}>
                            {b.status || 'Confirmed'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic bg-gray-50 rounded-xl p-3 border border-dashed border-gray-200 text-center">No bookings found</p>
                )}
              </div>

              {/* Customer Info Footer */}
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-500 font-semibold">Segment</span>
                  <span className="font-black text-gray-900">{selectedCustomer.segment || 'Regular'}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-500 font-semibold">Loyalty Points</span>
                  <span className="font-black text-amber-600 flex items-center gap-1">
                    <Award className="w-3 h-3" /> {selectedCustomer.loyaltyPoints || 0} pts
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-500 font-semibold">Member Since</span>
                  <span className="font-black text-gray-900">{selectedCustomer.joinDate || 'Recently'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center">
          <div className="w-full max-w-md bg-white rounded-t-3xl p-5 space-y-3 animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-extrabold text-sm text-gray-900">Register New Customer</h3>
              <button onClick={() => setShowAddModal(false)} className="text-xs font-bold text-gray-400">Close</button>
            </div>

            <form onSubmit={handleRegister} className="space-y-3">
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
              />
              <input
                type="text"
                placeholder="Mobile (+91 98200...)"
                value={mobile}
                onChange={e => setMobile(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
              />
              <input
                type="text"
                placeholder="Vehicle Registration No (MH01AB1234)"
                value={vehicleNo}
                onChange={e => setVehicleNo(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Brand (Hyundai)"
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                  className="px-3 py-2 border rounded-xl text-xs font-bold"
                />
                <input
                  type="text"
                  placeholder="Model (Creta)"
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  className="px-3 py-2 border rounded-xl text-xs font-bold"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl text-white font-extrabold text-xs shadow-md"
                style={{ backgroundColor: '#e07b2a' }}
              >
                Save Profile & Register Vehicle
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
