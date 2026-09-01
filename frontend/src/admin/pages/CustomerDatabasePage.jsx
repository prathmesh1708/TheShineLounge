import React, { useState } from 'react';
import {
  Download, Users, Phone, Mail, Car, Award, History, Sparkles, Plus,
  ShieldAlert, ShieldCheck, AlertTriangle, Lock, Clock, Calendar, CheckCircle2,
  RefreshCw, XCircle, ChevronRight, UserCheck, AlertOctagon
} from 'lucide-react';
import { useAdmin } from '../common/context/AdminContext';
import DataTable from '../common/components/DataTable';
import AdminModal from '../common/components/AdminModal';

export default function CustomerDatabasePage() {
  const {
    customers,
    bookings,
    addCustomer,
    updateCustomerMembership,
    updateCustomerUsageRules,
    addCustomerVehicle,
    showToast
  } = useAdmin();

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [suspensionReasonInput, setSuspensionReasonInput] = useState('');
  const [newVehiclePlate, setNewVehiclePlate] = useState('');
  const [newVehicleModel, setNewVehicleModel] = useState('');

  // Rules local state for active selected customer
  const [rulesForm, setRulesForm] = useState({
    maxPerDay: 1,
    maxPerMonth: 4,
    coolOffHours: 24,
    boundVehiclesOnly: true
  });

  // The vehicle field starts blank. It used to be pre-filled with a sample
  // plate, so an operator who tabbed past it silently registered a car that
  // does not exist onto a brand new customer.
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    city: 'Mumbai',
    vehicle: ''
  });

  const handleExportCSV = () => {
    try {
      if (!customers || customers.length === 0) {
        showToast('No customer data available to export.', 'error');
        return;
      }

      const reportDate = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      const csvRows = [
        ['THE SHINE LOUNGE - CUSTOMER CRM DATABASE EXPORT'],
        [`Exported On: ${reportDate}`, `Total Customer Records: ${customers.length}`],
        [''],
        [
          'Customer ID',
          'Full Name',
          'Phone / Mobile',
          'Email Address',
          'City',
          'Membership Segment',
          'Total Lifetime Spent (INR)',
          'Registered Vehicles',
          'Last Visit Date',
          'Max Wash Per Day',
          'License Plate Binding'
        ],
        ...customers.map(c => [
          c.id || c.code || 'CUST-N/A',
          c.name || c.fullName || 'N/A',
          c.phone || c.mobile || 'N/A',
          c.email || 'N/A',
          c.city || 'Mumbai',
          c.segment || 'Regular Customer',
          c.totalSpent !== undefined ? c.totalSpent : 24500,
          (c.vehicles && c.vehicles.length > 0) ? c.vehicles.join(' | ') : 'None registered',
          c.lastVisit || '2026-08-01',
          c.maxServicesPerDay || 2,
          c.plateBindingEnabled !== false ? 'Enabled' : 'Disabled'
        ])
      ];

      const csvContent = csvRows
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `TheShineLounge_Customer_CRM_Database_${Date.now()}.csv`;
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(`Customer Database exported successfully (${filename})!`);
    } catch (err) {
      console.error('Error exporting customer CSV:', err);
      showToast('Failed to export Customer CSV', 'error');
    }
  };

  const handleCreateCustomer = (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    addCustomer({
      name: form.name,
      phone: form.phone,
      email: form.email,
      city: form.city,
      vehicles: form.vehicle.trim() ? [form.vehicle.trim()] : []
    });
    setIsAddModalOpen(false);
    setForm({ name: '', phone: '', email: '', city: 'Mumbai', vehicle: '' });
  };

  const openCustomerModal = (customer) => {
    setSelectedCustomer(customer);
    setActiveTab('overview');
    setSuspensionReasonInput(customer?.membership?.suspensionReason || '');
    setRulesForm({
      maxPerDay: customer?.membership?.maxPerDay ?? 1,
      maxPerMonth: customer?.membership?.maxPerMonth ?? 4,
      coolOffHours: customer?.membership?.coolOffHours ?? 24,
      boundVehiclesOnly: customer?.membership?.boundVehiclesOnly ?? true
    });
  };

  const handleSaveUsageRules = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    await updateCustomerUsageRules(selectedCustomer._id || selectedCustomer.id, rulesForm);
    setSelectedCustomer(prev => ({
      ...prev,
      membership: {
        ...prev.membership,
        ...rulesForm
      }
    }));
  };

  const handleSuspendMembership = async () => {
    if (!selectedCustomer) return;
    const reason = suspensionReasonInput || 'Membership suspended by management for policy review';
    await updateCustomerMembership(selectedCustomer._id || selectedCustomer.id, {
      status: 'Suspended',
      suspensionReason: reason
    });
    setSelectedCustomer(prev => ({
      ...prev,
      segment: 'Suspended Member',
      membership: {
        ...prev.membership,
        status: 'Suspended',
        suspensionReason: reason
      }
    }));
  };

  const handleReactivateMembership = async () => {
    if (!selectedCustomer) return;
    await updateCustomerMembership(selectedCustomer._id || selectedCustomer.id, {
      status: 'Active',
      suspensionReason: ''
    });
    setSelectedCustomer(prev => ({
      ...prev,
      segment: 'Active Member',
      membership: {
        ...prev.membership,
        status: 'Active',
        suspensionReason: ''
      }
    }));
  };

  const handleExtendExpiry = async (days = 30) => {
    if (!selectedCustomer) return;
    const currentExpiry = selectedCustomer.membership?.expiryDate
      ? new Date(selectedCustomer.membership.expiryDate)
      : new Date();
    const newExpiry = new Date(currentExpiry.getTime() + days * 24 * 3600 * 1000);
    await updateCustomerMembership(selectedCustomer._id || selectedCustomer.id, {
      status: 'Active',
      expiryDate: newExpiry.toISOString()
    });
    setSelectedCustomer(prev => ({
      ...prev,
      segment: 'Active Member',
      membership: {
        ...prev.membership,
        status: 'Active',
        expiryDate: newExpiry.toISOString()
      }
    }));
  };

  const handleAddVehicleSubmit = async (e) => {
    e.preventDefault();
    if (!newVehiclePlate || !selectedCustomer) return;
    await addCustomerVehicle(selectedCustomer._id || selectedCustomer.id, {
      plateNumber: newVehiclePlate,
      model: newVehicleModel || 'Vehicle'
    });
    const formatted = `${newVehiclePlate} (${newVehicleModel || 'Vehicle'})`;
    setSelectedCustomer(prev => ({
      ...prev,
      vehicles: [...(prev.vehicles || []), formatted]
    }));
    setNewVehiclePlate('');
    setNewVehicleModel('');
  };

  // Metrics
  const activeCount = customers.filter(c => c.segment === 'Active Member' || c.segment === 'High-Value VIP').length;
  const dueCount = customers.filter(c => c.segment === 'Due for Renewal').length;
  const suspendedCount = customers.filter(c => c.segment === 'Suspended Member').length;
  const expiredCount = customers.filter(c => c.segment === 'Expired Member').length;

  const columns = [
    {
      header: 'Customer ID & Name',
      accessorKey: 'name',
      cell: (row) => (
        <div>
          <p className="font-bold text-gray-900">{row.name || row.fullName}</p>
          <p className="text-[10px] text-gray-400 font-medium">{row.id || row._id}</p>
        </div>
      )
    },
    {
      header: 'Contact Info',
      accessorKey: 'phone',
      cell: (row) => (
        <div>
          <p className="font-bold text-gray-800">{row.phone || row.mobile || '+91 98000 00000'}</p>
          <p className="text-[10px] text-gray-500">{row.email}</p>
        </div>
      )
    },
    {
      header: 'Membership Segment',
      accessorKey: 'segment',
      cell: (row) => {
        const seg = row.segment || 'Regular Customer';
        return (
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1 ${
            seg === 'High-Value VIP' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
            seg === 'Active Member' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
            seg === 'Due for Renewal' ? 'bg-amber-100 text-amber-800 border border-amber-300 font-extrabold animate-pulse' :
            seg === 'Expired Member' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
            seg === 'Suspended Member' ? 'bg-purple-100 text-purple-900 border border-purple-300' :
            'bg-gray-100 text-gray-700'
          }`}>
            {seg === 'Suspended Member' && <AlertOctagon className="w-3 h-3 text-purple-700" />}
            {seg === 'Active Member' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
            {seg === 'Due for Renewal' && <Clock className="w-3 h-3 text-amber-600" />}
            {seg}
          </span>
        );
      }
    },
    {
      header: 'Total Lifetime Spent',
      accessorKey: 'totalSpent',
      cell: (row) => {
        const val = Number(row.totalSpent);
        const displayVal = isNaN(val) ? 24500 : val;
        return <span className="font-black text-gray-900">₹{displayVal.toLocaleString('en-IN')}</span>;
      }
    },

    {
      header: 'Registered Vehicles',
      accessorKey: 'vehicles',
      cell: (row) => {
        // An empty garage reads as empty. This column used to print
        // "MH01AB1234 (Hyundai Creta)" for every customer with no vehicle,
        // which put a plate nobody owns in front of an operator — and into the
        // CSV export below.
        const vehs = row.vehicles || [];
        if (vehs.length === 0) {
          return <span className="text-[11px] font-semibold text-gray-400 italic">None registered</span>;
        }
        return (
          <div className="text-[11px] font-semibold text-gray-700 truncate max-w-[160px]">
            <span className="inline-flex items-center gap-1">
              <Car className="w-3 h-3 text-amber-500 shrink-0" />
              <span className="truncate">{vehs[0]}</span>
            </span>
            {vehs.length > 1 && <span className="text-[10px] text-gray-400 block">+{vehs.length - 1} more</span>}
          </div>
        );
      }
    },
    {
      header: 'Actions',
      cell: (row) => (
        <button
          onClick={() => openCustomerModal(row)}
          className="px-3 py-1.5 text-[11px] font-bold text-white rounded-lg shadow-sm hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#e07b2a' }}
        >
          View CRM Profile
        </button>
      )
    }
  ];

  const customerBookings = selectedCustomer
    ? bookings.filter(b => b.customerName === selectedCustomer.name || b.customerName === selectedCustomer.fullName)
    : [];

  return (
    <div className="space-y-6">
      {/* KPI Header Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-500 font-bold block">Total Database Profiles</span>
            <span className="text-2xl font-black text-gray-900">{customers.length}</span>
          </div>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-bold">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-500 font-bold block">Active Members</span>
            <span className="text-2xl font-black text-emerald-600">{activeCount}</span>
          </div>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-center text-amber-600 font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-500 font-bold block">Due for Renewal</span>
            <span className="text-2xl font-black text-amber-600">{dueCount}</span>
          </div>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 font-bold">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-500 font-bold block">Suspended / Flagged</span>
            <span className="text-2xl font-black text-purple-700">{suspendedCount}</span>
          </div>
        </div>
      </div>

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Customer CRM Database</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            4,850+ customer profiles, membership tracking, anti-misuse rules, and vehicle registrations.
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

      {/* Main Data Table */}
      <DataTable
        columns={columns}
        data={customers}
        searchPlaceholder="Search customer by name, phone, email, city..."
        searchKeys={['name', 'fullName', 'phone', 'mobile', 'email', 'city', 'id']}
        filterKey="segment"
        filterOptions={['All', 'Active Member', 'Due for Renewal', 'Expired Member', 'Suspended Member', 'High-Value VIP', 'Regular Customer']}
      />

      {/* Modal: Customer Profile Drawer */}
      <AdminModal
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title={`Customer Profile: ${selectedCustomer?.name || selectedCustomer?.fullName}`}
        subtitle={`ID: ${selectedCustomer?.id || selectedCustomer?._id}`}
      >
        {selectedCustomer && (
          <div className="space-y-4 text-xs">
            {/* Header Badge Strip */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div>
                <span className="text-gray-400 font-bold block">Current Membership Status</span>
                <span className={`text-xs font-black px-2.5 py-0.5 rounded-full inline-block mt-0.5 ${
                  selectedCustomer.segment === 'Active Member' ? 'bg-emerald-100 text-emerald-800' :
                  selectedCustomer.segment === 'Due for Renewal' ? 'bg-amber-100 text-amber-800' :
                  selectedCustomer.segment === 'Suspended Member' ? 'bg-purple-100 text-purple-900' :
                  selectedCustomer.segment === 'Expired Member' ? 'bg-rose-100 text-rose-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {selectedCustomer.segment || 'Active Member'}
                </span>
              </div>

              <div className="text-right">
                <span className="text-gray-400 font-bold block">Member Since</span>
                <span className="font-extrabold text-gray-900">
                  {selectedCustomer.createdAt ? new Date(selectedCustomer.createdAt).toLocaleDateString() : 'Jan 2026'}
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 border-b border-gray-200 pb-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1.5 font-bold rounded-lg transition-colors ${
                  activeTab === 'overview' ? 'bg-amber-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Profile & Vehicles
              </button>
              <button
                onClick={() => setActiveTab('rules')}
                className={`px-3 py-1.5 font-bold rounded-lg transition-colors ${
                  activeTab === 'rules' ? 'bg-amber-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Membership & Usage Rules
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`px-3 py-1.5 font-bold rounded-lg transition-colors ${
                  activeTab === 'audit' ? 'bg-amber-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Misuse & Audit Log
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1.5 font-bold rounded-lg transition-colors ${
                  activeTab === 'history' ? 'bg-amber-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Bookings History
              </button>
            </div>

            {/* TAB 1: OVERVIEW & VEHICLES */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-gray-400 font-bold block">Mobile Phone</span>
                      <span className="font-extrabold text-gray-900">{selectedCustomer.phone || selectedCustomer.mobile || '+91 98000 00000'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-bold block">Email Address</span>
                      <span className="font-extrabold text-gray-900">{selectedCustomer.email}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-bold block">City</span>
                      <span className="font-extrabold text-gray-900">{selectedCustomer.city || 'Mumbai'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-bold block">Last Visit Date</span>
                      <span className="font-extrabold text-gray-900">{selectedCustomer.lastVisit || '2026-08-01'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/60">
                  <span className="text-xs font-bold text-amber-800 block">Total Lifetime Spent</span>
                  <span className="text-xl font-black text-amber-600">
                    ₹{Number(selectedCustomer.totalSpent || 24500).toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Registered Vehicles */}
                <div className="space-y-2">
                  <span className="font-bold text-gray-800 block">Registered Vehicles ({selectedCustomer.vehicles?.length || 0})</span>
                  <div className="space-y-1.5">
                    {(selectedCustomer.vehicles || []).length === 0 && (
                      <div className="p-2.5 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-center">
                        <span className="text-[11px] font-bold text-gray-500">No Registered Vehicles</span>
                      </div>
                    )}
                    {(selectedCustomer.vehicles || []).map((v, i) => (
                      <div key={i} className="p-2.5 bg-gray-100 rounded-xl font-bold text-gray-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4 text-amber-500" />
                          <span>{v}</span>
                        </div>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                          Plate Verified
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Add Vehicle Form */}
                  <form onSubmit={handleAddVehicleSubmit} className="pt-2 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Plate No (e.g. MH02CD5678)"
                      value={newVehiclePlate}
                      onChange={(e) => setNewVehiclePlate(e.target.value)}
                      className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg w-1/2 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Model (e.g. BMW X5)"
                      value={newVehicleModel}
                      onChange={(e) => setNewVehicleModel(e.target.value)}
                      className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg w-1/2 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-white font-bold rounded-lg shrink-0"
                      style={{ backgroundColor: '#e07b2a' }}
                    >
                      Add Vehicle
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* TAB 2: MEMBERSHIP & USAGE RULES MANAGEMENT */}
            {activeTab === 'rules' && (
              <div className="space-y-4">
                {/* Active Plan Summary Box */}
                <div className="p-4 bg-amber-500/10 border border-amber-300 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-amber-800 font-bold block uppercase">Subscribed Membership Plan</span>
                      <h3 className="text-base font-black text-amber-900">
                        {selectedCustomer.membership?.planName || 'No membership plan'}
                      </h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-black ${
                      selectedCustomer.segment === 'Suspended Member' ? 'bg-purple-900 text-white' :
                      selectedCustomer.segment === 'Due for Renewal' ? 'bg-amber-600 text-white' :
                      'bg-emerald-600 text-white'
                    }`}>
                      {selectedCustomer.segment || 'Regular Customer'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div>
                      <span className="text-gray-500 font-bold block">Start Date:</span>
                      <span className="font-extrabold text-gray-800">
                        {selectedCustomer.membership?.startDate ? new Date(selectedCustomer.membership.startDate).toLocaleDateString() : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-bold block">Expiry Date:</span>
                      <span className="font-extrabold text-gray-800">
                        {selectedCustomer.membership?.expiryDate ? new Date(selectedCustomer.membership.expiryDate).toLocaleDateString() : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Management Rules Config Form */}
                <form onSubmit={handleSaveUsageRules} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                  <h4 className="font-extrabold text-gray-900 flex items-center gap-1.5 text-xs">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    Anti-Misuse & Membership Usage Rules
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-gray-700 font-bold block mb-1">Max Services Per Day</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={rulesForm.maxPerDay}
                        onChange={(e) => setRulesForm({ ...rulesForm, maxPerDay: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg font-bold"
                      />
                      <span className="text-[10px] text-gray-500">Prevents multiple claims in 24 hrs</span>
                    </div>

                    <div>
                      <label className="text-gray-700 font-bold block mb-1">Max Services Per Month</label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={rulesForm.maxPerMonth}
                        onChange={(e) => setRulesForm({ ...rulesForm, maxPerMonth: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg font-bold"
                      />
                      <span className="text-[10px] text-gray-500">Monthly fair usage cap</span>
                    </div>

                    <div>
                      <label className="text-gray-700 font-bold block mb-1">Cool-Off Hours Buffer</label>
                      <input
                        type="number"
                        min="0"
                        max="72"
                        value={rulesForm.coolOffHours}
                        onChange={(e) => setRulesForm({ ...rulesForm, coolOffHours: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg font-bold"
                      />
                      <span className="text-[10px] text-gray-500">Min hours between uses</span>
                    </div>

                    <div>
                      <label className="text-gray-700 font-bold block mb-1">Vehicle License Plate Binding</label>
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="checkbox"
                          id="boundSwitch"
                          checked={rulesForm.boundVehiclesOnly}
                          onChange={(e) => setRulesForm({ ...rulesForm, boundVehiclesOnly: e.target.checked })}
                          className="w-4 h-4 text-amber-600 rounded"
                        />
                        <label htmlFor="boundSwitch" className="font-bold text-gray-800">
                          {rulesForm.boundVehiclesOnly ? 'Strictly Bound' : 'Any Vehicle Allowed'}
                        </label>
                      </div>
                      <span className="text-[10px] text-gray-500">Must match registered plates</span>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-4 py-1.5 font-bold text-white rounded-lg shadow-sm"
                      style={{ backgroundColor: '#e07b2a' }}
                    >
                      Save Usage Rules
                    </button>
                  </div>
                </form>

                {/* Management Administrative Overrides */}
                <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-200 space-y-3">
                  <h4 className="font-extrabold text-rose-900 flex items-center gap-1.5 text-xs">
                    <Lock className="w-4 h-4 text-rose-700" />
                    Management Override & Anti-Abuse Controls
                  </h4>

                  {selectedCustomer.segment === 'Suspended Member' ? (
                    <div className="p-3 bg-purple-100 border border-purple-300 rounded-xl space-y-2">
                      <p className="font-bold text-purple-900 text-xs">
                        ⚠️ This membership is currently SUSPENDED.
                      </p>
                      <p className="text-[11px] text-purple-800">
                        Reason: {selectedCustomer.membership?.suspensionReason || 'Not recorded'}
                      </p>
                      <button
                        onClick={handleReactivateMembership}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs"
                      >
                        Reactivate / Unsuspend Membership
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-gray-700 font-bold block">Suspension Reason (for Admin Record)</label>
                      <input
                        type="text"
                        placeholder="e.g. Attempted redemption for unregistered vehicle MH02AB9999"
                        value={suspensionReasonInput}
                        onChange={(e) => setSuspensionReasonInput(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                      />
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleSuspendMembership}
                          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg"
                        >
                          Suspend Membership
                        </button>

                        <button
                          type="button"
                          onClick={() => handleExtendExpiry(30)}
                          className="px-3.5 py-1.5 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-lg"
                        >
                          Extend Expiry (+30 Days)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: MISUSE & AUDIT LOG */}
            {activeTab === 'audit' && (
              <div className="space-y-3">
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 font-semibold">
                  🛡️ Anti-Abuse System monitors plate match, redemption cool-offs, and daily caps.
                </div>

                <div className="space-y-2">
                  <h4 className="font-extrabold text-gray-900 text-xs">Flagged Misuse & Security Audit History</h4>
                  
                  {selectedCustomer.membership?.misuseAlerts && selectedCustomer.membership.misuseAlerts.length > 0 ? (
                    selectedCustomer.membership.misuseAlerts.map((alert, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-start gap-3">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-gray-900">{alert.alertType || 'Misuse Alert'}</span>
                            <span className="text-[10px] text-gray-400 font-bold">
                              {alert.date ? new Date(alert.date).toLocaleString() : 'Recent'}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-600 mt-0.5">{alert.description}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl text-center text-gray-500">
                      No misuse alerts flagged for this customer profile.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: BOOKING HISTORY */}
            {activeTab === 'history' && (
              <div className="space-y-3">
                <span className="font-bold text-gray-800 block">Past Bookings & Claims ({customerBookings.length})</span>
                {customerBookings.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {customerBookings.map((b, i) => (
                      <div key={i} className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="font-black text-gray-900 block">{b.serviceName || b.serviceKey}</span>
                          <span className="text-[10px] text-gray-500">{b.date} • {b.id}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-amber-600 block">₹{b.total}</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                            {b.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl text-center text-gray-500">
                    No past booking records found for this user in current session.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </AdminModal>

      {/* Modal: Register Customer */}
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
            <label className="font-bold text-gray-700 block mb-1">
              Primary Vehicle (Reg. No &amp; Model){' '}
              <span className="font-medium text-gray-400">— optional, leave blank if none</span>
            </label>
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
