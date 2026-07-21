import React, { useState } from 'react';
import { useStaff } from '../common/context/StaffContext';
import { UserPlus, Search, Car, Phone, Mail, MapPin, Award, Plus, Check } from 'lucide-react';

export default function StaffCustomersPage() {
  const { customers, addCustomer } = useStaff();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

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
          <div key={cust.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black text-amber-600 uppercase">{cust.id}</span>
                <h3 className="font-extrabold text-sm text-gray-900">{cust.name}</h3>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-gray-400" /> {cust.mobile}
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-900 border border-blue-200">
                {cust.segment}
              </span>
            </div>

            {/* Registered Vehicles */}
            <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-100 space-y-1">
              <span className="text-[10px] font-black uppercase text-gray-400">Registered Vehicles</span>
              {cust.vehicles?.map(v => (
                <div key={v.id || v.registrationNumber} className="flex items-center justify-between text-xs">
                  <span className="font-black text-gray-900 flex items-center gap-1">
                    <Car className="w-3.5 h-3.5 text-amber-600" /> {v.registrationNumber}
                  </span>
                  <span className="text-gray-500 font-semibold">{v.brand} {v.model} ({v.fuelType})</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

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
