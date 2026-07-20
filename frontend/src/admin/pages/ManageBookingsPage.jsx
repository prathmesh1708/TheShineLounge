import React, { useState } from 'react';
import { Plus, Calendar, Clock, UserCheck, Eye, CheckCircle2, AlertCircle, Car, DollarSign } from 'lucide-react';
import { useAdmin } from '../common/context/AdminContext';
import DataTable from '../common/components/DataTable';
import AdminModal from '../common/components/AdminModal';

export default function ManageBookingsPage() {
  const { bookings, staffList, updateBookingStatus, assignStaffToBooking, addBooking } = useAdmin();

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Booking Form State
  const [bookingForm, setBookingForm] = useState({
    customerName: '',
    phone: '',
    service: 'Car Wash',
    plan: 'Single Wash',
    amount: 699,
    timeSlot: '05:00 PM',
    vehicleNo: 'MH01XY1234',
    paymentMode: 'UPI'
  });

  const handleCreateBooking = (e) => {
    e.preventDefault();
    if (!bookingForm.customerName || !bookingForm.phone) return;
    addBooking(bookingForm);
    setIsAddModalOpen(false);
    setBookingForm({
      customerName: '',
      phone: '',
      service: 'Car Wash',
      plan: 'Single Wash',
      amount: 699,
      timeSlot: '05:00 PM',
      vehicleNo: 'MH01XY1234',
      paymentMode: 'UPI'
    });
  };

  const columns = [
    {
      header: 'Booking ID',
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
      header: 'Service & Package',
      accessorKey: 'service',
      cell: (row) => (
        <div>
          <span className="font-extrabold text-blue-900 block">{row.service}</span>
          <span className="text-[10px] font-semibold text-gray-500">{row.plan}</span>
        </div>
      )
    },
    {
      header: 'Date & Slot',
      accessorKey: 'date',
      cell: (row) => (
        <div className="text-gray-700 font-medium">
          <p className="font-bold text-gray-900">{row.date}</p>
          <p className="text-[10px] text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-500" /> {row.timeSlot}
          </p>
        </div>
      )
    },
    {
      header: 'Total Amount',
      accessorKey: 'total',
      cell: (row) => (
        <div>
          <span className="font-black text-gray-900 block">₹{row.total.toFixed(0)}</span>
          <span className="text-[10px] text-gray-400 font-semibold">{row.paymentMode}</span>
        </div>
      )
    },
    {
      header: 'Assigned Staff',
      accessorKey: 'staffAssigned',
      cell: (row) => (
        <span className="font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded-md text-[11px]">
          {row.staffAssigned || 'Unassigned'}
        </span>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (row) => (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
          row.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
          row.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
          row.status === 'Confirmed' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
        }`}>
          {row.status}
        </span>
      )
    },
    {
      header: 'Actions',
      cell: (row) => (
        <button
          onClick={() => setSelectedBooking(row)}
          className="px-2.5 py-1 text-[11px] font-bold text-white rounded-lg shadow-2xs"
          style={{ backgroundColor: '#e07b2a' }}
        >
          View / Update
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Unified Booking Operations</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage real-time appointments across Car Wash, Detailing, Pet Spa, Café, and Salon.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white rounded-xl shadow-sm hover:opacity-95 transition-opacity"
          style={{ backgroundColor: '#e07b2a' }}
        >
          <Plus className="w-4 h-4" /> Create Manual Booking
        </button>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={bookings}
        searchPlaceholder="Search bookings by ID, customer name, service..."
        searchKeys={['id', 'customerName', 'phone', 'service', 'vehicleNo']}
        filterKey="status"
        filterOptions={['All', 'Pending', 'Confirmed', 'In Progress', 'Completed']}
      />

      {/* Modal: View & Update Booking */}
      <AdminModal
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        title={`Booking #${selectedBooking?.id}`}
        subtitle={selectedBooking?.service}
      >
        {selectedBooking && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 grid grid-cols-2 gap-3">
              <div>
                <span className="text-gray-400 font-bold block">Customer Name</span>
                <span className="font-extrabold text-gray-900">{selectedBooking.customerName}</span>
              </div>
              <div>
                <span className="text-gray-400 font-bold block">Contact Phone</span>
                <span className="font-extrabold text-gray-900">{selectedBooking.phone}</span>
              </div>
              <div>
                <span className="text-gray-400 font-bold block">Selected Package</span>
                <span className="font-extrabold text-amber-600">{selectedBooking.plan}</span>
              </div>
              <div>
                <span className="text-gray-400 font-bold block">Vehicle Reg. No</span>
                <span className="font-extrabold text-gray-900">{selectedBooking.vehicleNo}</span>
              </div>
              <div>
                <span className="text-gray-400 font-bold block">Time Slot</span>
                <span className="font-extrabold text-gray-900">{selectedBooking.date} at {selectedBooking.timeSlot}</span>
              </div>
              <div>
                <span className="text-gray-400 font-bold block">Total Amount (Inc GST)</span>
                <span className="font-extrabold text-gray-900">₹{selectedBooking.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Change Status */}
            <div>
              <label className="font-bold text-gray-700 block mb-1">Update Status Flow</label>
              <div className="grid grid-cols-4 gap-2">
                {['Pending', 'Confirmed', 'In Progress', 'Completed'].map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      updateBookingStatus(selectedBooking.id, st);
                      setSelectedBooking({ ...selectedBooking, status: st });
                    }}
                    className={`py-2 text-[11px] font-bold rounded-xl border transition-colors ${
                      selectedBooking.status === st
                        ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Assign Staff */}
            <div>
              <label className="font-bold text-gray-700 block mb-1">Assign Service Employee</label>
              <select
                value={selectedBooking.staffAssigned || ''}
                onChange={(e) => {
                  assignStaffToBooking(selectedBooking.id, e.target.value);
                  setSelectedBooking({ ...selectedBooking, staffAssigned: e.target.value });
                }}
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-semibold"
              >
                <option value="">Select Staff Member...</option>
                {staffList.map((stf) => (
                  <option key={stf.id} value={stf.name}>
                    {stf.name} ({stf.role} - {stf.department})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </AdminModal>

      {/* Modal: Create Manual Booking */}
      <AdminModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create New Walk-In / Manual Booking"
        subtitle="Book customer appointment at lounge counter"
      >
        <form onSubmit={handleCreateBooking} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Customer Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Kumar"
                value={bookingForm.customerName}
                onChange={(e) => setBookingForm({ ...bookingForm, customerName: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">Mobile Phone</label>
              <input
                type="text"
                required
                placeholder="+91 98000 00000"
                value={bookingForm.phone}
                onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Select Service</label>
              <select
                value={bookingForm.service}
                onChange={(e) => setBookingForm({ ...bookingForm, service: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-semibold"
              >
                <option value="Car Wash">Car Wash</option>
                <option value="Car Detailing">Car Detailing</option>
                <option value="Dog Bath">Dog Bath</option>
                <option value="Café">Café</option>
                <option value="Drive-Through Café">Drive-Through Café</option>
                <option value="Men's Salon">Men's Salon</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">Package Name</label>
              <input
                type="text"
                value={bookingForm.plan}
                onChange={(e) => setBookingForm({ ...bookingForm, plan: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Amount (₹)</label>
              <input
                type="number"
                value={bookingForm.amount}
                onChange={(e) => setBookingForm({ ...bookingForm, amount: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">Payment Method</label>
              <select
                value={bookingForm.paymentMode}
                onChange={(e) => setBookingForm({ ...bookingForm, paymentMode: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-semibold"
              >
                <option value="UPI">UPI / QR Code</option>
                <option value="Card">Credit/Debit Card</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
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
              Confirm Booking
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
