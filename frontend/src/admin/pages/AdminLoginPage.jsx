import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  Shield,
  ArrowRight,
  BarChart3,
  Users,
  Settings,
  Car,
  Stethoscope,
  FlaskConical,
  Monitor,
  ShieldPlus,
  Pill,
  Loader2,
} from 'lucide-react';
import TSLLogo from '../../common/components/TSLLogo';
import { useAuth } from '../../common/context/AuthContext';

/* ─────────────────────────────────────────────
   MAIN PAGE
   ───────────────────────────────────────────── */
export default function AdminLoginPage() {
  return (
    <div className="relative min-h-screen overflow-y-auto font-[Inter,ui-sans-serif,system-ui,sans-serif]" style={{ backgroundColor: '#F8FAFC' }}>
      <BackgroundEffects />

      <div className="relative z-10 min-h-screen flex flex-col justify-between">
        {/* Main content */}
        <div className="flex-1 flex items-center justify-center px-4 py-8 md:py-12 lg:py-16">
          <div className="w-full max-w-[1300px] mx-auto flex flex-col lg:flex-row items-stretch gap-8 lg:gap-0 lg:min-h-[640px]">
            {/* Left Panel – Brand (hidden on mobile/tablet) */}
            <div className="hidden lg:flex lg:w-[42%]">
              <BrandPanel />
            </div>

            {/* Right Panel – Login */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 lg:px-12">
              {/* Mobile logo (shown only on small screens) */}
              <MobileBranding />
              <AdminLoginCard />
              <SecurityBar />
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   BACKGROUND EFFECTS
   ───────────────────────────────────────────── */
function BackgroundEffects() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Top-right orange glow */}
      <div
        className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)',
        }}
      />
      {/* Bottom-left blue glow */}
      <div
        className="absolute -bottom-32 -left-32 w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(30,74,126,0.08) 0%, transparent 70%)',
        }}
      />
      {/* Faint dotted pattern – top-right corner */}
      <svg className="absolute top-0 right-0 w-48 h-48 opacity-[0.04]" viewBox="0 0 200 200">
        <pattern id="dots-tr" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.5" fill="#94a3b8" />
        </pattern>
        <rect width="200" height="200" fill="url(#dots-tr)" />
      </svg>
      {/* Faint dotted pattern – bottom-left corner */}
      <svg className="absolute bottom-0 left-0 w-48 h-48 opacity-[0.04]" viewBox="0 0 200 200">
        <pattern id="dots-bl" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.5" fill="#94a3b8" />
        </pattern>
        <rect width="200" height="200" fill="url(#dots-bl)" />
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────
   BRAND PANEL (LEFT)
   ───────────────────────────────────────────── */
function BrandPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="w-full h-full rounded-[32px] flex flex-col justify-between p-6 xl:p-8 relative overflow-hidden select-none"
      style={{
        background: 'linear-gradient(180deg, #071827 0%, #102A43 100%)',
      }}
    >
      {/* Subtle light orbs */}
      <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.5) 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full opacity-[0.06]" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.6) 0%, transparent 70%)' }} />

      {/* Top – Logo & Badge */}
      <div className="relative z-10">
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
            <TSLLogo className="w-8 h-8 object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white tracking-widest uppercase">THE SHINE LOUNGE</h1>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-orange-500/40 bg-orange-500/10 mb-6">
          <Shield className="w-3 h-3 text-orange-400" />
          <span className="text-[10px] font-bold text-orange-300 tracking-wider uppercase">Admin Executive Console</span>
        </div>

        {/* Headline */}
        <div className="mb-2">
          <h2 className="text-2xl xl:text-3xl font-extrabold text-white leading-tight">
            Powerful.<br />
            Secure.<br />
            Reliable.
          </h2>
          <div className="w-12 h-1 rounded-full bg-gradient-to-r from-orange-500 to-orange-400 mt-3 mb-2.5" />
          <p className="text-[13px] text-slate-400 font-medium leading-relaxed max-w-[280px]">
            Everything under your control. One unified platform to manage your entire business ecosystem.
          </p>
        </div>
      </div>

      {/* Middle – Floating service cards illustration */}
      <div className="relative z-10 flex-1 flex items-center justify-center py-2">
        <EcosystemIllustration />
      </div>

      {/* Bottom – Feature Grid */}
      <div className="relative z-10">
        <FeatureGrid />
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   ECOSYSTEM ILLUSTRATION (Floating Cards)
   ───────────────────────────────────────────── */
const serviceCards = [
  { icon: Car, label: 'Car Wash', x: -100, y: -70, delay: 0 },
  { icon: Pill, label: 'Pharmacy', x: 80, y: -80, delay: 0.1 },
  { icon: FlaskConical, label: 'Laboratories', x: -110, y: 15, delay: 0.2 },
  { icon: Stethoscope, label: 'Doctors', x: 100, y: 5, delay: 0.15 },
  { icon: Monitor, label: 'Digital Services', x: -50, y: 80, delay: 0.25 },
  { icon: ShieldPlus, label: 'Insurance', x: 70, y: 80, delay: 0.3 },
];

function EcosystemIllustration() {
  // Hexagonal arrangement: 6 cards evenly spaced in a circle
  const cx = 160, cy = 120, radius = 95;
  const positioned = serviceCards.map((card, i) => {
    const angle = (i * 60 - 90) * (Math.PI / 180); // start from top
    return {
      ...card,
      px: cx + radius * Math.cos(angle),
      py: cy + radius * Math.sin(angle),
    };
  });

  return (
    <div className="relative w-[320px] h-[240px]">
      {/* Central hub glow */}
      <div className="absolute rounded-full bg-orange-500/20 blur-xl" style={{ width: 64, height: 64, left: cx - 32, top: cy - 32 }} />
      <div
        className="absolute rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/30 flex items-center justify-center"
        style={{ width: 32, height: 32, left: cx - 16, top: cy - 16 }}
      >
        <Settings className="w-4 h-4 text-white animate-[spin_8s_linear_infinite]" />
      </div>

      {/* Connecting lines (SVG) */}
      <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 320 240`}>
        {positioned.map((card, i) => (
          <motion.line
            key={i}
            x1={cx} y1={cy}
            x2={card.px} y2={card.py}
            stroke="url(#line-grad)"
            strokeWidth="1"
            strokeDasharray="4 4"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.4 }}
            transition={{ delay: 0.5 + card.delay, duration: 0.8 }}
          />
        ))}
        <defs>
          <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F97316" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#F97316" stopOpacity="0.1" />
          </linearGradient>
        </defs>
      </svg>

      {/* Service cards */}
      {positioned.map((card, i) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={i}
            className="absolute flex flex-col items-center gap-1"
            style={{ left: card.px - 24, top: card.py - 28 }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: [0, -4, 0],
            }}
            transition={{
              opacity: { delay: 0.6 + card.delay, duration: 0.5 },
              scale: { delay: 0.6 + card.delay, duration: 0.5, ease: 'backOut' },
              y: { delay: 1.2 + card.delay, duration: 3 + i * 0.4, repeat: Infinity, ease: 'easeInOut' },
            }}
          >
            <div className="w-11 h-11 rounded-xl bg-white/[0.07] backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg shadow-black/20 hover:bg-white/[0.14] transition-colors">
              <Icon className="w-[18px] h-[18px] text-orange-400" />
            </div>
            <span className="text-[8px] font-bold text-slate-400 whitespace-nowrap">{card.label}</span>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────
   FEATURE GRID (Bottom of left panel)
   ───────────────────────────────────────────── */
const features = [
  { icon: Shield, title: 'Secure Access', desc: 'Multi-layer Authentication' },
  { icon: Users, title: 'Role Management', desc: 'Permission Based Access' },
  { icon: BarChart3, title: 'Real-time Analytics', desc: 'Monitor Business Performance' },
  { icon: Settings, title: 'System Control', desc: 'Manage All Six Services' },
];

function FeatureGrid() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {features.map((f, i) => {
        const Icon = f.icon;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 + i * 0.1, duration: 0.5 }}
            whileHover={{ y: -3, backgroundColor: 'rgba(255,255,255,0.08)' }}
            className="rounded-2xl p-3.5 border border-white/[0.06] bg-white/[0.04] backdrop-blur-sm transition-all duration-300 cursor-default"
          >
            <Icon className="w-4 h-4 text-orange-400 mb-2" />
            <p className="text-[11px] font-bold text-white leading-tight">{f.title}</p>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">{f.desc}</p>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MOBILE BRANDING (shown on sm/md screens)
   ───────────────────────────────────────────── */
function MobileBranding() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="lg:hidden text-center mb-8"
    >
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#071827] to-[#102A43] flex items-center justify-center shadow-xl">
        <TSLLogo className="w-10 h-10 object-contain" />
      </div>
      <h1 className="text-lg font-extrabold tracking-widest uppercase" style={{ color: '#102A43' }}>
        THE SHINE LOUNGE
      </h1>
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-orange-200 bg-orange-50 mt-3">
        <Shield className="w-3 h-3 text-orange-500" />
        <span className="text-[10px] font-bold text-orange-600 tracking-wider uppercase">Admin Executive Console</span>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   ADMIN LOGIN CARD (RIGHT)
   ───────────────────────────────────────────── */
function AdminLoginCard() {
  const navigate = useNavigate();
  const { login, logout } = useAuth();

  const [email, setEmail] = useState('admin@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-[520px]"
    >
      <div
        className="bg-white rounded-[32px] p-8 sm:p-10"
        style={{ boxShadow: '0 30px 70px rgba(15,23,42,0.10)' }}
      >
        {/* Floating shield icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20"
            style={{ background: 'linear-gradient(135deg, #FF8A00 0%, #F97316 100%)' }}
          >
            <div className="relative">
              <Shield className="w-7 h-7 text-white" />
              <Lock className="w-3 h-3 text-white absolute -bottom-0.5 -right-0.5" />
            </div>
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-[28px] font-extrabold leading-tight" style={{ color: '#102A43' }}>
            Welcome Back, Admin
          </h2>
          <p className="text-sm text-gray-500 font-medium mt-2">
            Sign in to access the Executive Dashboard
          </p>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="flex items-center gap-2.5 p-4 bg-red-50 border border-red-200 rounded-2xl">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span className="text-xs font-bold text-red-600">{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2 tracking-wide uppercase">Admin Email</label>
            <div className="relative group">
              <Mail className="w-[18px] h-[18px] text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-orange-500" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@gmail.com"
                required
                className="w-full pl-12 pr-4 py-4 rounded-[18px] border border-gray-200 text-[15px] font-semibold text-gray-900 placeholder-gray-400 bg-gray-50/50 transition-all duration-300 outline-none focus:border-orange-400 focus:ring-[3px] focus:ring-orange-500/10 focus:bg-white"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2 tracking-wide uppercase">Admin Password</label>
            <div className="relative group">
              <Lock className="w-[18px] h-[18px] text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-orange-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full pl-12 pr-12 py-4 rounded-[18px] border border-gray-200 text-[15px] font-semibold text-gray-900 placeholder-gray-400 bg-gray-50/50 transition-all duration-300 outline-none focus:border-orange-400 focus:ring-[3px] focus:ring-orange-500/10 focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
              </button>
            </div>
          </div>

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500/20 accent-orange-500 cursor-pointer"
              />
              <span className="text-xs font-semibold text-gray-500">Remember me</span>
            </label>
            <button
              type="button"
              className="text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors"
            >
              Forgot Password?
            </button>
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ y: -2, boxShadow: '0 16px 40px rgba(249,115,22,0.30)' }}
            whileTap={{ scale: 0.98 }}
            className="relative w-full h-[58px] rounded-[18px] text-white font-bold text-[15px] tracking-wide shadow-lg shadow-orange-500/20 disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden transition-all duration-300"
            style={{ background: 'linear-gradient(135deg, #FF8A00 0%, #F97316 100%)' }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 overflow-hidden rounded-[18px]">
              <div
                className="absolute inset-0 -translate-x-full"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
                  animation: loading ? 'none' : 'shimmer 3s ease-in-out infinite',
                }}
              />
            </div>

            <span className="relative z-10 flex items-center justify-center gap-2.5">
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Admin Workspace</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </span>
          </motion.button>
        </form>


      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   SECURITY BAR
   ───────────────────────────────────────────── */
const securityBadges = [
  { icon: Lock, label: 'Encrypted Session' },
  { icon: ShieldCheck, label: 'Multi-Factor Authentication' },
  { icon: ArrowRight, label: 'Secured Admin Gateway', useZap: true },
];

function SecurityBar() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.5 }}
      className="flex flex-wrap items-center justify-center gap-3 mt-8"
    >
      {securityBadges.map((b, i) => {
        const Icon = b.icon;
        return (
          <div
            key={i}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100/80 border border-gray-200/50"
          >
            {b.useZap ? (
              <svg className="w-3 h-3 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            ) : (
              <Icon className="w-3 h-3 text-gray-500" />
            )}
            <span className="text-[10px] font-bold text-gray-500">{b.label}</span>
          </div>
        );
      })}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   FOOTER
   ───────────────────────────────────────────── */
function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1, duration: 0.5 }}
      className="py-6 text-center"
    >
      <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-gray-400 font-medium">
        <span>&copy; {new Date().getFullYear()} The Shine Lounge. All Rights Reserved.</span>
        <span className="hidden sm:inline text-gray-300">|</span>
        <button className="hover:text-gray-600 transition-colors">Privacy Policy</button>
        <span className="text-gray-300">·</span>
        <button className="hover:text-gray-600 transition-colors">Terms of Service</button>
        <span className="hidden sm:inline text-gray-300">|</span>
        <span className="text-gray-300">v2.0.1</span>
      </div>
    </motion.footer>
  );
}
