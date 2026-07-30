import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, Lock, User, Phone, Eye, EyeOff, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import TSLLogo from '../common/components/TSLLogo';
import { useAuth } from '../common/context/AuthContext';

export default function CustomerAuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, logout, isAuthenticated, user } = useAuth();

  // Determine initial mode from route: /signup vs /login
  const isSignUpInitial = location.pathname === '/signup' || location.search.includes('mode=signup');
  const [isSignUp, setIsSignUp] = useState(isSignUpInitial);

  // Sync mode if pathname changes
  useEffect(() => {
    setIsSignUp(location.pathname === '/signup' || location.search.includes('mode=signup'));
  }, [location.pathname, location.search]);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // If already authenticated as user, redirect to profile
  useEffect(() => {
    if (isAuthenticated && user?.role === 'user') {
      navigate('/profile');
    }
  }, [isAuthenticated, user, navigate]);

  // Handle Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const data = await login(email, password);

      if (data.success) {
        const role = data.user?.role;
        if (role === 'user') {
          navigate('/profile');
        } else {
          // Staff or Admin trying to log in via Customer Login
          await logout();
          setError('Access Denied: This login page is reserved for Customer accounts. Staff and Admins please use your respective login portals.');
        }
      } else {
        setError(data.message || 'Invalid email or password');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Register (Sign Up)
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const data = await register({
        fullName,
        email,
        password,
        mobile
      });

      if (data.success) {
        setSuccessMsg('Account created successfully! Redirecting...');
        setTimeout(() => {
          navigate('/profile');
        }, 1000);
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please check your details.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6">
      {/* Top Branding */}
      <div className="pt-6 text-center space-y-2">
        <div className="w-16 h-16 mx-auto flex items-center justify-center">
          <TSLLogo className="w-16 h-16" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-wider">THE SHINE LOUNGE</h1>
        </div>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-md mx-auto my-6">
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-xl space-y-5">
          {/* Tab Switcher */}
          <div className="flex bg-gray-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => { setIsSignUp(false); setError(''); setSuccessMsg(''); navigate('/login'); }}
              className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all ${
                !isSignUp ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsSignUp(true); setError(''); setSuccessMsg(''); navigate('/signup'); }}
              className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all ${
                isSignUp ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ── SIGN IN FORM ──────────────────────────────── */}
          {!isSignUp ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-300 text-xs font-bold bg-gray-50 text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
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
                    Signing in...
                  </span>
                ) : (
                  'Sign In to Customer Workspace'
                )}
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-gray-500 font-semibold">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setIsSignUp(true); setError(''); navigate('/signup'); }}
                    className="text-amber-600 font-extrabold hover:underline"
                  >
                    Sign Up Free
                  </button>
                </p>
              </div>
            </form>
          ) : (
            /* ── SIGN UP FORM ──────────────────────────────── */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    required
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-300 text-xs font-bold bg-gray-50 text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-300 text-xs font-bold bg-gray-50 text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Mobile Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={mobile}
                    onChange={e => setMobile(e.target.value)}
                    placeholder="+91 98000 00000"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-300 text-xs font-bold bg-gray-50 text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min 6 chars"
                      required
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-300 text-xs font-bold bg-gray-50 text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Confirm Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      required
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-300 text-xs font-bold bg-gray-50 text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
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
                    Creating Account...
                  </span>
                ) : (
                  'Create Customer Account'
                )}
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-gray-500 font-semibold">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setIsSignUp(false); setError(''); navigate('/login'); }}
                    className="text-amber-600 font-extrabold hover:underline"
                  >
                    Sign In Here
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-[10px] text-gray-400 font-semibold pb-4">
        &copy; {new Date().getFullYear()} The Shine Lounge • Multi-Service Booking Platform
      </div>
    </div>
  );
}
