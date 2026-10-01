import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStaff, SERVICE_FINAL_STEP_INDEX } from '../common/context/StaffContext';
import {
  Camera,
  UserPlus,
  Receipt,
  CheckCircle2,
  Clock,
  CalendarCheck,
  Bell,
  Sparkles,
  ShieldCheck,
  Coffee,
  ClipboardList,
  BarChart3,
  IndianRupee,
  Lock,
  X,
  Package,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Boxes,
  Users,
  CreditCard,
  Flame,
  ArrowRight
} from 'lucide-react';
import { STAFF_MODULES, STAFF_ROUTE_PERMISSIONS } from '../../common/utils/staffPermissions';
import NotificationBell from '../../common/components/NotificationBell';
import StaffBreakTimerWidget from '../common/components/StaffBreakTimerWidget';

export default function StaffDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    currentStaff,
    isCheckedIn,
    checkInTime,
    jobs,
    customers,
    todayBreakLogs,
    setIsCameraOpen,
    setCameraPurpose,
    canAccess,
    permissions,
    showToast
  } = useStaff();

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

  // Permissions check based on what admin selected in Manage Staff
  const canSeeBookings = canAccess('bookings');
  const canSeeOrders = canAccess('orders');
  const canSeeCustomers = canAccess('customers');
  const canSeeMemberships = canAccess('memberships');
  const canSeePayments = canAccess('payments') || canSeeOrders || canSeeBookings;
  const canSeeInventory = canAccess('inventory');

  // List of active modules enabled by admin
  const activeModules = STAFF_MODULES.filter((m) => permissions.includes(m.key));

  const staffKey = (currentStaff?.serviceKey || '').toLowerCase();
  const staffDept = (currentStaff?.department || '').toLowerCase();
  const isDriveThrough = staffKey === 'drive-through-cafe' || staffDept.includes('drive');

  // Filtered jobs for current staff
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

  // Completed revenue
  const completedRevenue = filteredJobs
    .filter(isJobCompleted)
    .reduce((sum, job) => sum + (Number(job.total || job.amount) || 0), 0);

  // Breaks metrics
  const finishedBreaks = (todayBreakLogs || []).filter((b) => b.status === 'completed');
  const breakSeconds = finishedBreaks.reduce((sum, b) => sum + (b.actualSeconds || 0), 0);
  const breakOvertime = finishedBreaks.reduce((sum, b) => sum + (b.overtimeSeconds || 0), 0);
  const fmtMins = (sec) => (sec < 60 ? `${sec}s` : `${Math.round(sec / 60)} min`);

  const openCamera = () => {
    setCameraPurpose('check-in');
    setIsCameraOpen(true);
  };

  // -------------------------------------------------------------
  // DYNAMIC ACTION TILES: Directly linked to admin module selection
  // -------------------------------------------------------------
  // QUICK GROUND ACTIONS (4 core actions)
  // -------------------------------------------------------------
  const quickActions = [
    {
      key: 'checkin',
      label: 'Selfie Check In',
      icon: Camera,
      color: 'bg-amber-500',
      onClick: openCamera
    },
    {
      key: 'new_cust',
      label: 'New Cust',
      icon: UserPlus,
      color: 'bg-blue-900',
      onClick: () => navigate('/staff/customers')
    },
    {
      key: 'create_invoice',
      label: 'Create Invoice',
      icon: Receipt,
      color: 'bg-emerald-600',
      onClick: () => navigate('/staff/invoicing')
    },
    {
      key: 'memberships',
      label: 'Memberships',
      icon: ShieldCheck,
      color: 'bg-purple-600',
      onClick: () => navigate('/staff/memberships')
    }
  ];

  // -------------------------------------------------------------
  // DYNAMIC STAT CARDS: Calculated strictly for enabled modules
  // -------------------------------------------------------------
  const kpis = [
    canSeeBookings && {
      key: 'assigned',
      label: isDriveThrough ? 'Orders' : 'Assigned',
      value: assignedCount,
      icon: CalendarCheck,
      tone: 'amber'
    },
    canSeeBookings && {
      key: 'done',
      label: 'Completed',
      value: completedCount,
      icon: CheckCircle2,
      tone: 'emerald'
    },
    canSeeBookings && {
      key: 'pending',
      label: 'Pending',
      value: pendingCount,
      icon: Clock,
      tone: 'blue'
    },
    canSeePayments && {
      key: 'value',
      label: 'Collection',
      value: `₹${(completedRevenue || jobValue).toLocaleString('en-IN')}`,
      icon: IndianRupee,
      tone: 'purple'
    },
    !canSeeBookings && canSeeOrders && {
      key: 'orders_count',
      label: 'Live Orders',
      value: assignedCount,
      icon: Flame,
      tone: 'amber'
    },
    !canSeeBookings && canSeeCustomers && {
      key: 'cust_count',
      label: 'Customers',
      value: customers?.length || 12,
      icon: Users,
      tone: 'blue'
    }
  ].filter(Boolean);

  const KPI_TONES = {
    amber: ['bg-amber-50 border-amber-200', 'text-amber-600', 'text-amber-900', 'text-amber-700'],
    emerald: ['bg-emerald-50 border-emerald-200', 'text-emerald-600', 'text-emerald-900', 'text-emerald-700'],
    blue: ['bg-blue-50 border-blue-200', 'text-blue-800', 'text-blue-950', 'text-blue-800'],
    purple: ['bg-purple-50 border-purple-200', 'text-purple-600', 'text-purple-900', 'text-purple-700']
  };

  return (
    <div className="space-y-3.5 pb-6">
      {/* Real-time Reverse Countdown Clock for Active Break */}
      <StaffBreakTimerWidget />

      {/* Mobile Welcome Card */}
      <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800 rounded-3xl p-4 text-white shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-amber-400 block truncate">
              {isDriveThrough ? 'Drive-Thru Express Hub' : 'Ground Staff Mobile Hub'}
            </span>
            <h2 className="text-base font-black truncate mt-0.5">{currentStaff?.name || 'Staff Member'}</h2>
            <p className="text-[11px] text-blue-200 truncate">{currentStaff?.role} • {currentStaff?.department || 'Main Hub'}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <img
              src={currentStaff?.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80'}
              alt="Avatar"
              className="w-11 h-11 rounded-full border-2 border-amber-400 object-cover shadow-sm"
            />
          </div>
        </div>

        {/* Check-In Bar */}
        <div className="mt-3 pt-2.5 border-t border-blue-700/50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isCheckedIn ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="font-bold text-[11px]">{isCheckedIn ? `Checked In (${checkInTime || 'Today'})` : 'Not Checked In'}</span>
          </div>
          <button
            onClick={openCamera}
            className="px-3 py-1 rounded-full text-[10px] font-extrabold text-blue-950 bg-amber-400 hover:bg-amber-300 transition-transform active:scale-95 flex items-center gap-1 shadow-xs"
          >
            <Camera className="w-3 h-3 text-blue-950" />
            <span>{isCheckedIn ? 'Update Selfie' : 'Selfie Check In'}</span>
          </button>
        </div>
      </div>

      {/* Admin-assigned Modules Section */}
      <div className="bg-white border border-gray-200 rounded-2xl px-3 py-2.5 shadow-2xs">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Your Active Permissions</p>
          <span className="text-[9px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-full">
            {activeModules.length} Modules Enabled
          </span>
        </div>

        {activeModules.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {activeModules.map((m) => (
              <button
                key={m.key}
                onClick={() => m.path && navigate(m.path)}
                className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1 transition-colors active:scale-95"
              >
                <span>{m.emoji}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
            <Lock className="w-3 h-3" /> Basic check-in enabled. Contact admin for module access.
          </p>
        )}
      </div>

      {/* Dynamic KPI Metric Cards */}
      {kpis.length > 0 && (
        <div className={`grid ${kpis.length >= 4 ? 'grid-cols-4' : kpis.length === 3 ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
          {kpis.map(({ key, label, value, icon: Icon, tone }) => {
            const [box, iconColor, valueColor, labelColor] = KPI_TONES[tone] || KPI_TONES.amber;
            return (
              <div key={key} className={`${box} border rounded-2xl p-2.5 text-center min-w-0 shadow-2xs`}>
                <Icon className={`w-4 h-4 mx-auto ${iconColor} mb-0.5`} />
                <span className={`text-base font-black ${valueColor} block truncate leading-tight`}>{value}</span>
                <p className={`text-[9px] font-bold ${labelColor} truncate mt-0.5`}>{label}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Ground Actions */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">Quick Ground Actions</h3>
        </div>

        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {quickActions.map(({ key, label, icon: Icon, color, onClick }) => (
            <button
              key={key}
              onClick={onClick}
              className="bg-white border border-gray-200/90 rounded-[20px] p-3 sm:p-4 flex flex-col items-center justify-center gap-2.5 text-center shadow-xs hover:shadow-sm hover:border-amber-400 active:scale-95 transition-all"
            >
              <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl ${color} text-white flex items-center justify-center shadow-2xs`}>
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-gray-800 leading-tight">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Priority Live Queue Section (Bookings or Orders) */}
      {(canSeeBookings || canSeeOrders) && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
              {isDriveThrough ? "Today's Drive Queue" : canSeeBookings ? "Today's Priority Queue" : "Active Live Orders"}
            </h3>
            <button
              onClick={() => navigate(canSeeBookings ? '/staff/bookings' : '/staff/orders')}
              className="text-[11px] font-extrabold text-amber-600 hover:underline flex items-center gap-0.5"
            >
              <span>View All ({assignedCount})</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {filteredJobs.length === 0 ? (
              <div className="text-center py-7 bg-white rounded-2xl border border-dashed border-gray-200 p-5 space-y-1.5 shadow-2xs">
                <span className="text-2xl">☕</span>
                <p className="text-xs font-bold text-gray-800">No active orders in queue</p>
                <p className="text-[10px] text-gray-400 font-medium">Assigned department jobs will appear here automatically.</p>
              </div>
            ) : (
              filteredJobs.slice(0, 4).map((job) => {
                const stepIdx = job.stepIndex !== undefined ? job.stepIndex : 0;
                const lastStepIdx = SERVICE_FINAL_STEP_INDEX[job.serviceKey] ?? 7;
                const progressPercent = isJobCompleted(job) ? 100 : Math.min(100, Math.round((stepIdx / lastStepIdx) * 100));

                return (
                  <div
                    key={job.id}
                    onClick={() => navigate(canSeeBookings ? '/staff/bookings' : '/staff/orders')}
                    className="bg-white border border-gray-200 rounded-2xl p-3 space-y-2 shadow-xs hover:border-amber-400 cursor-pointer transition-all active:scale-[0.99]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] font-black text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 uppercase">
                            {job.id}
                          </span>
                          <h4 className="font-extrabold text-xs text-gray-900 truncate">{job.customerName || 'Customer'}</h4>
                        </div>

                        <p className="text-[11px] font-bold text-blue-900 mt-0.5 truncate">
                          {job.serviceName || job.planName || (job.serviceKey === 'dog-wash' ? 'Dog Hydrobath Spa' : 'Car Treatment')}
                        </p>

                        <div className="text-[10px] text-gray-600 font-medium mt-0.5 truncate">
                          {job.vehicleNo ? (
                            <span className="flex items-center gap-1">
                              🚗 <span className="font-mono font-bold text-gray-800">{job.vehicleNo}</span>
                              {job.vehicleModel && <span className="text-gray-400">• {job.vehicleModel}</span>}
                            </span>
                          ) : (
                            <span>⏱ Slot: {job.timeSlot || 'Today'}</span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-900 border border-blue-200 block w-fit ml-auto">
                          {job.status || 'Confirmed'}
                        </span>
                        {canSeePayments && (
                          <p className="text-xs font-black text-amber-700 mt-1">₹{job.total || job.amount || 350}</p>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="pt-1.5 border-t border-gray-100 flex items-center justify-between text-[10px] gap-2">
                      <div className="flex-1">
                        <div className="flex justify-between font-extrabold text-gray-600 mb-0.5 text-[9px]">
                          <span>Service Progress</span>
                          <span className="text-amber-600">{progressPercent}%</span>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                          />
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
    </div>
  );
}
