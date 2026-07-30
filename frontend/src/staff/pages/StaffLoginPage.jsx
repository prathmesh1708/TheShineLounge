import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ShieldCheck, Eye, EyeOff, AlertCircle } from 'lucide-react';
import TSLLogo from '../../common/components/TSLLogo';
import { useAuth } from '../../common/context/AuthContext';

export default function StaffLoginPage() {
  const navigate = useNavigate();
  const { login, logout } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(email, password);

      if (data.success) {
        const role = data.user?.role;
        if (role === 'staff') {
          navigate('/staff/dashboard');
        } else {
          // Non-staff account trying to log in via Staff Portal
          await logout();
          setError('Access Denied: This login page is reserved for Staff accounts only.');
        }
      } else {
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between p-6">
      {/* Top Branding */}
      <div className="pt-8 text-center space-y-3">
        <div className="w-20 h-20 mx-auto flex items-center justify-center">
          <TSLLogo className="w-20 h-20" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-wider">THE SHINE LOUNGE</h1>
          <p className="text-xs font-bold text-blue-900 tracking-widest uppercase flex items-center justify-center gap-1 mt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500" /> Staff Portal
          </p>
        </div>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4 my-6 bg-gray-50 p-5 rounded-3xl border border-gray-100 shadow-sm">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="staff@example.com"
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
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-gray-300 text-xs font-bold bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl text-white font-extrabold text-xs shadow-md active:scale-95 transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#e07b2a' }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Signing in...
            </span>
          ) : (
            'Sign In to Staff Workspace'
          )}
        </button>
      </form>

      {/* Footer Info */}
      <div className="text-center text-[10px] text-gray-400 font-semibold pb-4">
        Session protected with Auto-Timeout • Contact Admin for credentials
      </div>
    </div>
  );
}
