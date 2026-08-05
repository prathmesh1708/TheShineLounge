import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStaff } from '../common/context/StaffContext';
import { Camera, UserPlus, Receipt, Ticket, CheckCircle2, Clock, CalendarCheck, TrendingUp, Bell, Sparkles } from 'lucide-react';
import NotificationBell from '../../common/components/NotificationBell';

export default function StaffDashboardPage() {
  const navigate = useNavigate();
  const { currentStaff, isCheckedIn, checkInTime, jobs, notifications, setIsCameraOpen, setCameraPurpose } = useStaff();

  const staffKey = (currentStaff?.serviceKey || '').toLowerCase();
  const staffDept = (currentStaff?.department || '').toLowerCase();
  const isDriveThrough = staffKey === 'drive-through-cafe' || staffDept.includes('drive');

  // Filter jobs strictly to the logged-in staff member's department
  const filteredJobs = jobs.filter(j => {
    if (isDriveThrough) {
      return j.serviceKey === 'drive-through-cafe' || (j.serviceName && j.serviceName.toLowerCase().includes('drive'));
    }
    if (staffKey === 'cafe' || staffDept.includes('café') || staffDept.includes('cafe')) {
      return j.serviceKey === 'cafe' || (j.serviceName && j.serviceName.toLowerCase().includes('cafe') && !j.serviceName.toLowerCase().includes('drive'));
    }
    if (staffKey === 'car-detailing' || staffDept.includes('detail')) {
      return j.serviceKey === 'car-detailing' || (j.serviceName && j.serviceName.toLowerCase().includes('detail'));
    }
    if (staffKey === 'dog-wash' || staffDept.includes('dog')) {
      return j.serviceKey === 'dog-wash' || (j.serviceName && j.serviceName.toLowerCase().includes('dog'));
    }
    if (staffKey === 'salon' || staffDept.includes('salon')) {
      return j.serviceKey === 'salon' || (j.serviceName && j.serviceName.toLowerCase().includes('salon'));
    }
    return j.serviceKey === 'car-wash' || (j.serviceName && j.serviceName.toLowerCase().includes('wash'));
  });

  const assignedCount = filteredJobs.length;
  const completedCount = filteredJobs.filter(j => j.status?.toLowerCase().includes('completed') || j.status?.toLowerCase().includes('delivered')).length;
  const pendingCount = assignedCount - completedCount;

  return (
    <div className="space-y-4">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-2xl p-4 text-white shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400">
              {isDriveThrough ? 'Drive-Thru Express Mobile Hub' : 'Ground Mobile Hub'}
            </span>
            <h2 className="text-base font-black truncate">{currentStaff?.name || 'Staff Member'}</h2>
            <p className="text-xs text-blue-200">{currentStaff?.role} • {currentStaff?.department || 'Drive-Through Café'}</p>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell isStaff={true} />
            <img
              src={currentStaff?.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80'}
              alt="Avatar"
              className="w-12 h-12 rounded-full border-2 border-amber-400 object-cover shadow-sm flex-shrink-0"
            />
          </div>
        </div>

        {/* Check-In Bar */}
        <div className="mt-3 pt-3 border-t border-blue-700/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isCheckedIn ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="font-bold">{isCheckedIn ? `Checked In (${checkInTime})` : 'Not Checked In'}</span>
          </div>
          <button
            onClick={() => { setCameraPurpose('check-in'); setIsCameraOpen(true); }}
            className="px-3 py-1 rounded-full text-[10px] font-extrabold text-blue-950 bg-amber-400 hover:bg-amber-300 transition-colors flex items-center gap-1"
          >
            <Camera className="w-3 h-3 text-blue-950" />
            <span>{isCheckedIn ? 'Update Selfie' : 'Selfie Check In'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-center">
          <CalendarCheck className="w-5 h-5 mx-auto text-amber-600 mb-1" />
          <span className="text-lg font-black text-amber-900">{assignedCount}</span>
          <p className="text-[10px] font-bold text-amber-700">{isDriveThrough ? 'Total Orders' : 'Assigned'}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-center">
          <CheckCircle2 className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
          <span className="text-lg font-black text-emerald-900">{completedCount}</span>
          <p className="text-[10px] font-bold text-emerald-700">Completed</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-center">
          <Clock className="w-5 h-5 mx-auto text-blue-800 mb-1" />
          <span className="text-lg font-black text-blue-950">{pendingCount}</span>
          <p className="text-[10px] font-bold text-blue-800">Pending</p>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div>
        <h3 className="text-xs font-black text-gray-900 mb-2 uppercase tracking-wider">Quick Ground Actions</h3>
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => { setCameraPurpose('check-in'); setIsCameraOpen(true); }}
            className="bg-white border border-gray-200 p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 text-center shadow-xs active:scale-95 transition-transform"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-gray-800 leading-tight">Selfie Check In</span>
          </button>

          <button
            onClick={() => navigate(isDriveThrough ? '/staff/bookings' : '/staff/customers')}
            className="bg-white border border-gray-200 p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 text-center shadow-xs active:scale-95 transition-transform"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-900 text-white flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-gray-800 leading-tight">{isDriveThrough ? 'Drive Queue' : 'New Cust'}</span>
          </button>

          <button
            onClick={() => navigate('/staff/invoicing')}
            className="bg-white border border-gray-200 p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 text-center shadow-xs active:scale-95 transition-transform"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-gray-800 leading-tight">Create Invoice</span>
          </button>

          <button
            onClick={() => navigate(isDriveThrough ? '/drive-through-cafe' : '/staff/memberships')}
            className="bg-white border border-gray-200 p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 text-center shadow-xs active:scale-95 transition-transform"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center">
              <Ticket className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-gray-800 leading-tight">{isDriveThrough ? 'Live Menu' : 'Sell Pass'}</span>
          </button>
        </div>
      </div>

      {/* Revenue Target Progress Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-xs">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-extrabold text-gray-900 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-amber-500" /> Daily Target (₹25,000)
          </span>
          <span className="font-black text-amber-600">74% Done</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-amber-500 rounded-full" style={{ width: '74%' }} />
        </div>
      </div>

      {/* Today's Priority Assigned Jobs */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
            {isDriveThrough ? "Today's Drive-Thru Priority Orders" : "Today's Priority Queue"}
          </h3>
          <button
            onClick={() => navigate('/staff/bookings')}
            className="text-[11px] font-extrabold text-amber-600 hover:underline"
          >
            View All ({assignedCount})
          </button>
        </div>

        <div className="space-y-3">
          {(jobs || []).slice(0, 5).map(job => {
            const stepIdx = job.stepIndex !== undefined ? job.stepIndex : 0;
            const progressPercent = Math.round((stepIdx / 7) * 100);

            return (
              <div
                key={job.id}
                onClick={() => navigate('/staff/bookings')}
                className="bg-white border border-gray-200 rounded-2xl p-3.5 space-y-2 shadow-xs hover:border-amber-400 cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 uppercase tracking-wider">{job.id}</span>
                      <h4 className="font-extrabold text-xs text-gray-900">{job.customerName || 'Customer'}</h4>
                    </div>
                    <p className="text-[11px] font-bold text-blue-900 mt-0.5">
                      {job.serviceName || job.planName || (job.serviceKey === 'dog-wash' ? 'Dog Hydrobath Spa' : 'Car Detailing Treatment')}
                    </p>
                    <div className="text-[10px] text-gray-600 font-medium mt-0.5">
                      {job.serviceKey === 'dog-wash' || job.vehicleType === 'Dog' ? (
                        <span className="flex items-center gap-1">
                          🐶 <span className="font-bold text-emerald-800">{job.vehicleNo || 'Pet'}</span>
                        </span>
                      ) : job.serviceKey === 'salon' ? (
                        <span className="flex items-center gap-1">
                          ✂️ <span className="font-bold text-purple-800">{job.planName || 'Hair & Beard Session'}</span>
                        </span>
                      ) : job.serviceKey === 'cafe' ? (
                        <span className="flex items-center gap-1">
                          ☕ <span className="font-bold text-amber-800">{job.vehicleNo || 'Table / Order'}</span>
                        </span>
                      ) : (
                        <span>
                          🚗 {job.vehicleModel || 'Vehicle'} • <span className="font-mono font-bold text-gray-800">{job.vehicleNo || 'MH02CD5678'}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-900 border border-blue-200 block w-fit ml-auto">
                      {job.status || 'Confirmed'}
                    </span>
                    <p className="text-xs font-black text-amber-700 mt-1">₹{job.total || job.amount || 350}</p>
                  </div>
                </div>

                {/* Work Completed Progress Bar */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] gap-2">
                  <div className="flex-1">
                    <div className="flex justify-between font-extrabold text-gray-700 mb-0.5">
                      <span>Work Completed</span>
                      <span className="text-amber-600">{progressPercent}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {(!jobs || jobs.length === 0) && (
            <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
              <p className="text-xs font-bold text-gray-400">No active orders in queue for this department</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
