import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, Lock, User, Phone, Eye, EyeOff, AlertCircle, Sparkles, CheckCircle2, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
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
    <div 
      className="min-h-screen flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden select-none"
      style={{
        background: 'radial-gradient(circle at 10% 20%, rgba(254, 243, 199, 0.3) 0%, rgba(255, 255, 255, 1) 90%), radial-gradient(circle at 90% 80%, rgba(255, 237, 213, 0.3) 0%, rgba(255, 255, 255, 1) 90%)'
      }}
    >
      {/* Soft Glowing Premium Atmosphere Orbs */}
      <div className="absolute top-[10%] left-[10%] w-48 h-48 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[20%] right-[5%] w-72 h-72 rounded-full bg-orange-500/5 blur-3xl pointer-events-none" />

      {/* Top Branding */}
      <div className="pt-6 text-center space-y-3 z-10">
        <div className="w-16 h-16 mx-auto flex items-center justify-center filter drop-shadow-[0_2px_8px_rgba(224,123,42,0.1)]">
          <TSLLogo className="w-16 h-16" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-widest">THE SHINE LOUNGE</h1>
        </div>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-md mx-auto my-6 z-10">
        <div className="bg-white/70 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-white/40 shadow-2xl space-y-6 text-slate-900">
          
          {/* Tab Switcher */}
          <div className="flex bg-slate-200/50 backdrop-blur-xs p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => { setIsSignUp(false); setError(''); setSuccessMsg(''); navigate('/login'); }}
              className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all ${
                !isSignUp ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsSignUp(true); setError(''); setSuccessMsg(''); navigate('/signup'); }}
              className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all ${
                isSignUp ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form Header */}
          <div className="text-center space-y-1">
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
              {!isSignUp ? 'Welcome Back!' : 'Create Account'}
            </h2>
            <p className="text-xs text-slate-400">
              {!isSignUp ? 'Sign in to continue' : 'Sign up to get started'}
            </p>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="flex items-center gap-2 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600 animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ── SIGN IN FORM ──────────────────────────────── */}
          {!isSignUp ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white/50 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">Password</label>
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); alert('Please contact support or admin to reset password.'); }} 
                    className="text-xs font-extrabold text-orange-600 hover:text-orange-700 hover:underline transition-colors"
                  >
                    Forgot Password?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-11 pr-11 py-3 rounded-xl border border-slate-200 bg-white/50 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-white font-black text-xs shadow-md active:scale-[0.98] transition-all bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 flex items-center justify-center gap-1.5 mt-6"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* OR CONTINUE WITH Divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest select-none">OR CONTINUE WITH</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Social login buttons */}
              <div className="flex justify-center gap-4">
                <button type="button" onClick={() => alert('Social authentication is in development.')} className="w-12 h-12 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                </button>
                <button type="button" onClick={() => alert('Social authentication is in development.')} className="w-12 h-12 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors">
                  <svg className="w-5 h-5 fill-slate-700" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.2.67-2.92 1.49-.6.69-1.12 1.83-.98 2.94 1.12.09 2.25-.56 2.91-1.37z"/>
                  </svg>
                </button>
              </div>

              {/* Guest access */}
              <div 
                onClick={() => navigate('/')} 
                className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer mt-4 select-none"
              >
                <UserCheck className="w-4 h-4 text-orange-500" />
                <span>Continue as Guest</span>
              </div>
            </form>
          ) : (
            /* ── SIGN UP FORM ──────────────────────────────── */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    required
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white/50 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white/50 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Mobile Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                  <input
                    type="text"
                    value={mobile}
                    onChange={e => setMobile(e.target.value)}
                    placeholder="+91 98000 00000"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white/50 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min 6 chars"
                      required
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white/50 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Confirm Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      required
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white/50 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-white font-black text-xs shadow-md active:scale-[0.98] transition-all bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 flex items-center justify-center gap-1.5 mt-6"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating Account...
                  </span>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500 font-semibold">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setIsSignUp(false); setError(''); navigate('/login'); }}
                    className="text-orange-600 font-extrabold hover:text-orange-700 transition-colors"
                  >
                    Sign In Here
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Badge Capsule */}
        <div className="max-w-xs mx-auto bg-orange-50 border border-orange-100 rounded-full px-4 py-2 flex items-center justify-center gap-2 text-[10px] text-orange-700 font-extrabold shadow-sm mt-6 animate-pulse select-none">
          <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
          <span>Your Car Deserves The Best ✨</span>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-[10px] text-slate-400 font-bold pb-4 z-10 select-none">
        &copy; {new Date().getFullYear()} The Shine Lounge • Multi-Service Booking Platform
      </div>
    </div>
  );
}
