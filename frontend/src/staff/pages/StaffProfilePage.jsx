import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStaff } from '../common/context/StaffContext';
import { Phone, Mail, LogOut } from 'lucide-react';
import StaffLeaveSection from '../common/components/StaffLeaveSection';
import StaffSalarySection from '../common/components/StaffSalarySection';

export default function StaffProfilePage() {
  const navigate = useNavigate();
  const { currentStaff, logoutStaff, isCheckedIn, checkInTime } = useStaff();

  const handleLogout = () => {
    logoutStaff();
    navigate('/staff/login');
  };

  return (
    <div className="space-y-4">
      {/* 1. Main Profile Card */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs text-center space-y-4">
        {/* Avatar with Status Ring */}
        <div className="relative w-16 h-16 mx-auto">
          <img
            src={currentStaff?.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80'}
            alt="Staff Profile"
            className="w-full h-full object-cover rounded-full border-4 border-amber-500 shadow-sm"
          />
          <span
            className={`absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full border-2 border-white ${
              isCheckedIn ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
        </div>

        {/* Name & Role Info */}
        <div className="space-y-1">
          <h2 className="font-extrabold text-base text-gray-900">{currentStaff?.fullName || currentStaff?.name || 'Staff Member'}</h2>
          <span className="inline-block px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
            {currentStaff?.staffRole || currentStaff?.role || 'Staff Specialist'}
          </span>
          <p className="text-[11px] text-gray-500 font-semibold pt-0.5">
            {[currentStaff?.department, currentStaff?.staffId || currentStaff?.employeeId].filter(Boolean).join(' • ') || '—'}
          </p>
        </div>

        {/* Shift Status Box */}
        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center text-xs">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide block">Shift Status</span>
          <span className={`font-black text-xs ${isCheckedIn ? 'text-emerald-600' : 'text-amber-600'}`}>
            {isCheckedIn ? `On Shift (${checkInTime})` : 'Off Shift'}
          </span>
        </div>
      </div>

      {/* 2. Contact & Organization Info Card */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs space-y-3 text-xs">
        <h3 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">
          Contact & Operations
        </h3>

        <div className="space-y-2.5">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-gray-50/80 border border-gray-100">
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Phone className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[9px] text-gray-400 font-bold block uppercase">Phone Number</span>
              <span className="font-extrabold text-gray-900">{currentStaff?.mobile || currentStaff?.phone || 'Not provided'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2 rounded-xl bg-gray-50/80 border border-gray-100">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
              <Mail className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[9px] text-gray-400 font-bold block uppercase">Official Email</span>
              <span className="font-extrabold text-gray-900">{currentStaff?.email || '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Leave Balance, Requests & History */}
      <StaffLeaveSection />

      {/* 4. Salary, Deductions & Remaining Amount */}
      <StaffSalarySection />

      {/* 5. Logout Action */}
      <button
        onClick={handleLogout}
        className="w-full py-3.5 rounded-xl text-white font-extrabold text-xs shadow-md bg-rose-600 hover:bg-rose-700 flex items-center justify-center gap-2 active:scale-95 transition-transform"
      >
        <LogOut className="w-4 h-4" />
        <span>Logout from Staff Mobile Session</span>
      </button>
    </div>
  );
}
