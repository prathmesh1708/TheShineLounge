import React, { useState } from 'react';
import { CreditCard, ShieldCheck, RefreshCw, AlertTriangle, CheckCircle2, User, Car } from 'lucide-react';
import { useAdmin } from '../common/context/AdminContext';
import DataTable from '../common/components/DataTable';
import AdminModal from '../common/components/AdminModal';

export default function ManageMembershipsPage() {
  const { memberships, updateMembershipStatus, renewMembership } = useAdmin();
  const [selectedMember, setSelectedMember] = useState(null);

  const columns = [
    {
      header: 'Membership ID',
      accessorKey: 'id',
      cell: (row) => <span className="font-bold text-gray-900">{row.id}</span>
    },
    {
      header: 'Customer Details',
      accessorKey: 'customerName',
      cell: (row) => (
        <div>
          <p className="font-bold text-gray-900">{row.customerName}</p>
          <p className="text-[11px] text-gray-500">{row.phone}</p>
        </div>
      )
    },
    {
      header: 'Vehicle Registered',
      accessorKey: 'vehicleNo',
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <Car className="w-3.5 h-3.5 text-amber-500" />
          <div>
            <span className="font-extrabold text-gray-800 block">{row.vehicleNo}</span>
            <span className="text-[10px] text-gray-400">{row.vehicleModel}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Plan Tier',
      accessorKey: 'planName',
      cell: (row) => (
        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-100">
          {row.planName}
        </span>
      )
    },
    {
      header: 'Washes Used',
      accessorKey: 'washesUsed',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full"
              style={{ width: `${(row.washesUsed / row.maxWashes) * 100}%` }}
            />
          </div>
          <span className="font-bold text-gray-700">{row.washesUsed}/{row.maxWashes}</span>
        </div>
      )
    },
    {
      header: 'Expiry Date',
      accessorKey: 'expiryDate',
      cell: (row) => <span className="font-semibold text-gray-600">{row.expiryDate}</span>
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (row) => (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
          row.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
          row.status === 'Expiring Soon' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
        }`}>
          {row.status}
        </span>
      )
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedMember(row)}
            className="px-2.5 py-1 text-[11px] font-bold text-white rounded-lg shadow-2xs"
            style={{ backgroundColor: '#e07b2a' }}
          >
            Manage
          </button>
          {row.status !== 'Active' && (
            <button
              onClick={() => renewMembership(row.id)}
              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg"
              title="Quick Renew"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Membership Subscriptions</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Monitor active monthly wash passes, annual VIP memberships, and expiration renewals.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase">Active Subscriptions</p>
            <p className="text-lg font-black text-gray-900">1,240 Passholders</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase">Expiring This Month</p>
            <p className="text-lg font-black text-amber-600">48 Memberships</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase">MRR (Monthly Recurring)</p>
            <p className="text-lg font-black text-blue-900">₹14.20 Lakhs</p>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={memberships}
        searchPlaceholder="Search memberships by customer, vehicle, or ID..."
        searchKeys={['customerName', 'vehicleNo', 'id', 'planName']}
        filterKey="status"
        filterOptions={['All', 'Active', 'Expiring Soon', 'Expired']}
      />

      {/* Modal: Manage Member */}
      <AdminModal
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        title={`Membership Details: ${selectedMember?.id}`}
        subtitle={selectedMember?.customerName}
      >
        {selectedMember && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 grid grid-cols-2 gap-3">
              <div>
                <span className="text-gray-400 font-bold block">Customer Phone</span>
                <span className="font-extrabold text-gray-900">{selectedMember.phone}</span>
              </div>
              <div>
                <span className="text-gray-400 font-bold block">Registered Vehicle</span>
                <span className="font-extrabold text-gray-900">{selectedMember.vehicleNo} ({selectedMember.vehicleModel})</span>
              </div>
              <div>
                <span className="text-gray-400 font-bold block">Plan Tier</span>
                <span className="font-extrabold text-amber-600">{selectedMember.planName} (₹{selectedMember.amount})</span>
              </div>
              <div>
                <span className="text-gray-400 font-bold block">Washes Used</span>
                <span className="font-extrabold text-gray-900">{selectedMember.washesUsed} of {selectedMember.maxWashes} Washes</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-gray-400 font-bold block">Start Date</span>
                <span className="font-semibold text-gray-800">{selectedMember.startDate}</span>
              </div>
              <div>
                <span className="text-gray-400 font-bold block">Expiration Date</span>
                <span className="font-semibold text-gray-800">{selectedMember.expiryDate}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 space-y-2">
              <span className="font-bold text-gray-700 block">Actions & Status Control</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    renewMembership(selectedMember.id);
                    setSelectedMember(null);
                  }}
                  className="py-2 px-3 text-xs font-bold text-white rounded-xl shadow-xs"
                  style={{ backgroundColor: '#e07b2a' }}
                >
                  Renew Membership (30 Days)
                </button>
                <button
                  onClick={() => {
                    updateMembershipStatus(selectedMember.id, 'Expired');
                    setSelectedMember(null);
                  }}
                  className="py-2 px-3 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100"
                >
                  Suspend / Cancel Pass
                </button>
              </div>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
