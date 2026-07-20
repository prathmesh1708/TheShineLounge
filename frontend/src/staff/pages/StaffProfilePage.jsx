import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStaff } from '../common/context/StaffContext';
import { User, Phone, Mail, ShieldCheck, Lock, LogOut, Moon, Globe } from 'lucide-react';

export default function StaffProfilePage() {
  const navigate = useNavigate();
  const { currentStaff, logoutStaff, isCheckedIn, checkInTime } = useStaff();

  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('English');

  const handleLogout = () => {
    logoutStaff();
    navigate('/staff/login');
  };

  return (
    <div className="space-y-4">
      {/* Profile Card */}
      <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm text-center space-y-3">
        <div className="relative w-24 h-24 mx-auto">
          <img
            src={currentStaff?.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80'}
            alt="Staff Profile"
            className="w-full h-full object-cover rounded-full border-4 border-amber-500 shadow-md"
          />
          <span className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white ${isCheckedIn ? 'bg-emerald-500' : 'bg-amber-500'}`} />
        </div>

        <div>
          <h2 className="font-extrabold text-base text-gray-900">{currentStaff?.name}</h2>
          <p className="text-xs text-amber-600 font-extrabold uppercase tracking-wide">{currentStaff?.role}</p>
          <p className="text-[11px] text-gray-500 font-semibold">{currentStaff?.department} • {currentStaff?.employeeId}</p>
        </div>

        <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex items-center justify-around text-xs">
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase block">Monthly Salary</span>
            <span className="font-black text-gray-900">{currentStaff?.salary || '₹35,000 / mo'}</span>
          </div>
          <div className="w-px h-6 bg-gray-200" />
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase block">Shift Status</span>
            <span className="font-black text-emerald-600">{isCheckedIn ? `On Shift (${checkInTime})` : 'Off Shift'}</span>
          </div>
        </div>
      </div>

      {/* Account Info Details */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3 text-xs">
        <h3 className="font-black text-gray-900 uppercase">Contact Information</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-700">
            <Phone className="w-4 h-4 text-amber-500" />
            <span className="font-bold">{currentStaff?.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <Mail className="w-4 h-4 text-amber-500" />
            <span className="font-bold">{currentStaff?.email}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            <span className="font-bold">Thane Main Branch Operations</span>
          </div>
        </div>
      </div>

      {/* App Preferences */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3 text-xs">
        <h3 className="font-black text-gray-900 uppercase">Preferences & Security</h3>
        
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-gray-500" />
            <span className="font-bold text-gray-800">Dark Theme</span>
          </div>
          <input
            type="checkbox"
            checked={darkMode}
            onChange={() => setDarkMode(!darkMode)}
            className="w-4 h-4 accent-amber-500 rounded"
          />
        </div>

        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-gray-500" />
            <span className="font-bold text-gray-800">Language</span>
          </div>
          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
            className="px-2 py-1 border rounded-lg text-xs font-bold bg-white"
          >
            <option value="English">English</option>
            <option value="Hindi">Hindi (हिंदी)</option>
            <option value="Marathi">Marathi (मराठी)</option>
          </select>
        </div>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="w-full py-3 rounded-2xl text-white font-extrabold text-xs shadow-md bg-rose-600 hover:bg-rose-700 flex items-center justify-center gap-2 active:scale-95 transition-transform"
      >
        <LogOut className="w-4 h-4" />
        <span>Logout from Staff Mobile Session</span>
      </button>
    </div>
  );
}
