import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Shield, 
  Clipboard, 
  Car, 
  Users, 
  Calendar, 
  ChevronRight, 
  User, 
  ArrowRight 
} from 'lucide-react';
import TSLLogo from '../../common/components/TSLLogo';
import { useAuth } from '../../common/context/AuthContext';

const shimmerStyle = `
@keyframes shimmer {
  0% { transform: translate3d(-100%, 0, 0) skewX(-20deg); }
  100% { transform: translate3d(200%, 0, 0) skewX(-20deg); }
}
.animate-shimmer {
  animation: shimmer 3s infinite ease-in-out;
}
`;

export default function StaffLoginPage() {
  const navigate = useNavigate();
  const { login, logout } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

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
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center py-8 relative overflow-hidden select-none"
    >
      <style>{shimmerStyle}</style>

      {/* Background Soft Atmosphere Gradients */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-gradient-to-br from-orange-500/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-gradient-to-tr from-blue-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* Main Vertically Centered Mobile Screen Container */}
      <div className="w-full max-w-md flex flex-col gap-6 px-4 z-10">
        
        {/* 1. HERO SECTION */}
        <HeroSection />

        {/* 2. LOGIN CARD */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6, type: 'spring', stiffness: 100 }}
          className="bg-white rounded-[32px] border border-slate-100 shadow-[0_25px_60px_rgba(0,0,0,0.08)] p-6 sm:p-8 space-y-6 relative"
        >
          {/* Avatar Badge floating at top center */}
          <div className="flex justify-center -mt-12 sm:-mt-14 mb-2">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-[#FF8A00] to-[#FF5A1F] p-0.5 shadow-lg flex items-center justify-center relative">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-orange-500">
                <User className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white shadow-sm">
                <Shield className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          <div className="text-center space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">WELCOME BACK!</h2>
            <p className="text-xs font-semibold text-[#6B7280]">Sign in to continue to Staff Workspace</p>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="flex items-center gap-2 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600 animate-pulse">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Main Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-[18px] border border-slate-200 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:bg-white transition-all bg-slate-50/30"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Password</label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-11 py-3 rounded-[18px] border border-slate-200 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:bg-white transition-all bg-slate-50/30"
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

            {/* Remember me check */}
            <div className="flex items-center gap-2 pt-1 select-none">
              <input
                id="remember_me"
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4.5 h-4.5 text-orange-500 border-slate-300 rounded focus:ring-orange-500"
              />
              <label htmlFor="remember_me" className="text-xs text-slate-600 font-bold cursor-pointer">
                Remember Me
              </label>
            </div>

            {/* Login Button with gradient height 58px */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[58px] rounded-[18px] text-white font-black text-xs shadow-md hover:shadow-lg active:scale-[0.98] transition-all bg-gradient-to-r from-[#FF8A00] to-[#FF5A1F] hover:brightness-110 flex items-center justify-center gap-2 mt-4 relative overflow-hidden group"
            >
              {/* Shimmer effect inside button */}
              <div className="absolute inset-0 w-1/2 h-full bg-white/10 skew-x-[-20deg] -translate-x-full group-hover:animate-shimmer pointer-events-none" />

              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <>
                  <span>Sign In to Workspace</span>
                  <ArrowRight className="w-4.5 h-4.5" />
                </>
              )}
            </button>
          </form>


        </motion.div>

        {/* 3. FEATURES LIST */}
        <FeatureSection />

        {/* 4. SECURITY FOOTER */}
        <SecurityFooter />

      </div>
    </motion.div>
  );
}

// Subcomponents
function HeroSection() {
  return (
    <div className="relative w-full h-[240px] sm:h-[280px] flex overflow-hidden rounded-[32px] bg-white border border-slate-100 shadow-xs z-10">
      {/* Left side text container */}
      <div className="relative z-10 flex flex-col justify-center pl-6 sm:pl-8 py-4 w-[60%] sm:w-[55%] bg-white select-none">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-12 h-12 mb-2 drop-shadow-[0_2px_4px_rgba(249,115,22,0.1)]"
        >
          <TSLLogo className="w-12 h-12" />
        </motion.div>
        
        <h1 className="text-base sm:text-lg font-black tracking-widest text-[#102A43]">
          THE SHINE LOUNGE
        </h1>

        <div className="mt-1 flex">
          <span className="inline-flex items-center gap-1 bg-white border border-orange-200 text-[10px] sm:text-[11px] font-black text-orange-600 px-2.5 py-0.5 rounded-full shadow-[0_1px_3px_rgba(249,115,22,0.06)] uppercase tracking-wider">
            <Shield className="w-3 h-3 text-orange-500" /> STAFF PORTAL
          </span>
        </div>

        <p className="mt-2.5 text-[11px] sm:text-xs font-semibold text-slate-500 max-w-[150px] leading-tight">
          Manage Services. Serve Better.
        </p>
        <div className="w-8 h-0.5 bg-[#F97316] mt-1.5 rounded-full" />
      </div>

      {/* Right side Image with smooth fade mask */}
      <div className="absolute right-0 top-0 bottom-0 w-[45%] sm:w-[48%] h-full bg-white">
        <motion.div 
          initial={{ scale: 1.06, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="w-full h-full relative"
        >
          <img 
            src="/src/assets/images/staff_hero.png" 
            alt="Luxury Detailing Garage" 
            className="w-full h-full object-cover"
          />
          {/* Mask linear gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/10 to-transparent pointer-events-none" />
        </motion.div>
      </div>
    </div>
  );
}

function MicrosoftLogin() {
  return (
    <div className="space-y-3">
      <button 
        type="button" 
        onClick={() => alert('Microsoft integration is in development.')}
        className="w-full h-[52px] rounded-[18px] border border-slate-200 hover:bg-slate-50 active:scale-[0.98] transition-all flex items-center justify-center font-bold text-xs text-slate-700 bg-white shadow-xs select-none"
      >
        <svg className="w-4 h-4 mr-2.5" viewBox="0 0 23 23" fill="none">
          <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
          <rect x="12" y="1" width="10" height="10" fill="#7FBA00"/>
          <rect x="1" y="12" width="10" height="10" fill="#00A4EF"/>
          <rect x="12" y="12" width="10" height="10" fill="#FFB900"/>
        </svg>
        <span>Continue with Microsoft</span>
      </button>

      <div className="text-center">
        <button 
          type="button" 
          onClick={() => alert('Google integration is in development.')}
          className="text-[11px] font-bold text-slate-500 hover:text-slate-800 hover:underline transition-colors"
        >
          Or continue with Google Account
        </button>
      </div>
    </div>
  );
}

function FeatureSection() {
  const items = [
    {
      icon: <Calendar className="w-5 h-5" />,
      title: "Manage Bookings",
      desc: "Keep track of active reservations and service schedules."
    },
    {
      icon: <Car className="w-5 h-5" />,
      title: "Track Services",
      desc: "Monitor vehicle status, wash completion progress, and detailing logs."
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: "Coordinate Staff",
      desc: "View roster shifts, attendance logs, and task allocations."
    }
  ];

  return (
    <div className="rounded-[24px] bg-slate-100/50 p-4 sm:p-5 border border-slate-200/50 space-y-4 z-10 w-[92%] mx-auto">
      {items.map((item, idx) => (
        <motion.div 
          key={idx}
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className="flex gap-3.5 items-start p-1 cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 flex-shrink-0">
            {item.icon}
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#102A43]">{item.title}</h4>
            <p className="text-[11px] font-medium text-[#6B7280] leading-snug mt-0.5">{item.desc}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function SecurityFooter() {
  return (
    <div className="py-2 text-center z-10 flex flex-col items-center gap-1.5 select-none pb-6">
      <div className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200/60 rounded-full px-3.5 py-1 text-[10px] text-slate-600 font-extrabold shadow-2xs">
        <Shield className="w-3.5 h-3.5 text-emerald-500" />
        <span>Secured & Protected Workspace</span>
      </div>
      <p className="text-[10px] text-slate-400 font-medium leading-relaxed max-w-[280px]">
        Session protected with auto-timeout • Role-based authentication • Encrypted staff access
      </p>
    </div>
  );
}
