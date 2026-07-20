import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Fingerprint, Lock, UserCheck, ShieldCheck } from 'lucide-react';
import { useStaff } from '../common/context/StaffContext';
import { mockStaffMembers } from '../common/data/staffMockData';

export default function StaffLoginPage() {
  const navigate = useNavigate();
  const { loginStaff } = useStaff();

  const [employeeId, setEmployeeId] = useState('STF-03');
  const [password, setPassword] = useState('password123');
  const [selectedRole, setSelectedRole] = useState('Car Wash Lead');

  const handleSubmit = (e) => {
    e.preventDefault();
    loginStaff(employeeId, password);
    navigate('/staff/dashboard');
  };

  const handleBiometricLogin = () => {
    loginStaff('STF-03', 'password123');
    navigate('/staff/dashboard');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between p-6">
      {/* Top Branding */}
      <div className="pt-8 text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white shadow-xl animate-bounce" style={{ backgroundColor: '#e07b2a' }}>
          <Sparkles className="w-9 h-9" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-wider">THE SHINE LOUNGE</h1>
          <p className="text-xs font-bold text-blue-900 tracking-widest uppercase flex items-center justify-center gap-1 mt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500" /> Ground Staff Mobile Portal
          </p>
        </div>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4 my-6 bg-gray-50 p-5 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Select Employee Account / Role</label>
          <select
            value={employeeId}
            onChange={(e) => {
              setEmployeeId(e.target.value);
              const found = mockStaffMembers.find(s => s.employeeId === e.target.value);
              if (found) setSelectedRole(found.role);
            }}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-xs font-bold bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {mockStaffMembers.map(staff => (
              <option key={staff.employeeId} value={staff.employeeId}>
                {staff.name} — {staff.role} ({staff.department})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Employee ID</label>
          <div className="relative">
            <UserCheck className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              value={employeeId}
              onChange={e => setEmployeeId(e.target.value)}
              placeholder="e.g. STF-03"
              required
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 text-xs font-bold bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 text-xs font-bold bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-xl text-white font-extrabold text-xs shadow-md active:scale-95 transition-transform"
          style={{ backgroundColor: '#e07b2a' }}
        >
          Sign In to Staff Workspace
        </button>

        {/* Biometric Quick Login */}
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={handleBiometricLogin}
            className="w-full py-2.5 rounded-xl border border-blue-900/30 text-blue-900 font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-blue-50"
          >
            <Fingerprint className="w-5 h-5 text-amber-500" />
            <span>Quick FaceID / TouchID Sign In</span>
          </button>
        </div>
      </form>

      {/* Footer Info */}
      <div className="text-center text-[10px] text-gray-400 font-semibold pb-4">
        Session protected with 8-Hour Auto-Timeout • Thane Branch
      </div>
    </div>
  );
}
