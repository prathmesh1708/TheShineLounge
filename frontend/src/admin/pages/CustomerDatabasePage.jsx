import React, { useState } from 'react';
import { Download, Users, Phone, Mail, Car, Award, History, Sparkles, Plus } from 'lucide-react';
import { useAdmin } from '../common/context/AdminContext';
import DataTable from '../common/components/DataTable';
import AdminModal from '../common/components/AdminModal';

export default function CustomerDatabasePage() {
  const { customers, addCustomer, showToast } = useAdmin();
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    city: 'Mumbai',
    vehicle: 'MH01AB1234 (Hyundai Creta)'
  });

  const handleExportCSV = () => {
    showToast('Customer CRM Database exported to CSV!');
  };

  const handleCreateCustomer = (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    addCustomer({
      name: form.name,
      phone: form.phone,
      email: form.email,
      city: form.city,
      vehicles: [form.vehicle]
    });
    setIsAddModalOpen(false);
    setForm({ name: '', phone: '', email: '', city: 'Mumbai', vehicle: 'MH01AB1234 (Hyundai Creta)' });
  };

  const columns = [
    {
      header: 'Customer ID & Name',
      accessorKey: 'name',
      cell: (row) => (
        <div>
          <p className="font-bold text-gray-900">{row.name}</p>
          <p className="text-[10px] text-gray-400 font-medium">{row.id}</p>
        </div>
      )
    },
    {
      header: 'Contact Info',
      accessorKey: 'phone',
      cell: (row) => (
        <div>
          <p className="font-bold text-gray-800">{row.phone}</p>
          <p className="text-[10px] text-gray-500">{row.email}</p>
        </div>
      )
    },
    {
      header: 'Customer Segment',
      accessorKey: 'segment',
      cell: (row) => (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
          row.segment === 'High-Value VIP' ? 'bg-amber-100 text-amber-800' :
          row.segment === 'Active Member' ? 'bg-emerald-100 text-emerald-700' :
          row.segment === 'Expired Member' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-800'
        }`}>
          {row.segment}
        </span>
      )
    },
    {
      header: 'Total Spent',
      accessorKey: 'totalSpent',
      cell: (row) => <span className="font-black text-gray-900">₹{Number(row.totalSpent).toLocaleString('en-IN')}</span>
    },
    {
      header: 'Loyalty Points',
      accessorKey: 'loyaltyPoints',
      cell: (row) => (
        <div className="flex items-center gap-1 font-extrabold text-amber-600">
          <Award className="w-3.5 h-3.5" />
          <span>{row.loyaltyPoints} pts</span>
        </div>
      )
    },
    {
      header: 'Last Visit',
      accessorKey: 'lastVisit',
      cell: (row) => <span className="font-semibold text-gray-600">{row.lastVisit}</span>
    },
    {
      header: 'Actions',
      cell: (row) => (
        <button
          onClick={() => setSelectedCustomer(row)}
          className="px-3 py-1 text-[11px] font-bold text-white rounded-lg shadow-2xs"
          style={{ backgroundColor: '#e07b2a' }}
        >
          View CRM Profile
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Customer CRM Database</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            4,850+ customer profiles, vehicle registrations, spending habits, and loyalty rewards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl shadow-sm hover:opacity-95 transition-opacity"
            style={{ backgroundColor: '#e07b2a' }}
          >
            <Plus className="w-4 h-4" /> Register Customer
          </button>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={customers}
        searchPlaceholder="Search customer by name, phone, email, city..."
        searchKeys={['name', 'phone', 'email', 'city', 'id']}
        filterKey="segment"
        filterOptions={['All', 'Active Member', 'High-Value VIP', 'Expired Member', 'Regular Customer', 'New Customer']}
      />

      {/* Modal: Customer Profile Drawer */}
      <AdminModal
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title={`Customer Profile: ${selectedCustomer?.name}`}
        subtitle={selectedCustomer?.id}
      >
        {selectedCustomer && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-gray-400 font-bold block">Mobile Phone</span>
                  <span className="font-extrabold text-gray-900">{selectedCustomer.phone}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-bold block">Email Address</span>
                  <span className="font-extrabold text-gray-900">{selectedCustomer.email}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-bold block">Segment</span>
                  <span className="font-extrabold text-amber-600">{selectedCustomer.segment}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-bold block">City</span>
                  <span className="font-extrabold text-gray-900">{selectedCustomer.city}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60">
                <span className="text-xs font-bold text-amber-700 block">Total Lifetime Spent</span>
                <span className="text-xl font-black text-amber-600">₹{Number(selectedCustomer.totalSpent).toLocaleString('en-IN')}</span>
              </div>
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/60">
                <span className="text-xs font-bold text-blue-800 block">Loyalty Reward Points</span>
                <span className="text-xl font-black text-blue-900">{selectedCustomer.loyaltyPoints} Points</span>
              </div>
            </div>

            <div>
              <span className="font-bold text-gray-700 block mb-1">Registered Vehicles</span>
              <div className="space-y-1">
                {selectedCustomer.vehicles && selectedCustomer.vehicles.map((v, i) => (
                  <div key={i} className="p-2 bg-gray-100 rounded-lg font-bold text-gray-800 flex items-center gap-2">
                    <Car className="w-4 h-4 text-amber-500" />
                    <span>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </AdminModal>

      {/* Modal: Add Customer */}
      <AdminModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Customer Profile"
        subtitle="Add customer details to CRM"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-gray-700 block mb-1">Customer Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Vikram Malhotra"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Mobile Number</label>
              <input
                type="text"
                required
                placeholder="+91 98000 00000"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">Email Address</label>
              <input
                type="email"
                placeholder="customer@gmail.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">Primary Vehicle (Reg. No & Model)</label>
            <input
              type="text"
              placeholder="e.g. MH01AB1234 (Hyundai Creta)"
              value={form.vehicle}
              onChange={(e) => setForm({ ...form, vehicle: e.target.value })}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-semibold"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-bold text-white rounded-xl"
              style={{ backgroundColor: '#e07b2a' }}
            >
              Save Profile
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
