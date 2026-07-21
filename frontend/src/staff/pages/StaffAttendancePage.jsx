import React, { useState } from 'react';
import { useStaff } from '../common/context/StaffContext';
import { Camera, Calendar, CheckCircle2, MapPin, Clock, FileText, Send } from 'lucide-react';

export default function StaffAttendancePage() {
  const { currentStaff, isCheckedIn, checkInPhoto, checkInTime, attendance, processCheckOut, setIsCameraOpen, setCameraPurpose, showToast } = useStaff();

  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'calendar' | 'leave'
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveType, setLeaveType] = useState('Casual');

  const myAttendance = attendance.filter(a => a.staffId === currentStaff?.id || true);

  const handleApplyLeave = (e) => {
    e.preventDefault();
    showToast(`Leave application (${leaveType}) submitted to Branch Manager`, 'success');
    setLeaveReason('');
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm text-center">
        <div className="relative w-20 h-20 mx-auto mb-2">
          <img
            src={checkInPhoto || currentStaff?.avatar}
            alt="Check In Selfie"
            className="w-full h-full object-cover rounded-full border-4 border-amber-500 shadow-md"
          />
          <span className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${isCheckedIn ? 'bg-emerald-500' : 'bg-amber-500'}`} />
        </div>

        <h3 className="font-extrabold text-sm text-gray-900">{currentStaff?.name}</h3>
        <p className="text-xs text-gray-500">{currentStaff?.role} • {currentStaff?.employeeId}</p>

        {/* Action Button */}
        <div className="mt-3 flex justify-center gap-2">
          {isCheckedIn ? (
            <button
              onClick={processCheckOut}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-900 shadow-sm hover:bg-blue-950 active:scale-95 transition-transform"
            >
              Log Shift Check-Out
            </button>
          ) : (
            <button
              onClick={() => { setCameraPurpose('check-in'); setIsCameraOpen(true); }}
              className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-md active:scale-95 transition-transform flex items-center gap-1.5"
              style={{ backgroundColor: '#e07b2a' }}
            >
              <Camera className="w-4 h-4" />
              <span>Selfie Camera Check-In</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-100 p-1 rounded-xl flex items-center justify-between text-xs font-bold">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex-1 py-1.5 rounded-lg transition-all ${activeTab === 'summary' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'}`}
        >
          Summary
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex-1 py-1.5 rounded-lg transition-all ${activeTab === 'calendar' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'}`}
        >
          Calendar Log
        </button>
        <button
          onClick={() => setActiveTab('leave')}
          className={`flex-1 py-1.5 rounded-lg transition-all ${activeTab === 'leave' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'}`}
        >
          Apply Leave
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'summary' && (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-2xl">
              <span className="text-base font-black text-emerald-800">22</span>
              <p className="text-[9px] font-bold text-emerald-600">Present</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-2xl">
              <span className="text-base font-black text-blue-900">2</span>
              <p className="text-[9px] font-bold text-blue-600">Late</p>
            </div>
            <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-2xl">
              <span className="text-base font-black text-rose-800">1</span>
              <p className="text-[9px] font-bold text-rose-600">Absent</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-2xl">
              <span className="text-base font-black text-amber-800">12</span>
              <p className="text-[9px] font-bold text-amber-600">Leave Bal</p>
            </div>
          </div>

          {/* Recent Logs */}
          <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-xs space-y-2">
            <h4 className="text-xs font-black text-gray-900 uppercase">Recent Check-In Logs</h4>
            {myAttendance.slice(0, 3).map(rec => (
              <div key={rec.id} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <div>
                    <p className="font-bold text-gray-900">{rec.date}</p>
                    <p className="text-[10px] text-gray-500">{rec.checkInTime} • {rec.location}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                  {rec.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'leave' && (
        <form onSubmit={handleApplyLeave} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
          <h4 className="text-xs font-black text-gray-900 uppercase">Leave Application Form</h4>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Leave Type</label>
            <select
              value={leaveType}
              onChange={e => setLeaveType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold"
            >
              <option value="Casual">Casual Leave ({currentStaff?.leaveBalance?.casual || 6} Days Left)</option>
              <option value="Sick">Sick Leave ({currentStaff?.leaveBalance?.sick || 4} Days Left)</option>
              <option value="Earned">Earned Leave ({currentStaff?.leaveBalance?.earned || 10} Days Left)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Reason for Leave</label>
            <textarea
              rows={3}
              value={leaveReason}
              onChange={e => setLeaveReason(e.target.value)}
              placeholder="Provide reason for leave..."
              required
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-1.5"
            style={{ backgroundColor: '#e07b2a' }}
          >
            <Send className="w-4 h-4" />
            <span>Submit Leave Request</span>
          </button>
        </form>
      )}
    </div>
  );
}
