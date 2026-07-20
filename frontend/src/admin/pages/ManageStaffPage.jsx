import React, { useState } from 'react';
import { Plus, UserCheck, Mail, Phone, Calendar, ToggleLeft, ToggleRight, Shield, Award } from 'lucide-react';
import { useAdmin } from '../common/context/AdminContext';
import DataTable from '../common/components/DataTable';
import AdminModal from '../common/components/AdminModal';

export default function ManageStaffPage() {
  const { staffList, addStaff, toggleStaffStatus } = useAdmin();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [form, setForm] = useState({
    name: '',
    role: 'Car Wash Lead',
    department: 'Car Wash',
    phone: '',
    email: '',
    salary: '₹35,000 / mo',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
  });

  const handleAddStaff = (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    addStaff(form);
    setIsModalOpen(false);
    setForm({
      name: '',
      role: 'Car Wash Lead',
      department: 'Car Wash',
      phone: '',
      email: '',
      salary: '₹35,000 / mo',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
    });
  };

  const columns = [
    {
      header: 'Employee Staff',
      accessorKey: 'name',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <img src={row.avatar} alt={row.name} className="w-9 h-9 rounded-full object-cover border border-amber-300" />
          <div>
            <p className="font-bold text-gray-900">{row.name}</p>
            <p className="text-[10px] text-gray-400 font-medium">{row.id}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Designated Role',
      accessorKey: 'role',
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-bold text-blue-950">{row.role}</span>
        </div>
      )
    },
    {
      header: 'Department',
      accessorKey: 'department',
      cell: (row) => (
        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-gray-100 text-gray-700">
          {row.department}
        </span>
      )
    },
    {
      header: 'Contact Info',
      accessorKey: 'phone',
      cell: (row) => (
        <div>
          <p className="font-bold text-gray-800">{row.phone}</p>
          <p className="text-[10px] text-gray-400">{row.email}</p>
        </div>
      )
    },
    {
      header: 'Monthly Compensation',
      accessorKey: 'salary',
      cell: (row) => <span className="font-extrabold text-emerald-700">{row.salary}</span>
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (row) => (
        <button
          onClick={() => toggleStaffStatus(row.id)}
          className={`px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all ${
            row.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'
          }`}
        >
          {row.status === 'Active' ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
          <span>{row.status}</span>
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Staff & Employee Roster</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage employees, role permissions, salaries, and department assignments across all 6 services.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white rounded-xl shadow-sm hover:opacity-95 transition-opacity"
          style={{ backgroundColor: '#e07b2a' }}
        >
          <Plus className="w-4 h-4" /> Onboard New Staff Member
        </button>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={staffList}
        searchPlaceholder="Search staff by name, role, department, phone..."
        searchKeys={['name', 'role', 'department', 'phone', 'email']}
        filterKey="department"
        filterOptions={['All', 'Management', 'Car Wash', 'Car Detailing', 'Café', 'Dog Wash', 'Men\'s Salon']}
      />

      {/* Modal: Onboard Staff */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Onboard New Employee / Staff"
        subtitle="Assign role, department, and salary package"
      >
        <form onSubmit={handleAddStaff} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-gray-700 block mb-1">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Vikramaditya Singh"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Department</label>
              <select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-semibold"
              >
                <option value="Car Wash">Car Wash</option>
                <option value="Car Detailing">Car Detailing</option>
                <option value="Café">Café</option>
                <option value="Dog Wash">Dog Wash</option>
                <option value="Men's Salon">Men's Salon</option>
                <option value="Management">Management</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">Assigned Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-semibold"
              >
                <option value="Super Admin">Super Admin</option>
                <option value="Branch Manager">Branch Manager</option>
                <option value="Car Wash Staff">Car Wash Staff</option>
                <option value="Detailing Manager">Detailing Manager</option>
                <option value="Café Manager">Café Manager</option>
                <option value="Salon Manager">Salon Manager</option>
                <option value="Cashier">Cashier</option>
                <option value="Accountant">Accountant</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Mobile Phone</label>
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
                placeholder="staff@theshinelounge.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">Salary / Compensation (INR)</label>
            <input
              type="text"
              placeholder="e.g. ₹40,000 / mo"
              value={form.salary}
              onChange={(e) => setForm({ ...form, salary: e.target.value })}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-bold"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-bold text-white rounded-xl"
              style={{ backgroundColor: '#e07b2a' }}
            >
              Onboard Employee
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
