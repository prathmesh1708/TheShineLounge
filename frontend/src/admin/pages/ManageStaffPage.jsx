import React, { useState, useEffect, useCallback } from 'react';
import { Plus, UserCheck, Mail, Phone, Shield, ToggleLeft, ToggleRight, Trash2, KeyRound, Pencil, AlertCircle, X, Search, ChevronLeft, ChevronRight, Coffee, Timer, CheckCircle2 } from 'lucide-react';
import AdminModal from '../common/components/AdminModal';
import userService from '../../common/services/userService';

const DEPARTMENTS = ['Car Wash', 'Detailing', 'Cafe', 'Drive-Through Café', 'Salon', 'Dog Wash', 'Accounts', 'CRM', 'Reception', 'Inventory', 'Manager', 'Management'];
const ALL_PERMISSIONS = ['dashboard', 'bookings', 'memberships', 'customers', 'orders', 'inventory', 'reports', 'payments'];

const emptyForm = {
  fullName: '',
  email: '',
  password: '',
  mobile: '',
  department: 'Car Wash',
  permissions: ['dashboard'],
  branch: 'Main Branch'
};

export default function ManageStaffPage() {
  const [staffList, setStaffList] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isResetPwOpen, setIsResetPwOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isBreakOpen, setIsBreakOpen] = useState(false);
  const [breakDuration, setBreakDuration] = useState(30);
  const [breakReason, setBreakReason] = useState('Rest / Lunch Break');
  const [breakStaff, setBreakStaff] = useState(null);
  const [breakCountdown, setBreakCountdown] = useState(0);

  const [form, setForm] = useState({ ...emptyForm });
  const [editForm, setEditForm] = useState({});
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  // Fetch staff list
  const fetchStaff = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 20, search };
      if (departmentFilter !== 'All') params.department = departmentFilter;
      if (statusFilter !== 'All') params.status = statusFilter;

      const data = await userService.getStaffList(params);
      if (data.success) {
        setStaffList(data.staff || []);
        setPagination(data.pagination || { total: data.count || (data.staff ? data.staff.length : 0), page: 1, limit: 20, pages: 1 });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load staff');
    } finally {
      setLoading(false);
    }
  }, [search, departmentFilter, statusFilter]);

  useEffect(() => {
    fetchStaff(1);
  }, [fetchStaff]);

  // Create staff
  const handleAddStaff = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalLoading(true);
    try {
      if (!form.fullName || !form.email || !form.password) {
        setModalError('Full Name, Email, and Password are required');
        setModalLoading(false);
        return;
      }
      await userService.createStaff(form);
      setIsAddOpen(false);
      setForm({ ...emptyForm });
      fetchStaff(1);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to create staff');
    } finally {
      setModalLoading(false);
    }
  };

  // Edit staff
  const openEdit = (staff) => {
    setSelectedStaff(staff);
    setEditForm({
      fullName: staff.fullName,
      email: staff.email,
      mobile: staff.mobile,
      department: staff.department,
      permissions: staff.permissions || [],
      branch: staff.branch
    });
    setModalError('');
    setIsEditOpen(true);
  };

  const handleEditStaff = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalLoading(true);
    try {
      await userService.updateStaff(selectedStaff._id, editForm);
      setIsEditOpen(false);
      fetchStaff(pagination?.page || 1);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to update staff');
    } finally {
      setModalLoading(false);
    }
  };

  // Toggle status
  const handleToggleStatus = async (staff) => {
    try {
      await userService.toggleStaffStatus(staff._id);
      fetchStaff(pagination?.page || 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  // Reset password
  const openResetPw = (staff) => {
    setSelectedStaff(staff);
    setNewPassword('');
    setModalError('');
    setIsResetPwOpen(true);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalLoading(true);
    try {
      if (!newPassword || newPassword.length < 6) {
        setModalError('Password must be at least 6 characters');
        setModalLoading(false);
        return;
      }
      await userService.resetStaffPassword(selectedStaff._id, newPassword);
      setIsResetPwOpen(false);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setModalLoading(false);
    }
  };

  // Delete staff
  const openDelete = (staff) => {
    setSelectedStaff(staff);
    setIsDeleteOpen(true);
  };

  const handleDeleteStaff = async () => {
    setModalLoading(true);
    try {
      await userService.deleteStaff(selectedStaff._id);
      setIsDeleteOpen(false);
      fetchStaff(pagination?.page || 1);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to delete staff');
    } finally {
      setModalLoading(false);
    }
  };

  // Break Management Handlers
  const openBreakModal = async (staff) => {
    setSelectedStaff(staff);
    setBreakStaff(staff);
    setBreakDuration(staff.breakDuration || 30);
    setBreakReason(staff.breakReason || 'Rest / Lunch Break');
    setModalError('');
    setIsBreakOpen(true);
    try {
      const res = await userService.getStaffBreakStatus(staff._id);
      if (res && res.success) {
        setBreakStaff(res.staff);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (!isBreakOpen || !breakStaff?.isOnBreak || !breakStaff?.breakEndTime) return;
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(breakStaff.breakEndTime).getTime() - Date.now()) / 1000));
      setBreakCountdown(diff);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isBreakOpen, breakStaff]);

  const handleStartBreak = async () => {
    if (!selectedStaff?._id) return;
    setModalLoading(true);
    setModalError('');
    try {
      const res = await userService.updateStaffBreak(selectedStaff._id, {
        action: 'start',
        duration: breakDuration,
        reason: breakReason
      });
      if (res.success && res.staff) {
        setBreakStaff(res.staff);
        fetchStaff(pagination?.page || 1);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('tsl_staff_updated'));
          window.dispatchEvent(new Event('storage'));
        }
      }
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to start break');
    } finally {
      setModalLoading(false);
    }
  };

  const handleEndBreak = async () => {
    if (!selectedStaff?._id) return;
    setModalLoading(true);
    setModalError('');
    try {
      const res = await userService.updateStaffBreak(selectedStaff._id, { action: 'end' });
      if (res.success && res.staff) {
        setBreakStaff(res.staff);
        fetchStaff(pagination?.page || 1);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('tsl_staff_updated'));
          window.dispatchEvent(new Event('storage'));
        }
      }
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to end break');
    } finally {
      setModalLoading(false);
    }
  };


  // Permission toggle helper
  const togglePermission = (perm, formObj, setFormObj) => {
    const current = formObj.permissions || [];
    if (current.includes(perm)) {
      setFormObj({ ...formObj, permissions: current.filter(p => p !== perm) });
    } else {
      setFormObj({ ...formObj, permissions: [...current, perm] });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Staff & Employee Roster</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage employees, role permissions, and department assignments across all services.
          </p>
        </div>
        <button
          onClick={() => { setForm({ ...emptyForm }); setModalError(''); setIsAddOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white rounded-xl shadow-sm hover:opacity-95 transition-opacity"
          style={{ backgroundColor: '#e07b2a' }}
        >
          <Plus className="w-4 h-4" /> Onboard New Staff Member
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs font-semibold border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="px-3 py-2 text-xs font-bold border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="All">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs font-bold border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Staff Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-extrabold text-gray-600">Employee</th>
                <th className="text-left px-4 py-3 font-extrabold text-gray-600">Department</th>
                <th className="text-left px-4 py-3 font-extrabold text-gray-600">Contact</th>
                <th className="text-left px-4 py-3 font-extrabold text-gray-600">Permissions</th>
                <th className="text-left px-4 py-3 font-extrabold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-extrabold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      Loading staff...
                    </div>
                  </td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-gray-400 font-semibold">
                    No staff members found
                  </td>
                </tr>
              ) : (
                staffList.map((staff) => (
                  <tr key={staff._id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-extrabold text-sm">
                          {staff.fullName?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{staff.fullName}</p>
                          <p className="text-[10px] text-gray-400 font-medium">{staff.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-gray-100 text-gray-700">
                        {staff.department || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-gray-800">{staff.mobile || '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[180px]">
                        {(staff.permissions || []).slice(0, 3).map(p => (
                          <span key={p} className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700">{p}</span>
                        ))}
                        {(staff.permissions || []).length > 3 && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-gray-100 text-gray-500">+{staff.permissions.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1 items-start">
                        {staff.isOnBreak ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white flex items-center gap-1 animate-pulse shadow-xs">
                            <Coffee className="w-3 h-3" /> On Break ({staff.breakDuration || 30}m)
                          </span>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(staff)}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all ${
                              staff.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            {staff.isActive ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                            <span>{staff.isActive ? 'Active' : 'Inactive'}</span>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => openBreakModal(staff)} 
                          className="p-1.5 rounded-lg hover:bg-amber-100 text-amber-700 bg-amber-50 transition-colors" 
                          title="Manage Break & Live Timer"
                        >
                          <Coffee className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => openEdit(staff)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => openResetPw(staff)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors" title="Reset Password">
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => openDelete(staff)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination?.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-[10px] text-gray-500 font-semibold">
              Showing {staffList.length} of {pagination?.total || staffList.length} staff members
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={(pagination?.page || 1) <= 1}
                onClick={() => fetchStaff((pagination?.page || 1) - 1)}
                className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-gray-700 px-2">
                {pagination?.page || 1} / {pagination?.pages || 1}
              </span>
              <button
                disabled={(pagination?.page || 1) >= (pagination?.pages || 1)}
                onClick={() => fetchStaff((pagination?.page || 1) + 1)}
                className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── ADD STAFF MODAL ─────────────────────────────────── */}
      <AdminModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Onboard New Staff Member" subtitle="Create a new employee account with department and permissions">
        <form onSubmit={handleAddStaff} className="space-y-4 text-xs">
          {modalError && (
            <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600">
              <AlertCircle className="w-3.5 h-3.5" /><span>{modalError}</span>
            </div>
          )}

          <div>
            <label className="font-bold text-gray-700 block mb-1">Full Name *</label>
            <input type="text" required placeholder="e.g. Vikramaditya Singh" value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Email *</label>
              <input type="email" required placeholder="staff@example.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">Password *</label>
              <input type="password" required placeholder="Min 6 characters" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Mobile Phone</label>
              <input type="text" placeholder="+91 98000 00000" value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">Department</label>
              <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-semibold">
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* Permissions checkboxes */}
          <div>
            <label className="font-bold text-gray-700 block mb-2">Module Permissions</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ALL_PERMISSIONS.map(perm => (
                <label key={perm} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={form.permissions.includes(perm)}
                    onChange={() => togglePermission(perm, form, setForm)}
                    className="w-3.5 h-3.5 rounded accent-amber-500" />
                  <span className="text-[11px] font-semibold text-gray-700 capitalize">{perm}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button type="button" onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">Cancel</button>
            <button type="submit" disabled={modalLoading}
              className="px-4 py-2 font-bold text-white rounded-xl disabled:opacity-60" style={{ backgroundColor: '#e07b2a' }}>
              {modalLoading ? 'Creating...' : 'Onboard Employee'}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* ── EDIT STAFF MODAL ────────────────────────────────── */}
      <AdminModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Staff Member" subtitle={`Editing: ${selectedStaff?.fullName || ''}`}>
        <form onSubmit={handleEditStaff} className="space-y-4 text-xs">
          {modalError && (
            <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600">
              <AlertCircle className="w-3.5 h-3.5" /><span>{modalError}</span>
            </div>
          )}

          <div>
            <label className="font-bold text-gray-700 block mb-1">Full Name</label>
            <input type="text" value={editForm.fullName || ''}
              onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Email</label>
              <input type="email" value={editForm.email || ''}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">Mobile</label>
              <input type="text" value={editForm.mobile || ''}
                onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500" />
            </div>
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">Department</label>
            <select value={editForm.department || ''} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-semibold">
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-2">Module Permissions</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ALL_PERMISSIONS.map(perm => (
                <label key={perm} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={(editForm.permissions || []).includes(perm)}
                    onChange={() => togglePermission(perm, editForm, setEditForm)}
                    className="w-3.5 h-3.5 rounded accent-amber-500" />
                  <span className="text-[11px] font-semibold text-gray-700 capitalize">{perm}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button type="button" onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">Cancel</button>
            <button type="submit" disabled={modalLoading}
              className="px-4 py-2 font-bold text-white rounded-xl disabled:opacity-60" style={{ backgroundColor: '#e07b2a' }}>
              {modalLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* ── RESET PASSWORD MODAL ────────────────────────────── */}
      <AdminModal isOpen={isResetPwOpen} onClose={() => setIsResetPwOpen(false)} title="Reset Staff Password" subtitle={`Resetting password for: ${selectedStaff?.fullName || ''}`}>
        <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
          {modalError && (
            <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600">
              <AlertCircle className="w-3.5 h-3.5" /><span>{modalError}</span>
            </div>
          )}

          <div>
            <label className="font-bold text-gray-700 block mb-1">New Password (min 6 characters)</label>
            <input type="password" required placeholder="Enter new password" value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500" />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button type="button" onClick={() => setIsResetPwOpen(false)}
              className="px-4 py-2 font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">Cancel</button>
            <button type="submit" disabled={modalLoading}
              className="px-4 py-2 font-bold text-white rounded-xl disabled:opacity-60" style={{ backgroundColor: '#e07b2a' }}>
              {modalLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* ── DELETE CONFIRMATION MODAL ───────────────────────── */}
      <AdminModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Remove Staff Member" subtitle="This action will deactivate the account (soft delete)">
        <div className="space-y-4 text-xs">
          <p className="text-gray-600 font-semibold">
            Are you sure you want to remove <strong className="text-gray-900">{selectedStaff?.fullName}</strong> ({selectedStaff?.email})?
            They will no longer be able to login.
          </p>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button onClick={() => setIsDeleteOpen(false)}
              className="px-4 py-2 font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">Cancel</button>
            <button onClick={handleDeleteStaff} disabled={modalLoading}
              className="px-4 py-2 font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 disabled:opacity-60">
              {modalLoading ? 'Removing...' : 'Remove Staff'}
            </button>
          </div>
        </div>
      </AdminModal>

      {/* ── BREAK MANAGEMENT MODAL ───────────────────────── */}
      <AdminModal isOpen={isBreakOpen} onClose={() => setIsBreakOpen(false)} title="Staff Break Management & Live Timer" subtitle={`Managing: ${selectedStaff?.fullName || 'Staff Member'}`}>
        <div className="space-y-4 text-xs">
          {modalError && (
            <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600">
              <AlertCircle className="w-3.5 h-3.5" /><span>{modalError}</span>
            </div>
          )}

          {breakStaff?.isOnBreak ? (
            <div className="rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700 p-4 text-white shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                    <Coffee className="w-4 h-4 text-amber-100 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded-full">
                      Staff Break In Progress
                    </span>
                    <h4 className="text-sm font-black mt-0.5">{breakStaff.breakReason || 'Rest / Lunch Break'}</h4>
                  </div>
                </div>

                <span className="text-[11px] font-extrabold bg-white/20 px-2.5 py-1 rounded-xl">
                  {breakStaff.breakDuration || 30}m Break
                </span>
              </div>

              {/* Reverse Countdown Display */}
              <div className="bg-black/25 backdrop-blur-md rounded-xl p-3 border border-white/15 text-center">
                <p className="text-[10px] font-bold text-amber-200 uppercase tracking-wider flex items-center justify-center gap-1 mb-0.5">
                  <Timer className="w-3 h-3 text-amber-300" />
                  Live Reverse Clock
                </p>
                <div className="text-3xl font-black font-mono tracking-tight text-white py-0.5">
                  {`${String(Math.floor(breakCountdown / 60)).padStart(2, '0')}:${String(breakCountdown % 60).padStart(2, '0')}`}
                </div>
                <div className="flex justify-between items-center text-[10px] text-amber-100 font-semibold px-2 mt-1">
                  <span>Started: {breakStaff.breakStartTime ? new Date(breakStaff.breakStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                  <span>Return By: {breakStaff.breakEndTime ? new Date(breakStaff.breakEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                </div>
              </div>

              <button
                type="button"
                disabled={modalLoading}
                onClick={handleEndBreak}
                className="w-full py-2.5 bg-white hover:bg-amber-50 active:scale-98 text-orange-950 font-black rounded-xl shadow-sm text-xs transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{modalLoading ? 'Updating...' : '⏹️ End Break Early & Resume Workstation Duty'}</span>
              </button>
            </div>
          ) : (
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-3.5">
              <div className="flex items-center gap-2 text-amber-900">
                <Coffee className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div>
                  <h4 className="font-black text-xs">Assign Break Duration & Start</h4>
                  <p className="text-[11px] text-amber-700">Staff dashboard will immediately receive a notification and show a 30-min reverse timer.</p>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1.5">Preset Duration</label>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 30, 45, 60].map((d) => (
                    <button
                      key={`m-dur-${d}`}
                      type="button"
                      onClick={() => setBreakDuration(d)}
                      className={`py-2 rounded-xl font-bold text-xs border transition-all ${
                        breakDuration === d
                          ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {d} Min {d === 30 && '(Default)'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Custom Duration (Minutes)</label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={breakDuration}
                    onChange={(e) => setBreakDuration(Math.max(1, Number(e.target.value) || 30))}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-800 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Break Reason / Note</label>
                  <input
                    type="text"
                    value={breakReason}
                    onChange={(e) => setBreakReason(e.target.value)}
                    placeholder="e.g. Lunch Break"
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-semibold text-gray-800 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={modalLoading}
                onClick={handleStartBreak}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black rounded-xl shadow-md transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <Coffee className="w-4 h-4 text-white" />
                <span>{modalLoading ? 'Starting...' : `☕ Start ${breakDuration}-Minute Break for ${selectedStaff?.fullName || 'Staff'}`}</span>
              </button>
            </div>
          )}
        </div>
      </AdminModal>
    </div>
  );
}
