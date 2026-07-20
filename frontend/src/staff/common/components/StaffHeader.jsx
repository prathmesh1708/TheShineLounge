import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Bell, Sparkles, Camera, ShieldCheck } from 'lucide-react';
import { useStaff } from '../context/StaffContext';

export default function StaffHeader({ title }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentStaff, isCheckedIn, notifications } = useStaff();

  const isHome = location.pathname === '/staff' || location.pathname === '/staff/dashboard';
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-30 h-14 px-4 flex items-center justify-between shadow-md" style={{ backgroundColor: '#1e4a7e' }}>
      <div className="flex items-center gap-3">
        {!isHome ? (
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg text-white hover:bg-blue-800/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-white text-xs shadow-sm" style={{ backgroundColor: '#e07b2a' }}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        )}

        <div>
          <h1 className="font-extrabold text-sm text-white tracking-wide truncate max-w-[170px]">
            {title || (isHome ? 'TSL Staff Mobile' : 'Staff Panel')}
          </h1>
          {currentStaff && (
            <div className="flex items-center gap-1.5 text-[10px] text-blue-200">
              <span className={`w-1.5 h-1.5 rounded-full ${isCheckedIn ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="font-semibold truncate max-w-[120px]">{currentStaff.role}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/staff/attendance')}
          className="px-2 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 text-white border border-blue-400/40 hover:bg-blue-800/60"
        >
          <Camera className="w-3 h-3 text-amber-300" />
          <span>{isCheckedIn ? 'Checked In' : 'Check In'}</span>
        </button>

        <button
          onClick={() => navigate('/staff/notifications')}
          className="relative p-2 rounded-xl text-blue-100 hover:text-white hover:bg-blue-800/60 transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          )}
        </button>
      </div>
    </header>
  );
}
