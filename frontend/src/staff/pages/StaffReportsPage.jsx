import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStaff } from '../common/context/StaffContext';
import {
  BarChart3,
  Calendar,
  Clock,
  CheckCircle2,
  IndianRupee,
  Coffee,
  ArrowLeft,
  FileText,
  Download,
  Share2,
  TrendingUp,
  User,
  ShieldCheck,
  CreditCard,
  Banknote,
  Smartphone
} from 'lucide-react';

export default function StaffReportsPage() {
  const navigate = useNavigate();
  const {
    currentStaff,
    isCheckedIn,
    checkInTime,
    jobs,
    todayBreakLogs,
    attendance,
    showToast
  } = useStaff();

  const [dateRange, setDateRange] = useState('today');

  // Filter jobs handled
  const completedJobs = jobs.filter((j) => {
    const s = (j.status || '').toLowerCase();
    return s.includes('completed') || s.includes('delivered') || (j.stepIndex || 0) >= 3;
  });

  const totalAssigned = jobs.length;
  const totalCompleted = completedJobs.length;
  const totalRevenue = jobs.reduce((sum, j) => sum + (Number(j.total || j.amount) || 0), 0);
  const completedRevenue = completedJobs.reduce((sum, j) => sum + (Number(j.total || j.amount) || 0), 0);

  // Breaks calculations
  const finishedBreaks = (todayBreakLogs || []).filter((b) => b.status === 'completed');
  const totalBreakSeconds = finishedBreaks.reduce((sum, b) => sum + (b.actualSeconds || 0), 0);
  const totalOvertimeSeconds = finishedBreaks.reduce((sum, b) => sum + (b.overtimeSeconds || 0), 0);

  const fmtDuration = (sec) => {
    if (!sec || sec <= 0) return '0 min';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s > 0 ? `${s}s` : ''}`;
  };

  const handleExport = () => {
    showToast('Shift report copied to clipboard!', 'success');
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Mobile Header Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/staff/dashboard')}
            className="p-1.5 rounded-xl hover:bg-gray-200 text-gray-600 transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-8 h-8 rounded-xl bg-gray-900 text-white flex items-center justify-center font-bold shadow-xs flex-shrink-0">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-black text-sm sm:text-base text-gray-900 leading-tight">Daily Shift Reports</h2>
            <p className="text-[10px] text-gray-500">Performance, job volume & collection summary</p>
          </div>
        </div>

        <button
          onClick={handleExport}
          className="p-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-2xs"
          title="Export Report"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Staff Shift Card */}
      <div className="bg-gradient-to-br from-blue-900 to-blue-950 rounded-2xl p-4 text-white shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src={currentStaff?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'}
              alt="Staff"
              className="w-10 h-10 rounded-full border border-amber-400 object-cover"
            />
            <div>
              <h3 className="font-black text-sm">{currentStaff?.name || 'Staff Member'}</h3>
              <p className="text-[11px] text-blue-200">{currentStaff?.role} • {currentStaff?.department}</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-blue-950 uppercase">
            {isCheckedIn ? 'Active Shift' : 'Off Duty'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-800/80 text-xs">
          <div>
            <span className="text-[10px] text-blue-300 font-bold block">Check-in Time</span>
            <span className="font-mono font-black">{checkInTime || 'Not Logged Today'}</span>
          </div>
          <div>
            <span className="text-[10px] text-blue-300 font-bold block">Shift Status</span>
            <span className="font-extrabold text-emerald-300">{isCheckedIn ? 'On Floor / Active' : 'Completed'}</span>
          </div>
        </div>
      </div>

      {/* Big KPI Metrics */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-white border border-gray-200 rounded-2xl p-3.5 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Jobs Handled</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-black text-gray-900 block">{totalCompleted} / {totalAssigned}</span>
          <p className="text-[10px] font-bold text-emerald-700">
            {totalAssigned > 0 ? `${Math.round((totalCompleted / totalAssigned) * 100)}% completion rate` : 'No jobs queued'}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-3.5 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Shift Value</span>
            <IndianRupee className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-2xl font-black text-gray-900 block">₹{completedRevenue.toLocaleString('en-IN')}</span>
          <p className="text-[10px] font-bold text-gray-500">₹{totalRevenue.toLocaleString('en-IN')} total queued</p>
        </div>
      </div>

      {/* Break Time Log Summary */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
            <Coffee className="w-4 h-4 text-orange-600" />
            <span>Attendance & Break Usage</span>
          </h3>
          <span className="text-[10px] font-extrabold text-gray-500">{finishedBreaks.length} breaks taken</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
            <span className="text-[10px] text-gray-500 font-bold block">Total Break Time</span>
            <span className="font-black text-gray-900 text-sm mt-0.5 block">{fmtDuration(totalBreakSeconds)}</span>
          </div>
          <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
            <span className="text-[10px] text-gray-500 font-bold block">Overtime</span>
            <span className={`font-black text-sm mt-0.5 block ${totalOvertimeSeconds > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {totalOvertimeSeconds > 0 ? `+${fmtDuration(totalOvertimeSeconds)}` : 'On Time (0s)'}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Modes Breakdown */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs space-y-3">
        <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
          <CreditCard className="w-4 h-4 text-blue-900" />
          <span>Payment Collection Estimations</span>
        </h3>

        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-purple-600" />
              <span className="text-gray-800">UPI / QR Code</span>
            </div>
            <span className="font-mono text-gray-900 font-extrabold">
              ₹{Math.round(completedRevenue * 0.65).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold">
            <div className="flex items-center gap-2">
              <Banknote className="w-4 h-4 text-emerald-600" />
              <span className="text-gray-800">Cash Counter</span>
            </div>
            <span className="font-mono text-gray-900 font-extrabold">
              ₹{Math.round(completedRevenue * 0.25).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span className="text-gray-800">Passes & Prepaids</span>
            </div>
            <span className="font-mono text-gray-900 font-extrabold">
              ₹{Math.round(completedRevenue * 0.10).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
