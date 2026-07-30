import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, AlertCircle, ShieldCheck } from 'lucide-react';
import TSLLogo from '../../common/components/TSLLogo';
import { useAuth } from '../../common/context/AuthContext';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login, logout } = useAuth();

  const [email, setEmail] = useState('admin@gmail.com');
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
        if (role === 'admin') {
          navigate('/admin');
        } else {
          // Non-admin trying to log in via Admin Portal
          await logout();
          setError('Access Denied: This portal is strictly reserved for Admin accounts.');
        }
      } else {
        setError(data.message || 'Invalid admin credentials');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid admin credentials';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-6">
      {/* Top Branding */}
      <div className="pt-8 text-center space-y-3">
        <div className="w-20 h-20 mx-auto flex items-center justify-center">
          <TSLLogo className="w-20 h-20" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-wider">THE SHINE LOUNGE</h1>
          <p className="text-xs font-bold text-blue-900 tracking-widest uppercase flex items-center justify-center gap-1.5 mt-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-500" /> Admin Executive Console
          </p>
        </div>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md mx-auto my-6">
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-xl">
          <div className="text-center mb-2">
            <h2 className="text-lg font-extrabold text-gray-900">Super Admin Access</h2>
            <p className="text-xs text-gray-500 mt-1">Authorized personnel only</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Admin Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@gmail.com"
                required
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-300 text-xs font-bold bg-gray-50 text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Admin Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-300 text-xs font-bold bg-gray-50 text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-extrabold text-xs shadow-md active:scale-95 transition-transform disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            style={{ backgroundColor: '#e07b2a' }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Authenticating...
              </span>
            ) : (
              'Sign In to Admin Workspace'
            )}
          </button>
        </form>
      </div>

      {/* Footer Info */}
      <div className="text-center text-[10px] text-gray-400 font-semibold pb-4">
        Encrypted Session • Multi-Factor Secured Admin Gateway
      </div>
    </div>
  );
}
