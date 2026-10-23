import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStaff } from '../common/context/StaffContext';
import { useAuth } from '../../common/context/AuthContext';
import { formatTime12h } from '../../admin/common/components/ShiftTimingFields';
import { Phone, Mail, LogOut, Clock, Sun, Sparkles } from 'lucide-react';
import StaffLeaveSection from '../common/components/StaffLeaveSection';
import StaffSalarySection from '../common/components/StaffSalarySection';

export default function StaffProfilePage() {
  const navigate = useNavigate();
  const { currentStaff, logoutStaff, isCheckedIn, checkInTime } = useStaff();
  const { user } = useAuth();

  const handleLogout = () => {
    logoutStaff();
    navigate('/staff/login');
  };

  const staff = currentStaff || user;
  const shiftStart = staff?.shiftStartTime || user?.shiftStartTime || '09:00';
  const shiftEnd = staff?.shiftEndTime || user?.shiftEndTime || '18:00';
  const shiftTimingText = staff?.shiftTiming || user?.shiftTiming || `${formatTime12h(shiftStart)} - ${formatTime12h(shiftEnd)}`;

  // Calculate live shift status
  const getShiftLiveState = () => {
    try {
      const now = new Date();
      const curH = now.getHours();
      const curM = now.getMinutes();

      const [sH, sM] = shiftStart.split(':').map(Number);
      const [eH, eM] = shiftEnd.split(':').map(Number);

      const curMinutes = curH * 60 + curM;
      const startMinutes = sH * 60 + sM;
      let endMinutes = eH * 60 + eM;
      if (endMinutes <= startMinutes) endMinutes += 24 * 60; // Crosses midnight

      let adjustedCur = curMinutes;
      if (curMinutes < startMinutes && endMinutes > 24 * 60) {
        adjustedCur += 24 * 60;
      }

      if (adjustedCur >= startMinutes && adjustedCur < endMinutes) {
        const remainingMinutes = endMinutes - adjustedCur;
        if (remainingMinutes <= 30) {
          return { label: `Shift Ending Soon (${remainingMinutes}m left)`, color: 'amber' };
        }
        return { label: 'Currently On Shift Window', color: 'emerald' };
      }
      return { label: 'Shift Ended / Off Duty Window', color: 'gray' };
    } catch (e) {
      return { label: 'Assigned Shift', color: 'amber' };
    }
  };

  const shiftState = getShiftLiveState();

  return (
    <div className="space-y-4">
      {/* 1. Main Profile Card */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs text-center space-y-4">
        {/* Avatar with Status Ring */}
        <div className="relative w-16 h-16 mx-auto">
          <img
            src={currentStaff?.avatar || currentStaff?.photo || currentStaff?.profileImage || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80'}
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

        {/* Shift & Check-In Status Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-center">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide block">Punch Status</span>
            <span className={`font-black text-xs ${isCheckedIn ? 'text-emerald-600' : 'text-amber-600'}`}>
              {isCheckedIn ? `Checked In (${checkInTime || 'Active'})` : 'Checked Out'}
            </span>
          </div>

          <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/80 text-center">
            <span className="text-[9px] font-bold text-amber-700 uppercase tracking-wide block flex items-center justify-center gap-1">
              <Clock className="w-2.5 h-2.5" /> Shift Window
            </span>
            <span className="font-black text-[11px] text-amber-900 truncate block">
              {shiftTimingText}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Official Shift Timing Schedule Card */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs space-y-3 text-xs">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <h3 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Assigned Shift Schedule</span>
          </h3>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${
            shiftState.color === 'emerald' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
            shiftState.color === 'amber' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
            'bg-gray-100 text-gray-600 border border-gray-200'
          }`}>
            {shiftState.label}
          </span>
        </div>

        <div className="bg-gradient-to-br from-amber-50/70 to-orange-50/40 p-3 rounded-xl border border-amber-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[9px] font-bold text-gray-400 uppercase block">Daily Working Hours</span>
                <span className="font-extrabold text-sm text-gray-900">{shiftTimingText}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-amber-100/80 text-[11px]">
            <div className="bg-white/90 p-2 rounded-lg border border-amber-100">
              <span className="text-gray-400 font-semibold block text-[9px] uppercase">Shift Start</span>
              <span className="font-extrabold text-gray-900">{shiftTimingText.split('-')[0]?.trim() || shiftStart}</span>
            </div>
            <div className="bg-white/90 p-2 rounded-lg border border-amber-100">
              <span className="text-gray-400 font-semibold block text-[9px] uppercase">Shift End</span>
              <span className="font-extrabold text-amber-700">{shiftTimingText.split('-')[1]?.trim() || shiftEnd}</span>
            </div>
          </div>
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
