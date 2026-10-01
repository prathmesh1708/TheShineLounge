import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStaff, SERVICE_FINAL_STEP_INDEX } from '../common/context/StaffContext';
import { Camera, UserPlus, Receipt, CheckCircle2, Clock, CalendarCheck, Bell, Sparkles, ShieldCheck, Coffee, ClipboardList, BarChart3, IndianRupee, Lock, X } from 'lucide-react';
import { STAFF_MODULES, STAFF_ROUTE_PERMISSIONS } from '../../common/utils/staffPermissions';
import NotificationBell from '../../common/components/NotificationBell';
import { isCarWashStaff } from '../common/utils/staffMembershipUtils';
import StaffBreakTimerWidget from '../common/components/StaffBreakTimerWidget';

export default function StaffDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentStaff, isCheckedIn, checkInTime, jobs, notifications, setIsCameraOpen, setCameraPurpose, breakStatus, canAccess, permissions, todayBreakLogs, showToast } = useStaff();
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  // Sent here by the module guard after opening a URL the admin hasn't assigned.
  useEffect(() => {
    const denied = location.state?.deniedModules;
    if (!denied) return;
    const names = STAFF_MODULES.filter((m) => denied.includes(m.key)).map((m) => m.label).join(' / ');
    showToast(`You don't have access to ${names || 'that module'}. Ask your admin to enable it.`, 'error');
    navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // What the admin assigned in Manage Staff decides which tiles and figures show.
  const canSeeJobs = canAccess(STAFF_ROUTE_PERMISSIONS.bookings);
  const canSeeMoney = canAccess(['payments', 'orders']);
  const canSeeCustomers = canAccess(STAFF_ROUTE_PERMISSIONS.customers);
  const canBill = canAccess(STAFF_ROUTE_PERMISSIONS.invoicing);
  const canReport = canAccess('reports');
  const activeModules = STAFF_MODULES.filter((m) => permissions.includes(m.key));

  const isCarWash = isCarWashStaff(currentStaff);
  const staffKey = (currentStaff?.serviceKey || '').toLowerCase();
  const staffDept = (currentStaff?.department || '').toLowerCase();
  const isDriveThrough = staffKey === 'drive-through-cafe' || staffDept.includes('drive');

  const myStaffId = String(currentStaff?.id || '');
  const myStaffName = (currentStaff?.name || '').toLowerCase();

  // Jobs are already filtered strictly to this staff member's department and assignment by StaffContext
  const filteredJobs = [...jobs].sort((a, b) => {
    const aTime = a.expectedAt ? new Date(a.expectedAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
    const bTime = b.expectedAt ? new Date(b.expectedAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
    return bTime - aTime;
  });

  const isJobCompleted = (job) => {
    const finalStepIndex = SERVICE_FINAL_STEP_INDEX[job.serviceKey];
    if (finalStepIndex !== undefined && (job.stepIndex || 0) >= finalStepIndex) return true;
    const status = job.status?.toLowerCase() || '';
    return status.includes('completed') || status.includes('delivered');
  };

  const assignedCount = filteredJobs.length;
  const completedCount = filteredJobs.filter(isJobCompleted).length;
  const pendingCount = assignedCount - completedCount;
  const jobValue = filteredJobs.reduce((sum, job) => sum + (Number(job.total || job.amount) || 0), 0);

  const finishedBreaks = (todayBreakLogs || []).filter((b) => b.status === 'completed');
  const breakSeconds = finishedBreaks.reduce((sum, b) => sum + (b.actualSeconds || 0), 0);
  const breakOvertime = finishedBreaks.reduce((sum, b) => sum + (b.overtimeSeconds || 0), 0);
  const fmtMins = (sec) => (sec < 60 ? `${sec}s` : `${Math.round(sec / 60)} min`);

  const openCamera = () => { setCameraPurpose('check-in'); setIsCameraOpen(true); };

  // Quick-action tiles, one per assigned module plus the always-on shift tools.
  const tiles = [
    { key: 'checkin', label: isCheckedIn ? 'Update Selfie' : 'Selfie Check In', icon: Camera, color: 'bg-amber-500', onClick: openCamera },
    { key: 'breaks', label: 'Attendance & Breaks', icon: Coffee, color: 'bg-orange-600', onClick: () => navigate('/staff/attendance') },
    canSeeJobs && (isDriveThrough
      ? { key: 'jobs', label: 'Drive Queue', icon: ClipboardList, color: 'bg-blue-900', onClick: () => navigate('/staff/bookings') }
      : { key: 'jobs', label: canAccess('bookings') ? 'Jobs & Queue' : 'Live Orders', icon: ClipboardList, color: 'bg-blue-900', onClick: () => navigate('/staff/bookings') }),
    canSeeCustomers && { key: 'customers', label: 'Customers', icon: UserPlus, color: 'bg-sky-700', onClick: () => navigate('/staff/customers') },
    canBill && { key: 'billing', label: canAccess('payments') ? 'Billing & Invoice' : 'POS Invoice', icon: Receipt, color: 'bg-emerald-600', onClick: () => navigate('/staff/invoicing') },
    // Membership passes are a Car Wash product; the page refuses other departments.
    canAccess('memberships') && isCarWash && { key: 'passes', label: 'Scan / Verify Pass', icon: ShieldCheck, color: 'bg-purple-600', onClick: () => navigate('/staff/memberships') },
    canReport && { key: 'reports', label: 'Shift Summary', icon: BarChart3, color: 'bg-gray-800', onClick: () => setIsSummaryOpen(true) }
  ].filter(Boolean);

  const kpis = [
    canSeeJobs && { key: 'assigned', label: isDriveThrough ? 'Total Orders' : 'Assigned', value: assignedCount, icon: CalendarCheck, tone: 'amber' },
    canSeeJobs && { key: 'done', label: 'Completed', value: completedCount, icon: CheckCircle2, tone: 'emerald' },
    canSeeJobs && { key: 'pending', label: 'Pending', value: pendingCount, icon: Clock, tone: 'blue' },
    canSeeMoney && canSeeJobs && { key: 'value', label: 'Queue Value', value: `₹${jobValue.toLocaleString('en-IN')}`, icon: IndianRupee, tone: 'purple' }
  ].filter(Boolean);
  const KPI_TONES = {
    amber: ['bg-amber-50 border-amber-200', 'text-amber-600', 'text-amber-900', 'text-amber-700'],
    emerald: ['bg-emerald-50 border-emerald-200', 'text-emerald-600', 'text-emerald-900', 'text-emerald-700'],
    blue: ['bg-blue-50 border-blue-200', 'text-blue-800', 'text-blue-950', 'text-blue-800'],
    purple: ['bg-purple-50 border-purple-200', 'text-purple-600', 'text-purple-900', 'text-purple-700']
  };

  return (
    <div className="space-y-4">
      {/* Real-time Reverse Countdown Clock for Active Break */}
      <StaffBreakTimerWidget />

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-2xl p-4 text-white shadow-md relative">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400">
              {isDriveThrough ? 'Drive-Thru Express Mobile Hub' : 'Ground Mobile Hub'}
            </span>
            <h2 className="text-base font-black truncate">{currentStaff?.name || 'Staff Member'}</h2>
            <p className="text-xs text-blue-200">{currentStaff?.role} • {currentStaff?.department || 'Drive-Through Café'}</p>
          </div>

          <div className="flex items-center gap-2">
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

      {/* Modules the admin has enabled for this staff member */}
      <div className="bg-white border border-gray-200 rounded-2xl px-3 py-2.5 shadow-xs">
        <p className="text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1.5">Your Active Modules</p>
        {activeModules.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {activeModules.map((m) => (
              <span key={m.key} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                {m.emoji} {m.label}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
            <Lock className="w-3 h-3" /> Only check-in, breaks and schedule are enabled. Ask your admin for module access.
          </p>
        )}
      </div>

      {/* KPI Cards Grid */}
      {kpis.length > 0 && (
        <div className={`grid ${kpis.length === 4 ? 'grid-cols-4' : 'grid-cols-3'} gap-2`}>
          {kpis.map(({ key, label, value, icon: Icon, tone }) => {
            const [box, iconColor, valueColor, labelColor] = KPI_TONES[tone];
            return (
              <div key={key} className={`${box} border rounded-2xl p-3 text-center min-w-0`}>
                <Icon className={`w-5 h-5 mx-auto ${iconColor} mb-1`} />
                <span className={`text-lg font-black ${valueColor} block truncate`}>{value}</span>
                <p className={`text-[10px] font-bold ${labelColor}`}>{label}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Action Grid */}
      <div>
        <h3 className="text-xs font-black text-gray-900 mb-2 uppercase tracking-wider">Quick Ground Actions</h3>
        <div className="grid grid-cols-4 gap-2">
          {tiles.map(({ key, label, icon: Icon, color, onClick }) => (
            <button
              key={key}
              onClick={onClick}
              className="bg-white border border-gray-200 p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 text-center shadow-xs active:scale-95 transition-transform"
            >
              <div className={`w-8 h-8 rounded-xl ${color} text-white flex items-center justify-center`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-gray-800 leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Today's Priority Assigned Jobs */}
      {canSeeJobs && (
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
          {filteredJobs.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-2xl border border-dashed border-gray-200 p-6 space-y-2 shadow-2xs">
              <span className="text-3xl">☕</span>
              <p className="text-xs font-bold text-gray-800">No active {isDriveThrough ? 'Drive-Thru' : staffKey === 'cafe' ? 'Café' : staffKey === 'dog-wash' ? 'Dog Spa' : staffKey === 'salon' ? 'Salon' : 'department'} orders in queue</p>
              <p className="text-[10px] text-gray-400 font-medium">New assigned orders for your department will appear here automatically in real time.</p>
            </div>
          ) : (
            filteredJobs.slice(0, 5).map(job => {
              const stepIdx = job.stepIndex !== undefined ? job.stepIndex : 0;
              // Services have different stepper lengths — a salon or dog-wash
              // job on its last step is done, not partway through a 7-step flow.
              const lastStepIdx = SERVICE_FINAL_STEP_INDEX[job.serviceKey] ?? 7;
              const progressPercent = isJobCompleted(job) ? 100 : Math.min(100, Math.round((stepIdx / lastStepIdx) * 100));

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
                        {job.serviceKey === 'drive-through-cafe' ? (
                          <div className="space-y-1">
                            <span className="flex items-center gap-1 flex-wrap">
                              🚗
                              <span className="font-mono font-black text-sm text-blue-900 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                                {job.vehicleNo || 'No plate registered'}
                              </span>
                              <span className="text-gray-500">{job.vehicleModel}</span>
                            </span>
                            <span className="flex items-center gap-1 text-amber-800 font-bold">
                              ⏱ Arriving {job.pickupTime || job.timeSlot}
                            </span>
                            {job.items && job.items.length > 0 && (
                              <span className="block text-gray-700">☕ {job.itemsSummary}</span>
                            )}
                          </div>
                        ) : job.serviceKey === 'dog-wash' || job.vehicleType === 'Dog' ? (
                          <span className="flex items-center gap-1">
                            🐶 <span className="font-bold text-emerald-800">{job.vehicleNo || 'Pet'}</span>
                          </span>
                        ) : job.serviceKey === 'salon' ? (
                          <div className="space-y-1 mt-1">
                            <span className="flex items-center gap-1.5 flex-wrap">
                              ✂️ <span className="font-bold text-purple-800">{job.planName || 'Hair & Beard Session'}</span>
                              <span className="text-gray-400">•</span>
                              <span className="font-bold text-purple-700">{job.vehicleNo || `Stylist: ${job.staffName || 'Any Specialist'}`}</span>
                            </span>
                            <span className="flex items-center gap-1 text-amber-800 font-bold text-[10px]">
                              📅 {job.date || 'Today'} • ⏱ {(job.timeSlot || '01:30 PM').replace(/^[0-9]{4}-[0-9]{2}-[0-9]{2}\s*\|\s*/, '')}
                            </span>
                          </div>
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
            })
          )}
        </div>
      </div>
      )}

      {/* Daily shift summary (reports module) */}
      {isSummaryOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50" onClick={() => setIsSummaryOpen(false)}>
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-600" /> Today's Shift Summary
              </h3>
              <button type="button" onClick={() => setIsSummaryOpen(false)} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-gray-50 rounded-xl">
                <p className="text-[10px] font-bold text-gray-500">Check-in</p>
                <p className="font-black text-gray-900">{isCheckedIn ? checkInTime : 'Not checked in'}</p>
              </div>
              {canSeeJobs && (
                <div className="p-2.5 bg-gray-50 rounded-xl">
                  <p className="text-[10px] font-bold text-gray-500">Jobs done</p>
                  <p className="font-black text-gray-900">{completedCount} of {assignedCount}</p>
                </div>
              )}
              {canSeeJobs && canSeeMoney && (
                <div className="p-2.5 bg-gray-50 rounded-xl">
                  <p className="text-[10px] font-bold text-gray-500">Queue value</p>
                  <p className="font-black text-gray-900">₹{jobValue.toLocaleString('en-IN')}</p>
                </div>
              )}
              <div className="p-2.5 bg-gray-50 rounded-xl">
                <p className="text-[10px] font-bold text-gray-500">Breaks taken</p>
                <p className="font-black text-gray-900">{finishedBreaks.length} · {fmtMins(breakSeconds)}</p>
              </div>
              <div className={`p-2.5 rounded-xl ${breakOvertime > 0 ? 'bg-red-50' : 'bg-emerald-50'}`}>
                <p className="text-[10px] font-bold text-gray-500">Break overtime</p>
                <p className={`font-black ${breakOvertime > 0 ? 'text-red-700' : 'text-emerald-700'}`}>{breakOvertime > 0 ? `+${fmtMins(breakOvertime)}` : 'None'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
